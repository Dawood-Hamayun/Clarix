import { store } from "@/lib/db/store";
import type { KBHealthReport, QueryEvent } from "@/lib/db/types";

/**
 * Dead-simple KB health: count what exists, pick a friendly label.
 * No grades, no weighted formulas. The dashboard just wants to know
 * "do I have enough stuff, and is any of it broken?"
 */
export function computeKBHealth(projectId: string): KBHealthReport {
  const sources = store.getSources(projectId);

  const readySources = sources.filter((s) => s.status === "ready");
  const processingSources = sources.filter((s) => s.status === "processing");
  const errorSources = sources.filter((s) => s.status === "error");

  const wordCount = readySources.reduce(
    (sum, s) => sum + (s.metadata.wordCount || 0),
    0
  );
  const chunkCount = readySources.reduce(
    (sum, s) => sum + (s.metadata.chunkCount || 0),
    0
  );

  // Most recent updatedAt across ready sources
  let lastUpdatedAt: string | null = null;
  for (const s of readySources) {
    if (!lastUpdatedAt || s.metadata.updatedAt > lastUpdatedAt) {
      lastUpdatedAt = s.metadata.updatedAt;
    }
  }

  const readyCount = readySources.length;

  let status: KBHealthReport["status"];
  let message: string;

  if (readyCount === 0) {
    status = "empty";
    message = "Add your first source to teach your agent.";
  } else if (readyCount < 3) {
    status = "starting";
    message = "Good start, add a few more sources for broader coverage.";
  } else if (readyCount < 6) {
    status = "ready";
    message = "Your agent has enough material to answer most questions.";
  } else {
    status = "strong";
    message = "Solid knowledge base. Keep it fresh as things change.";
  }

  if (errorSources.length > 0) {
    message = `${errorSources.length} source${
      errorSources.length === 1 ? "" : "s"
    } failed to process, retry or replace them.`;
  } else if (processingSources.length > 0) {
    message = `${processingSources.length} source${
      processingSources.length === 1 ? "" : "s"
    } still processing…`;
  }

  return {
    sourceCount: sources.length,
    readyCount,
    processingCount: processingSources.length,
    errorCount: errorSources.length,
    wordCount,
    chunkCount,
    lastUpdatedAt,
    status,
    message,
  };
}

/**
 * Group recent low-confidence / negative-feedback queries into a gap list.
 * Queries that differ only by whitespace/case are merged.
 */
export function computeGaps(
  projectId: string,
  opts: { confidenceThreshold?: number; limit?: number } = {}
) {
  const threshold = opts.confidenceThreshold ?? 0.45;
  const limit = opts.limit ?? 20;

  const events: QueryEvent[] = store.getQueryEvents(projectId);

  const isGap = (e: QueryEvent) =>
    e.rating === "down" || e.confidence < threshold;

  const gaps = events.filter(isGap);

  const grouped = new Map<
    string,
    {
      query: string;
      occurrences: number;
      totalConfidence: number;
      worstConfidence: number;
      rating?: "up" | "down";
      lastSeen: string;
      suggestedCategoryId?: string;
    }
  >();

  for (const e of gaps) {
    const key = e.query.trim().toLowerCase().replace(/\s+/g, " ");
    if (!key) continue;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        query: e.query.trim(),
        occurrences: 1,
        totalConfidence: e.confidence,
        worstConfidence: e.confidence,
        rating: e.rating,
        lastSeen: e.createdAt,
        suggestedCategoryId: e.categoryIds[0],
      });
    } else {
      existing.occurrences += 1;
      existing.totalConfidence += e.confidence;
      existing.worstConfidence = Math.min(
        existing.worstConfidence,
        e.confidence
      );
      if (e.rating === "down") existing.rating = "down";
      if (e.createdAt > existing.lastSeen) existing.lastSeen = e.createdAt;
    }
  }

  const categoryMap = new Map(
    store.getCategories(projectId).map((c) => [c.id, c])
  );

  return Array.from(grouped.values())
    .sort((a, b) => {
      // Prioritize explicit downs, then frequency, then recency
      if ((a.rating === "down") !== (b.rating === "down")) {
        return a.rating === "down" ? -1 : 1;
      }
      if (a.occurrences !== b.occurrences) {
        return b.occurrences - a.occurrences;
      }
      return b.lastSeen.localeCompare(a.lastSeen);
    })
    .slice(0, limit)
    .map((g) => {
      const cat = g.suggestedCategoryId
        ? categoryMap.get(g.suggestedCategoryId)
        : undefined;
      return {
        query: g.query,
        occurrences: g.occurrences,
        avgConfidence: +(g.totalConfidence / g.occurrences).toFixed(2),
        worstConfidence: +g.worstConfidence.toFixed(2),
        rating: g.rating,
        lastSeen: g.lastSeen,
        suggestedCategoryId: cat?.id,
        suggestedCategoryName: cat?.name,
      };
    });
}
