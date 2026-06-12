"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const PILOT_MAILTO =
  "mailto:fixitdavid7@gmail.com?subject=Clarix%20pilot%3A%20test%20it%20on%20our%20data";

/**
 * Cinematic demo intro. Three short auto-advancing acts tell the visitor
 * what they're about to see, story-bar style, while the Acme Cloud
 * workspace seeds in the background. By the time the intro ends, the
 * demo is genuinely ready: the animation IS the loading screen.
 *
 * Click anywhere to advance, or skip straight to the end. If no OpenAI
 * key is configured, the finale routes through the key step first
 * (api-key/page.tsx finishes the seed afterwards).
 */

const ACT_DURATIONS = [4600, 4200, 4600]; // ms per act; finale holds

type SeedState = "pending" | "ready" | "needs_key" | "error";

export default function OnboardingIntro() {
  const router = useRouter();
  const [act, setAct] = useState(0);
  const [seedState, setSeedState] = useState<SeedState>("pending");
  const [entering, setEntering] = useState(false);
  const seedStarted = useRef(false);

  /* Seed the workspace while the story plays */
  useEffect(() => {
    if (seedStarted.current) return;
    seedStarted.current = true;
    (async () => {
      try {
        const res = await fetch("/api/demo/seed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: "proj_demo" }),
        });
        if (res.ok) {
          setSeedState("ready");
          return;
        }
        const data = await res.json().catch(() => ({}));
        setSeedState(
          data.code === "missing_openai_key" ? "needs_key" : "error"
        );
      } catch {
        setSeedState("error");
      }
    })();
  }, []);

  /* Auto-advance the acts */
  useEffect(() => {
    if (act >= 3) return;
    const t = setTimeout(() => setAct(act + 1), ACT_DURATIONS[act]);
    return () => clearTimeout(t);
  }, [act]);

  const advance = () => setAct((a) => Math.min(a + 1, 3));

  const handleEnter = async () => {
    if (seedState === "ready") {
      setEntering(true);
      router.push("/dashboard/playground");
      return;
    }
    if (seedState === "needs_key") {
      sessionStorage.setItem("clarix_demo_path", "1");
      router.push("/onboarding/api-key");
      return;
    }
    // error: retry the seed
    setSeedState("pending");
    try {
      const res = await fetch("/api/demo/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: "proj_demo" }),
      });
      if (res.ok) {
        setSeedState("ready");
        setEntering(true);
        router.push("/dashboard/playground");
        return;
      }
      const data = await res.json().catch(() => ({}));
      setSeedState(data.code === "missing_openai_key" ? "needs_key" : "error");
    } catch {
      setSeedState("error");
    }
  };

  return (
    <div
      className="select-none cursor-default"
      onClick={act < 3 ? advance : undefined}
    >
      {/* Story bars + skip */}
      <div className="flex items-center gap-4 mb-12">
        <div className="flex-1 flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex-1 h-[3px] rounded-full bg-sand-200 overflow-hidden"
            >
              {act > i ? (
                <div className="h-full w-full bg-sand-950 rounded-full" />
              ) : act === i ? (
                <motion.div
                  key={`fill-${i}-${act}`}
                  className="h-full bg-sand-950 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: ACT_DURATIONS[i] / 1000,
                    ease: "linear",
                  }}
                />
              ) : null}
            </div>
          ))}
        </div>
        {act < 3 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAct(3);
            }}
            className="label-mono text-sand-400 hover:text-sand-950 transition-colors"
          >
            Skip →
          </button>
        ) : (
          <span className="label-mono text-sand-400">The demo</span>
        )}
      </div>

      {/* Stage */}
      <div className="min-h-[460px]">
        <AnimatePresence mode="wait">
          {act === 0 && (
            <Act key="act0" kicker="Act 1 · The knowledge" title={<>First, it learns the business.</>}>
              <ActLoad />
            </Act>
          )}
          {act === 1 && (
            <Act key="act1" kicker="Act 2 · The agent" title={<>Then you meet Ava.</>}>
              <ActMeet />
            </Act>
          )}
          {act === 2 && (
            <Act key="act2" kicker="Act 3 · Your mission" title={<>Try to break it.</>}>
              <ActMission />
            </Act>
          )}
          {act === 3 && (
            <Act key="act3" kicker="Curtain up" title={<>Your workspace is live.</>}>
              <ActReady
                seedState={seedState}
                entering={entering}
                onEnter={handleEnter}
              />
            </Act>
          )}
        </AnimatePresence>
      </div>

      {act < 3 && (
        <p className="label-mono text-sand-400 text-center mt-8">
          Click to skip ahead
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Act scaffold                                                        */
/* ------------------------------------------------------------------ */

function Act({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="label-mono text-sand-400 text-center">{kicker}</p>
      <h1 className="mt-4 text-center text-4xl md:text-5xl font-bold text-sand-950 tracking-tighter leading-[1.02]">
        {title}
      </h1>
      <div className="mt-10 max-w-md mx-auto">{children}</div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Act 1: the knowledge loads                                          */
/* ------------------------------------------------------------------ */

function ActLoad() {
  const rows = [
    { name: "Pricing & plans", meta: "14 answers" },
    { name: "Product & features", meta: "21 answers" },
    { name: "Security & privacy", meta: "12 answers" },
  ];
  return (
    <div className="bg-white border border-sand-200 rounded-2xl p-5 shadow-sand">
      <p className="label-mono text-sand-400 mb-4">
        Loading the sample company: Acme Cloud
      </p>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <motion.div
            key={r.name}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.7, duration: 0.4 }}
            className="flex items-center justify-between gap-3 border border-sand-200 rounded-xl px-4 py-3"
          >
            <span className="text-sm font-semibold text-sand-900 tracking-tight">
              {r.name}
            </span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 + i * 0.7 }}
              className="label-mono text-sand-400 shrink-0"
            >
              {r.meta} ✓
            </motion.span>
          </motion.div>
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.1 }}
        className="label-mono text-sand-500 mt-5 pt-4 border-t border-sand-200"
      >
        47 answers ready. Yours would load the same way
      </motion.p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Act 2: meet Ava                                                     */
/* ------------------------------------------------------------------ */

function TypedLine({ text, delay }: { text: string; delay: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let i = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setN(i);
        if (i >= text.length && interval) clearInterval(interval);
      }, 24);
    }, delay);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [text, delay]);

  return (
    <span className={n < text.length ? "demo-caret" : undefined}>
      {text.slice(0, n)}
    </span>
  );
}

function ActMeet() {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 240, damping: 16 }}
        className="relative"
      >
        <div className="w-16 h-16 rounded-full bg-sand-950 text-sand-50 flex items-center justify-center text-xl font-bold select-none">
          A
        </div>
        <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-status-success border-2 border-sand-50 pulse-dot" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.4 }}
        className="mt-6 bg-white border border-sand-200 rounded-2xl rounded-tl-md px-5 py-3.5 shadow-sand text-[0.9375rem] text-sand-800 leading-relaxed min-h-[3.25rem] w-full text-center"
      >
        <TypedLine
          text="Hi, I'm Ava. Ask me anything about Acme Cloud."
          delay={1300}
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.2 }}
        className="label-mono text-sand-400 mt-6"
      >
        She answers from the docs. Nothing else
      </motion.p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Act 3: the mission                                                  */
/* ------------------------------------------------------------------ */

function ActMission() {
  const missions = [
    "Ask the easy ones: pricing, refunds, security",
    "Then ask something that isn't in the docs",
    "Watch it hand off instead of guessing",
  ];
  return (
    <div>
      <div className="bg-white border border-sand-200 rounded-2xl shadow-sand overflow-hidden">
        {missions.map((m, i) => (
          <motion.div
            key={m}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.8, duration: 0.4 }}
            className={`flex items-baseline gap-4 px-5 py-4 ${
              i > 0 ? "border-t border-sand-150" : ""
            }`}
          >
            <span className="font-mono text-xs text-sand-400 shrink-0">
              0{i + 1}
            </span>
            <p className="text-[0.9375rem] font-semibold text-sand-900 tracking-tight">
              {m}
            </p>
          </motion.div>
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.2 }}
        className="label-mono text-sand-400 text-center mt-5"
      >
        That last one is the whole point
      </motion.p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Finale: enter the demo                                              */
/* ------------------------------------------------------------------ */

function ActReady({
  seedState,
  entering,
  onEnter,
}: {
  seedState: SeedState;
  entering: boolean;
  onEnter: () => void;
}) {
  const status = {
    pending: "Preparing the workspace…",
    ready: "Acme Cloud loaded · live agent · dashboard",
    needs_key: "One quick step left, then you're in",
    error: "Something hiccuped. Try again below",
  }[seedState];

  const buttonLabel = {
    pending: "Almost ready…",
    ready: "Enter the demo →",
    needs_key: "Continue →",
    error: "Try again",
  }[seedState];

  return (
    <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="label-mono text-sand-500 flex items-center gap-2"
      >
        {seedState === "pending" ? (
          <motion.span
            className="w-3 h-3 border-[1.5px] border-sand-400 border-t-transparent rounded-full inline-block"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <span className="text-sand-950">✓</span>
        )}
        {status}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-8 w-full max-w-xs"
      >
        <Button
          size="lg"
          className="w-full rounded-full"
          onClick={onEnter}
          loading={entering || seedState === "pending"}
        >
          {buttonLabel}
        </Button>
      </motion.div>

      <motion.a
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        href={PILOT_MAILTO}
        className="mt-6 label-mono text-sand-400 hover:text-sand-950 transition-colors"
      >
        Or test it on your own data ↗
      </motion.a>
    </div>
  );
}
