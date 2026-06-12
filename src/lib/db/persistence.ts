import { Redis } from "@upstash/redis";
import type {
  Project,
  KnowledgeCategory,
  KnowledgeSource,
  Chunk,
  Conversation,
  QueryEvent,
} from "./types";

/**
 * Redis-backed persistence for the in-memory store.
 *
 * Strategy: one blob, the entire store is serialized as a JSON object
 * under a single key. We hydrate on first access and debounce-write on
 * every mutation. It's not the most efficient approach, but for the
 * Clarix demo scale (hundreds of sources, thousands of messages) it
 * fits easily inside the Upstash free tier and avoids any schema work.
 *
 * Env vars, accepts either naming convention (Vercel's Upstash integration
 * uses the KV_* names, a hand-configured Upstash dashboard uses the
 * UPSTASH_* names; we try both):
 *   - KV_REST_API_URL / UPSTASH_REDIS_REST_URL
 *   - KV_REST_API_TOKEN / UPSTASH_REDIS_REST_TOKEN
 *
 * If neither pair is set, persistence silently no-ops so local dev
 * without Redis still works.
 */

export interface StoreSnapshot {
  version: 1;
  projects: Project[];
  categories: KnowledgeCategory[];
  sources: KnowledgeSource[];
  chunks: Chunk[];
  conversations: Conversation[];
  queryEvents: QueryEvent[];
}

const STATE_KEY = "clarix:state:v1";

let redis: Redis | null = null;
try {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
  }
} catch (err) {
  console.warn("[persistence] Failed to init Upstash Redis:", err);
}

export const isPersistenceEnabled = () => redis !== null;

export async function loadSnapshot(): Promise<StoreSnapshot | null> {
  if (!redis) return null;
  try {
    // Upstash auto-parses JSON; handle both shapes.
    const raw = await redis.get<StoreSnapshot | string>(STATE_KEY);
    if (!raw) return null;
    if (typeof raw === "string") {
      return JSON.parse(raw) as StoreSnapshot;
    }
    return raw;
  } catch (err) {
    console.warn("[persistence] loadSnapshot failed:", err);
    return null;
  }
}

export async function saveSnapshot(snapshot: StoreSnapshot): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(STATE_KEY, JSON.stringify(snapshot));
  } catch (err) {
    console.warn("[persistence] saveSnapshot failed:", err);
  }
}

export async function clearSnapshot(): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(STATE_KEY);
  } catch (err) {
    console.warn("[persistence] clearSnapshot failed:", err);
  }
}
