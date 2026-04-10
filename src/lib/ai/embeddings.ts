import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000), // Limit input length
  });
  return response.data[0].embedding;
}

export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  // Batch in groups of 100
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100).map((t) => t.slice(0, 8000));
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: batch,
    });
    results.push(...response.data.map((d) => d.embedding));
  }
  return results;
}
