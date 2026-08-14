import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES } from '../data/concepts';
import type { Concept, Language } from '../data/types';
import {
  UI,
  categoryName,
  conceptDescription,
  conceptName,
  groupName,
} from '../i18n/ui';

/** localStorage key for the collapsed-category set (persists across reloads). */
const COLLAPSED_STORAGE_KEY = 'playbook.collapsed';

function loadSavedCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSED_STORAGE_KEY);
    if (!raw) return new Set();
    const arr: unknown = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set(); // localStorage unavailable (private mode, etc.)
  }
}

interface ConceptListProps {
  selectedId: string;
  onSelect: (concept: Concept) => void;
  lang: Language;
  /** Mobile drawer mode — fills the viewport height instead of a capped strip. */
  drawer?: boolean;
}

function CategoryIcon({ category, className }: { category: string; className?: string }) {
  switch (category) {
    case 'Trading Playbook':
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case 'Basic Structure':
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
    case 'Chart Patterns':
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>;
    case 'Candlestick Patterns':
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 4v16"/><path d="M15 4v16"/><rect x="7" y="8" width="4" height="8"/><rect x="13" y="10" width="4" height="6"/></svg>;
    case 'SMC & ICT':
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4 12H2"/><path d="M22 12h-2"/></svg>;
    case 'Wyckoff Logic':
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
    case 'Advanced PA':
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case 'Wave & Harmonics':
    case 'Harmonic Patterns':
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m2 12 5-7 5 7 5-7 5 7"/></svg>;
    case 'Volume & Systematic':
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    default:
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>;
  }
}

/**
 * Left panel — the Ultimate Master Index. A searchable accordion of the
 * concept categories. Category names, concept names and descriptions 
 * switch between Thai and English.
 */
export function ConceptList({ selectedId, onSelect, lang, drawer = false }: ConceptListProps) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(loadSavedCollapsed);

  // Persist which categories the user collapsed so it survives page reloads.
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify([...collapsed]));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.map((cat) => ({
      ...cat,
      concepts: cat.concepts.filter(
        (c) =>
          c.tag.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          conceptName(c, 'th').toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          conceptDescription(c, 'th').toLowerCase().includes(q),
      ),
    })).filter((cat) => cat.concepts.length > 0);
  }, [query]);

  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // While searching, keep categories expanded so matches are visible.
  const searching = query.trim().length > 0;

  return (
    <aside
      className={`flex flex-col h-full overflow-hidden border-b border-edge glass-panel relative z-10 ${
        drawer
          ? 'w-full border-b-0'
          : 'max-h-[40vh] lg:max-h-none border-r border-edge'
      }`}
    >
      {/* Header + search */}
      <div className="border-b border-edge p-4 bg-panel-2/30 backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted flex items-center gap-2">
            <svg className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            {UI.playbookIndex[lang]}
          </h2>
          <span className="rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 font-mono text-[11px] font-medium text-accent shadow-sm">
            {CATEGORIES.reduce((n, c) => n + c.concepts.length, 0)} {UI.concepts[lang]}
          </span>
        </div>
        <div className="relative group">
          <svg
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-dim transition-colors group-focus-within:text-accent"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={UI.searchPlaceholder[lang]}
            className="w-full rounded-xl border border-edge bg-panel-2 py-2.5 pr-9 pl-9 text-[13px] font-medium text-main placeholder:text-dim/70 shadow-sm transition-all focus:border-accent focus:bg-panel focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute top-1/2 right-2.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-dim transition-all hover:bg-panel hover:text-main hover:scale-110"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable category accordion */}
      <nav className="flex-1 overflow-y-auto overscroll-contain p-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-edge [&::-webkit-scrollbar-track]:bg-transparent">
        {filtered.map((cat) => {
          const isCollapsed = !searching && collapsed.has(cat.name);
          const multiGroup = cat.groups.length > 1;

          return (
            <section key={cat.name} className="mb-2">
              <button
                type="button"
                onClick={() => toggle(cat.name)}
                className={`group flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-all duration-200 ${
                  isCollapsed 
                    ? 'hover:bg-panel-2 border border-transparent hover:border-edge/50' 
                    : 'bg-panel-2/80 border border-edge/80 shadow-sm'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                    isCollapsed ? 'bg-panel-2 text-dim group-hover:text-muted group-hover:bg-panel' : 'bg-accent/10 text-accent'
                  }`}>
                    <CategoryIcon category={cat.name} className="h-3.5 w-3.5" />
                  </div>
                  <span className={`text-[12px] font-bold uppercase tracking-wider ${
                    isCollapsed ? 'text-dim group-hover:text-muted' : 'text-main'
                  }`}>
                    {categoryName(cat.name, lang)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium transition-colors ${
                    isCollapsed ? 'bg-panel-2 text-dim' : 'bg-panel border border-edge text-muted'
                  }`}>
                    {cat.concepts.length}
                  </span>
                  <svg
                    className={`h-4 w-4 transition-transform duration-300 ${
                      isCollapsed ? 'text-dim group-hover:text-muted' : 'text-accent rotate-180'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100 mt-1'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-1 pb-1 pt-1">
                    {cat.groups.map((group) => {
                      const items = cat.concepts.filter((c) => c.group === group);
                      if (items.length === 0) return null;
                      return (
                        <div key={group} className="mb-2 last:mb-0">
                          {multiGroup && (
                            <div className="flex items-center gap-2 px-2 pt-2 pb-1.5">
                              <div className="h-px flex-1 bg-edge/30" />
                              <p className="text-[10px] font-bold uppercase tracking-widest text-dim/80">
                                {groupName(group, lang)}
                              </p>
                              <div className="h-px flex-1 bg-edge/30" />
                            </div>
                          )}
                          <ul className="space-y-1">
                            {items.map((concept) => {
                              const active = concept.id === selectedId;
                              return (
                                <li key={concept.id}>
                                  <button
                                    type="button"
                                    onClick={() => onSelect(concept)}
                                    className={`group relative flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-200 ${
                                      active
                                        ? 'border-accent/40 bg-accent/5 shadow-[0_2px_10px_rgba(var(--accent-rgb),0.1)]'
                                        : 'border-transparent hover:border-edge/60 hover:bg-panel-2/60 hover:shadow-sm hover:-translate-y-[1px]'
                                    }`}
                                  >
                                    {/* Active indicator line */}
                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 rounded-r-full bg-accent transition-all duration-300 ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />

                                    <span
                                      className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide transition-colors ${
                                        active 
                                          ? 'bg-accent text-black shadow-sm' 
                                          : 'bg-panel-2 text-muted border border-edge/50 group-hover:border-edge group-hover:text-main'
                                      }`}
                                    >
                                      {concept.tag}
                                    </span>
                                    <span className="min-w-0">
                                      <span
                                        className={`flex items-center gap-1.5 truncate text-[13px] font-semibold transition-colors ${
                                          active ? 'text-accent' : 'text-sub group-hover:text-main'
                                        }`}
                                      >
                                        {concept.category === 'Trading Playbook' && (
                                          <svg
                                            className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-accent' : 'text-amber-400'}`}
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            aria-label={UI.featured[lang]}
                                          >
                                            <path d="m12 2 2.9 6.26L21.5 9.27l-4.75 4.53 1.12 6.7L12 17.27l-5.87 3.23 1.12-6.7L2.5 9.27l6.6-1.01L12 2z" />
                                          </svg>
                                        )}
                                        <span className="truncate">{conceptName(concept, lang)}</span>
                                      </span>
                                      <span className={`block truncate text-[11px] transition-colors ${
                                        active ? 'text-main/80' : 'text-dim group-hover:text-muted'
                                      }`}>
                                        {conceptDescription(concept, lang)}
                                      </span>
                                    </span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-panel-2 border border-edge">
              <svg className="h-5 w-5 text-dim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[13px] font-medium text-main mb-1">No results found</p>
            <p className="text-[11px] text-dim px-4">
              {UI.noMatches[lang].replace('{q}', query)}
            </p>
          </div>
        )}
      </nav>
    </aside>
  );
}
