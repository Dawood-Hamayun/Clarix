import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";
import type { Project } from "@/lib/db/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || "proj_demo";
  const project = store.getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { projectId = "proj_demo", ...updates } = body as Partial<Project> & {
    projectId?: string;
  };

  const existing = store.getProject(projectId);
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Deep-merge nested configs so callers can patch just what they need
  const merged: Partial<Project> = {
    ...updates,
    widgetConfig: updates.widgetConfig
      ? { ...existing.widgetConfig, ...updates.widgetConfig }
      : existing.widgetConfig,
    agentConfig: updates.agentConfig
      ? { ...existing.agentConfig, ...updates.agentConfig }
      : existing.agentConfig,
  };

  const updated = store.updateProject(projectId, merged);
  return NextResponse.json(updated);
}

/**
 * Wipe and re-seed the entire demo store. Powers the
 * "Delete project" danger-zone button in settings.
 */
export async function DELETE() {
  store.resetAll();
  return NextResponse.json({ ok: true });
}
