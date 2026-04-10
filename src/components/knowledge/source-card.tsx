"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Globe,
  Pencil,
  Trash2,
  MoreVertical,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { KnowledgeSource } from "@/lib/db/types";
import { useState } from "react";

const typeIcons = {
  file: FileText,
  url: Globe,
  text: Pencil,
};

const typeLabels = {
  file: "Document",
  url: "Web Page",
  text: "Manual Entry",
};

interface SourceCardProps {
  source: KnowledgeSource;
  onDelete?: (id: string) => void;
  index?: number;
}

export function SourceCard({ source, onDelete, index = 0 }: SourceCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const Icon = typeIcons[source.type];

  const statusVariant =
    source.status === "ready"
      ? "success"
      : source.status === "processing"
      ? "processing"
      : "error";

  return (
    <motion.div
      className="bg-sand-100 border border-sand-200 rounded-xl shadow-sand hover:shadow-sand-lg transition-all duration-200 hover:-translate-y-0.5 relative group"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link
        href={`/dashboard/knowledge/${source.id}`}
        className="block p-5 cursor-pointer"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-warm-orange-light flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-warm-orange" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-sand-900 line-clamp-1">
                {source.name}
              </h3>
              <p className="text-xs text-sand-500">{typeLabels[source.type]}</p>
            </div>
          </div>
          {/* Spacer for menu button */}
          <div className="w-7 shrink-0" />
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant={statusVariant}>
            {source.status === "processing" && (
              <RefreshCw className="w-3 h-3 animate-spin" />
            )}
            {source.status}
          </Badge>
          {source.metadata.chunkCount > 0 && (
            <span className="text-xs text-sand-500">
              {source.metadata.chunkCount} chunks
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-sand-500">
          <span>{source.metadata.wordCount.toLocaleString()} words</span>
          <span className="inline-flex items-center gap-1 text-sand-500 group-hover:text-warm-orange transition-colors">
            <Eye className="w-3 h-3" />
            View
          </span>
        </div>
      </Link>

      {/* Menu button (overlayed, doesn't trigger link) */}
      <div className="absolute top-4 right-4">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1.5 rounded-md hover:bg-sand-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="More actions"
        >
          <MoreVertical className="w-4 h-4 text-sand-500" />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-sand-200 rounded-lg shadow-sand-lg py-1 w-36 z-10">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete?.(source.id);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-status-error hover:bg-sand-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
