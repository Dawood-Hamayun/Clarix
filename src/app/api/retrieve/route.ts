import { NextResponse } from "next/server";
import { retrieveContext } from "@/lib/ai/rag";
import { store } from "@/lib/db/store";

export async function POST(req: Request) {
  await store.ready();
  const { query, projectId = "proj_demo" } = await req.json();

  if (!query || typeof query !== "string") {
    return NextResponse.json({ sources: [] });
  }

  try {
    const { sources } = await retrieveContext(query, projectId);
    return NextResponse.json({ sources });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Retrieval failed",
        sources: [],
      },
      { status: 500 }
    );
  }
}
