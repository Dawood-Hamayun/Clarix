import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";

/**
 * Explicit customer-facing resolution endpoint. Powers the "Did this
 * solve your issue?" prompt in the widget. Writes to
 * `metadata.customerResolution`, which takes priority over per-message
 * thumbs feedback when the dashboard derives conversation status.
 *
 * Body: `{ resolved: boolean }`, `true` marks the chat resolved,
 * `false` marks it unresolved. Pass `null` to clear the override and
 * fall back to feedback aggregation.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await store.ready();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    resolved?: boolean | null;
  };

  let value: "resolved" | "unresolved" | null;
  if (body.resolved === true) value = "resolved";
  else if (body.resolved === false) value = "unresolved";
  else if (body.resolved === null) value = null;
  else {
    return NextResponse.json(
      { error: "Body must include { resolved: true | false | null }" },
      { status: 400 }
    );
  }

  const updated = store.setCustomerResolution(id, value);
  if (!updated) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    status: store.getConversationStatus(id),
  });
}
