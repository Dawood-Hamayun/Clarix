"use client";

import { useState, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

type Side = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content: ReactNode;
  side?: Side;
  align?: "start" | "center" | "end";
  delay?: number;
  className?: string;
  children: ReactNode;
}

/**
 * Lightweight portal tooltip with a fluid spring animation.
 * Positions itself relative to the trigger using getBoundingClientRect.
 *
 * Uses a portal so it cannot be clipped by an `overflow: hidden` ancestor
 * (e.g. cards or rounded containers).
 */
export function Tooltip({
  content,
  side = "top",
  align = "center",
  delay = 120,
  className,
  children,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const computePosition = () => {
    const node = triggerRef.current;
    if (!node) return;
    const r = node.getBoundingClientRect();
    const gap = 8;
    let top = 0;
    let left = 0;
    if (side === "top") {
      top = r.top - gap;
      left = align === "start" ? r.left : align === "end" ? r.right : r.left + r.width / 2;
    } else if (side === "bottom") {
      top = r.bottom + gap;
      left = align === "start" ? r.left : align === "end" ? r.right : r.left + r.width / 2;
    } else if (side === "left") {
      top = r.top + r.height / 2;
      left = r.left - gap;
    } else {
      top = r.top + r.height / 2;
      left = r.right + gap;
    }
    setPos({ top, left });
  };

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      computePosition();
      setOpen(true);
    }, delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(false);
  };

  // Translate origin so the popup hangs around the anchor point correctly.
  const originStyle: React.CSSProperties =
    side === "top"
      ? { transform: `translate(-50%, -100%)` }
      : side === "bottom"
      ? { transform: `translate(-50%, 0)` }
      : side === "left"
      ? { transform: `translate(-100%, -50%)` }
      : { transform: `translate(0, -50%)` };

  if (align === "start" && (side === "top" || side === "bottom")) {
    originStyle.transform = side === "top" ? "translate(0, -100%)" : "translate(0, 0)";
  }
  if (align === "end" && (side === "top" || side === "bottom")) {
    originStyle.transform = side === "top" ? "translate(-100%, -100%)" : "translate(-100%, 0)";
  }

  const motionInitial =
    side === "top"
      ? { opacity: 0, y: 4, scale: 0.96 }
      : side === "bottom"
      ? { opacity: 0, y: -4, scale: 0.96 }
      : side === "left"
      ? { opacity: 0, x: 4, scale: 0.96 }
      : { opacity: 0, x: -4, scale: 0.96 };

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex"
      >
        {children}
      </span>
      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.div
                initial={motionInitial}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={motionInitial}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                style={{
                  position: "fixed",
                  top: pos.top,
                  left: pos.left,
                  zIndex: 9999,
                  pointerEvents: "none",
                  ...originStyle,
                }}
                className={
                  className ||
                  "max-w-xs bg-sand-900 text-white text-[11px] leading-snug font-medium tracking-tight px-3 py-2 rounded-lg shadow-sand-lg border border-sand-800"
                }
              >
                {content}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
