"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type {
  AnalyticsData,
  Conversation,
  KBHealthReport,
  KBGap,
  PublicProject,
} from "@/lib/db/types";

/**
 * Overview, designed as a guided demo experience rather than a metrics
 * grid. One greeting, one tour, one row of numbers, and the live feed.
 * Everything on this screen either tells the story or starts a step of
 * it. No decorative tiles.
 */

function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 900;
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [value]);
  return <>{count}</>;
}

const tour = [
  {
    index: "01",
    title: "Talk to Ava",
    description: "Ask her anything a customer would. Watch her cite her sources.",
    href: "/dashboard/playground",
  },
  {
    index: "02",
    title: "Read the conversations",
    description: "Every chat is logged here, exactly as a support team would see it.",
    href: "/dashboard/conversations",
  },
  {
    index: "03",
    title: "See what she knows",
    description: "The knowledge she answers from, organized by topic.",
    href: "/dashboard/knowledge",
  },
  {
    index: "04",
    title: "Put her on a website",
    description: "One small snippet and the widget is live on any site.",
    href: "/dashboard/integrations",
  },
];

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [health, setHealth] = useState<KBHealthReport | null>(null);
  const [gaps, setGaps] = useState<KBGap[]>([]);
  const [project, setProject] = useState<PublicProject | null>(null);

  useEffect(() => {
    fetch("/api/project")
      .then((r) => (r.ok ? r.json() : null))
      .then(setProject)
      .catch(() => {});
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

  const agentName = project?.agentConfig?.agentName || "Ava";
  const hour = new Date().getHours();
  const daypart = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  const stats = [
    { value: analytics?.totalConversations ?? 0, label: "Conversations" },
    { value: analytics?.totalMessages ?? 0, label: "Messages" },
    { value: health?.chunkCount ?? 0, label: "Answers ready" },
    { value: health?.readyCount ?? 0, label: "Sources" },
  ];

  return (
    <div className="max-w-4xl">
      {/* ---------- Hero ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <p className="label-mono text-sand-400 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
          {project?.widgetConfig?.companyName || "Acme Cloud"} · {agentName} is
          on duty
        </p>
        <h1 className="mt-4 text-3xl sm:text-[2.6rem] font-bold text-sand-900 tracking-tighter leading-[1.05]">
          Good {daypart}.
        </h1>
        <p className="mt-3 text-sand-600 max-w-md leading-relaxed">
          {analytics && analytics.totalConversations > 0
            ? `${agentName} has handled ${analytics.totalConversations} conversation${
                analytics.totalConversations === 1 ? "" : "s"
              } without breaking a sweat. Here's the tour.`
            : `Everything is loaded and ${agentName} is ready. Here's the tour.`}
        </p>
      </motion.div>

      {/* ---------- Numbers band ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
        className="mt-10 grid grid-cols-2 sm:grid-cols-4 border-y border-sand-200"
      >
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`py-6 px-5 first:pl-0 ${i > 0 ? "sm:border-l sm:border-sand-200" : ""}`}
          >
            <div className="text-3xl sm:text-4xl font-bold text-sand-900 tracking-tighter">
              <AnimatedCounter value={stat.value} />
            </div>
            <div className="label-mono text-sand-400 mt-2">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* ---------- The tour ---------- */}
      <div className="mt-12">
        <p className="label-mono text-sand-400 mb-2">The tour · four stops</p>
        <div>
          {tour.map((stop, i) => (
            <motion.div
              key={stop.index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18 + i * 0.07 }}
            >
              <Link
                href={stop.href}
                className="group grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[3rem_minmax(10rem,14rem)_1fr_auto] items-baseline gap-x-4 py-5 border-t border-sand-200 hover:bg-white -mx-3 px-3 rounded-lg transition-colors"
              >
                <span className="font-mono text-sm text-sand-400">
                  {stop.index}
                </span>
                <span className="text-lg font-bold text-sand-900 tracking-tight">
                  {stop.title}
                </span>
                <span className="hidden sm:block text-sm text-sand-500 truncate">
                  {stop.description}
                </span>
                <ArrowRight className="w-4 h-4 text-sand-300 group-hover:text-sand-900 group-hover:translate-x-1 transition-all self-center" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ---------- Live feed ---------- */}
      <div className="mt-12 pb-10">
        <div className="flex items-baseline justify-between mb-2">
          <p className="label-mono text-sand-400">Latest conversations</p>
          {conversations.length > 0 && (
            <Link
              href="/dashboard/conversations"
              className="label-mono text-sand-400 hover:text-sand-900 transition-colors"
            >
              View all <ArrowUpRight className="w-3 h-3 inline" />
            </Link>
          )}
        </div>

        {conversations.length === 0 ? (
          <div className="border-t border-sand-200 py-8">
            <p className="text-sm text-sand-500">
              Nothing yet. Take the first stop of the tour and{" "}
              <Link
                href="/dashboard/playground"
                className="font-semibold text-sand-900 underline underline-offset-4 decoration-sand-300 hover:decoration-sand-900"
              >
                say hello to {agentName}
              </Link>
              .
            </p>
          </div>
        ) : (
          conversations.slice(0, 4).map((conv, i) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.3 + i * 0.06 }}
            >
              <Link
                href={`/dashboard/conversations/${conv.id}`}
                className="group flex items-center gap-4 py-4 border-t border-sand-200 hover:bg-white -mx-3 px-3 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-sand-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {(conv.metadata.customerName || "C")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.9375rem] font-semibold text-sand-900 truncate tracking-tight">
                    {conv.messages[0]?.content || "New conversation"}
                  </p>
                  <p className="label-mono text-sand-400 mt-1">
                    {conv.metadata.customerName || "Customer"} ·{" "}
                    {conv.metadata.messageCount} messages
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-sand-300 group-hover:text-sand-900 group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
            </motion.div>
          ))
        )}

        {/* Unanswered questions, only when there's something to show */}
        {gaps.length > 0 && (
          <div className="mt-12">
            <p className="label-mono text-sand-400 mb-2">
              Questions {agentName} couldn&apos;t answer
            </p>
            {gaps.slice(0, 3).map((gap, i) => (
              <div
                key={gap.query + i}
                className="py-4 border-t border-sand-200"
              >
                <p className="text-[0.9375rem] font-semibold text-sand-900 tracking-tight">
                  &ldquo;{gap.query}&rdquo;
                </p>
                <p className="label-mono text-sand-400 mt-1">
                  Asked {gap.occurrences}× · handed to a human
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
