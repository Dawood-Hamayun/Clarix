"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  KeyRound,
  Sparkles,
} from "lucide-react";

/**
 * Lightweight "How to get an OpenAI key" overlay.
 *
 * Visual language mirrors the KB guide (`src/components/knowledge/kb-guide.tsx`)
 * so the two feel like one system, but the surface is intentionally softer
 * (sand-50 card on a lighter sand-900/15 backdrop) because this is an
 * informational side-trip from the onboarding flow, not a destination.
 *
 * Kept in its own component so the onboarding page and the Settings page
 * can both pop the same overlay without duplicating the copy.
 */
export function OpenAIKeyGuide({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while the overlay is open so background content
  // doesn't bounce around behind the dialog.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-sand-900/15 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="openai-key-guide-title"
            className="relative w-full max-w-xl max-h-[88vh] overflow-y-auto bg-sand-50 border border-sand-200 rounded-3xl shadow-sand-xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-sand-50/95 backdrop-blur-sm border-b border-sand-200 px-6 py-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sand-900 text-white flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  id="openai-key-guide-title"
                  className="text-base font-bold text-sand-900 tracking-tight"
                >
                  Get your OpenAI key
                </h3>
                <p className="text-xs text-sand-500 mt-0.5">
                  Takes about a minute, you&apos;ll need a paid account
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-9 h-9 rounded-xl text-sand-500 hover:bg-sand-200 hover:text-sand-900 transition-all flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <Step
                n={1}
                icon={ExternalLink}
                title="Sign in to OpenAI"
                href="https://platform.openai.com/api-keys"
                hrefLabel="platform.openai.com/api-keys"
                body="Open the API keys page and log in. If you don't have an account yet, sign up, it's free."
              />

              <Step
                n={2}
                icon={Sparkles}
                title="Create a new secret key"
                body={
                  <>
                    Click{" "}
                    <span className="font-semibold text-sand-900">
                      Create new secret key
                    </span>
                    , give it a label like{" "}
                    <code className="font-mono text-[11px] px-1.5 py-0.5 bg-white border border-sand-200 rounded">
                      Clarix
                    </code>
                    , and copy the value. It starts with{" "}
                    <code className="font-mono text-[11px] px-1.5 py-0.5 bg-white border border-sand-200 rounded">
                      sk-
                    </code>{" "}
                   , you&apos;ll only see it once, so paste it into Clarix
                    right after.
                  </>
                }
              />

              <Step
                n={3}
                icon={CreditCard}
                title="Add at least $5 of credit"
                href="https://platform.openai.com/account/billing/overview"
                hrefLabel="Billing → Add to credit balance"
                body="GPT-4o and embeddings require a funded paid account. Clarix can't call OpenAI with a free-tier key."
              />

              <div className="flex items-start gap-2.5 p-4 bg-white border border-sand-200 rounded-2xl">
                <ShieldCheck className="w-4 h-4 text-sand-600 shrink-0 mt-0.5" />
                <p className="text-xs text-sand-600 leading-relaxed">
                  Your key is stored server-side against this project and
                  never round-trips back to the browser. You can rotate or
                  delete it any time from{" "}
                  <span className="font-semibold text-sand-800">Settings</span>.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  body,
  href,
  hrefLabel,
}: {
  n: number;
  icon: typeof KeyRound;
  title: string;
  body: React.ReactNode;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-white border border-sand-200 rounded-2xl p-4">
      <div className="relative shrink-0">
        <div className="w-9 h-9 rounded-xl bg-sand-900 text-white flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white border border-sand-200 text-[10px] font-bold text-sand-700 flex items-center justify-center">
          {n}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-sand-900 tracking-tight">
          {title}
        </p>
        <div className="text-xs text-sand-600 leading-relaxed mt-1">
          {body}
        </div>
        {href && hrefLabel && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sand-900 hover:text-sand-700 underline underline-offset-2"
          >
            {hrefLabel}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
