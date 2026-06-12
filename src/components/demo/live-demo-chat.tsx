"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ArrowUp, RotateCcw, CornerDownRight } from "lucide-react";
import {
  DEMO_AGENT,
  DEMO_EXCHANGES,
  AUTOPLAY_IDS,
  matchExchange,
  findExchangeByQuestion,
  type DemoExchange,
} from "./demo-script";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface DemoMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  done: boolean;
  sources?: { name: string; match: number }[];
  escalated?: boolean;
}

interface LiveDemoChatProps {
  /** Play the scripted exchanges automatically when scrolled into view. */
  autoplay?: boolean;
  /** Show the agent greeting as the first message (interactive mode). */
  greeting?: boolean;
  /**
   * Pass the panel height here (e.g. "h-[520px]"). The root is a fixed-height
   * flex column and the message list scrolls inside it, the panel never
   * grows with the conversation.
   */
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Tiny **bold** renderer, streaming-safe, no markdown lib needed     */
/* ------------------------------------------------------------------ */

function renderRich(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const paragraphs = text.split("\n\n");
  paragraphs.forEach((para, pi) => {
    const parts = para.split("**");
    const nodes = parts.map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i} className="font-semibold text-sand-950">
          {part}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
    out.push(
      <p key={pi} className={pi > 0 ? "mt-2" : undefined}>
        {nodes}
      </p>
    );
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function LiveDemoChat({
  autoplay = false,
  greeting = false,
  className = "h-[520px]",
}: LiveDemoChatProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, amount: 0.35 });

  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [typedInput, setTypedInput] = useState(""); // simulated typing in the input bar
  const [userInput, setUserInput] = useState(""); // real visitor input
  const [thinking, setThinking] = useState(false);
  const [interactive, setInteractive] = useState(!autoplay);
  const [chips, setChips] = useState<string[]>([]);
  const [runId, setRunId] = useState(0); // bumped on replay to cancel timers

  const busyRef = useRef(false);
  const idRef = useRef(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, [runId]);

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(scrollToBottom, [messages, thinking, chips, typedInput, scrollToBottom]);

  /** Stream one exchange: user bubble → thinking → streamed answer → sources. */
  const playExchange = useCallback(
    async (
      exchange: DemoExchange,
      opts: { typeQuestion?: boolean; question?: string } = {}
    ) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setChips([]);

      const questionText = opts.question ?? exchange.question;

      // 1. Simulate the customer typing into the input bar
      if (opts.typeQuestion) {
        for (let i = 1; i <= questionText.length; i++) {
          if (cancelledRef.current) return;
          setTypedInput(questionText.slice(0, i));
          await sleep(20 + Math.random() * 16);
        }
        await sleep(240);
        setTypedInput("");
      }
      if (cancelledRef.current) return;

      // 2. User bubble
      const userId = ++idRef.current;
      setMessages((m) => [
        ...m,
        { id: userId, role: "user", text: questionText, done: true },
      ]);

      // 3. Thinking indicator
      await sleep(350);
      if (cancelledRef.current) return;
      setThinking(true);
      await sleep(850 + Math.random() * 450);
      if (cancelledRef.current) return;
      setThinking(false);

      // 4. Stream the answer word by word
      const botId = ++idRef.current;
      setMessages((m) => [
        ...m,
        {
          id: botId,
          role: "assistant",
          text: "",
          done: false,
          escalated: exchange.escalated,
        },
      ]);
      const words = exchange.answer.split(" ");
      let acc = "";
      for (let i = 0; i < words.length; i++) {
        if (cancelledRef.current) return;
        acc += (i > 0 ? " " : "") + words[i];
        const snapshot = acc;
        setMessages((m) =>
          m.map((msg) => (msg.id === botId ? { ...msg, text: snapshot } : msg))
        );
        await sleep(26 + Math.random() * 22);
      }

      // 5. Reveal sources + follow-up chips
      await sleep(180);
      if (cancelledRef.current) return;
      setMessages((m) =>
        m.map((msg) =>
          msg.id === botId
            ? { ...msg, done: true, sources: exchange.sources }
            : msg
        )
      );
      await sleep(320);
      if (cancelledRef.current) return;
      setChips(exchange.followUps);
      busyRef.current = false;
    },
    []
  );

  /** Autoplay loop: play the scripted exchanges, then unlock interactivity. */
  useEffect(() => {
    if (!autoplay || !inView) return;
    let alive = true;
    (async () => {
      await sleep(700);
      for (const id of AUTOPLAY_IDS) {
        if (!alive || cancelledRef.current) return;
        const ex = DEMO_EXCHANGES.find((e) => e.id === id);
        if (!ex) continue;
        await playExchange(ex, { typeQuestion: true });
        await sleep(1000);
      }
      if (alive && !cancelledRef.current) setInteractive(true);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, inView, runId]);

  /** Greeting bubble for interactive-only instances. */
  useEffect(() => {
    if (!greeting || autoplay) return;
    setMessages([
      {
        id: ++idRef.current,
        role: "assistant",
        text: DEMO_AGENT.greeting,
        done: true,
      },
    ]);
    setChips([
      "How much does the Business plan cost?",
      "Are you SOC 2 compliant?",
      "Can I cancel anytime?",
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [greeting, autoplay, runId]);

  const handleChip = (question: string) => {
    if (busyRef.current) return;
    const ex = findExchangeByQuestion(question) ?? matchExchange(question);
    void playExchange(ex);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = userInput.trim();
    if (!text || busyRef.current) return;
    setUserInput("");
    void playExchange(matchExchange(text), { question: text });
  };

  const handleReplay = () => {
    cancelledRef.current = true;
    busyRef.current = false;
    setMessages([]);
    setChips([]);
    setThinking(false);
    setTypedInput("");
    setUserInput("");
    setInteractive(!autoplay);
    idRef.current = 0;
    setTimeout(() => setRunId((r) => r + 1), 30);
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-white border border-sand-200 rounded-2xl overflow-hidden ${className}`}
    >
      {/* ---------- Header ---------- */}
      <div className="shrink-0 flex items-center gap-3 px-5 py-3.5 border-b border-sand-200">
        <div className="w-8 h-8 rounded-lg bg-sand-950 text-sand-50 flex items-center justify-center text-sm font-bold tracking-tight shrink-0 select-none">
          A
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-sand-950 tracking-tight leading-tight truncate">
            {DEMO_AGENT.name}
            <span className="text-sand-400 font-normal"> · {DEMO_AGENT.company}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sand-950 pulse-dot" />
            <span className="label-mono text-sand-500">{DEMO_AGENT.status}</span>
          </div>
        </div>
        <span className="label-mono text-sand-400 hidden sm:block">
          Live demo
        </span>
        <button
          onClick={handleReplay}
          aria-label="Replay demo"
          className="p-1.5 rounded-lg text-sand-400 hover:text-sand-950 hover:bg-sand-100 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ---------- Messages (scrolls inside fixed-height root) ---------- */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3"
      >
        {messages.length === 0 && !thinking && (
          <div className="h-full flex items-center justify-center">
            <p className="label-mono text-sand-400">
              {autoplay ? "Demo starting…" : "Ask anything"}
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) =>
            msg.role === "user" ? (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-end"
              >
                <div className="max-w-[82%] bg-sand-950 text-sand-50 text-[0.875rem] leading-relaxed rounded-2xl rounded-br-md px-4 py-2.5">
                  {msg.text}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-start"
              >
                <div className="max-w-[88%] bg-sand-100 rounded-2xl rounded-bl-md px-4 py-3 text-[0.875rem] text-sand-800 leading-relaxed">
                  {renderRich(msg.text)}

                  {/* Sources, quiet mono rows, like footnotes */}
                  <AnimatePresence>
                    {msg.done && msg.sources && msg.sources.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-2.5 border-t border-sand-200/80 space-y-1">
                          {msg.sources.map((s) => (
                            <div
                              key={s.name}
                              className="flex items-center gap-1.5 font-mono text-[10px] tracking-tight text-sand-500"
                            >
                              <CornerDownRight className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{s.name}</span>
                              <span className="text-sand-400 shrink-0">
                                {s.match}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    {msg.done && msg.escalated && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-2.5 border-t border-sand-200/80">
                          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-tight text-sand-500">
                            <CornerDownRight className="w-2.5 h-2.5 shrink-0" />
                            Handed to the human team. No guessing
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>

        {/* Thinking indicator */}
        <AnimatePresence>
          {thinking && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="bg-sand-100 rounded-2xl rounded-bl-md px-4 py-3.5 flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-sand-400"
                    animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Follow-up chips */}
        <AnimatePresence>
          {interactive && chips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap gap-1.5 pt-1"
            >
              {chips.map((c, i) => (
                <motion.button
                  key={c}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => handleChip(c)}
                  className="text-xs font-medium tracking-tight bg-white border border-sand-200 text-sand-700 rounded-full px-3 py-1.5 hover:bg-sand-950 hover:border-sand-950 hover:text-sand-50 transition-colors"
                >
                  {c}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---------- Input ---------- */}
      <div className="shrink-0 border-t border-sand-200 px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          {typedInput ? (
            <span className="flex-1 text-[0.875rem] text-sand-950 truncate demo-caret">
              {typedInput}
            </span>
          ) : (
            <input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={interactive ? "Type your own question…" : "Watch the demo…"}
              disabled={!interactive}
              className="flex-1 bg-transparent text-[0.875rem] text-sand-950 placeholder:text-sand-400 focus:outline-none disabled:cursor-default"
            />
          )}
          <button
            type="submit"
            disabled={!interactive || !userInput.trim()}
            aria-label="Send"
            className="w-8 h-8 rounded-full bg-sand-950 text-sand-50 flex items-center justify-center shrink-0 disabled:opacity-25 hover:bg-sand-800 transition-colors"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
