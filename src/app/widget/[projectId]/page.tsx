"use client";

import { use } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Sparkles } from "lucide-react";

export default function WidgetEmbedPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-sand-200 px-4 py-3 flex items-center gap-2 bg-warm-orange">
        <Sparkles className="w-4 h-4 text-white" />
        <span className="text-sm font-medium text-white">Support Agent</span>
      </header>
      <div className="flex-1 p-0">
        <ChatInterface
          projectId={projectId}
          suggestions={[
            "How can you help me?",
            "What topics do you cover?",
            "I have a question",
          ]}
        />
      </div>
    </div>
  );
}
