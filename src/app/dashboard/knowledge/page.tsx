"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  Search,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SourceCard } from "@/components/knowledge/source-card";
import { KBGuideButton } from "@/components/knowledge/kb-guide";
import { getCategoryIcon } from "@/lib/knowledge/category-icons";
import type { KnowledgeSource, KnowledgeCategory, PublicProject } from "@/lib/db/types";

interface CategoryWithStats extends KnowledgeCategory {
  stats: {
    sourceCount: number;
    readyCount: number;
    wordCount: number;
    chunkCount: number;
    lastUpdated: string | null;
  };
}

const ALL_CATEGORIES_ID = "__all__";
const UNCATEGORIZED_ID = "__uncategorized__";

export default function KnowledgePage() {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [selected, setSelected] = useState<string>(ALL_CATEGORIES_ID);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [project, setProject] = useState<PublicProject | null>(null);

  async function refresh() {
    const [sRes, cRes] = await Promise.all([
      fetch("/api/knowledge"),
      fetch("/api/categories"),
    ]);
    const [sData, cData] = await Promise.all([sRes.json(), cRes.json()]);
    setSources(sData);
    setCategories(cData);
  }

  useEffect(() => {
    fetch("/api/project")
      .then((r) => (r.ok ? r.json() : null))
      .then((p: PublicProject | null) => setProject(p))
      .catch(() => {});
    async function load() {
      await refresh();
      setLoading(false);
    }
    load();
  }, []);

  async function handleLoadDemo() {
    setSeedingDemo(true);
    setSeedError(null);
    try {
      const res = await fetch("/api/demo/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: "proj_demo" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSeedError(
          data?.code === "missing_openai_key"
            ? "Add your AI API key in Settings first, then try again."
            : data?.error || "Couldn't load demo content. Try again."
        );
        return;
      }
      await refresh();
    } catch {
      setSeedError("Couldn't load demo content. Try again.");
    } finally {
      setSeedingDemo(false);
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  const totalReady = sources.filter((s) => s.status === "ready").length;
  const coveredCategories = categories.filter(
    (c) => c.stats.sourceCount > 0
  ).length;
  const uncategorized = sources.filter((s) => !s.categoryId);

  const filteredSources = useMemo(() => {
    let list = sources;
    if (selected === UNCATEGORIZED_ID) {
      list = list.filter((s) => !s.categoryId);
    } else if (selected !== ALL_CATEGORIES_ID) {
      list = list.filter((s) => s.categoryId === selected);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    return list;
  }, [sources, selected, search]);

  const activeCategory =
    selected !== ALL_CATEGORIES_ID && selected !== UNCATEGORIZED_ID
      ? categories.find((c) => c.id === selected)
      : null;

  const addHref = activeCategory
    ? `/dashboard/knowledge/new?categoryId=${activeCategory.id}`
    : "/dashboard/knowledge/new";

  const locked = project?.demoLocked ?? false;

  return (
    <div>
      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 sm:flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-sand-900 tracking-tighter">
              Knowledge
            </h1>
            <p className="text-sm sm:text-base text-sand-600 mt-2 max-w-xl">
              Organize what your agent knows. Structured categories lead to
              sharper, more reliable answers.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <KBGuideButton />
            {!locked && (
              <Link href={addHref}>
                <Button size="lg">
                  <Plus className="w-4 h-4" />
                  Add source
                </Button>
              </Link>
            )}
          </div>
        </div>
        {seedError && (
          <div className="mt-4 text-sm bg-status-warning/10 border border-status-warning/30 text-status-warning rounded-xl px-4 py-3">
            {seedError}
          </div>
        )}

        {/* Stat strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
          <StatTile
            icon={<Layers className="w-4 h-4" />}
            label="Sources"
            value={sources.length.toString()}
            sub={`${totalReady} ready`}
          />
          <StatTile
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Categories covered"
            value={`${coveredCategories} / ${categories.length}`}
            sub={
              coveredCategories === categories.length
                ? "Fully covered"
                : `${categories.length - coveredCategories} empty`
            }
          />
          <StatTile
            icon={<Sparkles className="w-4 h-4" />}
            label="Answers ready"
            value={sources
              .reduce((sum, s) => sum + s.metadata.chunkCount, 0)
              .toLocaleString()}
            sub="Indexed for retrieval"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr] gap-6 md:gap-8">
        {/* Category sidebar, on mobile it scrolls horizontally so the source
            list stays the focal point; on tablet+ it's a sticky left rail. */}
        <aside className="md:space-y-1 -mx-4 sm:mx-0">
          <p className="hidden md:block text-xs font-semibold text-sand-500 uppercase tracking-wide px-3 mb-2">
            Categories
          </p>
          <div className="md:hidden flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <MobileCategoryPill
              name="All"
              count={sources.length}
              active={selected === ALL_CATEGORIES_ID}
              onClick={() => setSelected(ALL_CATEGORIES_ID)}
              iconName="BookOpen"
            />
            {categories.map((cat) => (
              <MobileCategoryPill
                key={cat.id}
                name={cat.name}
                count={cat.stats.sourceCount}
                active={selected === cat.id}
                onClick={() => setSelected(cat.id)}
                iconName={cat.icon}
              />
            ))}
            {uncategorized.length > 0 && (
              <MobileCategoryPill
                name="Uncategorized"
                count={uncategorized.length}
                active={selected === UNCATEGORIZED_ID}
                onClick={() => setSelected(UNCATEGORIZED_ID)}
                iconName="Folder"
                warn
              />
            )}
          </div>
          <div className="hidden md:block space-y-1">

          <CategoryItem
            id={ALL_CATEGORIES_ID}
            name="All sources"
            description="Everything in the knowledge base"
            count={sources.length}
            active={selected === ALL_CATEGORIES_ID}
            onClick={() => setSelected(ALL_CATEGORIES_ID)}
            iconName="BookOpen"
          />

          {categories.map((cat) => (
            <CategoryItem
              key={cat.id}
              id={cat.id}
              name={cat.name}
              description={cat.description}
              count={cat.stats.sourceCount}
              active={selected === cat.id}
              onClick={() => setSelected(cat.id)}
              iconName={cat.icon}
            />
          ))}

          {uncategorized.length > 0 && (
            <CategoryItem
              id={UNCATEGORIZED_ID}
              name="Uncategorized"
              description="Sources without a category"
              count={uncategorized.length}
              active={selected === UNCATEGORIZED_ID}
              onClick={() => setSelected(UNCATEGORIZED_ID)}
              iconName="Folder"
              warn
            />
          )}
          </div>
        </aside>

        {/* Main column */}
        <section>
          {/* Category header */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="mb-5"
            >
              {activeCategory ? (
                <CategoryHeader
                  category={activeCategory}
                  addHref={addHref}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-sand-900 tracking-tight">
                      {selected === UNCATEGORIZED_ID
                        ? "Uncategorized"
                        : "All sources"}
                    </h2>
                    <p className="text-sm text-sand-500 mt-1">
                      {filteredSources.length} source
                      {filteredSources.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Search */}
          {sources.length > 0 && (
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sources..."
                className="w-full max-w-md bg-white border border-sand-200 rounded-xl pl-11 pr-4 py-3 text-[0.9375rem] text-sand-800 placeholder:text-sand-400 focus:outline-none focus:border-sand-900 focus:ring-2 focus:ring-sand-900/10 transition-all"
              />
            </div>
          )}

          {/* Content, scrollable area so a long source list never
              extends the entire dashboard page height. */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-sand-100 border border-sand-200 rounded-2xl p-5 animate-pulse h-40"
                />
              ))}
            </div>
          ) : filteredSources.length > 0 ? (
            <div className="relative">
              <div className="md:max-h-[calc(100vh-22rem)] md:min-h-[420px] md:overflow-y-auto md:pr-2 md:-mr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                  {filteredSources.map((source, i) => (
                    <SourceCard
                      key={source.id}
                      source={source}
                      onDelete={handleDelete}
                      index={i}
                    />
                  ))}
                  <Link href={addHref}>
                    <motion.div
                      className="border-2 border-dashed border-sand-300 rounded-2xl p-5 h-full min-h-[172px] flex flex-col items-center justify-center hover:border-sand-900/40 hover:bg-white transition-all group"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="w-11 h-11 rounded-xl bg-sand-100 border border-sand-200 flex items-center justify-center mb-3 group-hover:bg-sand-900 group-hover:border-sand-900 transition-colors">
                        <Plus className="w-5 h-5 text-sand-500 group-hover:text-white transition-colors" />
                      </div>
                      <p className="text-sm font-semibold text-sand-700 group-hover:text-sand-900">
                        Add source
                      </p>
                      {activeCategory && (
                        <p className="text-xs text-sand-500 mt-1">
                          to {activeCategory.name}
                        </p>
                      )}
                    </motion.div>
                  </Link>
                </div>
              </div>
              {/* Bottom fade indicates more content below */}
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-sand-50 to-transparent" />
            </div>
          ) : (
            <EmptyCategory
              category={activeCategory}
              addHref={addHref}
              showDemoLoader={sources.length === 0}
              onLoadDemo={handleLoadDemo}
              seedingDemo={seedingDemo}
            />
          )}
        </section>
      </div>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function StatTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-white border border-sand-200 rounded-2xl p-5 shadow-sand">
      <div className="flex items-center gap-2 text-sand-500 text-xs font-semibold uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="mt-3 text-3xl font-bold text-sand-900 tracking-tighter">
        {value}
      </div>
      <div className="text-sm text-sand-500 mt-0.5">{sub}</div>
    </div>
  );
}

function MobileCategoryPill({
  name,
  count,
  active,
  onClick,
  iconName,
  warn,
}: {
  name: string;
  count: number;
  active: boolean;
  onClick: () => void;
  iconName: string;
  warn?: boolean;
}) {
  const Icon = getCategoryIcon(iconName);
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl border whitespace-nowrap text-sm font-semibold tracking-tight transition-colors ${
        active
          ? "bg-sand-900 text-white border-sand-900"
          : warn
          ? "bg-white text-sand-700 border-status-warning/30"
          : "bg-white text-sand-700 border-sand-200 hover:border-sand-400"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {name}
      <span
        className={`text-[10px] font-mono rounded px-1.5 py-0.5 ${
          active ? "bg-white/20" : "bg-sand-100 text-sand-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function CategoryItem({
  name,
  description,
  count,
  active,
  onClick,
  iconName,
  warn,
}: {
  id: string;
  name: string;
  description?: string;
  count: number;
  active: boolean;
  onClick: () => void;
  iconName: string;
  warn?: boolean;
}) {
  const Icon = getCategoryIcon(iconName);
  return (
    <button
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
        active
          ? "bg-sand-900 text-white"
          : "text-sand-700 hover:bg-sand-100"
      }`}
    >
      {active && (
        <motion.div
          layoutId="kb-category-active"
          className="absolute inset-0 bg-sand-900 rounded-xl -z-10"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          active
            ? "bg-white/10"
            : warn
            ? "bg-status-warning/10 text-status-warning"
            : "bg-sand-100"
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={`text-[0.9375rem] font-semibold tracking-tight truncate ${
            active ? "text-white" : "text-sand-900"
          }`}
        >
          {name}
        </div>
        {description && (
          <div
            className={`text-xs truncate ${
              active ? "text-white/60" : "text-sand-500"
            }`}
          >
            {description}
          </div>
        )}
      </div>
      <span
        className={`text-xs font-semibold shrink-0 ${
          active ? "text-white/80" : "text-sand-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function CategoryHeader({
  category,
  addHref,
}: {
  category: CategoryWithStats;
  addHref: string;
}) {
  const Icon = getCategoryIcon(category.icon);
  const { sourceCount, readyCount, wordCount, chunkCount } = category.stats;

  return (
    <div className="bg-white border border-sand-200 rounded-2xl p-5 sm:p-6 shadow-sand">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-sand-900 text-white flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-sand-900 tracking-tight">
                {category.name}
              </h2>
              {category.system && (
                <Badge variant="outline">System</Badge>
              )}
            </div>
            <p className="text-sand-600 mt-1 text-sm sm:text-base">
              {category.description}
            </p>
          </div>
        </div>
        <Link href={addHref} className="shrink-0">
          <Button variant="secondary" size="sm" className="w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            <span className="truncate">Add to {category.name}</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-5 pt-5 border-t border-sand-200">
        <StatMini label="Sources" value={sourceCount.toString()} />
        <StatMini label="Ready" value={`${readyCount} / ${sourceCount}`} />
        <StatMini
          label="Words"
          value={wordCount.toLocaleString()}
        />
        <StatMini
          label="Chunks"
          value={chunkCount.toLocaleString()}
        />
      </div>
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-sand-500 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-lg font-bold text-sand-900 tracking-tight mt-0.5">
        {value}
      </div>
    </div>
  );
}

function EmptyCategory({
  category,
  addHref,
  showDemoLoader,
  onLoadDemo,
  seedingDemo,
}: {
  category: CategoryWithStats | null | undefined;
  addHref: string;
  showDemoLoader?: boolean;
  onLoadDemo?: () => void;
  seedingDemo?: boolean;
}) {
  const Icon = category ? getCategoryIcon(category.icon) : AlertCircle;
  return (
    <motion.div
      className="bg-white border border-dashed border-sand-300 rounded-2xl px-8 py-14 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-14 h-14 rounded-2xl bg-sand-100 border border-sand-200 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-sand-500" />
      </div>
      <h3 className="text-xl font-bold text-sand-900 tracking-tight mb-2">
        {category ? `No ${category.name.toLowerCase()} yet` : "No sources yet"}
      </h3>
      <p className="text-sand-600 max-w-md mx-auto mb-6">
        {category
          ? category.description
          : "Add your first source to teach your agent. Upload a file, paste a URL, or write content directly."}
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Link href={addHref}>
          <Button>
            <Plus className="w-4 h-4" />
            {category ? `Add to ${category.name}` : "Add source"}
          </Button>
        </Link>
        {showDemoLoader && onLoadDemo && (
          <Button
            variant="secondary"
            onClick={onLoadDemo}
            disabled={seedingDemo}
          >
            <Wand2 className="w-4 h-4" />
            {seedingDemo ? "Loading demo…" : "Load Acme Cloud demo"}
          </Button>
        )}
      </div>
      {showDemoLoader && (
        <p className="text-xs text-sand-500 mt-4 max-w-sm mx-auto">
          Pre-loads 8 docs from a fictional B2B SaaS so you can try chat,
          citations, and analytics in 30 seconds.
        </p>
      )}
    </motion.div>
  );
}
