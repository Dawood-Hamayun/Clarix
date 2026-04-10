"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, User, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Conversation } from "@/lib/db/types";

export default function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [conversation, setConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    fetch(`/api/conversations/${id}`)
      .then((r) => r.json())
      .then(setConversation);
  }, [id]);

  if (!conversation) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-sand-200 rounded w-48" />
        <div className="h-64 bg-sand-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard/conversations"
        className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-sand-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All conversations
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sand-200 flex items-center justify-center text-sm font-medium text-sand-600">
            {(conversation.metadata.customerName || "U")[0]}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-sand-900">
              {conversation.metadata.customerName || "Customer"}
            </h2>
            <p className="text-xs text-sand-500">
              {new Date(conversation.metadata.startedAt).toLocaleString()} &middot;{" "}
              {conversation.metadata.messageCount} messages
            </p>
          </div>
        </div>
        <Badge
          variant={conversation.metadata.resolved ? "success" : "processing"}
        >
          {conversation.metadata.resolved ? "Resolved" : "Active"}
        </Badge>
      </div>

      {/* Messages */}
      <div className="space-y-4 bg-white border border-sand-200 rounded-xl p-6">
        {conversation.messages.map((message, i) => (
          <motion.div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "" : ""
            }`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                message.role === "user"
                  ? "bg-sand-200"
                  : "bg-warm-orange-light"
              }`}
            >
              {message.role === "user" ? (
                <User className="w-4 h-4 text-sand-600" />
              ) : (
                <Sparkles className="w-4 h-4 text-warm-orange" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-sand-800">
                  {message.role === "user"
                    ? conversation.metadata.customerName || "Customer"
                    : "AI Agent"}
                </span>
                <span className="text-xs text-sand-400">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-sand-700 leading-relaxed">
                {message.content}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
