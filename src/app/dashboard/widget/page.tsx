"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  Code2,
  Sparkles,
  MessageSquare,
  Palette,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import type { PublicProject, WidgetConfig } from "@/lib/db/types";

const COLOR_OPTIONS = [
  { value: "#1F1B16", label: "Sand" },
  { value: "#E8723A", label: "Orange" },
  { value: "#5B8DEF", label: "Blue" },
  { value: "#4CAF82", label: "Green" },
  { value: "#8B5CF6", label: "Purple" },
];

const RADIUS_OPTIONS: {
  value: WidgetConfig["radius"];
  label: string;
  classes: string;
}[] = [
  { value: "sharp", label: "Sharp", classes: "rounded-md" },
  { value: "soft", label: "Soft", classes: "rounded-2xl" },
  { value: "round", label: "Round", classes: "rounded-3xl" },
];

const POSITION_OPTIONS: {
  value: WidgetConfig["position"];
  label: string;
}[] = [
  { value: "bottom-right", label: "Bottom right" },
  { value: "bottom-left", label: "Bottom left" },
];

export default function WidgetPage() {
  const [project, setProject] = useState<PublicProject | null>(null);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/project")
      .then((r) => r.json())
      .then((p: PublicProject) => {
        setProject(p);
        setConfig(p.widgetConfig);
        setLoading(false);
      });
  }, []);

  const dirty = useMemo(() => {
    if (!project || !config) return false;
    return JSON.stringify(project.widgetConfig) !== JSON.stringify(config);
  }, [project, config]);

  const radiusClass = useMemo(
    () =>
      RADIUS_OPTIONS.find((r) => r.value === config?.radius)?.classes ??
      "rounded-2xl",
    [config?.radius]
  );

  const embedCode = useMemo(() => {
    if (!project || !config) return "";
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://app.example.com";
    return `<script src="${origin}/widget.js" data-project="${project.id}" data-color="${config.primaryColor}" data-position="${config.position}"></script>`;
  }, [project, config]);

  const handleSave = async () => {
    if (!project || !config) return;
    setSaving(true);
    const res = await fetch("/api/project", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        widgetConfig: config,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProject(updated);
      setConfig(updated.widgetConfig);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
    setSaving(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !project || !config) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-[480px] bg-sand-100 border border-sand-200 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  const updateConfig = (patch: Partial<WidgetConfig>) =>
    setConfig({ ...config, ...patch });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
      {/* Configuration */}
      <div className="space-y-6">
        <Card>
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-sand-900 text-white flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Style the chat widget so it feels native to your site.
              </CardDescription>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-sand-800 tracking-tight mb-2">
                Accent color
              </label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateConfig({ primaryColor: opt.value })}
                    title={opt.label}
                    className={cn(
                      "w-9 h-9 rounded-full transition-all ring-2 ring-offset-2",
                      config.primaryColor === opt.value
                        ? "ring-sand-900 scale-110"
                        : "ring-transparent hover:ring-sand-200"
                    )}
                    style={{ backgroundColor: opt.value }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-sand-800 tracking-tight">
                Greeting message
              </label>
              <textarea
                value={config.greeting}
                onChange={(e) => updateConfig({ greeting: e.target.value })}
                rows={2}
                className="w-full bg-white border border-sand-200 rounded-xl px-4 py-3 text-sm text-sand-900 placeholder:text-sand-400 focus:border-sand-900 focus:ring-2 focus:ring-sand-900/10 focus:outline-none transition-all resize-none"
              />
            </div>

            <Input
              label="Launcher label"
              value={config.launcherLabel}
              onChange={(e) => updateConfig({ launcherLabel: e.target.value })}
              placeholder="Chat with us"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-sand-800 tracking-tight mb-2">
                  Position
                </label>
                <div className="space-y-1.5">
                  {POSITION_OPTIONS.map((opt) => {
                    const active = config.position === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => updateConfig({ position: opt.value })}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                          active
                            ? "border-sand-900 bg-sand-50 text-sand-900"
                            : "border-sand-200 bg-white text-sand-600 hover:bg-sand-150"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-sand-800 tracking-tight mb-2">
                  Corner radius
                </label>
                <div className="space-y-1.5">
                  {RADIUS_OPTIONS.map((opt) => {
                    const active = config.radius === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => updateConfig({ radius: opt.value })}
                        className={cn(
                          "w-full text-left px-3 py-2 border text-sm font-medium transition-all",
                          opt.classes,
                          active
                            ? "border-sand-900 bg-sand-50 text-sand-900"
                            : "border-sand-200 bg-white text-sand-600 hover:bg-sand-150"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button
                onClick={handleSave}
                loading={saving}
                disabled={!dirty}
              >
                <Save className="w-4 h-4" />
                {saved ? "Saved!" : "Save changes"}
              </Button>
              <AnimatePresence>
                {saved && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-status-success font-semibold tracking-tight"
                  >
                    Updated
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Card>

        {/* Embed code */}
        <Card>
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-sand-900 text-white flex items-center justify-center shrink-0">
              <Code2 className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <CardTitle>Embed code</CardTitle>
              <CardDescription>
                Drop this snippet into your site, just before the closing
                &lt;/body&gt; tag.
              </CardDescription>
            </div>
          </div>
          <div className="relative bg-sand-900 rounded-xl p-4 font-mono text-xs">
            <pre className="text-sand-300 overflow-x-auto whitespace-pre-wrap break-all">
              {embedCode}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-sand-800 hover:bg-sand-700 transition-colors"
              aria-label="Copy embed code"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-status-success" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-sand-400" />
              )}
            </button>
          </div>
        </Card>
      </div>

      {/* Live preview */}
      <div>
        <p className="text-xs uppercase tracking-wide font-bold text-sand-400 mb-3">
          Live preview
        </p>
        <div className="bg-sand-100/50 rounded-2xl p-6 min-h-[540px] relative border border-sand-200 overflow-hidden">
          {/* Mock website content */}
          <div className="bg-white rounded-xl p-4 mb-3 border border-sand-200">
            <div className="h-3 bg-sand-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-sand-200 rounded w-1/2 mb-2" />
            <div className="h-3 bg-sand-200 rounded w-2/3" />
          </div>
          <div className="bg-white rounded-xl p-4 border border-sand-200">
            <div className="h-3 bg-sand-200 rounded w-full mb-2" />
            <div className="h-3 bg-sand-200 rounded w-4/5" />
          </div>

          {/* Widget preview */}
          <motion.div
            className={cn(
              "absolute bottom-6",
              config.position === "bottom-right" ? "right-6" : "left-6"
            )}
            layout
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
          >
            <motion.div
              layout
              className={cn(
                "w-64 sm:w-72 max-w-[calc(100vw-3rem)] bg-white shadow-sand-lg border border-sand-200 overflow-hidden mb-3",
                radiusClass
              )}
            >
              <div
                className="px-4 py-3 flex items-center gap-2"
                style={{ backgroundColor: config.primaryColor }}
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-sm font-semibold text-white tracking-tight">
                  {config.companyName}
                </span>
              </div>
              <div className="p-4">
                <div className="flex gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: config.primaryColor + "22" }}
                  >
                    <Sparkles
                      className="w-3.5 h-3.5"
                      style={{ color: config.primaryColor }}
                    />
                  </div>
                  <div className="bg-sand-50 border border-sand-100 rounded-2xl rounded-tl-md px-3 py-2 text-xs text-sand-700 leading-relaxed">
                    {config.greeting}
                  </div>
                </div>
              </div>
              <div className="border-t border-sand-200 px-4 py-2.5 flex gap-2">
                <div className="flex-1 bg-sand-50 rounded-lg px-2.5 py-1.5 text-xs text-sand-400">
                  Type a message…
                </div>
              </div>
            </motion.div>

            {/* Launcher */}
            <div
              className={cn(
                "flex items-center gap-2",
                config.position === "bottom-right"
                  ? "justify-end"
                  : "justify-start"
              )}
            >
              {config.position === "bottom-left" && (
                <div
                  className="rounded-full shadow-lg flex items-center justify-center cursor-pointer w-12 h-12"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="bg-white border border-sand-200 rounded-full px-3 py-1.5 text-xs font-semibold text-sand-700 shadow-sand">
                {config.launcherLabel}
              </div>
              {config.position === "bottom-right" && (
                <div
                  className="rounded-full shadow-lg flex items-center justify-center cursor-pointer w-12 h-12"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
