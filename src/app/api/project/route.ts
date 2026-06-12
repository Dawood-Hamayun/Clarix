import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";
import { resolveGeminiKey } from "@/lib/ai/client";
import { isDemoLocked } from "@/lib/demo-mode";
import type { Project, PublicProject } from "@/lib/db/types";

/**
 * Strip the raw OpenAI key before sending a project to the browser.
 * Replaces it with a boolean flag the UI can use to decide whether
 * to show "Add API key" vs. "Key configured". An environment-level
 * Gemini or OpenAI key counts as configured, the UI never needs to
 * know which provider is behind it.
 */
function toPublicProject(project: Project): PublicProject {
  const { openAIApiKey, ...rest } = project;
  const hasEnvKey =
    resolveGeminiKey() !== null ||
    Boolean(process.env.OPENAI_API_KEY?.trim());
  return {
    ...rest,
    hasOpenAIApiKey: Boolean(openAIApiKey && openAIApiKey.trim()) || hasEnvKey,
    demoLocked: isDemoLocked(),
  };
}

export async function GET(req: Request) {
  await store.ready();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || "proj_demo";
  const project = store.getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json(toPublicProject(project));
}

export async function PATCH(req: Request) {
  if (isDemoLocked()) {
    return NextResponse.json(
      { error: "This demo workspace is locked.", code: "demo_locked" },
      { status: 403 }
    );
  }
  await store.ready();
  const body = await req.json();
  const {
    projectId = "proj_demo",
    openAIApiKey,
    ...updates
  } = body as Partial<Project> & { projectId?: string };

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

  // Handle the API key separately so:
  //   - `undefined`  → leave existing key alone
  //   - `""`         → clear it (user explicitly removed it)
  //   - "sk-..."     → trim and store
  if (openAIApiKey !== undefined) {
    const trimmed = typeof openAIApiKey === "string" ? openAIApiKey.trim() : "";
    merged.openAIApiKey = trimmed || undefined;
  }

  const updated = store.updateProject(projectId, merged);
  if (!updated) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json(toPublicProject(updated));
}

/**
 * Wipe and re-seed the entire demo store. Powers the
 * "Delete project" danger-zone button in settings.
 */
export async function DELETE() {
  if (isDemoLocked()) {
    return NextResponse.json(
      { error: "This demo workspace is locked.", code: "demo_locked" },
      { status: 403 }
    );
  }
  await store.ready();
  store.resetAll();
  await store.flushNow();
  return NextResponse.json({ ok: true });
}
