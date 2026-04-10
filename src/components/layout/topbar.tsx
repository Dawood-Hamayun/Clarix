"use client";

import { usePathname } from "next/navigation";
import { Search, Command } from "lucide-react";

const titles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/knowledge": "Knowledge Base",
  "/dashboard/conversations": "Conversations",
  "/dashboard/playground": "Playground",
  "/dashboard/widget": "Widget",
  "/dashboard/settings": "Settings",
};

const subtitles: Record<string, string> = {
  "/dashboard": "Your agent's command center",
  "/dashboard/knowledge": "Organize what your agent knows",
  "/dashboard/conversations": "Every customer interaction",
  "/dashboard/playground": "Talk to your agent",
  "/dashboard/widget": "Embed the chat widget anywhere",
  "/dashboard/settings": "Agent identity and configuration",
};

export function Topbar() {
  const pathname = usePathname();
  const titleKey =
    Object.keys(titles).find(
      (k) => pathname === k || (k !== "/dashboard" && pathname.startsWith(k))
    ) || "/dashboard";
  const title = titles[titleKey];
  const subtitle = subtitles[titleKey];

  return (
    <header className="h-20 border-b border-sand-200 bg-sand-50/90 backdrop-blur-md flex items-center justify-between px-10 sticky top-0 z-20">
      <div>
        <h1 className="text-2xl font-bold text-sand-900 tracking-tighter leading-none">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-sand-500 mt-1.5">{subtitle}</p>
        )}
      </div>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
        <input
          type="text"
          placeholder="Search or jump to…"
          className="w-72 bg-white border border-sand-200 rounded-xl pl-10 pr-12 py-2.5 text-sm text-sand-800 placeholder:text-sand-400 focus:outline-none focus:border-sand-900 focus:ring-2 focus:ring-sand-900/10 transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] font-semibold text-sand-500 bg-sand-100 border border-sand-200 rounded px-1.5 py-0.5">
          <Command className="w-2.5 h-2.5" />K
        </div>
      </div>
    </header>
  );
}
