"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  MessageSquare,
  BarChart3,
  Sparkles,
  Zap,
  Shield,
  Code2,
  FileText,
  Quote,
  Check,
  Layers,
  Gauge,
  PlugZap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Inline GitHub mark — lucide-react dropped the brand icon, and we'd
// rather not pull in a separate icon package just for this one glyph.
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.58.1.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.39.97.01 1.95.14 2.86.39 2.18-1.49 3.14-1.18 3.14-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.8.56C20.22 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  {
    icon: BookOpen,
    title: "Knowledge base that builds itself",
    description:
      "Drop in PDFs, paste URLs, or write Markdown. Clarix parses, chunks, and embeds everything automatically — no scripts, no notebooks.",
  },
  {
    icon: MessageSquare,
    title: "Answers with receipts",
    description:
      "Every reply streams in real time, cites the exact source paragraphs it used, and shows a confidence score so you know when to trust it.",
  },
  {
    icon: BarChart3,
    title: "Analytics & gap detection",
    description:
      "Track conversation volume, resolution rate, and the questions your agent struggles with — so you know exactly which docs to add next.",
  },
  {
    icon: Zap,
    title: "Embed anywhere in 2 lines",
    description:
      "A single script tag drops the chat widget on any site. Tested on Next.js, WordPress, Shopify, Webflow, Framer, and plain HTML.",
  },
  {
    icon: Shield,
    title: "Grounded, not hallucinating",
    description:
      "Your agent only answers from your knowledge base. Clean fallback messaging when it doesn't know — never made-up answers.",
  },
  {
    icon: Sparkles,
    title: "Bring your own keys",
    description:
      "OpenAI keys are scoped per project and stored server-side. Self-host on Vercel in 5 minutes with zero vendor lock-in.",
  },
];

const stats = [
  { value: "13.5K+", label: "lines of TypeScript" },
  { value: "5 min", label: "from clone to deployed" },
  { value: "GPT-4o", label: "with streaming + citations" },
  { value: "MIT", label: "open source license" },
];

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Upload your docs",
    description:
      "Drag in PDFs, paste URLs, or import Markdown. Clarix parses and chunks them into ~500-token segments with smart overlap.",
  },
  {
    number: "02",
    icon: Layers,
    title: "Auto-indexed for retrieval",
    description:
      "Each chunk gets embedded with text-embedding-3-small and stored in a vector index. Categories, health checks, and stats update live.",
  },
  {
    number: "03",
    icon: MessageSquare,
    title: "Chat ships with citations",
    description:
      "User questions hit the retriever, top chunks get fed to GPT-4o, and the answer streams back with the exact sources inline.",
  },
  {
    number: "04",
    icon: PlugZap,
    title: "Embed it anywhere",
    description:
      "Drop the widget script on your marketing site, help center, or app. Brand it, position it, ship it.",
  },
];

const techStack = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Tailwind v4",
  "Vercel AI SDK",
  "OpenAI GPT-4o",
  "text-embedding-3-small",
  "Upstash Redis",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-sand-50">
      {/* ========================= NAV ========================= */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-sand-50/80 border-b border-sand-200/60">
        <div className="flex items-center justify-between px-8 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-warm-orange flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-semibold text-sand-900 tracking-tight">
              Clarix
            </span>
            <span className="ml-2 hidden sm:inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-sand-100 text-sand-600 border border-sand-200">
              Open source
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/Dawood-Hamayun/clarix"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm">
                <GithubIcon className="w-4 h-4" />
                <span className="hidden sm:inline">GitHub</span>
              </Button>
            </a>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Link href="/onboarding">
              <Button size="sm">
                Get started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ========================= HERO ========================= */}
      <section className="max-w-6xl mx-auto px-8 pt-20 pb-12 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
        >
          <a
            href="https://github.com/Dawood-Hamayun/clarix"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white border border-sand-200 text-sand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6 hover:border-sand-300 transition-colors shadow-sand"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            Open source on GitHub
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </motion.div>

        <motion.h1
          className="text-5xl md:text-6xl font-bold text-sand-900 leading-[1.05] tracking-tighter mb-6 max-w-4xl mx-auto"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          Turn your docs into an{" "}
          <span className="text-warm-orange">AI support agent</span> that
          actually ships.
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-sand-600 max-w-2xl mx-auto mb-10 leading-relaxed"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          Clarix is the open-source RAG platform for customer support. Upload
          your knowledge base, get a streaming chat agent with source
          citations, confidence scoring, and an embeddable widget — all in one
          self-hostable Next.js app.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
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
          <a
            href="https://github.com/Dawood-Hamayun/clarix"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" variant="secondary">
              <GithubIcon className="w-4 h-4" />
              Star on GitHub
            </Button>
          </a>
        </motion.div>

        <motion.div
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-sand-500"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
        >
          <span className="inline-flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-warm-orange" /> Self-host on
            Vercel in 5 min
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-warm-orange" /> Bring your own
            OpenAI key
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-warm-orange" /> MIT licensed
          </span>
        </motion.div>
      </section>

      {/* ========================= PRODUCT SCREENSHOT ========================= */}
      <motion.section
        className="max-w-6xl mx-auto px-8 pb-20"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        {/*
          PLACEHOLDER: hero product screenshot
          Replace this block with a real screenshot of the Clarix dashboard
          (e.g. /public/screenshots/dashboard-hero.png) — ideally a wide shot
          that shows knowledge base + chat happening at once.
        */}
        <div className="relative rounded-3xl border border-sand-200 bg-gradient-to-br from-sand-100 to-sand-50 shadow-sand-lg overflow-hidden">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-sand-200 bg-sand-100/60">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-sand-300" />
              <div className="w-3 h-3 rounded-full bg-sand-300" />
              <div className="w-3 h-3 rounded-full bg-sand-300" />
            </div>
            <div className="flex-1 text-center">
              <div className="inline-block bg-white border border-sand-200 rounded-md px-3 py-1 text-xs text-sand-500">
                clarix-rouge.vercel.app/dashboard
              </div>
            </div>
          </div>

          {/* PLACEHOLDER for screenshot — currently a styled mockup */}
          <div className="aspect-[16/9] relative bg-sand-50">
            {/*
              REPLACE ME:
              <Image
                src="/screenshots/dashboard-hero.png"
                alt="Clarix dashboard"
                fill
                className="object-cover"
              />
            */}
            <div className="absolute inset-0 grid grid-cols-[200px_1fr] gap-0">
              {/* Sidebar mockup */}
              <div className="bg-white border-r border-sand-200 p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded bg-warm-orange flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-sand-900">
                    Clarix
                  </span>
                </div>
                {[
                  "Dashboard",
                  "Knowledge",
                  "Conversations",
                  "Playground",
                  "Analytics",
                  "Widget",
                  "Settings",
                ].map((item, i) => (
                  <div
                    key={item}
                    className={`text-xs px-2 py-1.5 rounded-md ${
                      i === 1
                        ? "bg-sand-900 text-white font-semibold"
                        : "text-sand-600"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>

              {/* Main content mockup */}
              <div className="p-6 overflow-hidden">
                <div className="text-xl font-bold text-sand-900 mb-1">
                  Knowledge Base
                </div>
                <div className="text-xs text-sand-500 mb-4">
                  8 sources · 47 chunks · 7 categories covered
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Sources", value: "8" },
                    { label: "Resolution", value: "94%" },
                    { label: "Avg confidence", value: "0.87" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-white border border-sand-200 rounded-lg p-3"
                    >
                      <div className="text-[10px] text-sand-500 uppercase tracking-wide font-semibold">
                        {s.label}
                      </div>
                      <div className="text-lg font-bold text-sand-900 mt-0.5">
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "Pricing and plans", cat: "Pricing" },
                    { name: "Privacy and data", cat: "Policies" },
                    { name: "FAQ", cat: "FAQ" },
                    { name: "About Acme Cloud", cat: "Company" },
                  ].map((s) => (
                    <div
                      key={s.name}
                      className="bg-white border border-sand-200 rounded-lg p-3"
                    >
                      <div className="text-xs font-semibold text-sand-900 truncate">
                        {s.name}
                      </div>
                      <div className="text-[10px] text-sand-500 mt-1">
                        {s.cat}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating chat widget mockup */}
            <div className="absolute bottom-5 right-5 w-72 bg-white rounded-2xl border border-sand-200 shadow-sand-lg overflow-hidden">
              <div className="bg-sand-900 text-white px-4 py-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-warm-orange flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold">Ava</div>
                  <div className="text-[10px] text-sand-400">
                    Acme Cloud support
                  </div>
                </div>
              </div>
              <div className="p-3 space-y-2">
                <div className="bg-sand-100 rounded-lg p-2 text-[11px] text-sand-800">
                  How do I cancel my subscription?
                </div>
                <div className="bg-sand-50 border border-sand-200 rounded-lg p-2 text-[11px] text-sand-800">
                  Go to Settings → Billing → Cancel Plan. Your data is
                  preserved for 90 days.
                  <div className="mt-1.5 inline-flex items-center gap-1 text-[9px] bg-warm-orange-light text-warm-orange px-1.5 py-0.5 rounded-full">
                    <BookOpen className="w-2 h-2" />
                    FAQ · 96% match
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-sand-400 mt-4">
          {/* Replace this preview with a real screenshot from /public/screenshots/dashboard-hero.png */}
          Live preview of the Clarix dashboard and embeddable widget
        </p>
      </motion.section>

      {/* ========================= STATS ========================= */}
      <section className="max-w-5xl mx-auto px-8 pb-20">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="bg-white border border-sand-200 rounded-2xl p-6 text-center shadow-sand"
              variants={fadeUp}
              custom={i}
            >
              <div className="text-3xl font-bold text-sand-900 tracking-tighter">
                {stat.value}
              </div>
              <div className="text-xs text-sand-500 mt-1 uppercase tracking-wide font-semibold">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ========================= HOW IT WORKS ========================= */}
      <section className="max-w-6xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 bg-warm-orange-light text-warm-orange text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            How it works
          </span>
          <h2 className="text-4xl font-bold text-sand-900 tracking-tighter mb-4">
            From raw docs to live agent in four steps
          </h2>
          <p className="text-sand-600 max-w-xl mx-auto text-lg">
            No scripts, no glue code, no Jupyter notebooks. Just upload, click,
            and ship.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              className="bg-white border border-sand-200 rounded-2xl p-7 shadow-sand"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
            >
              <div className="flex items-start gap-5">
                <div className="shrink-0">
                  <div className="text-xs font-mono text-sand-400 mb-2">
                    {step.number}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-warm-orange-light flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-warm-orange" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-sand-900 tracking-tight mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sand-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ========================= CHAT EXAMPLE ========================= */}
      <section className="max-w-5xl mx-auto px-8 py-20">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 bg-warm-orange-light text-warm-orange text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            See it in action
          </span>
          <h2 className="text-4xl font-bold text-sand-900 tracking-tighter mb-4">
            Real answers. Real sources. Real fast.
          </h2>
          <p className="text-sand-600 max-w-xl mx-auto text-lg">
            Every reply streams from GPT-4o, cites the exact paragraphs it
            used, and surfaces a confidence score so you always know when to
            trust it.
          </p>
        </div>

        <motion.div
          className="bg-white border border-sand-200 rounded-3xl p-6 md:p-10 shadow-sand-lg max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          {/* User message */}
          <div className="flex justify-end mb-6">
            <div className="bg-sand-100 border border-sand-200 rounded-2xl rounded-tr-md px-5 py-3 max-w-md">
              <p className="text-sand-800">
                Are you SOC 2 compliant? And what about HIPAA?
              </p>
            </div>
          </div>

          {/* Assistant message */}
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-warm-orange flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="bg-sand-50 border border-sand-200 rounded-2xl rounded-tl-md px-5 py-4">
                <p className="text-sand-800 leading-relaxed">
                  Yes — Clarix is{" "}
                  <span className="bg-warm-orange-light text-warm-orange font-semibold px-1 rounded">
                    SOC 2 Type II certified
                  </span>
                  , audited annually by Drata. We&apos;re also GDPR compliant
                  and{" "}
                  <span className="bg-warm-orange-light text-warm-orange font-semibold px-1 rounded">
                    HIPAA-ready
                  </span>{" "}
                  with a BAA available on Enterprise plans, plus ISO 27001
                  certified as of 2025.
                </p>

                {/* Citations */}
                <div className="mt-4 pt-4 border-t border-sand-200">
                  <div className="text-[10px] font-semibold text-sand-500 uppercase tracking-wide mb-2">
                    Sources
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs bg-white border border-sand-200 px-2.5 py-1 rounded-lg text-sand-700">
                      <BookOpen className="w-3 h-3 text-warm-orange" />
                      Frequently asked questions
                      <span className="text-sand-400">· 96%</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs bg-white border border-sand-200 px-2.5 py-1 rounded-lg text-sand-700">
                      <BookOpen className="w-3 h-3 text-warm-orange" />
                      Privacy and data policy
                      <span className="text-sand-400">· 89%</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Confidence chip */}
              <div className="flex items-center gap-2 mt-2 px-1">
                <Gauge className="w-3 h-3 text-sand-400" />
                <span className="text-xs text-sand-500">
                  Confidence: <span className="font-semibold text-sand-700">0.93</span>
                </span>
                <span className="text-sand-300">·</span>
                <span className="text-xs text-sand-500">
                  Streamed in 1.2s
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========================= FEATURES GRID ========================= */}
      <section className="max-w-6xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 bg-warm-orange-light text-warm-orange text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            Everything in the box
          </span>
          <h2 className="text-4xl font-bold text-sand-900 tracking-tighter mb-4">
            The whole RAG stack, ready to ship
          </h2>
          <p className="text-sand-600 max-w-xl mx-auto text-lg">
            One repo. Every piece of the support pipeline. No glue code, no
            integrations to wire up.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="bg-white border border-sand-200 rounded-2xl p-7 shadow-sand hover:shadow-sand-lg transition-all duration-200 hover:-translate-y-0.5"
              variants={fadeUp}
              custom={i}
            >
              <div className="w-11 h-11 rounded-xl bg-warm-orange-light flex items-center justify-center mb-5">
                <feature.icon className="w-5 h-5 text-warm-orange" />
              </div>
              <h3 className="text-lg font-bold text-sand-900 mb-2 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-sand-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ========================= TECH STACK ========================= */}
      <section className="max-w-5xl mx-auto px-8 py-20">
        <div className="bg-white border border-sand-200 rounded-3xl p-10 md:p-14 shadow-sand">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-sand-900 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
                <Code2 className="w-3 h-3" />
                Built for builders
              </span>
              <h2 className="text-3xl font-bold text-sand-900 tracking-tighter mb-4">
                Modern stack. Zero vendor lock-in.
              </h2>
              <p className="text-sand-600 leading-relaxed mb-6">
                Clarix is one Next.js app you can deploy to Vercel in five
                minutes. Run it on the in-memory store while you experiment,
                then plug in Upstash Redis for production persistence — no
                migration required.
              </p>
              <a
                href="https://github.com/Dawood-Hamayun/clarix"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary">
                  <GithubIcon className="w-4 h-4" />
                  Browse the source
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1.5 bg-sand-50 border border-sand-200 text-sand-800 text-sm font-medium px-3.5 py-2 rounded-xl"
                >
                  <Check className="w-3.5 h-3.5 text-warm-orange" />
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================= QUOTE ========================= */}
      <section className="max-w-4xl mx-auto px-8 py-20">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          <Quote className="w-10 h-10 text-warm-orange mx-auto mb-6" />
          <p className="text-2xl md:text-3xl font-semibold text-sand-900 leading-snug tracking-tight mb-6">
            &ldquo;Most AI chatbot demos are Jupyter notebooks. Clarix is the
            opposite — a deployable multi-tenant SaaS that any team can stand
            up on Monday and have answering customer questions by
            Tuesday.&rdquo;
          </p>
          <div className="text-sm text-sand-500">
            — From the README. Try it yourself.
          </div>
        </motion.div>
      </section>

      {/* ========================= CTA ========================= */}
      <section className="max-w-5xl mx-auto px-8 pb-20">
        <div className="bg-sand-900 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
          {/* Decorative orange glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-warm-orange/20 blur-3xl rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-warm-orange/10 blur-3xl rounded-full" />

          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tighter mb-5">
              Ship your AI support agent today.
            </h2>
            <p className="text-sand-400 mb-10 max-w-xl mx-auto text-lg leading-relaxed">
              Self-host on Vercel in 5 minutes. Bring your own OpenAI key. No
              credit card, no waitlist, no vendor lock-in.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/onboarding">
                <Button
                  size="lg"
                  className="bg-warm-orange text-white hover:bg-warm-orange-hover"
                >
                  Get started for free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a
                href="https://github.com/Dawood-Hamayun/clarix"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                >
                  <GithubIcon className="w-4 h-4" />
                  View source
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================= FOOTER ========================= */}
      <footer className="border-t border-sand-200 py-10">
        <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-warm-orange flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-sand-700">Clarix</span>
            <span className="text-sm text-sand-400">·</span>
            <span className="text-sm text-sand-500">MIT licensed</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/Dawood-Hamayun/clarix"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-sand-600 hover:text-sand-900 transition-colors inline-flex items-center gap-1.5"
            >
              <GithubIcon className="w-4 h-4" /> GitHub
            </a>
            <Link
              href="/dashboard"
              className="text-sm text-sand-600 hover:text-sand-900 transition-colors"
            >
              Dashboard
            </Link>
            <p className="text-xs text-sand-500">
              Built with Next.js, OpenAI & Vercel AI SDK
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
