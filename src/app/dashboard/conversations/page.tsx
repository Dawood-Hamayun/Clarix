"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Search, FlaskConical } from "lucide-react";
import type { Conversation } from "@/lib/db/types";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data: Conversation[]) => {
        setConversations(data);
        setLoading(false);
      });
  }, []);

  // Hide empty playground sessions that never received a user message.
  const populated = conversations.filter((c) => c.messages.length > 0);
  const filtered = search.trim()
    ? populated.filter((c) =>
        c.messages.some((m) =>
          m.content.toLowerCase().includes(search.toLowerCase())
        )
      )
    : populated;

  return (
    <div>
      {/* Search */}
      {populated.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full max-w-md bg-white border border-sand-200 rounded-xl pl-11 pr-4 py-3 text-[0.9375rem] text-sand-800 placeholder:text-sand-400 focus:outline-none focus:border-sand-900 focus:ring-2 focus:ring-sand-900/10 transition-all"
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-sand-100 border border-sand-200 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-dashed border-sand-300 rounded-3xl px-8 py-16 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-sand-100 border border-sand-200 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-6 h-6 text-sand-500" />
          </div>
          <h3 className="text-xl font-bold text-sand-900 tracking-tight mb-2">
            No conversations yet
          </h3>
          <p className="text-sand-600 max-w-md mx-auto mb-6">
            Customer chats will appear here once your agent starts answering
            questions. Open the playground to test it yourself first.
          </p>
          <Link href="/dashboard/playground">
            <Button>
              <FlaskConical className="w-4 h-4" />
              Open Playground
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="relative bg-white border border-sand-200 rounded-2xl shadow-sand overflow-hidden">
          <div className="max-h-[calc(100vh-16rem)] min-h-[320px] overflow-y-auto divide-y divide-sand-200">
          {filtered.map((conv, i) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                href={`/dashboard/conversations/${conv.id}`}
                className="flex items-center justify-between gap-4 p-5 hover:bg-sand-150 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-sand-100 border border-sand-200 flex items-center justify-center text-sm font-bold text-sand-700 shrink-0">
                    {(conv.metadata.customerName || "U")[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[0.9375rem] font-semibold text-sand-900 truncate">
                        {conv.metadata.customerName || "Customer"}
                      </p>
                      <span className="text-xs text-sand-400">
                        {new Date(
                          conv.metadata.lastMessageAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-sand-600 truncate">
                      {conv.messages[0]?.content || "New conversation"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-sand-500">
                    {conv.metadata.messageCount} msgs
                  </span>
                  <Badge
                    variant={
                      conv.metadata.resolved ? "success" : "processing"
                    }
                  >
                    {conv.metadata.resolved ? "Resolved" : "Active"}
                  </Badge>
                </div>
              </Link>
            </motion.div>
          ))}
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent" />
        </div>
      )}
    </div>
  );
}
