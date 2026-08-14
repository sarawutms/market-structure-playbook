import type { ReactNode } from 'react';
import type { Concept, ConceptScenario, Language, Localizable, TradeDirection } from '../data/types';
import { TH_SCENARIOS } from '../i18n/scenarios';
import { UI, pickLang, stepMark } from '../i18n/ui';
import { PatternDiagramSection } from './PatternDiagram';

interface ExplanationCardProps {
  concept: Concept;
  scenario: ConceptScenario;
  /** Scenario key (used to look up the Thai fallback dictionary). */
  scenarioId: string;
  lang: Language;
}

/* ---------------------------------------------------------------------------
 * Localization helpers — prefer nested { en, th } text, then the Thai
 * dictionary for the remaining scenarios, then the English string.
 * ------------------------------------------------------------------------- */

function scenarioTitle(scenario: ConceptScenario, scenarioId: string, lang: Language): string {
  if (typeof scenario.title === 'object') return pickLang(scenario.title, lang);
  if (lang === 'th' && TH_SCENARIOS[scenarioId]) return TH_SCENARIOS[scenarioId].title;
  return scenario.title;
}

function scenarioSummary(scenario: ConceptScenario, scenarioId: string, lang: Language): string {
  if (typeof scenario.summary === 'object') return pickLang(scenario.summary, lang);
  if (lang === 'th' && TH_SCENARIOS[scenarioId]) return TH_SCENARIOS[scenarioId].summary;
  return scenario.summary;
}

function scenarioKeyPoints(scenario: ConceptScenario, scenarioId: string, lang: Language): string[] {
  const th = lang === 'th' ? TH_SCENARIOS[scenarioId] : undefined;
  return scenario.keyPoints.map((point, i) => {
    if (typeof point === 'object') return pickLang(point, lang);
    if (th?.keyPoints[i]) return th.keyPoints[i];
    return point;
  });
}

function legendLabel(label: Localizable, scenarioId: string, lang: Language): string {
  if (typeof label === 'object') return pickLang(label, lang);
  if (lang === 'th') {
    const th = TH_SCENARIOS[scenarioId]?.legend?.[label];
    if (th) return th;
  }
  return label;
}

/* ---------------------------------------------------------------------------
 * Trade plan rendering
 * ------------------------------------------------------------------------- */

const TRADE_LEGS = ['entry', 'sl', 'tp'] as const;
type TradeLegKey = (typeof TRADE_LEGS)[number];

const TRADE_LEG_META: Record<TradeLegKey, { ui: 'entry' | 'stopLoss' | 'takeProfit'; hint: 'entryHint' | 'slHint' | 'tpHint'; color: string }> = {
  entry: { ui: 'entry', hint: 'entryHint', color: '#0ecb81' },
  sl: { ui: 'stopLoss', hint: 'slHint', color: '#f6465d' },
  tp: { ui: 'takeProfit', hint: 'tpHint', color: '#4f8cff' },
};

function TradeLegCard({
  legKey,
  price,
  conditions,
  lang,
}: {
  legKey: TradeLegKey;
  price: number;
  conditions: Localizable;
  lang: Language;
}) {
  const meta = TRADE_LEG_META[legKey];
  return (
    <div className="relative overflow-hidden rounded-xl border border-edge bg-panel-2/60 p-3 shadow-lg backdrop-blur-md transition-all hover:bg-panel-2 hover:shadow-xl hover:-translate-y-0.5" style={{ borderTop: `3px solid ${meta.color}` }}>
      <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${meta.color} 0%, transparent 70%)` }} />
      <div className="flex items-center justify-between gap-2 relative z-10">
        <span className="flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase" style={{ color: meta.color }}>
          <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
          {UI[meta.ui][lang]}
        </span>
        <span className="font-mono text-sm font-bold text-main">${price.toFixed(1)}</span>
      </div>
      <p className="mt-0.5 text-[11px] tracking-wide text-muted uppercase">{UI[meta.hint][lang]}</p>
      <p className="mt-2 text-[13px] leading-[1.7] break-words text-sub">{pickLang(conditions, lang)}</p>
    </div>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h4 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted uppercase">
      <span className="h-3 w-1 rounded-full bg-accent" />
      {children}
    </h4>
  );
}

function DirectionBadge({ direction, lang }: { direction: TradeDirection; lang: Language }) {
  const long = direction === 'long';
  const label = long ? UI.long[lang] : UI.short[lang];
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider ${
        long ? 'border-bull/40 bg-bull/10 text-bull' : 'border-bear/40 bg-bear/10 text-bear'
      }`}
    >
      {long ? '▲ ' : '▼ '}
      {label}
    </span>
  );
}

/**
 * Explanation card rendered under the chart: the concept explanation, the
 * color legend for the overlays, and — when the scenario is a trade setup —
 * an actionable "Action Plan" with Entry / Stop Loss / Take Profit.
 * All text switches between Thai and English based on the UI language.
 */
export function ExplanationCard({ concept, scenario, scenarioId, lang }: ExplanationCardProps) {
  const trade = scenario.trade;

  return (
    <section className="shrink-0 relative z-10 h-full w-full overflow-y-auto p-4 lg:p-6 pb-12">
      {/* Concept Explanation */}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 rounded-md bg-accent px-2 py-1 font-mono text-xs font-bold text-main">
          {concept.tag}
        </span>
        <div className="min-w-0">
          <SectionHeading>{UI.conceptExplanation[lang]}</SectionHeading>
          <h3 className="mt-0.5 text-base font-semibold text-main">
            {scenarioTitle(scenario, scenarioId, lang)}
          </h3>
          <p className="mt-1 text-[15px] leading-[1.7] break-words text-sub">
            {scenarioSummary(scenario, scenarioId, lang)}
          </p>
        </div>
      </div>

      {/* Chart Breakdown — the numbered ① ② ③ sequence, step by step */}
      {trade && trade.steps.length > 0 && (
        <div className="mt-4 border-t border-edge pt-4">
          <SectionHeading>{UI.chartBreakdown[lang]}</SectionHeading>
          <ol className="mt-3">
            {trade.steps.map((step, i) => (
              <li key={step.n} className="relative flex gap-3 pb-4 last:pb-0">
                {i < trade.steps.length - 1 && (
                  <span className="absolute top-6 bottom-1 left-[11px] w-px bg-edge" />
                )}
                <span className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-accent/30 bg-panel-2 font-mono text-[13px] font-bold text-accent">
                  {stepMark(step.n)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-main">{pickLang(step.title, lang)}</p>
                  <p className="mt-0.5 text-[13px] leading-[1.7] break-words text-sub">
                    {pickLang(step.description, lang)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Pattern reference diagram — drawn locally per technique */}
      <PatternDiagramSection scenarioId={scenarioId} lang={lang} />

      {/* Action Plan — only for playbook setups */}
      {trade && (
        <div className="mt-4 border-t border-edge pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionHeading>{UI.howToTrade[lang]}</SectionHeading>
            <div className="flex items-center gap-2">
              <DirectionBadge direction={trade.direction} lang={lang} />
              <span className="rounded-full border border-edge bg-panel-2 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-muted">
                R:R {trade.riskReward}
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm leading-[1.7] break-words text-sub">
            {pickLang(trade.logic, lang)}
          </p>
          <div className="mt-3 flex flex-col gap-3">
            <TradeLegCard legKey="entry" price={trade.entry.price} conditions={trade.entry.conditions} lang={lang} />
            <TradeLegCard legKey="sl" price={trade.sl.price} conditions={trade.sl.conditions} lang={lang} />
            <TradeLegCard legKey="tp" price={trade.tp.price} conditions={trade.tp.conditions} lang={lang} />
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-6">
        <ul className="space-y-2">
          {scenarioKeyPoints(scenario, scenarioId, lang).map((point) => (
            <li key={point} className="flex gap-2.5 text-sm leading-[1.7]">
              <svg
                className="mt-1 h-4 w-4 shrink-0 text-accent"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="min-w-0 break-words text-sub">{point}</span>
            </li>
          ))}
        </ul>

        {scenario.legend && scenario.legend.length > 0 && (
          <div className="w-full border-t border-edge pt-4">
            <SectionHeading>{UI.chartLegend[lang]}</SectionHeading>
            <ul className="space-y-1.5">
              {scenario.legend.map((entry) => (
                <li key={legendLabel(entry.label, scenarioId, lang)} className="flex items-center gap-2 text-[13px] text-muted">
                  <span
                    className="inline-block h-[3px] w-5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: entry.color,
                      opacity: entry.dashed ? 0.7 : 1,
                    }}
                  />
                  <span className="min-w-0 break-words">{legendLabel(entry.label, scenarioId, lang)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
