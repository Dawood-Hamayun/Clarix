import { NextResponse } from "next/server";
import { generateText } from "ai";
import { getOpenAIProvider, MissingOpenAIKeyError } from "@/lib/ai/client";
import { store } from "@/lib/db/store";

/**
 * Generates 3 realistic first-turn questions a customer might ask, grounded
 * in the actual KB content. Falls back to generic prompts when the KB is
 * empty or the project has no OpenAI key configured.
 *
 * The old static suggestions ("Tell me about the knowledge base",
 * "How does this work?") made the agent look bad because they're meta
 * questions the KB can't answer. This endpoint instead seeds questions
 * from the source names + category names + a few content excerpts so the
 * starter prompts lean on topics the agent can actually cover.
 */
export async function POST(req: Request) {
  await store.ready();
  const { projectId = "proj_demo" }: { projectId?: string } = await req
    .json()
    .catch(() => ({}));

  const project = store.getProject(projectId);
  const companyName = project?.widgetConfig.companyName || "the company";
  const readySources = store
    .getSources(projectId)
    .filter((s) => s.status === "ready");

  if (readySources.length === 0) {
    return NextResponse.json({
      suggestions: [
        `What does ${companyName} do?`,
        "How can I get in touch?",
        "What are your hours?",
      ],
    });
  }

  // Summarize the KB for the model without blowing the context window.
  // Source titles + categories first (high signal), then a short snippet
  // from the first chunk of each for flavor.
  const categories = store.getCategories(projectId);
  const catById = new Map(categories.map((c) => [c.id, c]));

  const sourceSummaries = readySources.slice(0, 20).map((s) => {
    const firstChunkId = s.chunks[0];
    const excerpt = firstChunkId
      ? store.getChunk(firstChunkId)?.content.slice(0, 180) ?? ""
      : "";
    const category = s.categoryId ? catById.get(s.categoryId)?.name : undefined;
    return `- ${s.name}${category ? ` (${category})` : ""}${
      excerpt ? `: ${excerpt.replace(/\s+/g, " ")}…` : ""
    }`;
  });

  const kbSummary = sourceSummaries.join("\n");

  let openai;
  try {
    openai = getOpenAIProvider(projectId);
  } catch (err) {
    if (err instanceof MissingOpenAIKeyError) {
      // No key configured — fall back to title-based suggestions derived
      // directly from the source names so users still see something useful.
      return NextResponse.json({
        suggestions: fallbackFromSources(readySources.map((s) => s.name)),
      });
    }
    throw err;
  }

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      temperature: 0.7,
      system: `You write 3 realistic opening questions a real customer might ask ${companyName}'s support chat. You can see a summary of what the support agent has knowledge about. Your job is to suggest questions the agent can confidently answer from that knowledge.

Rules:
- Each question must be under 10 words.
- Sound like a real customer — curious, specific, natural. Never meta.
- NEVER ask about "the knowledge base", "the chatbot", "how this works", or "what can you help me with".
- Lean on the actual topics in the KB summary — products, prices, policies, etc.
- Vary angles across the 3: e.g. one about a product, one about pricing/policy, one about getting help.
- Return ONLY a JSON array of exactly 3 strings. No prose, no keys. Example: ["...", "...", "..."]`,
      prompt: `KB summary:\n${kbSummary}`,
    });

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      return NextResponse.json({
        suggestions: fallbackFromSources(readySources.map((s) => s.name)),
      });
    }

    try {
      const parsed = JSON.parse(match[0]);
      if (!Array.isArray(parsed)) throw new Error("not array");
      const suggestions = parsed
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3);
      if (suggestions.length < 3) {
        return NextResponse.json({
          suggestions: fallbackFromSources(readySources.map((s) => s.name)),
        });
      }
      return NextResponse.json({ suggestions });
    } catch {
      return NextResponse.json({
        suggestions: fallbackFromSources(readySources.map((s) => s.name)),
      });
    }
  } catch (error) {
    console.error("Starter suggestions error:", error);
    return NextResponse.json({
      suggestions: fallbackFromSources(readySources.map((s) => s.name)),
    });
  }
}

/**
 * Cheap, predictable fallback so the chat never shows dumb starter prompts
 * even when OpenAI is unavailable. Strips trailing "Guide"/"FAQ" noise and
 * wraps the title in a natural question template.
 */
function fallbackFromSources(names: string[]): string[] {
  const cleaned = names
    .map((n) => n.replace(/\s*(guide|faq|page|doc|documentation)$/i, "").trim())
    .filter(Boolean);

  const pool = [
    ...cleaned.slice(0, 2).map((n) => `Tell me about ${n}`),
    "What are your pricing options?",
    "How do I get started?",
    "Can I talk to a human?",
  ];

  // De-dupe and take 3
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of pool) {
    if (!seen.has(q)) {
      seen.add(q);
      out.push(q);
      if (out.length === 3) break;
    }
  }
  return out;
}
