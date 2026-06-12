import { isDemoLocked } from "@/lib/demo-mode";
import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";

export async function GET(req: Request) {
  await store.ready();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || "proj_demo";
  const sources = store.getSources(projectId);
  return NextResponse.json(sources);
}

export async function POST(req: Request) {
  if (isDemoLocked()) {
    return NextResponse.json(
      { error: "Knowledge is locked in this demo.", code: "demo_locked" },
      { status: 403 }
    );
  }
  await store.ready();
  const {
    name,
    type,
    content,
    projectId = "proj_demo",
    categoryId,
    metadata,
  } = await req.json();

  const source = store.createSource({
    projectId,
    categoryId,
    name,
    type,
    content,
    metadata,
  });

  return NextResponse.json(source);
}
