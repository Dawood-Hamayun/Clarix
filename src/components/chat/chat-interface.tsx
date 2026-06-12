"use client";

import { useRef, useEffect, useState, useMemo, Fragment } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Search,
  PenLine,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import type { ChatMessageMetadata } from "@/app/api/chat/route";
import type { SourceCitation } from "@/lib/db/types";

type ChatMessage = UIMessage<ChatMessageMetadata>;

interface ChatInterfaceProps {
  projectId?: string;
  conversationId?: string;
  /**
   * Messages to prefill the chat with on first mount. Used by pages that
   * hydrate a persisted conversation from the server so users don't lose
   * their thread when they navigate away and back.
   */
  initialMessages?: ChatMessage[];
  suggestions?: string[];
  compact?: boolean;
  onUserMessage?: (text: string) => void;
  /**
   * Optional title shown in the chat's top bar. When omitted no header
   * is rendered.
   */
  title?: string;
  /** Optional subtitle/status text shown beneath the title. */
  subtitle?: string;
  /**
   * Callback for the "Start fresh" button in the chat header. When
   * omitted the button is hidden.
   */
  onStartFresh?: () => void;
  /** Disables the Start fresh button (e.g. while a new thread is being created). */
  startFreshDisabled?: boolean;
  /** Agent display name, drives the avatar initial and greeting voice. */
  agentName?: string;
  /** Greeting shown as the agent's first bubble on an empty thread. */
  greeting?: string;
}

export function ChatInterface({
  projectId = "proj_demo",
  conversationId,
  initialMessages,
  suggestions = [],
  compact = false,
  onUserMessage,
  title,
  subtitle,
  onStartFresh,
  startFreshDisabled,
  agentName,
  greeting,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [activeSourceKey, setActiveSourceKey] = useState<string | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { projectId, conversationId },
      }),
    [projectId, conversationId]
  );

  // Key the useChat instance on conversationId + initialMessages identity so
  // switching conversations (or resetting to "fresh") starts with a clean
  // message list hydrated from the persisted thread.
  const chatKey = `${conversationId ?? "none"}:${initialMessages?.length ?? 0}`;
  const { messages, sendMessage, status } = useChat<ChatMessage>({
    id: chatKey,
    transport,
    messages: initialMessages,
  });

  const isSubmitted = status === "submitted";
  const isStreaming = status === "streaming";
  const isLoading = isSubmitted || isStreaming;

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, quickReplies]);

  // Generate quick replies after assistant finishes
  const lastMessage = messages[messages.length - 1];
  const lastMessageText =
    lastMessage?.role === "assistant"
      ? lastMessage.parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join("")
      : "";
  const shouldFetchReplies =
    status === "ready" &&
    lastMessage?.role === "assistant" &&
    lastMessageText.length > 0;

  useEffect(() => {
    if (!shouldFetchReplies) return;
    let cancelled = false;
    setLoadingReplies(true);
    setQuickReplies([]);

    const history = messages.slice(-4).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join(""),
    }));

    fetch("/api/quick-replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, projectId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setQuickReplies(data.suggestions || []);
      })
      .catch(() => {
        if (!cancelled) setQuickReplies([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingReplies(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage?.id, shouldFetchReplies]);


  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    onUserMessage?.(text);
    sendMessage({ text });
    setQuickReplies([]);
    setInput("");
  };

  const handleQuickReply = (text: string) => {
    if (isLoading) return;
    onUserMessage?.(text);
    sendMessage({ text });
    setQuickReplies([]);
  };

  // The last assistant message is "empty" until the model emits its first
  // text part. While it's empty we want to show the writing indicator instead
  // of an empty bubble.
  const lastAssistantEmpty =
    isStreaming &&
    lastMessage?.role === "assistant" &&
    lastMessageText.length === 0;

  const showHeader = Boolean(title || onStartFresh);

  return (
    <div
      className={`flex flex-col bg-white border border-sand-200 rounded-2xl overflow-hidden shadow-sand ${
        compact ? "h-[560px]" : "h-[calc(100vh-10rem)] sm:h-[calc(100vh-14rem)] min-h-[480px]"
      }`}
    >
      {showHeader && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-sand-200 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <AgentAvatar name={agentName} className="w-8 h-8" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-status-success border-2 border-white" />
            </div>
            <div className="min-w-0">
              {(agentName || title) && (
                <p className="text-sm font-semibold text-sand-900 tracking-tight truncate">
                  {agentName || title}
                </p>
              )}
              <p className="text-xs text-sand-500 mt-0.5 truncate">
                {subtitle || "Online · replies in seconds"}
              </p>
            </div>
          </div>
          {onStartFresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onStartFresh}
              disabled={startFreshDisabled}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Start fresh
            </Button>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-sand-50">
        {messages.length === 0 ? (
          <GreetingBlock
            agentName={agentName}
            greeting={greeting}
            suggestions={suggestions}
            onPick={handleQuickReply}
          />
        ) : (
          <div className="min-h-full flex flex-col justify-end p-6 space-y-5">
            <AnimatePresence initial={false}>
              {messages.map((message) => {
                // Skip rendering an assistant bubble while it has no text yet
                // (prevents the brief empty-bubble flash on stream start).
                const text = message.parts
                  .filter(
                    (p): p is { type: "text"; text: string } =>
                      p.type === "text"
                  )
                  .map((p) => p.text)
                  .join("");
                if (message.role === "assistant" && text.length === 0) {
                  return null;
                }
                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    activeSourceKey={activeSourceKey}
                    setActiveSourceKey={setActiveSourceKey}
                    agentName={agentName}
                  />
                );
              })}
            </AnimatePresence>

            {/* Agent state indicator, single bubble, never overlaps with the
                actual response. Shown while submitted (searching) or while
                the assistant message exists but has no text yet (writing). */}
            <AnimatePresence>
              {isSubmitted && (
                <AgentStateBubble stage="searching" agentName={agentName} />
              )}
              {lastAssistantEmpty && (
                <AgentStateBubble stage="writing" agentName={agentName} />
              )}
            </AnimatePresence>

            {/* Quick replies */}
            <AnimatePresence>
              {quickReplies.length > 0 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-wrap gap-2 pl-1"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-sand-400 self-center mr-1">
                    Suggested
                  </span>
                  {quickReplies.map((s, i) => (
                    <motion.button
                      key={`${s}-${i}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleQuickReply(s)}
                      className="text-xs font-semibold tracking-tight bg-white border border-sand-200 text-sand-700 px-3 py-1.5 rounded-full hover:border-sand-900 hover:bg-sand-900 hover:text-white transition-all"
                    >
                      {s}
                    </motion.button>
                  ))}
                </motion.div>
              )}
              {loadingReplies && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] text-sand-400 pl-1"
                >
                  thinking of follow-ups...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-sand-200 px-5 py-4 bg-white">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-end gap-2 bg-sand-100 border border-sand-200 rounded-2xl px-4 py-3 focus-within:border-sand-900 focus-within:ring-2 focus-within:ring-sand-900/10 transition-all"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask anything…"
            rows={1}
            className="flex-1 bg-transparent text-[0.9375rem] text-sand-900 placeholder:text-sand-400 focus:outline-none resize-none max-h-40 leading-6 py-1"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 w-9 h-9 rounded-xl"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-[10px] text-sand-400 mt-2 px-1 text-center">
          <span className="font-mono uppercase tracking-[0.14em]">
            Powered by Clarix
          </span>
          {" · "}Enter to send
        </p>
      </div>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

/** Small circular avatar for the agent, uses the first letter of its name. */
function AgentAvatar({ name, className = "w-7 h-7" }: { name?: string; className?: string }) {
  const initial = (name?.trim()[0] || "✳").toUpperCase();
  return (
    <div
      className={`${className} rounded-full bg-sand-900 text-white flex items-center justify-center text-xs font-bold select-none shrink-0`}
    >
      {initial}
    </div>
  );
}

/**
 * Empty-thread opener. Instead of a blank panel, the agent speaks first:
 * a greeting bubble plus tappable starter questions that send immediately,
 * so the first interaction already feels like a conversation.
 */
function GreetingBlock({
  agentName,
  greeting,
  suggestions,
  onPick,
}: {
  agentName?: string;
  greeting?: string;
  suggestions: string[];
  onPick: (s: string) => void;
}) {
  const text =
    greeting ||
    (agentName
      ? `Hi! I'm ${agentName}. Ask me anything, every answer comes straight from your knowledge.`
      : "Hi! Ask me anything, every answer comes straight from your knowledge.");
  return (
    <div className="min-h-full flex flex-col justify-end p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex items-start gap-2.5"
      >
        <AgentAvatar name={agentName} className="w-7 h-7 mt-1" />
        <div className="max-w-[85%] bg-white border border-sand-200 shadow-sand rounded-2xl rounded-bl-md px-4 py-3">
          <p className="text-[0.9375rem] text-sand-800 leading-relaxed">
            {text}
          </p>
        </div>
      </motion.div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pl-10">
          {suggestions.map((s, i) => (
            <motion.button
              key={s}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.07 }}
              onClick={() => onPick(s)}
              className="text-xs font-semibold tracking-tight bg-white border border-sand-200 text-sand-700 px-3.5 py-2 rounded-full hover:bg-sand-900 hover:border-sand-900 hover:text-white transition-colors shadow-sand"
            >
              {s}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

function AgentStateBubble({
  stage,
  agentName,
}: {
  stage: "searching" | "writing";
  agentName?: string;
}) {
  const label =
    stage === "searching" ? "Looking it up…" : "Typing…";
  const Icon = stage === "searching" ? Search : PenLine;

  return (
    <motion.div
      className="flex justify-start items-start gap-2.5"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <AgentAvatar name={agentName} className="w-7 h-7 mt-0.5" />
      <div className="bg-white border border-sand-200 shadow-sand rounded-2xl rounded-bl-md px-4 py-2.5 flex items-center gap-2.5">
        <motion.div
          animate={{ rotate: stage === "searching" ? 360 : 0 }}
          transition={{
            duration: 2,
            repeat: stage === "searching" ? Infinity : 0,
            ease: "linear",
          }}
        >
          <Icon className="w-3.5 h-3.5 text-sand-600" />
        </motion.div>
        <span className="text-xs font-semibold text-sand-700 tracking-tight">
          {label}
        </span>
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 rounded-full bg-sand-500"
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 0.7,
                repeat: Infinity,
                delay: i * 0.12,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function MessageBubble({
  message,
  activeSourceKey,
  setActiveSourceKey,
  agentName,
}: {
  message: ChatMessage;
  activeSourceKey: string | null;
  setActiveSourceKey: (k: string | null) => void;
  agentName?: string;
}) {
  const text = message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

  if (message.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] bg-sand-900 text-white rounded-2xl rounded-br-md px-4 py-3">
          <p className="text-[0.9375rem] whitespace-pre-wrap leading-relaxed">
            {text}
          </p>
        </div>
      </motion.div>
    );
  }

  const metadata = message.metadata;
  const sources = metadata?.sources ?? [];
  const confidence = metadata?.confidence;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex justify-start items-start gap-2.5"
    >
      <AgentAvatar name={agentName} className="w-7 h-7 mt-1" />
      <div className="max-w-[85%] w-fit min-w-0">
        <div className="bg-white border border-sand-200 shadow-sand text-sand-900 rounded-2xl rounded-bl-md px-4 py-3">
          <CitedMarkdown text={text} sources={sources} />

          {/* Sources list */}
          {sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-sand-200 space-y-1.5">
              {sources.map((src, i) => {
                const key = `${message.id}-${i}`;
                const isActive = activeSourceKey === key;
                return (
                  <motion.div
                    key={src.chunkId + i}
                    initial={false}
                    animate={{
                      backgroundColor: isActive
                        ? "rgba(24,24,27,0.06)"
                        : "rgba(24,24,27,0)",
                    }}
                    className="rounded-lg px-2 py-1"
                  >
                    <button
                      onClick={() =>
                        setActiveSourceKey(isActive ? null : key)
                      }
                      className="w-full flex items-start gap-2 text-left"
                    >
                      <span className="shrink-0 mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-md bg-sand-900 text-white text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-sand-900 truncate">
                          {src.sourceName}
                        </div>
                        <AnimatePresence initial={false}>
                          {isActive && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <p className="text-[11px] text-sand-600 mt-1 leading-relaxed">
                                {src.excerpt}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <span className="text-[10px] font-mono text-sand-500 shrink-0">
                        {Math.round(src.relevanceScore * 100)}%
                      </span>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {confidence !== undefined && (
          <div className="flex items-center gap-2 mt-2 px-1">
            <ConfidenceBadge confidence={confidence} count={sources.length} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ConfidenceBadge({
  confidence,
  count,
}: {
  confidence: number;
  count: number;
}) {
  const level =
    confidence >= 0.7 ? "high" : confidence >= 0.4 ? "medium" : "low";
  const cfg = {
    high: {
      icon: ShieldCheck,
      label: "High confidence",
      cls: "bg-status-success/10 text-status-success border-status-success/20",
    },
    medium: {
      icon: Shield,
      label: "Moderate confidence",
      cls: "bg-sand-100 text-sand-700 border-sand-200",
    },
    low: {
      icon: ShieldAlert,
      label: "Low confidence",
      cls: "bg-status-error/10 text-status-error border-status-error/20",
    },
  }[level];
  const Icon = cfg.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-tight ${cfg.cls}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
      {count > 0 && (
        <span className="opacity-70">
          · {count} source{count !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

function CitedMarkdown({
  text,
  sources,
}: {
  text: string;
  sources: SourceCitation[];
}) {
  // Render inline [N] markers as styled code pills by wrapping them with backticks.
  // This is cheap, streaming-safe, and lets the existing prose stylesheet
  // handle the look. The numbered source list below is where clicks happen.
  if (sources.length === 0) {
    return <MarkdownRenderer content={text} variant="compact" />;
  }

  const transformed = text.replace(/\[(\d+)\]/g, (_, n) => {
    const idx = parseInt(n, 10);
    if (idx >= 1 && idx <= sources.length) {
      return `\`[${n}]\``;
    }
    return `[${n}]`;
  });

  return <MarkdownRenderer content={transformed} variant="compact" />;
}

// Ensure Fragment import stays used
void Fragment;
