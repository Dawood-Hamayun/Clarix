"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Globe, Pencil, ArrowRight } from "lucide-react";
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

      {!processing ? (
        <>
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
      ) : (
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
