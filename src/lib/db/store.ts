import { nanoid } from "nanoid";
import type {
  Project,
  KnowledgeSource,
  KnowledgeCategory,
  Chunk,
  Conversation,
  AnalyticsData,
  QueryEvent,
  Message,
} from "./types";

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

  constructor() {
    this.seed();
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
    this.seed();
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
    return this.categories.delete(id);
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
    return updated;
  }

  deleteSource(id: string): boolean {
    const source = this.sources.get(id);
    if (!source) return false;
    for (const chunkId of source.chunks) {
      this.chunks.delete(chunkId);
    }
    return this.sources.delete(id);
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
    return conversation;
  }

  deleteConversation(id: string): boolean {
    return this.conversations.delete(id);
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

  // Analytics (derived from real data only — no randomness)
  getAnalytics(projectId: string): AnalyticsData {
    const conversations = this.getConversations(projectId);
    const resolved = conversations.filter((c) => c.metadata.resolved);
    const totalMessages = conversations.reduce(
      (sum, c) => sum + c.metadata.messageCount,
      0
    );

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
        conversations.length > 0
          ? Math.round((resolved.length / conversations.length) * 100)
          : 0,
      messagesPerDay: days,
    };
  }
}

// Singleton
export const store = new MemoryStore();
