"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  FlaskConical,
  Code2,
  Settings,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

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
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-sand-200 flex flex-col z-30">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-sand-200">
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
      <nav className="flex-1 px-3 py-5 space-y-0.5">
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

      {/* Bottom section */}
      <div className="px-4 py-4 border-t border-sand-200">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-sand-50 transition-colors cursor-pointer">
          <div className="relative w-9 h-9 rounded-full bg-sand-900 flex items-center justify-center text-sm font-bold text-white">
            C
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-status-success border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sand-900 truncate tracking-tight">
              Clarix Demo
            </p>
            <p className="text-xs text-sand-500">Free plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
