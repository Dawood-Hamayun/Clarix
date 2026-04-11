import { NextResponse } from "next/server";
import { processSource } from "@/lib/knowledge/processor";
import { MissingOpenAIKeyError } from "@/lib/ai/client";
import { store } from "@/lib/db/store";

export async function POST(req: Request) {
  await store.ready();
  const { sourceId, content, type, projectId = "proj_demo" } =
    await req.json();

  try {
    const result = await processSource(sourceId, content, type, projectId);
    return NextResponse.json(result);
  } catch (error) {
    // Missing API key gets a dedicated 400 so the UI can prompt the
    // user to add one without treating it as a server error.
    if (error instanceof MissingOpenAIKeyError) {
      return NextResponse.json(
        { error: error.message, code: "missing_openai_key" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Processing failed",
      },
      { status: 500 }
    );
  }
}
