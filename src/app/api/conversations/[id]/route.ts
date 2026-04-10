import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const conversation = store.getConversation(id);
  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }
  return NextResponse.json(conversation);
}
