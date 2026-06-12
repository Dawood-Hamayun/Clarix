import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { NextResponse } from "next/server";
import {
  getChatModel,
  MissingOpenAIKeyError,
} from "@/lib/ai/client";
import { retrieveContext } from "@/lib/ai/rag";
import { checkChatRateLimit, rateLimitKey } from "@/lib/ai/rate-limit";
import { store } from "@/lib/db/store";
import type { SourceCitation } from "@/lib/db/types";

export interface ChatMessageMetadata {
  eventId?: string;
  sources?: SourceCitation[];
  confidence?: number;
  topScore?: number;
  categoryIds?: string[];
  suggestedCategoryId?: string;
}

export async function POST(req: Request) {
  await store.ready();
  const {
    messages,
    projectId = "proj_demo",
    conversationId,
  }: {
    messages: UIMessage[];
    projectId?: string;
    conversationId?: string;
  } = await req.json();

  // Rate limit before we touch OpenAI. Cheap first line of defense
  // against a bot draining a customer's key through the public widget.
  const limit = checkChatRateLimit(rateLimitKey(req, conversationId));
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: "Too many messages. Please wait a moment and try again.",
        code: "rate_limited",
        retryAfterSeconds: limit.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds),
          "X-RateLimit-Limit": String(limit.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // Extract text from the last user message's parts (AI SDK v6 UIMessage shape)
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");

  const lastUserText =
    lastUserMessage?.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join(" ")
      .trim() ?? "";

  // Resolve the project-scoped OpenAI provider up-front so we can return
  // a clean 400 when the user hasn't added a key yet, instead of 500'ing
  // deep inside retrieveContext or streamText.
  let model;
  try {
    model = getChatModel(projectId);
  } catch (err) {
    if (err instanceof MissingOpenAIKeyError) {
      return NextResponse.json(
        { error: err.message, code: "missing_openai_key" },
        { status: 400 }
      );
    }
    throw err;
  }

  // Get RAG context + confidence. retrieveContext internally uses the
  // same project-scoped key for query embedding.
  const {
    systemPrompt,
    sources,
    confidence,
    topScore,
    categoryIds,
    suggestedCategoryId,
  } = await retrieveContext(lastUserText, projectId);

  // Save user message to conversation if ID provided
  if (conversationId && lastUserText) {
    store.addMessage(conversationId, {
      role: "user",
      content: lastUserText,
    });
  }

  // Record query event so feedback + gap tracking can reference it
  const event = store.recordQueryEvent({
    projectId,
    conversationId,
    query: lastUserText,
    confidence,
    topScore,
    sourceCount: sources.length,
    sourceIds: sources.map((s) => s.sourceId),
    categoryIds,
  });

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model,
    system: systemPrompt,
    messages: modelMessages,
    onFinish: async ({ text, usage }) => {
      if (conversationId) {
        store.addMessage(conversationId, {
          role: "assistant",
          content: text,
          sources,
        });
      }
      // Record token usage on the query event so the Settings page
      // can show rolling spend. AI SDK v6 exposes `usage` on the
      // finish callback with per-turn prompt + completion token
      // counts. We tolerate undefined (some providers omit it).
      const promptTokens = usage?.inputTokens ?? 0;
      const completionTokens = usage?.outputTokens ?? 0;
      if (promptTokens || completionTokens) {
        store.updateQueryEvent(event.id, {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        });
      }
    },
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: ({ part }): ChatMessageMetadata | undefined => {
      if (part.type === "start") {
        return {
          eventId: event.id,
          sources,
          confidence,
          topScore,
          categoryIds,
          suggestedCategoryId,
        };
      }
      return undefined;
    },
  });
}
