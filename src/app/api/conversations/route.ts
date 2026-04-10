import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || "proj_demo";
  const conversations = store.getConversations(projectId);
  return NextResponse.json(conversations);
}

export async function POST(req: Request) {
  const { projectId = "proj_demo" } = await req.json();
  const conversation = store.createConversation(projectId);
  return NextResponse.json(conversation);
}
