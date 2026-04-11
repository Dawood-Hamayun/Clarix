export interface VectorEntry {
  chunkId: string;
  sourceId: string;
  projectId: string;
  embedding: number[];
}

export interface SearchResult {
  chunkId: string;
  sourceId: string;
  score: number;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

class InMemoryVectorStore {
  private vectors: Map<string, VectorEntry> = new Map();

  async upsert(entry: VectorEntry): Promise<void> {
    this.vectors.set(entry.chunkId, entry);
  }

  /**
   * Rebuild the vector index from an iterable of vector entries.
   * Called after the store hydrates from Redis so search works
   * immediately without re-embedding.
   */
  rebuild(entries: Iterable<VectorEntry>): void {
    this.vectors.clear();
    for (const e of entries) {
      this.vectors.set(e.chunkId, e);
    }
  }

  clear(): void {
    this.vectors.clear();
  }

  async search(
    queryEmbedding: number[],
    projectId: string,
    topK: number = 5,
    threshold: number = 0.3
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const entry of this.vectors.values()) {
      if (entry.projectId !== projectId) continue;
      const score = cosineSimilarity(queryEmbedding, entry.embedding);
      if (score >= threshold) {
        results.push({
          chunkId: entry.chunkId,
          sourceId: entry.sourceId,
          score,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  async deleteBySource(sourceId: string): Promise<void> {
    for (const [key, entry] of this.vectors.entries()) {
      if (entry.sourceId === sourceId) {
        this.vectors.delete(key);
      }
    }
  }

  get size(): number {
    return this.vectors.size;
  }
}

// Singleton
export const vectorStore = new InMemoryVectorStore();
