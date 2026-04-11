"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Trash2,
  Bot,
  FolderPlus,
  Pencil,
  Check,
  X,
  AlertTriangle,
  KeyRound,
  Building2,
  Sparkles,
  Gauge,
} from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCategoryIcon } from "@/lib/knowledge/category-icons";
import type {
  AgentPersonality,
  KnowledgeCategory,
  PublicProject,
} from "@/lib/db/types";
import { cn } from "@/lib/utils/cn";

const PERSONALITIES: {
  value: AgentPersonality;
  label: string;
  description: string;
}[] = [
  {
    value: "friendly",
    label: "Friendly",
    description: "Warm, conversational, approachable",
  },
  {
    value: "professional",
    label: "Professional",
    description: "Polished, precise, business-appropriate",
  },
  {
    value: "playful",
    label: "Playful",
    description: "Cheerful, witty, a little casual",
  },
  {
    value: "technical",
    label: "Technical",
    description: "Precise, thorough, engineer-ready",
  },
  {
    value: "empathetic",
    label: "Empathetic",
    description: "Patient, reassuring, validates feelings",
  },
  {
    value: "concise",
    label: "Concise",
    description: "Direct, efficient, shortest possible",
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const [project, setProject] = useState<PublicProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // API key field state is kept separate from the project object because
  // the server only ever returns a boolean (`hasOpenAIApiKey`), never the
  // raw key — so we need a scratch input to let the user paste a new one.
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKeyField, setShowKeyField] = useState(false);
  const [clearingKey, setClearingKey] = useState(false);

  useEffect(() => {
    fetch("/api/project")
      .then((r) => r.json())
      .then((data: PublicProject) => {
        setProject(data);
        setLoading(false);
      });
  }, []);

  const saveProject = async (key: string, patch: Record<string, unknown>) => {
    if (!project) return;
    setSaving(key);
    const res = await fetch("/api/project", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id, ...patch }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProject(updated);
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 1500);
    }
    setSaving(null);
  };

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      await fetch("/api/project", { method: "DELETE" });
      // Clear any onboarding session state so the flow starts fresh
      sessionStorage.removeItem("clarix_onboarding");
      router.push("/onboarding");
    } catch {
      setDeleting(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-44 bg-sand-100 border border-sand-200 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold text-sand-900 tracking-tighter">
          Settings
        </h1>
        <p className="text-base text-sand-600 mt-2 max-w-xl">
          Manage your project, agent identity, and knowledge categories. Every
          change is saved to the current project.
        </p>
      </motion.div>

      <div className="space-y-6">
      {/* Project */}
      <Card>
        <div className="flex items-start gap-3">
          <SectionIcon icon={Building2} />
          <div className="flex-1">
            <CardTitle>Project</CardTitle>
            <CardDescription>
              Your project name appears in the dashboard. The company name is
              what your customers will see in the chat widget.
            </CardDescription>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <Input
            label="Project name"
            value={project.name}
            onChange={(e) =>
              setProject({ ...project, name: e.target.value })
            }
          />
          <Input
            label="Company name (shown to customers)"
            value={project.widgetConfig.companyName}
            onChange={(e) =>
              setProject({
                ...project,
                widgetConfig: {
                  ...project.widgetConfig,
                  companyName: e.target.value,
                },
              })
            }
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-sand-800 tracking-tight">
              Description
            </label>
            <textarea
              value={project.description}
              onChange={(e) =>
                setProject({ ...project, description: e.target.value })
              }
              rows={3}
              placeholder="What does your company do? (one or two sentences)"
              className="w-full bg-white border border-sand-200 rounded-xl px-4 py-3 text-[0.9375rem] text-sand-900 placeholder:text-sand-400 focus:border-sand-900 focus:ring-2 focus:ring-sand-900/10 focus:outline-none resize-none transition-all"
            />
          </div>
          <SaveButton
            onClick={() =>
              saveProject("project", {
                name: project.name,
                description: project.description,
                widgetConfig: {
                  companyName: project.widgetConfig.companyName,
                },
              })
            }
            saving={saving === "project"}
            saved={savedKey === "project"}
          />
        </div>
      </Card>

      {/* Agent identity */}
      <Card>
        <div className="flex items-start gap-3">
          <SectionIcon icon={Bot} />
          <div className="flex-1">
            <CardTitle>Agent identity</CardTitle>
            <CardDescription>
              Give your AI agent a name, a tagline, and a personality. This is
              how it will introduce itself to customers and how it will sound.
            </CardDescription>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <Input
            label="Agent name"
            placeholder="e.g. Ava, Max, Sage"
            value={project.agentConfig.agentName}
            onChange={(e) =>
              setProject({
                ...project,
                agentConfig: {
                  ...project.agentConfig,
                  agentName: e.target.value,
                },
              })
            }
            hint={`When customers ask "who are you?", the agent will call itself ${
              project.agentConfig.agentName || "…"
            }.`}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-sand-800 tracking-tight">
              Tagline (optional)
            </label>
            <input
              type="text"
              value={project.agentConfig.tagline}
              onChange={(e) =>
                setProject({
                  ...project,
                  agentConfig: {
                    ...project.agentConfig,
                    tagline: e.target.value,
                  },
                })
              }
              placeholder="e.g. here to help with billing, plans, and integrations"
              className="w-full bg-white border border-sand-200 rounded-xl px-4 py-3 text-[0.9375rem] text-sand-900 placeholder:text-sand-400 focus:border-sand-900 focus:ring-2 focus:ring-sand-900/10 focus:outline-none transition-all"
            />
            <p className="text-xs text-sand-500">
              A one-line description of what the agent helps with. Used in the
              system prompt to focus the agent.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-sand-800 tracking-tight">
              Personality
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PERSONALITIES.map((p) => {
                const active = project.agentConfig.personality === p.value;
                return (
                  <button
                    key={p.value}
                    onClick={() =>
                      setProject({
                        ...project,
                        agentConfig: {
                          ...project.agentConfig,
                          personality: p.value,
                        },
                      })
                    }
                    className={cn(
                      "text-left p-3.5 rounded-xl border transition-all cursor-pointer",
                      active
                        ? "border-sand-900 bg-sand-50 shadow-sand"
                        : "border-sand-200 bg-white hover:bg-sand-150 hover:border-sand-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-sand-900 tracking-tight">
                        {p.label}
                      </span>
                      {active && (
                        <Check className="w-3.5 h-3.5 text-sand-900" />
                      )}
                    </div>
                    <p className="text-xs text-sand-500 leading-snug mt-0.5">
                      {p.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <SaveButton
            onClick={() =>
              saveProject("agent", { agentConfig: project.agentConfig })
            }
            saving={saving === "agent"}
            saved={savedKey === "agent"}
            label="Save agent identity"
          />
        </div>
      </Card>

      {/* Categories manager */}
      <CategoriesCard projectId={project.id} />

      {/* OpenAI API key */}
      <Card>
        <div className="flex items-start gap-3">
          <SectionIcon icon={KeyRound} />
          <div className="flex-1">
            <CardTitle>OpenAI API key</CardTitle>
            <CardDescription>
              Clarix uses your own OpenAI key for chat (GPT-4o) and
              embeddings. It&apos;s stored server-side against this project
              and never sent back to the browser.
            </CardDescription>
          </div>
          {project.hasOpenAIApiKey ? (
            <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-status-success/10 text-status-success border border-status-success/20">
              <Check className="w-3 h-3" />
              Configured
            </span>
          ) : (
            <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-sand-100 text-sand-500 border border-sand-200">
              Not set
            </span>
          )}
        </div>

        <div className="mt-5 space-y-4">
          {project.hasOpenAIApiKey && !showKeyField ? (
            <div className="bg-sand-50 border border-sand-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="font-mono text-sm text-sand-500 flex-1 truncate">
                sk-••••••••••••••••••••••••
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowKeyField(true);
                  setApiKeyInput("");
                }}
              >
                Replace
              </Button>
              <Button
                variant="ghost"
                size="sm"
                loading={clearingKey}
                onClick={async () => {
                  if (
                    !confirm(
                      "Remove the OpenAI key for this project? Chat and ingestion will stop working until you add a new one."
                    )
                  )
                    return;
                  setClearingKey(true);
                  const res = await fetch("/api/project", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      projectId: project.id,
                      openAIApiKey: "",
                    }),
                  });
                  if (res.ok) {
                    const updated: PublicProject = await res.json();
                    setProject(updated);
                  }
                  setClearingKey(false);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </Button>
            </div>
          ) : (
            <>
              <Input
                label="Paste your OpenAI API key"
                placeholder="sk-..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                hint={
                  <span>
                    Get one from{" "}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold text-sand-800 hover:text-sand-900"
                    >
                      platform.openai.com/api-keys
                    </a>
                    . You&apos;ll need a paid OpenAI account with credit.
                  </span>
                }
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={async () => {
                    const trimmed = apiKeyInput.trim();
                    if (!trimmed) return;
                    setSaving("apiKey");
                    const res = await fetch("/api/project", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        projectId: project.id,
                        openAIApiKey: trimmed,
                      }),
                    });
                    if (res.ok) {
                      const updated: PublicProject = await res.json();
                      setProject(updated);
                      setApiKeyInput("");
                      setShowKeyField(false);
                      setSavedKey("apiKey");
                      setTimeout(() => setSavedKey(null), 1500);
                    }
                    setSaving(null);
                  }}
                  loading={saving === "apiKey"}
                  disabled={!apiKeyInput.trim()}
                >
                  <Save className="w-4 h-4" />
                  {savedKey === "apiKey" ? "Saved!" : "Save key"}
                </Button>
                {showKeyField && project.hasOpenAIApiKey && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowKeyField(false);
                      setApiKeyInput("");
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* OpenAI usage */}
      <UsageCard projectId={project.id} />

      {/* Danger */}
      <Card className="border-status-error/30">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-status-error/10 text-status-error flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-status-error">Danger zone</CardTitle>
            <CardDescription>
              Permanently delete this project and everything in it — sources,
              chunks, conversations, feedback. You&apos;ll be returned to the
              onboarding flow with a fresh project.
            </CardDescription>
          </div>
        </div>
        <div className="mt-5">
          <AnimatePresence mode="wait" initial={false}>
            {!confirmDelete ? (
              <motion.div
                key="trigger"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete project
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="flex items-center gap-3 flex-wrap"
              >
                <span className="text-sm font-semibold text-status-error">
                  Are you sure? This wipes all data.
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDeleteProject}
                    loading={deleting}
                  >
                    <Trash2 className="w-4 h-4" />
                    Yes, delete everything
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
      </div>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function SectionIcon({ icon: Icon }: { icon: typeof Bot }) {
  return (
    <div className="w-10 h-10 rounded-xl bg-sand-900 text-white flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4" />
    </div>
  );
}

function SaveButton({
  onClick,
  saving,
  saved,
  label = "Save changes",
}: {
  onClick: () => void;
  saving: boolean;
  saved: boolean;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button onClick={onClick} loading={saving}>
        <Save className="w-4 h-4" />
        {saved ? "Saved!" : label}
      </Button>
      <AnimatePresence>
        {saved && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-status-success font-semibold tracking-tight"
          >
            Updated
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Usage card ---------- */

interface UsageSnapshot {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  turns: number;
  since: string | null;
  estimatedCostUsd: number;
}

function UsageCard({ projectId }: { projectId: string }) {
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/usage?projectId=${encodeURIComponent(projectId)}`)
      .then((r) => r.json())
      .then((data: UsageSnapshot) => {
        if (!cancelled) {
          setUsage(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <Card>
      <div className="flex items-start gap-3">
        <SectionIcon icon={Gauge} />
        <div className="flex-1">
          <CardTitle>OpenAI usage</CardTitle>
          <CardDescription>
            Rolling spend on chat for this project. OpenAI doesn&apos;t expose
            remaining credit to the API, so you&apos;ll need to top up or check
            balance at{" "}
            <a
              href="https://platform.openai.com/account/usage"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-sand-800 hover:text-sand-900"
            >
              platform.openai.com/account/usage
            </a>
            .
          </CardDescription>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 h-24 bg-sand-100 rounded-2xl animate-pulse" />
      ) : !usage || usage.turns === 0 ? (
        <div className="mt-5 bg-sand-50 border border-sand-200 rounded-2xl px-4 py-6 text-center">
          <p className="text-sm text-sand-600">
            No chat turns tracked yet. Usage will appear after your first
            message in the Playground or widget.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <UsageStat
            label="Prompt tokens"
            value={usage.promptTokens.toLocaleString()}
          />
          <UsageStat
            label="Completion tokens"
            value={usage.completionTokens.toLocaleString()}
          />
          <UsageStat
            label="Turns"
            value={usage.turns.toLocaleString()}
          />
          <UsageStat
            label="Est. spend"
            value={`$${usage.estimatedCostUsd.toFixed(4)}`}
            highlight
          />
        </div>
      )}

      {usage && usage.since && (
        <p className="mt-4 text-[11px] text-sand-400 tracking-tight">
          Since {new Date(usage.since).toLocaleString()} · at published gpt-4o
          pricing ($2.50 / 1M prompt, $10 / 1M completion)
        </p>
      )}
    </Card>
  );
}

function UsageStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        highlight
          ? "bg-sand-900 border-sand-900 text-white"
          : "bg-sand-50 border-sand-200"
      )}
    >
      <div
        className={cn(
          "text-[10px] uppercase tracking-wide font-bold",
          highlight ? "text-white/70" : "text-sand-400"
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "text-xl font-bold tracking-tight mt-1",
          highlight ? "text-white" : "text-sand-900"
        )}
      >
        {value}
      </div>
    </div>
  );
}

/* ---------- Categories card ---------- */

function CategoriesCard({ projectId }: { projectId: string }) {
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const load = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: trimmed,
        description: newDescription.trim(),
        projectId,
      }),
    });
    setNewName("");
    setNewDescription("");
    setCreating(false);
    await load();
  };

  const startEdit = (cat: KnowledgeCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await fetch(`/api/categories/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        description: editDescription.trim(),
      }),
    });
    setEditingId(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Sources in it will become uncategorized.")) {
      return;
    }
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <Card>
      <div className="flex items-start gap-3">
        <SectionIcon icon={Sparkles} />
        <div className="flex-1">
          <CardTitle>Knowledge categories</CardTitle>
          <CardDescription>
            Categories group related sources by intent. Create custom ones for
            anything specific to your business.
          </CardDescription>
        </div>
        {!creating && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCreating(true)}
          >
            <FolderPlus className="w-4 h-4" />
            New category
          </Button>
        )}
      </div>

      {/* Create form */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-5 p-4 bg-sand-50 border border-sand-200 rounded-2xl space-y-3">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name"
                className="w-full bg-white border border-sand-200 rounded-xl px-4 py-2.5 text-sm text-sand-900 placeholder:text-sand-400 focus:border-sand-900 focus:ring-2 focus:ring-sand-900/10 focus:outline-none transition-all"
              />
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="One-line description"
                className="w-full bg-white border border-sand-200 rounded-xl px-4 py-2.5 text-sm text-sand-900 placeholder:text-sand-400 focus:border-sand-900 focus:ring-2 focus:ring-sand-900/10 focus:outline-none transition-all"
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCreating(false);
                    setNewName("");
                    setNewDescription("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="mt-5 divide-y divide-sand-200 border border-sand-200 rounded-2xl overflow-hidden">
        {loading
          ? [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 bg-sand-100 animate-pulse"
              />
            ))
          : categories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              const isEditing = editingId === cat.id;
              return (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-sand-150 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-sand-100 border border-sand-200 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-sand-700" />
                  </div>

                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        autoFocus
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 bg-white border border-sand-300 rounded-lg px-2.5 py-1.5 text-sm focus:border-sand-900 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="description"
                        className="flex-1 bg-white border border-sand-300 rounded-lg px-2.5 py-1.5 text-sm focus:border-sand-900 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-sand-900 tracking-tight truncate">
                          {cat.name}
                        </p>
                        {cat.system && (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-sand-400 bg-sand-100 border border-sand-200 px-1.5 py-0.5 rounded">
                            System
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-sand-500 truncate">
                        {cat.description || "No description"}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="w-8 h-8 rounded-lg text-status-success hover:bg-status-success/10 transition-colors flex items-center justify-center"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="w-8 h-8 rounded-lg text-sand-500 hover:bg-sand-200 transition-colors flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(cat)}
                          className="w-8 h-8 rounded-lg text-sand-500 hover:bg-sand-200 hover:text-sand-900 transition-colors flex items-center justify-center"
                          aria-label="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {!cat.system && (
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="w-8 h-8 rounded-lg text-sand-500 hover:bg-status-error/10 hover:text-status-error transition-colors flex items-center justify-center"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
      </div>
    </Card>
  );
}
