"use client";

import { useState } from "react";
import { Globe, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface URLScraperProps {
  onUrl: (url: string) => void;
}

export function URLScraper({ onUrl }: URLScraperProps) {
  const [url, setUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!url.trim()) return;
    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http")) {
      finalUrl = "https://" + finalUrl;
    }
    setSubmitted(true);
    onUrl(finalUrl);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setSubmitted(false);
            }}
            placeholder="https://docs.example.com/getting-started"
            className="w-full bg-white border border-sand-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-sand-800 placeholder:text-sand-400 focus:border-warm-orange focus:ring-2 focus:ring-warm-orange-light focus:outline-none transition-all"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>
        <Button onClick={handleSubmit} disabled={!url.trim() || submitted}>
          {submitted ? (
            <Check className="w-4 h-4" />
          ) : (
            <>
              Fetch <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {submitted && (
          <motion.div
            className="bg-sand-50 border border-sand-200 rounded-lg p-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p className="text-xs text-sand-500">
              URL will be scraped and content extracted automatically.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
