import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await store.ready();
  const { id } = await params;
  const existing = store.getCategory(id);
  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const body = await req.json();
  const { name, description, icon } = body as {
    name?: string;
    description?: string;
    icon?: string;
  };

  const updated = store.updateCategory(id, {
    ...(name !== undefined ? { name } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(icon !== undefined ? { icon } : {}),
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await store.ready();
  const { id } = await params;
  const existing = store.getCategory(id);
  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
  if (existing.system) {
    return NextResponse.json(
      { error: "System categories cannot be deleted" },
      { status: 400 }
    );
  }
  const ok = store.deleteCategory(id);
  return NextResponse.json({ success: ok });
}
