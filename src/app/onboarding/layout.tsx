"use client";

import { Check } from "lucide-react";
import { ClarixMark } from "@/components/ui/clarix-mark";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

const steps = [
  { path: "/onboarding", label: "Welcome" },
  { path: "/onboarding/api-key", label: "API key" },
  { path: "/onboarding/knowledge", label: "Knowledge" },
  { path: "/onboarding/customize", label: "Customize" },
  { path: "/onboarding/test", label: "Test" },
  { path: "/onboarding/deploy", label: "Deploy" },
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentStep = Math.max(
    0,
    steps.findIndex((s) => s.path === pathname)
  );
  const progress = ((currentStep + 1) / steps.length) * 100;
  // The intro route runs its own story-bar progress; the multi-step
  // indicator only applies once a visitor enters the guided flow.
  const isIntro = pathname === "/onboarding";

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-sand-200 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: -8, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <ClarixMark className="w-8 h-8" />
            </motion.div>
            <span className="text-lg font-bold text-sand-900 tracking-tighter">
              Clarix
            </span>
          </Link>

          {/* Step indicator */}
          <div className={cn("flex items-center gap-2", isIntro && "hidden")}>
            {steps.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={step.path} className="flex items-center gap-2">
                  <motion.div
                    layout
                    className={cn(
                      "flex items-center justify-center rounded-full text-[10px] font-bold tracking-tight transition-colors",
                      done
                        ? "w-5 h-5 bg-sand-900 text-white"
                        : active
                        ? "w-5 h-5 bg-sand-900 text-white"
                        : "w-2 h-2 bg-sand-300"
                    )}
                  >
                    {done ? (
                      <Check className="w-3 h-3" />
                    ) : active ? (
                      i + 1
                    ) : null}
                  </motion.div>
                  {i < steps.length - 1 && (
                    <div className="w-4 h-px bg-sand-200" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress bar */}
        {!isIntro && (
          <div className="h-0.5 bg-sand-200">
            <motion.div
              className="h-full bg-sand-900"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-6 py-12">
        <div className="w-full max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
