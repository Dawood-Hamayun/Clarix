"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils/cn";

interface MarkdownRendererProps {
  content: string;
  variant?: "default" | "compact" | "invert";
  className?: string;
}

export function MarkdownRenderer({
  content,
  variant = "default",
  className,
}: MarkdownRendererProps) {
  const variantClass =
    variant === "compact"
      ? "prose-clarix prose-clarix-sm"
      : variant === "invert"
      ? "prose-clarix prose-clarix-sm prose-clarix-invert"
      : "prose-clarix";

  return (
    <div className={cn(variantClass, className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
