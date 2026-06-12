import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";
import { processSource } from "@/lib/knowledge/processor";
import { MissingOpenAIKeyError } from "@/lib/ai/client";
import { DEMO_SOURCES, DEMO_PROJECT } from "@/lib/db/demo-data";

/**
 * One-click "Load demo content" endpoint.
 *
 * Pipes the bundled Acme Cloud markdown docs through the same
 * createSource → processSource pipeline a real upload uses, so visitors
 * see a fully populated knowledge base (with embeddings, chunks, and
 * working chat) without having to upload anything themselves.
 *
 * Skips any source whose name already exists in the project, so the
 * button is safely re-runnable.
 */
export async function POST(req: Request) {
  await store.ready();

  const body = await req.json().catch(() => ({}));
  const projectId: string = body.projectId || "proj_demo";

  const project = store.getProject(projectId);
  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  // Reflect the demo branding on the project itself so the dashboard,
  // widget preview, and chat all show "Acme Cloud" / "Ava" instead of
  // generic placeholders. We only overwrite if the user hasn't already
  // customized away from defaults.
  const isDefaultName =
    !project.name ||
    project.name === "My Project" ||
    project.name === "Your Company" ||
    project.name === "My Company" ||
    project.name === "New Project" ||
    project.name === "Demo Project";
  if (isDefaultName) {
    store.updateProject(projectId, {
      name: DEMO_PROJECT.name,
      description: DEMO_PROJECT.description,
      widgetConfig: {
        ...project.widgetConfig,
        companyName: DEMO_PROJECT.name,
        greeting: DEMO_PROJECT.greeting,
      },
      agentConfig: {
        ...project.agentConfig,
        agentName: DEMO_PROJECT.agentName,
        tagline: DEMO_PROJECT.tagline,
      },
    });
  }

  const categories = store.getCategories(projectId);
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  const existing = new Set(
    store.getSources(projectId).map((s) => s.name.toLowerCase())
  );

  const created: { name: string; chunkCount: number }[] = [];
  const skipped: string[] = [];

  try {
    for (const demo of DEMO_SOURCES) {
      if (existing.has(demo.name.toLowerCase())) {
        skipped.push(demo.name);
        continue;
      }

      const category = categoryBySlug.get(demo.categorySlug);
      const source = store.createSource({
        projectId,
        categoryId: category?.id,
        name: demo.name,
        type: "text",
        content: demo.content,
      });

      const result = await processSource(
        source.id,
        demo.content,
        "text",
        projectId
      );
      created.push({ name: demo.name, chunkCount: result.chunkCount });
    }
  } catch (error) {
    if (error instanceof MissingOpenAIKeyError) {
      return NextResponse.json(
        {
          error: error.message,
          code: "missing_openai_key",
          created,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Demo seed failed",
        created,
      },
      { status: 500 }
    );
  }


  // Seed a few realistic conversations so the dashboard and Conversations
  // screens feel alive on first open. Only when the workspace has none.
  if (store.getConversations(projectId).every((c) => c.messages.length === 0)) {
    const SAMPLE_CONVERSATIONS: {
      customer: string;
      turns: [string, string][];
    }[] = [
      {
        customer: "Maya",
        turns: [
          [
            "How much does the Business plan cost?",
            "The Business plan is $16 per user per month, and annual billing saves you 20%. It includes SSO, priority support, and everything in Starter. You can try every feature free for 14 days, no credit card required.",
          ],
          [
            "Can I cancel anytime?",
            "Absolutely. Go to Settings → Billing → Cancel Plan. You keep full access until the end of your billing period, and your data is safely stored for 90 days.",
          ],
        ],
      },
      {
        customer: "Daniel",
        turns: [
          [
            "Are you SOC 2 compliant?",
            "Yes. Acme Cloud is SOC 2 Type II certified and audited annually. We're also GDPR compliant with EU data hosting in Frankfurt, and HIPAA-ready on the Enterprise plan.",
          ],
        ],
      },
      {
        customer: "Sofia",
        turns: [
          [
            "Do you integrate with Slack and GitHub?",
            "Yes, both! Acme Cloud connects natively with Slack, GitHub, GitLab, Figma, Jira, Notion and 10+ more tools. Pull requests link to your sprints automatically.",
          ],
          [
            "Is there a mobile app?",
            "Yes! Native iOS and Android apps for viewing roadmaps, replying to comments, and getting push notifications.",
          ],
        ],
      },
      {
        customer: "Liam",
        turns: [
          [
            "Where is my data stored?",
            "Your data lives in one of three regions: Virginia (US), Frankfurt (EU), or Sydney (AU), encrypted at rest and in transit.",
          ],
        ],
      },
    ];
    for (const sample of SAMPLE_CONVERSATIONS) {
      const conv = store.createConversation(projectId, sample.customer);
      for (const [q, a] of sample.turns) {
        store.addMessage(conv.id, { role: "user", content: q });
        store.addMessage(conv.id, { role: "assistant", content: a });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    created,
    skipped,
    totalSources: created.length + skipped.length,
  });
}
