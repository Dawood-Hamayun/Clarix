"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  MessageSquare,
  Send,
  Sparkles,
  X,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import type { PublicProject, WidgetConfig } from "@/lib/db/types";
import type { ChatMessageMetadata } from "@/app/api/chat/route";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

type ChatMessage = UIMessage<ChatMessageMetadata>;

interface FeedbackState {
  rating: "up" | "down";
}

/**
 * Embeddable chat widget. Rendered inside an iframe injected by
 * /public/widget.js. Reads project config directly from the API so the
 * widget theme stays in sync with the dashboard without any redeploy.
 *
 * Sends postMessage to the parent window ({ type: "clarix", action })
 * so the parent iframe can resize itself open/closed.
 */
export default function EmbedWidgetPage() {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [projectId, setProjectId] = useState<string>("proj_demo");
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">(
    "bottom-right"
  );
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 520);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // The shared root layout paints the body with the sand-50 background,
  // which shows up as a white square inside the iframe on customer sites.
  // Force the embed route to use a transparent html/body so only the
  // widget shell itself is visible.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.background;
    const prevBody = body.style.background;
    html.style.background = "transparent";
    body.style.background = "transparent";
    return () => {
      html.style.background = prevHtml;
      body.style.background = prevBody;
    };
  }, []);

  // Read ?project=... from the URL, then fetch project config.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("project") || "proj_demo";
    setProjectId(pid);
    const pos = params.get("position");
    if (pos === "bottom-left") setPosition("bottom-left");

    fetch(`/api/project?projectId=${encodeURIComponent(pid)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p: PublicProject | null) => {
        if (p) setConfig(p.widgetConfig);
      })
      .catch(() => {
        // Silent, leave config null so we render a safe fallback.
      });
  }, []);

  // Notify parent when open state toggles so it can grow/shrink the iframe.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.parent?.postMessage(
      { type: "clarix", action: open ? "open" : "close" },
      "*"
    );
  }, [open]);

  // Listen for host-driven open/close (window.Clarix.open() from the parent).
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as { type?: string; action?: string } | null;
      if (!data || data.type !== "clarix-host") return;
      if (data.action === "open") setOpen(true);
      else if (data.action === "close") setOpen(false);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const radiusClass = useMemo(() => {
    switch (config?.radius) {
      case "sharp":
        return "rounded-md";
      case "round":
        return "rounded-3xl";
      default:
        return "rounded-2xl";
    }
  }, [config?.radius]);

  const primaryColor = config?.primaryColor || "#18181B";
  const companyName = config?.companyName || "Support";
  const greeting = config?.greeting || "Hi! How can I help you today?";
  const launcherLabel = config?.launcherLabel || "Chat with us";

  // When the panel is open on mobile we stretch the flex container so the
  // ChatPanel can fill the whole iframe. Otherwise it hugs the bottom edge
  // and the corner matching the configured position.
  const stretch = open && isMobile;
  const alignClass = stretch
    ? "items-stretch"
    : position === "bottom-left"
      ? "items-start"
      : "items-end";

  return (
    <div
      className={`fixed inset-0 flex flex-col justify-end ${alignClass} p-0`}
      style={{ background: "transparent" }}
    >
      {/*
        ChatPanel stays mounted for the life of the widget so useChat
        state (messages, streaming status, transport, conversation id)
        persists across open/close. Previously we remounted on every
        close/reopen, which was why conversations appeared to disappear
        then reappear only after sending a new message, the mount order
        raced the hydration fetch. Visibility is now a pure CSS toggle.
      */}
      <ChatPanel
        projectId={projectId}
        primaryColor={primaryColor}
        companyName={companyName}
        greeting={greeting}
        radiusClass={radiusClass}
        isMobile={isMobile}
        visible={open}
        onClose={() => setOpen(false)}
      />
      {!open && (
        <Launcher
          primaryColor={primaryColor}
          label={launcherLabel}
          position={position}
          onOpen={() => setOpen(true)}
        />
      )}
    </div>
  );
}

/* ---------- Launcher ---------- */

function Launcher({
  primaryColor,
  label,
  position,
  onOpen,
}: {
  primaryColor: string;
  label: string;
  position: "bottom-right" | "bottom-left";
  onOpen: () => void;
}) {
  const button = (
    <button
      onClick={onOpen}
      aria-label="Open chat"
      className="w-12 h-12 rounded-full flex items-center justify-center shadow-sand-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer"
      style={{ backgroundColor: primaryColor }}
    >
      <MessageSquare className="w-5 h-5 text-white" />
    </button>
  );
  const pill = (
    <div className="bg-white border border-sand-200 rounded-full px-3 py-1.5 text-xs font-semibold text-sand-800 shadow-sand-md tracking-tight">
      {label}
    </div>
  );
  return (
    <div className="flex items-center gap-2 p-4">
      {position === "bottom-left" ? (
        <>
          {button}
          {pill}
        </>
      ) : (
        <>
          {pill}
          {button}
        </>
      )}
    </div>
  );
}

/* ---------- Chat panel ---------- */

function ChatPanel({
  projectId,
  primaryColor,
  companyName,
  greeting,
  radiusClass,
  isMobile,
  visible,
  onClose,
}: {
  projectId: string;
  primaryColor: string;
  companyName: string;
  greeting: string;
  radiusClass: string;
  isMobile: boolean;
  visible: boolean;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>(
    undefined
  );
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, FeedbackState>>({});
  const [endPrompt, setEndPrompt] = useState<"idle" | "asking" | "done">(
    "idle"
  );
  const [resolution, setResolution] = useState<"resolved" | "unresolved" | null>(
    null
  );

  // Reuse the same conversationId for the lifetime of the browser session
  // so closing and reopening the widget (or navigating between pages on the
  // host site) keeps the chat thread intact. Closing the tab resets it.
  const storageKey = `clarix:widget:conversationId:${projectId}`;

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      // 1. Try to resume an existing session
      const storedId =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(storageKey)
          : null;

      if (storedId) {
        try {
          const res = await fetch(
            `/api/conversations/${encodeURIComponent(storedId)}`
          );
          if (res.ok) {
            const conv = await res.json();
            if (cancelled) return;
            setConversationId(conv.id);
            setInitialMessages(
              (conv.messages as Array<{
                id: string;
                role: "user" | "assistant";
                content: string;
                sources?: unknown;
              }>).map((m) => ({
                id: m.id,
                role: m.role,
                parts: [{ type: "text", text: m.content }],
              })) as ChatMessage[]
            );
            setHydrated(true);
            return;
          }
        } catch {
          /* fall through */
        }
      }

      // 2. Create a fresh one
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId }),
        });
        const conv = await res.json();
        if (cancelled) return;
        if (conv?.id) {
          setConversationId(conv.id);
          window.sessionStorage.setItem(storageKey, conv.id);
        }
      } catch {
        /* silent, the widget still renders, just no persistence */
      }
      setHydrated(true);
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [projectId, storageKey]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { projectId, conversationId },
      }),
    [projectId, conversationId]
  );

  // Stable chat id, only re-mounts when conversationId actually changes,
  // not on every hydration tick. Previously we included
  // `initialMessages.length` in the key, which meant every append would
  // remount useChat and wipe its in-memory message buffer mid-stream.
  const { messages, sendMessage, status } = useChat<ChatMessage>({
    id: conversationId ?? "pending",
    transport,
    messages: hydrated ? initialMessages : undefined,
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, endPrompt]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    // Sending a new message cancels any pending resolution prompt and
    // clears the "done" banner so the conversation flows again.
    if (endPrompt !== "idle") setEndPrompt("idle");
    if (resolution) setResolution(null);
    sendMessage({ text });
    setInput("");
  };

  const submitFeedback = async (eventId: string, rating: "up" | "down") => {
    setFeedback((prev) => ({ ...prev, [eventId]: { rating } }));
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, rating }),
      });
    } catch {
      /* best-effort */
    }
  };

  const submitResolution = async (resolved: boolean) => {
    if (!conversationId) return;
    setResolution(resolved ? "resolved" : "unresolved");
    setEndPrompt("done");
    try {
      await fetch(
        `/api/conversations/${encodeURIComponent(conversationId)}/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resolved }),
        }
      );
    } catch {
      /* best-effort */
    }
  };

  const startFresh = async () => {
    // Clear the session-scoped id and create a new conversation so the
    // widget starts from scratch. Useful after an "End chat" so the
    // next visit begins clean without a full browser refresh.
    try {
      window.sessionStorage.removeItem(storageKey);
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const conv = await res.json();
      if (conv?.id) {
        window.sessionStorage.setItem(storageKey, conv.id);
        setConversationId(conv.id);
        setInitialMessages([]);
        setFeedback({});
        setEndPrompt("idle");
        setResolution(null);
      }
    } catch {
      /* silent */
    }
  };

  // On mobile, the loader iframe spans the full viewport width, so we drop
  // the max-width, the margin, and the rounded corners to get a true
  // edge-to-edge panel that doesn't look like a floating card on a phone.
  return (
    <div
      className={`bg-white border-sand-200 shadow-sand-lg overflow-hidden flex flex-col ${
        isMobile
          ? "w-full h-full border-t"
          : `w-full h-full max-w-sm border ${radiusClass}`
      }`}
      style={{
        ...(isMobile
          ? { maxHeight: "100vh" }
          : { maxHeight: "calc(100vh - 32px)", margin: 16 }),
        // Hiding via style keeps the component mounted (and useChat state
        // alive) while removing it from the layout so the launcher shows.
        display: visible ? "flex" : "none",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2 shrink-0"
        style={{ backgroundColor: primaryColor }}
      >
        <Sparkles className="w-4 h-4 text-white" />
        <span className="text-sm font-semibold text-white tracking-tight flex-1 truncate">
          {companyName}
        </span>
        {messages.length > 0 && endPrompt === "idle" && (
          <button
            onClick={() => setEndPrompt("asking")}
            className="text-[11px] font-semibold text-white/85 hover:text-white px-2 py-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            title="End this chat"
          >
            End chat
          </button>
        )}
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="w-7 h-7 rounded-lg text-white/80 hover:bg-white/15 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 bg-sand-50"
      >
        {messages.length === 0 ? (
          <GreetingBubble greeting={greeting} primaryColor={primaryColor} />
        ) : (
          <div className="space-y-3">
            <GreetingBubble greeting={greeting} primaryColor={primaryColor} />
            {messages.map((m) => (
              <Bubble
                key={m.id}
                message={m}
                primaryColor={primaryColor}
                feedback={feedback}
                onFeedback={submitFeedback}
              />
            ))}
            {status === "submitted" && <TypingBubble />}

            {/* End-of-chat resolution prompt */}
            {endPrompt === "asking" && !isLoading && (
              <ResolutionPrompt
                primaryColor={primaryColor}
                onAnswer={submitResolution}
                onCancel={() => setEndPrompt("idle")}
              />
            )}
            {endPrompt === "done" && (
              <ResolutionDone
                resolution={resolution}
                onStartFresh={startFresh}
              />
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-sand-200 p-3 bg-white flex items-end gap-2 shrink-0"
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
          placeholder="Type a message…"
          rows={1}
          disabled={isLoading}
          className="flex-1 bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-sm text-sand-900 placeholder:text-sand-400 focus:border-sand-900 focus:outline-none resize-none max-h-24 leading-5"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          aria-label="Send"
          className="w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

/* ---------- Bubbles ---------- */

function GreetingBubble({
  greeting,
  primaryColor,
}: {
  greeting: string;
  primaryColor: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: primaryColor + "22" }}
      >
        <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
      </div>
      <div className="bg-white border border-sand-200 rounded-2xl rounded-tl-md px-3 py-2 text-xs text-sand-800 leading-relaxed max-w-[85%]">
        {greeting}
      </div>
    </div>
  );
}

function Bubble({
  message,
  primaryColor,
  feedback,
  onFeedback,
}: {
  message: ChatMessage;
  primaryColor: string;
  feedback: Record<string, FeedbackState>;
  onFeedback: (eventId: string, rating: "up" | "down") => void;
}) {
  const text = message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[85%] rounded-2xl rounded-br-md px-3 py-2 text-xs text-white leading-relaxed whitespace-pre-wrap"
          style={{ backgroundColor: primaryColor }}
        >
          {text}
        </div>
      </div>
    );
  }

  if (message.role === "assistant") {
    if (!text) return null;
    // Strip inline [1] / [2] citation markers, the widget does not render the
    // source list so they'd just be noise.
    const clean = text.replace(/\s?\[\d+\]/g, "");
    const eventId = message.metadata?.eventId;
    const fb = eventId ? feedback[eventId] : undefined;

    return (
      <div className="flex items-start gap-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: primaryColor + "22" }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
        </div>
        <div className="flex flex-col gap-1 max-w-[85%]">
          <div className="bg-white border border-sand-200 rounded-2xl rounded-tl-md px-3 py-2 text-sand-800">
            <MarkdownRenderer content={clean} variant="compact" />
          </div>
          {eventId && (
            <div className="flex items-center gap-1 pl-1">
              <button
                type="button"
                onClick={() => onFeedback(eventId, "up")}
                aria-label="Helpful"
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                  fb?.rating === "up"
                    ? "bg-status-success/15 text-status-success"
                    : "text-sand-400 hover:text-sand-700 hover:bg-sand-100"
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onFeedback(eventId, "down")}
                aria-label="Not helpful"
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                  fb?.rating === "down"
                    ? "bg-status-error/15 text-status-error"
                    : "text-sand-400 hover:text-sand-700 hover:bg-sand-100"
                }`}
              >
                <ThumbsDown className="w-3 h-3" />
              </button>
              {fb && (
                <span className="text-[10px] text-sand-400 ml-1">
                  Thanks!
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

function TypingBubble() {
  return (
    <div className="flex items-center gap-1 pl-9">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-sand-400 animate-bounce"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

/* ---------- Resolution prompt ---------- */

function ResolutionPrompt({
  primaryColor,
  onAnswer,
  onCancel,
}: {
  primaryColor: string;
  onAnswer: (resolved: boolean) => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: primaryColor + "22" }}
      >
        <CheckCircle2
          className="w-3.5 h-3.5"
          style={{ color: primaryColor }}
        />
      </div>
      <div className="bg-white border border-sand-200 rounded-2xl rounded-tl-md px-3 py-2.5 max-w-[85%]">
        <p className="text-xs text-sand-800 font-semibold mb-2">
          Did this solve your issue?
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onAnswer(true)}
            className="text-[11px] font-semibold text-white px-3 py-1.5 rounded-full cursor-pointer hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Yes, thanks
          </button>
          <button
            type="button"
            onClick={() => onAnswer(false)}
            className="text-[11px] font-semibold text-sand-700 border border-sand-200 bg-white px-3 py-1.5 rounded-full hover:bg-sand-100 cursor-pointer transition-colors"
          >
            Not yet
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-[11px] text-sand-400 hover:text-sand-600 px-2 py-1.5 cursor-pointer transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ResolutionDone({
  resolution,
  onStartFresh,
}: {
  resolution: "resolved" | "unresolved" | null;
  onStartFresh: () => void;
}) {
  const isResolved = resolution === "resolved";
  return (
    <div className="bg-white border border-sand-200 rounded-2xl px-3 py-3 flex items-center gap-3">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
          isResolved
            ? "bg-status-success/15 text-status-success"
            : "bg-status-warning/15 text-status-warning"
        }`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-sand-900">
          {isResolved
            ? "Marked as resolved, thanks for the feedback!"
            : "We'll pass this along so we can do better next time."}
        </p>
      </div>
      <button
        type="button"
        onClick={onStartFresh}
        className="text-[11px] font-semibold text-sand-700 hover:text-sand-900 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-sand-100 cursor-pointer transition-colors"
      >
        <RotateCcw className="w-3 h-3" />
        New chat
      </button>
    </div>
  );
}
