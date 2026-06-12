import { NextResponse } from "next/server";
import { pickSuggestions } from "@/lib/demo-suggestions";

/**
 * Follow-up chips shown after each agent reply. Served from the same
 * curated, guaranteed-answerable pool as the starter suggestions, minus
 * anything the customer already asked in this thread. Deterministic and
 * instant, no model call, no risk of suggesting something the knowledge
 * base can't answer.
 */
export async function POST(req: Request) {
  const {
    history = [],
  }: { history?: { role: "user" | "assistant"; content: string }[] } =
    await req.json().catch(() => ({}));

  const asked = history
    .filter((m) => m.role === "user")
    .map((m) => m.content);

  return NextResponse.json({ suggestions: pickSuggestions(asked, 3) });
}
