/**
 * Pre-compute the demo knowledge base ONCE and bake it into the repo.
 *
 * Why: the demo KB used to be embedded at runtime (POST /api/demo/seed) and
 * only survived if Upstash Redis was configured. Without Redis the chunks +
 * vectors vanished on every server restart, so the Acme demo kept "losing"
 * its data. This script runs the exact same chunk -> embed pipeline offline
 * and writes the vectors to src/lib/db/demo-kb.json, which the store loads
 * deterministically on boot. No runtime embedding, no Redis, always present.
 *
 * Run:  node --experimental-strip-types scripts/build-demo-kb.ts
 * Re-run only if you change DEMO_SOURCES or switch embedding providers.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { DEMO_SOURCES } from "../src/lib/db/demo-data.ts";
import { chunkText } from "../src/lib/knowledge/chunker.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const MODEL = "text-embedding-3-small";

function readEnvKey(): string {
  const env = readFileSync(join(ROOT, ".env.local"), "utf8");
  const m = env.match(/^OPENAI_API_KEY=(.+)$/m);
  const key = m?.[1]?.trim();
  if (!key) throw new Error("OPENAI_API_KEY not found in .env.local");
  return key;
}

async function embedBatch(inputs: string[], key: string): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, input: inputs.map((t) => t.slice(0, 8000)) }),
  });
  if (!res.ok) throw new Error(`OpenAI embeddings failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { data: { embedding: number[]; index: number }[] };
  return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

async function main() {
  const key = readEnvKey();

  type OutChunk = { content: string; heading?: string; position: number; embedding: number[] };
  type OutSource = { name: string; categorySlug: string; content: string; chunks: OutChunk[] };
  const sources: OutSource[] = [];
  let total = 0;

  for (const src of DEMO_SOURCES) {
    const chunks = chunkText(src.content);
    const embeddings = await embedBatch(chunks.map((c) => c.content), key);
    sources.push({
      name: src.name,
      categorySlug: src.categorySlug,
      content: src.content,
      chunks: chunks.map((c, i) => ({
        content: c.content,
        heading: c.heading,
        position: c.position,
        embedding: embeddings[i],
      })),
    });
    total += chunks.length;
    process.stdout.write(`  ${src.name}: ${chunks.length} chunks\n`);
  }

  const dims = sources[0]?.chunks[0]?.embedding.length ?? 0;
  const out = {
    provider: "openai",
    model: MODEL,
    dims,
    sourceCount: sources.length,
    chunkCount: total,
    sources,
  };

  const outPath = join(ROOT, "src/lib/db/demo-kb.json");
  writeFileSync(outPath, JSON.stringify(out));
  console.log(`\n✓ Wrote ${sources.length} sources, ${total} chunks (${dims}-dim) to demo-kb.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
