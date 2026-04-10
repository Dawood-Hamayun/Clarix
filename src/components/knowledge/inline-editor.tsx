"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

interface InlineEditorProps {
  onContent: (content: string, title: string) => void;
}

export function InlineEditor({ onContent }: InlineEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const handleBlur = () => {
    if (content.trim() && title.trim()) {
      onContent(content, title);
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleBlur}
        placeholder="Give this content a title..."
        className="w-full bg-white border border-sand-300 rounded-lg px-3.5 py-2.5 text-sm text-sand-800 placeholder:text-sand-400 focus:border-warm-orange focus:ring-2 focus:ring-warm-orange-light focus:outline-none transition-all font-medium"
      />
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={handleBlur}
        placeholder="Write or paste your content here...&#10;&#10;Tip: Use markdown formatting for best results. Include headings (#), bullet points (-), and clear sections."
        className="min-h-[200px]"
      />
      <div className="flex items-center justify-between text-xs text-sand-500">
        <span>{wordCount} words</span>
        <span>Markdown supported</span>
      </div>
    </div>
  );
}
