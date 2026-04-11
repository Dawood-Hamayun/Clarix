import { nanoid } from "nanoid";
import type {
  Project,
  KnowledgeSource,
  KnowledgeCategory,
  Chunk,
  Conversation,
  ConversationStatus,
  AnalyticsData,
  QueryEvent,
  Message,
} from "./types";
import {
  clearSnapshot,
  isPersistenceEnabled,
  loadSnapshot,
  saveSnapshot,
  type StoreSnapshot,
} from "./persistence";
import { vectorStore } from "./vector-store";

const DEFAULT_CATEGORIES: Omit<
  KnowledgeCategory,
  "id" | "projectId"
>[] = [
  {
    slug: "company",
    name: "Company",
    description: "Who you are, mission, team, story",
    icon: "Building2",
    order: 1,
    system: true,
  },
  {
    slug: "products",
    name: "Products & Services",
    description: "What you offer — features, capabilities, use cases",
    icon: "Package",
    order: 2,
    system: true,
  },
  {
    slug: "pricing",
    name: "Pricing & Plans",
    description: "Tiers, billing, add-ons, discounts",
    icon: "CreditCard",
    order: 3,
    system: true,
  },
  {
    slug: "faq",
    name: "FAQ",
    description: "Common customer questions",
    icon: "HelpCircle",
    order: 4,
    system: true,
  },
  {
    slug: "how-to",
    name: "How-to Guides",
    description: "Step-by-step customer workflows",
    icon: "Wrench",
    order: 5,
    system: true,
  },
  {
    slug: "policies",
    name: "Policies",
    description: "Refunds, privacy, terms, cancellation",
    icon: "ShieldCheck",
    order: 6,
    system: true,
  },
  {
    slug: "contact",
    name: "Contact & Escalation",
    description: "How to reach a human",
    icon: "Mail",
    order: 7,
    system: true,
  },
];

class MemoryStore {
  projects: Map<string, Project> = new Map();
  categories: Map<string, KnowledgeCategory> = new Map();
  sources: Map<string, KnowledgeSource> = new Map();
  chunks: Map<string, Chunk> = new Map();
  conversations: Map<string, Conversation> = new Map();
  queryEvents: Map<string, QueryEvent> = new Map();

  // ---- Hydration / persistence plumbing ----

  private hydrationPromise: Promise<void> | null = null;
  private hydrated = false;
  private dirty = false;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Always seed so sync callers get a valid default state
    // before the first async hydration returns.
    this.seed();
  }

  /**
   * Lazily load the persisted snapshot from Redis the first time any
   * API route touches the store. Subsequent calls are no-ops.
   *
   * Callers must `await store.ready()` at the top of each handler that
   * reads or writes state.
   */
  ready(): Promise<void> {
    if (this.hydrated) return Promise.resolve();
    if (!isPersistenceEnabled()) {
      this.hydrated = true;
      return Promise.resolve();
    }
    if (!this.hydrationPromise) {
      this.hydrationPromise = loadSnapshot()
        .then((snapshot) => {
          if (snapshot) {
            this.loadSnapshot(snapshot);
          }
          this.hydrated = true;
        })
        .catch((err) => {
          console.warn("[store] hydrate failed:", err);
          this.hydrated = true;
        });
    }
    return this.hydrationPromise;
  }

  /**
   * Mark the store dirty and schedule a debounced flush to Redis.
   * Batches rapid successive mutations (e.g. indexing many chunks)
   * into a single write.
   */
  private scheduleFlush() {
    if (!isPersistenceEnabled()) return;
    this.dirty = true;
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      if (!this.dirty) return;
      this.dirty = false;
      const snapshot = this.toSnapshot();
      // Fire-and-forget — persistence failures must never break the request.
      saveSnapshot(snapshot).catch((err) => {
        console.warn("[store] flush failed:", err);
      });
    }, 200);
  }

  /**
   * Synchronously flush (await the pending write). Used by DELETE
   * handlers that want to guarantee the write lands before the
   * response is returned.
   */
  async flushNow(): Promise<void> {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    if (!this.dirty || !isPersistenceEnabled()) return;
    this.dirty = false;
    await saveSnapshot(this.toSnapshot());
  }

  private toSnapshot(): StoreSnapshot {
    return {
      version: 1,
      projects: Array.from(this.projects.values()),
      categories: Array.from(this.categories.values()),
      sources: Array.from(this.sources.values()),
      chunks: Array.from(this.chunks.values()),
      conversations: Array.from(this.conversations.values()),
      queryEvents: Array.from(this.queryEvents.values()),
    };
  }

  private loadSnapshot(snapshot: StoreSnapshot) {
    this.projects = new Map(snapshot.projects.map((p) => [p.id, p]));
    this.categories = new Map(snapshot.categories.map((c) => [c.id, c]));
    this.sources = new Map(snapshot.sources.map((s) => [s.id, s]));
    this.chunks = new Map(snapshot.chunks.map((c) => [c.id, c]));
    this.conversations = new Map(
      snapshot.conversations.map((c) => [c.id, c])
    );
    this.queryEvents = new Map(
      snapshot.queryEvents.map((e) => [e.id, e])
    );

    // Rebuild the in-memory vector index from the persisted chunks so
    // RAG search works immediately without re-embedding.
    const entries = snapshot.chunks
      .filter((c) => Array.isArray(c.embedding) && c.embedding.length > 0)
      .map((c) => {
        const source = this.sources.get(c.sourceId);
        return {
          chunkId: c.id,
          sourceId: c.sourceId,
          projectId: source?.projectId ?? "proj_demo",
          embedding: c.embedding,
        };
      });
    vectorStore.rebuild(entries);
  }

  /**
   * Wipe everything and re-seed from scratch. Used by the
   * "Delete project" danger-zone action so the demo returns
   * to a pristine state without restarting the server.
   */
  resetAll() {
    this.projects.clear();
    this.categories.clear();
    this.sources.clear();
    this.chunks.clear();
    this.conversations.clear();
    this.queryEvents.clear();
    vectorStore.clear();
    this.seed();
    // Also clear the persisted snapshot so the fresh seed
    // isn't immediately overwritten by the old data on next hydrate.
    if (isPersistenceEnabled()) {
      clearSnapshot().catch(() => {});
    }
    this.scheduleFlush();
  }

  private seed() {
    const projectId = "proj_demo";
    this.projects.set(projectId, {
      id: projectId,
      name: "Your Company",
      description: "",
      widgetConfig: {
        primaryColor: "#18181B",
        greeting: "Hi! How can I help you today?",
        position: "bottom-right",
        companyName: "Your Company",
        launcherLabel: "Chat with us",
        radius: "soft",
      },
      agentConfig: {
        agentName: "Ava",
        personality: "friendly",
        tagline: "",
      },
      createdAt: new Date().toISOString(),
    });

    for (const template of DEFAULT_CATEGORIES) {
      const category: KnowledgeCategory = {
        ...template,
        id: `cat_${template.slug}`,
        projectId,
      };
      this.categories.set(category.id, category);
    }
  }

  // Projects
  getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  getDefaultProject(): Project {
    return this.projects.get("proj_demo")!;
  }

  updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const project = this.projects.get(id);
    if (!project) return undefined;
    const updated = { ...project, ...updates };
    this.projects.set(id, updated);
    this.scheduleFlush();
    return updated;
  }

  createProject(data: Omit<Project, "id" | "createdAt">): Project {
    const project: Project = {
      ...data,
      id: `proj_${nanoid(8)}`,
      createdAt: new Date().toISOString(),
    };
    this.projects.set(project.id, project);

    for (const template of DEFAULT_CATEGORIES) {
      const category: KnowledgeCategory = {
        ...template,
        id: `cat_${project.id}_${template.slug}`,
        projectId: project.id,
      };
      this.categories.set(category.id, category);
    }
    this.scheduleFlush();
    return project;
  }

  // Categories
  getCategories(projectId: string): KnowledgeCategory[] {
    return Array.from(this.categories.values())
      .filter((c) => c.projectId === projectId)
      .sort((a, b) => a.order - b.order);
  }

  getCategory(id: string): KnowledgeCategory | undefined {
    return this.categories.get(id);
  }

  createCategory(
    data: Omit<KnowledgeCategory, "id">
  ): KnowledgeCategory {
    const category: KnowledgeCategory = {
      ...data,
      id: `cat_${nanoid(8)}`,
    };
    this.categories.set(category.id, category);
    this.scheduleFlush();
    return category;
  }

  updateCategory(
    id: string,
    updates: Partial<KnowledgeCategory>
  ): KnowledgeCategory | undefined {
    const category = this.categories.get(id);
    if (!category) return undefined;
    const updated = { ...category, ...updates };
    this.categories.set(id, updated);
    this.scheduleFlush();
    return updated;
  }

  deleteCategory(id: string): boolean {
    const category = this.categories.get(id);
    if (!category || category.system) return false;
    for (const source of this.sources.values()) {
      if (source.categoryId === id) {
        this.sources.set(source.id, { ...source, categoryId: undefined });
      }
    }
    const ok = this.categories.delete(id);
    if (ok) this.scheduleFlush();
    return ok;
  }

  // Knowledge Sources
  getSources(projectId: string): KnowledgeSource[] {
    return Array.from(this.sources.values()).filter(
      (s) => s.projectId === projectId
    );
  }

  getSourcesByCategory(
    projectId: string,
    categoryId: string
  ): KnowledgeSource[] {
    return this.getSources(projectId).filter(
      (s) => s.categoryId === categoryId
    );
  }

  getSource(id: string): KnowledgeSource | undefined {
    return this.sources.get(id);
  }

  createSource(
    data: Omit<KnowledgeSource, "id" | "chunks" | "status" | "metadata"> & {
      metadata?: Partial<KnowledgeSource["metadata"]>;
    }
  ): KnowledgeSource {
    const source: KnowledgeSource = {
      ...data,
      id: `src_${nanoid(8)}`,
      status: "processing",
      chunks: [],
      metadata: {
        wordCount: 0,
        chunkCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data.metadata,
      },
    };
    this.sources.set(source.id, source);
    this.scheduleFlush();
    return source;
  }

  updateSource(
    id: string,
    updates: Partial<KnowledgeSource>
  ): KnowledgeSource | undefined {
    const source = this.sources.get(id);
    if (!source) return undefined;
    const updated = {
      ...source,
      ...updates,
      metadata: { ...source.metadata, ...updates.metadata },
    };
    this.sources.set(id, updated);
    this.scheduleFlush();
    return updated;
  }

  deleteSource(id: string): boolean {
    const source = this.sources.get(id);
    if (!source) return false;
    for (const chunkId of source.chunks) {
      this.chunks.delete(chunkId);
    }
    const ok = this.sources.delete(id);
    if (ok) this.scheduleFlush();
    return ok;
  }

  // Chunks
  getChunk(id: string): Chunk | undefined {
    return this.chunks.get(id);
  }

  getChunksBySource(sourceId: string): Chunk[] {
    return Array.from(this.chunks.values()).filter(
      (c) => c.sourceId === sourceId
    );
  }

  addChunk(chunk: Chunk): void {
    this.chunks.set(chunk.id, chunk);
    this.scheduleFlush();
  }

  // Conversations
  getConversations(projectId: string): Conversation[] {
    return Array.from(this.conversations.values())
      .filter((c) => c.projectId === projectId)
      .sort(
        (a, b) =>
          new Date(b.metadata.lastMessageAt).getTime() -
          new Date(a.metadata.lastMessageAt).getTime()
      );
  }

  getConversation(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  /**
   * Derive a conversation's status. Priority order:
   *
   * 1. **Explicit customer choice** (`metadata.customerResolution`) —
   *    wins over everything. When someone clicks "Yes, this helped" at
   *    the end of a chat, that's the strongest possible signal.
   * 2. **Per-message thumbs feedback** aggregated across query events:
   *    - ≥1 👍 and 0 👎 → `resolved`
   *    - ≥1 👎           → `unresolved`
   * 3. Otherwise → `unrated`.
   */
  getConversationStatus(conversationId: string): ConversationStatus {
    const conv = this.conversations.get(conversationId);
    if (conv?.metadata.customerResolution === "resolved") return "resolved";
    if (conv?.metadata.customerResolution === "unresolved") return "unresolved";

    let up = 0;
    let down = 0;
    for (const e of this.queryEvents.values()) {
      if (e.conversationId !== conversationId || !e.rating) continue;
      if (e.rating === "up") up += 1;
      else down += 1;
    }
    if (down > 0) return "unresolved";
    if (up > 0) return "resolved";
    return "unrated";
  }

  /**
   * Record an explicit customer resolution from the end-of-chat prompt
   * or the "End chat" button. This overrides per-message thumbs when
   * computing `getConversationStatus`.
   */
  setCustomerResolution(
    conversationId: string,
    value: "resolved" | "unresolved" | null
  ): Conversation | undefined {
    const conv = this.conversations.get(conversationId);
    if (!conv) return undefined;
    if (value === null) {
      delete conv.metadata.customerResolution;
    } else {
      conv.metadata.customerResolution = value;
    }
    this.scheduleFlush();
    return conv;
  }

  /**
   * Return a conversation with its derived `status` populated. Use this
   * from API routes so the browser doesn't have to know how resolution
   * is defined.
   */
  getConversationWithStatus(id: string): Conversation | undefined {
    const conv = this.conversations.get(id);
    if (!conv) return undefined;
    return { ...conv, status: this.getConversationStatus(id) };
  }

  createConversation(
    projectId: string,
    customerName?: string
  ): Conversation {
    const conversation: Conversation = {
      id: `conv_${nanoid(8)}`,
      projectId,
      messages: [],
      metadata: {
        startedAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        messageCount: 0,
        resolved: false,
        customerName,
      },
    };
    this.conversations.set(conversation.id, conversation);
    this.scheduleFlush();
    return conversation;
  }

  deleteConversation(id: string): boolean {
    const ok = this.conversations.delete(id);
    if (ok) this.scheduleFlush();
    return ok;
  }

  addMessage(
    conversationId: string,
    message: Omit<Message, "id" | "timestamp">
  ): Conversation | undefined {
    const conv = this.conversations.get(conversationId);
    if (!conv) return undefined;
    conv.messages.push({
      ...message,
      id: `msg_${nanoid(8)}`,
      timestamp: new Date().toISOString(),
    });
    conv.metadata.lastMessageAt = new Date().toISOString();
    conv.metadata.messageCount = conv.messages.length;
    this.scheduleFlush();
    return conv;
  }

  // Query events (feedback + gap detection)
  recordQueryEvent(
    data: Omit<QueryEvent, "id" | "createdAt">
  ): QueryEvent {
    const event: QueryEvent = {
      ...data,
      id: `qe_${nanoid(10)}`,
      createdAt: new Date().toISOString(),
    };
    this.queryEvents.set(event.id, event);
    this.scheduleFlush();
    return event;
  }

  getQueryEvent(id: string): QueryEvent | undefined {
    return this.queryEvents.get(id);
  }

  findQueryEventByMessage(
    conversationId: string,
    messageId: string
  ): QueryEvent | undefined {
    for (const e of this.queryEvents.values()) {
      if (e.conversationId === conversationId && e.messageId === messageId) {
        return e;
      }
    }
    return undefined;
  }

  updateQueryEvent(
    id: string,
    updates: Partial<QueryEvent>
  ): QueryEvent | undefined {
    const event = this.queryEvents.get(id);
    if (!event) return undefined;
    const updated = { ...event, ...updates };
    this.queryEvents.set(id, updated);
    this.scheduleFlush();
    return updated;
  }

  getQueryEvents(projectId: string): QueryEvent[] {
    return Array.from(this.queryEvents.values())
      .filter((e) => e.projectId === projectId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  /**
   * Aggregate token usage across all recorded chat turns for a project.
   * OpenAI doesn't expose remaining credit via key-scoped API calls, so
   * we surface spend-so-far instead. Cost is a rough estimate using the
   * publicly documented gpt-4o pricing at the time of writing
   * ($2.50 / 1M prompt tokens, $10 / 1M completion tokens).
   */
  getTokenUsage(projectId: string) {
    const events = Array.from(this.queryEvents.values()).filter(
      (e) => e.projectId === projectId && (e.promptTokens || e.completionTokens)
    );

    let promptTokens = 0;
    let completionTokens = 0;
    let earliest: string | null = null;
    for (const e of events) {
      promptTokens += e.promptTokens ?? 0;
      completionTokens += e.completionTokens ?? 0;
      if (!earliest || new Date(e.createdAt) < new Date(earliest)) {
        earliest = e.createdAt;
      }
    }
    const totalTokens = promptTokens + completionTokens;
    const estimatedCostUsd =
      (promptTokens / 1_000_000) * 2.5 + (completionTokens / 1_000_000) * 10;

    return {
      projectId,
      promptTokens,
      completionTokens,
      totalTokens,
      turns: events.length,
      since: earliest,
      estimatedCostUsd: Math.round(estimatedCostUsd * 10_000) / 10_000,
    };
  }

  // Analytics (derived from real data only — no randomness)
  getAnalytics(projectId: string): AnalyticsData {
    // Only count conversations that actually have messages. Empty shells
    // are created up-front by the playground + embed widget so the first
    // chat message has somewhere to land — they shouldn't show up in
    // metrics until the visitor actually says something.
    const conversations = this.getConversations(projectId).filter(
      (c) => c.metadata.messageCount > 0
    );
    const totalMessages = conversations.reduce(
      (sum, c) => sum + c.metadata.messageCount,
      0
    );

    // Resolution is derived from thumbs feedback via `getConversationStatus`
    // — the single source of truth used by both this metric and the
    // "Resolved" pill on the conversations list. Conversations with
    // zero ratings are *excluded* from both numerator and denominator
    // so the rate isn't diluted by silent lurkers who never reacted
    // either way. That's a fair "unknown" bucket rather than a
    // pessimistic "assume failure."
    let ratedConversations = 0;
    let resolvedConversations = 0;
    for (const c of conversations) {
      const status = this.getConversationStatus(c.id);
      if (status === "unrated") continue;
      ratedConversations += 1;
      if (status === "resolved") resolvedConversations += 1;
    }

    // Messages per day (last 7 days) — strictly real counts, no fake filler
    const days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = conversations.reduce((sum, c) => {
        return (
          sum +
          c.messages.filter((m) => m.timestamp.startsWith(dateStr)).length
        );
      }, 0);
      days.push({ date: dateStr, count });
    }

    return {
      totalConversations: conversations.length,
      totalMessages,
      resolutionRate:
        ratedConversations > 0
          ? Math.round((resolvedConversations / ratedConversations) * 100)
          : 0,
      ratedConversations,
      messagesPerDay: days,
    };
  }
}

// Singleton — cached across hot reloads in dev to survive `next dev` rebuilds.
declare global {
  var __clarixStore: MemoryStore | undefined;
}

export const store: MemoryStore =
  globalThis.__clarixStore ?? new MemoryStore();
if (process.env.NODE_ENV !== "production") {
  globalThis.__clarixStore = store;
}
