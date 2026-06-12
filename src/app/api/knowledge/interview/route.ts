import { NextResponse } from "next/server";
import { generateText } from "ai";
import { getChatModel, MissingOpenAIKeyError } from "@/lib/ai/client";
import { store } from "@/lib/db/store";
import {
  getTemplate,
  type InterviewQuestion,
} from "@/lib/knowledge/interview-templates";

interface Answer {
  questionId: string;
  question: string;
  answer: string;
}

interface StartBody {
  mode: "start";
  categoryId: string;
  projectId?: string;
}

interface ComposeBody {
  mode: "compose";
  categoryId: string;
  projectId?: string;
  answers: Answer[];
}

type Body = StartBody | ComposeBody;

export async function POST(req: Request) {
  await store.ready();
  const body = (await req.json()) as Body;
  const projectId = body.projectId || "proj_demo";

  const category = store.getCategory(body.categoryId);
  if (!category) {
    return NextResponse.json(
      { error: "Category not found" },
      { status: 404 }
    );
  }

  if (body.mode === "start") {
    const template = getTemplate(category.slug);
    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
      },
      title: template.title,
      subtitle: template.subtitle,
      questions: template.questions satisfies InterviewQuestion[],
    });
  }

  if (body.mode === "compose") {
    const { answers } = body;
    if (!answers?.length) {
      return NextResponse.json(
        { error: "No answers provided" },
        { status: 400 }
      );
    }

    const project = store.getProject(projectId);
    const companyName = project?.widgetConfig.companyName || "the company";

    // Filter out empty answers
    const filled = answers.filter((a) => a.answer?.trim());
    if (filled.length === 0) {
      return NextResponse.json(
        { error: "All answers are empty" },
        { status: 400 }
      );
    }

    const qaBlock = filled
      .map((a) => `Q: ${a.question}\nA: ${a.answer.trim()}`)
      .join("\n\n");

    const system = `You are a senior knowledge-base editor for ${companyName}. You turn raw Q&A notes into clean, customer-facing Markdown that an AI support agent can retrieve to answer questions.

Rules:
- Write in Markdown only. No preamble, no sign-off, no "Here's the draft…".
- Start with a single "# " H1 title that is short, concrete, and self-descriptive.
- Use H2/H3 sections, bullet lists, and tables where they genuinely help.
- Preserve every factual detail the user provided. Do NOT invent prices, URLs, names, numbers, or policies.
- Fix grammar and phrasing, but keep the user's meaning exact.
- Be crisp. No filler. No marketing fluff.
- Aim for 150-500 words unless the source material warrants more.
- If an answer is empty or "n/a", skip that section entirely.`;

    const prompt = `Category: ${category.name}
Category description: ${category.description}

Here is the raw Q&A from the user. Turn it into a polished Markdown knowledge-base entry following the rules above.

${qaBlock}`;

    let model;
    try {
      model = getChatModel(projectId);
    } catch (err) {
      if (err instanceof MissingOpenAIKeyError) {
        return NextResponse.json(
          { error: err.message, code: "missing_openai_key" },
          { status: 400 }
        );
      }
      throw err;
    }

    try {
      const { text } = await generateText({
        model,
        system,
        prompt,
        temperature: 0.3,
      });

      // Extract a title from the first H1 line
      const titleMatch = text.match(/^#\s+(.+)$/m);
      const title = titleMatch?.[1]?.trim() || `${category.name} entry`;

      return NextResponse.json({
        title,
        markdown: text.trim(),
      });
    } catch (error) {
      console.error("Interview compose error:", error);
      return NextResponse.json(
        { error: "Failed to compose draft" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
}
