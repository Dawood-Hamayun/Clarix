"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Command,
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  FlaskConical,
  Code2,
  Plug,
  Settings,
  ArrowRight,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";

const titles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/knowledge": "Knowledge",
  "/dashboard/conversations": "Conversations",
  "/dashboard/playground": "Playground",
  "/dashboard/widget": "Widget",
  "/dashboard/integrations": "Install",
  "/dashboard/settings": "Settings",
};

const subtitles: Record<string, string> = {
  "/dashboard": "How your agent is doing",
  "/dashboard/knowledge": "What your agent knows",
  "/dashboard/conversations": "Every customer chat, logged",
  "/dashboard/playground": "Talk to your agent",
  "/dashboard/widget": "Make it look like your brand",
  "/dashboard/integrations": "Put it on your website",
  "/dashboard/settings": "Identity and configuration",
};

interface SearchItem {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  keywords: string[];
}

const SEARCH_ITEMS: SearchItem[] = [
  {
    label: "Overview",
    description: "Dashboard metrics, gaps, recent chats",
    href: "/dashboard",
    icon: LayoutDashboard,
    keywords: ["home", "dashboard", "overview", "metrics", "analytics"],
  },
  {
    label: "Knowledge Base",
    description: "All sources grouped by category",
    href: "/dashboard/knowledge",
    icon: BookOpen,
    keywords: ["kb", "sources", "docs", "content", "knowledge"],
  },
  {
    label: "Add knowledge",
    description: "Interview, upload, or paste a source",
    href: "/dashboard/knowledge/new",
    icon: BookOpen,
    keywords: ["new", "add", "upload", "interview", "create", "source"],
  },
  {
    label: "Conversations",
    description: "Every customer chat",
    href: "/dashboard/conversations",
    icon: MessageSquare,
    keywords: ["messages", "chats", "customers", "transcripts"],
  },
  {
    label: "Playground",
    description: "Test your agent live",
    href: "/dashboard/playground",
    icon: FlaskConical,
    keywords: ["test", "sandbox", "chat", "try"],
  },
  {
    label: "Widget",
    description: "Style the chat widget",
    href: "/dashboard/widget",
    icon: Code2,
    keywords: ["widget", "embed", "style", "branding"],
  },
  {
    label: "Integrations",
    description: "Install on your site",
    href: "/dashboard/integrations",
    icon: Plug,
    keywords: ["integrate", "install", "script", "embed", "nextjs", "react"],
  },
  {
    label: "Settings",
    description: "Agent identity, keys, categories",
    href: "/dashboard/settings",
    icon: Settings,
    keywords: ["config", "settings", "api key", "identity"],
  },
];

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const titleKey =
    Object.keys(titles).find(
      (k) => pathname === k || (k !== "/dashboard" && pathname.startsWith(k))
    ) || "/dashboard";
  const title = titles[titleKey];
  const subtitle = subtitles[titleKey];

  // Close when the route changes. This is a legitimate "reset on external
  // input change" pattern, the pathname is driven by the router, not React
  // state, so the set-state-in-effect rule doesn't apply here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setOpen(false);
    setMobileSearchOpen(false);
    setQuery("");
  }, [pathname]);

  // Cmd/Ctrl+K to focus the search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
      if (e.key === "Escape") {
        if (open) {
          setOpen(false);
          inputRef.current?.blur();
        }
        if (mobileSearchOpen) {
          setMobileSearchOpen(false);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, mobileSearchOpen]);

  // Click-outside to close the popover
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  // Auto-focus the mobile search input when its sheet opens
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 50);
    }
  }, [mobileSearchOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_ITEMS;
    return SEARCH_ITEMS.filter((item) => {
      const hay =
        item.label.toLowerCase() +
        " " +
        item.description.toLowerCase() +
        " " +
        item.keywords.join(" ");
      return hay.includes(q);
    });
  }, [query]);

  // Reset highlighted result whenever the search string changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleNavigate = (href: string) => {
    setOpen(false);
    setMobileSearchOpen(false);
    setQuery("");
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = results[activeIndex];
      if (hit) handleNavigate(hit.href);
    }
  };

  const toggleSidebar = () => {
    window.dispatchEvent(new Event("clarix:toggle-sidebar"));
  };

  return (
    <>
      <header className="h-16 sm:h-20 border-b border-sand-200 bg-sand-50/90 backdrop-blur-md flex items-center justify-between gap-3 px-4 sm:px-6 md:px-10 sticky top-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          {/* Hamburger, opens the sidebar drawer on mobile only */}
          <button
            onClick={toggleSidebar}
            className="md:hidden w-10 h-10 -ml-2 rounded-lg text-sand-700 hover:bg-sand-100 transition-colors flex items-center justify-center shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-sand-900 tracking-tighter leading-none truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="hidden sm:block label-mono text-sand-400 mt-1.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Mobile: search icon button that opens a full-width sheet */}
          <button
            onClick={() => setMobileSearchOpen(true)}
            className="md:hidden w-10 h-10 rounded-lg text-sand-700 hover:bg-sand-100 transition-colors flex items-center justify-center"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Desktop search input */}
          <div ref={popoverRef} className="relative hidden md:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder="Search or jump to…"
              className="w-56 lg:w-72 bg-white border border-sand-200 rounded-full pl-10 pr-12 py-2.5 text-sm text-sand-800 placeholder:text-sand-400 focus:outline-none focus:border-sand-900 focus:ring-2 focus:ring-sand-900/10 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] font-semibold text-sand-500 bg-sand-100 border border-sand-200 rounded px-1.5 py-0.5 pointer-events-none">
              <Command className="w-2.5 h-2.5" />K
            </div>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-[22rem] max-w-[calc(100vw-2rem)] bg-white border border-sand-200 rounded-2xl shadow-sand-lg overflow-hidden z-50"
                >
                  <SearchResults
                    query={query}
                    results={results}
                    activeIndex={activeIndex}
                    setActiveIndex={setActiveIndex}
                    onPick={handleNavigate}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile search sheet */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSearchOpen(false)}
              className="fixed inset-0 bg-sand-900/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="fixed top-3 left-3 right-3 z-50 md:hidden bg-white border border-sand-200 rounded-2xl shadow-sand-lg overflow-hidden"
            >
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400 pointer-events-none" />
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Search or jump to…"
                  className="w-full bg-white pl-10 pr-12 py-3.5 text-sm text-sand-800 placeholder:text-sand-400 focus:outline-none"
                />
                <button
                  onClick={() => setMobileSearchOpen(false)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-sand-500 hover:bg-sand-100 transition-colors flex items-center justify-center"
                  aria-label="Close search"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SearchResults
                query={query}
                results={results}
                activeIndex={activeIndex}
                setActiveIndex={setActiveIndex}
                onPick={handleNavigate}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SearchResults({
  query,
  results,
  activeIndex,
  setActiveIndex,
  onPick,
}: {
  query: string;
  results: SearchItem[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  onPick: (href: string) => void;
}) {
  if (results.length === 0) {
    return (
      <div className="px-4 py-6 text-center border-t border-sand-100">
        <p className="text-sm text-sand-500">
          No matches for{" "}
          <span className="font-semibold text-sand-700">
            &ldquo;{query}&rdquo;
          </span>
        </p>
      </div>
    );
  }
  return (
    <>
      <div className="px-3 py-2 text-[10px] uppercase tracking-wide font-bold text-sand-400 border-y border-sand-100">
        Jump to
      </div>
      <ul className="py-1 max-h-[60vh] md:max-h-80 overflow-y-auto">
        {results.map((item, i) => {
          const Icon = item.icon;
          const isActive = i === activeIndex;
          return (
            <li key={item.href}>
              <button
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => onPick(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer transition-colors",
                  isActive ? "bg-sand-100" : "hover:bg-sand-50"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    isActive
                      ? "bg-sand-900 text-white"
                      : "bg-sand-100 text-sand-600"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-sand-900 truncate tracking-tight">
                    {item.label}
                  </p>
                  <p className="text-xs text-sand-500 truncate">
                    {item.description}
                  </p>
                </div>
                <ArrowRight
                  className={cn(
                    "w-3.5 h-3.5 shrink-0",
                    isActive ? "text-sand-900" : "text-sand-300"
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-sand-100 px-3 py-2 hidden md:flex items-center gap-3 text-[10px] text-sand-500">
        <span className="flex items-center gap-1">
          <kbd className="bg-sand-100 border border-sand-200 rounded px-1 py-0.5 font-mono text-[9px]">
            ↑↓
          </kbd>
          navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="bg-sand-100 border border-sand-200 rounded px-1 py-0.5 font-mono text-[9px]">
            ↵
          </kbd>
          open
        </span>
        <span className="flex items-center gap-1">
          <kbd className="bg-sand-100 border border-sand-200 rounded px-1 py-0.5 font-mono text-[9px]">
            esc
          </kbd>
          close
        </span>
      </div>
    </>
  );
}
