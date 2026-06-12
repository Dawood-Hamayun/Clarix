import { generateEmbedding } from "./embeddings";
import { buildSystemPrompt } from "./prompts";
import { store } from "@/lib/db/store";
import { vectorStore } from "@/lib/db/vector-store";
import type { KnowledgeCategory, SourceCitation } from "@/lib/db/types";

/**
 * Lightweight keyword-based query classifier.
 * Returns category ids that look relevant to the query so we can
 * boost their chunks during retrieval ranking.
 */
function classifyQueryCategories(
  query: string,
  categories: KnowledgeCategory[]
): Set<string> {
  const q = query.toLowerCase();
  const hits = new Set<string>();

  const SLUG_KEYWORDS: Record<string, string[]> = {
    pricing: [
      "price",
      "pricing",
      "cost",
      "plan",
      "tier",
      "subscription",
      "billing",
      "discount",
      "upgrade",
      "downgrade",
      "trial",
      "free",
      "pay",
    ],
    faq: ["faq", "question", "common", "ask"],
    "how-to": [
      "how do i",
      "how to",
      "step",
      "setup",
      "set up",
      "install",
      "configure",
      "guide",
      "tutorial",
    ],
    policies: [
      "refund",
      "return",
      "cancel",
      "cancellation",
      "privacy",
      "terms",
      "policy",
      "gdpr",
      "data retention",
    ],
    contact: [
      "contact",
      "email",
      "phone",
      "support",
      "human",
      "agent",
      "reach",
      "talk to",
    ],
    products: [
      "feature",
      "product",
      "service",
      "capability",
      "integration",
      "api",
      "use case",
    ],
    company: [
      "about",
      "company",
      "team",
      "mission",
      "who are you",
      "story",
      "founder",
    ],
  };

  for (const cat of categories) {
    const kws = SLUG_KEYWORDS[cat.slug];
    if (kws && kws.some((kw) => q.includes(kw))) {
      hits.add(cat.id);
      continue;
    }
    if (q.includes(cat.name.toLowerCase())) {
      hits.add(cat.id);
    }
  }

  return hits;
}

/**
 * Compute a 0..1 confidence based on the top retrieval scores.
 * High when multiple chunks hit well. Low when weak/sparse.
 */
function computeConfidence(scores: number[]): number {
  if (scores.length === 0) return 0;
  const top = scores[0];
  const secondary = scores.slice(0, 3).reduce((s, v) => s + v, 0) / 3;
  // Weighted blend: top score matters most, backed by depth
  const raw = top * 0.65 + secondary * 0.35;
  // Scale 0.2..0.8 -> 0..1. Embedding similarity above ~0.5 is already
  // a solid hit, so we don't need to stretch the band all the way to 0.9.
  const scaled = Math.max(0, Math.min(1, (raw - 0.2) / 0.6));
  // Penalty if very few hits
  const depthPenalty = scores.length >= 3 ? 1 : scores.length / 3;
  return Math.round(scaled * depthPenalty * 100) / 100;
}

export interface RetrieveResult {
  systemPrompt: string;
  sources: SourceCitation[];
  confidence: number;
  topScore: number;
  categoryIds: string[];
  /** Suggested category id for follow-up (from intent classification) */
  suggestedCategoryId?: string;
}

export async function retrieveContext(
  query: string,
  projectId: string
): Promise<RetrieveResult> {
  const project = store.getProject(projectId);
  const companyName = project?.widgetConfig.companyName || "the company";
  const agentConfig = project?.agentConfig;
  const categories = store.getCategories(projectId);

  // Generate embedding for the query
  let queryEmbedding: number[];
  try {
    queryEmbedding = await generateEmbedding(query, projectId);
  } catch {
    return {
      systemPrompt: buildSystemPrompt(companyName, [], agentConfig),
      sources: [],
      confidence: 0,
      topScore: 0,
      categoryIds: [],
    };
  }

  // Wider candidate pool so the category boost can re-rank meaningfully.
  // A low threshold is intentional, we'd rather give the model noisy-but-
  // related context than refuse outright. The model is instructed to ignore
  // irrelevant blocks.
  let candidates = await vectorStore.search(
    queryEmbedding,
    projectId,
    20,
    0.15
  );

  // Last-ditch fallback: if the threshold rejected everything but the
  // project *does* have vectors, return the top matches anyway so the
  // agent at least has something to work with instead of hallucinating
  // a "not in my knowledge base" response.
  if (candidates.length === 0) {
    candidates = await vectorStore.search(queryEmbedding, projectId, 5, 0);
  }

  const boostedCategoryIds = classifyQueryCategories(query, categories);
  const suggestedCategoryId = boostedCategoryIds.values().next().value;
  const BOOST = 0.08;

  const ranked = candidates
    .map((r) => {
      const chunk = store.getChunk(r.chunkId);
      const boosted =
        chunk?.categoryId && boostedCategoryIds.has(chunk.categoryId);
      return {
        ...r,
        boosted: Boolean(boosted),
        finalScore: r.score + (boosted ? BOOST : 0),
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 5);

  const contextBlocks: string[] = [];
  const sources: SourceCitation[] = [];
  const usedCategoryIds = new Set<string>();

  ranked.forEach((result, idx) => {
    const chunk = store.getChunk(result.chunkId);
    if (!chunk) return;
    const source = store.getSource(chunk.sourceId);
    if (!source) return;

    const category = chunk.categoryId
      ? store.getCategory(chunk.categoryId)
      : undefined;
    if (category) usedCategoryIds.add(category.id);

    const citationNumber = idx + 1;
    const header = category
      ? `[${citationNumber}] ${source.name} · ${category.name}`
      : `[${citationNumber}] ${source.name}`;

    contextBlocks.push(`${header}\n${chunk.content}`);

    sources.push({
      sourceId: source.id,
      sourceName: source.name,
      chunkId: chunk.id,
      relevanceScore: result.finalScore,
      excerpt: chunk.content.slice(0, 200) + (chunk.content.length > 200 ? "..." : ""),
    });
  });

  const confidence = computeConfidence(ranked.map((r) => r.finalScore));
  const topScore = ranked[0]?.finalScore ?? 0;

  return {
    systemPrompt: buildSystemPrompt(companyName, contextBlocks, agentConfig),
    sources,
    confidence,
    topScore,
    categoryIds: Array.from(usedCategoryIds),
    suggestedCategoryId,
  };
}
