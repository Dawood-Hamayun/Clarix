"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Check,
  Pencil,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { getCategoryIcon } from "@/lib/knowledge/category-icons";
import type { InterviewQuestion } from "@/lib/knowledge/interview-templates";

type Stage = "questions" | "drafting" | "preview" | "saving";

interface InterviewModeProps {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  onCancel: () => void;
  onSaved: (result: { chunkCount: number; wordCount: number }) => void;
}

interface StartResponse {
  category: { id: string; name: string; slug: string; description: string };
  title: string;
  subtitle: string;
  questions: InterviewQuestion[];
}

export function InterviewMode({
  categoryId,
  categoryName,
  categoryIcon,
  onCancel,
  onSaved,
}: InterviewModeProps) {
  const [data, setData] = useState<StartResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("questions");
  const [draft, setDraft] = useState<{ title: string; markdown: string } | null>(
    null
  );
  const [editing, setEditing] = useState(false);
  const [editMarkdown, setEditMarkdown] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const Icon = getCategoryIcon(categoryIcon);

  // Load template
  useEffect(() => {
    let cancelled = false;
    fetch("/api/knowledge/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "start", categoryId }),
    })
      .then((r) => r.json())
      .then((d: StartResponse) => {
        if (cancelled) return;
        setData(d);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const currentQuestion = data?.questions[stepIndex];
  const totalSteps = data?.questions.length ?? 0;
  const progress = totalSteps > 0 ? ((stepIndex + 1) / totalSteps) * 100 : 0;

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v?.trim()).length,
    [answers]
  );

  const canAdvance = () => {
    if (!currentQuestion) return false;
    if (currentQuestion.optional) return true;
    return (answers[currentQuestion.id] ?? "").trim().length > 0;
  };

  const next = () => {
    if (stepIndex < totalSteps - 1) {
      setStepIndex((i) => i + 1);
    } else {
      compose();
    }
  };

  const back = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  const compose = async () => {
    if (!data) return;
    setStage("drafting");
    setError(null);

    const payload = data.questions.map((q) => ({
      questionId: q.id,
      question: q.question,
      answer: answers[q.id] ?? "",
    }));

    try {
      const res = await fetch("/api/knowledge/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "compose",
          categoryId,
          answers: payload,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate draft");
      }

      const result = (await res.json()) as {
        title: string;
        markdown: string;
      };
      setDraft(result);
      setEditMarkdown(result.markdown);
      setEditTitle(result.title);
      setStage("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStage("questions");
    }
  };

  const save = async () => {
    if (!draft) return;
    setStage("saving");
    setError(null);
    try {
      const finalTitle = editing ? editTitle : draft.title;
      const finalMarkdown = editing ? editMarkdown : draft.markdown;

      const createRes = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalTitle,
          type: "text",
          content: finalMarkdown,
          projectId: "proj_demo",
          categoryId,
        }),
      });
      const source = await createRes.json();

      const ingestRes = await fetch("/api/knowledge/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: source.id,
          content: finalMarkdown,
          type: "text",
          projectId: "proj_demo",
        }),
      });

      if (!ingestRes.ok) throw new Error("Ingestion failed");
      const ingestData = await ingestRes.json();
      onSaved(ingestData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
      setStage("preview");
    }
  };

  if (!data) {
    return (
      <div className="bg-white border border-sand-200 rounded-2xl p-12 shadow-sand flex items-center justify-center">
        <motion.div
          className="w-6 h-6 border-2 border-sand-900 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white border border-sand-200 rounded-2xl shadow-sand overflow-hidden">
      {/* Header */}
      <div className="px-7 pt-7 pb-5 border-b border-sand-200">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-sand-900 text-white flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-sand-900 tracking-tight">
                {data.title}
              </h2>
              <Badge variant="outline">
                <Sparkles className="w-3 h-3" />
                Interview mode
              </Badge>
            </div>
            <p className="text-sm text-sand-600 mt-1">{data.subtitle}</p>
            <p className="text-xs text-sand-500 mt-1">
              Category: <span className="font-semibold">{categoryName}</span>
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-sm text-sand-500 hover:text-sand-900 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Progress bar — only in questions stage */}
        {stage === "questions" && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-semibold text-sand-500 tracking-tight mb-2">
              <span>
                Question {stepIndex + 1} of {totalSteps}
              </span>
              <span>{answeredCount} answered</span>
            </div>
            <div className="h-1.5 bg-sand-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-sand-900 rounded-full"
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 160, damping: 22 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-7 py-7 min-h-[320px]">
        <AnimatePresence mode="wait">
          {stage === "questions" && currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-[1.0625rem] font-bold text-sand-900 tracking-tight leading-snug">
                  {currentQuestion.question}
                </h3>
                {currentQuestion.optional && (
                  <Badge variant="outline">Optional</Badge>
                )}
              </div>
              {currentQuestion.hint && (
                <p className="text-sm text-sand-500 mb-3">
                  {currentQuestion.hint}
                </p>
              )}

              {currentQuestion.multiline ? (
                <textarea
                  autoFocus
                  value={answers[currentQuestion.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [currentQuestion.id]: e.target.value,
                    }))
                  }
                  placeholder={currentQuestion.placeholder}
                  rows={6}
                  className="w-full bg-white border border-sand-200 rounded-xl px-4 py-3 text-[0.9375rem] text-sand-900 placeholder:text-sand-400 focus:outline-none focus:border-sand-900 focus:ring-2 focus:ring-sand-900/10 transition-all resize-y"
                />
              ) : (
                <input
                  autoFocus
                  type="text"
                  value={answers[currentQuestion.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [currentQuestion.id]: e.target.value,
                    }))
                  }
                  placeholder={currentQuestion.placeholder}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canAdvance()) {
                      e.preventDefault();
                      next();
                    }
                  }}
                  className="w-full bg-white border border-sand-200 rounded-xl px-4 py-3 text-[0.9375rem] text-sand-900 placeholder:text-sand-400 focus:outline-none focus:border-sand-900 focus:ring-2 focus:ring-sand-900/10 transition-all"
                />
              )}

              {error && (
                <p className="mt-3 text-sm text-status-error">{error}</p>
              )}
            </motion.div>
          )}

          {stage === "drafting" && (
            <motion.div
              key="drafting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <motion.div
                className="w-14 h-14 rounded-2xl bg-sand-900 flex items-center justify-center mb-5"
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 1.8, repeat: Infinity }}
              >
                <Wand2 className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-lg font-bold text-sand-900 tracking-tight">
                Drafting your entry...
              </h3>
              <p className="text-sm text-sand-500 mt-1 max-w-sm">
                Turning your answers into a clean, structured knowledge base
                entry.
              </p>
            </motion.div>
          )}

          {stage === "preview" && draft && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-sand-500 uppercase tracking-wide block mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-white border border-sand-200 rounded-xl px-4 py-3 text-[0.9375rem] font-semibold text-sand-900 focus:outline-none focus:border-sand-900 focus:ring-2 focus:ring-sand-900/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-sand-500 uppercase tracking-wide block mb-2">
                      Markdown
                    </label>
                    <textarea
                      value={editMarkdown}
                      onChange={(e) => setEditMarkdown(e.target.value)}
                      rows={18}
                      className="w-full bg-white border border-sand-200 rounded-xl px-4 py-3 text-sm font-mono text-sand-900 focus:outline-none focus:border-sand-900 focus:ring-2 focus:ring-sand-900/10 transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div className="border border-sand-200 rounded-xl bg-sand-50 p-6 max-h-[480px] overflow-y-auto">
                  <MarkdownRenderer content={draft.markdown} />
                </div>
              )}

              {error && (
                <p className="mt-3 text-sm text-status-error">{error}</p>
              )}
            </motion.div>
          )}

          {stage === "saving" && (
            <motion.div
              key="saving"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <motion.div
                className="w-6 h-6 border-2 border-sand-900 border-t-transparent rounded-full mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-sm font-semibold text-sand-700">
                Saving + indexing...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {(stage === "questions" || stage === "preview") && (
        <div className="px-7 py-5 border-t border-sand-200 bg-sand-50 flex items-center justify-between">
          {stage === "questions" ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={back}
                disabled={stepIndex === 0}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                {currentQuestion?.optional && (
                  <Button variant="secondary" size="sm" onClick={next}>
                    Skip
                  </Button>
                )}
                <Button onClick={next} disabled={!canAdvance()} size="sm">
                  {stepIndex === totalSteps - 1 ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate draft
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStage("questions");
                  setEditing(false);
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to questions
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing((e) => !e)}
                >
                  {editing ? (
                    <>
                      <Check className="w-4 h-4" />
                      Done editing
                    </>
                  ) : (
                    <>
                      <Pencil className="w-4 h-4" />
                      Edit
                    </>
                  )}
                </Button>
                <Button variant="secondary" size="sm" onClick={compose}>
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </Button>
                <Button size="sm" onClick={save}>
                  <Check className="w-4 h-4" />
                  Save to KB
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
