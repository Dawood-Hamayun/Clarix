import { nanoid } from "nanoid";
import { parseContent } from "./parser";
import { chunkText } from "./chunker";
import { generateEmbeddings } from "@/lib/ai/embeddings";
import { store } from "@/lib/db/store";
import { vectorStore } from "@/lib/db/vector-store";
import type { Chunk } from "@/lib/db/types";

export interface ProcessingProgress {
  stage: "parsing" | "chunking" | "embedding" | "storing" | "done";
  detail?: string;
}

export async function processSource(
  sourceId: string,
  content: string,
  type: "text" | "url" | "file",
  projectId: string
): Promise<{
  chunkCount: number;
  wordCount: number;
}> {
  const source = store.getSource(sourceId);
  if (!source) throw new Error("Source not found");

  try {
    // 1. Parse
    store.updateSource(sourceId, { status: "processing" });
    const parsedText = await parseContent(content, type);

    // 2. Chunk
    const chunkResults = chunkText(parsedText);
    const wordCount = parsedText.split(/\s+/).length;

    // 3. Embed
    const texts = chunkResults.map((c) => c.content);
    const embeddings = await generateEmbeddings(texts, projectId);

    // 4. Store chunks and vectors
    const chunkIds: string[] = [];
    for (let i = 0; i < chunkResults.length; i++) {
      const chunkId = `chunk_${nanoid(8)}`;
      const chunk: Chunk = {
        id: chunkId,
        sourceId,
        categoryId: source.categoryId,
        content: chunkResults[i].content,
        embedding: embeddings[i],
        metadata: {
          position: chunkResults[i].position,
          heading: chunkResults[i].heading,
        },
      };

      store.addChunk(chunk);
      await vectorStore.upsert({
        chunkId,
        sourceId,
        projectId,
        embedding: embeddings[i],
      });

      chunkIds.push(chunkId);
    }

    // 5. Update source
    store.updateSource(sourceId, {
      status: "ready",
      chunks: chunkIds,
      metadata: {
        wordCount,
        chunkCount: chunkIds.length,
        createdAt: source.metadata.createdAt,
        updatedAt: new Date().toISOString(),
      },
    });

    return { chunkCount: chunkIds.length, wordCount };
  } catch (error) {
    store.updateSource(sourceId, { status: "error" });
    throw error;
  }
}
