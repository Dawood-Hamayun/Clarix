/**
 * Scripted conversation data for the landing-page live demo widget.
 *
 * Fully client-side and deterministic. No API key, no network, so the
 * demo can never fail mid-pitch. Every answer mirrors the real Acme Cloud
 * knowledge base in demo-data.ts, so asking the same question in the live
 * playground produces a consistent answer.
 */

export interface DemoSource {
  name: string;
  match: number; // 0-100
}

export interface DemoExchange {
  id: string;
  question: string;
  /** Answer text. Supports **bold** segments only. */
  answer: string;
  sources: DemoSource[];
  followUps: string[];
  /** Lowercase keywords used to match free-typed visitor questions. */
  keywords: string[];
  /** Shown instead of sources when the agent escalates to a human. */
  escalated?: boolean;
}

export const DEMO_AGENT = {
  name: "Ava",
  company: "Acme Cloud",
  status: "Online",
  greeting:
    "Hi, I'm Ava, Acme Cloud's support agent. Ask me anything: pricing, security, integrations. I answer straight from our docs.",
};

export const DEMO_EXCHANGES: DemoExchange[] = [
  {
    id: "integrations",
    question: "Do you integrate with Slack and GitHub?",
    answer:
      "Yes, both! Acme Cloud connects natively with **Slack, GitHub, GitLab, Figma, Jira, Notion** and 10+ more tools. Pull requests link to your sprints automatically, and updates land right in your Slack channels.",
    sources: [{ name: "Acme Cloud features", match: 97 }],
    followUps: [
      "How much does the Business plan cost?",
      "Do you have a mobile app?",
      "Are you SOC 2 compliant?",
    ],
    keywords: ["integrat", "slack", "github", "gitlab", "jira", "notion", "figma", "zapier", "connect"],
  },
  {
    id: "pricing",
    question: "How much does the Business plan cost?",
    answer:
      "The **Business plan is $16 per user per month**, and annual billing saves you 20%. It includes SSO, priority support, and everything in Starter.\n\nYou can try every feature free for **14 days, no credit card required**.",
    sources: [
      { name: "Pricing and plans", match: 98 },
      { name: "Frequently asked questions", match: 91 },
    ],
    followUps: ["Can I cancel anytime?", "Is there a free plan?", "Are you SOC 2 compliant?"],
    keywords: ["price", "pricing", "cost", "how much", "business plan", "plan cost", "expensive", "per user"],
  },
  {
    id: "cancel",
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. Go to **Settings → Billing → Cancel Plan**. It takes one click. You keep full access until the end of your billing period, and your data is safely stored for **90 days** in case you change your mind.",
    sources: [
      { name: "Frequently asked questions", match: 96 },
      { name: "Pricing and plans", match: 89 },
    ],
    followUps: ["Do you offer refunds?", "Is there a free plan?", "Where is my data stored?"],
    keywords: ["cancel", "unsubscribe", "stop my subscription", "quit"],
  },
  {
    id: "soc2",
    question: "Are you SOC 2 compliant?",
    answer:
      "Yes. Acme Cloud is **SOC 2 Type II certified** and audited annually. We're also **GDPR compliant** with EU data hosting in Frankfurt, and HIPAA-ready on the Enterprise plan.",
    sources: [{ name: "Privacy and data policy", match: 97 }],
    followUps: ["Where is my data stored?", "How much does the Business plan cost?"],
    keywords: ["soc 2", "soc2", "complian", "hipaa", "gdpr", "security", "secure", "certif", "audit"],
  },
  {
    id: "free-plan",
    question: "Is there a free plan?",
    answer:
      "Yes! The **Free plan is free forever** for up to 5 users, no credit card required. And every paid plan comes with a **14-day full-feature trial**, so you can test everything before paying a cent.",
    sources: [{ name: "Pricing and plans", match: 98 }],
    followUps: ["How much does the Business plan cost?", "Can I cancel anytime?"],
    keywords: ["free plan", "free tier", "free trial", "trial", "is it free", "credit card"],
  },
  {
    id: "refunds",
    question: "Do you offer refunds?",
    answer:
      "We do. Cancel an annual plan within **30 days** for a full refund. After that, refunds are pro-rated for the unused time. Monthly plans can be canceled anytime to stop future charges.",
    sources: [{ name: "Frequently asked questions", match: 95 }],
    followUps: ["Can I cancel anytime?", "How much does the Business plan cost?"],
    keywords: ["refund", "money back"],
  },
  {
    id: "mobile",
    question: "Do you have a mobile app?",
    answer:
      "Yes! Native **iOS and Android** apps for viewing roadmaps, replying to comments, and getting push notifications. There are also Chrome, Firefox, and Safari browser extensions.",
    sources: [{ name: "Acme Cloud features", match: 94 }],
    followUps: ["Do you integrate with Slack and GitHub?", "Is there a free plan?"],
    keywords: ["mobile", "app", "ios", "android", "iphone", "phone"],
  },
  {
    id: "support-hours",
    question: "What are your support hours?",
    answer:
      "I'm here **24/7**. For anything I can't handle, our human team responds within hours on paid plans. Billing questions go straight to billing@acmecloud.example.",
    sources: [{ name: "Support and contact", match: 96 }],
    followUps: ["Are you SOC 2 compliant?", "Do you offer refunds?"],
    keywords: ["support hours", "contact", "reach", "human", "talk to someone", "email", "phone number", "hours"],
  },
  {
    id: "data-storage",
    question: "Where is my data stored?",
    answer:
      "Your data lives in one of three regions: **Virginia (US), Frankfurt (EU), or Sydney (AU)**, encrypted at rest and in transit. Canceled accounts keep their data for 90 days.",
    sources: [{ name: "Privacy and data policy", match: 96 }],
    followUps: ["Are you SOC 2 compliant?", "Can I cancel anytime?"],
    keywords: ["data stored", "where is my data", "data center", "region", "encrypt", "storage", "privacy"],
  },
];

/** The two exchanges the hero widget plays automatically on page load. */
export const AUTOPLAY_IDS = ["integrations", "pricing"];

/**
 * Honest-handoff fallback for typed questions outside the script. This is
 * itself a selling point: Clarix escalates instead of hallucinating.
 */
export const FALLBACK_EXCHANGE: DemoExchange = {
  id: "fallback",
  question: "",
  answer:
    "Good question. That one isn't covered in my docs, so I won't guess. I've passed it to the Acme Cloud team with full context, and they'll email you shortly.\n\n**When the answer isn't in your docs, Clarix never makes one up.**",
  sources: [],
  followUps: ["Are you SOC 2 compliant?", "How much does the Business plan cost?", "Can I cancel anytime?"],
  keywords: [],
  escalated: true,
};

/** Match a free-typed visitor question to the closest scripted exchange. */
export function matchExchange(input: string): DemoExchange {
  const q = input.toLowerCase();
  let best: DemoExchange | null = null;
  let bestScore = 0;
  for (const ex of DEMO_EXCHANGES) {
    let score = 0;
    for (const kw of ex.keywords) {
      if (q.includes(kw)) score += kw.length; // longer keywords = stronger signal
    }
    if (score > bestScore) {
      bestScore = score;
      best = ex;
    }
  }
  return bestScore > 0 && best ? best : FALLBACK_EXCHANGE;
}

export function findExchangeByQuestion(question: string): DemoExchange | undefined {
  return DEMO_EXCHANGES.find((ex) => ex.question === question);
}
