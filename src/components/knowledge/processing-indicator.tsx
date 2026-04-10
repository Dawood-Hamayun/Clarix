"use client";

import { motion } from "framer-motion";
import { FileText, Scissors, Brain, Database, Check } from "lucide-react";

const stages = [
  { key: "parsing", label: "Parsing", detail: "Extracting text", icon: FileText },
  { key: "chunking", label: "Chunking", detail: "Splitting into pieces", icon: Scissors },
  { key: "embedding", label: "Embedding", detail: "Generating vectors", icon: Brain },
  { key: "storing", label: "Storing", detail: "Saving to knowledge base", icon: Database },
];

interface ProcessingIndicatorProps {
  currentStage: number; // 0-3 for stages, 4 for done
  chunkCount?: number;
  wordCount?: number;
}

export function ProcessingIndicator({
  currentStage,
  chunkCount,
  wordCount,
}: ProcessingIndicatorProps) {
  const isDone = currentStage >= 4;
  const progress = Math.min(Math.max(currentStage, 0), stages.length - 1);
  // Line spans between the centers of first and last icon columns.
  const lineWidthPercent = (progress / (stages.length - 1)) * 100;

  return (
    <div className="py-10">
      <div className="relative max-w-xl mx-auto">
        {/* Fixed-row grid keeps icons perfectly aligned regardless of captions below */}
        <div className="grid grid-cols-4 gap-0">
          {/* Icon row with connecting line behind it */}
          <div className="col-span-4 relative h-12 flex items-center">
            {/* The line sits centered vertically within this row */}
            <div
              className="absolute top-1/2 -translate-y-1/2 h-[2px] bg-sand-200"
              style={{
                left: `calc((100% / ${stages.length * 2}))`,
                right: `calc((100% / ${stages.length * 2}))`,
              }}
            />
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 h-[2px] bg-sand-900 origin-left"
              style={{
                left: `calc((100% / ${stages.length * 2}))`,
                width: `calc((100% - (100% / ${stages.length})) * ${
                  lineWidthPercent / 100
                })`,
              }}
              initial={false}
              animate={{
                width: `calc((100% - (100% / ${stages.length})) * ${
                  lineWidthPercent / 100
                })`,
              }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            />

            {/* Icon circles, evenly distributed */}
            <div className="relative w-full grid grid-cols-4">
              {stages.map((stage, i) => {
                const isActive = i === currentStage;
                const isComplete = i < currentStage || isDone;
                const Icon = stage.icon;

                return (
                  <div
                    key={stage.key}
                    className="flex items-center justify-center"
                  >
                    <motion.div
                      className={`relative w-11 h-11 rounded-full flex items-center justify-center border-2 bg-white transition-colors ${
                        isComplete
                          ? "bg-sand-900 border-sand-900"
                          : isActive
                          ? "bg-white border-sand-900"
                          : "bg-white border-sand-200"
                      }`}
                      animate={
                        isActive && !isDone
                          ? { scale: [1, 1.06, 1] }
                          : { scale: 1 }
                      }
                      transition={
                        isActive && !isDone
                          ? {
                              duration: 1.4,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }
                          : { duration: 0.3 }
                      }
                    >
                      {isComplete ? (
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      ) : (
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? "text-sand-900" : "text-sand-400"
                          }`}
                        />
                      )}
                      {/* Pulsing glow ring for active */}
                      {isActive && !isDone && (
                        <motion.span
                          className="absolute inset-0 rounded-full border-2 border-sand-900"
                          initial={{ opacity: 0.4, scale: 1 }}
                          animate={{ opacity: 0, scale: 1.6 }}
                          transition={{
                            duration: 1.4,
                            repeat: Infinity,
                            ease: "easeOut",
                          }}
                        />
                      )}
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Labels row — reserved height regardless of caption */}
          <div className="col-span-4 grid grid-cols-4 mt-3">
            {stages.map((stage, i) => {
              const isActive = i === currentStage && !isDone;
              const isComplete = i < currentStage || isDone;

              return (
                <div
                  key={stage.key}
                  className="flex flex-col items-center text-center px-1 min-h-[44px]"
                >
                  <p
                    className={`text-[0.8125rem] font-semibold tracking-tight leading-tight transition-colors ${
                      isActive
                        ? "text-sand-900"
                        : isComplete
                        ? "text-sand-700"
                        : "text-sand-400"
                    }`}
                  >
                    {stage.label}
                  </p>
                  <p
                    className={`text-[11px] leading-tight mt-0.5 transition-opacity ${
                      isActive ? "text-sand-500 opacity-100" : "opacity-0"
                    }`}
                  >
                    {stage.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="text-center mt-8 h-10">
        {isDone && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="inline-flex items-center gap-2 bg-status-success/10 text-status-success px-4 py-2 rounded-full text-sm font-semibold tracking-tight"
          >
            <Check className="w-4 h-4" strokeWidth={3} />
            {chunkCount
              ? `Done — ${chunkCount} chunks from ${wordCount?.toLocaleString()} words`
              : "Processing complete"}
          </motion.div>
        )}
      </div>
    </div>
  );
}
