"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  FlaskConical,
  Code2,
  Plug,
  Settings,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import type { PublicProject } from "@/lib/db/types";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Knowledge Base", href: "/dashboard/knowledge", icon: BookOpen },
  {
    label: "Conversations",
    href: "/dashboard/conversations",
    icon: MessageSquare,
  },
  { label: "Playground", href: "/dashboard/playground", icon: FlaskConical },
  { label: "Widget", href: "/dashboard/widget", icon: Code2 },
  { label: "Integrations", href: "/dashboard/integrations", icon: Plug },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [project, setProject] = useState<PublicProject | null>(null);

  useEffect(() => {
    fetch("/api/project")
      .then((r) => (r.ok ? r.json() : null))
      .then((p: PublicProject | null) => setProject(p))
      .catch(() => {
        /* sidebar still renders without the footer card */
      });
  }, []);

  // Keep the sidebar footer in sync when the user changes project / agent
  // settings from the Settings page.
  useEffect(() => {
    function onProjectUpdate(e: Event) {
      const detail = (e as CustomEvent<PublicProject>).detail;
      if (detail) setProject(detail);
    }
    window.addEventListener("clarix:project-updated", onProjectUpdate);
    return () =>
      window.removeEventListener("clarix:project-updated", onProjectUpdate);
  }, []);

  const companyName = project?.widgetConfig.companyName || "Your workspace";
  const initial = (companyName[0] || "C").toUpperCase();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-sand-200 flex flex-col z-30">
      {/* Brand — height matches Topbar (h-20) so the bottom borders align */}
      <div className="h-20 px-6 flex items-center border-b border-sand-200">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <motion.div
            className="w-9 h-9 rounded-xl bg-sand-900 flex items-center justify-center shadow-sand"
            whileHover={{ rotate: -8, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </motion.div>
          <span className="text-xl font-bold text-sand-900 tracking-tighter">
            Clarix
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[0.9375rem] font-medium tracking-tight transition-colors duration-150",
                isActive
                  ? "text-sand-900"
                  : "text-sand-500 hover:text-sand-900 hover:bg-sand-50"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-sand-100 rounded-xl"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <item.icon className="w-[18px] h-[18px] relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom — project badge. Clicks through to settings so users can
          rename the workspace or swap the OpenAI key without hunting. */}
      <div className="px-3 py-3 border-t border-sand-200">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-sand-50 transition-colors group"
        >
          <div className="relative w-9 h-9 rounded-xl bg-sand-900 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {initial}
            {project?.hasOpenAIApiKey && (
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-status-success border-2 border-white"
                title="OpenAI key connected"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sand-900 truncate tracking-tight">
              {companyName}
            </p>
            <p className="text-[11px] text-sand-500 truncate">
              {project?.hasOpenAIApiKey ? "OpenAI connected" : "Connect OpenAI"}
            </p>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-sand-300 group-hover:text-sand-500 transition-colors shrink-0" />
        </Link>
      </div>
    </aside>
  );
}
