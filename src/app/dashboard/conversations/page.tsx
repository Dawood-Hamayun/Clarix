"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Search,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import type { Conversation, ConversationStatus } from "@/lib/db/types";

type StatusFilter = "all" | "unrated" | "resolved" | "unresolved";

const PAGE_SIZE = 10;

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data: Conversation[]) => {
        setConversations(data);
        setLoading(false);
      });
  }, []);

  // Hide empty playground sessions that never received a user message.
  const populated = useMemo(
    () => conversations.filter((c) => c.messages.length > 0),
    [conversations]
  );

  const filtered = useMemo(() => {
    let list = populated;
    if (statusFilter !== "all") {
      list = list.filter((c) => (c.status ?? "unrated") === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          (c.metadata.customerName || "").toLowerCase().includes(q) ||
          c.messages.some((m) => m.content.toLowerCase().includes(q))
      );
    }
    return list;
  }, [populated, search, statusFilter]);

  // Reset pagination whenever the filtered set changes shape.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, populated.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  // Group the visible page by "date bucket" so long lists are scannable
  // without losing the chronological signal.
  const grouped = useMemo(() => groupByDay(pageItems), [pageItems]);

  const counts = useMemo(() => {
    const by = (s: string) =>
      populated.filter((c) => (c.status ?? "unrated") === s).length;
    return {
      all: populated.length,
      unrated: by("unrated"),
      resolved: by("resolved"),
      unresolved: by("unresolved"),
    };
  }, [populated]);

  return (
    <div className="space-y-6">
      {/* Controls row */}
      {populated.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer or message…"
              className="w-full bg-white border border-sand-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-sand-800 placeholder:text-sand-400 focus:outline-none focus:border-sand-900 focus:ring-2 focus:ring-sand-900/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-1 bg-white border border-sand-200 rounded-xl p-1">
            <FilterPill
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
              label="All"
              count={counts.all}
            />
            <FilterPill
              active={statusFilter === "resolved"}
              onClick={() => setStatusFilter("resolved")}
              label="Resolved"
              count={counts.resolved}
            />
            <FilterPill
              active={statusFilter === "unresolved"}
              onClick={() => setStatusFilter("unresolved")}
              label="Unresolved"
              count={counts.unresolved}
            />
            <FilterPill
              active={statusFilter === "unrated"}
              onClick={() => setStatusFilter("unrated")}
              label="Unrated"
              count={counts.unrated}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-sand-100 border border-sand-200 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-dashed border-sand-300 rounded-3xl px-8 py-16 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-sand-100 border border-sand-200 flex items-center justify-center mx-auto mb-4">
            {populated.length === 0 ? (
              <MessageSquare className="w-6 h-6 text-sand-500" />
            ) : (
              <Filter className="w-6 h-6 text-sand-500" />
            )}
          </div>
          <h3 className="text-xl font-bold text-sand-900 tracking-tight mb-2">
            {populated.length === 0
              ? "No conversations yet"
              : "Nothing matches"}
          </h3>
          <p className="text-sand-600 max-w-md mx-auto mb-6">
            {populated.length === 0
              ? "Customer chats will appear here once your agent starts answering questions. Open the playground to test it yourself first."
              : "Try clearing the search or picking a different filter."}
          </p>
          {populated.length === 0 && (
            <Link href="/dashboard/playground">
              <Button>
                <FlaskConical className="w-4 h-4" />
                Open Playground
              </Button>
            </Link>
          )}
        </motion.div>
      ) : (
        <>
          <div className="bg-white border border-sand-200 rounded-2xl shadow-sand overflow-hidden">
            <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {grouped.map((group) => (
                  <div key={group.label}>
                    <div className="sticky top-0 z-10 bg-sand-50/95 backdrop-blur px-5 py-2 border-b border-sand-200 text-[11px] uppercase tracking-wide font-bold text-sand-500">
                      {group.label}
                    </div>
                    <div className="divide-y divide-sand-200">
                      {group.items.map((conv, i) => (
                        <motion.div
                          key={conv.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.02 }}
                        >
                          <Link
                            href={`/dashboard/conversations/${conv.id}`}
                            className="flex items-center justify-between gap-4 p-5 hover:bg-sand-50 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-full bg-sand-100 border border-sand-200 flex items-center justify-center text-sm font-bold text-sand-700 shrink-0">
                                {(conv.metadata.customerName || "U")[0].toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-[0.9375rem] font-semibold text-sand-900 truncate">
                                    {conv.metadata.customerName || "Customer"}
                                  </p>
                                  <span className="text-xs text-sand-400">
                                    {formatTime(conv.metadata.lastMessageAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-sand-600 truncate">
                                  {conv.messages[0]?.content || "New conversation"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs font-mono text-sand-500">
                                {conv.metadata.messageCount} msgs
                              </span>
                              <StatusBadge status={conv.status ?? "unrated"} />
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-sand-500 tracking-tight">
                Showing{" "}
                <span className="font-semibold text-sand-700">
                  {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-sand-700">
                  {filtered.length}
                </span>
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </Button>
                <span className="text-xs font-mono tracking-tight text-sand-600 px-2 min-w-[3rem] text-center">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Helpers ---------- */

/**
 * Pill that renders the feedback-derived conversation status. Kept as
 * its own component so the label, color, and tooltip copy are in one
 * place — the dashboard and the detail page both use it.
 */
function StatusBadge({ status }: { status: ConversationStatus }) {
  const config: Record<
    ConversationStatus,
    {
      label: string;
      variant: "success" | "error" | "processing";
      title: string;
    }
  > = {
    resolved: {
      label: "Resolved",
      variant: "success",
      title: "Customer gave at least one 👍 and no 👎",
    },
    unresolved: {
      label: "Unresolved",
      variant: "error",
      title: "Customer gave at least one 👎 on an answer",
    },
    unrated: {
      label: "Unrated",
      variant: "processing",
      title: "No feedback given yet",
    },
  };
  const c = config[status];
  return (
    <Badge variant={c.variant} title={c.title}>
      {c.label}
    </Badge>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 ${
        active
          ? "bg-sand-900 text-white"
          : "text-sand-600 hover:text-sand-900 hover:bg-sand-100"
      }`}
    >
      {label}
      <span
        className={`font-mono text-[10px] rounded px-1 py-0.5 ${
          active ? "bg-white/20" : "bg-sand-100"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function groupByDay(
  items: Conversation[]
): { label: string; items: Conversation[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 7);

  const buckets: Record<string, Conversation[]> = {
    Today: [],
    Yesterday: [],
    "This week": [],
    Earlier: [],
  };

  for (const conv of items) {
    const d = new Date(conv.metadata.lastMessageAt);
    if (d >= today) buckets["Today"].push(conv);
    else if (d >= yesterday) buckets["Yesterday"].push(conv);
    else if (d >= weekStart) buckets["This week"].push(conv);
    else buckets["Earlier"].push(conv);
  }

  return Object.entries(buckets)
    .filter(([, list]) => list.length > 0)
    .map(([label, list]) => ({ label, items: list }));
}
