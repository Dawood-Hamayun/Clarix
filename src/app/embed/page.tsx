"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MessageSquare, Send, Sparkles, X } from "lucide-react";
import type { Project, WidgetConfig } from "@/lib/db/types";
import type { ChatMessageMetadata } from "@/app/api/chat/route";

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

  // Read ?project=... from the URL, then fetch project config.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("project") || "proj_demo";
    setProjectId(pid);
    const pos = params.get("position");
    if (pos === "bottom-left") setPosition("bottom-left");

    fetch(`/api/project?projectId=${encodeURIComponent(pid)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p: Project | null) => {
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

  const alignClass =
    position === "bottom-left" ? "items-start" : "items-end";

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
  onClose,
}: {
  projectId: string;
  primaryColor: string;
  companyName: string;
  greeting: string;
  radiusClass: string;
  position: "bottom-right" | "bottom-left";
  onClose: () => void;
}) {
  void position;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { projectId },
      }),
    [projectId]
  );

  const { messages, sendMessage, status } = useChat<ChatMessage>({
    transport,
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

  return (
    <div
      className={`w-full h-full max-w-sm bg-white border border-sand-200 shadow-sand-lg overflow-hidden flex flex-col ${radiusClass}`}
      style={{
        maxHeight: "calc(100vh - 32px)",
        margin: 16,
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
    return (
      <div className="flex items-start gap-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: primaryColor + "22" }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl rounded-tl-md px-3 py-2 text-xs text-sand-800 leading-relaxed whitespace-pre-wrap max-w-[85%]">
          {text}
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
