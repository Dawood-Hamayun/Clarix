"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Globe,
  Pencil,
  ArrowRight,
  Wand2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/knowledge/upload-zone";
import { URLScraper } from "@/components/knowledge/url-scraper";
import { InlineEditor } from "@/components/knowledge/inline-editor";
import { ProcessingIndicator } from "@/components/knowledge/processing-indicator";

type SourceType = "file" | "url" | "text";

const typeOptions = [
  {
    type: "file" as SourceType,
    icon: FileText,
    title: "Upload a file",
    description: "PDF, TXT, Markdown",
  },
  {
    type: "url" as SourceType,
    icon: Globe,
    title: "Paste a URL",
    description: "We'll scrape it",
  },
  {
    type: "text" as SourceType,
    icon: Pencil,
    title: "Write it",
    description: "Type directly",
  },
];

export default function OnboardingKnowledge() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<SourceType | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(0);
  const [result, setResult] = useState<{
    chunkCount: number;
    wordCount: number;
  } | null>(null);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [demoProgress, setDemoProgress] = useState<{
    current: number;
    total: number;
    name: string;
  } | null>(null);
  const [demoResult, setDemoResult] = useState<{
    sourceCount: number;
    chunkCount: number;
  } | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  async function handleLoadDemo() {
    setSeedError(null);
    setSeedingDemo(true);
    // Fake a smooth progress feed while the server processes — the real
    // /api/demo/seed call is one round-trip but processing 13 docs takes
    // several seconds for embeddings. The progress bar gives the user
    // something to watch.
    const stages = [
      "About Acme Cloud",
      "Acme Cloud features",
      "Acme Copilot — AI features deep dive",
      "Pricing and plans",
      "Pricing FAQ — common billing questions",
      "Frequently asked questions",
      "How to reset your password",
      "Inviting team members",
      "Getting started — your first workspace",
      "Troubleshooting common issues",
      "Privacy and data policy",
      "Security and compliance",
      "Contact and support",
    ];
    setDemoProgress({ current: 0, total: stages.length, name: "Preparing…" });

    let stageIndex = 0;
    const ticker = setInterval(() => {
      stageIndex = Math.min(stageIndex + 1, stages.length - 1);
      setDemoProgress({
        current: stageIndex,
        total: stages.length,
        name: stages[stageIndex],
      });
    }, 700);

    try {
      const res = await fetch("/api/demo/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: "proj_demo" }),
      });
      const data = await res.json();
      clearInterval(ticker);

      if (!res.ok) {
        setSeedingDemo(false);
        setDemoProgress(null);
        setSeedError(
          data?.code === "missing_openai_key"
            ? "Add your OpenAI API key first, then come back to this step."
            : data?.error || "Couldn't load the demo. Try again."
        );
        return;
      }

      // Final state — show completion summary
      setDemoProgress({
        current: stages.length,
        total: stages.length,
        name: "Done",
      });
      const totalChunks = (
        data.created as { chunkCount: number }[]
      ).reduce((sum, c) => sum + c.chunkCount, 0);
      setDemoResult({
        sourceCount: data.created.length + (data.skipped?.length || 0),
        chunkCount: totalChunks,
      });
    } catch {
      clearInterval(ticker);
      setSeedingDemo(false);
      setDemoProgress(null);
      setSeedError("Couldn't load the demo. Try again.");
    }
  }

  const handleIngest = async (
    content: string,
    name: string,
    type: SourceType
  ) => {
    setProcessing(true);
    setProcessingStage(0);

    try {
      const createRes = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, content, projectId: "proj_demo" }),
      });
      const source = await createRes.json();

      setProcessingStage(1);
      await new Promise((r) => setTimeout(r, 600));
      setProcessingStage(2);
      await new Promise((r) => setTimeout(r, 400));

      const ingestRes = await fetch("/api/knowledge/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: source.id,
          content,
          type,
          projectId: "proj_demo",
        }),
      });

      setProcessingStage(3);
      await new Promise((r) => setTimeout(r, 500));

      if (ingestRes.ok) {
        const data = await ingestRes.json();
        setResult(data);
        setProcessingStage(4);
      }
    } catch (error) {
      console.error("Ingestion error:", error);
      setProcessing(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-sand-900 tracking-tighter mb-2">
          Teach your agent
        </h1>
        <p className="text-sand-600">
          Add your first piece of knowledge. Your AI will learn from it
          instantly.
        </p>
      </div>

      {/* Demo loader — completion state */}
      {demoResult && !processing && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-white border border-sand-200 rounded-2xl p-6 text-center shadow-sand"
        >
          <div className="w-12 h-12 rounded-2xl bg-warm-orange-light flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-warm-orange" />
          </div>
          <h2 className="text-xl font-bold text-sand-900 tracking-tight mb-1">
            Acme Cloud demo loaded
          </h2>
          <p className="text-sand-600 mb-5 text-sm max-w-md mx-auto">
            {demoResult.sourceCount} sources across all 7 categories,{" "}
            {demoResult.chunkCount} chunks indexed and ready to chat.
          </p>
          <Button
            size="lg"
            onClick={() => router.push("/onboarding/customize")}
          >
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}

      {/* Demo loader — in-progress state */}
      {seedingDemo && demoProgress && !demoResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 bg-white border border-sand-200 rounded-2xl p-6 shadow-sand"
        >
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              className="w-10 h-10 rounded-xl bg-warm-orange-light flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Sparkles className="w-5 h-5 text-warm-orange" />
            </motion.div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-sand-900">
                Loading Acme Cloud demo content
              </p>
              <p className="text-xs text-sand-500 mt-0.5 truncate">
                Embedding: {demoProgress.name}
              </p>
            </div>
            <div className="text-sm font-mono text-sand-500">
              {demoProgress.current} / {demoProgress.total}
            </div>
          </div>
          <div className="h-1.5 bg-sand-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-warm-orange"
              initial={{ width: "0%" }}
              animate={{
                width: `${
                  (demoProgress.current / demoProgress.total) * 100
                }%`,
              }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </motion.div>
      )}

      {seedError && !seedingDemo && (
        <div className="mb-6 text-sm bg-status-warning/10 border border-status-warning/30 text-status-warning rounded-xl px-4 py-3">
          {seedError}
        </div>
      )}

      {!processing && !seedingDemo && !demoResult ? (
        <>
          {/* "Just exploring?" demo banner — primary CTA before the
              upload tiles, so first-time users have a one-click path to
              a fully populated KB. */}
          <motion.button
            type="button"
            onClick={handleLoadDemo}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
            className="w-full text-left mb-6 group bg-sand-900 text-white rounded-2xl p-5 border border-sand-900 hover:bg-sand-800 transition-colors shadow-sand-md"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-warm-orange flex items-center justify-center shrink-0">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold tracking-tight">
                    Just exploring? Load the Acme Cloud demo
                  </p>
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-warm-orange text-white px-1.5 py-0.5 rounded">
                    1 click
                  </span>
                </div>
                <p className="text-sm text-sand-300 mt-1 leading-relaxed">
                  Pre-loads 8 docs across all 7 categories — pricing, FAQ,
                  policies, how-tos — for a fictional B2B SaaS, so you can
                  try chat, citations, and analytics in 30 seconds.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-sand-400 group-hover:text-white transition-colors mt-3 shrink-0" />
            </div>
          </motion.button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-sand-200" />
            <span className="text-xs font-semibold text-sand-400 uppercase tracking-wide">
              or add your own
            </span>
            <div className="flex-1 h-px bg-sand-200" />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {typeOptions.map((opt) => (
              <motion.button
                key={opt.type}
                onClick={() => setSelectedType(opt.type)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  selectedType === opt.type
                    ? "border-warm-orange bg-warm-orange-light"
                    : "border-sand-200 bg-sand-100 hover:border-sand-300"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <opt.icon
                  className={`w-6 h-6 mx-auto mb-2 ${
                    selectedType === opt.type
                      ? "text-warm-orange"
                      : "text-sand-500"
                  }`}
                />
                <p
                  className={`text-sm font-semibold ${
                    selectedType === opt.type
                      ? "text-warm-orange"
                      : "text-sand-800"
                  }`}
                >
                  {opt.title}
                </p>
                <p className="text-xs text-sand-500 mt-0.5">
                  {opt.description}
                </p>
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {selectedType && (
              <motion.div
                key={selectedType}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {selectedType === "file" && (
                  <UploadZone
                    onFileContent={(content, fileName) =>
                      handleIngest(content, fileName, "file")
                    }
                  />
                )}
                {selectedType === "url" && (
                  <URLScraper
                    onUrl={(url) =>
                      handleIngest(url, new URL(url).hostname, "url")
                    }
                  />
                )}
                {selectedType === "text" && (
                  <div className="space-y-4">
                    <InlineEditor
                      onContent={(content, title) =>
                        handleIngest(content, title, "text")
                      }
                    />
                    <Button
                      className="w-full"
                      onClick={() => {
                        const editor = document.querySelector("textarea");
                        const titleInput = document.querySelector(
                          'input[type="text"]'
                        ) as HTMLInputElement;
                        if (editor && titleInput?.value && (editor as HTMLTextAreaElement).value) {
                          handleIngest(
                            (editor as HTMLTextAreaElement).value,
                            titleInput.value,
                            "text"
                          );
                        }
                      }}
                    >
                      Process Content
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : null}

      {processing && (
        <div>
          <ProcessingIndicator
            currentStage={processingStage}
            chunkCount={result?.chunkCount}
            wordCount={result?.wordCount}
          />
          {result && (
            <motion.div
              className="text-center mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button size="lg" onClick={() => router.push("/onboarding/customize")}>
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
