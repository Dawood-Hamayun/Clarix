"use client";

import { motion } from "framer-motion";

/**
 * Shared route transition for every step in the onboarding flow.
 * Next.js gives template.tsx a fresh key per route, so this fade+slide
 * runs automatically on every navigation — no need to repeat motion
 * wrappers in each step page.
 */
export default function OnboardingTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
