import { useMemo, useState } from 'react';
import { CATEGORIES } from '../data/concepts';
import type { Concept, Language } from '../data/types';
import {
  UI,
  categoryName,
  conceptDescription,
  conceptName,
  groupName,
} from '../i18n/ui';

interface ConceptListProps {
  selectedId: string;
  onSelect: (concept: Concept) => void;
  lang: Language;
}

/**
 * Left panel — the Ultimate Master Index. A searchable accordion of the
 * concept categories (Trading Playbook, Basic Structure, SMC & ICT, Wyckoff,
 * Advanced PA, Wave & Ratio, Volume & Order Flow, Systematic). Category
 * names, concept names and descriptions switch between Thai and English;
 * technical abbreviations (BOS, OB, FVG…) stay unchanged.
 */
export function ConceptList({ selectedId, onSelect, lang }: ConceptListProps) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

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
    <aside className="flex max-h-[40vh] flex-col overflow-hidden border-b border-edge bg-panel lg:max-h-none lg:w-80 lg:border-r lg:border-b-0 xl:w-96">
      {/* Header + search */}
      <div className="border-b border-edge p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            {UI.playbookIndex[lang]}
          </h2>
          <span className="rounded-full bg-panel-2 px-2 py-0.5 font-mono text-[11px] text-dim">
            {CATEGORIES.reduce((n, c) => n + c.concepts.length, 0)} {UI.concepts[lang]}
          </span>
        </div>
        <div className="relative">
          <svg
            className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-dim"
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
            className="w-full rounded-lg border border-edge bg-panel-2 py-2 pr-3 pl-9 text-sm text-[#d6dae4] placeholder:text-dim focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Scrollable category accordion */}
      <nav className="flex-1 overflow-y-auto overscroll-contain p-2">
        {filtered.map((cat) => {
          const isCollapsed = !searching && collapsed.has(cat.name);
          const multiGroup = cat.groups.length > 1;

          return (
            <section key={cat.name} className="mb-1">
              <button
                type="button"
                onClick={() => toggle(cat.name)}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-dim transition-colors hover:text-muted"
              >
                <span>{categoryName(cat.name, lang)}</span>
                <span className="flex items-center gap-1.5">
                  <span className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] text-dim">
                    {cat.concepts.length}
                  </span>
                  <svg
                    className={`h-3 w-3 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>

              {!isCollapsed && (
                <div className="mb-1">
                  {cat.groups.map((group) => {
                    const items = cat.concepts.filter((c) => c.group === group);
                    if (items.length === 0) return null;
                    return (
                      <div key={group}>
                        {multiGroup && (
                          <p className="px-2.5 pt-1.5 pb-0.5 text-[10px] font-medium tracking-wide text-dim/70">
                            {groupName(group, lang)}
                          </p>
                        )}
                        <ul className="space-y-0.5">
                          {items.map((concept) => {
                            const active = concept.id === selectedId;
                            return (
                              <li key={concept.id}>
                                <button
                                  type="button"
                                  onClick={() => onSelect(concept)}
                                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                                    active
                                      ? 'border-accent/60 bg-accent/10'
                                      : 'border-transparent hover:border-edge hover:bg-panel-2'
                                  }`}
                                >
                                  <span
                                    className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide ${
                                      active ? 'bg-accent text-white' : 'bg-panel-2 text-muted'
                                    }`}
                                  >
                                    {concept.tag}
                                  </span>
                                  <span className="min-w-0">
                                    <span
                                      className={`block truncate text-[13px] font-medium ${
                                        active ? 'text-white' : 'text-[#d6dae4]'
                                      }`}
                                    >
                                      {conceptName(concept, lang)}
                                    </span>
                                    <span className="block truncate text-[11px] text-dim">
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
              )}
            </section>
          );
        })}

        {filtered.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-dim">
            {UI.noMatches[lang].replace('{q}', query)}
          </p>
        )}
      </nav>
    </aside>
  );
}
