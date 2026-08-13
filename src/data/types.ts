import type { Time } from 'lightweight-charts';

/**
 * Shared types for the trading-concepts learning app.
 *
 * Every concept in the Learning Hub maps to a `ConceptScenario`: a candle
 * dataset plus the visual overlays (markers, trend lines, price lines and
 * highlighted zones) that illustrate the concept, plus a written explanation.
 */

/** A single OHLC candle. `time` is a date string (`YYYY-MM-DD`) or Unix seconds. */
export interface Candle {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  /** Optional volume — required by concepts that show the volume pane. */
  volume?: number;
}

/** Position of a bar marker relative to its candle. */
export type MarkerPosition = 'aboveBar' | 'belowBar' | 'inBar';

/** Shape of a bar marker. */
export type MarkerShape = 'arrowUp' | 'arrowDown' | 'circle' | 'square';

/** App UI language. */
export type Language = 'en' | 'th';

/** A piece of text with both language variants (nested `en` / `th`). */
export interface LocalizedText {
  en: string;
  th: string;
}

/**
 * Text that may be localized (`{ en, th }`) or a plain English-only string.
 * Plain strings act as the English variant and are the fallback in Thai mode.
 */
export type Localizable = string | LocalizedText;

/** A marker pinned to a candle (built on the charting lib's marker API). */
export interface MarkerSpec {
  time: Time;
  position: MarkerPosition;
  shape: MarkerShape;
  color: string;
  text: Localizable;
}

/** A sloped line drawn between two price/time points (e.g. an impulse leg). */
export interface TrendLineSpec {
  from: { time: Time; price: number };
  to: { time: Time; price: number };
  color: string;
  /** Line style: dashed for breaks (BOS / CHoCH), solid for legs. */
  dashed?: boolean;
  lineWidth?: number;
}

/** A horizontal price level rendered on the price axis (EQH, EQL, supports…). */
export interface PriceLineSpec {
  price: number;
  color: string;
  title: string;
  dashed?: boolean;
}

/**
 * A shaded rectangular zone.
 * - With `topPrice`/`bottomPrice`: a horizontal band (EQH/EQL, OB, FVG…).
 * - Without them: a full-height vertical band spanning a time range
 *   (e.g. London / New York kill zones).
 */
export interface ZoneSpec {
  startTime: Time;
  endTime: Time;
  topPrice?: number;
  bottomPrice?: number;
  color: string;
}

/** Legend entries explaining what each marker / line color means. */
export interface LegendEntry {
  label: Localizable;
  color: string;
  dashed?: boolean;
}

/** Trade direction. */
export type TradeDirection = 'long' | 'short';

/**
 * One numbered step of the setup sequence (rendered as ①, ②, ③… on the
 * chart markers and in the "Chart Breakdown" panel).
 */
export interface TradeStep {
  /** Step number (1, 2, 3… → ①, ②, ③). */
  n: number;
  /** Short title of the step (both languages). */
  title: LocalizedText;
  /** What exactly is happening at this step (both languages). */
  description: LocalizedText;
}

/** One leg of a trade plan: the price level drawn on the chart plus the exact conditions. */
export interface TradeLevel {
  /** Price level rendered as a horizontal line on the chart. */
  price: number;
  /** Exact, actionable conditions for this leg of the trade (both languages). */
  conditions: LocalizedText;
}

/**
 * A concrete, actionable trade setup. When present on a scenario, the chart
 * renders Entry (green), Stop Loss (red) and Take Profit (blue) price lines
 * and the explanation card shows the "How to Trade" action plan.
 */
export interface TradePlan {
  direction: TradeDirection;
  /** Setup name / badge, e.g. "SMC Order Block Entry" (both languages). */
  setup: LocalizedText;
  /** One-line logic recap: why this trade makes sense (both languages). */
  logic: LocalizedText;
  /** Step-by-step breakdown of the setup (matches the numbered markers ① ② ③…). */
  steps: TradeStep[];
  /** Risk : reward as a string, e.g. "1 : 4.6". */
  riskReward: string;
  entry: TradeLevel;
  sl: TradeLevel;
  tp: TradeLevel;
}

/** A fully-specified chart scenario for a concept. */
export interface ConceptScenario {
  candles: Candle[];
  markers?: MarkerSpec[];
  trendLines?: TrendLineSpec[];
  priceLines?: PriceLineSpec[];
  zones?: ZoneSpec[];
  /** Optional concrete trade setup — adds Entry/SL/TP lines and a trade plan card. */
  trade?: TradePlan;
  legend?: LegendEntry[];
  /** Render a volume histogram pane below the candles. */
  showVolume?: boolean;
  /** Show the time-of-day on the time axis (intraday scenarios). */
  timeVisible?: boolean;
  /** Indicator overlays to attach (Ichimoku cloud, Bollinger bands, volume profile). */
  indicators?: IndicatorType[];
  /** Heading for the explanation card. */
  title: Localizable;
  /** Short "in plain English" definition. */
  summary: Localizable;
  /** What the learner should look for on the chart. */
  keyPoints: Localizable[];
}

/** Indicator overlay systems supported by the chart. */
export type IndicatorType = 'ichimoku' | 'bollinger' | 'volumeProfile';

/** A concept entry in the Learning Hub. */
export interface Concept {
  id: string;
  /** Display name, e.g. "Break of Structure". */
  name: string;
  /** Short abbreviation shown as a badge, e.g. "BOS". */
  tag: string;
  /** Which scenario to render when selected. */
  scenarioId: string;
  /** One-line description shown under the name in the list. */
  description: string;
  /** Top-level accordion category, e.g. "SMC & ICT Concepts". */
  category: string;
  /** Sub-group heading within the category. */
  group: string;
}
