"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MessageSquare,
  Sparkles,
  Bot,
  Palette,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import type {
  AgentPersonality,
  PublicProject,
  WidgetConfig,
} from "@/lib/db/types";

const COLOR_OPTIONS = [
  { value: "#1F1B16", label: "Sand" },
  { value: "#E8723A", label: "Warm Orange" },
  { value: "#5B8DEF", label: "Blue" },
  { value: "#4CAF82", label: "Green" },
  { value: "#8B5CF6", label: "Purple" },
];

const PERSONALITIES: {
  value: AgentPersonality;
  label: string;
  description: string;
}[] = [
  {
    value: "friendly",
    label: "Friendly",
    description: "Warm, conversational, approachable",
  },
  {
    value: "professional",
    label: "Professional",
    description: "Polished, precise, business-appropriate",
  },
  {
    value: "playful",
    label: "Playful",
    description: "Cheerful, witty, a little casual",
  },
  {
    value: "technical",
    label: "Technical",
    description: "Precise, thorough, engineer-ready",
  },
  {
    value: "empathetic",
    label: "Empathetic",
    description: "Patient, reassuring, validates feelings",
  },
  {
    value: "concise",
    label: "Concise",
    description: "Direct, efficient, shortest possible",
  },
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

export default function OnboardingCustomize() {
  const router = useRouter();
  const [project, setProject] = useState<PublicProject | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Local form state, initialised from project once it loads
  const [agentName, setAgentName] = useState("");
  const [personality, setPersonality] = useState<AgentPersonality>("friendly");
  const [color, setColor] = useState("#1F1B16");
  const [greeting, setGreeting] = useState("");
  const [launcherLabel, setLauncherLabel] = useState("Chat with us");
  const [position, setPosition] =
    useState<WidgetConfig["position"]>("bottom-right");
  const [radius, setRadius] = useState<WidgetConfig["radius"]>("soft");

  useEffect(() => {
    fetch("/api/project")
      .then((r) => r.json())
      .then((p: PublicProject) => {
        setProject(p);
        setAgentName(p.agentConfig.agentName || "");
        setPersonality(p.agentConfig.personality || "friendly");
        setColor(p.widgetConfig.primaryColor || "#1F1B16");
        setGreeting(
          p.widgetConfig.greeting ||
            `Hi! I'm the ${p.widgetConfig.companyName} assistant. How can I help you today?`
        );
        setLauncherLabel(p.widgetConfig.launcherLabel || "Chat with us");
        setPosition(p.widgetConfig.position || "bottom-right");
        setRadius(p.widgetConfig.radius || "soft");
      });
  }, []);

  const radiusClass = useMemo(
    () => RADIUS_OPTIONS.find((r) => r.value === radius)?.classes ?? "rounded-2xl",
    [radius]
  );

  const handleContinue = async () => {
    if (!project) return;
    setSubmitting(true);
    try {
      await fetch("/api/project", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          agentConfig: {
            agentName: agentName.trim() || project.widgetConfig.companyName,
            personality,
          },
          widgetConfig: {
            primaryColor: color,
            greeting,
            launcherLabel,
            position,
            radius,
          },
        }),
      });
    } catch {
      // best-effort
    }
    router.push("/onboarding/test");
  };

  if (!project) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-sand-100 border border-sand-200 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-sand-900 tracking-tighter mb-2">
          Customize your agent
        </h1>
        <p className="text-sand-600">
          Give it a name, a voice, and a look that matches your brand.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3 space-y-5">
          {/* Agent identity */}
          <Section icon={Bot} title="Agent identity">
            <Input
              label="Agent name"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="e.g. Ava, Max, Sage"
              hint={`When customers ask "who are you?", the agent will call itself ${
                agentName.trim() || "…"
              }.`}
            />

            <div className="space-y-2 mt-4">
              <label className="block text-sm font-semibold text-sand-800 tracking-tight">
                Personality
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PERSONALITIES.map((p) => {
                  const active = personality === p.value;
                  return (
                    <button
                      key={p.value}
                      onClick={() => setPersonality(p.value)}
                      className={cn(
                        "text-left p-3 rounded-xl border transition-all cursor-pointer",
                        active
                          ? "border-sand-900 bg-sand-50 shadow-sand"
                          : "border-sand-200 bg-white hover:bg-sand-150 hover:border-sand-300"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-sand-900 tracking-tight">
                          {p.label}
                        </span>
                        {active && (
                          <Check className="w-3.5 h-3.5 text-sand-900" />
                        )}
                      </div>
                      <p className="text-[11px] text-sand-500 leading-snug mt-0.5">
                        {p.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* Widget appearance */}
          <Section icon={Palette} title="Widget appearance">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-sand-800 tracking-tight mb-2">
                  Accent color
                </label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setColor(opt.value)}
                      title={opt.label}
                      className={cn(
                        "w-9 h-9 rounded-full transition-all ring-2 ring-offset-2",
                        color === opt.value
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
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  rows={3}
                  placeholder="Hi! How can I help you today?"
                  className="w-full bg-white border border-sand-200 rounded-xl px-4 py-3 text-[0.9375rem] text-sand-900 placeholder:text-sand-400 focus:border-sand-900 focus:ring-2 focus:ring-sand-900/10 focus:outline-none transition-all resize-none"
                />
              </div>

              <Input
                label="Launcher label"
                value={launcherLabel}
                onChange={(e) => setLauncherLabel(e.target.value)}
                placeholder="Chat with us"
                hint="Shown next to the floating chat button on your website."
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-sand-800 tracking-tight">
                    Position
                  </label>
                  <div className="space-y-1.5">
                    {POSITION_OPTIONS.map((opt) => {
                      const active = position === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setPosition(opt.value)}
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

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-sand-800 tracking-tight">
                    Corner radius
                  </label>
                  <div className="space-y-1.5">
                    {RADIUS_OPTIONS.map((opt) => {
                      const active = radius === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setRadius(opt.value)}
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
            </div>
          </Section>
        </div>

        {/* Live preview */}
        <div className="lg:col-span-2">
          <p className="text-xs uppercase tracking-wide font-bold text-sand-400 mb-3">
            Live preview
          </p>
          <motion.div
            layout
            className={cn(
              "bg-white border border-sand-200 overflow-hidden shadow-sand-lg",
              radiusClass
            )}
          >
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{ backgroundColor: color }}
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white tracking-tight">
                {agentName.trim() || project.widgetConfig.companyName}
              </span>
            </div>
            <div className="p-4 min-h-[180px]">
              <div className="flex gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: color + "22" }}
                >
                  <Sparkles className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <div className="bg-sand-50 border border-sand-100 rounded-2xl rounded-tl-md px-3 py-2 text-sm text-sand-700 max-w-[85%] leading-relaxed">
                  {greeting || "Hi! How can I help you today?"}
                </div>
              </div>
            </div>
            <div className="border-t border-sand-200 px-4 py-3 flex gap-2">
              <div className="flex-1 bg-sand-50 rounded-lg px-3 py-2 text-sm text-sand-400">
                Type a message…
              </div>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: color }}
              >
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
            </div>
          </motion.div>

          <div className="mt-3 flex items-center gap-2 text-xs text-sand-500 px-1">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            Launcher: &ldquo;{launcherLabel}&rdquo; · {position}
          </div>
        </div>
      </div>

      <div className="text-center mt-10">
        <Button size="lg" onClick={handleContinue} loading={submitting}>
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Bot;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-sand-200 rounded-2xl p-5 shadow-sand">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-sand-900 text-white flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="text-base font-bold text-sand-900 tracking-tight">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
