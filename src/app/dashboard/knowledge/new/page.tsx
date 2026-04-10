"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Globe,
  Pencil,
  ArrowLeft,
  Check,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/knowledge/upload-zone";
import { URLScraper } from "@/components/knowledge/url-scraper";
import { InlineEditor } from "@/components/knowledge/inline-editor";
import { ProcessingIndicator } from "@/components/knowledge/processing-indicator";
import { KBGuideButton } from "@/components/knowledge/kb-guide";
import { InterviewMode } from "@/components/knowledge/interview-mode";
import { getCategoryIcon } from "@/lib/knowledge/category-icons";
import type { KnowledgeCategory } from "@/lib/db/types";
import Link from "next/link";

type SourceType = "file" | "url" | "text";

const typeOptions = [
  {
    type: "file" as SourceType,
    icon: FileText,
    title: "Upload a file",
    description: "PDF, TXT, Markdown, or CSV",
  },
  {
    type: "url" as SourceType,
    icon: Globe,
    title: "Paste a URL",
    description: "We'll extract the content",
  },
  {
    type: "text" as SourceType,
    icon: Pencil,
    title: "Write it yourself",
    description: "Type or paste content directly",
  },
];

function NewKnowledgeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("categoryId");

  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(initialCategory);
  const [selectedType, setSelectedType] = useState<SourceType | null>(null);
  const [interviewing, setInterviewing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(0);
  const [result, setResult] = useState<{
    chunkCount: number;
    wordCount: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: KnowledgeCategory[]) => {
        setCategories(data);
        // Default to first category if none provided
        if (!initialCategory && data.length > 0) {
          setCategoryId(data[0].id);
        }
      });
  }, [initialCategory]);

  const activeCategory = categories.find((c) => c.id === categoryId);

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
        body: JSON.stringify({
          name,
          type,
          content,
          projectId: "proj_demo",
          categoryId,
        }),
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
      } else {
        throw new Error("Ingestion failed");
      }
    } catch (error) {
      console.error("Ingestion error:", error);
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <Link
        href="/dashboard/knowledge"
        className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-sand-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Knowledge Base
      </Link>

      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-sand-900 tracking-tighter mb-2">
            Add Knowledge Source
          </h1>
          <p className="text-base text-sand-600 max-w-xl">
            Teach your AI agent by adding structured content. Pick a category
            so answers stay grounded and easy to improve later.
          </p>
        </div>
        {!processing && !interviewing && <KBGuideButton />}
      </div>

      {interviewing && activeCategory ? (
        <InterviewMode
          categoryId={activeCategory.id}
          categoryName={activeCategory.name}
          categoryIcon={activeCategory.icon}
          onCancel={() => setInterviewing(false)}
          onSaved={(data) => {
            setInterviewing(false);
            setResult(data);
            setProcessing(true);
            setProcessingStage(4);
          }}
        />
      ) : !processing ? (
        <>
          {/* Category selector */}
          <div className="mb-8">
            <label className="text-sm font-semibold text-sand-800 tracking-tight mb-3 block">
              Category
              {activeCategory && (
                <span className="text-sand-500 font-normal ml-2">
                  — {activeCategory.description}
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const Icon = getCategoryIcon(cat.icon);
                const active = cat.id === categoryId;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold tracking-tight transition-all ${
                      active
                        ? "bg-sand-900 text-white border-sand-900 shadow-sand"
                        : "bg-white text-sand-700 border-sand-200 hover:border-sand-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.name}
                    {active && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interview mode CTA */}
          {activeCategory && (
            <motion.button
              type="button"
              onClick={() => setInterviewing(true)}
              whileHover={{ y: -2 }}
              className="w-full mb-8 group relative overflow-hidden bg-sand-900 text-white rounded-2xl p-6 text-left shadow-sand-md hover:shadow-sand-lg transition-shadow"
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold tracking-tight">
                      Guide me — I&apos;ll interview you
                    </span>
                    <span className="text-[0.6875rem] font-bold uppercase tracking-wide bg-white/15 px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-sm text-white/70 mt-1">
                    Answer a few short questions about{" "}
                    <span className="font-semibold text-white">
                      {activeCategory.name}
                    </span>{" "}
                    and I&apos;ll draft a clean, structured entry for you.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
              </div>
            </motion.button>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-sand-200" />
            <span className="text-xs font-semibold uppercase tracking-wide text-sand-400">
              or add manually
            </span>
            <div className="flex-1 h-px bg-sand-200" />
          </div>

          {/* Type selection */}
          <label className="text-sm font-semibold text-sand-800 tracking-tight mb-3 block">
            Source type
          </label>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {typeOptions.map((opt) => (
              <motion.button
                key={opt.type}
                onClick={() => setSelectedType(opt.type)}
                className={`p-5 rounded-2xl border-2 text-left transition-all ${
                  selectedType === opt.type
                    ? "border-sand-900 bg-white shadow-sand"
                    : "border-sand-200 bg-white hover:border-sand-400"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                    selectedType === opt.type
                      ? "bg-sand-900 text-white"
                      : "bg-sand-100 text-sand-600"
                  }`}
                >
                  <opt.icon className="w-5 h-5" />
                </div>
                <p className="text-[0.9375rem] font-semibold text-sand-900 tracking-tight">
                  {opt.title}
                </p>
                <p className="text-xs text-sand-500 mt-1">{opt.description}</p>
              </motion.button>
            ))}
          </div>

          {/* Content input */}
          <AnimatePresence mode="wait">
            {selectedType && (
              <motion.div
                key={selectedType}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
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
                      onClick={() => {
                        const editor = document.querySelector("textarea");
                        const titleInput = document.querySelector(
                          'input[type="text"]'
                        ) as HTMLInputElement;
                        if (
                          editor &&
                          titleInput?.value &&
                          (editor as HTMLTextAreaElement).value
                        ) {
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
      ) : (
        <div>
          <ProcessingIndicator
            currentStage={processingStage}
            chunkCount={result?.chunkCount}
            wordCount={result?.wordCount}
          />

          {result && (
            <motion.div
              className="flex items-center justify-center gap-3 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                variant="secondary"
                onClick={() => {
                  setProcessing(false);
                  setResult(null);
                  setProcessingStage(0);
                  setSelectedType(null);
                }}
              >
                Add another
              </Button>
              <Button onClick={() => router.push("/dashboard/knowledge")}>
                View Knowledge Base
              </Button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NewKnowledgePage() {
  return (
    <Suspense fallback={<div className="max-w-3xl h-64" />}>
      <NewKnowledgeInner />
    </Suspense>
  );
}
