import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await store.ready();
  const { id } = await params;
  const conversation = store.getConversationWithStatus(id);
  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }
  return NextResponse.json(conversation);
}
