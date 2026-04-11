"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  Code2,
  Globe,
  Plug,
  Sparkles,
  Zap,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { PublicProject } from "@/lib/db/types";

/**
 * Integrations hub. Shows one tile per supported framework / host
 * with a ready-to-paste snippet that already has the live projectId
 * and widget position baked in so users never have to hand-edit.
 *
 * The widget itself is a single `<script src="/widget.js">` tag, so
 * every "integration" here is really just the same script in a form
 * that fits each platform's insertion point.
 */

type Framework = {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  /** Snippet type picked purely for syntax highlighting / framing */
  language: "html" | "jsx" | "tsx" | "txt";
  /** Where on the host platform to drop the snippet */
  placement: string;
  /** Build the snippet using the live origin + projectId + position */
  build: (ctx: { origin: string; projectId: string; position: string }) => string;
};

const FRAMEWORKS: Framework[] = [
  {
    id: "html",
    label: "Plain HTML",
    icon: Globe,
    description: "Drop into any HTML page — Wix, Carrd, static sites, anywhere.",
    language: "html",
    placement: "Paste just before the closing </body> tag.",
    build: ({ origin, projectId, position }) =>
      `<script
  src="${origin}/widget.js"
  data-project="${projectId}"
  data-position="${position}"
  defer
></script>`,
  },
  {
    id: "nextjs",
    label: "Next.js (App Router)",
    icon: Code2,
    description:
      "Add to your root layout using the built-in next/script component.",
    language: "tsx",
    placement: "Inside <body> in app/layout.tsx.",
    build: ({ origin, projectId, position }) =>
      `import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="${origin}/widget.js"
          data-project="${projectId}"
          data-position="${position}"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}`,
  },
  {
    id: "react",
    label: "React / Vite",
    icon: Zap,
    description: "Plain React app — inject once from your root component.",
    language: "jsx",
    placement: "Inside your root App component (fires once on mount).",
    build: ({ origin, projectId, position }) =>
      `import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    if (document.getElementById("clarix-widget-script")) return;
    const s = document.createElement("script");
    s.id = "clarix-widget-script";
    s.src = "${origin}/widget.js";
    s.async = true;
    s.setAttribute("data-project", "${projectId}");
    s.setAttribute("data-position", "${position}");
    document.body.appendChild(s);
  }, []);

  return <YourApp />;
}`,
  },
  {
    id: "wordpress",
    label: "WordPress",
    icon: Globe,
    description: "Works with any theme. No plugin required.",
    language: "html",
    placement:
      "Appearance → Theme File Editor → footer.php, just before </body>. Or use a header/footer plugin.",
    build: ({ origin, projectId, position }) =>
      `<script
  src="${origin}/widget.js"
  data-project="${projectId}"
  data-position="${position}"
  defer
></script>`,
  },
  {
    id: "shopify",
    label: "Shopify",
    icon: Globe,
    description: "Appears on every storefront page.",
    language: "html",
    placement:
      "Online Store → Themes → Edit code → layout/theme.liquid, just before </body>.",
    build: ({ origin, projectId, position }) =>
      `<script
  src="${origin}/widget.js"
  data-project="${projectId}"
  data-position="${position}"
  defer
></script>`,
  },
  {
    id: "webflow",
    label: "Webflow",
    icon: Globe,
    description: "Site-wide custom code — one line, no plan upgrade needed.",
    language: "html",
    placement:
      "Project Settings → Custom Code → Footer Code. Publish to apply.",
    build: ({ origin, projectId, position }) =>
      `<script
  src="${origin}/widget.js"
  data-project="${projectId}"
  data-position="${position}"
  defer
></script>`,
  },
  {
    id: "framer",
    label: "Framer",
    icon: Sparkles,
    description: "Add once from site settings and it shows on every page.",
    language: "html",
    placement:
      "Site Settings → General → Custom Code → End of <body> tag.",
    build: ({ origin, projectId, position }) =>
      `<script
  src="${origin}/widget.js"
  data-project="${projectId}"
  data-position="${position}"
  defer
></script>`,
  },
];

export default function IntegrationsPage() {
  const [project, setProject] = useState<PublicProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>("nextjs");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/project")
      .then((r) => r.json())
      .then((p: PublicProject) => {
        setProject(p);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const origin = useMemo(
    () =>
      typeof window !== "undefined"
        ? window.location.origin
        : "https://clarix-rouge.vercel.app",
    []
  );

  // Depend on the whole widgetConfig object so the React compiler can verify
  // the memo deps match the inferred ones (it can't reason about nested
  // property access on optional chains).
  const widgetConfig = project?.widgetConfig;
  const projectIdValue = project?.id;
  const ctx = useMemo(
    () => ({
      origin,
      projectId: projectIdValue ?? "proj_demo",
      position: widgetConfig?.position ?? "bottom-right",
    }),
    [origin, projectIdValue, widgetConfig]
  );

  const active = FRAMEWORKS.find((f) => f.id === activeId) ?? FRAMEWORKS[0];
  const snippet = active.build(ctx);

  const handleCopy = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      /* clipboard may be blocked in some iframe contexts */
    }
  };

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="h-10 w-60 bg-sand-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-40 bg-sand-100 border border-sand-200 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide font-bold text-sand-400 mb-2">
          <Plug className="w-3.5 h-3.5" />
          Integrations
        </div>
        <h1 className="text-3xl font-bold text-sand-900 tracking-tighter">
          Ship Clarix anywhere
        </h1>
        <p className="text-base text-sand-600 mt-2 max-w-2xl">
          One script tag powers the entire chat widget — launcher, chat panel,
          streaming, and persistence. Pick your stack and paste the snippet.
          It&apos;s already wired to your live project.
        </p>
      </motion.div>

      {/* Framework tiles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-sand-800 tracking-tight uppercase">
            Frameworks &amp; hosts
          </h2>
          <span className="text-xs text-sand-500">
            Workspace:{" "}
            <span className="font-semibold text-sand-700">
              {project?.widgetConfig.companyName || project?.name || "Your workspace"}
            </span>
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {FRAMEWORKS.map((f) => {
            const isActive = f.id === activeId;
            const Icon = f.icon;
            return (
              <motion.button
                key={f.id}
                onClick={() => setActiveId(f.id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative text-left p-4 rounded-2xl border transition-all",
                  isActive
                    ? "border-sand-900 bg-white shadow-sand-md"
                    : "border-sand-200 bg-white hover:border-sand-300"
                )}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center",
                      isActive
                        ? "bg-sand-900 text-white"
                        : "bg-sand-100 text-sand-700"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isActive && (
                    <Badge variant="success" className="ml-auto">
                      Selected
                    </Badge>
                  )}
                </div>
                <div className="text-sm font-semibold text-sand-900 tracking-tight">
                  {f.label}
                </div>
                <div className="text-xs text-sand-500 mt-1 leading-relaxed line-clamp-2">
                  {f.description}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Snippet for active framework */}
      <motion.div
        key={active.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-sand-900 text-white flex items-center justify-center shrink-0">
              <active.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle>{active.label} snippet</CardTitle>
              <CardDescription>{active.placement}</CardDescription>
            </div>
            <button
              onClick={() => handleCopy(active.id, snippet)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                copiedId === active.id
                  ? "bg-status-success/10 border-status-success/30 text-status-success"
                  : "bg-white border-sand-200 text-sand-700 hover:bg-sand-50"
              )}
            >
              {copiedId === active.id ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>

          <pre className="bg-sand-900 text-sand-100 rounded-xl p-4 text-xs font-mono overflow-x-auto leading-relaxed">
            <code>{snippet}</code>
          </pre>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <SnippetMeta
              label="Workspace"
              value={
                project?.widgetConfig.companyName ||
                project?.name ||
                "Your workspace"
              }
            />
            <SnippetMeta
              label="Position"
              value={ctx.position}
            />
            <SnippetMeta
              label="Origin"
              value={ctx.origin.replace(/^https?:\/\//, "")}
              mono
            />
          </div>
        </Card>
      </motion.div>

      {/* Programmatic API */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Programmatic control</CardTitle>
          <CardDescription>
            Open or close the chat from your own buttons and CTAs.
          </CardDescription>
          <pre className="mt-4 bg-sand-900 text-sand-100 rounded-xl p-4 text-xs font-mono overflow-x-auto leading-relaxed">
            <code>{`// Open the chat when the user clicks "Get help"
document.querySelector("#help-btn")
  .addEventListener("click", () => window.Clarix?.open());

// Close it programmatically
window.Clarix?.close();`}</code>
          </pre>
        </Card>

        <Card>
          <CardTitle>Test your install</CardTitle>
          <CardDescription>
            Verify everything is wired up before you deploy.
          </CardDescription>
          <ul className="mt-4 space-y-2.5 text-sm text-sand-700">
            <Check2 text="The launcher pill appears in the bottom corner." />
            <Check2 text="Clicking it opens the chat panel without a white box around it." />
            <Check2 text="Sending a message returns a streaming answer from your KB." />
            <Check2 text="The conversation shows up in the Conversations tab within a few seconds." />
          </ul>
          <Link
            href="/dashboard/conversations"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-sand-900 hover:text-sand-700 transition-colors"
          >
            Open Conversations
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </Card>
      </div>
    </div>
  );
}

function SnippetMeta({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="px-3 py-2 bg-sand-50 border border-sand-200 rounded-lg">
      <div className="text-[10px] uppercase tracking-wide font-bold text-sand-400">
        {label}
      </div>
      <div
        className={cn(
          "text-sand-800 truncate mt-0.5",
          mono ? "font-mono text-[11px]" : "text-xs font-semibold"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Check2({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <div className="w-4 h-4 rounded-full bg-status-success/15 flex items-center justify-center shrink-0 mt-0.5">
        <Check className="w-2.5 h-2.5 text-status-success" />
      </div>
      <span className="leading-relaxed">{text}</span>
    </li>
  );
}
