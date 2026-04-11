"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MessageSquare, Send, Sparkles, X } from "lucide-react";
import type { PublicProject, WidgetConfig } from "@/lib/db/types";
import type { ChatMessageMetadata } from "@/app/api/chat/route";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

type ChatMessage = UIMessage<ChatMessageMetadata>;

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
  // Track viewport width so the chat panel collapses nicely on phones.
  // The loader iframe itself is also sized based on viewport, so we look at
  // window.innerWidth directly here (the iframe *is* the viewport).
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
        // Silent — leave config null so we render a safe fallback.
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
  const greeting =
    config?.greeting || "Hi! How can I help you today?";
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
      {open ? (
        <ChatPanel
          projectId={projectId}
          primaryColor={primaryColor}
          companyName={companyName}
          greeting={greeting}
          radiusClass={radiusClass}
          position={position}
          isMobile={isMobile}
          onClose={() => setOpen(false)}
        />
      ) : (
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
  position,
  isMobile,
  onClose,
}: {
  projectId: string;
  primaryColor: string;
  companyName: string;
  greeting: string;
  radiusClass: string;
  position: "bottom-right" | "bottom-left";
  isMobile: boolean;
  onClose: () => void;
}) {
  void position;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>(
    undefined
  );
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);

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
        /* silent — the widget still renders, just no persistence */
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

  // Key the chat on conversationId so a fresh conversation (or a resumed
  // one with a different history) gets a clean useChat instance.
  const chatKey = `${conversationId ?? "pending"}:${initialMessages.length}`;
  const { messages, sendMessage, status } = useChat<ChatMessage>({
    id: chatKey,
    transport,
    messages: hydrated ? initialMessages : undefined,
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInput("");
  };

  // On mobile, the loader iframe spans the full viewport width — so we drop
  // the max-width, the margin, and the rounded corners to get a true
  // edge-to-edge panel that doesn't look like a floating card on a phone.
  return (
    <div
      className={`bg-white border-sand-200 shadow-sand-lg overflow-hidden flex flex-col ${
        isMobile
          ? "w-full h-full border-t"
          : `w-full h-full max-w-sm border ${radiusClass}`
      }`}
      style={
        isMobile
          ? { maxHeight: "100vh" }
          : { maxHeight: "calc(100vh - 32px)", margin: 16 }
      }
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
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="w-7 h-7 rounded-lg text-white/80 hover:bg-white/15 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 bg-sand-50">
        {messages.length === 0 ? (
          <GreetingBubble greeting={greeting} primaryColor={primaryColor} />
        ) : (
          <div className="space-y-3">
            <GreetingBubble greeting={greeting} primaryColor={primaryColor} />
            {messages.map((m) => (
              <Bubble
                key={m.id}
                role={m.role}
                text={m.parts
                  .filter(
                    (p): p is { type: "text"; text: string } =>
                      p.type === "text"
                  )
                  .map((p) => p.text)
                  .join("")}
                primaryColor={primaryColor}
              />
            ))}
            {status === "submitted" && <TypingBubble />}
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
  role,
  text,
  primaryColor,
}: {
  role: "user" | "assistant" | "system";
  text: string;
  primaryColor: string;
}) {
  if (role === "user") {
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
  if (role === "assistant") {
    if (!text) return null;
    // Strip inline [1] / [2] citation markers — the widget does not render the
    // source list so they'd just be noise.
    const clean = text.replace(/\s?\[\d+\]/g, "");
    return (
      <div className="flex items-start gap-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: primaryColor + "22" }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl rounded-tl-md px-3 py-2 text-sand-800 max-w-[85%]">
          <MarkdownRenderer content={clean} variant="compact" />
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
