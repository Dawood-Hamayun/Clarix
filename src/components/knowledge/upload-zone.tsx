"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface UploadZoneProps {
  onFileContent: (content: string, fileName: string) => void;
}

export function UploadZone({ onFileContent }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFile = useCallback(
    async (f: File) => {
      setFile(f);
      const text = await f.text();
      onFileContent(text, f.name);
    },
    [onFileContent]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  return (
    <div>
      <motion.label
        className={cn(
          "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
          isDragging
            ? "border-warm-orange bg-warm-orange-light scale-[1.01]"
            : "border-sand-300 hover:border-warm-orange/50 hover:bg-sand-50"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        animate={isDragging ? { scale: 1.01 } : { scale: 1 }}
      >
        <input
          type="file"
          className="hidden"
          accept=".txt,.md,.pdf,.csv,.json"
          onChange={handleChange}
        />
        <Upload
          className={cn(
            "w-8 h-8 mb-3",
            isDragging ? "text-warm-orange" : "text-sand-400"
          )}
        />
        <p className="text-sm font-medium text-sand-700">
          {isDragging ? "Drop your file here" : "Drop a file or click to upload"}
        </p>
        <p className="text-xs text-sand-500 mt-1">
          TXT, MD, PDF, CSV — up to 10MB
        </p>
      </motion.label>

      {file && (
        <motion.div
          className="mt-3 flex items-center gap-3 bg-sand-100 border border-sand-200 rounded-lg p-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FileText className="w-5 h-5 text-warm-orange shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sand-800 truncate">
              {file.name}
            </p>
            <p className="text-xs text-sand-500">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            onClick={() => setFile(null)}
            className="p-1 hover:bg-sand-200 rounded"
          >
            <X className="w-4 h-4 text-sand-500" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
