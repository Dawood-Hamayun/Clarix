import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { EmbeddingModel, LanguageModel } from "ai";
import { store } from "@/lib/db/store";

/**
 * Provider-neutral model resolver.
 *
 * The whole app uses ONE provider for both chat and embeddings, picked
 * once here so query embeddings always match stored chunk embeddings
 * (mixing providers breaks retrieval silently).
 *
 * Precedence:
 *   1. OpenAI (gpt-4o + text-embedding-3-small) when an OpenAI key is
 *      available, either a per-project key or `OPENAI_API_KEY`. This is
 *      the default because it's the most reliable.
 *   2. Gemini, only when there is NO OpenAI key but `GEMINI_API_KEY`
 *      (or `GOOGLE_GENERATIVE_AI_API_KEY`) is set. Lets a host run on
 *      Google's free tier with no OpenAI key at all.
 *
 * To force Gemini even when an OpenAI key exists, set
 * `CLARIX_AI_PROVIDER=gemini`. Model ids are overridable:
 *   CLARIX_CHAT_MODEL       (default gpt-4o / gemini-2.5-flash)
 *   CLARIX_FAST_MODEL       (default gpt-4o-mini / gemini-2.5-flash-lite)
 *   CLARIX_EMBEDDING_MODEL  (default text-embedding-3-small / gemini-embedding-001)
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
      "No AI API key configured. Set OPENAI_API_KEY (or a per-project key), or set GEMINI_API_KEY for Google's free tier."
    );
    this.name = "MissingOpenAIKeyError";
  }
}

/**
 * Decide which provider to use for this project. OpenAI wins unless
 * there's no OpenAI key, or the host explicitly forces Gemini.
 */
function useGemini(projectId: string): boolean {
  const forced = process.env.CLARIX_AI_PROVIDER?.trim().toLowerCase();
  if (forced === "gemini" || forced === "google") {
    return resolveGeminiKey() !== null;
  }
  if (forced === "openai") return false;
  // Default: prefer OpenAI, fall back to Gemini only when no OpenAI key.
  if (resolveOpenAIKey(projectId)) return false;
  return resolveGeminiKey() !== null;
}

function googleProvider() {
  const apiKey = resolveGeminiKey();
  if (!apiKey) throw new MissingOpenAIKeyError();
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
  if (useGemini(projectId)) {
    return googleProvider()(process.env.CLARIX_CHAT_MODEL || "gemini-2.5-flash");
  }
  return getOpenAIProvider(projectId)(
    process.env.CLARIX_CHAT_MODEL || "gpt-4o"
  );
}

/** Cheap, fast model for auxiliary calls (interview composer). */
export function getFastModel(projectId: string): LanguageModel {
  if (useGemini(projectId)) {
    return googleProvider()(
      process.env.CLARIX_FAST_MODEL || "gemini-2.5-flash-lite"
    );
  }
  return getOpenAIProvider(projectId)(
    process.env.CLARIX_FAST_MODEL || "gpt-4o-mini"
  );
}

/** Embedding model for the RAG pipeline. */
export function getEmbeddingModel(projectId: string): EmbeddingModel {
  if (useGemini(projectId)) {
    return googleProvider().textEmbedding(
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
  return resolveOpenAIKey(projectId) !== null || resolveGeminiKey() !== null;
}
