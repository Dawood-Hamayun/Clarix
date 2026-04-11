import { getOpenAIClient } from "./client";

/**
 * OpenAI embedding model. `text-embedding-3-small` hits a good balance
 * between cost ($0.02 / 1M tokens) and quality for RAG retrieval.
 */
const EMBEDDING_MODEL = "text-embedding-3-small";

/** Hard cap per input string. Matches OpenAI's per-input token budget. */
const MAX_INPUT_CHARS = 8000;

/** Max items per embeddings.create batch (OpenAI accepts up to 2048). */
const BATCH_SIZE = 100;

/**
 * Generate an embedding vector for a single string, using the OpenAI key
 * resolved from the given project.
 */
export async function generateEmbedding(
  text: string,
  projectId: string
): Promise<number[]> {
  const openai = getOpenAIClient(projectId);
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, MAX_INPUT_CHARS),
  });
  return response.data[0].embedding;
}

/**
 * Generate embeddings for many strings at once. Batches requests so a
 * large source (hundreds of chunks) only triggers a handful of API calls.
 */
export async function generateEmbeddings(
  texts: string[],
  projectId: string
): Promise<number[][]> {
  const openai = getOpenAIClient(projectId);
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts
      .slice(i, i + BATCH_SIZE)
      .map((t) => t.slice(0, MAX_INPUT_CHARS));
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });
    results.push(...response.data.map((d) => d.embedding));
  }
  return results;
}
