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
  ExternalLink,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ClarixMark } from "@/components/ui/clarix-mark";
import type { PublicProject } from "@/lib/db/types";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Knowledge", href: "/dashboard/knowledge", icon: BookOpen },
  {
    label: "Conversations",
    href: "/dashboard/conversations",
    icon: MessageSquare,
  },
  { label: "Playground", href: "/dashboard/playground", icon: FlaskConical },
  { label: "Widget", href: "/dashboard/widget", icon: Code2 },
  { label: "Install", href: "/dashboard/integrations", icon: Plug },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [project, setProject] = useState<PublicProject | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // The Topbar's hamburger fires this event. Keeping the drawer state local
  // (instead of in a context) means routes don't need to know about it.
  useEffect(() => {
    function onToggle() {
      setMobileOpen((v) => !v);
    }
    window.addEventListener("clarix:toggle-sidebar", onToggle);
    return () => window.removeEventListener("clarix:toggle-sidebar", onToggle);
  }, []);

  // Close the drawer whenever the route changes, a tap on a nav item
  // should navigate AND dismiss in one motion.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open so the page beneath doesn't
  // wiggle as the user scrolls the nav.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  const companyName = project?.widgetConfig.companyName || "Acme Cloud";
  const initial = (companyName[0] || "C").toUpperCase();

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-sand-900/40 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-sand-200 flex flex-col z-50",
          "transform transition-transform duration-300 ease-out md:transform-none md:transition-none md:z-30",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand, height matches Topbar (h-20) so the bottom borders align */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-sand-200">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 group"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              whileHover={{ rotate: -8, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <ClarixMark className="w-9 h-9" />
            </motion.div>
            <span className="text-xl font-bold text-sand-900 tracking-tighter">
              Clarix
            </span>
          </Link>
          {/* Close button, visible only inside the mobile drawer */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden w-9 h-9 rounded-lg text-sand-500 hover:text-sand-900 hover:bg-sand-100 transition-colors flex items-center justify-center -mr-2"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <p className="label-mono text-sand-400 px-3.5 pb-3">Workspace</p>
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

        {/* Bottom, project badge. Clicks through to settings so users can
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
                  title="Agent online"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sand-900 truncate tracking-tight">
                {companyName}
              </p>
              <p className="text-[11px] text-sand-500 truncate">
                {project?.hasOpenAIApiKey ? "Agent online" : "Finish setup"}
              </p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-sand-300 group-hover:text-sand-500 transition-colors shrink-0" />
          </Link>
        </div>
      </aside>
    </>
  );
}
