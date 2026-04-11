import OpenAI from "openai";
import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { store } from "@/lib/db/store";

/**
 * Central resolver for the OpenAI API key.
 *
 * Precedence:
 *   1. The key stored on the project during onboarding (preferred — lets
 *      users bring their own key without touching server env).
 *   2. `OPENAI_API_KEY` from the environment (useful for self-hosters
 *      running a single-tenant instance).
 *
 * Returns `null` if no key is available so callers can render a friendly
 * "add your API key" prompt instead of throwing a 500.
 */
export function resolveOpenAIKey(projectId: string): string | null {
  const project = store.getProject(projectId);
  const projectKey = project?.openAIApiKey?.trim();
  if (projectKey) return projectKey;
  const envKey = process.env.OPENAI_API_KEY?.trim();
  if (envKey) return envKey;
  return null;
}

/** Thrown when a request needs an OpenAI key but none is configured. */
export class MissingOpenAIKeyError extends Error {
  constructor() {
    super(
      "No OpenAI API key configured for this project. Add one in Settings → API key, or set OPENAI_API_KEY in your environment."
    );
    this.name = "MissingOpenAIKeyError";
  }
}

/**
 * Build an `openai` REST client (from the `openai` npm package) using
 * the key resolved for the given project. Used by the embeddings
 * pipeline, which doesn't go through the AI SDK.
 */
export function getOpenAIClient(projectId: string): OpenAI {
  const apiKey = resolveOpenAIKey(projectId);
  if (!apiKey) throw new MissingOpenAIKeyError();
  return new OpenAI({ apiKey });
}

/**
 * Build an AI SDK OpenAI provider scoped to a project. Used by every
 * `streamText` / `generateText` call — pass `provider("gpt-4o")` to the
 * `model` field instead of the default global `openai(...)` import.
 */
export function getOpenAIProvider(projectId: string): OpenAIProvider {
  const apiKey = resolveOpenAIKey(projectId);
  if (!apiKey) throw new MissingOpenAIKeyError();
  return createOpenAI({ apiKey });
}

/**
 * True when the project (or environment) has a usable OpenAI key.
 * Cheap check that routes can use to short-circuit with a 400 before
 * touching the AI SDK.
 */
export function hasOpenAIKey(projectId: string): boolean {
  return resolveOpenAIKey(projectId) !== null;
}
