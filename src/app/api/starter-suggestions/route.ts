import { NextResponse } from "next/server";
import { pickSuggestions } from "@/lib/demo-suggestions";

/**
 * Conversation openers for the chat UI. Served from a curated pool of
 * questions that are guaranteed answerable from the demo knowledge base,
 * so a suggested chip can never make the agent look bad mid-demo.
 * Deterministic, instant, and costs nothing.
 */
export async function POST() {
  return NextResponse.json({ suggestions: pickSuggestions([], 3) });
}
