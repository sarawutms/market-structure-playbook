import { useEffect, useMemo, useRef, useState } from 'react';
import { CONCEPTS } from './data/concepts';
import { SCENARIOS } from './data/scenarios';
import type { Concept, Language } from './data/types';
import { ConceptList } from './components/ConceptList';
import { ChartPanel } from './components/ChartPanel';
import { ExplanationCard } from './components/ExplanationCard';
import { LanguageToggle } from './components/LanguageToggle';
import { UI } from './i18n/ui';

export default function App() {
  const [selectedId, setSelectedId] = useState('playbook-ob');
  const [lang, setLang] = useState<Language>('en');
  const [menuOpen, setMenuOpen] = useState(false);

  const concept = useMemo(
    () => CONCEPTS.find((c) => c.id === selectedId) ?? CONCEPTS[0],
    [selectedId],
  );
  const scenario = SCENARIOS[concept.scenarioId];
  const rightRef = useRef<HTMLDivElement>(null);

  // Close the mobile drawer with Escape and lock body scroll while open.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleSelect = (next: Concept) => {
    setSelectedId(next.id);
    setMenuOpen(false);
    // On mobile the index sits above the chart — bring the analysis into view.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => {
        rightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-terminal lg:h-dvh">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-edge bg-panel px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {/* Hamburger — opens the playbook index as a drawer on mobile */}
          <button
            type="button"
            aria-label={UI.openMenu[lang]}
            title={UI.openMenu[lang]}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-edge bg-panel-2 text-muted transition-colors hover:bg-panel hover:text-white active:scale-95 lg:hidden"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-gradient-to-br from-accent/30 to-accent/5">
            <svg
              className="h-4.5 w-4.5 text-accent"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 17 9 12l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-white">Market Structure Playbook</h1>
            <p className="truncate text-[11px] text-dim">{UI.appSubtitle[lang]}</p>
          </div>
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-edge bg-panel-2 px-2.5 py-1 font-mono text-[11px] text-muted md:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bull" />
            {UI.instrument[lang]}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded-full border border-edge bg-panel-2 px-2.5 py-1 font-mono text-[11px] text-muted">
              {concept.tag}
            </span>
            <span className="rounded-full border border-edge bg-panel-2 px-2.5 py-1 font-mono text-[11px] text-muted">
              {scenario.candles.length} {UI.candles[lang]}
            </span>
          </div>
          <LanguageToggle lang={lang} onChange={setLang} />
        </div>
      </header>

      {/* Mobile drawer — the playbook index slides in over the chart */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!menuOpen}
      >
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 w-80 max-w-[85vw] shadow-2xl transition-transform duration-300 ease-out ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <ConceptList selectedId={selectedId} onSelect={handleSelect} lang={lang} drawer />
          <button
            type="button"
            aria-label={UI.closeMenu[lang]}
            onClick={() => setMenuOpen(false)}
            className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-md text-dim transition-colors hover:bg-panel-2 hover:text-white lg:hidden"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main: Playbook Index (left) + Interactive chart (right) */}
      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="hidden lg:flex">
          <ConceptList selectedId={selectedId} onSelect={handleSelect} lang={lang} />
        </div>

        <div ref={rightRef} className="flex min-h-0 min-w-0 flex-1 scroll-mt-2 flex-col">
          <div className="flex min-h-0 flex-1 flex-col">
            <ChartPanel scenario={scenario} lang={lang} />
          </div>
          <ExplanationCard concept={concept} scenario={scenario} scenarioId={concept.scenarioId} lang={lang} />
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-edge bg-panel px-4 py-2 text-center text-[11px] text-dim">
        {UI.disclaimer[lang]}
      </footer>
    </div>
  );
}
