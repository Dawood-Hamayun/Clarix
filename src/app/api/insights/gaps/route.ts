import { NextResponse } from "next/server";
import { computeGaps } from "@/lib/knowledge/health";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || "proj_demo";
  const gaps = computeGaps(projectId);
  return NextResponse.json({ gaps });
}
