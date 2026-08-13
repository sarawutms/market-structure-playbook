import { useMemo, useRef, useState } from 'react';
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

  const concept = useMemo(
    () => CONCEPTS.find((c) => c.id === selectedId) ?? CONCEPTS[0],
    [selectedId],
  );
  const scenario = SCENARIOS[concept.scenarioId];
  const rightRef = useRef<HTMLDivElement>(null);

  const handleSelect = (next: Concept) => {
    setSelectedId(next.id);
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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15">
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
            <h1 className="truncate text-sm font-semibold text-white">Ultimate Trading Playbook</h1>
            <p className="truncate text-[11px] text-dim">{UI.appSubtitle[lang]}</p>
          </div>
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

      {/* Main: Playbook Index (left) + Interactive chart (right) */}
      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <ConceptList selectedId={selectedId} onSelect={handleSelect} lang={lang} />

        <div ref={rightRef} className="flex min-h-0 min-w-0 flex-1 scroll-mt-2 flex-col">
          <div className="flex min-h-0 flex-1 flex-col">
            <ChartPanel scenario={scenario} lang={lang} />
          </div>
          <ExplanationCard concept={concept} scenario={scenario} scenarioId={concept.scenarioId} lang={lang} />
        </div>
      </main>
    </div>
  );
}
