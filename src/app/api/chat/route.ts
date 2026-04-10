import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { retrieveContext } from "@/lib/ai/rag";
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
  const {
    messages,
    projectId = "proj_demo",
    conversationId,
  }: {
    messages: UIMessage[];
    projectId?: string;
    conversationId?: string;
  } = await req.json();

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

  // Get RAG context + confidence
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
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: modelMessages,
    onFinish: async ({ text }) => {
      if (conversationId) {
        store.addMessage(conversationId, {
          role: "assistant",
          content: text,
          sources,
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
