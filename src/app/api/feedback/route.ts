import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";

export async function POST(req: Request) {
  await store.ready();
  const { eventId, rating, note } = (await req.json()) as {
    eventId?: string;
    rating?: "up" | "down";
    note?: string;
  };

  if (!eventId || (rating !== "up" && rating !== "down")) {
    return NextResponse.json(
      { error: "eventId and rating ('up' | 'down') are required" },
      { status: 400 }
    );
  }

  const updated = store.updateQueryEvent(eventId, { rating, note });
  if (!updated) {
    return NextResponse.json(
      { error: "Query event not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, event: updated });
}
