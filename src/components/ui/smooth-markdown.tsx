"use client";

import { useEffect, useRef, useState } from "react";
import { MarkdownRenderer } from "./markdown-renderer";

/**
 * Smooth "writing" reveal for streamed assistant messages.
 *
 * The model streams text in uneven token bursts (sometimes a word, sometimes
 * a whole sentence at once), which makes a raw render feel choppy. This hook
 * keeps a steadily-advancing cursor that trails the received text and catches
 * up on its own clock via requestAnimationFrame, so the message always reads
 * like it's being typed at a natural, even pace, no matter how the network
 * delivers it.
 *
 * - Adaptive speed: the further the cursor is behind, the faster it moves, so
 *   it never lags noticeably and the final flush after the stream ends is
 *   quick but still animated.
 * - Honors prefers-reduced-motion (shows full text immediately).
 * - Only the actively streaming message animates; history renders instantly.
 */
function useSmoothReveal(full: string, animate: boolean) {
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Decided once on mount: a message that starts as "the streaming one"
  // animates; everything else snaps to full text.
  const startedRef = useRef<boolean | null>(null);
  if (startedRef.current === null) {
    startedRef.current = animate && !reducedMotion;
  }

  const [count, setCount] = useState(() =>
    startedRef.current ? 0 : full.length
  );

  const fullRef = useRef(full);
  fullRef.current = full;
  const animateRef = useRef(animate);
  animateRef.current = animate;

  useEffect(() => {
    if (!startedRef.current) {
      setCount(fullRef.current.length);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      let stop = false;
      setCount((c) => {
        const target = fullRef.current.length;
        if (c >= target) {
          // Caught up. Keep idling while the stream is live (more may come);
          // stop once it has finished.
          if (!animateRef.current) stop = true;
          return Math.min(c, target);
        }
        const dt = Math.min(48, now - last);
        const backlog = target - c;
        // chars/ms: clear the backlog over ~90ms, floor ~0.06 (a readable
        // ~60 cps), cap at 4 so the post-stream flush stays snappy.
        const speed = Math.min(4, Math.max(0.06, backlog / 90));
        const advance = Math.max(1, Math.round(dt * speed));
        return Math.min(target, c + advance);
      });
      last = now;
      if (!stop) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A non-animated message whose text changes (e.g. a late metadata edit)
  // should stay fully shown.
  useEffect(() => {
    if (!startedRef.current) setCount(full.length);
  }, [full]);

  return {
    shown: full.slice(0, count),
    isAnimating: !!startedRef.current && count < full.length,
  };
}

export function SmoothMarkdown({
  text,
  animate,
  variant = "compact",
  transform,
}: {
  /** The full text received so far (grows as the stream arrives). */
  text: string;
  /** True only for the message currently being streamed. */
  animate: boolean;
  variant?: "default" | "compact" | "invert";
  /** Optional post-processing applied to the visible substring before render
   *  (e.g. wrapping [1] citation markers). Applied to the revealed slice so it
   *  never cuts a transformed token mid-way. */
  transform?: (shown: string) => string;
}) {
  const { shown, isAnimating } = useSmoothReveal(text, animate);
  const body = transform ? transform(shown) : shown;
  // A caret that travels with the text reads as active typing. Dropped the
  // instant the reveal finishes.
  const content = isAnimating ? `${body} ▍` : body;
  return <MarkdownRenderer content={content} variant={variant} />;
}
