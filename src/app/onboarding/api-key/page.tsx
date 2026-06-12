"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  KeyRound,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Info,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpenAIKeyGuide } from "@/components/onboarding/openai-key-guide";
import type { PublicProject } from "@/lib/db/types";

/**
 * Mandatory onboarding step: collect an OpenAI API key for the current
 * project. Everything downstream (chunk embedding, chat completion,
 * quick replies, interview composer) uses the per-project key resolved
 * server-side, so we block the rest of the flow until the user has one.
 *
 * The guide is behind an info popup so the form itself stays focused,
 * one input, one button. Users who need hand-holding tap "How to get one"
 * and get the same 3-step walkthrough in a modal.
 */
export default function OnboardingApiKey() {
  const router = useRouter();
  const [project, setProject] = useState<PublicProject | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [reveal, setReveal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    fetch("/api/project")
      .then((r) => r.json())
      .then((p: PublicProject) => setProject(p))
      .catch(() => {
        /* layout will still render the form */
      });
  }, []);

  const alreadyConfigured = project?.hasOpenAIApiKey ?? false;

  const handleSave = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError("Paste a key to continue.");
      return;
    }
    if (!trimmed.startsWith("sk-")) {
      setError("That doesn't look like an OpenAI key. They start with sk-…");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/project", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project?.id ?? "proj_demo",
          openAIApiKey: trimmed,
        }),
      });
      if (!res.ok) {
        setError("Couldn't save your key. Please try again.");
        setSaving(false);
        return;
      }
      await continueAfterKey();
    } catch {
      setError("Network error, check your connection and try again.");
      setSaving(false);
    }
  };

  /**
   * If the user came from the "Explore the demo workspace" path, finish
   * the seed now that a key exists and drop them straight in the
   * playground. Otherwise continue the guided flow.
   */
  const continueAfterKey = async () => {
    if (sessionStorage.getItem("clarix_demo_path") === "1") {
      try {
        const res = await fetch("/api/demo/seed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: "proj_demo" }),
        });
        if (res.ok) {
          sessionStorage.removeItem("clarix_demo_path");
          router.push("/dashboard/playground");
          return;
        }
      } catch {
        // Fall through to the guided flow, demo content can be loaded
        // later from the knowledge step.
      }
      sessionStorage.removeItem("clarix_demo_path");
    }
    router.push("/onboarding/knowledge");
  };

  const handleSkipAhead = () => {
    void continueAfterKey();
  };

  return (
    <div>
      <div className="text-center mb-8">
        <motion.div
          className="w-14 h-14 rounded-2xl bg-sand-900 flex items-center justify-center mx-auto mb-5 shadow-sand"
          initial={{ scale: 0.85, rotate: -6 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <KeyRound className="w-6 h-6 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-sand-900 tracking-tighter mb-2">
          Connect OpenAI
        </h1>
        <p className="text-sand-600 max-w-md mx-auto">
          Clarix runs on your own OpenAI key so you stay in control of
          usage, billing, and your data. It takes about 60 seconds to get
          one.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {alreadyConfigured ? (
          <motion.div
            key="configured"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="max-w-md mx-auto"
          >
            <div className="bg-white border border-sand-200 rounded-2xl p-5 shadow-sand flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-status-success/10 text-status-success flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-sand-900 tracking-tight">
                  OpenAI key already configured
                </p>
                <p className="text-xs text-sand-500 mt-1 leading-relaxed">
                  This project already has a key saved. You can continue, or
                  replace it below.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <PasswordField
                label="Replace key (optional)"
                value={apiKey}
                reveal={reveal}
                onReveal={() => setReveal((v) => !v)}
                onChange={(val) => {
                  setApiKey(val);
                  setError(null);
                }}
                onEnter={handleSave}
              />
              {error && (
                <p className="text-xs text-status-error font-semibold flex items-center gap-1.5 mt-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6 justify-center">
              {apiKey.trim() ? (
                <Button onClick={handleSave} loading={saving} size="lg">
                  Save & continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSkipAhead} size="lg">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="max-w-md mx-auto"
          >
            {/* Info strip, soft nudge that opens the full guide on click */}
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="group w-full flex items-center gap-3 bg-white border border-sand-200 hover:border-sand-300 rounded-2xl px-4 py-3 mb-5 text-left transition-all cursor-pointer hover:shadow-sand"
            >
              <div className="w-9 h-9 rounded-xl bg-sand-100 border border-sand-200 text-sand-700 flex items-center justify-center shrink-0 group-hover:bg-sand-900 group-hover:text-white group-hover:border-sand-900 transition-colors">
                <Info className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-sand-900 tracking-tight">
                  Don&apos;t have a key yet?
                </p>
                <p className="text-xs text-sand-500 truncate">
                  Tap for a 3-step walkthrough, takes about a minute
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-sand-400 group-hover:text-sand-900 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Key input */}
            <PasswordField
              label="Paste your OpenAI API key"
              value={apiKey}
              reveal={reveal}
              onReveal={() => setReveal((v) => !v)}
              onChange={(val) => {
                setApiKey(val);
                setError(null);
              }}
              onEnter={handleSave}
              autoFocus
            />

            {error && (
              <p className="text-xs text-status-error font-semibold flex items-center gap-1.5 mt-2">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}

            <Button
              size="lg"
              className="w-full mt-5"
              onClick={handleSave}
              loading={saving}
              disabled={!apiKey.trim()}
            >
              Save & continue
              <ArrowRight className="w-4 h-4" />
            </Button>

            <p className="mt-4 text-[11px] text-sand-400 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3 h-3" />
              Stored server-side. Never sent back to the browser.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <OpenAIKeyGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}

/**
 * Self-contained password input with a proper eye toggle. We don't reuse
 * the shared `Input` component here because its wrapper includes the label
 * in the same box, which made it impossible to vertically center the eye
 * button inside just the input field.
 */
function PasswordField({
  label,
  value,
  reveal,
  onReveal,
  onChange,
  onEnter,
  autoFocus = false,
}: {
  label: string;
  value: string;
  reveal: boolean;
  onReveal: () => void;
  onChange: (val: string) => void;
  onEnter: () => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-sand-800 tracking-tight">
        {label}
      </label>
      <div className="relative">
        <input
          type={reveal ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEnter();
          }}
          placeholder="sk-..."
          autoFocus={autoFocus}
          className="w-full bg-white border border-sand-200 rounded-xl pl-4 pr-11 py-3 text-[0.9375rem] text-sand-900 placeholder:text-sand-400 focus:border-sand-900 focus:ring-2 focus:ring-sand-900/10 focus:outline-none hover:border-sand-300 transition-all font-mono"
        />
        <button
          type="button"
          onClick={onReveal}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg text-sand-400 hover:text-sand-900 hover:bg-sand-100 transition-colors flex items-center justify-center cursor-pointer"
          aria-label={reveal ? "Hide key" : "Show key"}
          tabIndex={-1}
        >
          {reveal ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
