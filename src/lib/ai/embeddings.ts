import { embed, embedMany } from "ai";
import { getEmbeddingModel } from "./client";

/**
 * Provider-neutral embeddings for the RAG pipeline. The model comes from
 * getEmbeddingModel (Gemini text-embedding-004 when GEMINI_API_KEY is
 * set, otherwise OpenAI text-embedding-3-small).
 *
 * Note: vectors from different providers aren't comparable. If you switch
 * providers on an existing workspace, re-seed or re-process sources so
 * stored chunk vectors match the query embeddings.
 */

/** Hard cap per input string, keeps each input inside model token budgets. */
const MAX_INPUT_CHARS = 8000;

/**
 * Generate an embedding vector for a single string, using the model
 * resolved for the given project.
 */
export async function generateEmbedding(
  text: string,
  projectId: string
): Promise<number[]> {
  const { embedding } = await embed({
    model: getEmbeddingModel(projectId),
    value: text.slice(0, MAX_INPUT_CHARS),
  });
  return embedding;
}

/**
 * Generate embeddings for many strings at once. The AI SDK batches
 * requests to the provider's per-call limit automatically.
 */
export async function generateEmbeddings(
  texts: string[],
  projectId: string
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const { embeddings } = await embedMany({
    model: getEmbeddingModel(projectId),
    values: texts.map((t) => t.slice(0, MAX_INPUT_CHARS)),
  });
  return embeddings;
}
