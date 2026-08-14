import type { UTCTimestamp } from 'lightweight-charts';
import type { Candle, ConceptScenario, Timeframe } from './types';

/* ---------------------------------------------------------------------------
 * Multi-timeframe engine.
 *
 * Each base scenario ships a single candle dataset (~10–25 bars authored as
 * daily `YYYY-MM-DD` times, or hourly UTC timestamps for the kill-zones
 * scenario). This module derives a real, separate candle series for every
 * timeframe from that base — deterministically, so a given (scenario, TF)
 * always renders the same chart:
 *
 *   - Daily-string bases are re-interpreted as H4 bars (one 4h bar per index,
 *     starting at the base's first midnight), then:
 *       M5  = each H4 bar subdivided into 48 × 5-min bars
 *       M15 = each H4 bar subdivided into 16 × 15-min bars
 *       H1  = each H4 bar subdivided into 4 × 1-hour bars
 *       D1  = every 6 H4 bars aggregated into 1 daily bar
 *   - Hourly bases (kill zones) stay H1; M5/M15 subdivide and H4/D1 aggregate.
 *
 * Markers / trend lines / zones are remapped to the transformed series so the
 * pattern stays pinned to the right candles on every timeframe.
 * ------------------------------------------------------------------------- */

const SECONDS = {
  m5: 5 * 60,
  m15: 15 * 60,
  h1: 60 * 60,
  h4: 4 * 60 * 60,
  d1: 24 * 60 * 60,
} as const;

/** Deterministic PRNG so generated sub-bars are stable between reloads. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Converts a `Time` (number seconds or `YYYY-MM-DD` string) to epoch seconds. */
function toSeconds(time: unknown): number {
  if (typeof time === 'number') return time;
  const s = String(time);
  return Math.floor(Date.parse(`${s}T00:00:00Z`) / 1000);
}

/**
 * Splits one bar into `parts` sub-bars that trace a path from `open` to
 * `close` inside the bar's [low, high] range, with deterministic noise.
 */
function subdivideBar(bar: Candle, parts: number, seed: number, stepSec: number): Candle[] {
  const rnd = mulberry32(seed);
  const start = toSeconds(bar.time);
  const range = Math.max(bar.high - bar.low, 1e-9);
  const out: Candle[] = [];
  let prev = bar.open;
  for (let k = 0; k < parts; k++) {
    const progress = k / (parts - 1);
    const anchor = bar.open + (bar.close - bar.open) * progress;
    const noise = (rnd() - 0.5) * range * 0.5;
    let close = Math.min(bar.high, Math.max(bar.low, anchor + noise));
    if (k === parts - 1) close = bar.close; // end exactly where the parent closed
    const open = prev;
    const wick = (rnd() - 0.5) * range * 0.18;
    const high = Math.min(bar.high, Math.max(open, close) + Math.max(0, wick));
    const low = Math.max(bar.low, Math.min(open, close) + Math.min(0, wick));
    const volume =
      bar.volume !== undefined ? Math.max(1, Math.round(bar.volume / parts)) : undefined;
    out.push({
      time: (start + k * stepSec) as UTCTimestamp,
      open,
      high,
      low,
      close,
      volume,
    });
    prev = close;
  }
  return out;
}

/** Aggregates every `n` bars into one OHLC(V) bar (used for wider TFs). */
function aggregate(candles: Candle[], n: number): Candle[] {
  const out: Candle[] = [];
  for (let i = 0; i < candles.length; i += n) {
    const group = candles.slice(i, i + n);
    out.push({
      time: group[0].time,
      open: group[0].open,
      high: Math.max(...group.map((c) => c.high)),
      low: Math.min(...group.map((c) => c.low)),
      close: group[group.length - 1].close,
      volume: group.some((c) => c.volume !== undefined)
        ? group.reduce((s, c) => s + (c.volume ?? 0), 0)
        : undefined,
    });
  }
  return out;
}

/** Base timeframe of a dataset: hourly (intraday timestamps) or H4 (daily strings). */
function detectBaseTf(candles: Candle[]): Timeframe {
  return typeof candles[0]?.time === 'number' ? 'h1' : 'h4';
}

/** Sub-bars per base bar, or 0 when the target is wider than the base. */
function subParts(baseTf: Timeframe, tf: Timeframe): number {
  const secs = SECONDS[tf] / SECONDS[baseTf];
  return secs < 1 ? Math.round(1 / secs) : 0;
}

/** Base bars per aggregated bar, or 0 when the target is narrower than the base. */
function aggGroup(baseTf: Timeframe, tf: Timeframe): number {
  const secs = SECONDS[tf] / SECONDS[baseTf];
  return secs > 1 ? Math.round(secs) : 0;
}

/**
 * Builds the candle series + a time remapper for the requested timeframe.
 * `remap(i)` maps a base-candle index to the index of its counterpart in the
 * transformed series (middle of a subdivided group / the aggregated bar).
 */
function transformCandles(
  candles: Candle[],
  tf: Timeframe,
): { candles: Candle[]; remap: (baseIndex: number) => number } {
  const baseTf = detectBaseTf(candles);

  // Identity — same timeframe as the base.
  if (baseTf === tf) {
    return { candles, remap: (i) => i };
  }

  // Preprocess base candles to have perfectly continuous time.
  // Base authored as daily strings (H4) would otherwise create 20-hour gaps when subdivided!
  const baseStepSec = SECONDS[baseTf];
  const firstStart = toSeconds(candles[0].time);
  
  const continuousBase = candles.map((c, i) => ({
    ...c,
    time: (firstStart + i * baseStepSec) as UTCTimestamp,
  }));

  const parts = subParts(baseTf, tf);
  if (parts > 0) {
    const stepSec = SECONDS[tf];
    const out: Candle[] = [];
    continuousBase.forEach((bar, i) => {
      out.push(...subdivideBar(bar, parts, 1337 + i * 7919, stepSec));
    });
    // Pin remapped elements to the middle sub-bar of their group.
    const mid = Math.floor(parts / 2);
    return { candles: out, remap: (i) => i * parts + mid };
  }

  const group = aggGroup(baseTf, tf);
  const out = aggregate(continuousBase, group);
  return { candles: out, remap: (i) => Math.min(Math.floor(i / group), out.length - 1) };
}

/** Builds an index lookup from a base time to its position in the base array. */
function baseIndexLookup(candles: Candle[]): Map<string, number> {
  const map = new Map<string, number>();
  candles.forEach((c, i) => map.set(String(c.time), i));
  return map;
}

/**
 * Returns a variant of `base` whose candles, markers, trend lines and zones
 * are all transformed to the requested timeframe. Trade plans, price lines
 * and legends are price-only and pass through unchanged.
 */
export function scenarioForTimeframe(base: ConceptScenario, tf: Timeframe): ConceptScenario {
  const { candles, remap } = transformCandles(base.candles, tf);
  const lookup = baseIndexLookup(base.candles);
  const baseTf = detectBaseTf(base.candles);

  const mapTime = (t: unknown) => {
    const idx = lookup.get(String(t));
    if (idx === undefined) return t as never;
    return candles[remap(idx)]?.time ?? t;
  };

  return {
    ...base,
    candles,
    // Intraday timeframes show the time-of-day on the axis; D1 shows dates.
    // Identity variants (base already on this TF) keep the author's intent.
    timeVisible: baseTf === tf ? base.timeVisible : tf !== 'd1',
    markers: base.markers?.map((m) => ({ ...m, time: mapTime(m.time) })),
    trendLines: base.trendLines?.map((tl) => ({
      ...tl,
      from: { ...tl.from, time: mapTime(tl.from.time) },
      to: { ...tl.to, time: mapTime(tl.to.time) },
    })),
    zones: base.zones?.map((z) => ({
      ...z,
      startTime: mapTime(z.startTime),
      endTime: mapTime(z.endTime),
    })),
  };
}
