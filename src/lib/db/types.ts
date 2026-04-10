export interface Project {
  id: string;
  name: string;
  description: string;
  widgetConfig: WidgetConfig;
  agentConfig: AgentConfig;
  createdAt: string;
}

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

export interface Conversation {
  id: string;
  projectId: string;
  messages: Message[];
  metadata: {
    startedAt: string;
    lastMessageAt: string;
    messageCount: number;
    resolved: boolean;
    satisfaction?: number;
    customerName?: string;
  };
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
  resolutionRate: number;
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
  createdAt: string;
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
