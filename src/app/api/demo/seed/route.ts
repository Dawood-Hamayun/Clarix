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

  return NextResponse.json({
    ok: true,
    created,
    skipped,
    totalSources: created.length + skipped.length,
  });
}
