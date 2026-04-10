import { NextResponse } from "next/server";
import { processSource } from "@/lib/knowledge/processor";

export async function POST(req: Request) {
  const { sourceId, content, type, projectId = "proj_demo", fileType } =
    await req.json();

  try {
    const result = await processSource(
      sourceId,
      content,
      type,
      projectId,
      fileType
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Processing failed",
      },
      { status: 500 }
    );
  }
}
