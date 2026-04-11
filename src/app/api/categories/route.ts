import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";

export async function GET(req: Request) {
  await store.ready();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || "proj_demo";

  const categories = store.getCategories(projectId);
  const sources = store.getSources(projectId);

  // Return categories enriched with source counts & status
  const enriched = categories.map((cat) => {
    const inCategory = sources.filter((s) => s.categoryId === cat.id);
    const ready = inCategory.filter((s) => s.status === "ready");
    const wordCount = inCategory.reduce(
      (sum, s) => sum + s.metadata.wordCount,
      0
    );
    const chunkCount = inCategory.reduce(
      (sum, s) => sum + s.metadata.chunkCount,
      0
    );
    const lastUpdated = inCategory.reduce<string | null>((latest, s) => {
      if (!latest || s.metadata.updatedAt > latest) return s.metadata.updatedAt;
      return latest;
    }, null);

    return {
      ...cat,
      stats: {
        sourceCount: inCategory.length,
        readyCount: ready.length,
        wordCount,
        chunkCount,
        lastUpdated,
      },
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(req: Request) {
  await store.ready();
  const body = await req.json();
  const {
    projectId = "proj_demo",
    name,
    description = "",
    icon = "Folder",
  } = body as {
    projectId?: string;
    name: string;
    description?: string;
    icon?: string;
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Generate slug
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const existing = store.getCategories(projectId);
  const maxOrder = existing.reduce((m, c) => Math.max(m, c.order), 0);

  const category = store.createCategory({
    projectId,
    slug,
    name,
    description,
    icon,
    order: maxOrder + 1,
    system: false,
  });

  return NextResponse.json(category);
}
