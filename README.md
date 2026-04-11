# Clarix

An open-source AI customer support platform you can self-host in minutes.
Build a knowledge base, deploy a GPT-4o-powered chat agent that cites your
docs, and drop it on any site with a single `<script>` tag.

> Live demo: [clarix-rouge.vercel.app](https://clarix-rouge.vercel.app)

<br />

## What's in the box

- **Knowledge base** — Upload files, paste URLs, or write Markdown. Clarix
  parses, chunks, and embeds everything with `text-embedding-3-small`, then
  serves retrieval-augmented answers via GPT-4o.
- **Guided interview** — A Q&A composer that turns raw notes into polished
  Markdown KB entries, so non-technical teammates can contribute content.
- **Per-project OpenAI keys** — Bring your own key. Stored server-side per
  project, never sent back to the browser.
- **Streaming chat** — Real Vercel AI SDK streaming with source citations,
  quick-reply suggestions, and conversation persistence.
- **Embeddable widget** — A single script tag (`/widget.js`) drops the full
  chat experience on any website, framework, or CMS. Tested on Next.js,
  React/Vite, WordPress, Shopify, Webflow, Framer, and plain HTML.
- **Analytics** — Conversation volume, confidence scoring, knowledge gap
  detection, feedback capture, and rolling OpenAI token usage per project.
- **Command palette** — `⌘K` / `Ctrl+K` anywhere in the dashboard pops the
  topbar search and jumps to any page with arrow keys + enter.
- **Sand design system** — Warm, minimal UI built with Tailwind CSS v4 and
  Framer Motion. Dark on light, no gradients, no gimmicks.

<br />

## Tech stack

| Layer         | Choice                                            |
| ------------- | ------------------------------------------------- |
| Framework     | Next.js 16 (App Router) + React 19                |
| Language      | TypeScript                                        |
| Styling       | Tailwind CSS v4 + custom sand palette             |
| Animation     | Framer Motion                                     |
| AI SDK        | Vercel AI SDK v6 (`ai`, `@ai-sdk/openai`)         |
| LLM           | OpenAI GPT-4o                                     |
| Embeddings    | OpenAI `text-embedding-3-small`                   |
| Vector search | In-memory cosine similarity                       |
| Persistence   | Upstash Redis (optional) + in-memory fallback     |

<br />

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/your-user/clarix.git
cd clarix
npm install
```

### 2. Set your environment

Copy the example file:

```bash
cp .env.example .env.local
```

None of the variables are required for local development — Clarix will
happily run with an in-memory store and let you paste your OpenAI key
through the onboarding UI. But you'll probably want these set in
production:

| Variable                                             | Purpose                                                                                                          |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`                                     | Optional fallback key when a project has none saved yet. Users can still paste their own from Settings.          |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN`              | Upstash Redis credentials so projects, conversations, and embeddings survive server restarts.                    |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Aliases accepted as a fallback for the same Upstash database.                                                    |

### 3. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and walk through the
5-step onboarding. You'll be asked to paste an OpenAI API key —
[grab one here](https://platform.openai.com/api-keys) — and then you're off.

<br />

## Deploying to Vercel

1. Fork this repo and push it to your own GitHub account.
2. Import the project on [vercel.com/new](https://vercel.com/new).
3. (Optional) Add an Upstash Redis integration from the Vercel marketplace.
   It auto-fills `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
4. (Optional) Set a fallback `OPENAI_API_KEY` in Project Settings →
   Environment Variables.
5. Deploy. Visit the onboarding URL and paste your OpenAI key.

<br />

## Architecture at a glance

```
src/
├── app/
│   ├── api/                  # Route handlers (chat, knowledge, project, etc.)
│   ├── dashboard/            # Authenticated dashboard pages
│   ├── onboarding/           # 5-step getting-started flow
│   └── embed/                # Iframe target loaded by /public/widget.js
├── components/               # UI primitives + feature components
├── lib/
│   ├── ai/                   # OpenAI client, embeddings, RAG, prompts
│   ├── knowledge/            # Parser, chunker, scraper, processor pipeline
│   └── db/                   # Store, vector store, types, persistence
└── styles/
```

### The RAG pipeline

**Ingestion** — File / URL / text → parser → recursive chunker
(≈500 tokens, 100 overlap) → OpenAI embeddings → in-memory vector store.

**Retrieval** — User query → embedding → cosine top-k → augmented system
prompt with source citations → streaming GPT-4o response.

All OpenAI calls resolve the project's key via `lib/ai/client.ts` —
`getOpenAIProvider(projectId)` for chat, `getOpenAIClient(projectId)` for
embeddings. If a project has no key and no `OPENAI_API_KEY` is set in env,
the call throws a `MissingOpenAIKeyError` and the API route returns a clean
`400 { code: "missing_openai_key" }` that the UI can catch.

<br />

## Scripts

| Command         | What it does                           |
| --------------- | -------------------------------------- |
| `npm run dev`   | Start the dev server on port 3000      |
| `npm run build` | Production build                       |
| `npm run start` | Start the production server            |
| `npm run lint`  | ESLint with the Next.js config         |

<br />

## Contributing

PRs welcome. If you're adding a feature, please keep the knowledge-base
experience the hero of the product — it should feel effortless.

1. Fork the repo and create a feature branch.
2. Run `npm run lint` and `npm run build` before opening a PR.
3. Describe the user-facing change in the PR body. Screenshots or short
   screen recordings go a long way.

<br />

## License

MIT. See [LICENSE](./LICENSE).
