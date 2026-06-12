/**
 * Interview question templates keyed by category slug.
 *
 * These are the fallback questions shown immediately while the model
 * isn't needed, and they're also passed to the composer so it knows
 * what each answer was responding to.
 */

export interface InterviewQuestion {
  id: string;
  question: string;
  hint?: string;
  placeholder?: string;
  /** Optional: suggested tone/length for the answer */
  optional?: boolean;
  multiline?: boolean;
}

export interface InterviewTemplate {
  title: string;
  subtitle: string;
  questions: InterviewQuestion[];
}

export const INTERVIEW_TEMPLATES: Record<string, InterviewTemplate> = {
  company: {
    title: "Tell me about your company",
    subtitle:
      "A few short answers and I'll draft a clean company overview your agent can use.",
    questions: [
      {
        id: "what",
        question: "In one sentence, what does your company do?",
        placeholder: "e.g. We help small teams turn docs into AI agents.",
      },
      {
        id: "audience",
        question: "Who is it for?",
        hint: "Your ideal customer, be specific.",
        placeholder: "e.g. SaaS founders and support leads at 10-100 person companies.",
      },
      {
        id: "mission",
        question: "What's your mission or the reason you exist?",
        multiline: true,
      },
      {
        id: "differentiator",
        question: "What makes you different from alternatives?",
        multiline: true,
      },
      {
        id: "team",
        question: "A quick line about the team or founding story",
        optional: true,
        multiline: true,
      },
    ],
  },

  products: {
    title: "Describe your product",
    subtitle: "Give me the essentials and I'll structure them into a product overview.",
    questions: [
      {
        id: "name",
        question: "What's the product called?",
        placeholder: "e.g. Clarix",
      },
      {
        id: "elevator",
        question: "Elevator pitch, what does it do in ~2 sentences?",
        multiline: true,
      },
      {
        id: "features",
        question: "List the top 3-5 features (one per line)",
        hint: "Don't overthink it, the real wins.",
        multiline: true,
      },
      {
        id: "useCases",
        question: "What are the main use cases?",
        multiline: true,
      },
      {
        id: "integrations",
        question: "Any notable integrations or supported platforms?",
        optional: true,
        multiline: true,
      },
    ],
  },

  pricing: {
    title: "Walk me through your pricing",
    subtitle: "I'll turn this into a clean plans + billing reference.",
    questions: [
      {
        id: "plans",
        question: "What plans do you offer? (name + price + who it's for, one per line)",
        placeholder:
          "Starter, $19/mo, solo creators\nPro, $49/mo, small teams\nBusiness, custom, larger orgs",
        multiline: true,
      },
      {
        id: "includes",
        question: "What's included across all plans?",
        multiline: true,
      },
      {
        id: "trial",
        question: "Do you offer a free trial or free plan? How does it work?",
        optional: true,
        multiline: true,
      },
      {
        id: "billing",
        question: "Billing specifics, monthly/annual, currencies, discounts",
        optional: true,
        multiline: true,
      },
      {
        id: "addons",
        question: "Any add-ons, overage charges, or enterprise tier?",
        optional: true,
        multiline: true,
      },
    ],
  },

  faq: {
    title: "Let's capture your top FAQs",
    subtitle:
      "Paste or list the questions customers ask most, I'll format them nicely.",
    questions: [
      {
        id: "topQuestions",
        question: "List the questions customers ask most",
        hint: "One per line. Don't worry about answers yet, we'll do those next.",
        multiline: true,
      },
      {
        id: "answers",
        question: "Quick answers to each (in the same order)",
        hint: "Keep them short. I'll polish the phrasing.",
        multiline: true,
      },
      {
        id: "tone",
        question: "Any tone to hit? (friendly, formal, quirky...)",
        optional: true,
      },
    ],
  },

  "how-to": {
    title: "Document a how-to",
    subtitle: "I'll turn this into a clean step-by-step guide.",
    questions: [
      {
        id: "task",
        question: "What's the task? (one line)",
        placeholder: "e.g. How to install the Clarix chat widget",
      },
      {
        id: "prereqs",
        question: "Prerequisites, what does the user need first?",
        optional: true,
        multiline: true,
      },
      {
        id: "steps",
        question: "Rough steps, in order (one per line)",
        hint: "Just get the order right, I'll polish the wording.",
        multiline: true,
      },
      {
        id: "gotchas",
        question: "Common mistakes or things to watch out for",
        optional: true,
        multiline: true,
      },
      {
        id: "success",
        question: "How does the user know it worked?",
        optional: true,
        multiline: true,
      },
    ],
  },

  policies: {
    title: "Capture a policy",
    subtitle: "I'll turn this into a precise, customer-facing policy doc.",
    questions: [
      {
        id: "policy",
        question: "Which policy are we documenting?",
        placeholder: "e.g. Refund policy, Cancellation policy, Privacy policy",
      },
      {
        id: "rule",
        question: "What's the core rule, in plain language?",
        multiline: true,
      },
      {
        id: "eligibility",
        question: "Who's eligible (or not)?",
        optional: true,
        multiline: true,
      },
      {
        id: "process",
        question: "How does a customer actually request or trigger this?",
        multiline: true,
      },
      {
        id: "exceptions",
        question: "Any exceptions or edge cases?",
        optional: true,
        multiline: true,
      },
    ],
  },

  contact: {
    title: "Contact & escalation",
    subtitle: "I'll turn this into a clean contact reference.",
    questions: [
      {
        id: "channels",
        question: "Support channels, email, phone, chat, etc.",
        multiline: true,
      },
      {
        id: "hours",
        question: "Hours of availability & timezone",
        optional: true,
      },
      {
        id: "response",
        question: "Typical response time",
        optional: true,
      },
      {
        id: "escalation",
        question: "When should the agent escalate to a human? How?",
        multiline: true,
      },
    ],
  },
};

/** Generic fallback for user-created categories */
export const GENERIC_TEMPLATE: InterviewTemplate = {
  title: "Tell me about this topic",
  subtitle: "A handful of quick answers and I'll draft a structured entry.",
  questions: [
    {
      id: "title",
      question: "What are we documenting? (short title)",
      placeholder: "e.g. Shipping timelines",
    },
    {
      id: "summary",
      question: "Summarize it in 1-2 sentences",
      multiline: true,
    },
    {
      id: "details",
      question: "What are the key facts or details?",
      hint: "One per line is fine.",
      multiline: true,
    },
    {
      id: "examples",
      question: "Examples, edge cases, or things to watch out for",
      optional: true,
      multiline: true,
    },
  ],
};

export function getTemplate(slug: string): InterviewTemplate {
  return INTERVIEW_TEMPLATES[slug] ?? GENERIC_TEMPLATE;
}
