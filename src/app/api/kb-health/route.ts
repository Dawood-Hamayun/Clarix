import { NextResponse } from "next/server";
import { computeKBHealth } from "@/lib/knowledge/health";
import { store } from "@/lib/db/store";

export async function GET(req: Request) {
  await store.ready();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || "proj_demo";
  const report = computeKBHealth(projectId);
  return NextResponse.json(report);
}
