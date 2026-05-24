"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  Plus,
  FlaskConical,
  BookOpen,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  ThumbsDown,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  AnalyticsData,
  Conversation,
  KBHealthReport,
  KBGap,
} from "@/lib/db/types";
import { getCategoryIcon } from "@/lib/knowledge/category-icons";

function AnimatedCounter({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 900;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [value]);
  return (
    <>
      {count}
      {suffix}
    </>
  );
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [health, setHealth] = useState<KBHealthReport | null>(null);
  const [gaps, setGaps] = useState<KBGap[]>([]);

  useEffect(() => {
    fetch("/api/analytics").then((r) => r.json()).then(setAnalytics);
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data: Conversation[]) =>
        setConversations(data.filter((c) => c.messages.length > 0))
      );
    fetch("/api/kb-health").then((r) => r.json()).then(setHealth);
    fetch("/api/insights/gaps")
      .then((r) => r.json())
      .then((d) => setGaps(d.gaps || []));
  }, []);

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-sand-900 tracking-tighter">
            Overview
          </h1>
          <p className="text-sm sm:text-base text-sand-600 mt-2">
            How your agent is doing today, and what to improve next.
          </p>
        </div>

        {/* Quick actions — compact icon rail, tucked to the top-right. */}
        <div className="hidden md:flex items-center gap-1.5 bg-white border border-sand-200 rounded-2xl shadow-sand p-1.5">
          <QuickActionIcon
            href="/dashboard/knowledge/new"
            icon={Plus}
            label="Add knowledge"
          />
          <QuickActionIcon
            href="/dashboard/playground"
            icon={FlaskConical}
            label="Test your agent"
          />
          <QuickActionIcon
            href="/dashboard/knowledge"
            icon={BookOpen}
            label="Manage knowledge"
          />
        </div>
      </motion.div>

      {/* Top row: KB health + metric tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-1">
          <KBHealthCard report={health} />
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <MetricTile
            icon={MessageSquare}
            label="Conversations"
            value={analytics?.totalConversations ?? 0}
          />
          <MetricTile
            icon={TrendingUp}
            label="Messages"
            value={analytics?.totalMessages ?? 0}
          />
          <MetricTile
            icon={CheckCircle2}
            label="Resolution rate"
            value={analytics?.resolutionRate ?? 0}
            suffix="%"
            hint={
              analytics && analytics.ratedConversations > 0
                ? `of ${analytics.ratedConversations} rated chat${
                    analytics.ratedConversations === 1 ? "" : "s"
                  }`
                : "No ratings yet"
            }
          />
          <MetricTile
            icon={Sparkles}
            label="KB sources"
            value={health?.readyCount ?? 0}
          />
        </div>
      </div>

      {/* Second row: conversations + gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <SectionHeader
            title="Recent conversations"
            href="/dashboard/conversations"
          />
          <div className="bg-white border border-sand-200 rounded-2xl shadow-sand divide-y divide-sand-200 overflow-hidden max-h-[420px] overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-sand-100 border border-sand-200 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-5 h-5 text-sand-500" />
                </div>
                <p className="text-sm text-sand-600 mb-4">
                  No conversations yet. Test your agent in the Playground.
                </p>
                <Link href="/dashboard/playground">
                  <Button size="sm" variant="secondary">
                    <FlaskConical className="w-4 h-4" />
                    Open Playground
                  </Button>
                </Link>
              </div>
            ) : (
              conversations.slice(0, 5).map((conv) => (
                <Link
                  key={conv.id}
                  href={`/dashboard/conversations/${conv.id}`}
                  className="flex items-center justify-between gap-4 p-5 hover:bg-sand-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-sand-100 border border-sand-200 flex items-center justify-center text-sm font-bold text-sand-700 shrink-0">
                      {(conv.metadata.customerName || "U")[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[0.9375rem] font-semibold text-sand-900 truncate">
                        {conv.messages[0]?.content || "New conversation"}
                      </p>
                      <p className="text-xs text-sand-500 mt-0.5">
                        {conv.metadata.customerName || "Customer"} ·{" "}
                        {conv.metadata.messageCount} messages
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      conv.status === "resolved"
                        ? "success"
                        : conv.status === "unresolved"
                          ? "error"
                          : "processing"
                    }
                    title={
                      conv.status === "resolved"
                        ? "Customer gave at least one 👍 and no 👎"
                        : conv.status === "unresolved"
                          ? "Customer gave at least one 👎 on an answer"
                          : "No feedback given yet"
                    }
                  >
                    {conv.status === "resolved"
                      ? "Resolved"
                      : conv.status === "unresolved"
                        ? "Unresolved"
                        : "Unrated"}
                  </Badge>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <SectionHeader title="Knowledge gaps" />
          <GapsPanel gaps={gaps} />
        </div>
      </div>

      {/* Mobile quick actions — stacked on small screens where the icon
          rail in the hero is hidden. */}
      <div className="md:hidden">
        <SectionHeader title="Quick actions" />
        <div className="grid grid-cols-1 gap-3">
          <QuickAction
            href="/dashboard/knowledge/new"
            icon={Plus}
            title="Add knowledge"
            description="Interview mode or upload"
          />
          <QuickAction
            href="/dashboard/playground"
            icon={FlaskConical}
            title="Test your agent"
            description="Chat in the playground"
          />
          <QuickAction
            href="/dashboard/knowledge"
            icon={BookOpen}
            title="Manage KB"
            description="Browse by category"
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-sand-900 tracking-tight">
        {title}
      </h2>
      {href && (
        <Link href={href}>
          <Button variant="ghost" size="sm">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      )}
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  suffix = "",
  hint,
}: {
  icon: typeof MessageSquare;
  label: string;
  value: number;
  suffix?: string;
  /** Optional small caption under the big number — context, not decoration. */
  hint?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-sand-200 rounded-2xl shadow-sand p-5"
    >
      <div className="flex items-center gap-2 text-sand-500 text-xs font-semibold uppercase tracking-wide">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="mt-3 text-3xl font-bold text-sand-900 tracking-tighter">
        <AnimatedCounter value={value} suffix={suffix} />
      </div>
      {hint && (
        <p className="mt-1 text-[11px] text-sand-400 font-medium">{hint}</p>
      )}
    </motion.div>
  );
}

function KBHealthCard({ report }: { report: KBHealthReport | null }) {
  if (!report) {
    return (
      <div className="bg-white border border-sand-200 rounded-2xl shadow-sand p-6 h-full flex items-center justify-center min-h-[280px]">
        <div className="w-6 h-6 border-2 border-sand-200 border-t-sand-900 rounded-full animate-spin" />
      </div>
    );
  }

  const { readyCount, wordCount, chunkCount, errorCount, status, message } =
    report;

  const statusStyles: Record<
    KBHealthReport["status"],
    { label: string; dot: string; text: string }
  > = {
    empty: {
      label: "Empty",
      dot: "bg-sand-300",
      text: "text-sand-500",
    },
    starting: {
      label: "Getting started",
      dot: "bg-status-warning",
      text: "text-status-warning",
    },
    ready: {
      label: "Ready",
      dot: "bg-status-info",
      text: "text-status-info",
    },
    strong: {
      label: "Strong",
      dot: "bg-status-success",
      text: "text-status-success",
    },
  };

  const s = statusStyles[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-sand-200 rounded-2xl shadow-sand p-6 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-sand-500 text-xs font-semibold uppercase tracking-wide">
          <Database className="w-4 h-4" />
          Knowledge Base
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          <span className={`text-[11px] font-semibold ${s.text}`}>
            {s.label}
          </span>
        </div>
      </div>

      {/* Hero stat */}
      <div className="mt-5 flex items-baseline gap-2">
        <div className="text-5xl font-bold text-sand-900 tracking-tighter leading-none">
          <AnimatedCounter value={readyCount} />
        </div>
        <div className="text-sm text-sand-500 font-medium">
          source{readyCount === 1 ? "" : "s"} ready
        </div>
      </div>

      <p className="text-sm text-sand-600 mt-3 leading-relaxed">{message}</p>

      {/* Stat row */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-sand-50 border border-sand-200 px-3 py-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-sand-500">
            Chunks
          </div>
          <div className="text-xl font-bold text-sand-900 tracking-tight mt-0.5">
            <AnimatedCounter value={chunkCount} />
          </div>
        </div>
        <div className="rounded-xl bg-sand-50 border border-sand-200 px-3 py-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-sand-500">
            Words
          </div>
          <div className="text-xl font-bold text-sand-900 tracking-tight mt-0.5">
            <AnimatedCounter value={wordCount} />
          </div>
        </div>
      </div>

      {errorCount > 0 && (
        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-status-error/5 border border-status-error/20 text-xs text-status-error">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            {errorCount} source{errorCount === 1 ? "" : "s"} failed. Review them
            in the knowledge base.
          </span>
        </div>
      )}

      <div className="mt-auto pt-5">
        <Link href="/dashboard/knowledge/new">
          <Button variant="secondary" size="sm" className="w-full">
            <Plus className="w-3.5 h-3.5" />
            Add source
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

function GapsPanel({ gaps }: { gaps: KBGap[] }) {
  if (gaps.length === 0) {
    return (
      <div className="bg-white border border-sand-200 rounded-2xl shadow-sand p-6 h-full flex flex-col items-center justify-center text-center min-h-[240px]">
        <div className="w-11 h-11 rounded-xl bg-status-success/10 border border-status-success/20 flex items-center justify-center mb-3">
          <CheckCircle2 className="w-5 h-5 text-status-success" />
        </div>
        <p className="text-sm font-semibold text-sand-900">No gaps detected</p>
        <p className="text-xs text-sand-500 mt-1 max-w-[220px]">
          Low-confidence answers and thumbs-down feedback will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative bg-white border border-sand-200 rounded-2xl shadow-sand overflow-hidden">
      <div className="max-h-[420px] overflow-y-auto divide-y divide-sand-200">
        {gaps.slice(0, 8).map((gap, i) => {
          const Icon = gap.suggestedCategoryName
            ? getCategoryIcon(undefined)
            : AlertTriangle;
          const newHref = gap.suggestedCategoryId
            ? `/dashboard/knowledge/new?categoryId=${gap.suggestedCategoryId}`
            : "/dashboard/knowledge/new";

          return (
            <motion.div
              key={gap.query + i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-4 hover:bg-sand-50 transition-colors"
            >
              <div className="flex items-start gap-2 mb-2">
                {gap.rating === "down" ? (
                  <ThumbsDown className="w-3.5 h-3.5 text-status-error mt-0.5 shrink-0" />
                ) : (
                  <Icon className="w-3.5 h-3.5 text-status-warning mt-0.5 shrink-0" />
                )}
                <p className="text-sm font-semibold text-sand-900 leading-snug line-clamp-2">
                  &ldquo;{gap.query}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-[11px] text-sand-500 mb-2.5 pl-5">
                <span className="font-mono">
                  {Math.round(gap.avgConfidence * 100)}% avg conf.
                </span>
                <span>·</span>
                <span>
                  {gap.occurrences}× asked
                </span>
                {gap.suggestedCategoryName && (
                  <>
                    <span>·</span>
                    <Badge variant="outline">{gap.suggestedCategoryName}</Badge>
                  </>
                )}
              </div>
              <Link href={newHref}>
                <Button size="sm" variant="secondary" className="w-full">
                  <Plus className="w-3.5 h-3.5" />
                  Create entry
                </Button>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function QuickActionIcon({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Plus;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="group relative w-10 h-10 rounded-xl bg-white hover:bg-sand-900 text-sand-600 hover:text-white border border-transparent hover:border-sand-900 flex items-center justify-center transition-all"
    >
      <Icon className="w-4 h-4" />
      <span className="pointer-events-none absolute top-full mt-2 right-0 whitespace-nowrap bg-sand-900 text-white text-[10px] font-semibold tracking-tight px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
        {label}
      </span>
    </Link>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Plus;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white border border-sand-200 rounded-2xl shadow-sand hover:shadow-sand-md p-5 h-full transition-shadow"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-sand-900 text-white flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[0.9375rem] font-bold text-sand-900 tracking-tight">
              {title}
            </p>
            <p className="text-sm text-sand-500 mt-1">{description}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-sand-400 ml-auto mt-1" />
        </div>
      </motion.div>
    </Link>
  );
}
