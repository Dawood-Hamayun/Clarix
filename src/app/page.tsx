"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { ClarixMark } from "@/components/ui/clarix-mark";
import { LiveDemoChat } from "@/components/demo/live-demo-chat";
import {
  FloatingDemoWidget,
  OPEN_DEMO_EVENT,
} from "@/components/demo/floating-demo-widget";

const PILOT_MAILTO =
  "mailto:fixitdavid7@gmail.com?subject=Clarix%20pilot%3A%20test%20it%20on%20our%20data";

/* ------------------------------------------------------------------ */
/* Motion helpers                                                      */
/* ------------------------------------------------------------------ */

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Hairline reading-progress bar pinned above the nav. */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    mass: 0.4,
  });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-sand-950 origin-left z-50"
      style={{ scaleX }}
    />
  );
}

function CountUp({
  to,
  prefix = "",
  suffix = "",
  duration = 1.4,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}

/** The giant zero grows as it scrolls into view. */
function ZeroStat() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center 60%"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [0.55, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.15, 1]);

  return (
    <motion.div ref={ref} style={{ scale, opacity }} className="origin-bottom lg:origin-bottom-right">
      <div className="font-bold tracking-[-0.05em] leading-none text-[clamp(7rem,18vw,13rem)] text-sand-50">
        0
      </div>
      <p className="label-mono text-sand-500 mt-2">Invented answers. Ever.</p>
    </motion.div>
  );
}

/** Ghost wordmark drifts up as the page bottoms out. */
function GhostWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["28%", "0%"]);

  return (
    <div ref={ref} className="overflow-hidden">
      <motion.div
        aria-hidden
        style={{ y }}
        className="text-center font-bold tracking-[-0.05em] leading-[0.72] text-[26vw] text-white/[0.05] select-none -mb-[5vw]"
      >
        Clarix
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter scaffold: mono index rail on the left, content right        */
/* ------------------------------------------------------------------ */

function Chapter({
  id,
  index,
  kicker,
  children,
  dark = false,
}: {
  id: string;
  index: string;
  kicker: string;
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <section
      id={id}
      className={dark ? "bg-sand-950 text-sand-50" : "border-t border-sand-200"}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 md:py-24 grid md:grid-cols-12 gap-x-10 gap-y-8">
        <div className="md:col-span-3">
          <div className="md:sticky md:top-28 flex items-baseline gap-3">
            <span
              className={`label-mono ${dark ? "text-sand-600" : "text-sand-400"}`}
            >
              {index}
            </span>
            <span
              className={`label-mono ${dark ? "text-sand-400" : "text-sand-500"}`}
            >
              {kicker}
            </span>
          </div>
        </div>
        <div className="md:col-span-9">{children}</div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Method vignettes: show the product, don't describe it               */
/* ------------------------------------------------------------------ */

function UploadVisual() {
  const files = [
    { name: "Pricing & plans.pdf", meta: "12 pages" },
    { name: "Help articles", meta: "38 imported" },
    { name: "Your website", meta: "read automatically" },
  ];
  return (
    <div className="border border-sand-200 rounded-2xl bg-white p-5">
      <p className="label-mono text-sand-400 mb-4">Drop in what you already have</p>
      <div className="space-y-2">
        {files.map((f, i) => (
          <motion.div
            key={f.name}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + i * 0.12, duration: 0.4 }}
            className="flex items-center justify-between gap-3 border border-sand-200 rounded-xl px-4 py-3"
          >
            <span className="text-sm font-semibold text-sand-900 tracking-tight truncate">
              {f.name}
            </span>
            <span className="label-mono text-sand-400 shrink-0">
              {f.meta} ✓
            </span>
          </motion.div>
        ))}
        <div className="border border-dashed border-sand-300 rounded-xl px-4 py-3 text-center">
          <span className="label-mono text-sand-400">
            + drag files · paste links
          </span>
        </div>
      </div>
    </div>
  );
}

function LearnVisual() {
  const topics = [
    { name: "Pricing & billing", count: 14, width: "72%" },
    { name: "Product & features", count: 21, width: "100%" },
    { name: "Security & privacy", count: 12, width: "58%" },
  ];
  return (
    <div className="border border-sand-200 rounded-2xl bg-white p-5">
      <p className="label-mono text-sand-400 mb-4">What it learned</p>
      <div className="space-y-4">
        {topics.map((t, i) => (
          <div key={t.name}>
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <span className="text-sm font-semibold text-sand-900 tracking-tight">
                {t.name}
              </span>
              <span className="label-mono text-sand-400 shrink-0">
                {t.count} answers
              </span>
            </div>
            <div className="h-1 rounded-full bg-sand-150 overflow-hidden">
              <motion.div
                className="h-full bg-sand-950 rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: t.width }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.12, duration: 0.7, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="label-mono text-sand-500 mt-5 pt-4 border-t border-sand-200">
        47 answers ready, 3 minutes after upload
      </p>
    </div>
  );
}

function WebsiteVisual() {
  return (
    <div className="border border-sand-200 rounded-2xl bg-white overflow-hidden">
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-sand-200">
        <span className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2.5 h-2.5 rounded-full bg-sand-150" />
          ))}
        </span>
        <span className="ml-2 bg-sand-100 rounded-md px-4 py-1 label-mono text-sand-400">
          yourcompany.com
        </span>
      </div>

      {/* Page skeleton with the agent appearing in the corner */}
      <div className="relative p-5 h-44">
        <div className="w-2/5 h-3 bg-sand-150 rounded-full" />
        <div className="mt-3 w-3/5 h-2 bg-sand-100 rounded-full" />
        <div className="mt-2 w-1/2 h-2 bg-sand-100 rounded-full" />
        <div className="mt-2 w-2/5 h-2 bg-sand-100 rounded-full" />

        <motion.div
          className="absolute bottom-4 right-4 flex items-end gap-2"
          initial={{ opacity: 0, scale: 0.7, y: 8 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.45, type: "spring", stiffness: 260, damping: 18 }}
        >
          <div className="bg-white border border-sand-200 rounded-xl rounded-br-sm px-3 py-2 shadow-sand text-xs font-semibold text-sand-800 tracking-tight">
            Hi! Need a hand?
          </div>
          <div className="w-9 h-9 rounded-full bg-sand-950 text-sand-50 flex items-center justify-center text-xs font-bold select-none shrink-0">
            A
          </div>
        </motion.div>
      </div>

      <div className="px-5 py-3.5 border-t border-sand-200">
        <span className="label-mono text-sand-400">
          It just appears on your site. No redesign needed
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page data                                                           */
/* ------------------------------------------------------------------ */

const guarantees = [
  "Answers with sources",
  "Honest human handoff",
  "Never trains on your data",
  "Your tone, your brand",
  "Live in minutes",
  "No hallucinations",
];

const problems = [
  {
    pain: "Customers wait hours for a first reply.",
    fix: "Seconds now. 3am Sunday included.",
  },
  {
    pain: "Your team answers the same twenty questions on repeat.",
    fix: "Clarix takes the repeats. Your team does real work.",
  },
  {
    pain: "Generic chatbots invent answers.",
    fix: "Clarix cites its source, or says it doesn't know.",
  },
];

const method = [
  {
    index: "01",
    title: "Share what you know",
    description:
      "Drag in help docs, paste your website, answer a few questions. No code.",
    visual: <UploadVisual />,
  },
  {
    index: "02",
    title: "Clarix learns your business",
    description:
      "Minutes later it knows your products, policies, and tone. And shows you what it learned.",
    visual: <LearnVisual />,
  },
  {
    index: "03",
    title: "It starts answering",
    description:
      "It appears on your site the same day. Instant, on-brand replies.",
    visual: <WebsiteVisual />,
  },
];

const comparison = [
  { label: "First response", before: "4+ hours", after: "Seconds" },
  { label: "Coverage", before: "9 to 5, weekdays", after: "24/7, every day" },
  { label: "Reaching your team", before: "Every question", after: "Only the hard ones" },
  { label: "Consistency", before: "Depends who replies", after: "Same right answer, every time" },
];

const faqs = [
  {
    q: "Will it make things up?",
    a: "No. It only answers from what you give it, shows its source on every reply, and hands off when it doesn't know. Ask the demo something off-script and watch.",
  },
  {
    q: "How long does setup take?",
    a: "Most teams go live the same day. Share your help content, review a few answers, add it to your site with a copy and paste.",
  },
  {
    q: "Will it sound like our brand?",
    a: "Yes. Name it, pick the look, set the tone. It greets customers your way.",
  },
  {
    q: "What happens when it can't answer?",
    a: "It says so politely and passes the conversation to your team with full context. It also logs what it couldn't answer, so you know what to add next.",
  },
  {
    q: "Can we test it on our own docs?",
    a: "The demo runs on a sample company so you can push it hard. For a pilot on your real content, reach out. Setup takes about a day.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const openDemo = () => window.dispatchEvent(new CustomEvent(OPEN_DEMO_EVENT));

  return (
    <div className="min-h-screen bg-sand-50">
      <ScrollProgress />

      {/* ========================= NAV ========================= */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-sand-50/85 border-b border-sand-200">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <ClarixMark className="w-7 h-7" />
            <span className="text-lg font-bold text-sand-950 tracking-tighter">
              Clarix
              <span className="align-super text-[9px] font-medium ml-0.5">®</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {[
              ["Problem", "#problem"],
              ["Method", "#method"],
              ["Proof", "#proof"],
              ["Numbers", "#numbers"],
              ["FAQ", "#faq"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="label-mono text-sand-500 hover:text-sand-950 transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/dashboard"
              className="hidden sm:block label-mono text-sand-500 hover:text-sand-950 transition-colors"
            >
              Sign in
            </Link>
            <Link href="/onboarding">
              <Button size="sm" className="rounded-full px-5">
                Try the demo
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ========================= HERO ========================= */}
      <header className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 md:pt-20 pb-16">
        {/* Manifest row */}
        <Reveal>
          <div className="flex items-center justify-between pb-6 border-b border-sand-200">
            <span className="label-mono text-sand-500">
              The AI support agent for teams that answer to customers
            </span>
            <span className="label-mono text-sand-400 hidden sm:block">
              Live in minutes
            </span>
          </div>
        </Reveal>

        {/* Display headline */}
        <h1 className="mt-10 md:mt-14 font-bold text-sand-950 tracking-[-0.04em] leading-[0.98] text-[clamp(3rem,8.5vw,7rem)]">
          <motion.span
            className="block"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05, ease: "easeOut" }}
          >
            Every customer question,
          </motion.span>
          <motion.span
            className="block"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease: "easeOut" }}
          >
            answered in <em className="font-medium">seconds.</em>
          </motion.span>
        </h1>

        {/* Standfirst + CTAs */}
        <div className="mt-10 md:mt-14 grid md:grid-cols-12 gap-x-10 gap-y-8 items-end">
          <motion.div
            className="md:col-span-6"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32, ease: "easeOut" }}
          >
            <p className="text-lg md:text-xl text-sand-600 leading-relaxed max-w-xl">
              Clarix learns your business, then answers your customers
              instantly. Day and night. Your team keeps the hard ones.
            </p>
            <div className="mt-8 flex items-center gap-6">
              <Link href="/onboarding">
                <Button size="lg" className="rounded-full px-8">
                  Explore the full demo
                </Button>
              </Link>
              <a
                href="#demo"
                className="text-[0.9375rem] font-semibold text-sand-950 underline underline-offset-4 decoration-sand-300 hover:decoration-sand-950 transition-colors"
              >
                Watch it work ↓
              </a>
            </div>
          </motion.div>

          {/* Instant value: the numbers, right where the eye lands */}
          <motion.ul
            className="md:col-span-5 md:col-start-8 space-y-2.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            {[
              "70% of questions resolved instantly",
              "First reply in ~3 seconds",
              "24/7, no extra hires",
            ].map((line) => (
              <li
                key={line}
                className="label-mono text-sand-500 flex items-center gap-3"
              >
                <span className="w-5 h-px bg-sand-300 shrink-0" />
                {line}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* ---------- Live demo, presented like a product plate ---------- */}
        <div id="demo" className="mt-16 md:mt-24 scroll-mt-24">
          <Reveal>
            <div className="flex items-center justify-between pb-4">
              <span className="label-mono text-sand-500">
                Live demo: it types by itself, then it&apos;s all yours
              </span>
              <span className="label-mono text-sand-400 hidden sm:block">
                Sample company: Acme Cloud
              </span>
            </div>
            <div className="border-t border-sand-200 pt-10 md:pt-12 flex justify-center">
              <LiveDemoChat
                autoplay
                className="h-[540px] w-full max-w-xl shadow-sand-lg"
              />
            </div>
          </Reveal>
        </div>
      </header>

      {/* ========================= GUARANTEES MARQUEE ========================= */}
      <div className="border-y border-sand-200 py-4 overflow-hidden select-none">
        <div className="marquee-track items-center">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center shrink-0">
              {guarantees.map((line) => (
                <span key={`${copy}-${line}`} className="flex items-center">
                  <span className="label-mono text-sand-400 whitespace-nowrap px-8">
                    {line}
                  </span>
                  <span className="text-sand-300 text-xs">✺</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ========================= 01 — PROBLEM ========================= */}
      <Chapter id="problem" index="01" kicker="The problem">
        <Reveal>
          <h2 className="text-3xl md:text-5xl font-bold text-sand-950 tracking-tighter leading-[1.05] max-w-2xl">
            Support doesn&apos;t scale.
            <br />
            Clarix does.
          </h2>
        </Reveal>

        <div className="mt-12">
          {problems.map((item, i) => (
            <Reveal key={item.pain} delay={i * 0.05}>
              <div className="grid sm:grid-cols-2 gap-x-10 gap-y-2 py-7 border-t border-sand-200">
                <p className="text-sand-400 line-through decoration-sand-300 leading-snug">
                  {item.pain}
                </p>
                <p className="text-sand-950 font-semibold leading-snug">
                  {item.fix}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Chapter>

      {/* ========================= 02 — METHOD ========================= */}
      <Chapter id="method" index="02" kicker="The method">
        <Reveal>
          <h2 className="text-3xl md:text-5xl font-bold text-sand-950 tracking-tighter leading-[1.05] max-w-2xl">
            Live before your
            <br />
            next coffee break.
          </h2>
        </Reveal>

        <div className="mt-12">
          {method.map((step) => (
            <Reveal key={step.index}>
              <div className="grid md:grid-cols-12 gap-x-10 gap-y-6 py-10 border-t border-sand-200 items-center">
                <span className="md:col-span-1 font-mono text-sm text-sand-400">
                  ({step.index})
                </span>
                <div className="md:col-span-5">
                  <h3 className="text-2xl font-bold text-sand-950 tracking-tight leading-tight">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sand-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <div className="md:col-span-6">{step.visual}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </Chapter>

      {/* ========================= 03 — PROOF (dark) ========================= */}
      <Chapter id="proof" index="03" kicker="The proof" dark>
        <div className="grid lg:grid-cols-12 gap-x-10 gap-y-14 items-center">
          <div className="lg:col-span-7">
            <Reveal>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter leading-[1.05] text-sand-50">
                It never guesses.
              </h2>
              <p className="mt-6 text-lg text-sand-400 leading-relaxed max-w-lg">
                One invented refund policy costs more than a year of saved
                tickets. So Clarix was built to never invent.
              </p>
            </Reveal>

            <div className="mt-10 space-y-0">
              {[
                "Every answer shows exactly where it came from",
                "Questions it can't answer go to a human, with full context",
                "You review what it knows before customers ever see it",
              ].map((line, i) => (
                <Reveal key={line} delay={i * 0.05}>
                  <div className="flex items-baseline gap-4 py-4 border-t border-sand-800">
                    <span className="font-mono text-xs text-sand-600 shrink-0">
                      0{i + 1}
                    </span>
                    <p className="text-sand-200 leading-snug">{line}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.15}>
              <button
                onClick={openDemo}
                className="mt-10 inline-flex items-center gap-3 bg-sand-50 text-sand-950 font-semibold rounded-full px-7 py-3.5 hover:bg-white transition-colors"
              >
                Try to trip it up
                <span aria-hidden>↘</span>
              </button>
            </Reveal>
          </div>

          <div className="lg:col-span-5 text-center lg:text-right">
            <ZeroStat />
          </div>
        </div>
      </Chapter>

      {/* ========================= 04 — NUMBERS ========================= */}
      <Chapter id="numbers" index="04" kicker="The numbers">
        <Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {[
              { value: <CountUp to={70} suffix="%" />, label: "Resolved instantly" },
              { value: <>~3s</>, label: "First response" },
              { value: <>24/7</>, label: "Coverage" },
              { value: <CountUp to={40} suffix="h" />, label: "Returned monthly" },
            ].map((stat, i) => (
              <div
                key={i}
                className={`py-6 lg:py-2 px-6 first:pl-0 ${
                  i > 0 ? "border-l border-sand-200" : ""
                }`}
              >
                <div className="text-5xl md:text-6xl font-bold text-sand-950 tracking-[-0.04em]">
                  {stat.value}
                </div>
                <div className="label-mono text-sand-500 mt-3">{stat.label}</div>
              </div>
            ))}
          </div>
          <p className="label-mono text-sand-400 mt-8">
            Typical once Clarix knows your business. Tracked live in your
            dashboard
          </p>
        </Reveal>

        {/* Before / after */}
        <Reveal delay={0.1}>
          <div className="mt-16">
            <div className="grid grid-cols-[1.1fr_1fr_1fr] pb-4">
              <span className="label-mono text-sand-400">The week</span>
              <span className="label-mono text-sand-400">Before</span>
              <span className="label-mono text-sand-950">With Clarix</span>
            </div>
            {comparison.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1.1fr_1fr_1fr] py-5 border-t border-sand-200 items-baseline"
              >
                <span className="text-sand-600 text-[0.9375rem] pr-4">
                  {row.label}
                </span>
                <span className="text-sand-400 text-[0.9375rem] pr-4">
                  {row.before}
                </span>
                <span className="text-sand-950 font-semibold text-[0.9375rem]">
                  {row.after}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </Chapter>

      {/* ========================= THE HONEST PITCH ========================= */}
      <section className="border-t border-sand-200">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-20 md:py-28 text-center">
          <Reveal>
            <p className="text-2xl md:text-[2.5rem] md:leading-[1.25] font-medium text-sand-950 tracking-tight text-balance">
              We could paste a glowing testimonial here. Instead, the demo is
              live.{" "}
              <button
                onClick={openDemo}
                className="underline underline-offset-[6px] decoration-sand-300 hover:decoration-sand-950 transition-colors"
              >
                Ask it the hard questions yourself.
              </button>
            </p>
            <p className="label-mono text-sand-500 mt-10">
              No fake logos. No invented quotes. Just the product.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ========================= 05 — FAQ ========================= */}
      <Chapter id="faq" index="05" kicker="Questions">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-bold text-sand-950 tracking-tighter leading-[1.05]">
            Asked every single demo.
          </h2>
        </Reveal>

        <div className="mt-10">
          {faqs.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 0.04}>
              <details className="group border-t border-sand-200">
                <summary className="flex items-baseline gap-6 py-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="font-mono text-sm text-sand-400 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-lg md:text-xl font-bold text-sand-950 tracking-tight">
                    {faq.q}
                  </span>
                  <span
                    aria-hidden
                    className="text-2xl font-light text-sand-400 leading-none transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-8 pl-[calc(0.875rem*2+1.5rem)] md:pl-16 text-sand-600 leading-relaxed max-w-2xl -mt-1">
                  {faq.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </Chapter>

      {/* ========================= CTA + FOOTER (dark) ========================= */}
      <footer className="bg-sand-950 text-sand-50 overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-20 md:pt-28">
          <Reveal>
            <p className="label-mono text-sand-500 mb-8">Last thing</p>
            <h2 className="font-bold tracking-[-0.04em] leading-[1.0] text-[clamp(2.5rem,6.5vw,5.5rem)] max-w-4xl text-sand-50">
              Right now, a customer
              <br />
              is waiting for an answer.
            </h2>
            <div className="mt-12 flex flex-wrap items-center gap-6">
              <Link href="/onboarding">
                <Button
                  size="lg"
                  className="rounded-full px-8 bg-sand-50 text-sand-950 hover:bg-white"
                >
                  Explore the full demo
                </Button>
              </Link>
              <a
                href={PILOT_MAILTO}
                className="text-[0.9375rem] font-semibold text-sand-50 underline underline-offset-4 decoration-sand-700 hover:decoration-sand-50 transition-colors"
              >
                Test it on your own data ↗
              </a>
            </div>
          </Reveal>

          {/* Meta row */}
          <div className="mt-20 pt-6 border-t border-sand-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
            <span className="label-mono text-sand-600">© 2026 Clarix</span>
            <div className="flex items-center gap-8">
              {[
                ["Method", "#method"],
                ["Proof", "#proof"],
                ["FAQ", "#faq"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="label-mono text-sand-500 hover:text-sand-50 transition-colors"
                >
                  {label}
                </a>
              ))}
              <Link
                href="/dashboard"
                className="label-mono text-sand-500 hover:text-sand-50 transition-colors"
              >
                Sign in
              </Link>
            </div>
            <span className="label-mono text-sand-600">
              AI support, done properly
            </span>
          </div>
        </div>

        <GhostWordmark />
      </footer>

      {/* The product, demoing itself */}
      <FloatingDemoWidget />
    </div>
  );
}
