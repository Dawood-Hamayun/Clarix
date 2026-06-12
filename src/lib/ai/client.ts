import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { EmbeddingModel, LanguageModel } from "ai";
import { store } from "@/lib/db/store";

/**
 * Provider-neutral model resolver.
 *
 * Precedence:
 *   1. `GEMINI_API_KEY` (or `GOOGLE_GENERATIVE_AI_API_KEY`) from the
 *      environment. When set, the whole app runs on Google's free-tier
 *      Gemini models. Nothing about the provider is shown in the UI.
 *   2. The OpenAI key stored on the project during onboarding.
 *   3. `OPENAI_API_KEY` from the environment.
 *
 * Model ids are overridable via env so the host can pin whatever the
 * current free tier offers:
 *   CLARIX_CHAT_MODEL       (default gemini-2.5-flash / gpt-4o)
 *   CLARIX_FAST_MODEL       (default gemini-2.5-flash-lite / gpt-4o-mini)
 *   CLARIX_EMBEDDING_MODEL  (default gemini-embedding-001 / text-embedding-3-small)
 */

export function resolveGeminiKey(): string | null {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    null
  );
}

export function resolveOpenAIKey(projectId: string): string | null {
  const project = store.getProject(projectId);
  const projectKey = project?.openAIApiKey?.trim();
  if (projectKey) return projectKey;
  const envKey = process.env.OPENAI_API_KEY?.trim();
  if (envKey) return envKey;
  return null;
}

/** Thrown when a request needs an AI key but none is configured. */
export class MissingOpenAIKeyError extends Error {
  constructor() {
    super(
      "No AI API key configured. Set GEMINI_API_KEY in your environment, add an OpenAI key in Settings, or set OPENAI_API_KEY."
    );
    this.name = "MissingOpenAIKeyError";
  }
}

function googleProvider() {
  const apiKey = resolveGeminiKey();
  if (!apiKey) return null;
  return createGoogleGenerativeAI({ apiKey });
}

/**
 * Build an AI SDK OpenAI provider scoped to a project. Kept for callers
 * that explicitly need OpenAI; new code should use getChatModel /
 * getFastModel / getEmbeddingModel instead.
 */
export function getOpenAIProvider(projectId: string): OpenAIProvider {
  const apiKey = resolveOpenAIKey(projectId);
  if (!apiKey) throw new MissingOpenAIKeyError();
  return createOpenAI({ apiKey });
}

/** Main conversational model (chat, interview composer). */
export function getChatModel(projectId: string): LanguageModel {
  const google = googleProvider();
  if (google) {
    return google(process.env.CLARIX_CHAT_MODEL || "gemini-2.5-flash");
  }
  return getOpenAIProvider(projectId)(
    process.env.CLARIX_CHAT_MODEL || "gpt-4o"
  );
}

/** Cheap, fast model for auxiliary calls (quick replies, suggestions). */
export function getFastModel(projectId: string): LanguageModel {
  const google = googleProvider();
  if (google) {
    return google(process.env.CLARIX_FAST_MODEL || "gemini-2.5-flash-lite");
  }
  return getOpenAIProvider(projectId)(
    process.env.CLARIX_FAST_MODEL || "gpt-4o-mini"
  );
}

/** Embedding model for the RAG pipeline. */
export function getEmbeddingModel(projectId: string): EmbeddingModel {
  const google = googleProvider();
  if (google) {
    return google.textEmbedding(
      process.env.CLARIX_EMBEDDING_MODEL || "gemini-embedding-001"
    );
  }
  return getOpenAIProvider(projectId).textEmbedding(
    process.env.CLARIX_EMBEDDING_MODEL || "text-embedding-3-small"
  );
}

/**
 * True when the project (or environment) has a usable AI key, from
 * either provider. Cheap check that routes use to short-circuit with a
 * 400 before touching the AI SDK.
 */
export function hasOpenAIKey(projectId: string): boolean {
  return resolveGeminiKey() !== null || resolveOpenAIKey(projectId) !== null;
}
