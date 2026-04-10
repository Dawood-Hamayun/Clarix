import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || "proj_demo";
  const analytics = store.getAnalytics(projectId);
  return NextResponse.json(analytics);
}
