"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, MessageSquare, BarChart3, Sparkles, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  {
    icon: BookOpen,
    title: "Smart Knowledge Base",
    description:
      "Upload docs, paste URLs, or write content. Your AI learns instantly with our visual processing pipeline.",
  },
  {
    icon: MessageSquare,
    title: "Accurate AI Responses",
    description:
      "Powered by RAG, your agent answers from your knowledge base with source citations.",
  },
  {
    icon: BarChart3,
    title: "Conversation Analytics",
    description:
      "Track conversations, resolution rates, and popular questions. Understand your customers.",
  },
  {
    icon: Zap,
    title: "Deploy in Minutes",
    description:
      "From first upload to live chatbot in under 3 minutes. Embed anywhere with one line of code.",
  },
  {
    icon: Shield,
    title: "Always Accurate",
    description:
      "Your agent only answers from your knowledge base. No hallucinations, no made-up answers.",
  },
  {
    icon: Sparkles,
    title: "Beautiful Widget",
    description:
      "A customizable chat widget that matches your brand. Colors, greeting, position — all yours.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-sand-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-warm-orange flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg font-semibold text-sand-900 tracking-tight">
            Clarix
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </Link>
          <Link href="/onboarding">
            <Button size="sm">
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-20 pb-16 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
        >
          <span className="inline-flex items-center gap-1.5 bg-warm-orange-light text-warm-orange text-sm font-medium px-3 py-1 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-powered customer support
          </span>
        </motion.div>

        <motion.h1
          className="text-5xl font-bold text-sand-900 leading-tight tracking-tight mb-6"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          Your knowledge,
          <br />
          <span className="text-warm-orange">your AI agent.</span>
        </motion.h1>

        <motion.p
          className="text-lg text-sand-600 max-w-2xl mx-auto mb-10 leading-relaxed"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          Upload your docs, and Clarix builds an AI support agent that answers
          customer questions accurately — with source citations. Ready in
          minutes, not months.
        </motion.p>

        <motion.div
          className="flex items-center justify-center gap-4"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          <Link href="/onboarding">
            <Button size="lg">
              Build your agent <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary" size="lg">
              View demo
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Feature preview */}
      <motion.section
        className="max-w-5xl mx-auto px-8 pb-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <div className="bg-sand-100 border border-sand-200 rounded-2xl p-8 shadow-sand-lg">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-warm-orange/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-warm-orange" />
            </div>
            <div className="flex-1">
              <div className="bg-white rounded-xl p-4 border border-sand-200">
                <p className="text-sm text-sand-500 mb-2">Customer asks:</p>
                <p className="text-sand-800">How do I reset my password?</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-sand-200 mt-3">
                <p className="text-sm text-sand-500 mb-2">Clarix responds:</p>
                <p className="text-sand-800">
                  To reset your password, go to Settings &rarr; Security &rarr; Change
                  Password. You&apos;ll receive a verification email. Click the link
                  to set a new password.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs bg-warm-orange-light text-warm-orange px-2 py-0.5 rounded-full">
                    Source: Help Center Docs
                  </span>
                  <span className="text-xs text-sand-400">98% match</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-sand-900 mb-4">
            Everything you need
          </h2>
          <p className="text-sand-600 max-w-xl mx-auto">
            From knowledge management to deployment, Clarix handles the entire
            customer support AI pipeline.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="bg-sand-100 border border-sand-200 rounded-xl p-6 shadow-sand hover:shadow-sand-lg transition-all duration-200 hover:-translate-y-0.5"
              variants={fadeUp}
              custom={i}
            >
              <div className="w-10 h-10 rounded-lg bg-warm-orange-light flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-warm-orange" />
              </div>
              <h3 className="text-base font-semibold text-sand-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-sand-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-8 pb-20 text-center">
        <div className="bg-sand-900 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to build your AI agent?
          </h2>
          <p className="text-sand-400 mb-8 max-w-lg mx-auto">
            Get from zero to a working AI support chatbot in under 3 minutes.
            No code required.
          </p>
          <Link href="/onboarding">
            <Button
              size="lg"
              className="bg-warm-orange text-white hover:bg-warm-orange-hover"
            >
              Get started for free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sand-200 py-8">
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-warm-orange flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-sand-700">Clarix</span>
          </div>
          <p className="text-xs text-sand-500">
            Built with Next.js, OpenAI, and Vercel AI SDK
          </p>
        </div>
      </footer>
    </div>
  );
}
