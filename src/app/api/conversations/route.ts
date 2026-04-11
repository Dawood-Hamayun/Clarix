import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";

export async function GET(req: Request) {
  await store.ready();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || "proj_demo";
  // Decorate every conversation with its derived status so the client
  // doesn't need to know how "resolved" is defined.
  const conversations = store.getConversations(projectId).map((c) => ({
    ...c,
    status: store.getConversationStatus(c.id),
  }));
  return NextResponse.json(conversations);
}

export async function POST(req: Request) {
  await store.ready();
  const { projectId = "proj_demo" } = await req.json();
  const conversation = store.createConversation(projectId);
  return NextResponse.json(conversation);
}
