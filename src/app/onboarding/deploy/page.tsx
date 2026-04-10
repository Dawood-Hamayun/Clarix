"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Copy, Check, PartyPopper, Code2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

export default function OnboardingDeploy() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fire confetti on mount
    const timer = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#E8723A", "#F5A623", "#4CAF82", "#5B8DEF"],
      });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const embedCode = `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js" data-project="proj_demo"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="text-center">
      <motion.div
        className="w-16 h-16 rounded-2xl bg-status-success/10 flex items-center justify-center mx-auto mb-6"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
      >
        <PartyPopper className="w-8 h-8 text-status-success" />
      </motion.div>

      <h1 className="text-3xl font-bold text-sand-900 mb-3">
        Your agent is ready!
      </h1>
      <p className="text-sand-600 mb-10 max-w-md mx-auto">
        Embed this chat widget on your website, or share the direct link with
        your customers.
      </p>

      {/* Embed code */}
      <motion.div
        className="max-w-lg mx-auto text-left mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Code2 className="w-4 h-4 text-sand-500" />
          <p className="text-sm font-medium text-sand-700">Embed code</p>
        </div>
        <div className="relative bg-sand-900 rounded-xl p-4 font-mono text-sm">
          <pre className="text-sand-300 overflow-x-auto whitespace-pre-wrap break-all">
            {embedCode}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-1.5 rounded-md bg-sand-800 hover:bg-sand-700 transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-status-success" />
            ) : (
              <Copy className="w-4 h-4 text-sand-400" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Share link */}
      <motion.div
        className="max-w-lg mx-auto text-left mb-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="w-4 h-4 text-sand-500" />
          <p className="text-sm font-medium text-sand-700">Direct link</p>
        </div>
        <div className="bg-sand-100 border border-sand-200 rounded-xl px-4 py-3 text-sm text-sand-600 font-mono">
          {typeof window !== "undefined" ? window.location.origin : ""}/widget/proj_demo
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Button size="lg" onClick={() => router.push("/dashboard")}>
          Go to Dashboard <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </div>
  );
}
