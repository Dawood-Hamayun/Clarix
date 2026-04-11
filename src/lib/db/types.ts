export interface Project {
  id: string;
  name: string;
  description: string;
  /**
   * OpenAI API key scoped to this project. Collected during onboarding
   * so self-hosted users can bring their own key without editing .env.
   * Never sent to the client in plaintext — the /api/project GET handler
   * returns `hasOpenAIApiKey` instead.
   */
  openAIApiKey?: string;
  widgetConfig: WidgetConfig;
  agentConfig: AgentConfig;
  createdAt: string;
}

/**
 * Shape returned by GET /api/project. Mirrors `Project` but strips
 * the raw API key and replaces it with a boolean flag so we never
 * round-trip the secret to the browser.
 */
export type PublicProject = Omit<Project, "openAIApiKey"> & {
  hasOpenAIApiKey: boolean;
};

export interface WidgetConfig {
  primaryColor: string;
  greeting: string;
  position: "bottom-right" | "bottom-left";
  avatarUrl?: string;
  companyName: string;
  /** Label shown on the launcher button, e.g. "Chat with us" */
  launcherLabel: string;
  /** Corner radius preset for the widget shell */
  radius: "sharp" | "soft" | "round";
}

export type AgentPersonality =
  | "friendly"
  | "professional"
  | "playful"
  | "technical"
  | "empathetic"
  | "concise";

export interface AgentConfig {
  /** Display name the agent will use for itself, e.g. "Ava" */
  agentName: string;
  /** Tone/personality preset */
  personality: AgentPersonality;
  /** One-line description of what the company does. Lives in prompts too. */
  tagline: string;
}

/**
 * A Knowledge Category groups related sources by intent
 * (e.g. Pricing, FAQ, Refund Policy). Categories drive
 * the KB organization, health scoring, and retrieval boost.
 */
export interface KnowledgeCategory {
  id: string;
  projectId: string;
  slug: string; // stable identifier: "pricing", "faq", etc.
  name: string;
  description: string;
  icon: string; // lucide icon name
  order: number;
  /** Whether this is a system-recommended category (vs. user-created) */
  system: boolean;
}

export interface KnowledgeSource {
  id: string;
  projectId: string;
  /** Category this entry belongs to. Optional for legacy, required going forward. */
  categoryId?: string;
  name: string;
  type: "file" | "url" | "text";
  content: string;
  status: "processing" | "ready" | "error";
  chunks: string[]; // chunk IDs
  metadata: {
    fileType?: string;
    url?: string;
    wordCount: number;
    chunkCount: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface Chunk {
  id: string;
  sourceId: string;
  /** Denormalized from parent source for fast retrieval boost */
  categoryId?: string;
  content: string;
  embedding: number[];
  metadata: {
    position: number;
    heading?: string;
  };
}

/**
 * Derived status of a conversation, based on thumbs-up/down feedback on
 * assistant answers within that conversation.
 *
 * - `resolved`    — ≥1 thumbs-up and 0 thumbs-downs.
 * - `unresolved`  — ≥1 thumbs-down (regardless of any thumbs-ups).
 * - `unrated`     — no feedback has been given yet. Most chats land here
 *                   because reacting is optional. These are *excluded*
 *                   from resolution-rate arithmetic on purpose.
 *
 * Set by API routes (not the store) before serializing a conversation
 * to the client, so every surface agrees on the same definition.
 */
export type ConversationStatus = "resolved" | "unresolved" | "unrated";

export interface Conversation {
  id: string;
  projectId: string;
  messages: Message[];
  metadata: {
    startedAt: string;
    lastMessageAt: string;
    messageCount: number;
    /**
     * @deprecated Never written. Kept on the type so existing store
     * blobs round-trip cleanly. Use the derived `status` field below —
     * which comes from thumbs feedback — instead.
     */
    resolved: boolean;
    satisfaction?: number;
    customerName?: string;
  };
  /**
   * Derived client-facing status. Populated by API routes before the
   * conversation is returned to the browser, not persisted.
   */
  status?: ConversationStatus;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceCitation[];
  timestamp: string;
}

export interface SourceCitation {
  sourceId: string;
  sourceName: string;
  chunkId: string;
  relevanceScore: number;
  excerpt: string;
}

export interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  /**
   * Percentage of *rated* conversations that the visitor marked positive.
   * A conversation is "resolved" when it has ≥1 thumbs-up and 0 thumbs-down
   * on assistant answers. Conversations with no ratings at all are excluded
   * from both numerator and denominator, so the rate isn't diluted by
   * silent users who never react either way.
   */
  resolutionRate: number;
  /** Number of conversations with at least one thumbs-up/down rating. */
  ratedConversations: number;
  messagesPerDay: { date: string; count: number }[];
}

/**
 * Recorded every time the agent answers a user question.
 * Powers gap detection, the learning loop, and chat analytics.
 */
export interface QueryEvent {
  id: string;
  projectId: string;
  conversationId?: string;
  messageId?: string;
  query: string;
  confidence: number; // 0..1
  topScore: number; // top relevance score
  sourceCount: number;
  sourceIds: string[];
  categoryIds: string[];
  rating?: "up" | "down";
  note?: string;
  /** Prompt tokens sent to the model for this turn. */
  promptTokens?: number;
  /** Completion tokens returned by the model for this turn. */
  completionTokens?: number;
  /** Convenience sum — kept for fast aggregation without re-adding. */
  totalTokens?: number;
  createdAt: string;
}

/**
 * Aggregated token usage for a project. Powers the "OpenAI usage" card
 * on the Settings page. We can't show remaining credit (OpenAI's API
 * doesn't expose it to key-scoped calls) so we show what's been spent
 * on this project's chats since the first message.
 */
export interface TokenUsageSummary {
  projectId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  /** Chat turns we actually captured usage for. */
  turns: number;
  /** ISO timestamp of the earliest turn in the window. */
  since: string | null;
  /** Rough USD cost estimate using public gpt-4o pricing. */
  estimatedCostUsd: number;
}

/**
 * Simple knowledge base health snapshot — used on the dashboard.
 * No grades, no weighted formulas, just the numbers that matter.
 */
export interface KBHealthReport {
  sourceCount: number;
  readyCount: number;
  processingCount: number;
  errorCount: number;
  wordCount: number;
  chunkCount: number;
  lastUpdatedAt: string | null;
  /** Friendly state used to drive the dashboard badge + message */
  status: "empty" | "starting" | "ready" | "strong";
  message: string;
}

export interface KBGap {
  query: string;
  occurrences: number;
  avgConfidence: number;
  worstConfidence: number;
  rating?: "up" | "down";
  lastSeen: string;
  suggestedCategoryId?: string;
  suggestedCategoryName?: string;
}
