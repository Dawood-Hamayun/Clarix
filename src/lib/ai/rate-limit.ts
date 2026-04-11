/**
 * Tiny in-memory sliding-window rate limiter for the chat endpoint.
 *
 * Clarix is self-hosted and the widget can be embedded on any public
 * site — which means the OpenAI key attached to a project could be
 * drained by a bot hammering /api/chat on a customer's homepage. This
 * limiter is the first line of defense: it caps how many messages a
 * single conversation (or an anonymous caller without one) can fire
 * per minute.
 *
 * Knobs via env:
 *   CLARIX_CHAT_RATE_LIMIT     — max messages per window (default 30)
 *   CLARIX_CHAT_RATE_WINDOW_MS — window size in ms      (default 60000)
 *   CLARIX_CHAT_RATE_DISABLED  — set to "1" to turn off (not recommended)
 *
 * This is intentionally in-memory. A self-hosted single-instance
 * deployment doesn't need Redis for this; a multi-instance deployment
 * should front the app with an HTTP-level limiter (Cloudflare, Vercel,
 * nginx) — this limiter just stops trivial abuse on the hot path.
 */

const WINDOW_MS = Number(process.env.CLARIX_CHAT_RATE_WINDOW_MS ?? 60_000);
const LIMIT = Number(process.env.CLARIX_CHAT_RATE_LIMIT ?? 30);
const DISABLED = process.env.CLARIX_CHAT_RATE_DISABLED === "1";

type Bucket = { timestamps: number[] };

// One bucket per key. Keys look like "conv:<id>" for known conversations
// and "ip:<addr>" for anonymous callers.
const buckets = new Map<string, Bucket>();

// Lazy cleanup — on each hit we prune any buckets that haven't been
// touched in 5 minutes so the map doesn't grow unbounded on a noisy
// public widget. No background timer needed.
let lastPrune = Date.now();
const PRUNE_EVERY_MS = 5 * 60 * 1000;

function maybePrune(now: number) {
  if (now - lastPrune < PRUNE_EVERY_MS) return;
  lastPrune = now;
  for (const [key, bucket] of buckets.entries()) {
    const fresh = bucket.timestamps.filter((t) => now - t < WINDOW_MS);
    if (fresh.length === 0) buckets.delete(key);
    else bucket.timestamps = fresh;
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  limit: number;
  /** Seconds until the oldest in-window hit falls off. */
  retryAfterSeconds: number;
}

export function checkChatRateLimit(key: string): RateLimitResult {
  if (DISABLED) {
    return { ok: true, remaining: LIMIT, limit: LIMIT, retryAfterSeconds: 0 };
  }
  const now = Date.now();
  maybePrune(now);

  const bucket = buckets.get(key) ?? { timestamps: [] };
  // Drop anything outside the sliding window
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS);

  if (bucket.timestamps.length >= LIMIT) {
    const oldest = bucket.timestamps[0];
    const retryMs = WINDOW_MS - (now - oldest);
    buckets.set(key, bucket);
    return {
      ok: false,
      remaining: 0,
      limit: LIMIT,
      retryAfterSeconds: Math.max(1, Math.ceil(retryMs / 1000)),
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return {
    ok: true,
    remaining: LIMIT - bucket.timestamps.length,
    limit: LIMIT,
    retryAfterSeconds: 0,
  };
}

/**
 * Derive a stable rate-limit key from the request. Prefers
 * conversationId (most specific) and falls back to the client IP.
 */
export function rateLimitKey(
  req: Request,
  conversationId: string | undefined
): string {
  if (conversationId) return `conv:${conversationId}`;
  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip = fwd.split(",")[0]?.trim() || "unknown";
  return `ip:${ip}`;
}
