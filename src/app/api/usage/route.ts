import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";

/**
 * Returns aggregated OpenAI token usage for the project.
 *
 * OpenAI doesn't expose remaining credit / quota via the chat+embeddings
 * API surface, so "how much do I have left?" isn't answerable from here.
 * What we *can* show is how much this project has spent since its first
 * recorded chat turn — prompt tokens, completion tokens, and a rough USD
 * estimate at published gpt-4o rates.
 */
export async function GET(req: Request) {
  await store.ready();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || "proj_demo";
  return NextResponse.json(store.getTokenUsage(projectId));
}
