"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { LiveDemoChat } from "./live-demo-chat";

/** Dispatch this anywhere on the page to open the floating demo chat. */
export const OPEN_DEMO_EVENT = "clarix-demo-open";

/**
 * Floating chat launcher for the landing page, the exact widget a
 * customer's site would get, so the landing page demos the product on
 * itself. Fully scripted client-side.
 */
export function FloatingDemoWidget() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_DEMO_EVENT, handler);
    return () => window.removeEventListener(OPEN_DEMO_EVENT, handler);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="w-[min(380px,calc(100vw-2.5rem))] origin-bottom-right shadow-sand-xl rounded-2xl"
          >
            <LiveDemoChat greeting className="h-[min(480px,70vh)]" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? "Close chat" : "Open chat demo"}
        className="w-13 h-13 rounded-full bg-sand-950 text-sand-50 shadow-sand-lg flex items-center justify-center"
        style={{ width: 52, height: 52 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              <X className="w-5 h-5" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              <MessageCircle className="w-5 h-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
