import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";
import { vectorStore } from "@/lib/db/vector-store";
import { processSource } from "@/lib/knowledge/processor";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  await store.ready();
  const { sourceId } = await params;
  const source = store.getSource(sourceId);
  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }
  const chunks = store.getChunksBySource(sourceId);
  return NextResponse.json({ ...source, chunksData: chunks });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  await store.ready();
  const { sourceId } = await params;
  const source = store.getSource(sourceId);
  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  const body = await req.json();
  const { name, content } = body as { name?: string; content?: string };

  // If content changed, reprocess (wipe old chunks + vectors, re-embed)
  if (typeof content === "string" && content !== source.content) {
    // Remove old chunks
    for (const chunkId of source.chunks) {
      store.chunks.delete(chunkId);
    }
    await vectorStore.deleteBySource(sourceId);

    store.updateSource(sourceId, {
      content,
      chunks: [],
      status: "processing",
      ...(name ? { name } : {}),
    });

    try {
      await processSource(
        sourceId,
        content,
        source.type,
        source.projectId
      );
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Reprocessing failed",
        },
        { status: 500 }
      );
    }
  } else if (name && name !== source.name) {
    store.updateSource(sourceId, { name });
  }

  const updated = store.getSource(sourceId);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  await store.ready();
  const { sourceId } = await params;
  await vectorStore.deleteBySource(sourceId);
  const deleted = store.deleteSource(sourceId);
  if (!deleted) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
