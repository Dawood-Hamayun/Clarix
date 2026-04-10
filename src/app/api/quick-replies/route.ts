import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { store } from "@/lib/db/store";

interface TurnInput {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  const {
    history,
    projectId = "proj_demo",
  }: { history: TurnInput[]; projectId?: string } = await req.json();

  if (!history?.length) {
    return NextResponse.json({ suggestions: [] });
  }

  const project = store.getProject(projectId);
  const companyName = project?.widgetConfig.companyName || "the company";

  const trimmedHistory = history.slice(-6);
  const dialog = trimmedHistory
    .map((t) => `${t.role === "user" ? "Customer" : "Agent"}: ${t.content}`)
    .join("\n");

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      temperature: 0.4,
      system: `You suggest 3 short, natural follow-up questions a customer might ask ${companyName}'s support agent next. Each question must:
- Be under 9 words
- Sound like a real customer (not a test question)
- Build logically on the agent's last answer
- Cover different angles, not 3 variations of one question

Return ONLY a JSON array of exactly 3 strings. No prose. No keys. Example: ["...", "...", "..."]`,
      prompt: dialog,
    });

    // Extract the JSON array safely
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      return NextResponse.json({ suggestions: [] });
    }

    try {
      const parsed = JSON.parse(match[0]);
      if (!Array.isArray(parsed)) {
        return NextResponse.json({ suggestions: [] });
      }
      const suggestions = parsed
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3);
      return NextResponse.json({ suggestions });
    } catch {
      return NextResponse.json({ suggestions: [] });
    }
  } catch (error) {
    console.error("Quick replies error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
