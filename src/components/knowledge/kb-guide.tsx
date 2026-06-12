"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Info,
  Building2,
  Package,
  CreditCard,
  HelpCircle,
  Mail,
  Wrench,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

interface ChecklistItem {
  icon: LucideIcon;
  title: string;
  description: string;
  examples: string[];
}

const CHECKLIST: ChecklistItem[] = [
  {
    icon: Building2,
    title: "Company overview",
    description:
      "Who you are, what you do, and who you serve. This grounds every other answer.",
    examples: [
      "One-line elevator pitch",
      "Mission / values",
      "Team or founding story",
    ],
  },
  {
    icon: Package,
    title: "Products or services",
    description:
      "Detailed descriptions of what you offer, including features and capabilities.",
    examples: [
      "Feature lists",
      "What's included / what's not",
      "Use cases & who it's for",
    ],
  },
  {
    icon: CreditCard,
    title: "Pricing & plans",
    description:
      "Exact pricing, tiers, billing cycles, and what each plan includes.",
    examples: [
      "Plan comparison table",
      "Add-ons & usage limits",
      "Free trial / money-back policy",
    ],
  },
  {
    icon: HelpCircle,
    title: "FAQ",
    description:
      "The top questions customers actually ask. Write them in natural language, exactly as users phrase them.",
    examples: [
      "'How do I…' questions",
      "Common troubleshooting",
      "Edge cases & gotchas",
    ],
  },
  {
    icon: Wrench,
    title: "How-to guides",
    description:
      "Step-by-step instructions for the most common customer workflows.",
    examples: [
      "Getting started / onboarding",
      "Key feature walkthroughs",
      "Integration guides",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Policies",
    description:
      "Refunds, returns, privacy, terms, cancellation, SLA, anything customers may ask about.",
    examples: [
      "Refund / return policy",
      "Privacy & data handling",
      "Cancellation process",
    ],
  },
  {
    icon: Mail,
    title: "Contact & escalation",
    description:
      "How and when to reach a human. The agent will use this when it can't answer.",
    examples: [
      "Support email / hours",
      "Escalation path",
      "Emergency contact",
    ],
  },
];

const TIPS = [
  "Write in **plain language**: the same words your customers use.",
  "Prefer **short, focused documents** over one giant wall of text.",
  "Use **headings** (`## Section`), they help the agent find the right answer.",
  "Include **exact numbers, dates, and names**. Vague info → vague answers.",
  "Keep content **up to date**: outdated knowledge is worse than missing knowledge.",
];

interface KBGuideButtonProps {
  /** Compact icon-only mode for tight toolbars */
  iconOnly?: boolean;
  /** Match the size of the action button it sits next to */
  size?: ButtonProps["size"];
  className?: string;
}

/**
 * Trigger button that opens the KB guide as a fullscreen overlay.
 * Wraps the shared Button component so it matches whatever primary
 * action it sits beside.
 */
export function KBGuideButton({
  iconOnly = false,
  size = "lg",
  className,
}: KBGuideButtonProps) {
  const [open, setOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <Button
        variant="secondary"
        size={size}
        onClick={() => setOpen(true)}
        className={className}
        aria-label={iconOnly ? "Open KB guide" : undefined}
      >
        <BookOpen className="w-4 h-4" />
        {!iconOnly && "Guide"}
      </Button>

      <AnimatePresence>
        {open && (
          <KBGuideOverlay onClose={() => setOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function KBGuideOverlay({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 bg-sand-900/30 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[88vh] overflow-y-auto bg-white border border-sand-200 rounded-3xl shadow-sand-xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-sand-200 px-7 py-5 flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-sand-900 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-sand-900 tracking-tight">
              What makes a great knowledge base
            </h3>
            <p className="text-sm text-sand-500 mt-0.5">
              A quick checklist of what to include for accurate answers
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-xl text-sand-500 hover:bg-sand-150 hover:text-sand-900 transition-all flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CHECKLIST.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                  className="bg-sand-50 border border-sand-200 rounded-2xl p-4 hover:bg-sand-100 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-4 h-4 text-sand-900 shrink-0" />
                    <h4 className="text-sm font-bold text-sand-900 tracking-tight">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-xs text-sand-600 leading-relaxed mb-2.5">
                    {item.description}
                  </p>
                  <ul className="space-y-1">
                    {item.examples.map((ex) => (
                      <li
                        key={ex}
                        className="text-[11px] text-sand-500 flex items-start gap-1.5"
                      >
                        <span className="text-sand-400 mt-0.5">•</span>
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>

          {/* Tips */}
          <div className="mt-5 bg-sand-900 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-sand-300" />
              <h4 className="text-sm font-bold text-white tracking-tight">
                Tips for better answers
              </h4>
            </div>
            <ul className="space-y-2">
              {TIPS.map((tip) => (
                <li
                  key={tip}
                  className="text-xs text-sand-300 flex items-start gap-2 leading-relaxed"
                >
                  <span className="text-sand-500 mt-0.5 shrink-0">→</span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: tip
                        .replace(
                          /\*\*(.+?)\*\*/g,
                          '<strong class="text-white font-bold">$1</strong>'
                        )
                        .replace(
                          /`(.+?)`/g,
                          '<code class="bg-sand-800 text-sand-100 px-1 py-0.5 rounded text-[10px] font-mono">$1</code>'
                        ),
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export { CHECKLIST as KB_CHECKLIST };
