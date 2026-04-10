"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Pencil,
  Eye,
  Save,
  Trash2,
  RefreshCw,
  FileText,
  Globe,
  Clock,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import type { KnowledgeSource, Chunk } from "@/lib/db/types";

const typeIcons = {
  file: FileText,
  url: Globe,
  text: Pencil,
};

interface SourceDetailResponse extends KnowledgeSource {
  chunksData: Chunk[];
}

export default function SourceDetailPage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const { sourceId } = use(params);
  const router = useRouter();
  const [source, setSource] = useState<SourceDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editedName, setEditedName] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/knowledge/${sourceId}`);
    if (res.ok) {
      const data: SourceDetailResponse = await res.json();
      setSource(data);
      setEditedName(data.name);
      setEditedContent(data.content);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceId]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/knowledge/${sourceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editedName, content: editedContent }),
    });
    setSaving(false);
    if (res.ok) {
      await load();
      setMode("view");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this knowledge source? This can't be undone.")) return;
    await fetch(`/api/knowledge/${sourceId}`, { method: "DELETE" });
    router.push("/dashboard/knowledge");
  };

  if (loading) {
    return (
      <div>
        <div className="h-8 w-40 bg-sand-100 rounded animate-pulse mb-6" />
        <div className="h-48 bg-sand-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!source) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-semibold text-sand-800 mb-2">
          Source not found
        </h2>
        <Link href="/dashboard/knowledge">
          <Button variant="secondary">Back to knowledge base</Button>
        </Link>
      </div>
    );
  }

  const Icon = typeIcons[source.type];
  const statusVariant =
    source.status === "ready"
      ? "success"
      : source.status === "processing"
      ? "processing"
      : "error";

  return (
    <div>
      {/* Back link */}
      <Link
        href="/dashboard/knowledge"
        className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-sand-800 mb-4 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to knowledge base
      </Link>

      {/* Header */}
      <div className="bg-white border border-sand-200 rounded-xl p-6 mb-4 shadow-sand">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-warm-orange-light flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-warm-orange" />
            </div>
            <div className="flex-1 min-w-0">
              {mode === "edit" ? (
                <input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full bg-sand-50 border border-sand-200 rounded-lg px-3 py-1.5 text-base font-semibold text-sand-900 focus:outline-none focus:border-warm-orange focus:ring-1 focus:ring-warm-orange-light transition-all"
                />
              ) : (
                <h1 className="text-lg font-semibold text-sand-900 truncate">
                  {source.name}
                </h1>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={statusVariant}>
                  {source.status === "processing" && (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  )}
                  {source.status}
                </Badge>
                <span className="inline-flex items-center gap-1 text-xs text-sand-500">
                  <Hash className="w-3 h-3" />
                  {source.metadata.chunkCount} chunks
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-sand-500">
                  {source.metadata.wordCount.toLocaleString()} words
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-sand-500">
                  <Clock className="w-3 h-3" />
                  Updated{" "}
                  {new Date(source.metadata.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {mode === "view" ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setMode("edit")}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={handleDelete}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditedName(source.name);
                    setEditedContent(source.content);
                    setMode("view");
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} loading={saving}>
                  <Save className="w-3.5 h-3.5" />
                  Save & reprocess
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex items-center gap-1 bg-sand-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setMode("view")}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              mode === "view"
                ? "bg-white text-sand-900 shadow-sand"
                : "text-sand-500 hover:text-sand-700"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
          <button
            onClick={() => setMode("edit")}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              mode === "edit"
                ? "bg-white text-sand-900 shadow-sand"
                : "text-sand-500 hover:text-sand-700"
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="bg-white border border-sand-200 rounded-xl p-6 shadow-sand min-h-[300px]">
        <AnimatePresence mode="wait">
          {mode === "view" ? (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {source.content?.trim() ? (
                <MarkdownRenderer content={source.content} />
              ) : (
                <p className="text-sm text-sand-400 italic">
                  No content yet. Switch to edit mode to add some.
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="Write your knowledge in markdown..."
                className="w-full min-h-[400px] bg-sand-50 border border-sand-200 rounded-lg p-4 text-sm font-mono text-sand-800 placeholder:text-sand-400 focus:outline-none focus:border-warm-orange focus:ring-1 focus:ring-warm-orange-light transition-all resize-y"
              />
              <p className="text-xs text-sand-500 mt-2">
                Supports **markdown**: headings, lists, code blocks, tables, and
                more. Saving will re-embed the content.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chunks preview */}
      {source.chunksData && source.chunksData.length > 0 && (
        <div className="bg-sand-50 border border-sand-200 rounded-xl p-5 mt-4">
          <h3 className="text-sm font-semibold text-sand-900 mb-3 flex items-center gap-2">
            <Hash className="w-4 h-4 text-sand-500" />
            Indexed chunks ({source.chunksData.length})
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {source.chunksData.map((chunk, i) => (
              <div
                key={chunk.id}
                className="bg-white border border-sand-200 rounded-lg p-3 text-xs text-sand-600"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sand-400 font-mono">#{i + 1}</span>
                  {chunk.metadata.heading && (
                    <span className="text-sand-700 font-medium">
                      {chunk.metadata.heading}
                    </span>
                  )}
                </div>
                <p className="line-clamp-3">{chunk.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
