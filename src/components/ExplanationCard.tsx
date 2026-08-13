import type { Concept, ConceptScenario, Language, Localizable, TradeDirection } from '../data/types';
import { TH_SCENARIOS } from '../i18n/scenarios';
import { UI, pickLang, stepMark } from '../i18n/ui';

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
    <div className="rounded-lg border border-edge bg-panel-2 p-3" style={{ borderTop: `2px solid ${meta.color}` }}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase" style={{ color: meta.color }}>
          <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
          {UI[meta.ui][lang]}
        </span>
        <span className="font-mono text-[13px] font-bold text-white">${price.toFixed(1)}</span>
      </div>
      <p className="mt-0.5 text-[10px] tracking-wide text-dim uppercase">{UI[meta.hint][lang]}</p>
      <p className="mt-2 text-[12px] leading-relaxed break-words text-muted">{pickLang(conditions, lang)}</p>
    </div>
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
    <section className="border-t border-edge bg-panel p-4 overscroll-contain lg:max-h-[42vh] lg:overflow-y-auto lg:p-5">
      {/* Concept Explanation */}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 rounded-md bg-accent px-2 py-1 font-mono text-xs font-bold text-white">
          {concept.tag}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-dim">
            {UI.conceptExplanation[lang]}
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-white">
            {scenarioTitle(scenario, scenarioId, lang)}
          </h3>
          <p className="mt-1 text-sm leading-relaxed break-words text-muted">
            {scenarioSummary(scenario, scenarioId, lang)}
          </p>
        </div>
      </div>

      {/* Chart Breakdown — the numbered ① ② ③ sequence, step by step */}
      {trade && trade.steps.length > 0 && (
        <div className="mt-4 border-t border-edge pt-4">
          <h4 className="text-[11px] font-semibold tracking-wider text-dim uppercase">
            {UI.chartBreakdown[lang]}
          </h4>
          <ol className="mt-3 space-y-3">
            {trade.steps.map((step) => (
              <li key={step.n} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-accent/30 bg-accent/10 font-mono text-[13px] font-bold text-accent">
                  {stepMark(step.n)}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-white">{pickLang(step.title, lang)}</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed break-words text-muted">
                    {pickLang(step.description, lang)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Action Plan — only for playbook setups */}
      {trade && (
        <div className="mt-4 border-t border-edge pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-[11px] font-semibold tracking-wider text-dim uppercase">
              {UI.howToTrade[lang]}
            </h4>
            <div className="flex items-center gap-2">
              <DirectionBadge direction={trade.direction} lang={lang} />
              <span className="rounded-full border border-edge bg-panel-2 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-muted">
                R:R {trade.riskReward}
              </span>
            </div>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed break-words text-muted">
            {pickLang(trade.logic, lang)}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <TradeLegCard legKey="entry" price={trade.entry.price} conditions={trade.entry.conditions} lang={lang} />
            <TradeLegCard legKey="sl" price={trade.sl.price} conditions={trade.sl.conditions} lang={lang} />
            <TradeLegCard legKey="tp" price={trade.tp.price} conditions={trade.tp.conditions} lang={lang} />
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
        <ul className="space-y-1.5">
          {scenarioKeyPoints(scenario, scenarioId, lang).map((point) => (
            <li key={point} className="flex gap-2 text-[13px] leading-relaxed text-muted">
              <svg
                className="mt-1 h-3.5 w-3.5 shrink-0 text-accent"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="min-w-0 break-words">{point}</span>
            </li>
          ))}
        </ul>

        {scenario.legend && scenario.legend.length > 0 && (
          <div className="sm:w-44">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-dim">
              {UI.chartLegend[lang]}
            </p>
            <ul className="space-y-1.5">
              {scenario.legend.map((entry) => (
                <li key={legendLabel(entry.label, scenarioId, lang)} className="flex items-center gap-2 text-[12px] text-muted">
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
