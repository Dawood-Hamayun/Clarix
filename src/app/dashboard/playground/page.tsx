"use client";

import { ChatInterface } from "@/components/chat/chat-interface";
import { useEffect, useState } from "react";
import type {
  Conversation,
  KnowledgeSource,
  SourceCitation,
} from "@/lib/db/types";
import type { UIMessage } from "ai";
import type { ChatMessageMetadata } from "@/app/api/chat/route";
import {
  BookOpen,
  AlertCircle,
  Target,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type ChatMessage = UIMessage<ChatMessageMetadata>;

// Scoped to the browser session so navigating between tabs reuses the same
// server-side conversation (and its full message history). Closing the tab
// clears it, so every new visit gets a fresh thread.
const STORAGE_KEY = "clarix:playground:conversationId:proj_demo";

/**
 * Hydrate the thread the Playground left behind. Returns both the live
 * conversationId and the persisted messages re-shaped into the UIMessage
 * format the chat hook expects. Any failure (404, corrupt id, etc.) falls
 * back to a brand-new conversation.
 */
async function loadPlaygroundThread(): Promise<{
  conversationId: string;
  initialMessages: ChatMessage[];
}> {
  const storedId =
    typeof window !== "undefined"
      ? window.sessionStorage.getItem(STORAGE_KEY)
      : null;

  if (storedId) {
    try {
      const res = await fetch(
        `/api/conversations/${encodeURIComponent(storedId)}`
      );
      if (res.ok) {
        const conv: Conversation = await res.json();
        return {
          conversationId: conv.id,
          initialMessages: conv.messages.map((m) => ({
            id: m.id,
            role: m.role,
            parts: [{ type: "text", text: m.content }],
            metadata: m.sources ? { sources: m.sources } : undefined,
          })) as ChatMessage[],
        };
      }
    } catch {
      /* fall through to create a new conversation */
    }
  }

  const created = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId: "proj_demo" }),
  }).then((r) => r.json() as Promise<Conversation>);

  window.sessionStorage.setItem(STORAGE_KEY, created.id);
  return { conversationId: created.id, initialMessages: [] };
}

export default function PlaygroundPage() {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [retrieved, setRetrieved] = useState<SourceCitation[]>([]);
  const [retrieving, setRetrieving] = useState(false);
  const [lastQuery, setLastQuery] = useState<string>("");
  const [conversationId, setConversationId] = useState<string | undefined>(
    undefined
  );
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [hydrating, setHydrating] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/knowledge")
      .then((r) => r.json())
      .then(setSources);

    // Starter questions are generated from the live KB so they're always
    // answerable — see /api/starter-suggestions. No more "how does this
    // work?" prompts that send the agent into meta territory.
    fetch("/api/starter-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: "proj_demo" }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.suggestions)) setSuggestions(data.suggestions);
      })
      .catch(() => {
        /* fall back to empty — EmptyState just hides them */
      });

    let cancelled = false;
    loadPlaygroundThread()
      .then(({ conversationId: id, initialMessages: msgs }) => {
        if (cancelled) return;
        setConversationId(id);
        setInitialMessages(msgs);
        setHydrating(false);
      })
      .catch(() => {
        if (!cancelled) setHydrating(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleStartFresh = async () => {
    setHydrating(true);
    window.sessionStorage.removeItem(STORAGE_KEY);
    try {
      const created: Conversation = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: "proj_demo" }),
      }).then((r) => r.json());
      window.sessionStorage.setItem(STORAGE_KEY, created.id);
      setConversationId(created.id);
      setInitialMessages([]);
      setRetrieved([]);
      setLastQuery("");
    } finally {
      setHydrating(false);
    }
  };

  const readySources = sources.filter((s) => s.status === "ready");
  const totalChunks = readySources.reduce(
    (sum, s) => sum + s.metadata.chunkCount,
    0
  );

  const handleUserMessage = async (text: string) => {
    setLastQuery(text);
    setRetrieving(true);
    try {
      const res = await fetch("/api/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, projectId: "proj_demo" }),
      });
      const data = await res.json();
      setRetrieved(data.sources || []);
    } catch {
      setRetrieved([]);
    } finally {
      setRetrieving(false);
    }
  };

  const headerSubtitle = hydrating
    ? "Restoring your session…"
    : initialMessages.length > 0
      ? `Continuing your session · ${initialMessages.length} message${
          initialMessages.length === 1 ? "" : "s"
        }`
      : "New session — ask anything to get started";

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat */}
        <div className="lg:col-span-2">
          {!hydrating && (
            <ChatInterface
              conversationId={conversationId}
              initialMessages={initialMessages}
              suggestions={suggestions}
              onUserMessage={handleUserMessage}
              title="Playground"
              subtitle={headerSubtitle}
              onStartFresh={handleStartFresh}
              startFreshDisabled={hydrating}
            />
          )}
          {hydrating && (
            <div className="h-[calc(100vh-14rem)] min-h-[480px] bg-white border border-sand-200 rounded-2xl shadow-sand animate-pulse" />
          )}
        </div>

        {/* Sidebar — order is intentional: the live retrieval inspector
            sits at the top because it's the only panel that changes
            with each question. The static "How it works" rationale and
            the KB summary live below so they don't push real-time
            information off screen. */}
        <div className="flex flex-col gap-4 h-[calc(100vh-14rem)] min-h-[480px]">
          {/* 1. Retrieved sources — primary, flex-1 */}
          <div className="bg-sand-100 border border-sand-200 rounded-xl overflow-hidden flex-1 min-h-0 flex flex-col">
            <div className="px-5 pt-5 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-warm-orange" />
                <h3 className="text-sm font-semibold text-sand-900">
                  Retrieved sources
                </h3>
                {retrieving && (
                  <Loader2 className="w-3.5 h-3.5 text-sand-400 animate-spin ml-auto" />
                )}
                {!retrieving && retrieved.length > 0 && (
                  <span className="ml-auto text-[10px] font-mono text-sand-500 bg-white border border-sand-200 px-1.5 py-0.5 rounded">
                    {retrieved.length}
                  </span>
                )}
              </div>

              {lastQuery && (
                <div className="text-xs text-sand-500 mt-2 italic line-clamp-2">
                  For: &ldquo;{lastQuery}&rdquo;
                </div>
              )}
            </div>

            <div className="px-5 pb-5 flex-1 min-h-0 overflow-y-auto">
              <AnimatePresence mode="wait">
                {retrieved.length > 0 ? (
                  <motion.div
                    key="results"
                    className="space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {retrieved.map((src, i) => (
                      <motion.div
                        key={src.chunkId}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <Link
                          href={`/dashboard/knowledge/${src.sourceId}`}
                          className="block bg-white border border-sand-200 rounded-lg p-3 hover:border-sand-400 hover:shadow-sand transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs font-semibold text-sand-900 truncate group-hover:text-warm-orange transition-colors">
                              {src.sourceName}
                            </span>
                            <span className="text-[10px] font-mono text-sand-600 bg-sand-100 px-1.5 py-0.5 rounded shrink-0">
                              {(src.relevanceScore * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-[11px] text-sand-500 line-clamp-2 leading-relaxed">
                            {src.excerpt}
                          </p>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.p
                    key="empty"
                    className="text-xs text-sand-400 italic"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {lastQuery
                      ? "No relevant chunks found."
                      : "Ask a question to see which sources were fetched."}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 2. How it works */}
          <div className="bg-sand-100 border border-sand-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-sand-900 mb-2">
              How it works
            </h3>
            <ol className="space-y-2 text-xs text-sand-600">
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-warm-orange-light text-warm-orange text-xs flex items-center justify-center shrink-0 font-medium">
                  1
                </span>
                Your question gets embedded into a vector
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-warm-orange-light text-warm-orange text-xs flex items-center justify-center shrink-0 font-medium">
                  2
                </span>
                We find the most relevant chunks from your KB
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-warm-orange-light text-warm-orange text-xs flex items-center justify-center shrink-0 font-medium">
                  3
                </span>
                GPT-4o answers using only that context
              </li>
            </ol>
          </div>

          {/* 3. Knowledge Base summary */}
          <div className="bg-sand-100 border border-sand-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-warm-orange" />
              <h3 className="text-sm font-semibold text-sand-900">
                Knowledge Base
              </h3>
            </div>

            {readySources.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-sand-200">
                  <p className="text-2xl font-bold text-sand-900">
                    {readySources.length}
                  </p>
                  <p className="text-xs text-sand-500">Sources</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-sand-200">
                  <p className="text-2xl font-bold text-sand-900">
                    {totalChunks}
                  </p>
                  <p className="text-xs text-sand-500">Chunks</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <AlertCircle className="w-8 h-8 text-sand-300 mx-auto mb-2" />
                <p className="text-xs text-sand-500 mb-3">
                  No knowledge sources yet. Add content to test the AI.
                </p>
                <Link href="/dashboard/knowledge/new">
                  <Button size="sm">Add Source</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
