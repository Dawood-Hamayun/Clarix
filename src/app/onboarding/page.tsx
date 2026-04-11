"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function OnboardingWelcome() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Hydrate from sessionStorage so back-nav restores values
  useEffect(() => {
    const raw = sessionStorage.getItem("clarix_onboarding");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.companyName) setCompanyName(parsed.companyName);
        if (parsed.description) setDescription(parsed.description);
      } catch {}
    }
  }, []);

  const handleContinue = async () => {
    const name = companyName.trim() || "My Company";
    setSubmitting(true);
    sessionStorage.setItem(
      "clarix_onboarding",
      JSON.stringify({ companyName: name, description: description.trim() })
    );

    // Persist to project so the rest of the app picks it up immediately
    try {
      await fetch("/api/project", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: "proj_demo",
          name,
          description: description.trim(),
          widgetConfig: { companyName: name },
          agentConfig: { tagline: description.trim() },
        }),
      });
    } catch {
      // Non-blocking — sessionStorage still has the values
    }

    router.push("/onboarding/api-key");
  };

  return (
    <div className="text-center">
      <motion.div
        className="w-16 h-16 rounded-2xl bg-sand-900 flex items-center justify-center mx-auto mb-6 shadow-sand"
        initial={{ scale: 0.85, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
      >
        <Sparkles className="w-7 h-7 text-white" />
      </motion.div>

      <h1 className="text-4xl font-bold text-sand-900 tracking-tighter mb-3">
        Let&apos;s build your AI agent
      </h1>
      <p className="text-sand-600 mb-10 max-w-md mx-auto">
        In a few quick steps, you&apos;ll have a smart support agent that knows
        your business inside out.
      </p>

      <div className="max-w-sm mx-auto space-y-5 text-left">
        <Input
          label="What's your company called?"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Acme Inc."
          autoFocus
        />

        <Input
          label="In one sentence, what do you do?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="We help teams ship faster"
          hint="Optional — used to focus the agent on what matters."
        />
      </div>

      {/* Live preview */}
      {companyName.trim() && (
        <motion.div
          className="mt-8 max-w-sm mx-auto bg-white border border-sand-200 rounded-2xl p-4 text-left shadow-sand"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.25 }}
        >
          <p className="text-[10px] uppercase tracking-wide font-bold text-sand-400 mb-1.5">
            Your agent will greet
          </p>
          <p className="text-sm text-sand-800 leading-relaxed">
            {`“Hi! I'm the ${companyName.trim()} assistant. How can I help you today?”`}
          </p>
        </motion.div>
      )}

      <Button
        size="lg"
        className="mt-8"
        onClick={handleContinue}
        loading={submitting}
      >
        Continue <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
