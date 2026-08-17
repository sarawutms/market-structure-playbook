import type { UTCTimestamp } from 'lightweight-charts';
import type { Candle, ConceptScenario } from './types';

/*
 * Extended scenario library — the "everything else" catalog (chart patterns,
 * candlestick patterns, ICT concepts, indicators, harmonics, new categories).
 *
 * Kept in its own module so `scenarios.ts` stays untouched; the two maps are
 * merged in `scenarios.ts` via `Object.assign(SCENARIOS, EXTRA_SCENARIOS)`.
 *
 * Helpers below mirror the ones in scenarios.ts (deliberately duplicated so
 * this module has no circular import back into scenarios.ts).
 */

/** Builds candles from [open, high, low, close] tuples, one day apart. */
export function toCandles(bars: Array<[number, number, number, number]>, startDate: string): Candle[] {
  const date = new Date(`${startDate}T00:00:00Z`);
  return bars.map(([open, high, low, close]) => {
    const time = date.toISOString().slice(0, 10);
    date.setUTCDate(date.getUTCDate() + 1);
    return { time, open, high, low, close };
  });
}

/** Builds candles with volume from [open, high, low, close, volume] tuples. */
export function toCandlesWithVolume(
  bars: Array<[number, number, number, number, number]>,
  startDate: string,
): Candle[] {
  const date = new Date(`${startDate}T00:00:00Z`);
  return bars.map(([open, high, low, close, volume]) => {
    const time = date.toISOString().slice(0, 10);
    date.setUTCDate(date.getUTCDate() + 1);
    return { time, open, high, low, close, volume };
  });
}

/** Deterministic PRNG so the generated series are stable between reloads. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface SeriesOptions {
  startPrice: number;
  drift: number;
  amplitude: number;
  frequency: number;
  noise: number;
  seed: number;
  spikes?: Record<number, number>;
}

/** Generates a deterministic OHLC series with a trend + wave + noise. */
export function generateSeries(count: number, startDate: string, opts: SeriesOptions): Candle[] {
  const rnd = mulberry32(opts.seed);
  const date = new Date(`${startDate}T00:00:00Z`);
  const out: Candle[] = [];
  let prev = opts.startPrice;
  for (let i = 0; i < count; i++) {
    const time = date.toISOString().slice(0, 10);
    date.setUTCDate(date.getUTCDate() + 1);
    const wave = Math.sin(i * opts.frequency) * opts.amplitude;
    const spike = opts.spikes?.[i] ?? 0;
    const close = opts.startPrice + opts.drift * i + wave + spike + (rnd() - 0.5) * opts.noise;
    const open = prev;
    const high = Math.max(open, close) + rnd() * opts.noise * 0.7;
    const low = Math.min(open, close) - rnd() * opts.noise * 0.7;
    out.push({ time, open, high, low, close });
    prev = close;
  }
  return out;
}

/** Unix seconds for an hour of a fixed UTC day. */
export function utcHour(dayOffset: number, hour: number): UTCTimestamp {
  return Math.floor(Date.UTC(2024, 5, 3 + dayOffset, hour, 0, 0) / 1000) as UTCTimestamp;
}

/** Palette matching the core scenarios. */
export const COLORS = {
  bull: '#0ecb81',
  bear: '#f6465d',
  accent: '#4f8cff',
  cyan: '#22d3ee',
  amber: '#fbbf24',
  violet: '#a78bfa',
  muted: '#8a94a6',
  zoneBull: 'rgba(14, 203, 129, 0.10)',
  zoneBear: 'rgba(246, 70, 93, 0.10)',
  zoneAmber: 'rgba(251, 191, 36, 0.10)',
  zoneCyan: 'rgba(34, 211, 238, 0.10)',
} as const;

/* ---------------------------------------------------------------------------
 * Batch A — Candlestick patterns
 * ------------------------------------------------------------------------- */

// Hanging man — small body + long lower wick at the top of an uptrend.
const HANG = toCandles([
  [100.0, 101.5, 99.6, 101.2],
  [101.2, 102.8, 100.8, 102.5],
  [102.5, 104.0, 102.2, 103.7],
  [103.7, 105.2, 103.4, 104.9],
  [104.9, 105.6, 102.2, 105.0], // hanging man
  [105.0, 105.2, 103.4, 103.6],
  [103.6, 103.8, 102.0, 102.3],
], '2025-01-06');
const hangT = (i: number) => HANG[i].time;

// Inverted hammer — small body + long upper wick at the bottom of a downtrend.
const IH = toCandles([
  [105.5, 106.0, 104.2, 104.5],
  [104.5, 105.0, 103.0, 103.3],
  [103.3, 103.8, 101.6, 101.9],
  [101.9, 102.3, 100.4, 100.7],
  [100.7, 104.0, 100.2, 101.0], // inverted hammer
  [101.0, 103.0, 100.8, 102.7],
  [102.7, 104.4, 102.4, 104.1],
], '2025-01-06');
const ihT = (i: number) => IH[i].time;

// Spinning top — tiny body with wicks on both sides (indecision).
const SPIN = toCandles([
  [100.0, 101.6, 99.7, 101.3],
  [101.3, 102.8, 101.0, 102.5],
  [102.5, 103.9, 102.2, 103.6],
  [103.6, 105.0, 103.3, 104.7],
  [104.7, 105.8, 103.0, 104.9], // spinning top
  [104.9, 105.0, 103.2, 103.4],
  [103.4, 103.6, 101.8, 102.0],
], '2025-01-06');
const spinT = (i: number) => SPIN[i].time;

// Dragonfly doji — open=close at the top, long lower wick (bullish at bottom).
const DRAG = toCandles([
  [106.0, 106.8, 104.8, 105.0],
  [105.0, 105.6, 103.6, 103.9],
  [103.9, 104.4, 102.2, 102.5],
  [102.5, 103.0, 100.8, 101.1],
  [101.1, 101.3, 98.0, 101.1], // dragonfly doji
  [101.1, 103.2, 100.9, 102.9],
  [102.9, 104.6, 102.6, 104.3],
], '2025-01-06');
const dragT = (i: number) => DRAG[i].time;

// Gravestone doji — open=close at the bottom, long upper wick (bearish at top).
const GRAV = toCandles([
  [100.0, 101.5, 99.6, 101.2],
  [101.2, 102.7, 100.9, 102.4],
  [102.4, 103.9, 102.1, 103.6],
  [103.6, 105.1, 103.3, 104.8],
  [104.8, 108.0, 104.7, 104.8], // gravestone doji
  [104.8, 104.9, 102.8, 103.0],
  [103.0, 103.2, 101.2, 101.4],
], '2025-01-06');
const gravT = (i: number) => GRAV[i].time;

// Long-legged doji — open=close in the middle, very long wicks both sides.
const LLEG = toCandles([
  [100.0, 101.4, 99.7, 101.1],
  [101.1, 102.5, 100.8, 102.2],
  [102.2, 103.6, 101.9, 103.3],
  [103.3, 106.0, 100.5, 103.3], // long-legged doji
  [103.3, 103.4, 101.6, 101.8],
  [101.8, 102.0, 100.2, 100.4],
], '2025-01-06');
const llegT = (i: number) => LLEG[i].time;

// Tweezer top — two candles sharing the same high at the top of an uptrend.
const TZR_TOP = toCandles([
  [100.0, 101.5, 99.7, 101.2],
  [101.2, 102.7, 100.9, 102.4],
  [102.4, 103.9, 102.1, 103.6],
  [103.6, 105.0, 103.3, 104.7],
  [104.7, 105.0, 103.4, 103.6], // tweezer 2 — same 105.0 high
  [103.6, 103.8, 102.0, 102.2],
  [102.2, 102.4, 100.6, 100.8],
], '2025-01-06');
const tzrTopT = (i: number) => TZR_TOP[i].time;

// Tweezer bottom — two candles sharing the same low at the bottom of a downtrend.
const TZR_BOT = toCandles([
  [106.0, 107.0, 105.0, 106.6],
  [106.6, 107.2, 105.2, 105.5],
  [105.5, 106.0, 104.0, 104.3],
  [104.3, 104.5, 103.0, 103.3],
  [103.3, 103.6, 103.0, 103.5], // tweezer 2 — same 103.0 low
  [103.5, 105.0, 103.3, 104.7],
  [104.7, 106.0, 104.4, 105.7],
], '2025-01-06');
const tzrBotT = (i: number) => TZR_BOT[i].time;

// Piercing line — bullish candle closes above the midpoint of the prior bearish body.
const PIRC = toCandles([
  [106.0, 107.0, 105.0, 106.5],
  [106.5, 107.0, 104.9, 105.2],
  [105.2, 105.6, 103.6, 103.9],
  [103.9, 104.2, 102.4, 102.7], // bearish
  [102.7, 104.2, 101.8, 103.9], // piercing line
  [103.9, 105.2, 103.6, 104.9],
], '2025-01-06');
const pircT = (i: number) => PIRC[i].time;

// Dark cloud cover — bearish candle closes below the midpoint of the prior bullish body.
const DARK = toCandles([
  [100.0, 101.5, 99.7, 101.2],
  [101.2, 102.7, 100.9, 102.4],
  [102.4, 103.9, 102.1, 103.6],
  [103.6, 105.0, 103.3, 104.7], // bullish
  [104.7, 105.2, 103.5, 103.8], // dark cloud cover
  [103.8, 104.0, 102.2, 102.4],
  [102.4, 102.6, 100.8, 101.0],
], '2025-01-06');
const darkT = (i: number) => DARK[i].time;

// Bullish kicker — gap up after a downtrend + strong bullish candle.
const KICK = toCandles([
  [106.5, 107.0, 105.0, 105.3],
  [105.3, 105.8, 103.8, 104.1],
  [104.1, 104.6, 102.6, 102.9],
  [102.9, 103.4, 101.4, 101.7],
  [103.0, 106.2, 102.9, 106.0], // kicker — gap up + strong bullish
  [106.0, 107.4, 105.6, 107.1],
  [107.1, 108.4, 106.7, 108.1],
], '2025-01-06');
const kickT = (i: number) => KICK[i].time;

// Bullish belt hold — single strong bullish candle opening at its low (no lower wick).
const BELT = toCandles([
  [106.5, 107.2, 105.2, 105.5],
  [105.5, 106.0, 104.0, 104.3],
  [104.3, 104.8, 102.8, 103.1],
  [103.1, 103.6, 101.6, 101.9],
  [101.9, 104.8, 101.9, 104.5], // belt hold (open = low)
  [104.5, 105.8, 104.2, 105.5],
  [105.5, 106.8, 105.2, 106.5],
], '2025-01-06');
const beltT = (i: number) => BELT[i].time;

// Homing pigeon — second bearish body nests inside the first during a downtrend.
const PIGEON = toCandles([
  [106.5, 107.2, 105.2, 105.5],
  [105.5, 106.0, 104.0, 104.3],
  [104.3, 104.8, 102.8, 103.1],
  [103.1, 103.4, 101.6, 101.9], // bearish
  [101.9, 102.1, 101.2, 101.4], // homing pigeon (inside body)
  [101.4, 103.2, 101.2, 102.9],
], '2025-01-06');
const pigeonT = (i: number) => PIGEON[i].time;

// Matching low — two bearish candles closing at the same low level.
const MATCH = toCandles([
  [106.5, 107.2, 105.2, 105.5],
  [105.5, 106.0, 104.0, 104.3],
  [104.3, 104.8, 102.8, 103.1],
  [103.1, 103.3, 101.4, 101.6], // low 101.4
  [101.6, 101.8, 101.4, 101.5], // matching low 101.4
  [101.5, 103.2, 101.3, 102.9],
], '2025-01-06');
const matchT = (i: number) => MATCH[i].time;

// In-neck — bullish closes near the prior bearish candle's low, then downtrend resumes.
const NECK = toCandles([
  [106.5, 107.2, 105.2, 105.5],
  [105.5, 106.0, 104.0, 104.3],
  [104.3, 104.8, 102.8, 103.1],
  [103.1, 103.3, 101.3, 101.6], // bearish
  [101.6, 102.3, 101.3, 101.4], // in-neck (close at prior low)
  [101.4, 101.6, 99.8, 100.0],
], '2025-01-06');
const neckT = (i: number) => NECK[i].time;

// On-neck — bullish closes exactly at the prior bearish candle's low.
const ONECK = toCandles([
  [106.5, 107.2, 105.2, 105.5],
  [105.5, 106.0, 104.0, 104.3],
  [104.3, 104.8, 102.8, 103.1],
  [103.1, 103.3, 101.2, 101.5], // bearish
  [101.5, 102.2, 101.2, 101.2], // on-neck (close = prior low)
  [101.2, 101.4, 99.6, 99.8],
], '2025-01-06');
const oneckT = (i: number) => ONECK[i].time;

// Thrusting — bullish closes into the lower half of the prior bearish body.
const THRUST = toCandles([
  [106.5, 107.2, 105.2, 105.5],
  [105.5, 106.0, 104.0, 104.3],
  [104.3, 104.8, 102.8, 103.1],
  [103.1, 103.3, 101.4, 101.7], // bearish
  [101.7, 102.2, 101.5, 102.0], // thrusting (close in lower half)
  [102.0, 102.2, 100.4, 100.6],
], '2025-01-06');
const thrustT = (i: number) => THRUST[i].time;

// Three inside up — big bearish, small bullish inside, then strong bullish.
const T3IN_UP = toCandles([
  [106.5, 107.2, 105.2, 105.5],
  [105.5, 106.0, 104.0, 104.3],
  [104.3, 104.8, 102.8, 103.1],
  [103.1, 103.3, 101.0, 101.3], // big bearish
  [101.3, 101.9, 101.2, 101.7], // small bullish inside
  [101.7, 104.0, 101.5, 103.7], // strong bullish
  [103.7, 105.0, 103.4, 104.7],
], '2025-01-06');
const t3inUpT = (i: number) => T3IN_UP[i].time;

// Three inside down — mirror of three inside up.
const T3IN_DN = toCandles([
  [100.0, 101.5, 99.7, 101.2],
  [101.2, 102.7, 100.9, 102.4],
  [102.4, 103.9, 102.1, 103.6],
  [103.6, 105.0, 103.4, 104.8], // big bullish
  [104.8, 104.9, 103.8, 104.0], // small bearish inside
  [104.0, 104.2, 101.8, 102.0], // strong bearish
  [102.0, 102.2, 100.4, 100.6],
], '2025-01-06');
const t3inDnT = (i: number) => T3IN_DN[i].time;

// Three outside up — bearish engulfed by bullish, then continuation up.
const T3OUT_UP = toCandles([
  [106.5, 107.2, 105.2, 105.5],
  [105.5, 106.0, 104.0, 104.3],
  [104.3, 104.8, 102.8, 103.1],
  [103.1, 103.3, 101.5, 101.8], // bearish
  [101.8, 104.0, 101.4, 103.8], // bullish engulfing
  [103.8, 105.2, 103.5, 104.9], // continuation
], '2025-01-06');
const t3outUpT = (i: number) => T3OUT_UP[i].time;

// Three outside down — mirror of three outside up.
const T3OUT_DN = toCandles([
  [100.0, 101.5, 99.7, 101.2],
  [101.2, 102.7, 100.9, 102.4],
  [102.4, 103.9, 102.1, 103.6],
  [103.6, 105.0, 103.3, 104.8], // bullish
  [104.8, 104.9, 102.4, 102.6], // bearish engulfing
  [102.6, 102.8, 101.0, 101.2], // continuation
], '2025-01-06');
const t3outDnT = (i: number) => T3OUT_DN[i].time;

// Doji star — bearish candle, gap-down doji, then bullish reversal.
const DOJI_STAR = toCandles([
  [106.5, 107.2, 105.2, 105.5],
  [105.5, 106.0, 104.0, 104.3],
  [104.3, 104.8, 102.8, 103.1],
  [103.1, 103.3, 101.3, 101.6], // bearish
  [100.8, 101.2, 100.2, 101.0], // doji star (gap down)
  [101.0, 103.4, 100.8, 103.1], // reversal
  [103.1, 104.6, 102.8, 104.3],
], '2025-01-06');
const dojiStarT = (i: number) => DOJI_STAR[i].time;

// Abandoned baby — gap down doji, then gap up bullish (island reversal).
const BABY = toCandles([
  [106.5, 107.2, 105.2, 105.5],
  [105.5, 106.0, 104.0, 104.3],
  [104.3, 104.8, 102.8, 103.1],
  [103.1, 103.3, 101.3, 101.6], // bearish
  [100.6, 101.0, 99.9, 100.8], // doji, gapped below
  [102.2, 104.6, 102.0, 104.3], // gapped above — abandoned baby
  [104.3, 105.6, 104.0, 105.3],
], '2025-01-06');
const babyT = (i: number) => BABY[i].time;

// Two crows — bullish, then two bearish candles eating into the prior body.
const TWO_CROW = toCandles([
  [100.0, 101.5, 99.7, 101.2],
  [101.2, 102.7, 100.9, 102.4],
  [102.4, 103.9, 102.1, 103.6],
  [103.6, 105.0, 103.3, 104.8], // bullish
  [104.8, 105.2, 103.6, 103.9], // crow 1
  [103.9, 104.5, 103.2, 103.4], // crow 2
  [103.4, 103.6, 101.8, 102.0],
], '2025-01-06');
const twoCrowT = (i: number) => TWO_CROW[i].time;

// Upside gap two crows — bullish, gap up, then two bearish candles.
const GAP_TWO_CROW = toCandles([
  [100.0, 101.5, 99.7, 101.2],
  [101.2, 102.7, 100.9, 102.4],
  [102.4, 103.9, 102.1, 103.6],
  [103.6, 105.0, 103.3, 104.8], // bullish
  [105.6, 105.8, 104.4, 104.7], // gap-up crow 1
  [104.7, 105.4, 104.0, 104.2], // crow 2
  [104.2, 104.4, 102.6, 102.8],
], '2025-01-06');
const gapTwoCrowT = (i: number) => GAP_TWO_CROW[i].time;

// Stick sandwich — two bearish candles with a bullish candle between, closing at the same level.
const SAND = toCandles([
  [106.5, 107.2, 105.2, 105.5],
  [105.5, 106.0, 104.0, 104.3],
  [104.3, 104.8, 102.8, 103.1],
  [103.1, 103.3, 101.4, 101.7], // bearish 1 — close 101.7
  [101.7, 103.0, 101.5, 102.7], // bullish
  [102.7, 102.9, 101.5, 101.7], // bearish 2 — same close 101.7
  [101.7, 103.4, 101.5, 103.1],
], '2025-01-06');
const sandT = (i: number) => SAND[i].time;

// Advance block — three bullish candles with shrinking bodies and growing upper shadows.
const ADVB = toCandles([
  [100.0, 101.5, 99.7, 101.2],
  [101.2, 102.7, 100.9, 102.4],
  [102.4, 103.6, 102.1, 103.3],
  [103.3, 104.9, 103.0, 104.6], // b1 — body 1.3
  [104.6, 106.0, 104.3, 105.6], // b2 — body 1.0
  [105.6, 107.6, 105.4, 106.0], // b3 — body 0.4, long upper shadow
  [106.0, 106.2, 104.0, 104.2],
], '2025-01-06');
const advbT = (i: number) => ADVB[i].time;

// Deliberation — two strong bullish candles then a small (stalled) candle.
const DELIB = toCandles([
  [100.0, 101.5, 99.7, 101.2],
  [101.2, 102.7, 100.9, 102.4],
  [102.4, 103.9, 102.1, 103.6],
  [103.6, 105.2, 103.3, 104.9], // b1
  [104.9, 106.6, 104.6, 106.3], // b2
  [106.3, 107.0, 105.4, 106.0], // deliberation — small body
  [106.0, 106.2, 104.0, 104.2],
], '2025-01-06');
const delibT = (i: number) => DELIB[i].time;

// Rising three methods — long bullish, 3 small pullbacks inside, then new high.
const RISE3 = toCandles([
  [100.0, 101.5, 99.7, 101.2],
  [101.2, 102.7, 100.9, 102.4],
  [102.4, 105.0, 102.1, 104.7], // long bullish
  [104.7, 104.9, 103.6, 103.8],
  [103.8, 104.0, 103.0, 103.2],
  [103.2, 103.4, 102.6, 102.8],
  [102.8, 105.4, 102.6, 105.1], // breakout above
  [105.1, 106.4, 104.8, 106.1],
], '2025-01-06');
const rise3T = (i: number) => RISE3[i].time;

// Falling three methods — long bearish, 3 small bounces inside, then new low.
const FALL3 = toCandles([
  [106.5, 107.2, 105.2, 105.5],
  [105.5, 106.0, 104.2, 104.5],
  [104.5, 104.7, 102.0, 102.3], // long bearish
  [102.3, 103.8, 102.1, 103.6],
  [103.6, 104.4, 103.4, 104.2],
  [104.2, 104.8, 104.0, 104.6],
  [104.6, 104.8, 101.8, 102.1], // breakdown below
  [102.1, 102.3, 100.4, 100.6],
], '2025-01-06');
const fall3T = (i: number) => FALL3[i].time;

// Upside tasuki gap — gap up, bearish closes inside the gap, trend resumes.
const TASUKI_UP = toCandles([
  [100.0, 101.5, 99.7, 101.2],
  [101.2, 102.7, 100.9, 102.4],
  [102.4, 103.9, 102.1, 103.6],
  [103.6, 105.0, 103.3, 104.8], // bullish
  [106.0, 107.4, 105.7, 107.1], // gap-up bullish
  [107.1, 107.3, 105.8, 106.0], // bearish inside the gap
  [106.0, 107.6, 105.8, 107.3], // trend resumes
], '2025-01-06');
const tasukiUpT = (i: number) => TASUKI_UP[i].time;

// Downside tasuki gap — gap down, bullish closes inside the gap, trend resumes.
const TASUKI_DN = toCandles([
  [106.5, 107.2, 105.2, 105.5],
  [105.5, 106.0, 104.0, 104.3],
  [104.3, 104.8, 102.8, 103.1],
  [103.1, 103.3, 101.6, 101.9], // bearish
  [101.9, 102.1, 100.4, 100.7], // gap-down bearish
  [100.7, 102.0, 100.5, 101.8], // bullish inside the gap
  [101.8, 102.0, 100.2, 100.4], // trend resumes
], '2025-01-06');
const tasukiDnT = (i: number) => TASUKI_DN[i].time;

// Mat hold — long bullish, 4 shallow pullbacks, then a strong breakout candle.
const MAT_HOLD = toCandles([
  [100.0, 101.5, 99.7, 101.2],
  [101.2, 102.7, 100.9, 102.4],
  [102.4, 105.2, 102.1, 104.9], // long bullish
  [104.9, 105.1, 103.7, 103.9],
  [103.9, 104.1, 103.1, 103.3],
  [103.3, 103.5, 102.7, 102.9],
  [102.9, 103.1, 102.3, 102.5],
  [102.5, 105.6, 102.3, 105.3], // mat hold breakout
  [105.3, 106.6, 105.0, 106.3],
], '2025-01-06');
const matHoldT = (i: number) => MAT_HOLD[i].time;

// Separating lines (bearish) — two bearish candles opening at the same price.
const SEP = toCandles([
  [100.0, 101.5, 99.7, 101.2],
  [101.2, 102.7, 100.9, 102.4],
  [102.4, 103.9, 102.1, 103.6],
  [103.6, 105.0, 103.3, 104.8], // bullish
  [104.8, 104.9, 102.8, 103.0], // bearish 1 — open 104.8
  [104.8, 104.9, 102.2, 102.4], // bearish 2 — same open 104.8
  [102.4, 102.6, 100.8, 101.0],
], '2025-01-06');
const sepT = (i: number) => SEP[i].time;

/* ---------------------------------------------------------------------------
 * Batch B — Chart patterns
 * ------------------------------------------------------------------------- */

// Rising channel — price oscillates between two rising parallel trendlines.
const CH_UP = toCandles([
  [100.0, 100.8, 99.4, 100.5],
  [100.5, 101.6, 100.2, 101.3],
  [101.3, 102.0, 100.7, 101.1],
  [101.1, 102.2, 100.9, 101.9],
  [101.9, 102.8, 101.6, 102.5],
  [102.5, 103.2, 102.0, 102.4],
  [102.4, 103.6, 102.2, 103.3],
  [103.3, 104.2, 103.0, 103.9],
  [103.9, 104.8, 103.6, 104.5],
  [104.5, 105.2, 104.0, 104.4],
  [104.4, 105.6, 104.2, 105.3],
  [105.3, 106.2, 105.0, 105.9],
  [105.9, 107.0, 105.6, 106.7],
], '2025-02-03');
const chUpT = (i: number) => CH_UP[i].time;

// Falling channel — price oscillates between two falling parallel trendlines.
const CH_DN = toCandles([
  [106.7, 107.0, 105.6, 105.9],
  [105.9, 106.2, 105.0, 105.3],
  [105.3, 105.6, 104.2, 104.4],
  [104.4, 105.0, 104.0, 104.7],
  [104.7, 105.2, 103.6, 103.9],
  [103.9, 104.2, 103.0, 103.3],
  [103.3, 103.8, 102.8, 103.5],
  [103.5, 104.0, 102.4, 102.7],
  [102.7, 103.0, 101.8, 102.1],
  [102.1, 102.6, 101.6, 102.3],
  [102.3, 102.8, 101.2, 101.5],
  [101.5, 101.8, 100.6, 100.9],
], '2025-02-03');
const chDnT = (i: number) => CH_DN[i].time;

// Scallop bottom (bowl) — long rounded U-shaped bottom.
const SCAL_B = toCandles([
  [104.0, 105.0, 103.2, 104.7],
  [104.7, 105.2, 103.4, 103.8],
  [103.8, 104.2, 102.6, 102.9],
  [102.9, 103.2, 101.6, 101.9],
  [101.9, 102.1, 100.6, 100.9],
  [100.9, 101.1, 99.8, 100.2],
  [100.2, 100.5, 99.4, 99.8],
  [99.8, 100.2, 99.2, 99.6],
  [99.6, 100.4, 99.4, 100.1],
  [100.1, 101.2, 99.9, 100.9],
  [100.9, 102.2, 100.7, 101.9],
  [101.9, 103.2, 101.7, 102.9],
  [102.9, 104.2, 102.7, 103.9],
  [103.9, 105.4, 103.7, 105.1],
], '2025-02-03');
const scalBT = (i: number) => SCAL_B[i].time;

// Inverted scallop (scallop top) — long rounded cap-shaped top.
const SCAL_T = toCandles([
  [101.0, 102.2, 100.7, 101.9],
  [101.9, 103.2, 101.7, 102.9],
  [102.9, 104.2, 102.7, 103.9],
  [103.9, 105.4, 103.7, 105.1],
  [105.1, 106.0, 104.8, 105.6],
  [105.6, 106.2, 105.0, 105.3],
  [105.3, 105.6, 104.2, 104.4],
  [104.4, 105.0, 104.0, 104.7],
  [104.7, 105.2, 103.6, 103.9],
  [103.9, 104.2, 103.0, 103.3],
  [103.3, 103.8, 102.8, 103.5],
  [103.5, 104.0, 102.4, 102.7],
  [102.7, 103.0, 101.8, 102.1],
  [102.1, 102.6, 101.6, 102.3],
], '2025-02-03');
const scalTT = (i: number) => SCAL_T[i].time;

// Bump-and-run reversal (BARR) — lead-in decline, steep bump, breakdown.
const BARR = toCandles([
  [100.0, 100.6, 99.4, 100.3],
  [100.3, 100.8, 99.6, 100.0],
  [100.0, 100.5, 99.2, 99.5],
  [99.5, 100.0, 98.8, 99.1],
  [99.1, 99.5, 98.3, 98.6],
  [98.6, 100.8, 98.4, 100.5],
  [100.5, 102.6, 100.3, 102.3],
  [102.3, 104.6, 102.1, 104.3],
  [104.3, 105.4, 103.6, 103.9],
  [103.9, 104.2, 102.4, 102.6],
  [102.6, 102.8, 100.8, 101.0],
  [101.0, 101.2, 99.2, 99.4],
  [99.4, 99.6, 97.4, 97.6],
  [97.6, 97.8, 95.6, 95.8],
], '2025-02-03');
const barrT = (i: number) => BARR[i].time;

// Hook reversal — sharp counter-trend hook at the end of a move.
const HOOK = toCandles([
  [105.0, 105.8, 104.2, 105.5],
  [105.5, 106.2, 104.4, 104.7],
  [104.7, 105.2, 103.4, 103.7],
  [103.7, 104.2, 102.4, 102.7],
  [102.7, 103.0, 101.4, 101.7],
  [101.7, 101.9, 100.6, 100.9],
  [100.9, 101.1, 99.8, 100.1], // hook low
  [100.1, 102.4, 99.9, 102.1],
  [102.1, 104.0, 101.9, 103.7],
], '2025-02-03');
const hookT = (i: number) => HOOK[i].time;

// Pipe top — two adjacent candles with identical highs at a top.
const PIPE_T = toCandles([
  [100.0, 101.5, 99.7, 101.2],
  [101.2, 102.7, 100.9, 102.4],
  [102.4, 103.9, 102.1, 103.6],
  [103.6, 105.0, 103.3, 104.8],
  [104.8, 105.0, 103.6, 103.8], // pipe 2 — same 105.0 high
  [103.8, 104.0, 102.0, 102.2],
  [102.2, 102.4, 100.4, 100.6],
], '2025-02-03');
const pipeTT = (i: number) => PIPE_T[i].time;

// Pipe bottom — two adjacent candles with identical lows at a bottom.
const PIPE_B = toCandles([
  [106.0, 107.0, 105.0, 106.6],
  [106.6, 107.2, 105.2, 105.5],
  [105.5, 106.0, 104.0, 104.3],
  [104.3, 104.5, 103.0, 103.3],
  [103.3, 103.6, 103.0, 103.5], // pipe 2 — same 103.0 low
  [103.5, 105.0, 103.3, 104.7],
  [104.7, 106.2, 104.4, 105.9],
], '2025-02-03');
const pipeBT = (i: number) => PIPE_B[i].time;

// V-top — sharp spike up then an immediate reversal.
const V_TOP = toCandles([
  [100.0, 100.8, 99.6, 100.5],
  [100.5, 101.4, 100.2, 101.1],
  [101.1, 102.2, 100.9, 101.9],
  [101.9, 104.0, 101.7, 103.7],
  [103.7, 106.2, 103.5, 106.0], // spike high
  [106.0, 106.4, 104.2, 104.4],
  [104.4, 104.6, 102.4, 102.6],
  [102.6, 102.8, 100.8, 101.0],
], '2025-02-03');
const vTopT = (i: number) => V_TOP[i].time;

// V-bottom — sharp drop then an immediate reversal.
const V_BOT = toCandles([
  [105.5, 106.2, 104.4, 105.9],
  [105.9, 106.4, 104.6, 104.9],
  [104.9, 105.2, 103.2, 103.5],
  [103.5, 103.8, 101.8, 102.1],
  [102.1, 102.3, 100.0, 100.2], // spike low
  [100.2, 102.6, 100.0, 102.3],
  [102.3, 104.6, 102.1, 104.3],
  [104.3, 106.0, 104.1, 105.7],
], '2025-02-03');
const vBotT = (i: number) => V_BOT[i].time;

// Dead cat bounce — sharp crash, weak bounce, decline resumes.
const DCB = toCandles([
  [108.0, 109.0, 107.2, 108.6],
  [108.6, 109.2, 107.2, 107.5],
  [107.5, 108.0, 106.0, 106.3],
  [106.3, 106.6, 104.6, 104.9],
  [104.9, 105.2, 103.2, 103.5],
  [103.5, 103.8, 101.8, 102.1],
  [102.1, 102.4, 100.4, 100.7],
  [100.7, 103.0, 100.5, 102.7], // dead cat bounce
  [102.7, 104.0, 102.5, 103.7],
  [103.7, 103.9, 101.6, 101.8],
  [101.8, 102.0, 99.6, 99.8],
], '2025-02-03');
const dcbT = (i: number) => DCB[i].time;

// Measured move — two similar-sized legs with a flag between them.
const MEAS = toCandles([
  [106.0, 107.0, 105.2, 106.6],
  [106.6, 107.2, 105.2, 105.5],
  [105.5, 106.0, 104.2, 104.5],
  [104.5, 104.7, 102.6, 102.9],
  [102.9, 103.1, 101.2, 101.4],
  [101.4, 101.6, 99.8, 100.0],
  [100.0, 101.2, 99.8, 100.9], // flag
  [100.9, 101.8, 100.7, 101.5],
  [101.5, 102.2, 101.0, 101.3],
  [101.3, 101.5, 99.4, 99.6], // leg 2
  [99.6, 99.8, 97.8, 98.0],
  [98.0, 98.2, 96.0, 96.2],
], '2025-02-03');
const measT = (i: number) => MEAS[i].time;

// Breakaway gap — price gaps through a range, starting a new trend.
const GAP_BRK = toCandles([
  [103.0, 103.8, 102.2, 103.5],
  [103.5, 104.2, 102.6, 103.0],
  [103.0, 103.4, 101.8, 102.1],
  [102.1, 102.4, 101.0, 101.3],
  [100.0, 100.2, 98.8, 99.1], // breakaway gap down
  [99.1, 99.3, 97.4, 97.6],
  [97.6, 97.8, 95.8, 96.0],
], '2025-02-03');
const gapBrkT = (i: number) => GAP_BRK[i].time;

// Runaway (measuring) gap — a gap in the middle of a strong trend.
const GAP_RUN = toCandles([
  [104.0, 104.8, 103.2, 104.5],
  [104.5, 105.0, 103.2, 103.5],
  [103.5, 104.0, 102.0, 102.3],
  [102.3, 102.6, 100.6, 100.9],
  [100.9, 101.1, 99.0, 99.3],
  [98.0, 98.2, 96.2, 96.4], // runaway gap
  [96.4, 96.6, 94.8, 95.0],
  [95.0, 95.2, 93.2, 93.4],
], '2025-02-03');
const gapRunT = (i: number) => GAP_RUN[i].time;

// Exhaustion gap — a final gap up at the end of a rally, then reversal.
const GAP_EXH = toCandles([
  [100.0, 100.8, 99.4, 100.5],
  [100.5, 101.6, 100.2, 101.3],
  [101.3, 102.6, 101.1, 102.3],
  [102.3, 103.8, 102.1, 103.5],
  [103.5, 105.0, 103.3, 104.7],
  [104.7, 106.4, 104.5, 106.1],
  [106.1, 107.8, 105.9, 107.5],
  [109.0, 109.4, 107.2, 107.4], // exhaustion gap
  [107.4, 107.6, 105.4, 105.6],
  [105.6, 105.8, 103.6, 103.8],
], '2025-02-03');
const gapExhT = (i: number) => GAP_EXH[i].time;

// Failed breakout (headfake) — breakout above a range that immediately fails.
const FAILBO = toCandles([
  [100.0, 100.8, 99.4, 100.5],
  [100.5, 101.4, 100.2, 101.1],
  [101.1, 101.8, 100.4, 100.7],
  [100.7, 101.4, 100.0, 100.3],
  [100.3, 101.0, 99.6, 99.9],
  [99.9, 100.8, 99.4, 100.5],
  [100.5, 101.2, 99.8, 100.1],
  [100.1, 102.6, 100.0, 102.3], // fakeout above 101.8
  [102.3, 102.4, 100.4, 100.6],
  [100.6, 100.8, 98.8, 99.0],
  [99.0, 99.2, 97.2, 97.4],
], '2025-02-03');
const failboT = (i: number) => FAILBO[i].time;

/* ---------------------------------------------------------------------------
 * Batch C — SMC / ICT
 * ------------------------------------------------------------------------- */

// OTE — impulse leg, pullback into the 61.8–79.6% retracement, entry, rally.
const OTE = toCandles([
  [100.0, 100.8, 99.4, 100.5],
  [100.5, 101.6, 100.2, 101.3],
  [101.3, 102.6, 101.1, 102.3],
  [102.3, 103.8, 102.1, 103.5],
  [103.5, 105.0, 103.3, 104.7],
  [104.7, 106.4, 104.5, 106.1],
  [106.1, 107.8, 105.9, 107.5],
  [107.5, 109.4, 107.3, 109.1],
  [109.1, 111.2, 108.9, 110.9],
  [110.9, 112.6, 110.7, 112.3], // impulse high 112.6
  [112.3, 112.4, 110.2, 110.4],
  [110.4, 110.6, 107.8, 108.0],
  [108.0, 108.2, 104.0, 104.2], // into OTE zone (62–79.6%)
  [104.2, 107.0, 104.0, 106.7], // entry + rejection
  [106.7, 109.6, 106.5, 109.3],
], '2025-03-03');
const oteT = (i: number) => OTE[i].time;

// Power of 3 — accumulation range, manipulation sweep, distribution trend.
const PO3 = toCandles([
  [100.0, 101.0, 99.5, 100.7],
  [100.7, 101.5, 100.0, 100.3],
  [100.3, 100.8, 99.3, 99.6],
  [99.6, 100.2, 99.0, 99.9],
  [99.9, 100.5, 99.2, 99.5],
  [99.5, 100.2, 99.0, 99.9],
  [99.9, 100.0, 97.8, 98.1], // manipulation — sweep below the range
  [98.1, 101.0, 97.9, 100.7], // distribution begins
  [100.7, 103.4, 100.5, 103.1],
  [103.1, 105.8, 102.9, 105.5],
], '2025-03-03');
const po3T = (i: number) => PO3[i].time;

// Judas swing — initial move against the bias before the real move.
const JUDAS = toCandles([
  [100.0, 100.8, 99.5, 100.6],
  [100.6, 101.4, 100.0, 100.2],
  [100.2, 100.3, 98.4, 98.6], // judas swing — sweep below the range
  [98.6, 101.2, 98.4, 100.9], // real move begins
  [100.9, 103.6, 100.7, 103.3],
  [103.3, 105.8, 103.1, 105.5],
], '2025-03-03');
const judasT = (i: number) => JUDAS[i].time;

// Mitigation block — bullish OB, displacement up, deep retrace mitigates it.
const MITI = toCandles([
  [106.0, 107.0, 105.2, 106.6],
  [106.6, 107.2, 105.2, 105.5],
  [105.5, 106.0, 104.2, 104.5],
  [104.5, 104.7, 102.6, 102.9],
  [102.9, 103.1, 101.2, 101.4],
  [101.4, 101.6, 99.6, 99.8], // bullish OB (last down candle)
  [99.8, 103.0, 99.6, 102.7], // displacement
  [102.7, 105.2, 102.5, 104.9],
  [104.9, 105.0, 99.9, 100.1], // mitigation — deep fill into the OB
  [100.1, 103.4, 99.9, 103.1], // continuation
], '2025-03-03');
const mitiT = (i: number) => MITI[i].time;

// Reclaim block — level breaks, then gets reclaimed (closed back above).
const RECL = toCandles([
  [104.0, 105.0, 103.2, 104.6],
  [104.6, 105.0, 103.4, 103.7],
  [103.7, 104.0, 102.2, 102.5],
  [102.5, 102.8, 100.8, 101.1],
  [101.1, 101.3, 99.4, 99.6], // break of 100
  [99.6, 99.8, 98.2, 98.4], // below the level
  [98.4, 100.6, 98.2, 100.4], // reclaim — closes back above 100
  [100.4, 102.8, 100.2, 102.5],
  [102.5, 104.6, 102.3, 104.3],
], '2025-03-03');
const reclT = (i: number) => RECL[i].time;

// Premium / discount — equilibrium (50%) splits the dealing range.
const EQ = toCandles([
  [100.0, 101.0, 99.4, 100.8],
  [100.8, 101.6, 100.0, 100.3],
  [100.3, 101.0, 99.6, 100.7],
  [100.7, 103.0, 100.5, 102.7], // rally from discount
  [102.7, 105.2, 102.5, 104.9], // into equilibrium 105
  [104.9, 108.0, 104.7, 107.7], // into premium
  [107.7, 110.0, 107.5, 109.7], // approaches the range high
], '2025-03-03');
const eqT = (i: number) => EQ[i].time;

// Dealing range — the range between buy-side and sell-side liquidity.
const DR = toCandles([
  [100.0, 101.0, 99.4, 100.8],
  [100.8, 102.0, 100.6, 101.7],
  [101.7, 102.4, 101.0, 101.3],
  [101.3, 102.6, 101.1, 102.3],
  [102.3, 103.6, 102.1, 103.3],
  [103.3, 103.5, 102.3, 102.6],
  [102.6, 103.8, 102.4, 103.5],
  [103.5, 104.8, 103.3, 104.5],
  [104.5, 104.7, 103.5, 103.8],
  [103.8, 105.0, 103.6, 104.7],
  [104.7, 105.9, 104.5, 105.6], // range high 105.9
  [105.6, 105.8, 104.6, 104.9],
  [104.9, 106.0, 104.7, 105.7],
  [105.7, 106.8, 105.5, 106.5], // sweep of the high
  [106.5, 106.6, 104.8, 105.0], // rejection
], '2025-03-03');
const drT = (i: number) => DR[i].time;

// Opening range breakout (ORB) — first-hour range, then the breakout.
const ORB = toCandles([
  [100.0, 100.4, 99.6, 100.1],
  [100.1, 100.6, 99.8, 100.4],
  [100.4, 100.5, 99.7, 99.9],
  [99.9, 101.6, 99.8, 101.3], // breakout above the range
  [101.3, 103.2, 101.1, 102.9],
  [102.9, 104.8, 102.7, 104.5],
], '2025-03-03');
const orbT = (i: number) => ORB[i].time;

// Liquidity void — a price gap with no trading, often revisited.
const VOID = toCandles([
  [103.0, 103.8, 102.4, 103.5],
  [103.5, 104.2, 102.8, 103.1],
  [103.1, 103.4, 102.0, 102.3],
  [102.3, 102.6, 101.2, 101.5],
  [105.5, 105.8, 104.6, 104.8], // void gap up
  [104.8, 104.9, 102.8, 103.0],
  [103.0, 103.2, 101.8, 102.0], // filling the void
  [102.0, 104.4, 101.8, 104.1], // rejection from the void
], '2025-03-03');
const voidT = (i: number) => VOID[i].time;

// Buy-side liquidity — stop hunts resting above the swing high.
const BSL = toCandles([
  [100.0, 101.0, 99.4, 100.8],
  [100.8, 102.0, 100.6, 101.7],
  [101.7, 102.4, 101.0, 101.3],
  [101.3, 102.6, 101.1, 102.3],
  [102.3, 103.6, 102.1, 103.3], // swing high 103.6
  [103.3, 103.5, 102.3, 102.6],
  [102.6, 102.8, 101.8, 102.1],
  [102.1, 105.2, 102.0, 104.9], // sweep of buy-side liquidity
  [104.9, 105.0, 102.8, 103.0],
  [103.0, 103.2, 101.2, 101.4], // reversal
], '2025-03-03');
const bslT = (i: number) => BSL[i].time;

// Sell-side liquidity — stop hunts resting below the swing low.
const SSL = toCandles([
  [105.5, 106.2, 104.4, 105.9],
  [105.9, 106.4, 104.6, 104.9],
  [104.9, 105.2, 103.2, 103.5],
  [103.5, 103.8, 101.8, 102.1],
  [102.1, 102.3, 100.6, 100.9], // swing low 100.6
  [100.9, 101.0, 98.6, 99.8], // sweep of sell-side liquidity
  [99.8, 102.6, 99.6, 102.3], // reversal
  [102.3, 104.4, 102.1, 104.1],
], '2025-03-03');
const sslT = (i: number) => SSL[i].time;

// Inverse FVG — bearish gap between candle 1's low and candle 3's high.
const IFVG = toCandles([
  [103.0, 103.8, 102.6, 103.5],
  [103.5, 103.6, 101.8, 102.0],
  [102.0, 102.1, 100.2, 100.4], // IFVG between 102.1 and 102.6
  [100.4, 102.5, 100.2, 102.3], // pullback fills the gap
  [102.3, 102.4, 100.6, 100.8], // rejection
  [100.8, 101.0, 99.0, 99.2],
], '2025-03-03');
const ifvgT = (i: number) => IFVG[i].time;

// Concealed FVG — displacement that leaves a smaller, hidden imbalance.
const CFVG = toCandles([
  [100.0, 100.8, 99.4, 100.5],
  [100.5, 101.4, 100.2, 101.1],
  [101.1, 101.8, 100.4, 100.7],
  [100.7, 103.0, 100.5, 102.7], // displacement 1
  [102.7, 104.8, 102.5, 104.5], // displacement 2
  [104.5, 106.2, 104.3, 105.9], // displacement 3 — CFVG 103.0–104.3
  [105.9, 106.0, 103.4, 103.6], // pullback into the gap
  [103.6, 106.0, 103.4, 105.7], // rejection
], '2025-03-03');
const cfvgT = (i: number) => CFVG[i].time;

// Displacement — the strong impulsive leg that fuels the move.
const DISP = toCandles([
  [102.0, 102.6, 101.2, 102.3],
  [102.3, 102.8, 101.6, 101.9],
  [101.9, 102.2, 101.0, 101.3],
  [101.3, 104.6, 101.1, 104.3], // displacement
  [104.3, 107.2, 104.1, 106.9],
  [106.9, 109.4, 106.7, 109.1],
], '2025-03-03');
const dispT = (i: number) => DISP[i].time;

// Turtle soup — buying the stop-run below a level.
const SOUP = toCandles([
  [104.0, 104.8, 103.2, 104.5],
  [104.5, 105.0, 103.4, 103.7],
  [103.7, 104.0, 102.4, 102.7],
  [102.7, 103.0, 101.4, 101.7],
  [101.7, 102.0, 100.6, 100.9],
  [100.9, 101.1, 99.6, 99.9],
  [99.9, 100.1, 98.4, 99.5], // sweep stops below 100
  [99.5, 102.0, 99.3, 101.7], // turtle soup long
  [101.7, 104.2, 101.5, 103.9],
], '2025-03-03');
const soupT = (i: number) => SOUP[i].time;

// Point of interest — a confluence zone (OB + EQ) where price reacts.
const POI = toCandles([
  [107.0, 107.8, 106.2, 107.5],
  [107.5, 108.0, 106.4, 106.7],
  [106.7, 107.0, 105.2, 105.5],
  [105.5, 105.7, 103.8, 104.1],
  [104.1, 104.3, 102.6, 102.9], // POI zone 102.6–104.3
  [102.9, 104.0, 102.7, 103.7], // reaction at the POI
  [103.7, 105.6, 103.5, 105.3],
], '2025-03-03');
const poiT = (i: number) => POI[i].time;

// Order flow — absorption at the lows, then expansion.
const OFLOW = toCandlesWithVolume([
  [103.0, 103.6, 102.2, 103.3, 8000],
  [103.3, 103.8, 102.4, 102.7, 9000],
  [102.7, 103.0, 101.4, 101.7, 9500],
  [101.7, 101.9, 100.4, 100.7, 11000],
  [100.7, 100.9, 99.4, 99.7, 14000],
  [99.7, 100.6, 99.2, 100.4, 18000], // absorption — wide spread, upper-half close
  [100.4, 102.4, 100.2, 102.1, 12000], // expansion
  [102.1, 104.0, 101.9, 103.7, 11000],
], '2025-03-03');
const oflowT = (i: number) => OFLOW[i].time;

// HTF bias — daily structure that sets the intraday direction.
const HTF = toCandles([
  [100.0, 101.0, 99.4, 100.8],
  [100.8, 102.0, 100.6, 101.7],
  [101.7, 102.4, 101.0, 101.3],
  [101.3, 102.8, 101.1, 102.5],
  [102.5, 103.6, 102.3, 103.3],
  [103.3, 103.5, 102.3, 102.6],
  [102.6, 104.2, 102.4, 103.9],
  [103.9, 105.0, 103.7, 104.7],
], '2025-03-03');
const htfT = (i: number) => HTF[i].time;

// Asia range — the overnight range, then the London breakout.
const ASIA = toCandles([
  [100.0, 100.3, 99.7, 100.1],
  [100.1, 100.4, 99.8, 100.2],
  [100.2, 100.3, 99.7, 99.9],
  [99.9, 100.2, 99.6, 100.0],
  [100.0, 100.1, 99.5, 99.8],
  [99.8, 100.0, 99.6, 99.9],
  [99.9, 101.0, 99.8, 100.7], // London breakout
  [100.7, 101.8, 100.5, 101.5],
  [101.5, 102.6, 101.3, 102.3],
], '2025-03-03');
const asiaT = (i: number) => ASIA[i].time;

// Consolidation — liquidity building before expansion.
const CONSOL = toCandles([
  [103.0, 103.6, 102.4, 103.3],
  [103.3, 103.8, 102.6, 102.9],
  [102.9, 103.2, 102.2, 102.5],
  [102.5, 102.8, 101.8, 102.1],
  [102.1, 102.6, 101.8, 102.3],
  [102.3, 102.7, 101.9, 102.2],
  [102.2, 104.6, 102.0, 104.3], // expansion
  [104.3, 106.4, 104.1, 106.1],
], '2025-03-03');
const consolT = (i: number) => CONSOL[i].time;

/* ---------------------------------------------------------------------------
 * Batch D — Indicators
 * ------------------------------------------------------------------------- */

// Steady uptrend (trend-following indicators).
const TREND1 = generateSeries(40, '2025-04-01', {
  startPrice: 100,
  drift: 0.4,
  amplitude: 1.2,
  frequency: 0.18,
  noise: 0.4,
  seed: 11,
});
const trend1T = (i: number) => TREND1[i].time;

// Steady downtrend.
const TREND2 = generateSeries(40, '2025-04-01', {
  startPrice: 108,
  drift: -0.35,
  amplitude: 1.1,
  frequency: 0.2,
  noise: 0.4,
  seed: 23,
});
const trend2T = (i: number) => TREND2[i].time;

// Range-bound series (oscillator indicators).
const RANGE = generateSeries(40, '2025-04-01', {
  startPrice: 100,
  drift: 0,
  amplitude: 2.2,
  frequency: 0.3,
  noise: 0.4,
  seed: 7,
});
const rangeT = (i: number) => RANGE[i].time;

// ATR — quiet consolidation then a volatility expansion.
const ATR_D = toCandles([
  [100.0, 100.5, 99.5, 100.2],
  [100.2, 100.6, 99.6, 100.0],
  [100.0, 100.4, 99.4, 99.8],
  [99.8, 100.2, 99.2, 99.6],
  [99.6, 100.0, 99.0, 99.4],
  [99.4, 99.8, 98.8, 99.2],
  [99.2, 100.8, 99.0, 100.6], // volatility expansion
  [100.6, 103.2, 100.4, 102.9],
  [102.9, 105.4, 102.7, 105.1],
], '2025-04-01');
const atrT = (i: number) => ATR_D[i].time;

// VWAP — trending series with a sloping anchor line.
const VWAP_D = toCandles([
  [100.0, 100.6, 99.4, 100.3],
  [100.3, 100.9, 99.8, 100.6],
  [100.6, 101.5, 100.3, 101.2],
  [101.2, 102.1, 100.9, 101.8],
  [101.8, 102.7, 101.5, 102.4],
  [102.4, 103.3, 102.1, 103.0],
  [103.0, 103.9, 102.7, 103.6],
  [103.6, 104.5, 103.3, 104.2],
], '2025-04-01');
const vwapT = (i: number) => VWAP_D[i].time;

// OBV / MFI — decline with volume divergence at the bottom.
const OBV_D = toCandlesWithVolume([
  [106.0, 106.8, 105.0, 106.5, 9000],
  [106.5, 107.0, 105.2, 105.5, 10000],
  [105.5, 105.8, 104.0, 104.3, 12000],
  [104.3, 104.6, 102.6, 102.9, 13500],
  [102.9, 103.1, 101.2, 101.5, 15000],
  [101.5, 101.7, 99.8, 100.1, 17000],
  [100.1, 100.3, 98.6, 98.9, 19000], // capitulation volume
  [98.9, 100.4, 98.7, 100.1, 8000], // lower volume bounce
  [100.1, 101.6, 99.9, 101.3, 7000],
  [101.3, 103.0, 101.1, 102.7, 6500], // price makes HH, volume dries
], '2025-04-01');
const obvT = (i: number) => OBV_D[i].time;

// Bollinger squeeze — tight bands then a breakout.
const SQUEEZE = toCandles([
  [100.0, 100.4, 99.6, 100.1],
  [100.1, 100.5, 99.7, 100.3],
  [100.3, 100.6, 99.8, 100.0],
  [100.0, 100.3, 99.7, 100.1],
  [100.1, 100.5, 99.9, 100.4],
  [100.4, 100.7, 100.0, 100.2],
  [100.2, 100.5, 99.9, 100.3], // squeeze
  [100.3, 100.6, 100.0, 100.1],
  [100.1, 102.2, 100.0, 102.0], // expansion up
  [102.0, 104.2, 101.8, 104.0],
  [104.0, 106.0, 103.8, 105.7],
], '2025-04-01');
const squeezeT = (i: number) => SQUEEZE[i].time;

/* ---------------------------------------------------------------------------
 * Batch E — Harmonics / Elliott
 * ------------------------------------------------------------------------- */

// Deep Crab — D extends below X (the “deep” part of the pattern).
const DCRAB = toCandles([
  [99.4, 100.4, 99.2, 100.2], // X (low 99.2)
  [100.2, 101.6, 99.9, 101.3],
  [101.3, 102.8, 101.0, 102.5],
  [102.5, 104.2, 102.2, 103.9],
  [103.9, 105.6, 103.6, 105.3],
  [105.3, 107.2, 105.0, 106.9],
  [106.9, 108.8, 106.6, 108.5],
  [108.5, 110.4, 108.2, 110.1],
  [110.1, 111.8, 109.8, 111.5],
  [111.5, 112.6, 111.2, 112.2], // A (high 112.6)
  [112.2, 112.3, 110.0, 110.2],
  [110.2, 110.4, 107.6, 107.8],
  [107.8, 108.0, 105.2, 105.4],
  [105.4, 105.6, 103.0, 103.2], // B (low 103.0 — deep retrace)
  [103.2, 106.0, 103.0, 105.7],
  [105.7, 108.2, 105.5, 107.9],
  [107.9, 109.8, 107.7, 109.5], // C (high 109.8)
  [109.5, 109.6, 106.8, 107.0],
  [107.0, 107.2, 104.0, 104.2],
  [104.2, 104.4, 101.2, 101.4],
  [101.4, 101.6, 98.4, 98.6], // D (low 98.4 — below X)
  [98.6, 102.0, 98.4, 101.7],
  [101.7, 104.6, 101.5, 104.3],
], '2025-05-05');
const dcrabT = (i: number) => DCRAB[i].time;

// 5-0 — X-A-B-C-D with B beyond A and D shallow.
const FIVEO = toCandles([
  [100.0, 100.8, 99.4, 100.5], // X
  [100.5, 102.4, 100.3, 102.1], // A
  [102.1, 102.2, 100.2, 100.4], // B (below X)
  [100.4, 103.6, 100.2, 103.3], // C (above A)
  [103.3, 103.4, 101.6, 101.8], // D (shallow — above B)
  [101.8, 104.4, 101.6, 104.1], // reversal
  [104.1, 106.0, 103.9, 105.7],
], '2025-05-05');
const fiveoT = (i: number) => FIVEO[i].time;

// Three drives — three rising drives with pullbacks, ending in exhaustion.
const TDRIVES = toCandles([
  [100.0, 100.8, 99.4, 100.5], // start
  [100.5, 102.2, 100.3, 101.9], // drive 1
  [101.9, 102.0, 101.0, 101.2], // pullback 1
  [101.2, 103.4, 101.0, 103.1], // drive 2 (higher)
  [103.1, 103.2, 102.2, 102.4], // pullback 2
  [102.4, 104.8, 102.2, 104.5], // drive 3 (highest)
  [104.5, 104.6, 102.6, 102.8], // exhaustion
  [102.8, 103.0, 101.2, 101.4],
], '2025-05-05');
const tdrivesT = (i: number) => TDRIVES[i].time;

// Nenstar — X-A-B-C-D with D ending near the X level.
const NENSTAR = toCandles([
  [100.0, 100.8, 99.4, 100.5], // X
  [100.5, 102.6, 100.3, 102.3], // A
  [102.3, 102.4, 100.6, 100.8], // B
  [100.8, 103.2, 100.6, 102.9], // C
  [102.9, 103.0, 101.2, 101.4],
  [101.4, 101.6, 99.6, 99.8], // D (near X)
  [99.8, 102.4, 99.6, 102.1], // reversal
  [102.1, 104.2, 101.9, 103.9],
], '2025-05-05');
const nenstarT = (i: number) => NENSTAR[i].time;

// Alternate Bat — D pushes beyond A (1.13 of XA).
const ABAT = toCandles([
  [100.0, 100.8, 99.4, 100.5], // X
  [100.5, 103.4, 100.3, 103.1], // A
  [103.1, 103.2, 101.4, 101.6], // B
  [101.6, 104.0, 101.4, 103.7], // C
  [103.7, 103.8, 102.0, 102.2],
  [102.2, 102.4, 100.6, 100.8],
  [100.8, 101.0, 99.4, 99.6],
  [99.6, 105.2, 99.4, 104.9], // D (beyond A)
  [104.9, 105.0, 102.8, 103.0], // reversal
  [103.0, 103.2, 101.2, 101.4],
], '2025-05-05');
const abatT = (i: number) => ABAT[i].time;

// Anti-Butterfly — like a butterfly but D extends below X (2.0 of XA).
const ABFLY = toCandles([
  [100.0, 100.8, 99.4, 100.5], // X
  [100.5, 102.2, 100.3, 101.9],
  [101.9, 103.6, 101.7, 103.3],
  [103.3, 105.2, 103.1, 104.9], // A (high 105.2)
  [104.9, 105.0, 103.0, 103.2], // B
  [103.2, 104.4, 103.0, 104.1],
  [104.1, 104.2, 102.4, 102.6], // C (high 104.2)
  [102.6, 102.8, 101.0, 101.2],
  [101.2, 101.4, 99.4, 99.6],
  [99.6, 99.8, 97.8, 98.0], // D (low 97.8 — below X)
  [98.0, 101.6, 97.8, 101.3], // reversal
  [101.3, 103.6, 101.1, 103.3],
], '2025-05-05');
const abflyT = (i: number) => ABFLY[i].time;

// Elliott zigzag — sharp 5-3-5 correction.
const ZIGZAG = toCandles([
  [108.0, 108.8, 107.2, 108.5],
  [108.5, 109.0, 107.4, 107.7],
  [107.7, 108.0, 106.2, 106.5],
  [106.5, 106.8, 105.0, 105.3],
  [105.3, 105.5, 103.8, 104.0], // wave A (5 down)
  [104.0, 105.2, 103.8, 104.9],
  [104.9, 105.8, 104.7, 105.5],
  [105.5, 106.2, 105.3, 106.0], // wave B (3 up)
  [106.0, 106.1, 104.4, 104.6],
  [104.6, 104.8, 103.0, 103.2],
  [103.2, 103.4, 101.6, 101.8],
  [101.8, 102.0, 100.2, 100.4],
  [100.4, 100.6, 98.8, 99.0], // wave C (5 down)
], '2025-05-05');
const zigzagT = (i: number) => ZIGZAG[i].time;

// Elliott flat — sideways 3-3-5 correction.
const FLAT = toCandles([
  [103.0, 103.8, 102.4, 103.5],
  [103.5, 103.8, 102.4, 102.6],
  [102.6, 102.9, 101.7, 101.9], // wave A (3 down, shallow)
  [101.9, 103.0, 101.7, 102.7],
  [102.7, 103.6, 102.5, 103.3],
  [103.3, 103.9, 103.1, 103.7], // wave B (3 up, back to high)
  [103.7, 103.8, 102.4, 102.6],
  [102.6, 102.8, 101.6, 101.8],
  [101.8, 102.0, 100.8, 101.0],
  [101.0, 101.2, 100.2, 100.4],
  [100.4, 100.6, 99.6, 99.8], // wave C (5 down)
], '2025-05-05');
const flatT = (i: number) => FLAT[i].time;

// Elliott contracting triangle — 3-3-3-3-3, then breakout.
const TRI = toCandles([
  [100.0, 100.8, 99.2, 100.5], // 1 (high 100.8)
  [100.5, 100.9, 99.6, 100.1], // 2 (low 99.6)
  [100.1, 100.6, 99.4, 99.7], // 3 (high 100.6 — lower)
  [99.7, 100.1, 99.7, 99.9], // 4 (low 99.7 — higher)
  [99.9, 100.3, 99.6, 99.8], // 5 (high 100.3 — lower)
  [99.8, 100.0, 99.8, 99.9], // 6 (low 99.8 — higher)
  [99.9, 101.6, 99.8, 101.3], // breakout
  [101.3, 103.0, 101.1, 102.7],
], '2025-05-05');
const triT = (i: number) => TRI[i].time;

// Elliott ending diagonal — wedge with overlapping waves, then reversal.
const DIAG = toCandles([
  [100.0, 101.2, 99.8, 100.9], // 1
  [100.9, 101.0, 100.2, 100.4], // 2 (deep overlap)
  [100.4, 102.2, 100.2, 101.9], // 3
  [101.9, 102.0, 101.2, 101.4], // 4 (overlaps 1)
  [101.4, 102.8, 101.2, 102.6], // 5 (new high, wedge)
  [102.6, 102.7, 100.6, 100.8], // reversal
  [100.8, 101.0, 98.8, 99.0],
], '2025-05-05');
const diagT = (i: number) => DIAG[i].time;

// Elliott extension — wave 3 extended (the longest wave).
const EXT = toCandles([
  [100.0, 101.0, 99.6, 100.8], // 1
  [100.8, 101.0, 100.0, 100.2], // 2
  [100.2, 102.6, 100.0, 102.3], // 3-i
  [102.3, 102.5, 101.5, 101.7], // 3-ii
  [101.7, 104.4, 101.5, 104.1], // 3-iii
  [104.1, 104.3, 103.1, 103.3], // 3-iv
  [103.3, 106.2, 103.1, 105.9], // 3-v (extended)
  [105.9, 106.0, 104.8, 105.0], // 4
  [105.0, 106.6, 104.8, 106.3], // 5
], '2025-05-05');
const extT = (i: number) => EXT[i].time;

// Elliott WXY — double zigzag correction.
const WXY = toCandles([
  [108.0, 108.8, 107.2, 108.5],
  [108.5, 108.9, 107.3, 107.6],
  [107.6, 107.9, 106.1, 106.4],
  [106.4, 106.7, 104.9, 105.2],
  [105.2, 105.4, 103.6, 103.8], // wave W
  [103.8, 105.0, 103.6, 104.7],
  [104.7, 105.6, 104.5, 105.3],
  [105.3, 105.8, 105.1, 105.6], // wave X
  [105.6, 105.7, 104.0, 104.2],
  [104.2, 104.4, 102.6, 102.8],
  [102.8, 103.0, 101.2, 101.4],
  [101.4, 101.6, 99.8, 100.0],
  [100.0, 100.2, 98.4, 98.6], // wave Y
], '2025-05-05');
const wxyT = (i: number) => WXY[i].time;

/* ---------------------------------------------------------------------------
 * Batch F — New categories (theory, price action, risk, styles)
 * ------------------------------------------------------------------------- */

// Dow Theory — a long trending series with primary / secondary waves.
const DOW = generateSeries(50, '2025-06-02', {
  startPrice: 100,
  drift: 0.35,
  amplitude: 1.6,
  frequency: 0.12,
  noise: 0.5,
  seed: 5,
});
const dowT = (i: number) => DOW[i].time;

// Gann — clean uptrend for the angle fan.
const GANN_D = toCandles([
  [100.0, 100.6, 99.6, 100.4],
  [100.4, 101.0, 100.0, 100.8],
  [100.8, 101.4, 100.4, 101.2],
  [101.2, 101.8, 100.8, 101.6],
  [101.6, 102.2, 101.2, 102.0],
  [102.0, 102.6, 101.6, 102.4],
  [102.4, 103.0, 102.0, 102.8],
  [102.8, 103.4, 102.4, 103.2],
  [103.2, 103.8, 102.8, 103.6],
  [103.6, 104.2, 103.2, 104.0],
  [104.0, 104.6, 103.6, 104.4],
  [104.4, 105.0, 104.0, 104.8],
], '2025-06-02');
const gannT = (i: number) => GANN_D[i].time;

// Market profile — a range with a distinct value area (volume-weighted).
const MP_D = toCandlesWithVolume([
  [102.0, 103.0, 101.0, 102.6, 8000],
  [102.6, 104.0, 102.2, 103.6, 9500],
  [103.6, 104.4, 102.8, 103.0, 11000],
  [103.0, 103.6, 101.4, 101.8, 12500],
  [101.8, 102.6, 100.8, 102.2, 14000],
  [102.2, 103.4, 101.6, 103.0, 12000],
  [103.0, 104.2, 102.6, 103.8, 11500],
  [103.8, 104.6, 103.2, 103.4, 13000],
  [103.4, 104.0, 102.0, 102.4, 15000],
  [102.4, 103.2, 101.2, 102.8, 16500],
  [102.8, 104.0, 102.4, 103.6, 14500],
  [103.6, 104.4, 103.0, 103.2, 12500],
  [103.2, 103.8, 101.6, 102.0, 11000],
  [102.0, 102.8, 100.8, 102.4, 12000],
  [102.4, 103.6, 102.0, 103.2, 10500],
  [103.2, 104.2, 102.8, 103.8, 11500],
], '2025-06-02');
const mpT = (i: number) => MP_D[i].time;

// Auction market theory — balance, imbalance, re-balance.
const AMT = toCandles([
  [100.0, 100.8, 99.4, 100.5],
  [100.5, 101.2, 100.0, 100.3],
  [100.3, 100.9, 99.7, 100.6],
  [100.6, 101.1, 99.9, 100.2],
  [100.2, 101.8, 100.0, 101.5], // imbalance — trend leg
  [101.5, 103.2, 101.3, 102.9],
  [102.9, 104.4, 102.7, 104.1],
  [104.1, 104.8, 103.6, 103.9], // re-balance
  [103.9, 104.6, 103.4, 104.3],
  [104.3, 105.0, 103.9, 104.6],
], '2025-06-02');
const amtT = (i: number) => AMT[i].time;

// Inside bar — mother bar then inside bars, then a breakout.
const INBAR = toCandles([
  [100.0, 100.8, 99.4, 100.5],
  [100.5, 100.9, 99.9, 100.2], // mother bar (range 99.9–100.9)
  [100.2, 100.6, 100.0, 100.4], // inside bar 1
  [100.4, 100.7, 100.1, 100.3], // inside bar 2
  [100.3, 102.4, 100.2, 102.1], // breakout
  [102.1, 103.6, 101.9, 103.3],
], '2025-06-02');
const inbarT = (i: number) => INBAR[i].time;

// Outside bar — an expansion bar that engulfs the prior range.
const OUTBAR = toCandles([
  [100.0, 100.6, 99.6, 100.3],
  [100.3, 100.7, 99.9, 100.2],
  [100.2, 100.5, 99.7, 100.0],
  [100.0, 101.6, 99.6, 101.3], // outside bar (engulfs)
  [101.3, 102.8, 101.1, 102.5],
  [102.5, 103.8, 102.3, 103.5],
], '2025-06-02');
const outbarT = (i: number) => OUTBAR[i].time;

// Fakey — false breakout of an inside bar range, then reversal.
const FAKEY = toCandles([
  [100.0, 100.8, 99.4, 100.5],
  [100.5, 100.9, 99.9, 100.2], // mother bar
  [100.2, 100.4, 99.6, 100.0], // fake breakout below 99.9
  [100.0, 102.2, 99.8, 101.9], // reversal
  [101.9, 103.4, 101.7, 103.1],
], '2025-06-02');
const fakeyT = (i: number) => FAKEY[i].time;

// 1-2-3 reversal — new low, rally, higher low, break of the rally high.
const P123 = toCandles([
  [104.0, 105.0, 103.2, 104.6],
  [104.6, 105.0, 103.4, 103.7],
  [103.7, 104.0, 102.4, 102.7],
  [102.7, 103.0, 101.4, 101.7],
  [101.7, 101.9, 100.4, 100.7], // point 1 — low 100.4
  [100.7, 102.6, 100.5, 102.3], // point 2 — high 102.6
  [102.3, 102.4, 101.4, 101.6], // point 3 — higher low 101.4
  [101.6, 103.2, 101.4, 102.9], // break of point 2
], '2025-06-02');
const p123T = (i: number) => P123[i].time;

// Pin bar — long wick rejection inside a pullback.
const PINBAR = toCandles([
  [100.0, 100.8, 99.4, 100.5],
  [100.5, 101.8, 100.3, 101.5],
  [101.5, 102.6, 101.3, 102.3],
  [102.3, 102.5, 101.3, 101.5], // pullback
  [101.5, 101.7, 99.4, 101.4], // pin bar — long lower wick
  [101.4, 103.0, 101.2, 102.7],
  [102.7, 104.2, 102.5, 103.9],
], '2025-06-02');
const pinbarT = (i: number) => PINBAR[i].time;

// Swing trading — a multi-week trending series.
const SWING = generateSeries(60, '2025-06-02', {
  startPrice: 100,
  drift: 0.25,
  amplitude: 1.8,
  frequency: 0.08,
  noise: 0.55,
  seed: 31,
});
const swingT = (i: number) => SWING[i].time;

// Scalping — a tight intraday range with quick swings.
const SCALP = toCandles([
  [100.0, 100.5, 99.7, 100.3],
  [100.3, 100.7, 99.9, 100.1],
  [100.1, 100.4, 99.8, 100.2],
  [100.2, 100.6, 100.0, 100.4],
  [100.4, 100.8, 100.1, 100.3],
  [100.3, 100.6, 99.9, 100.1],
  [100.1, 100.5, 99.9, 100.3],
  [100.3, 100.7, 100.0, 100.2],
  [100.2, 100.6, 99.9, 100.4],
  [100.4, 100.9, 100.2, 100.7],
], '2025-06-02');
const scalpT = (i: number) => SCALP[i].time;

export const EXTRA_SCENARIOS: Record<string, ConceptScenario> = {
  // ---- Batch A: candlestick patterns ----
  'candle-hanging-man': {
    candles: HANG,
    title: { en: 'Hanging Man', th: 'Hanging Man (คนแขวนคอ)' },
    summary: {
      en: 'A bearish reversal candle that appears at the top of an uptrend: a small body with a long lower wick, looking like a hammer but in the wrong place.',
      th: 'แท่งกลับตัวขาลงที่ปรากฏบนยอดของเทรนด์ขึ้น: ตัวแท่งเล็ก มีไส้เทียนล่างยาวมาก เหมือน Hammer แต่เกิดผิดที่ (บนยอด) จึงเป็นสัญญาณขาย',
    },
    keyPoints: [
      { en: 'Appears after an extended rally.', th: 'เกิดหลังราคาขึ้นแรงต่อเนื่อง' },
      { en: 'Long lower wick = sellers rejected the highs.', th: 'ไส้เทียนยาว = มีแรงขายทิ้ง' },
      { en: 'Confirmation: next candle closes below the body.', th: 'ยืนยันเมื่อแท่งถัดไปปิดต่ำกว่าตัวแท่ง' },
    ],
    markers: [{ time: hangT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Hanging Man', th: 'Hanging Man' } }],
    legend: [{ label: 'Hanging Man', color: COLORS.bear }],
  },
  'candle-inverted-hammer': {
    candles: IH,
    title: { en: 'Inverted Hammer', th: 'Inverted Hammer (ค้อนกลับหัว)' },
    summary: {
      en: 'A bullish reversal candle at the bottom of a downtrend: a small body with a long upper wick, showing buyers testing the highs after heavy selling.',
      th: 'แท่งกลับตัวขาขึ้นที่ก้นของเทรนด์ลง: ตัวแท่งเล็ก มีไส้เทียนบนยาว แสดงว่ามีแรงซื้อทดสอบด้านบนหลังแรงขายหนัก',
    },
    keyPoints: [
      { en: 'Appears after a sell-off.', th: 'เกิดหลังราคาร่วงต่อเนื่อง' },
      { en: 'Long upper wick = buyers pushed price up.', th: 'ไส้เทียนบนยาว = ผู้ซื้อดันราคาขึ้น' },
      { en: 'Needs a bullish confirmation candle.', th: 'ต้องรอแท่งยืนยันขาขึ้นก่อน' },
    ],
    markers: [{ time: ihT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Inverted Hammer', th: 'Inverted Hammer' } }],
    legend: [{ label: 'Inverted Hammer', color: COLORS.bull }],
  },
  'candle-spinning-top': {
    candles: SPIN,
    title: { en: 'Spinning Top', th: 'Spinning Top (ลูกข่าง)' },
    summary: {
      en: 'A tiny body with wicks on both sides — the market is undecided. After a strong trend it often marks the start of a pause or reversal.',
      th: 'ตัวแท่งเล็กมาก มีไส้เทียนทั้งบนและล่าง หมายถึงตลาดลังเล มักเกิดก่อนการพักหรือกลับตัวหลังเทรนด์แรง',
    },
    keyPoints: [
      { en: 'Open and close nearly equal.', th: 'เปิด-ปิดเกือบเท่ากัน' },
      { en: 'Both buyers and sellers were rejected.', th: 'ทั้งซื้อและขายถูกปฏิเสธ' },
      { en: 'Strongest signal after a trend with volume.', th: 'เชื่อถือได้มากเมื่อเกิดหลังเทรนด์ชัดเจน' },
    ],
    markers: [{ time: spinT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.amber, text: { en: 'Spinning Top', th: 'Spinning Top' } }],
    legend: [{ label: 'Spinning Top', color: COLORS.amber }],
  },
  'candle-dragonfly-doji': {
    candles: DRAG,
    title: { en: 'Dragonfly Doji', th: 'Dragonfly Doji (แมลงปอ)' },
    summary: {
      en: 'Open, high and close are nearly equal at the top of the range with a very long lower wick — at a bottom, it signals buyers defending the lows.',
      th: 'เปิด-ปิด-สูง เกือบเท่ากันที่ด้านบน มีไส้เทียนล่างยาวมาก ที่ก้นตลาดแสดงว่าผู้ซื้อปกป้องแนวรับไว้ได้',
    },
    keyPoints: [
      { en: 'A doji with an extreme lower wick.', th: 'โดจิที่มีไส้เทียนล่างยาวผิดปกติ' },
      { en: 'At a bottom: bullish reversal signal.', th: 'ที่ก้น: สัญญาณกลับตัวขึ้น' },
      { en: 'Stronger with volume confirmation.', th: 'แข็งแรงขึ้นเมื่อมีวอลุ่มยืนยัน' },
    ],
    markers: [{ time: dragT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Dragonfly Doji', th: 'Dragonfly Doji' } }],
    legend: [{ label: 'Dragonfly Doji', color: COLORS.bull }],
  },
  'candle-gravestone-doji': {
    candles: GRAV,
    title: { en: 'Gravestone Doji', th: 'Gravestone Doji (หลุมศพ)' },
    summary: {
      en: 'Open, low and close are nearly equal at the bottom of the range with a very long upper wick — at a top, it warns that buyers are exhausted.',
      th: 'เปิด-ปิด-ต่ำ เกือบเท่ากันที่ด้านล่าง มีไส้เทียนบนยาวมาก ที่ยอดตลาดเตือนว่าแรงซื้อหมดแล้ว',
    },
    keyPoints: [
      { en: 'A doji with an extreme upper wick.', th: 'โดจิที่มีไส้เทียนบนยาวผิดปกติ' },
      { en: 'At a top: bearish reversal signal.', th: 'ที่ยอด: สัญญาณกลับตัวลง' },
      { en: 'Sellers rejected the highs.', th: 'ผู้ขายปฏิเสธระดับสูง' },
    ],
    markers: [{ time: gravT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Gravestone Doji', th: 'Gravestone Doji' } }],
    legend: [{ label: 'Gravestone Doji', color: COLORS.bear }],
  },
  'candle-long-legged-doji': {
    candles: LLEG,
    title: { en: 'Long-Legged Doji', th: 'Long-Legged Doji (โดจิขายาว)' },
    summary: {
      en: 'Open and close at the center with very long wicks on both sides — extreme volatility and total indecision, often marking a turning point.',
      th: 'เปิด-ปิดตรงกลาง มีไส้เทียนยาวทั้งสองด้าน สื่อถึงความผันผวนสูงสุดและความลังเล มักเกิดที่จุดเปลี่ยนเทรนด์',
    },
    keyPoints: [
      { en: 'Price travelled far but closed flat.', th: 'ราคาไปไกลแต่ปิดกลับที่เดิม' },
      { en: 'Both sides fully rejected.', th: 'ทั้งสองฝ่ายถูกปฏิเสธเต็ม ๆ' },
      { en: 'Watch for the next candle direction.', th: 'รอดูทิศทางแท่งถัดไป' },
    ],
    markers: [{ time: llegT(3), position: 'aboveBar', shape: 'arrowDown', color: COLORS.amber, text: { en: 'Long-Legged Doji', th: 'Long-Legged Doji' } }],
    legend: [{ label: 'Long-Legged Doji', color: COLORS.amber }],
  },
  'candle-tweezer-top': {
    candles: TZR_TOP,
    title: { en: 'Tweezer Top', th: 'Tweezer Top (ยอดแหนบ)' },
    summary: {
      en: 'Two candles share the same high at the top of an uptrend — price was rejected twice at the exact same level, a bearish reversal warning.',
      th: 'แท่งสองแท่งมีจุดสูงสุดเท่ากันบนยอดเทรนด์ขึ้น ราคาถูกปฏิเสธซ้ำสองครั้งที่ระดับเดียวกัน เป็นสัญญาณเตือนกลับตัวลง',
    },
    keyPoints: [
      { en: 'Identical highs on consecutive candles.', th: 'จุดสูงสุดเท่ากันสองแท่งติดกัน' },
      { en: 'Second candle often bearish.', th: 'แท่งที่สองมักเป็นแท่งขาลง' },
      { en: 'Double rejection = supply at that level.', th: 'ถูกปฏิเสธสองครั้ง = มีซัปพลาย' },
    ],
    markers: [{ time: tzrTopT(5), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Tweezer Top', th: 'Tweezer Top' } }],
    legend: [{ label: 'Tweezer Top', color: COLORS.bear }],
  },
  'candle-tweezer-bottom': {
    candles: TZR_BOT,
    title: { en: 'Tweezer Bottom', th: 'Tweezer Bottom (ก้นแหนบ)' },
    summary: {
      en: 'Two candles share the same low at the bottom of a downtrend — price was defended twice at the exact same level, a bullish reversal signal.',
      th: 'แท่งสองแท่งมีจุดต่ำสุดเท่ากันที่ก้นเทรนด์ลง ราคาถูกปกป้องสองครั้งที่ระดับเดียวกัน เป็นสัญญาณกลับตัวขึ้น',
    },
    keyPoints: [
      { en: 'Identical lows on consecutive candles.', th: 'จุดต่ำสุดเท่ากันสองแท่งติดกัน' },
      { en: 'Second candle often bullish.', th: 'แท่งที่สองมักเป็นแท่งขาขึ้น' },
      { en: 'Double defense = demand at that level.', th: 'ปกป้องสองครั้ง = มีดีมานด์' },
    ],
    markers: [{ time: tzrBotT(5), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Tweezer Bottom', th: 'Tweezer Bottom' } }],
    legend: [{ label: 'Tweezer Bottom', color: COLORS.bull }],
  },
  'candle-piercing-line': {
    candles: PIRC,
    title: { en: 'Piercing Line', th: 'Piercing Line (แทงทะลุ)' },
    summary: {
      en: 'In a downtrend a bullish candle opens below the prior low and closes above the midpoint of the prior bearish body — buyers took control mid-way.',
      th: 'ในเทรนด์ลง แท่งเขียวเปิดต่ำกว่า Low ก่อนหน้าแล้วปิดเหนือกึ่งกลางตัวแท่งแดงก่อนหน้า แสดงว่าผู้ซื้อแย่งควบคุมได้',
    },
    keyPoints: [
      { en: 'Requires a downtrend context.', th: 'ต้องเกิดในเทรนด์ลง' },
      { en: 'Close above 50% of the prior body.', th: 'ปิดเหนือกึ่งกลางแท่งก่อนหน้า' },
      { en: 'Stronger than a plain bullish candle.', th: 'แข็งแรงกว่าแท่งเขียวธรรมดา' },
    ],
    markers: [{ time: pircT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Piercing Line', th: 'Piercing Line' } }],
    legend: [{ label: 'Piercing Line', color: COLORS.bull }],
  },
  'candle-dark-cloud-cover': {
    candles: DARK,
    title: { en: 'Dark Cloud Cover', th: 'Dark Cloud Cover (เมฆดำ)' },
    summary: {
      en: 'In an uptrend a bearish candle opens above the prior high and closes below the midpoint of the prior bullish body — the bearish counterpart of a piercing line.',
      th: 'ในเทรนด์ขึ้น แท่งแดงเปิดเหนือ High ก่อนหน้าแล้วปิดต่ำกว่ากึ่งกลางตัวแท่งเขียวก่อนหน้า เป็นคู่ตรงข้ามของ Piercing Line',
    },
    keyPoints: [
      { en: 'Requires an uptrend context.', th: 'ต้องเกิดในเทรนด์ขึ้น' },
      { en: 'Close below 50% of the prior body.', th: 'ปิดต่ำกว่ากึ่งกลางแท่งก่อนหน้า' },
      { en: 'Signals sellers are taking over.', th: 'ผู้ขายเริ่มคุมตลาด' },
    ],
    markers: [{ time: darkT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Dark Cloud Cover', th: 'Dark Cloud Cover' } }],
    legend: [{ label: 'Dark Cloud Cover', color: COLORS.bear }],
  },
  'candle-kicker': {
    candles: KICK,
    title: { en: 'Kicker', th: 'Kicker (เตะกลับ)' },
    summary: {
      en: 'A gap against the trend followed by a strong opposite candle — an abrupt change of sentiment. The bigger the gap, the stronger the reversal.',
      th: 'ช่องว่างสวนเทรนด์ตามด้วยแท่งที่แข็งแรงทิศตรงข้าม สื่อถึงการเปลี่ยนอารมณ์ตลาดอย่างฉับพลัน ยิ่ง Gap ใหญ่ยิ่งสัญญาณแรง',
    },
    keyPoints: [
      { en: 'Gap up after a downtrend = bullish kicker.', th: 'Gap ขึ้นหลังเทรนด์ลง = สัญญาณซื้อ' },
      { en: 'Strong candle with little wick.', th: 'แท่งแข็งแรงมีไส้เทียนน้อย' },
      { en: 'Often marks a trend change.', th: 'มักเป็นจุดเปลี่ยนเทรนด์' },
    ],
    markers: [{ time: kickT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Bullish Kicker', th: 'Bullish Kicker' } }],
    legend: [{ label: 'Bullish Kicker', color: COLORS.bull }],
  },
  'candle-belt-hold': {
    candles: BELT,
    title: { en: 'Belt Hold (Yokozuna)', th: 'Belt Hold (โยโกซูน่า)' },
    summary: {
      en: 'A single strong candle that opens at its extreme (no wick on the open side) and closes near the other extreme — a decisive one-candle move.',
      th: 'แท่งเดียวที่แข็งแรง เปิดที่จุดสุดขั้ว (ไม่มีไส้เทียนฝั่งเปิด) และปิดใกล้สุดขั้วอีกฝั่ง เป็นการเคลื่อนไหวที่เด็ดขาด',
    },
    keyPoints: [
      { en: 'Bullish belt hold: opens at the low.', th: 'ขาขึ้น: เปิดที่ Low' },
      { en: 'No hesitation at the open.', th: 'ไม่มีความลังเลตอนเปิด' },
      { en: 'Works best at support / after selling.', th: 'ดีที่สุดที่แนวรับหลังแรงขาย' },
    ],
    markers: [{ time: beltT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Belt Hold', th: 'Belt Hold' } }],
    legend: [{ label: 'Belt Hold', color: COLORS.bull }],
  },
  'candle-homing-pigeon': {
    candles: PIGEON,
    title: { en: 'Homing Pigeon', th: 'Homing Pigeon (นกพิราบ)' },
    summary: {
      en: 'Two bearish candles in a downtrend where the second body nests entirely inside the first — selling pressure is fading, a mild bullish hint.',
      th: 'แท่งแดงสองแท่งในเทรนด์ลงโดยแท่งที่สองตัวเล็กอยู่ในตัวแท่งแรก หมายถึงแรงขายเริ่มหมด เป็นสัญญาณขาขึ้นอ่อน ๆ',
    },
    keyPoints: [
      { en: 'Second body inside the first.', th: 'แท่งที่สองอยู่ภายในแท่งแรก' },
      { en: 'Bearish momentum slowing.', th: 'โมเมนตัมขาลงช้าลง' },
      { en: 'Weak signal alone — needs context.', th: 'สัญญาณอ่อน ต้องดูบริบท' },
    ],
    markers: [{ time: pigeonT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Homing Pigeon', th: 'Homing Pigeon' } }],
    legend: [{ label: 'Homing Pigeon', color: COLORS.bull }],
  },
  'candle-matching-low': {
    candles: MATCH,
    title: { en: 'Matching Low', th: 'Matching Low (ก้นเท่ากัน)' },
    summary: {
      en: 'Two bearish candles close at the same low level in a downtrend — the identical closes show a floor forming as sellers fail to push lower.',
      th: 'แท่งแดงสองแท่งปิดที่ระดับต่ำสุดเท่ากันในเทรนด์ลง แสดงว่ากำลังเกิดพื้น โดยผู้ขายดันลงไปต่อไม่ได้',
    },
    keyPoints: [
      { en: 'Identical closing lows.', th: 'ปิดที่ Low เท่ากัน' },
      { en: 'Support forming at that level.', th: 'แนวรับกำลังก่อตัว' },
      { en: 'Bullish if price holds above.', th: 'เป็นบวกถ้าราคายืนเหนือระดับนี้' },
    ],
    markers: [{ time: matchT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Matching Low', th: 'Matching Low' } }],
    legend: [{ label: 'Matching Low', color: COLORS.bull }],
  },
  'candle-in-neck': {
    candles: NECK,
    title: { en: 'In-Neck Line', th: 'In-Neck Line (เข้าคอ)' },
    summary: {
      en: 'A bullish candle closes near the prior bearish candle’s low — the bounce is weak, so the downtrend usually continues.',
      th: 'แท่งเขียวปิดใกล้ระดับ Low ของแท่งแดงก่อนหน้า การดีดอ่อนมาก เทรนด์ลงจึงมักเดินต่อ',
    },
    keyPoints: [
      { en: 'Close roughly at the prior low.', th: 'ปิดประมาณ Low ก่อนหน้า' },
      { en: 'Weak bounce = bearish continuation.', th: 'ดีดอ่อน = ลงต่อ' },
      { en: 'Opposite of a piercing line.', th: 'ตรงข้ามกับ Piercing Line' },
    ],
    markers: [{ time: neckT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'In-Neck', th: 'In-Neck' } }],
    legend: [{ label: 'In-Neck', color: COLORS.bear }],
  },
  'candle-on-neck': {
    candles: ONECK,
    title: { en: 'On-Neck Line', th: 'On-Neck Line (ติดคอ)' },
    summary: {
      en: 'A bullish candle closes exactly at the prior bearish candle’s low — sellers immediately defend the level, a bearish continuation signal.',
      th: 'แท่งเขียวปิดที่ Low ของแท่งแดงก่อนหน้าพอดี ผู้ขายปกป้องระดับนั้นทันที เป็นสัญญาณลงต่อ',
    },
    keyPoints: [
      { en: 'Close exactly at the prior low.', th: 'ปิดเท่ากับ Low ก่อนหน้าพอดี' },
      { en: 'Bounce rejected at the neck.', th: 'ดีดถูกปฏิเสธที่แนวคอ' },
      { en: 'Bearish continuation.', th: 'แนวโน้มลงต่อ' },
    ],
    markers: [{ time: oneckT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'On-Neck', th: 'On-Neck' } }],
    legend: [{ label: 'On-Neck', color: COLORS.bear }],
  },
  'candle-thrusting': {
    candles: THRUST,
    title: { en: 'Thrusting', th: 'Thrusting (ดันเข้า)' },
    summary: {
      en: 'A bullish candle closes into the lower half of the prior bearish body — progress, but not enough to confirm a reversal; bears usually resume.',
      th: 'แท่งเขียวปิดเข้าไปในครึ่งล่างของตัวแท่งแดงก่อนหน้า ดีขึ้นแต่ยังไม่พอจะยืนยันการกลับตัว ผู้ขายมักกลับมาอีกครั้ง',
    },
    keyPoints: [
      { en: 'Close in the lower half of prior body.', th: 'ปิดในครึ่งล่างของแท่งก่อนหน้า' },
      { en: 'Between in-neck and piercing.', th: 'อยู่ระหว่าง In-Neck กับ Piercing' },
      { en: 'Generally bearish continuation.', th: 'โดยทั่วไปลงต่อ' },
    ],
    markers: [{ time: thrustT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Thrusting', th: 'Thrusting' } }],
    legend: [{ label: 'Thrusting', color: COLORS.bear }],
  },
  'candle-three-inside-up': {
    candles: T3IN_UP,
    title: { en: 'Three Inside Up', th: 'Three Inside Up (สามแท่งใน-ขึ้น)' },
    summary: {
      en: 'A downtrend, a large bearish candle, a small bullish candle forming inside it (harami), then a strong bullish close above — a three-candle reversal.',
      th: 'เทรนด์ลง + แท่งแดงใหญ่ + แท่งเขียวเล็กอยู่ภายใน (Harami) + แท่งเขียวแข็งแรงปิดเหนือขึ้นไป รวมเป็นสัญญาณกลับตัว 3 แท่ง',
    },
    keyPoints: [
      { en: 'Candle 2 is a harami inside candle 1.', th: 'แท่ง 2 คือ Harami ในแท่ง 1' },
      { en: 'Candle 3 confirms with a strong close.', th: 'แท่ง 3 ยืนยันด้วยการปิดแข็งแรง' },
      { en: 'Bullish reversal after a downtrend.', th: 'กลับตัวขึ้นหลังเทรนด์ลง' },
    ],
    markers: [{ time: t3inUpT(5), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Three Inside Up', th: 'Three Inside Up' } }],
    legend: [{ label: 'Three Inside Up', color: COLORS.bull }],
  },
  'candle-three-inside-down': {
    candles: T3IN_DN,
    title: { en: 'Three Inside Down', th: 'Three Inside Down (สามแท่งใน-ลง)' },
    summary: {
      en: 'An uptrend, a large bullish candle, a small bearish harami, then a strong bearish close below — the bearish mirror of three inside up.',
      th: 'เทรนด์ขึ้น + แท่งเขียวใหญ่ + แท่งแดงเล็กแบบ Harami + แท่งแดงแข็งแรงปิดต่ำลงไป รวมเป็นสัญญาณกลับตัวลง',
    },
    keyPoints: [
      { en: 'Candle 2 is a harami inside candle 1.', th: 'แท่ง 2 คือ Harami ในแท่ง 1' },
      { en: 'Candle 3 confirms with a strong close.', th: 'แท่ง 3 ยืนยันด้วยการปิดแข็งแรง' },
      { en: 'Bearish reversal after an uptrend.', th: 'กลับตัวลงหลังเทรนด์ขึ้น' },
    ],
    markers: [{ time: t3inDnT(5), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Three Inside Down', th: 'Three Inside Down' } }],
    legend: [{ label: 'Three Inside Down', color: COLORS.bear }],
  },
  'candle-three-outside-up': {
    candles: T3OUT_UP,
    title: { en: 'Three Outside Up', th: 'Three Outside Up (สามแท่งนอก-ขึ้น)' },
    summary: {
      en: 'A bearish candle is fully engulfed by a bullish one, followed by a third bullish candle — a strong three-candle bullish reversal.',
      th: 'แท่งแดงถูกแท่งเขียวกลืนทั้งแท่ง แล้วตามด้วยแท่งเขียวแท่งที่สาม เป็นการกลับตัวขึ้น 3 แท่งที่แข็งแรง',
    },
    keyPoints: [
      { en: 'Candle 2 engulfs candle 1.', th: 'แท่ง 2 กลืนแท่ง 1 ทั้งแท่ง' },
      { en: 'Candle 3 continues the move up.', th: 'แท่ง 3 เดินหน้าขึ้นต่อ' },
      { en: 'One of the stronger reversal signals.', th: 'หนึ่งในสัญญาณกลับตัวที่แข็งแรง' },
    ],
    markers: [{ time: t3outUpT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Three Outside Up', th: 'Three Outside Up' } }],
    legend: [{ label: 'Three Outside Up', color: COLORS.bull }],
  },
  'candle-three-outside-down': {
    candles: T3OUT_DN,
    title: { en: 'Three Outside Down', th: 'Three Outside Down (สามแท่งนอก-ลง)' },
    summary: {
      en: 'A bullish candle is fully engulfed by a bearish one, followed by a third bearish candle — a strong three-candle bearish reversal.',
      th: 'แท่งเขียวถูกแท่งแดงกลืนทั้งแท่ง แล้วตามด้วยแท่งแดงแท่งที่สาม เป็นการกลับตัวลง 3 แท่งที่แข็งแรง',
    },
    keyPoints: [
      { en: 'Candle 2 engulfs candle 1.', th: 'แท่ง 2 กลืนแท่ง 1 ทั้งแท่ง' },
      { en: 'Candle 3 continues the move down.', th: 'แท่ง 3 เดินหน้าลงต่อ' },
      { en: 'One of the stronger reversal signals.', th: 'หนึ่งในสัญญาณกลับตัวที่แข็งแรง' },
    ],
    markers: [{ time: t3outDnT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Three Outside Down', th: 'Three Outside Down' } }],
    legend: [{ label: 'Three Outside Down', color: COLORS.bear }],
  },
  'candle-doji-star': {
    candles: DOJI_STAR,
    title: { en: 'Doji Star', th: 'Doji Star (ดาวโดจิ)' },
    summary: {
      en: 'A bearish candle followed by a doji that gaps below it — the gap isolates the doji and signals the sellers have lost momentum, often reversing the trend.',
      th: 'แท่งแดงตามด้วยโดจิที่ Gap ลงมา โดจิถูกแยกเดี่ยวแสดงว่าแรงขายหมดโมเมนตัม มักนำการกลับตัวขึ้น',
    },
    keyPoints: [
      { en: 'Doji gaps away from the prior candle.', th: 'โดจิ Gap ออกจากแท่งก่อนหน้า' },
      { en: 'A morning star without the bullish candle.', th: 'เหมือน Morning Star แต่ไม่มีแท่งเขียว' },
      { en: 'Reversal confirmed by the next candle.', th: 'ยืนยันด้วยแท่งถัดไป' },
    ],
    markers: [{ time: dojiStarT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Doji Star', th: 'Doji Star' } }],
    legend: [{ label: 'Doji Star', color: COLORS.bull }],
  },
  'candle-abandoned-baby': {
    candles: BABY,
    title: { en: 'Abandoned Baby', th: 'Abandoned Baby (ทารกโดดเดี่ยว)' },
    summary: {
      en: 'A rare and powerful reversal: a bearish candle, a doji gapped below, then a bullish candle gapped above — the doji is stranded like an island.',
      th: 'สัญญาณกลับตัวที่หายากและแรง: แท่งแดง + โดจิ Gap ลงมา + แท่งเขียว Gap ขึ้นไป โดจิถูกทิ้งไว้เดี่ยว ๆ เหมือนเกาะ',
    },
    keyPoints: [
      { en: 'Doji isolated by gaps on both sides.', th: 'โดจิโดดเดี่ยวด้วย Gap สองข้าง' },
      { en: 'An island reversal at a bottom.', th: 'Island Reversal ที่ก้นตลาด' },
      { en: 'High reliability, rare occurrence.', th: 'แม่นยำสูงแต่พบยาก' },
    ],
    markers: [{ time: babyT(5), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Abandoned Baby', th: 'Abandoned Baby' } }],
    legend: [{ label: 'Abandoned Baby', color: COLORS.bull }],
  },
  'candle-two-crows': {
    candles: TWO_CROW,
    title: { en: 'Two Crows', th: 'Two Crows (อีกาสองตัว)' },
    summary: {
      en: 'After a bullish candle, two bearish candles open above it and close inside its body — buyers are being picked off, warning of a top.',
      th: 'หลังแท่งเขียว แท่งแดงสองแท่งเปิดเหนือขึ้นไปแล้วปิดกลับเข้าไปในตัวแท่ง แสดงว่าผู้ซื้อถูกเล่นงาน เตือนยอดกำลังก่อตัว',
    },
    keyPoints: [
      { en: 'Second crow opens above the first.', th: 'อีกาตัวสองเปิดเหนือตัวแรก' },
      { en: 'Both close inside the bullish body.', th: 'ทั้งคู่ปิดในตัวแท่งเขียว' },
      { en: 'Bearish reversal warning.', th: 'สัญญาณเตือนกลับตัวลง' },
    ],
    markers: [{ time: twoCrowT(5), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Two Crows', th: 'Two Crows' } }],
    legend: [{ label: 'Two Crows', color: COLORS.bear }],
  },
  'candle-upside-gap-two-crows': {
    candles: GAP_TWO_CROW,
    title: { en: 'Upside Gap Two Crows', th: 'Upside Gap Two Crows (อีกา Gap ขึ้น)' },
    summary: {
      en: 'A bullish candle, then a gap up, then two bearish candles that fail to hold the gap — the buyers who chased the gap are trapped, a bearish signal.',
      th: 'แท่งเขียว + Gap ขึ้น + แท่งแดงสองแท่งที่ยึด Gap ไว้ไม่อยู่ ผู้ซื้อที่ไล่ราคาหลัง Gap ติดกับ เป็นสัญญาณขาลง',
    },
    keyPoints: [
      { en: 'First crow gaps above the trend.', th: 'อีกาตัวแรก Gap ขึ้นเหนือเทรนด์' },
      { en: 'Second crow closes below the first.', th: 'อีกาตัวสองปิดต่ำกว่าตัวแรก' },
      { en: 'Gap chasers are trapped.', th: 'คนไล่ซื้อหลัง Gap ติดกับ' },
    ],
    markers: [{ time: gapTwoCrowT(5), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Upside Gap Two Crows', th: 'Upside Gap Two Crows' } }],
    legend: [{ label: 'Upside Gap Two Crows', color: COLORS.bear }],
  },
  'candle-stick-sandwich': {
    candles: SAND,
    title: { en: 'Stick Sandwich', th: 'Stick Sandwich (แซนด์วิช)' },
    summary: {
      en: 'Two bearish candles close at the same level with a bullish candle squeezed between them — the identical closes reveal hidden buying at that price.',
      th: 'แท่งแดงสองแท่งปิดที่ระดับเดียวกันโดยมีแท่งเขียวคั่นกลาง การปิดเท่ากันเผยว่ามีการซื้อซ่อนอยู่ที่ระดับนั้น',
    },
    keyPoints: [
      { en: 'Bearish candles share the same close.', th: 'แท่งแดงปิดเท่ากันสองครั้ง' },
      { en: 'The middle candle is bullish.', th: 'แท่งกลางเป็นเขียว' },
      { en: 'Support quietly building at the level.', th: 'แนวรับกำลังก่อตัวเงียบ ๆ' },
    ],
    markers: [{ time: sandT(5), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Stick Sandwich', th: 'Stick Sandwich' } }],
    legend: [{ label: 'Stick Sandwich', color: COLORS.bull }],
  },
  'candle-advance-block': {
    candles: ADVB,
    title: { en: 'Advance Block', th: 'Advance Block (ขบวนขึ้นที่อ่อนแรง)' },
    summary: {
      en: 'Three bullish candles with shrinking bodies and growing upper shadows — each rally is weaker than the last, a warning that buyers are tiring.',
      th: 'แท่งเขียวสามแท่งที่ตัวเล็กลงเรื่อย ๆ และไส้เทียนบนยาวขึ้น ทุกขาขึ้นอ่อนแรงกว่าครั้งก่อน เตือนว่าแรงซื้อกำลังหมด',
    },
    keyPoints: [
      { en: 'Bodies shrink, shadows grow.', th: 'ตัวแท่งเล็กลง ไส้เทียนยาวขึ้น' },
      { en: 'Each push higher is weaker.', th: 'การดันขึ้นแต่ละครั้งอ่อนลง' },
      { en: 'Bearish reversal warning at a top.', th: 'เตือนกลับตัวลงที่ยอด' },
    ],
    markers: [{ time: advbT(5), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Advance Block', th: 'Advance Block' } }],
    legend: [{ label: 'Advance Block', color: COLORS.bear }],
  },
  'candle-deliberation': {
    candles: DELIB,
    title: { en: 'Deliberation', th: 'Deliberation (การไตร่ตรอง)' },
    summary: {
      en: 'Two strong bullish candles followed by a small or doji-like candle — the buyers have done their work and are now hesitating at the highs.',
      th: 'แท่งเขียวแข็งแรงสองแท่งตามด้วยแท่งเล็กคล้ายโดจิ แรงซื้อทำงานเสร็จแล้วและเริ่มลังเลที่ยอด',
    },
    keyPoints: [
      { en: 'Two strong pushes, then a stall.', th: 'ดันแรงสองครั้งแล้วหยุดชะงัก' },
      { en: 'Small candle = hesitation.', th: 'แท่งเล็ก = ความลังเล' },
      { en: 'Warning of an uptrend ending.', th: 'เตือนว่าเทรนด์ขึ้นกำลังจบ' },
    ],
    markers: [{ time: delibT(5), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Deliberation', th: 'Deliberation' } }],
    legend: [{ label: 'Deliberation', color: COLORS.bear }],
  },
  'candle-rising-three-methods': {
    candles: RISE3,
    title: { en: 'Rising Three Methods', th: 'Rising Three Methods (ขึ้นสามวิธี)' },
    summary: {
      en: 'A long bullish candle, three small bearish pullbacks that stay inside its range, then a strong close above — a bullish continuation pattern.',
      th: 'แท่งเขียวยาว + แท่งแดงเล็กสามแท่งย่ออยู่ในช่วงราคาเดิม + ปิดเหนือขึ้นไปแรง ๆ เป็นรูปแบบเทรนด์ขึ้นต่อ',
    },
    keyPoints: [
      { en: 'Pullbacks stay inside candle 1.', th: 'การย่อไม่ออกนอกแท่งแรก' },
      { en: 'Candle 5 closes above candle 1.', th: 'แท่ง 5 ปิดเหนือแท่ง 1' },
      { en: 'Strong continuation signal.', th: 'สัญญาณเดินหน้าต่อที่แข็งแรง' },
    ],
    markers: [{ time: rise3T(5), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Rising Three Methods', th: 'Rising Three Methods' } }],
    legend: [{ label: 'Rising Three Methods', color: COLORS.bull }],
  },
  'candle-falling-three-methods': {
    candles: FALL3,
    title: { en: 'Falling Three Methods', th: 'Falling Three Methods (ลงสามวิธี)' },
    summary: {
      en: 'A long bearish candle, three small bullish bounces inside its range, then a strong close below — a bearish continuation pattern.',
      th: 'แท่งแดงยาว + แท่งเขียวเล็กสามแท่งดีดอยู่ในช่วงราคาเดิม + ปิดต่ำลงไปแรง ๆ เป็นรูปแบบเทรนด์ลงต่อ',
    },
    keyPoints: [
      { en: 'Bounces stay inside candle 1.', th: 'การดีดไม่ออกนอกแท่งแรก' },
      { en: 'Candle 5 closes below candle 1.', th: 'แท่ง 5 ปิดต่ำกว่าแท่ง 1' },
      { en: 'Strong continuation signal.', th: 'สัญญาณเดินหน้าต่อที่แข็งแรง' },
    ],
    markers: [{ time: fall3T(5), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Falling Three Methods', th: 'Falling Three Methods' } }],
    legend: [{ label: 'Falling Three Methods', color: COLORS.bear }],
  },
  'candle-tasuki-gap-up': {
    candles: TASUKI_UP,
    title: { en: 'Upside Tasuki Gap', th: 'Upside Tasuki Gap (Gap ขึ้นแบบ Tasuki)' },
    summary: {
      en: 'A gap up followed by a bearish candle that closes inside the gap without filling it — the pullback fails, and the uptrend resumes.',
      th: 'Gap ขึ้นตามด้วยแท่งแดงที่ปิดอยู่ภายใน Gap โดยไม่ปิดช่องว่าง การย่อล้มเหลว เทรนด์ขึ้นเดินต่อ',
    },
    keyPoints: [
      { en: 'Gap is not filled.', th: 'Gap ไม่ถูกปิด' },
      { en: 'The pullback candle closes inside it.', th: 'แท่งย่อปิดอยู่ใน Gap' },
      { en: 'Uptrend continues.', th: 'เทรนด์ขึ้นต่อ' },
    ],
    markers: [{ time: tasukiUpT(5), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Upside Tasuki Gap', th: 'Upside Tasuki Gap' } }],
    legend: [{ label: 'Upside Tasuki Gap', color: COLORS.bull }],
  },
  'candle-tasuki-gap-down': {
    candles: TASUKI_DN,
    title: { en: 'Downside Tasuki Gap', th: 'Downside Tasuki Gap (Gap ลงแบบ Tasuki)' },
    summary: {
      en: 'A gap down followed by a bullish candle that closes inside the gap without filling it — the bounce fails, and the downtrend resumes.',
      th: 'Gap ลงตามด้วยแท่งเขียวที่ปิดอยู่ภายใน Gap โดยไม่ปิดช่องว่าง การดีดล้มเหลว เทรนด์ลงเดินต่อ',
    },
    keyPoints: [
      { en: 'Gap is not filled.', th: 'Gap ไม่ถูกปิด' },
      { en: 'The bounce candle closes inside it.', th: 'แท่งดีดปิดอยู่ใน Gap' },
      { en: 'Downtrend continues.', th: 'เทรนด์ลงต่อ' },
    ],
    markers: [{ time: tasukiDnT(5), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Downside Tasuki Gap', th: 'Downside Tasuki Gap' } }],
    legend: [{ label: 'Downside Tasuki Gap', color: COLORS.bear }],
  },
  'candle-mat-hold': {
    candles: MAT_HOLD,
    title: { en: 'Mat Hold', th: 'Mat Hold (ยึดเสื่อ)' },
    summary: {
      en: 'A long bullish candle followed by four small pullbacks that hold above its midpoint, then a strong breakout — like rising three methods but deeper.',
      th: 'แท่งเขียวยาว + แท่งย่อเล็กสี่แท่งที่ยังยืนเหนือกึ่งกลาง + ทะลุขึ้นแรง ๆ คล้าย Rising Three Methods แต่ย่อลึกกว่า',
    },
    keyPoints: [
      { en: 'Four shallow pullbacks.', th: 'ย่อตื้นสี่แท่ง' },
      { en: 'Pullbacks hold above the midpoint.', th: 'ย่อไม่หลุดกึ่งกลาง' },
      { en: 'Breakout candle confirms.', th: 'แท่งทะลุยืนยันสัญญาณ' },
    ],
    markers: [{ time: matHoldT(6), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Mat Hold', th: 'Mat Hold' } }],
    legend: [{ label: 'Mat Hold', color: COLORS.bull }],
  },
  'candle-separating-lines': {
    candles: SEP,
    title: { en: 'Separating Lines', th: 'Separating Lines (เส้นแยก)' },
    summary: {
      en: 'Two candles of the same color opening at the exact same price — the identical open shows the trend’s momentum is intact after a brief pause.',
      th: 'แท่งสีเดียวกันสองแท่งเปิดที่ราคาเท่ากันพอดี ราคาเปิดที่ซ้ำกันแสดงว่าโมเมนตัมของเทรนด์ยัง intact หลังพักสั้น ๆ',
    },
    keyPoints: [
      { en: 'Identical opening prices.', th: 'ราคาเปิดเท่ากัน' },
      { en: 'Second candle continues the trend.', th: 'แท่งที่สองเดินตามเทรนด์' },
      { en: 'Continuation signal.', th: 'สัญญาณเดินต่อ' },
    ],
    markers: [{ time: sepT(5), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Separating Lines', th: 'Separating Lines' } }],
    legend: [{ label: 'Separating Lines', color: COLORS.bear }],
  },

  // ---- Batch B: chart patterns ----
  'pattern-channel-up': {
    candles: CH_UP,
    title: { en: 'Rising Channel', th: 'ช่องขาขึ้น (Rising Channel)' },
    summary: {
      en: 'Two rising parallel trendlines contain the price — the upper line is resistance, the lower line is support. Traders buy the lower line and sell the upper.',
      th: 'เส้นแนวโน้มขนานสองเส้นที่ลาดขึ้นคุมราคา: เส้นบนคือแนวต้าน เส้นล่างคือแนวรับ เทรดเดอร์ซื้อที่เส้นล่าง ขายที่เส้นบน',
    },
    keyPoints: [
      { en: 'Both trendlines slope up in parallel.', th: 'เส้นทั้งสองลาดขึ้นขนานกัน' },
      { en: 'Buy at the lower line, sell at the upper.', th: 'ซื้อเส้นล่าง ขายเส้นบน' },
      { en: 'A close outside breaks the channel.', th: 'ปิดหลุดเส้น = จบช่อง' },
    ],
    trendLines: [
      { from: { time: chUpT(0), price: 99.4 }, to: { time: chUpT(12), price: 105.6 }, color: COLORS.bull, dashed: false },
      { from: { time: chUpT(1), price: 101.6 }, to: { time: chUpT(11), price: 106.2 }, color: COLORS.bear, dashed: false },
    ],
    legend: [
      { label: 'Channel support', color: COLORS.bull },
      { label: 'Channel resistance', color: COLORS.bear },
    ],
  },
  'pattern-channel-down': {
    candles: CH_DN,
    title: { en: 'Falling Channel', th: 'ช่องขาลง (Falling Channel)' },
    summary: {
      en: 'Two falling parallel trendlines contain the price — the mirror of a rising channel. Sellers defend the upper line, buyers step in at the lower.',
      th: 'เส้นแนวโน้มขนานสองเส้นที่ลาดลงคุมราคา เป็นภาพสะท้อนของช่องขาขึ้น ผู้ขายปกป้องเส้นบน ผู้ซื้อเข้าที่เส้นล่าง',
    },
    keyPoints: [
      { en: 'Both trendlines slope down in parallel.', th: 'เส้นทั้งสองลาดลงขนานกัน' },
      { en: 'Sell rallies to the upper line.', th: 'ขายตอนดีดถึงเส้นบน' },
      { en: 'A close outside breaks the channel.', th: 'ปิดหลุดเส้น = จบช่อง' },
    ],
    trendLines: [
      { from: { time: chDnT(0), price: 107.0 }, to: { time: chDnT(10), price: 102.8 }, color: COLORS.bear, dashed: false },
      { from: { time: chDnT(1), price: 105.0 }, to: { time: chDnT(11), price: 100.6 }, color: COLORS.bull, dashed: false },
    ],
    legend: [
      { label: 'Channel resistance', color: COLORS.bear },
      { label: 'Channel support', color: COLORS.bull },
    ],
  },
  'pattern-scallop-bottom': {
    candles: SCAL_B,
    title: { en: 'Scallop Bottom (Bowl)', th: 'Scallop Bottom (ก้นชาม)' },
    summary: {
      en: 'A long, rounded U-shaped bottom where selling slowly dries up and buying takes over — a slow, reliable bullish reversal.',
      th: 'ก้นรูปตัว U ที่โค้งมนยาว แรงขายค่อย ๆ หมดไปแล้วแรงซื้อคุมแทน เป็นสัญญาณกลับตัวขึ้นที่ช้าแต่น่าเชื่อถือ',
    },
    keyPoints: [
      { en: 'Gradual rounding at the bottom.', th: 'ก้นโค้งมนค่อยเป็นค่อยไป' },
      { en: 'Volume often dries up at the low.', th: 'วอลุ่มมักบางที่จุดต่ำสุด' },
      { en: 'Breakout above the left rim confirms.', th: 'ทะลุขอบซ้ายขึ้นไปยืนยัน' },
    ],
    trendLines: [
      { from: { time: scalBT(0), price: 105.0 }, to: { time: scalBT(13), price: 105.4 }, color: COLORS.violet, dashed: true },
    ],
    markers: [{ time: scalBT(7), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Bowl Low', th: 'ก้นชาม' } }],
    legend: [
      { label: 'Rim-to-rim', color: COLORS.violet },
      { label: 'Bowl low', color: COLORS.bull },
    ],
  },
  'pattern-scallop-top': {
    candles: SCAL_T,
    title: { en: 'Inverted Scallop (Top)', th: 'Inverted Scallop (ยอดชามคว่ำ)' },
    summary: {
      en: 'A long, rounded cap-shaped top where buying slowly fades and selling takes over — the bearish mirror of a bowl bottom.',
      th: 'ยอดโค้งมนยาวคล้ายชามคว่ำ แรงซื้อค่อย ๆ จางหายแล้วแรงขายคุมแทน เป็นภาพสะท้อนขาลงของ Bowl Bottom',
    },
    keyPoints: [
      { en: 'Gradual rounding at the top.', th: 'ยอดโค้งมนค่อยเป็นค่อยไป' },
      { en: 'Volume often fades at the high.', th: 'วอลุ่มมักบางที่จุดสูงสุด' },
      { en: 'Breakdown below the left rim confirms.', th: 'หลุดขอบซ้ายลงไปยืนยัน' },
    ],
    trendLines: [
      { from: { time: scalTT(0), price: 102.2 }, to: { time: scalTT(13), price: 102.6 }, color: COLORS.violet, dashed: true },
    ],
    markers: [{ time: scalTT(5), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Bowl High', th: 'ยอดชามคว่ำ' } }],
    legend: [
      { label: 'Rim-to-rim', color: COLORS.violet },
      { label: 'Bowl high', color: COLORS.bear },
    ],
  },
  'pattern-bump-and-run': {
    candles: BARR,
    title: { en: 'Bump-and-Run Reversal', th: 'Bump-and-Run Reversal (BARR)' },
    summary: {
      en: 'A gradual lead-in trend is interrupted by a steep, excessive “bump” in the opposite direction — when the bump breaks back through the lead-in line, the move reverses.',
      th: 'เทรนด์นำที่ค่อยเป็นค่อยไปถูกขัดด้วย “การพุ่งเกิน” (Bump) ที่ชันผิดปกติ เมื่อราคาหลุดกลับลงมาใต้เส้นเทรนด์เดิม การกลับตัวก็เริ่ม',
    },
    keyPoints: [
      { en: 'Lead-in: a steady trendline.', th: 'ช่วงนำ: เส้นเทรนด์คงที่' },
      { en: 'Bump: a steep, excessive move.', th: 'Bump: การพุ่งที่ชันเกินไป' },
      { en: 'Break of the lead-in line confirms.', th: 'หลุดเส้นนำ = ยืนยันการกลับตัว' },
    ],
    trendLines: [
      { from: { time: barrT(0), price: 100.6 }, to: { time: barrT(4), price: 99.5 }, color: COLORS.bear, dashed: true },
    ],
    markers: [{ time: barrT(11), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Breakdown', th: 'หลุดเส้นนำ' } }],
    legend: [{ label: 'Lead-in trendline', color: COLORS.bear }],
  },
  'pattern-hook-reversal': {
    candles: HOOK,
    title: { en: 'Hook Reversal', th: 'Hook Reversal (ตะขอ)' },
    summary: {
      en: 'A short, sharp counter-trend move shaped like a hook at the end of a decline — the hook traps the last sellers before price snaps back up.',
      th: 'การเคลื่อนไหวสวนเทรนด์ที่สั้นและคมรูปตะขอที่ก้นตลาด กับดักผู้ขายรายสุดท้ายก่อนราคาดีดกลับขึ้น',
    },
    keyPoints: [
      { en: 'A quick hook below the prior low.', th: 'ตะขอต่ำลงไปแป๊บเดียว' },
      { en: 'Price snaps back immediately.', th: 'ราคาดีดกลับทันที' },
      { en: 'Classic liquidity grab.', th: 'การกวาดสภาพคล่องคลาสสิก' },
    ],
    markers: [{ time: hookT(6), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Hook Low', th: 'จุด Hook' } }],
    legend: [{ label: 'Hook low', color: COLORS.bull }],
  },
  'pattern-pipe-top': {
    candles: PIPE_T,
    title: { en: 'Pipe Top', th: 'Pipe Top (ท่อบน)' },
    summary: {
      en: 'Two adjacent candles with identical highs at the top of an uptrend — the market rejected the level twice, warning of a top.',
      th: 'แท่งสองแท่งติดกันที่มี High เท่ากันบนยอดเทรนด์ขึ้น ตลาดปฏิเสธระดับนั้นสองครั้ง เตือนการกลับตัวลง',
    },
    keyPoints: [
      { en: 'Identical highs on two candles.', th: 'High เท่ากันสองแท่ง' },
      { en: 'Occurs after an extended rally.', th: 'เกิดหลังราคาขึ้นนาน' },
      { en: 'Rejection twice = distribution.', th: 'ถูกปฏิเสธสองครั้ง = การกระจาย' },
    ],
    markers: [{ time: pipeTT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Pipe Top', th: 'Pipe Top' } }],
    legend: [{ label: 'Pipe top', color: COLORS.bear }],
  },
  'pattern-pipe-bottom': {
    candles: PIPE_B,
    title: { en: 'Pipe Bottom', th: 'Pipe Bottom (ท่อล่าง)' },
    summary: {
      en: 'Two adjacent candles with identical lows at the bottom of a downtrend — the market defended the level twice, signaling a bottom.',
      th: 'แท่งสองแท่งติดกันที่มี Low เท่ากันที่ก้นเทรนด์ลง ตลาดปกป้องระดับนั้นสองครั้ง สัญญาณการกลับตัวขึ้น',
    },
    keyPoints: [
      { en: 'Identical lows on two candles.', th: 'Low เท่ากันสองแท่ง' },
      { en: 'Occurs after a prolonged decline.', th: 'เกิดหลังราคาลงนาน' },
      { en: 'Defended twice = accumulation.', th: 'ปกป้องสองครั้ง = การสะสม' },
    ],
    markers: [{ time: pipeBT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Pipe Bottom', th: 'Pipe Bottom' } }],
    legend: [{ label: 'Pipe bottom', color: COLORS.bull }],
  },
  'pattern-v-top': {
    candles: V_TOP,
    title: { en: 'V-Top (Spike Top)', th: 'V-Top (ยอดแหลม)' },
    summary: {
      en: 'A vertical spike to a new high followed by an equally sharp reversal — a blow-off top where the last buyers are trapped.',
      th: 'การพุ่งแนวตั้งสู่ High ใหม่แล้วพลิกกลับลงคมเท่ากัน เป็นยอดระเบิดที่ผู้ซื้อรายสุดท้ายติดกับ',
    },
    keyPoints: [
      { en: 'Steep spike, no consolidation.', th: 'พุ่งชันไม่มีพักฐาน' },
      { en: 'Reversal is just as sharp.', th: 'การกลับตัวคมเท่ากัน' },
      { en: 'Buyers at the spike are trapped.', th: 'คนซื้อที่ยอดติดกับ' },
    ],
    markers: [{ time: vTopT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Blow-off Top', th: 'ยอดระเบิด' } }],
    legend: [{ label: 'Blow-off top', color: COLORS.bear }],
  },
  'pattern-v-bottom': {
    candles: V_BOT,
    title: { en: 'V-Bottom (Spike Bottom)', th: 'V-Bottom (ก้นแหลม)' },
    summary: {
      en: 'A vertical crash to a new low followed by an equally sharp reversal — a capitulation low where the last sellers give up.',
      th: 'การร่วงแนวตั้งสู่ Low ใหม่แล้วพลิกกลับขึ้นคมเท่ากัน เป็นจุดยอมแพ้ที่ผู้ขายรายสุดท้ายทิ้งของ',
    },
    keyPoints: [
      { en: 'Steep drop, no consolidation.', th: 'ร่วงชันไม่มีพักฐาน' },
      { en: 'Reversal is just as sharp.', th: 'การกลับตัวคมเท่ากัน' },
      { en: 'Capitulation = sellers exhausted.', th: 'ยอมแพ้ = ผู้ขายหมดแรง' },
    ],
    markers: [{ time: vBotT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Capitulation Low', th: 'ก้นยอมแพ้' } }],
    legend: [{ label: 'Capitulation low', color: COLORS.bull }],
  },
  'pattern-dead-cat-bounce': {
    candles: DCB,
    title: { en: 'Dead Cat Bounce', th: 'Dead Cat Bounce (เด้งปลอม)' },
    summary: {
      en: 'A sharp crash is followed by a weak, short-lived bounce — even a dead cat bounces if dropped from high enough. The decline then resumes.',
      th: 'หลังการร่วงหนักมีดีดอ่อน ๆ อยู่พักหนึ่ง (“แมวตายยังดีดได้ถ้าตกจากที่สูง”) แล้วราคาก็ร่วงต่อ',
    },
    keyPoints: [
      { en: 'Bounce after a steep crash.', th: 'ดีดหลังการร่วงชัน' },
      { en: 'Bounce is weak and brief.', th: 'ดีดอ่อนและสั้น' },
      { en: 'Decline resumes below it.', th: 'ลงต่อใต้จุดดีด' },
    ],
    markers: [{ time: dcbT(7), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Dead Cat Bounce', th: 'เด้งปลอม' } }],
    legend: [{ label: 'Dead cat bounce', color: COLORS.bear }],
  },
  'pattern-measured-move': {
    candles: MEAS,
    title: { en: 'Measured Move', th: 'Measured Move (ขาที่วัดได้)' },
    summary: {
      en: 'A trend leg, a brief flag, then a second leg of similar size — the first leg “measures” the expected length of the second.',
      th: 'ขาเทรนด์ + ธงพักสั้น ๆ + ขาที่สองขนาดใกล้เคียงกัน ขาแรกใช้ “วัด” ความยาวที่คาดหวังของขาที่สอง',
    },
    keyPoints: [
      { en: 'Leg 1 sets the template length.', th: 'ขาแรกเป็นแม่แบบความยาว' },
      { en: 'Flag breaks briefly against the trend.', th: 'ธงพักสวนเทรนด์สั้น ๆ' },
      { en: 'Leg 2 mirrors leg 1.', th: 'ขาที่สองยาวใกล้เคียงขาแรก' },
    ],
    trendLines: [
      { from: { time: measT(0), price: 107.0 }, to: { time: measT(5), price: 101.6 }, color: COLORS.bear, dashed: false },
      { from: { time: measT(9), price: 101.5 }, to: { time: measT(11), price: 98.2 }, color: COLORS.bear, dashed: true },
    ],
    legend: [
      { label: 'Leg 1', color: COLORS.bear },
      { label: 'Leg 2 (measured)', color: COLORS.bear },
    ],
  },
  'pattern-gap-breakaway': {
    candles: GAP_BRK,
    title: { en: 'Breakaway Gap', th: 'Breakaway Gap (Gap ทะลุ)' },
    summary: {
      en: 'A gap that breaks out of a trading range on heavy conviction — it opens the door to a new trend and rarely gets filled.',
      th: 'Gap ที่ทะลุกรอบราคาด้วยความมั่นใจสูง เปิดประตูสู่เทรนด์ใหม่ และมักไม่ถูกปิดกลับ',
    },
    keyPoints: [
      { en: 'Breaks out of a range.', th: 'ทะลุออกจากกรอบ' },
      { en: 'Volume confirms conviction.', th: 'วอลุ่มยืนยันความมั่นใจ' },
      { en: 'Starts a new trend.', th: 'เริ่มเทรนด์ใหม่' },
    ],
    zones: [{ startTime: gapBrkT(4), endTime: gapBrkT(4), topPrice: 101.3, bottomPrice: 100.0, color: COLORS.zoneBear }],
    markers: [{ time: gapBrkT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Breakaway Gap', th: 'Gap ทะลุ' } }],
    legend: [{ label: 'Breakaway gap', color: COLORS.bear }],
  },
  'pattern-gap-runaway': {
    candles: GAP_RUN,
    title: { en: 'Runaway (Measuring) Gap', th: 'Runaway Gap (Gap กลางเทรนด์)' },
    summary: {
      en: 'A gap in the middle of a strong trend that marks the halfway point — it “measures” the trend and usually stays unfilled.',
      th: 'Gap ที่เกิดกลางเทรนด์แรงซึ่งมักเป็นจุดกึ่งกลาง ใช้วัดระยะทางที่เหลือของเทรนด์ และมักไม่ถูกปิด',
    },
    keyPoints: [
      { en: 'Appears mid-trend, not at the start.', th: 'เกิดกลางเทรนด์ ไม่ใช่ตอนเริ่ม' },
      { en: 'Often the midpoint of the move.', th: 'มักเป็นจุดกึ่งกลางของขา' },
      { en: 'Trend continues through it.', th: 'เทรนด์เดินผ่านไปต่อ' },
    ],
    markers: [{ time: gapRunT(5), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Runaway Gap', th: 'Gap กลางเทรนด์' } }],
    legend: [{ label: 'Runaway gap', color: COLORS.bear }],
  },
  'pattern-gap-exhaustion': {
    candles: GAP_EXH,
    title: { en: 'Exhaustion Gap', th: 'Exhaustion Gap (Gap สุดท้าย)' },
    summary: {
      en: 'A final gap near the end of a trend, often on a surge of volume — the last push before the trend exhausts and reverses.',
      th: 'Gap ครั้งสุดท้ายช่วงท้ายเทรนด์ มักมาพร้อมวอลุ่มพุ่ง เป็นการดันครั้งสุดท้ายก่อนเทรนด์หมดแรงและกลับตัว',
    },
    keyPoints: [
      { en: 'Comes late in a trend.', th: 'เกิดช่วงท้ายเทรนด์' },
      { en: 'Often on climactic volume.', th: 'มักมาพร้อมวอลุ่มไคลแมกซ์' },
      { en: 'Warns of a reversal.', th: 'เตือนการกลับตัว' },
    ],
    markers: [{ time: gapExhT(7), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Exhaustion Gap', th: 'Gap สุดท้าย' } }],
    legend: [{ label: 'Exhaustion gap', color: COLORS.bear }],
  },
  'pattern-failed-breakout': {
    candles: FAILBO,
    title: { en: 'Failed Breakout (Headfake)', th: 'Failed Breakout (หลอกทะลุ)' },
    summary: {
      en: 'Price breaks above a range, then immediately falls back inside — the breakout traders are trapped and often fuel a strong move the other way.',
      th: 'ราคาทะลุเหนือกรอบแล้วตกลงกลับมาทันที คนที่ไล่ซื้อตอนทะลุติดกับ และมักกลายเป็นเชื้อเพลิงให้ราคาวิ่งสวนกลับแรง',
    },
    keyPoints: [
      { en: 'Breakout above resistance fails.', th: 'ทะลุแนวต้านแล้วล้มเหลว' },
      { en: 'Price closes back inside the range.', th: 'ราคาปิดกลับเข้ากรอบ' },
      { en: 'Trapped traders fuel the reversal.', th: 'คนติดกับกลายเป็นแรงสวน' },
    ],
    zones: [{ startTime: failboT(0), endTime: failboT(6), topPrice: 101.8, bottomPrice: 99.4, color: COLORS.zoneAmber }],
    markers: [{ time: failboT(7), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Headfake', th: 'หลอกทะลุ' } }],
    legend: [{ label: 'Range', color: COLORS.zoneAmber }],
  },

  // ---- Batch C: SMC / ICT ----
  'ict-ote': {
    candles: OTE,
    title: { en: 'ICT Optimal Trade Entry (OTE)', th: 'ICT OTE (จุดเข้าที่ดีที่สุด)' },
    summary: {
      en: 'OTE is the 61.8% to 79.6% retracement of the last impulse leg — ICT traders wait for price to return there, where risk is smallest and reward is largest.',
      th: 'OTE คือช่วงย่อ 61.8% ถึง 79.6% ของขา Impulse ล่าสุด นักเทรด ICT รอราคาย่อกลับมาที่โซนนี้ เพราะเสี่ยงน้อยที่สุดและกำไรสูงสุด',
    },
    keyPoints: [
      { en: 'Draw the retracement of the impulse leg.', th: 'ลาก Fib จากขา Impulse' },
      { en: 'Entry zone sits at 61.8–79.6%.', th: 'โซนเข้าอยู่ที่ 61.8–79.6%' },
      { en: 'Look for a rejection candle inside it.', th: 'รอแท่งปฏิเสธในโซน' },
    ],
    zones: [{ startTime: oteT(12), endTime: oteT(13), topPrice: 104.81, bottomPrice: 102.57, color: COLORS.zoneBull }],
    priceLines: [{ price: 104.81, color: COLORS.bull, title: '61.8% OTE', dashed: true }],
    markers: [{ time: oteT(13), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'OTE Entry', th: 'จุดเข้า OTE' } }],
    legend: [{ label: 'OTE zone (61.8–79.6%)', color: COLORS.zoneBull }],
  },
  'ict-power-of-3': {
    candles: PO3,
    title: { en: 'ICT Power of 3 (P.O.3)', th: 'ICT Power of 3 (P.O.3)' },
    summary: {
      en: 'Power of 3 is the daily cycle: Accumulation (range), Manipulation (sweep of liquidity), Distribution (the real directional move). Every day repeats it.',
      th: 'Power of 3 คือวงจรประจำวัน: Accumulation (สร้างกรอบ) → Manipulation (กวาดสภาพคล่อง) → Distribution (วิ่งจริง) ทุกวันจะวนซ้ำรูปแบบนี้',
    },
    keyPoints: [
      { en: 'Accumulation builds liquidity in a range.', th: 'ช่วงสะสมสร้างสภาพคล่องในกรอบ' },
      { en: 'Manipulation sweeps the stops.', th: 'ช่วงหลอกกวาด Stop' },
      { en: 'Distribution is the real move.', th: 'ช่วงวิ่งจริงคือกำไร' },
    ],
    zones: [
      { startTime: po3T(0), endTime: po3T(5), topPrice: 101.5, bottomPrice: 99.0, color: COLORS.zoneAmber },
      { startTime: po3T(6), endTime: po3T(6), topPrice: 99.9, bottomPrice: 97.8, color: COLORS.zoneBear },
      { startTime: po3T(7), endTime: po3T(9), topPrice: 105.8, bottomPrice: 97.9, color: COLORS.zoneBull },
    ],
    markers: [
      { time: po3T(6), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Manipulation', th: 'หลอกกวาด' } },
      { time: po3T(7), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Distribution', th: 'วิ่งจริง' } },
    ],
    legend: [
      { label: 'Accumulation', color: COLORS.zoneAmber },
      { label: 'Manipulation', color: COLORS.zoneBear },
      { label: 'Distribution', color: COLORS.zoneBull },
    ],
  },
  'ict-judas-swing': {
    candles: JUDAS,
    title: { en: 'ICT Judas Swing', th: 'ICT Judas Swing (จูดาส์สวิง)' },
    summary: {
      en: 'The Judas swing is the initial move AGAINST the expected direction — it sweeps liquidity and traps the crowd before the real move in the bias direction.',
      th: 'Judas Swing คือการเคลื่อนไหวแรกที่สวนทิศทางที่คาดไว้ กวาดสภาพคล่องและหลอกฝูงชน ก่อนที่ราคาจะวิ่งจริงตามทิศทางไบแอส',
    },
    keyPoints: [
      { en: 'A move against the daily bias.', th: 'วิ่งสวนไบแอสประจำวัน' },
      { en: 'Sweeps liquidity / traps traders.', th: 'กวาดสภาพคล่องและหลอกคน' },
      { en: 'The real move follows the sweep.', th: 'การวิ่งจริงตามหลังการกวาด' },
    ],
    markers: [
      { time: judasT(2), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Judas Swing', th: 'Judas Swing' } },
      { time: judasT(3), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Real Move', th: 'วิ่งจริง' } },
    ],
    legend: [
      { label: 'Judas swing', color: COLORS.bear },
      { label: 'Real move', color: COLORS.bull },
    ],
  },
  'ict-mitigation-block': {
    candles: MITI,
    title: { en: 'ICT Mitigation Block', th: 'ICT Mitigation Block' },
    summary: {
      en: 'When price returns to an order block and fully trades through it (mitigates it), the block loses its meaning — but the stop-run below often marks the real reversal.',
      th: 'เมื่อราคากลับมาที่ Order Block และวิ่งทะลุจนเต็ม (Mitigate) บล็อกนั้นจะหมดความหมาย แต่การกวาด Stop ใต้บล็อกมักเป็นจุดกลับตัวจริง',
    },
    keyPoints: [
      { en: 'A block gets fully filled / mitigated.', th: 'บล็อกถูกเติมเต็ม (Mitigate)' },
      { en: 'The sweep below grabs the stops.', th: 'การกวาดใต้บล็อกกิน Stop' },
      { en: 'Reversal often follows the mitigation.', th: 'การกลับตัวมักตามหลัง' },
    ],
    zones: [{ startTime: mitiT(5), endTime: mitiT(5), topPrice: 101.6, bottomPrice: 99.6, color: COLORS.zoneBull }],
    markers: [{ time: mitiT(8), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Mitigation + Reversal', th: 'Mitigate แล้วกลับตัว' } }],
    legend: [{ label: 'Mitigation block', color: COLORS.zoneBull }],
  },
  'ict-reclaim-block': {
    candles: RECL,
    title: { en: 'ICT Reclaim Block', th: 'ICT Reclaim Block (ยึดคืน)' },
    summary: {
      en: 'A level or block is broken, then price returns and reclaims it — a close back above a broken support turns the level into a bullish springboard.',
      th: 'ระดับหรือบล็อกถูกเบรก แล้วราคากลับมายึดคืน การปิดกลับเหนือแนวรับที่แตก เปลี่ยนระดับนั้นเป็นจุดเด้งขึ้น',
    },
    keyPoints: [
      { en: 'Level breaks first.', th: 'ระดับถูกเบรกก่อน' },
      { en: 'Price returns and reclaims it.', th: 'ราคากลับมายึดคืน' },
      { en: 'Broken support becomes support again.', th: 'แนวรับที่แตกกลายเป็นแนวรับอีกครั้ง' },
    ],
    priceLines: [{ price: 100.0, color: COLORS.cyan, title: 'Reclaim level', dashed: true }],
    markers: [{ time: reclT(6), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Reclaim', th: 'ยึดคืน' } }],
    legend: [{ label: 'Reclaim level', color: COLORS.cyan }],
  },
  'ict-premium-discount': {
    candles: EQ,
    title: { en: 'ICT Premium / Discount', th: 'ICT Premium / Discount (แพง-ถูก)' },
    summary: {
      en: 'Equilibrium (50% of the dealing range) splits premium from discount. Price below is “cheap” (buy), above is “expensive” (sell).',
      th: 'Equilibrium (50% ของ Dealing Range) แบ่งโซนแพงกับโซนถูก ราคาใต้เส้นคือ “ถูก” (ซื้อ) เหนือเส้นคือ “แพง” (ขาย)',
    },
    keyPoints: [
      { en: 'EQ = 50% of the dealing range.', th: 'EQ คือ 50% ของช่วงราคา' },
      { en: 'Discount = below EQ (buy zone).', th: 'โซนถูก = ใต้ EQ (โซนซื้อ)' },
      { en: 'Premium = above EQ (sell zone).', th: 'โซนแพง = เหนือ EQ (โซนขาย)' },
    ],
    priceLines: [{ price: 105.0, color: COLORS.amber, title: 'Equilibrium (50%)', dashed: true }],
    zones: [
      { startTime: eqT(0), endTime: eqT(6), topPrice: 105.0, bottomPrice: 99.4, color: COLORS.zoneBull },
      { startTime: eqT(5), endTime: eqT(6), topPrice: 110.0, bottomPrice: 105.0, color: COLORS.zoneBear },
    ],
    legend: [
      { label: 'Discount (buy)', color: COLORS.zoneBull },
      { label: 'Premium (sell)', color: COLORS.zoneBear },
    ],
  },
  'ict-dealing-range': {
    candles: DR,
    title: { en: 'ICT Dealing Range', th: 'ICT Dealing Range (ช่วงราคาหลัก)' },
    summary: {
      en: 'The dealing range is the zone between buy-side and sell-side liquidity — price oscillates inside it, and the sweep of either end triggers the next move.',
      th: 'Dealing Range คือโซนระหว่าง Buy-side กับ Sell-side Liquidity ราคาแกว่งอยู่ภายใน และการกวาดปลายด้านใดด้านหนึ่งคือทริกเกอร์ขาใหม่',
    },
    keyPoints: [
      { en: 'Bounded by opposing liquidity pools.', th: 'ขอบด้วยสภาพคล่องสองฝั่ง' },
      { en: 'Price trades inside the range.', th: 'ราคาเทรดอยู่ในช่วง' },
      { en: 'Sweeps at the edges trigger moves.', th: 'การกวาดที่ขอบจุดชนวนขาใหม่' },
    ],
    priceLines: [
      { price: 105.9, color: COLORS.bear, title: 'Sell-side (high)', dashed: true },
      { price: 102.1, color: COLORS.bull, title: 'Buy-side (low)', dashed: true },
    ],
    markers: [{ time: drT(13), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Sweep of High', th: 'กวาดยอด' } }],
    legend: [
      { label: 'Dealing range', color: COLORS.zoneAmber },
    ],
  },
  'ict-orb': {
    candles: ORB,
    title: { en: 'Opening Range Breakout (ORB)', th: 'ORB (เบรกกรอบเปิดตลาด)' },
    summary: {
      en: 'ORB trades the first period’s range — the opening range sets the battlefield, and the first breakout of it often defines the session direction.',
      th: 'ORB เทรดกรอบของช่วงเปิดตลาด ช่วงแรกกำหนดสนามรบ การทะลุกรอบครั้งแรกมักกำหนดทิศทางของเซสชัน',
    },
    keyPoints: [
      { en: 'Mark the opening range (first hour).', th: 'มาร์กกรอบเปิดตลาด (ชั่วโมงแรก)' },
      { en: 'Trade the first breakout.', th: 'เทรดการทะลุครั้งแรก' },
      { en: 'Failed ORB = likely reversal.', th: 'ทะลุแล้วล้มเหลว = อาจกลับตัว' },
    ],
    zones: [{ startTime: orbT(0), endTime: orbT(2), topPrice: 100.6, bottomPrice: 99.6, color: COLORS.zoneAmber }],
    markers: [{ time: orbT(3), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'ORB Breakout', th: 'ทะลุกรอบเปิด' } }],
    legend: [{ label: 'Opening range', color: COLORS.zoneAmber }],
  },
  'ict-liquidity-void': {
    candles: VOID,
    title: { en: 'ICT Liquidity Void', th: 'ICT Liquidity Void (ช่องว่างราคา)' },
    summary: {
      en: 'A liquidity void is a price area with little or no trading — price moved through it too fast. Voids act as magnets; price often returns to fill them.',
      th: 'Liquidity Void คือช่วงราคาที่แทบไม่มีการซื้อขาย เพราะราคาวิ่งผ่านเร็วเกินไป ช่องว่างทำตัวเป็นแม่เหล็ก ราคามักกลับมาเติม',
    },
    keyPoints: [
      { en: 'A fast move leaves a void.', th: 'การวิ่งเร็วทิ้งช่องว่างไว้' },
      { en: 'Price is drawn back to it.', th: 'ราคาถูกดึงกลับมา' },
      { en: 'Reaction inside it = trade signal.', th: 'การปฏิเสธในช่อง = สัญญาณ' },
    ],
    zones: [{ startTime: voidT(4), endTime: voidT(4), topPrice: 104.6, bottomPrice: 101.5, color: COLORS.zoneCyan }],
    markers: [{ time: voidT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.cyan, text: { en: 'Liquidity Void', th: 'ช่องว่างราคา' } }],
    legend: [{ label: 'Liquidity void', color: COLORS.zoneCyan }],
  },
  'ict-buyside-liquidity': {
    candles: BSL,
    title: { en: 'ICT Buy-Side Liquidity', th: 'ICT Buy-Side Liquidity' },
    summary: {
      en: 'Buy-side liquidity is the pool of stop orders resting above swing highs. Price is engineered to sweep it before reversing — that is the institutional game.',
      th: 'Buy-side Liquidity คือกอง Stop ที่วางอยู่เหนือ Swing High ราคาถูกสร้างมาให้กวาดมันก่อนกลับตัว นี่คือเกมของสถาบัน',
    },
    keyPoints: [
      { en: 'Stops accumulate above highs.', th: 'Stop รวมตัวเหนือ High' },
      { en: 'Price sweeps them before reversing.', th: 'ราคากวาดก่อนกลับตัว' },
      { en: 'The sweep fuels the reversal.', th: 'การกวาดกลายเป็นเชื้อเพลิงกลับตัว' },
    ],
    priceLines: [{ price: 103.6, color: COLORS.bear, title: 'Swing high', dashed: true }],
    markers: [{ time: bslT(7), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'BSL Sweep', th: 'กวาด Buy-side' } }],
    legend: [{ label: 'Buy-side liquidity', color: COLORS.bear }],
  },
  'ict-sellside-liquidity': {
    candles: SSL,
    title: { en: 'ICT Sell-Side Liquidity', th: 'ICT Sell-Side Liquidity' },
    summary: {
      en: 'Sell-side liquidity is the pool of stop orders resting below swing lows. Price is engineered to sweep it before rallying — the mirror of buy-side.',
      th: 'Sell-side Liquidity คือกอง Stop ที่วางอยู่ใต้ Swing Low ราคาถูกสร้างให้กวาดมันก่อนเด้งขึ้น เป็นภาพสะท้อนของ Buy-side',
    },
    keyPoints: [
      { en: 'Stops accumulate below lows.', th: 'Stop รวมตัวใต้ Low' },
      { en: 'Price sweeps them before rallying.', th: 'ราคากวาดก่อนเด้งขึ้น' },
      { en: 'The sweep fuels the rally.', th: 'การกวาดกลายเป็นเชื้อเพลิงขึ้น' },
    ],
    priceLines: [{ price: 100.6, color: COLORS.bull, title: 'Swing low', dashed: true }],
    markers: [{ time: sslT(5), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'SSL Sweep', th: 'กวาด Sell-side' } }],
    legend: [{ label: 'Sell-side liquidity', color: COLORS.bull }],
  },
  'ict-inverse-fvg': {
    candles: IFVG,
    title: { en: 'Inverse FVG', th: 'Inverse FVG (ช่องขาลง)' },
    summary: {
      en: 'An inverse FVG is the bearish imbalance left by a 3-candle down move: a gap between candle 1’s low and candle 3’s high. Price often returns to fill it.',
      th: 'Inverse FVG คือความไม่สมดุลขาลงจากการร่วง 3 แท่ง: ช่องว่างระหว่าง Low แท่ง 1 กับ High แท่ง 3 ราคามักกลับมาเติม',
    },
    keyPoints: [
      { en: 'Created by a bearish impulse.', th: 'เกิดจากขาร่วงแรง' },
      { en: 'Gap between bar 1 low and bar 3 high.', th: 'ช่องระหว่าง Low แท่ง 1 กับ High แท่ง 3' },
      { en: 'Fill = potential reversal down.', th: 'การเติม = โอกาสกลับตัวลง' },
    ],
    zones: [{ startTime: ifvgT(2), endTime: ifvgT(2), topPrice: 102.6, bottomPrice: 102.1, color: COLORS.zoneBear }],
    markers: [{ time: ifvgT(2), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Inverse FVG', th: 'Inverse FVG' } }],
    legend: [{ label: 'Inverse FVG', color: COLORS.zoneBear }],
  },
  'ict-concealed-fvg': {
    candles: CFVG,
    title: { en: 'Concealed FVG', th: 'Concealed FVG (ช่องซ่อน)' },
    summary: {
      en: 'A concealed FVG is a small imbalance hidden by overlapping wicks — displacement happened, but the gap is easy to miss. Price still returns to it.',
      th: 'Concealed FVG คือช่องเล็ก ๆ ที่ถูกซ่อนด้วยไส้เทียนซ้อนกัน มีการเคลื่อนไหวแรงจริงแต่ช่องมองยาก ราคายังกลับมาเติม',
    },
    keyPoints: [
      { en: 'Small gap hidden by wicks.', th: 'ช่องเล็กซ่อนอยู่ในไส้เทียน' },
      { en: 'Displacement is still real.', th: 'การเคลื่อนไหวแรงยังเป็นจริง' },
      { en: 'Price often returns to it.', th: 'ราคามักกลับมาเติม' },
    ],
    zones: [{ startTime: cfvgT(5), endTime: cfvgT(5), topPrice: 104.3, bottomPrice: 103.0, color: COLORS.zoneCyan }],
    markers: [{ time: cfvgT(6), position: 'belowBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: 'Concealed FVG', th: 'Concealed FVG' } }],
    legend: [{ label: 'Concealed FVG', color: COLORS.zoneCyan }],
  },
  'ict-displacement': {
    candles: DISP,
    title: { en: 'ICT Displacement', th: 'ICT Displacement (การพุ่งแรง)' },
    summary: {
      en: 'Displacement is the strong, impulsive candle or leg that moves price away from a zone — the “fuel” that creates FVGs and draws the market’s attention.',
      th: 'Displacement คือแท่งหรือขาที่พุ่งแรงออกจากโซน เป็น “เชื้อเพลิง” ที่สร้าง FVG และดึงความสนใจของตลาด',
    },
    keyPoints: [
      { en: 'A strong directional move.', th: 'การเคลื่อนไหวที่มีทิศทางแรง' },
      { en: 'Leaves imbalances (FVG) behind.', th: 'ทิ้งความไม่สมดุล (FVG) ไว้' },
      { en: 'Confirms the institutional intent.', th: 'ยืนยันเจตนาของสถาบัน' },
    ],
    zones: [{ startTime: dispT(3), endTime: dispT(5), topPrice: 109.4, bottomPrice: 101.1, color: COLORS.zoneBull }],
    markers: [{ time: dispT(3), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Displacement', th: 'พุ่งแรง' } }],
    legend: [{ label: 'Displacement leg', color: COLORS.zoneBull }],
  },
  'ict-turtle-soup': {
    candles: SOUP,
    title: { en: 'ICT Turtle Soup', th: 'ICT Turtle Soup (กับดักเต่า)' },
    summary: {
      en: 'Turtle soup trades the stop-run: when stops below a well-known level are swept, you buy the soup — the trapped sellers become your fuel.',
      th: 'Turtle Soup เทรดสวนการกวาด Stop: เมื่อ Stop ใต้ระดับที่คนรู้จักถูกกวาด ให้ซื้อ “ซุปเต่า” ผู้ขายที่ติดกับกลายเป็นเชื้อเพลิงของคุณ',
    },
    keyPoints: [
      { en: 'Find a well-known level.', th: 'หาระดับที่คนรู้จัก' },
      { en: 'Wait for the stop sweep.', th: 'รอการกวาด Stop' },
      { en: 'Trade the reversal with the sweep.', th: 'เทรดกลับตัวตามการกวาด' },
    ],
    priceLines: [{ price: 100.0, color: COLORS.bull, title: 'Known level', dashed: true }],
    markers: [{ time: soupT(7), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Turtle Soup', th: 'Turtle Soup' } }],
    legend: [{ label: 'Turtle soup entry', color: COLORS.bull }],
  },
  'ict-point-of-interest': {
    candles: POI,
    title: { en: 'ICT Point of Interest (POI)', th: 'ICT POI (จุดสนใจ)' },
    summary: {
      en: 'A POI is a confluence zone where multiple ICT tools overlap — order blocks, FVGs and equilibrium — marking where price is most likely to react.',
      th: 'POI คือโซนที่เครื่องมือ ICT หลายตัวมาบรรจบกัน เช่น Order Block, FVG และ Equilibrium เป็นจุดที่ราคามีโอกาสตอบสนองสูงสุด',
    },
    keyPoints: [
      { en: 'Confluence of several tools.', th: 'เครื่องมือหลายตัวบรรจบกัน' },
      { en: 'Higher probability reaction zone.', th: 'โซนตอบสนองความน่าจะเป็นสูง' },
      { en: 'Enter on the reaction candle.', th: 'เข้าตามแท่งปฏิเสธ' },
    ],
    zones: [{ startTime: poiT(4), endTime: poiT(4), topPrice: 104.3, bottomPrice: 102.6, color: COLORS.zoneCyan }],
    priceLines: [{ price: 104.0, color: COLORS.amber, title: 'EQ', dashed: true }],
    markers: [{ time: poiT(5), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'POI Reaction', th: 'ปฏิเสธที่ POI' } }],
    legend: [{ label: 'Point of interest', color: COLORS.zoneCyan }],
  },
  'ict-order-flow': {
    candles: OFLOW,
    title: { en: 'ICT Order Flow', th: 'ICT Order Flow (กระแสออเดอร์)' },
    summary: {
      en: 'Order flow reads the raw aggression of buyers and sellers — absorption (big volume absorbed at a level) followed by expansion reveals who is in control.',
      th: 'Order Flow อ่านความดุดันของฝั่งซื้อ-ขาย: การดูดซับ (วอลุ่มมหาศาลที่ถูกกลืนที่ระดับหนึ่ง) ตามด้วยการขยายตัว เผยว่าใครคุมตลาด',
    },
    keyPoints: [
      { en: 'Absorption = supply/demand eaten at a level.', th: 'การดูดซับ = ของถูกกลืนที่ระดับ' },
      { en: 'Expansion follows absorption.', th: 'การขยายตัวตามหลังการดูดซับ' },
      { en: 'Volume reveals the aggressor.', th: 'วอลุ่มเผยฝ่ายที่ก้าวร้าว' },
    ],
    showVolume: true,
    markers: [
      { time: oflowT(5), position: 'belowBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: 'Absorption', th: 'ดูดซับ' } },
      { time: oflowT(6), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Expansion', th: 'ขยายตัว' } },
    ],
    legend: [
      { label: 'Absorption', color: COLORS.cyan },
      { label: 'Expansion', color: COLORS.bull },
    ],
  },
  'ict-htf-bias': {
    candles: HTF,
    title: { en: 'ICT HTF Bias', th: 'ICT HTF Bias (ไบแอสไทม์เฟรมใหญ่)' },
    summary: {
      en: 'HTF bias is the direction suggested by the higher timeframe — daily swing highs/lows, dealing range and liquidity. Intraday trades should align with it.',
      th: 'HTF Bias คือทิศทางที่ไทม์เฟรมใหญ่บอก ดูจาก Swing High/Low รายวัน Dealing Range และ Liquidity การเทรดอินทราเดย์ควรสอดคล้องกับมัน',
    },
    keyPoints: [
      { en: 'Read the daily structure first.', th: 'อ่านโครงสร้างรายวันก่อน' },
      { en: 'Bias = direction of HTF liquidity.', th: 'ไบแอส = ทิศทางสภาพคล่อง HTF' },
      { en: 'Trade intraday with the bias.', th: 'เทรดอินทราเดย์ตามไบแอส' },
    ],
    trendLines: [
      { from: { time: htfT(0), price: 99.4 }, to: { time: htfT(7), price: 103.7 }, color: COLORS.bull, dashed: false },
    ],
    markers: [
      { time: htfT(2), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'HL', th: 'HL' } },
      { time: htfT(4), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'HH', th: 'HH' } },
    ],
    legend: [{ label: 'HTF uptrend', color: COLORS.bull }],
  },
  'ict-asia-range': {
    candles: ASIA,
    title: { en: 'Asia Range', th: 'Asia Range (กรอบเอเชีย)' },
    summary: {
      en: 'The Asia range is the overnight session’s low-volume range. London often breaks it — a breakout with a retest of the range edge is a classic entry.',
      th: 'Asia Range คือกรอบช่วงคืนที่วอลุ่มต่ำ ลอนดอนมักเบรกมัน การทะลุแล้วรีเทสต์ขอบกรอบคือจุดเข้าคลาสสิก',
    },
    keyPoints: [
      { en: 'Low-volume overnight range.', th: 'กรอบกลางคืนวอลุ่มต่ำ' },
      { en: 'London breaks it at the open.', th: 'ลอนดอนเบรกตอนเปิด' },
      { en: 'Retest of the edge = entry.', th: 'รีเทสต์ขอบ = จุดเข้า' },
    ],
    zones: [{ startTime: asiaT(0), endTime: asiaT(5), topPrice: 100.4, bottomPrice: 99.5, color: COLORS.zoneAmber }],
    markers: [{ time: asiaT(6), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'London Breakout', th: 'ลอนดอนเบรก' } }],
    legend: [{ label: 'Asia range', color: COLORS.zoneAmber }],
  },
  'ict-consolidation': {
    candles: CONSOL,
    title: { en: 'Consolidation (Liquidity Building)', th: 'การสะสมกำลัง (Consolidation)' },
    summary: {
      en: 'Consolidation is the coiling phase where liquidity builds inside a tight range — the longer the coil, the more explosive the eventual expansion.',
      th: 'Consolidation คือช่วงขดตัวที่สภาพคล่องถูกสะสมในกรอบแคบ ยิ่งขดนาน ยิ่งระเบิดแรงเมื่อถึงเวลาขยายตัว',
    },
    keyPoints: [
      { en: 'Tight range, falling volatility.', th: 'กรอบแคบ ความผันผวนหด' },
      { en: 'Liquidity pools build at the edges.', th: 'สภาพคล่องสะสมที่ขอบ' },
      { en: 'Expansion follows the coil.', th: 'การขยายตัวตามหลัง' },
    ],
    zones: [{ startTime: consolT(0), endTime: consolT(5), topPrice: 103.8, bottomPrice: 101.8, color: COLORS.zoneAmber }],
    markers: [{ time: consolT(6), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Expansion', th: 'ขยายตัว' } }],
    legend: [{ label: 'Consolidation', color: COLORS.zoneAmber }],
  },

  // ---- Batch D: indicators ----
  'ind-sma-ema': {
    candles: TREND1,
    title: { en: 'Moving Average Crossover', th: 'Moving Average Crossover (ตัดเส้น)' },
    summary: {
      en: 'The classic trend system: when the fast MA (e.g. 50) crosses above the slow MA (e.g. 200) it is a golden cross (buy); crossing below is a death cross (sell).',
      th: 'ระบบเทรนด์สุดคลาสสิก: เมื่อเส้นเร็ว (เช่น SMA 50) ตัดขึ้นเหนือเส้นช้า (เช่น SMA 200) เรียกว่า Golden Cross (สัญญาณซื้อ) ตัดลงคือ Death Cross (สัญญาณขาย)',
    },
    keyPoints: [
      { en: 'Golden cross = fast above slow.', th: 'Golden Cross = เส้นเร็วเหนือเส้นช้า' },
      { en: 'Death cross = fast below slow.', th: 'Death Cross = เส้นเร็วใต้เส้นช้า' },
      { en: 'Best in trending markets.', th: 'ใช้ดีในตลาดที่มีเทรนด์' },
    ],
    trendLines: [
      { from: { time: trend1T(0), price: 100.5 }, to: { time: trend1T(39), price: 116.5 }, color: COLORS.cyan, dashed: false },
      { from: { time: trend1T(0), price: 99.5 }, to: { time: trend1T(39), price: 112.5 }, color: COLORS.amber, dashed: false },
    ],
    markers: [{ time: trend1T(8), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Golden Cross', th: 'Golden Cross' } }],
    legend: [
      { label: 'Fast MA', color: COLORS.cyan },
      { label: 'Slow MA', color: COLORS.amber },
    ],
  },
  'ind-adx': {
    candles: TREND1,
    title: { en: 'ADX (Trend Strength)', th: 'ADX (ความแรงของเทรนด์)' },
    summary: {
      en: 'ADX measures how strong a trend is, not its direction. Above 25 means a strong trend worth trading; below 20 means a range — fade the extremes instead.',
      th: 'ADX วัดความแรงของเทรนด์ ไม่ใช่ทิศทาง สูงกว่า 25 = เทรนด์แข็งแรงน่าเทรด ต่ำกว่า 20 = กรอบราคา ควรเทรดสวนจุดสุดขั้ว',
    },
    keyPoints: [
      { en: 'ADX > 25: strong trend.', th: 'ADX > 25: เทรนด์แข็งแรง' },
      { en: 'ADX < 20: ranging market.', th: 'ADX < 20: ตลาดกรอบ' },
      { en: '+DI / −DI give the direction.', th: '+DI / −DI บอกทิศทาง' },
    ],
    zones: [{ startTime: trend1T(20), endTime: trend1T(39), topPrice: 116, bottomPrice: 106, color: COLORS.zoneBull }],
    markers: [{ time: trend1T(20), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'ADX > 25', th: 'ADX > 25' } }],
    legend: [{ label: 'Strong trend zone', color: COLORS.zoneBull }],
  },
  'ind-stochastic': {
    candles: RANGE,
    title: { en: 'Stochastic Oscillator', th: 'Stochastic Oscillator' },
    summary: {
      en: 'Stochastic compares the close to the recent high-low range. Above 80 is overbought, below 20 is oversold — in a range, fade those extremes.',
      th: 'Stochastic เทียบราคาปิดกับช่วง High-Low ล่าสุด สูงกว่า 80 = Overbought ต่ำกว่า 20 = Oversold ในกรอบราคาให้เทรดสวนจุดเหล่านั้น',
    },
    keyPoints: [
      { en: 'Overbought above 80.', th: 'Overbought เหนือ 80' },
      { en: 'Oversold below 20.', th: 'Oversold ใต้ 20' },
      { en: '%K crossing %D confirms.', th: '%K ตัด %D ยืนยัน' },
    ],
    markers: [
      { time: rangeT(6), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Overbought', th: 'Overbought' } },
      { time: rangeT(19), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Oversold', th: 'Oversold' } },
    ],
    legend: [
      { label: 'Overbought', color: COLORS.bear },
      { label: 'Oversold', color: COLORS.bull },
    ],
  },
  'ind-atr': {
    candles: ATR_D,
    title: { en: 'ATR (Volatility)', th: 'ATR (ความผันผวน)' },
    summary: {
      en: 'Average True Range measures volatility in price terms. Tight bars = low ATR (quiet); wide bars = high ATR (volatile). Position size and stops scale with ATR.',
      th: 'ATR วัดความผันผวนในหน่วยราคา แท่งแคบ = ATR ต่ำ (เงียบ) แท่งกว้าง = ATR สูง (ผันผวน) ขนาดออเดอร์และ Stop ควรปรับตาม ATR',
    },
    keyPoints: [
      { en: 'ATR expands with volatility.', th: 'ATR ขยายเมื่อผันผวน' },
      { en: 'Size positions by ATR.', th: 'คำนวณขนาดออเดอร์จาก ATR' },
      { en: 'Volatility often precedes moves.', th: 'ความผันผวนมักมาก่อนการเคลื่อนไหว' },
    ],
    zones: [
      { startTime: atrT(0), endTime: atrT(5), topPrice: 100.8, bottomPrice: 98.8, color: COLORS.zoneAmber },
      { startTime: atrT(6), endTime: atrT(8), topPrice: 105.4, bottomPrice: 99.0, color: COLORS.zoneBull },
    ],
    markers: [
      { time: atrT(2), position: 'aboveBar', shape: 'arrowDown', color: COLORS.amber, text: { en: 'Low ATR', th: 'ATR ต่ำ' } },
      { time: atrT(7), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'High ATR', th: 'ATR สูง' } },
    ],
    legend: [
      { label: 'Quiet (low ATR)', color: COLORS.zoneAmber },
      { label: 'Volatile (high ATR)', color: COLORS.zoneBull },
    ],
  },
  'ind-super-trend': {
    candles: TREND2,
    title: { en: 'SuperTrend', th: 'SuperTrend' },
    summary: {
      en: 'SuperTrend rides the trend with an ATR-based trailing stop that flips above/below price. Stay long while price is above it; flip short when it crosses.',
      th: 'SuperTrend ตามเทรนด์ด้วย Stop ลากที่คำนวณจาก ATR สลับอยู่เหนือ/ใต้ราคา ถือ Long ตราบที่ราคาอยู่เหนือเส้น กลับเป็น Short เมื่อเส้นตัด',
    },
    keyPoints: [
      { en: 'Flip signal on the cross.', th: 'สัญญาณเปลี่ยนทิศเมื่อเส้นตัด' },
      { en: 'Trailing stop rides the trend.', th: 'Stop ลากตามเทรนด์' },
      { en: 'Works best with strong ADX.', th: 'ใช้ดีกับเทรนด์ที่ ADX แรง' },
    ],
    trendLines: [
      { from: { time: trend2T(0), price: 106.5 }, to: { time: trend2T(39), price: 90.5 }, color: COLORS.bear, dashed: false },
    ],
    markers: [{ time: trend2T(12), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Flip to Short', th: 'เปลี่ยนเป็น Short' } }],
    legend: [{ label: 'SuperTrend (short)', color: COLORS.bear }],
  },
  'ind-keltner': {
    candles: RANGE,
    title: { en: 'Keltner Channel', th: 'Keltner Channel' },
    summary: {
      en: 'Keltner wraps an EMA with ATR-based bands. Unlike Bollinger, the bands widen with volatility — price touching the band often snaps back to the middle.',
      th: 'Keltner ล้อม EMA ด้วยแถบที่คำนวณจาก ATR ต่างจาก Bollinger ที่แถบขยายตามความผันผวน ราคาแตะแถบมักดีดกลับเข้าหาเส้นกลาง',
    },
    keyPoints: [
      { en: 'EMA center + ATR bands.', th: 'เส้นกลาง EMA + แถบ ATR' },
      { en: 'Mean reversion at the bands.', th: 'ดีดกลับที่แถบ' },
      { en: 'Band walk = strong trend.', th: 'ราคาไต่ตามแถบ = เทรนด์แรง' },
    ],
    priceLines: [
      { price: 102.3, color: COLORS.cyan, title: 'Upper band', dashed: true },
      { price: 97.7, color: COLORS.cyan, title: 'Lower band', dashed: true },
      { price: 100.0, color: COLORS.amber, title: 'Middle (EMA)', dashed: false },
    ],
    markers: [
      { time: rangeT(6), position: 'aboveBar', shape: 'arrowDown', color: COLORS.cyan, text: { en: 'Band touch', th: 'แตะแถบบน' } },
      { time: rangeT(19), position: 'belowBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: 'Band touch', th: 'แตะแถบล่าง' } },
    ],
    legend: [{ label: 'Keltner bands', color: COLORS.cyan }],
  },
  'ind-vwap': {
    candles: VWAP_D,
    title: { en: 'VWAP', th: 'VWAP (ราคาเฉลี่ยถ่วงวอลุ่ม)' },
    summary: {
      en: 'VWAP is the average price weighted by volume — the institutional benchmark of the day. Above VWAP = buyers in control; below = sellers.',
      th: 'VWAP คือราคาเฉลี่ยถ่วงน้ำหนักด้วยวอลุ่ม เป็นมาตรฐานของสถาบันประจำวัน เหนือ VWAP = ผู้ซื้อคุม ใต้ VWAP = ผู้ขายคุม',
    },
    keyPoints: [
      { en: 'Institutional benchmark.', th: 'มาตรฐานของสถาบัน' },
      { en: 'Above = bullish bias.', th: 'เหนือเส้น = ไบแอสขึ้น' },
      { en: 'Below = bearish bias.', th: 'ใต้เส้น = ไบแอสลง' },
    ],
    trendLines: [
      { from: { time: vwapT(0), price: 99.9 }, to: { time: vwapT(7), price: 103.6 }, color: COLORS.amber, dashed: false },
    ],
    markers: [{ time: vwapT(3), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Above VWAP', th: 'เหนือ VWAP' } }],
    legend: [{ label: 'VWAP', color: COLORS.amber }],
  },
  'ind-obv': {
    candles: OBV_D,
    title: { en: 'On-Balance Volume (OBV)', th: 'OBV (วอลุ่มสะสม)' },
    summary: {
      en: 'OBV adds volume on up days and subtracts it on down days. When price makes a new low but OBV does not, smart money is accumulating — a divergence.',
      th: 'OBV บวกวอลุ่มวันขึ้น ลบวันลง เมื่อราคาทำ Low ใหม่แต่ OBV ไม่ทำ แสดงว่ามีการสะสมของเงินฉลาด — เกิด Divergence',
    },
    keyPoints: [
      { en: 'Volume confirms price.', th: 'วอลุ่มยืนยันราคา' },
      { en: 'Price low + OBV higher = divergence.', th: 'ราคาทำ Low แต่ OBV สูงขึ้น = Divergence' },
      { en: 'OBV trend leads price.', th: 'แนวโน้ม OBV นำราคา' },
    ],
    showVolume: true,
    markers: [
      { time: obvT(6), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Price Low', th: 'ราคาทำ Low' } },
      { time: obvT(9), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'OBV Divergence', th: 'OBV Divergence' } },
    ],
    legend: [{ label: 'OBV divergence', color: COLORS.bull }],
  },
  'ind-mfi': {
    candles: OBV_D,
    title: { en: 'Money Flow Index (MFI)', th: 'MFI (ดัชนีกระแสเงิน)' },
    summary: {
      en: 'MFI is a volume-weighted RSI. Above 80 is overbought (smart money distributing), below 20 is oversold — and divergences warn of reversals.',
      th: 'MFI คือ RSI ที่ถ่วงน้ำหนักด้วยวอลุ่ม สูงกว่า 80 = Overbought (เงินฉลาดกระจาย) ต่ำกว่า 20 = Oversold และ Divergence เตือนการกลับตัว',
    },
    keyPoints: [
      { en: 'Volume-weighted RSI.', th: 'RSI ถ่วงน้ำหนักวอลุ่ม' },
      { en: 'Overbought > 80, oversold < 20.', th: 'Overbought > 80, Oversold < 20' },
      { en: 'Divergence = reversal warning.', th: 'Divergence = เตือนกลับตัว' },
    ],
    showVolume: true,
    markers: [
      { time: obvT(6), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'MFI < 20', th: 'MFI < 20' } },
      { time: obvT(9), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'MFI Divergence', th: 'MFI Divergence' } },
    ],
    legend: [{ label: 'MFI signal', color: COLORS.bull }],
  },
  'ind-pivot-points': {
    candles: RANGE,
    title: { en: 'Pivot Points', th: 'Pivot Points (จุดหมุน)' },
    summary: {
      en: 'Pivot points derive support/resistance from the previous period (P = (H+L+C)/3, plus R1/R2 and S1/S2). Price often reacts at these levels.',
      th: 'Pivot Points คำนวณแนวรับ/ต้านจากช่วงก่อนหน้า (P = (H+L+C)/3 พร้อม R1/R2 และ S1/S2) ราคามักตอบสนองที่ระดับเหล่านี้',
    },
    keyPoints: [
      { en: 'Pivot = (H + L + C) / 3.', th: 'Pivot = (H + L + C) / 3' },
      { en: 'R1/R2 above, S1/S2 below.', th: 'R1/R2 เหนือ S1/S2 ใต้' },
      { en: 'Classic intraday levels.', th: 'ระดับคลาสสิกของอินทราเดย์' },
    ],
    priceLines: [
      { price: 102.6, color: COLORS.bear, title: 'R1', dashed: true },
      { price: 101.4, color: COLORS.amber, title: 'Pivot (PP)', dashed: false },
      { price: 100.2, color: COLORS.bull, title: 'S1', dashed: true },
    ],
    markers: [{ time: rangeT(8), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Reject at R1', th: 'ปฏิเสธที่ R1' } }],
    legend: [{ label: 'Pivot levels', color: COLORS.amber }],
  },
  'ind-bollinger-squeeze': {
    candles: SQUEEZE,
    title: { en: 'Bollinger Squeeze', th: 'Bollinger Squeeze (บีบตัว)' },
    summary: {
      en: 'When the Bollinger Bands pinch into a narrow funnel, volatility is compressed — a breakout is coming. The squeeze sets the stage for the expansion.',
      th: 'เมื่อ Bollinger Bands บีบเข้าหากันเป็นกรวยแคบ แสดงว่าความผันผวนถูกบีบอัด — กำลังจะมีการทะลุ การบีบคือการตั้งเวทีให้การขยายตัว',
    },
    keyPoints: [
      { en: 'Bands pinch = low volatility.', th: 'แถบบีบ = ความผันผวนต่ำ' },
      { en: 'Volatility compresses before moves.', th: 'ผันผวนบีบก่อนเคลื่อนไหว' },
      { en: 'Expansion follows the squeeze.', th: 'การขยายตัวตามหลัง' },
    ],
    zones: [{ startTime: squeezeT(3), endTime: squeezeT(7), topPrice: 100.7, bottomPrice: 99.7, color: COLORS.zoneAmber }],
    markers: [{ time: squeezeT(8), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Squeeze Release', th: 'ระเบิดออก' } }],
    legend: [{ label: 'Squeeze', color: COLORS.zoneAmber }],
  },
  'ind-parabolic-sar': {
    candles: TREND1,
    title: { en: 'Parabolic SAR', th: 'Parabolic SAR' },
    summary: {
      en: 'Parabolic SAR places dots that trail price — below in an uptrend, above in a downtrend. When the dot flips to the other side, the trend has changed.',
      th: 'Parabolic SAR วาดจุดไล่ตามราคา: อยู่ใต้ราคาในเทรนด์ขึ้น เหนือราคาในเทรนด์ลง เมื่อจุดข้ามฝั่ง = เทรนด์เปลี่ยน',
    },
    keyPoints: [
      { en: 'Dots trail the trend.', th: 'จุดไล่ตามเทรนด์' },
      { en: 'Flip = trend change.', th: 'จุดข้ามฝั่ง = เทรนด์เปลี่ยน' },
      { en: 'Works best in strong trends.', th: 'ใช้ดีในเทรนด์แข็งแรง' },
    ],
    markers: [
      { time: trend1T(10), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'SAR Flip Up', th: 'SAR กลับขึ้น' } },
      { time: trend1T(28), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'SAR Flip Down', th: 'SAR กลับลง' } },
    ],
    legend: [{ label: 'Parabolic SAR', color: COLORS.amber }],
  },
  'ind-cci': {
    candles: RANGE,
    title: { en: 'Commodity Channel Index (CCI)', th: 'CCI (ดัชนีช่องสินค้า)' },
    summary: {
      en: 'CCI measures price relative to its average deviation. Above +100 is unusually strong (overbought), below −100 unusually weak (oversold).',
      th: 'CCI วัดราคาเทียบกับค่าเบี่ยงเบนเฉลี่ย สูงกว่า +100 = แรงผิดปกติ (Overbought) ต่ำกว่า −100 = อ่อนผิดปกติ (Oversold)',
    },
    keyPoints: [
      { en: 'Above +100: overbought.', th: 'เหนือ +100: Overbought' },
      { en: 'Below −100: oversold.', th: 'ใต้ −100: Oversold' },
      { en: 'Zero-line cross = momentum.', th: 'ตัดเส้น 0 = โมเมนตัม' },
    ],
    markers: [
      { time: rangeT(6), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'CCI > +100', th: 'CCI > +100' } },
      { time: rangeT(19), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'CCI < −100', th: 'CCI < −100' } },
    ],
    legend: [
      { label: 'Overbought', color: COLORS.bear },
      { label: 'Oversold', color: COLORS.bull },
    ],
  },
  'ind-williams-r': {
    candles: RANGE,
    title: { en: 'Williams %R', th: 'Williams %R' },
    summary: {
      en: 'Williams %R is a momentum oscillator from −100 to 0. Above −20 is overbought, below −80 is oversold — a leading indicator at turning points.',
      th: 'Williams %R คือออสซิลเลเตอร์โมเมนตัมจาก −100 ถึง 0 เหนือ −20 = Overbought ใต้ −80 = Oversold เป็นอินดิเคเตอร์นำที่จุดเปลี่ยน',
    },
    keyPoints: [
      { en: 'Above −20: overbought.', th: 'เหนือ −20: Overbought' },
      { en: 'Below −80: oversold.', th: 'ใต้ −80: Oversold' },
      { en: 'A leading reversal signal.', th: 'สัญญาณกลับตัวแบบนำ' },
    ],
    markers: [
      { time: rangeT(6), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: '%R > −20', th: '%R > −20' } },
      { time: rangeT(19), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: '%R < −80', th: '%R < −80' } },
    ],
    legend: [
      { label: 'Overbought', color: COLORS.bear },
      { label: 'Oversold', color: COLORS.bull },
    ],
  },
  'ind-aroon': {
    candles: TREND1,
    title: { en: 'Aroon', th: 'Aroon' },
    summary: {
      en: 'Aroon measures how long since the last high/low: Aroon-Up near 100 means fresh highs (bullish), Aroon-Down near 100 means fresh lows (bearish).',
      th: 'Aroon วัดเวลาตั้งแต่ High/Low ล่าสุด: Aroon-Up ใกล้ 100 = High ใหม่ (ขาขึ้น) Aroon-Down ใกล้ 100 = Low ใหม่ (ขาลง)',
    },
    keyPoints: [
      { en: 'Aroon-Up tracks fresh highs.', th: 'Aroon-Up ตาม High ใหม่' },
      { en: 'Aroon-Down tracks fresh lows.', th: 'Aroon-Down ตาม Low ใหม่' },
      { en: 'Cross = trend change.', th: 'การตัดกัน = เทรนด์เปลี่ยน' },
    ],
    markers: [
      { time: trend1T(12), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Aroon-Up 100', th: 'Aroon-Up 100' } },
      { time: trend1T(27), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Aroon-Down 100', th: 'Aroon-Down 100' } },
    ],
    legend: [{ label: 'Aroon signal', color: COLORS.amber }],
  },

  // ---- Batch E: harmonics / Elliott ----
  'harm-deep-crab': {
    candles: DCRAB,
    title: { en: 'Deep Crab', th: 'Deep Crab (ปูดำน้ำลึก)' },
    summary: {
      en: 'A Deep Crab is a Gartley-family pattern where the D point extends BELOW the X point — the deepest retracement of all, catching the final flush before reversal.',
      th: 'Deep Crab คือรูปแบบตระกูล Gartley ที่จุด D ยื่นต่ำกว่าจุด X — การย่อที่ลึกที่สุด เก็บแรงเทขายครั้งสุดท้ายก่อนกลับตัว',
    },
    keyPoints: [
      { en: 'D extends below X.', th: 'จุด D ต่ำกว่าจุด X' },
      { en: 'The deepest harmonic retracement.', th: 'การย่อที่ลึกที่สุดในตระกูล' },
      { en: 'Reversal from D is the trade.', th: 'เทรดการกลับตัวจาก D' },
    ],
    trendLines: [
      { from: { time: dcrabT(0), price: 99.2 }, to: { time: dcrabT(9), price: 112.6 }, color: COLORS.violet, dashed: false },
      { from: { time: dcrabT(13), price: 103.0 }, to: { time: dcrabT(16), price: 109.8 }, color: COLORS.cyan, dashed: false },
      { from: { time: dcrabT(16), price: 109.8 }, to: { time: dcrabT(20), price: 98.4 }, color: COLORS.violet, dashed: false },
    ],
    markers: [
      { time: dcrabT(0), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: 'X' },
      { time: dcrabT(9), position: 'aboveBar', shape: 'circle', color: COLORS.muted, text: 'A' },
      { time: dcrabT(13), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: 'B' },
      { time: dcrabT(16), position: 'aboveBar', shape: 'circle', color: COLORS.muted, text: 'C' },
      { time: dcrabT(20), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'D — Reversal', th: 'D — จุดกลับตัว' } },
    ],
    legend: [{ label: 'X-A-B-C-D', color: COLORS.violet }],
  },
  'harm-5-0': {
    candles: FIVEO,
    title: { en: '5-0 Pattern', th: 'รูปแบบ 5-0' },
    summary: {
      en: 'The 5-0 is a five-point X-A-B-C-D structure: B makes a new extreme beyond X, C snaps back past A, and D retraces shallowly before the reversal.',
      th: '5-0 คือโครงสร้าง X-A-B-C-D: จุด B ทำจุดสุดขั้วใหม่เลย X, C เด้งกลับเกิน A และ D ย่อตื้น ๆ ก่อนกลับตัว',
    },
    keyPoints: [
      { en: 'B goes beyond X.', th: 'B เลย X' },
      { en: 'C exceeds A.', th: 'C เกิน A' },
      { en: 'D is the shallow entry.', th: 'D คือจุดเข้าที่ตื้น' },
    ],
    trendLines: [
      { from: { time: fiveoT(0), price: 99.4 }, to: { time: fiveoT(1), price: 102.4 }, color: COLORS.violet, dashed: false },
      { from: { time: fiveoT(1), price: 102.4 }, to: { time: fiveoT(2), price: 100.2 }, color: COLORS.cyan, dashed: false },
      { from: { time: fiveoT(2), price: 100.2 }, to: { time: fiveoT(3), price: 103.6 }, color: COLORS.violet, dashed: false },
      { from: { time: fiveoT(3), price: 103.6 }, to: { time: fiveoT(4), price: 101.6 }, color: COLORS.cyan, dashed: false },
    ],
    markers: [
      { time: fiveoT(0), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: 'X' },
      { time: fiveoT(1), position: 'aboveBar', shape: 'circle', color: COLORS.muted, text: 'A' },
      { time: fiveoT(2), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: 'B' },
      { time: fiveoT(3), position: 'aboveBar', shape: 'circle', color: COLORS.muted, text: 'C' },
      { time: fiveoT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'D — Entry', th: 'D — จุดเข้า' } },
    ],
    legend: [{ label: 'X-A-B-C-D', color: COLORS.violet }],
  },
  'harm-three-drives': {
    candles: TDRIVES,
    title: { en: 'Three Drives', th: 'Three Drives (สามจังหวะ)' },
    summary: {
      en: 'Three successive drives in the same direction, each higher (or lower), separated by pullbacks — when the third drive completes, the move exhausts.',
      th: 'การดันสามจังหวะในทิศทางเดียวกัน แต่ละครั้งสูงขึ้น (หรือต่ำลง) คั่นด้วยการย่อ เมื่อจังหวะที่สามจบ การเคลื่อนไหวก็หมดแรง',
    },
    keyPoints: [
      { en: 'Three equal-looking drives.', th: 'สามจังหวะที่ดูคล้ายกัน' },
      { en: 'Third drive = exhaustion.', th: 'จังหวะที่สาม = จุดหมดแรง' },
      { en: 'Reversal after drive 3.', th: 'กลับตัวหลังจังหวะ 3' },
    ],
    trendLines: [
      { from: { time: tdrivesT(1), price: 102.2 }, to: { time: tdrivesT(3), price: 103.4 }, color: COLORS.cyan, dashed: false },
      { from: { time: tdrivesT(3), price: 103.4 }, to: { time: tdrivesT(5), price: 104.8 }, color: COLORS.cyan, dashed: false },
    ],
    markers: [
      { time: tdrivesT(1), position: 'aboveBar', shape: 'circle', color: COLORS.cyan, text: '1' },
      { time: tdrivesT(3), position: 'aboveBar', shape: 'circle', color: COLORS.cyan, text: '2' },
      { time: tdrivesT(5), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: '3 — Exhaustion', th: '3 — หมดแรง' } },
    ],
    legend: [{ label: 'Three drives', color: COLORS.cyan }],
  },
  'harm-nenstar': {
    candles: NENSTAR,
    title: { en: 'Nenstar', th: 'Nenstar' },
    summary: {
      en: 'The Nenstar is a harmonic variant where the D point completes near the X level — a deep but controlled pullback that offers a high-probability reversal.',
      th: 'Nenstar คือรูปแบบฮาร์โมนิกที่จุด D จบใกล้ระดับ X — การย่อที่ลึกแต่ควบคุมได้ ให้จุดกลับตัวความน่าจะเป็นสูง',
    },
    keyPoints: [
      { en: 'D completes near X.', th: 'D จบใกล้ระดับ X' },
      { en: 'Deep, controlled pullback.', th: 'ย่อลึกแต่เป็นระเบียบ' },
      { en: 'Reversal at D is the trade.', th: 'เทรดการกลับตัวที่ D' },
    ],
    trendLines: [
      { from: { time: nenstarT(0), price: 99.4 }, to: { time: nenstarT(1), price: 102.6 }, color: COLORS.violet, dashed: false },
      { from: { time: nenstarT(3), price: 103.2 }, to: { time: nenstarT(5), price: 99.6 }, color: COLORS.violet, dashed: false },
    ],
    markers: [
      { time: nenstarT(0), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: 'X' },
      { time: nenstarT(1), position: 'aboveBar', shape: 'circle', color: COLORS.muted, text: 'A' },
      { time: nenstarT(2), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: 'B' },
      { time: nenstarT(3), position: 'aboveBar', shape: 'circle', color: COLORS.muted, text: 'C' },
      { time: nenstarT(5), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'D — Reversal', th: 'D — จุดกลับตัว' } },
    ],
    legend: [{ label: 'X-A-B-C-D', color: COLORS.violet }],
  },
  'harm-alternate-bat': {
    candles: ABAT,
    title: { en: 'Alternate Bat', th: 'Alternate Bat (ค้างคาวพิเศษ)' },
    summary: {
      en: 'The Alternate Bat pushes D beyond the A point (about 1.13 of XA) — the extra extension traps late buyers before the reversal.',
      th: 'Alternate Bat ดันจุด D เกินจุด A (ประมาณ 1.13 ของ XA) การยืดเกินดักผู้ซื้อรายสุดท้ายก่อนกลับตัว',
    },
    keyPoints: [
      { en: 'D extends beyond A.', th: 'D ยื่นเกิน A' },
      { en: '~1.13 of the XA leg.', th: 'ประมาณ 1.13 ของขา XA' },
      { en: 'Traps the late breakout buyers.', th: 'ดักคนไล่ซื้อตอนทะลุ' },
    ],
    trendLines: [
      { from: { time: abatT(0), price: 99.4 }, to: { time: abatT(1), price: 103.4 }, color: COLORS.violet, dashed: false },
      { from: { time: abatT(1), price: 103.4 }, to: { time: abatT(2), price: 101.4 }, color: COLORS.cyan, dashed: false },
      { from: { time: abatT(7), price: 105.2 }, to: { time: abatT(8), price: 102.8 }, color: COLORS.bear, dashed: false },
    ],
    markers: [
      { time: abatT(0), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: 'X' },
      { time: abatT(1), position: 'aboveBar', shape: 'circle', color: COLORS.muted, text: 'A' },
      { time: abatT(2), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: 'B' },
      { time: abatT(3), position: 'aboveBar', shape: 'circle', color: COLORS.muted, text: 'C' },
      { time: abatT(7), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'D — Trap', th: 'D — กับดัก' } },
    ],
    legend: [{ label: 'X-A-B-C-D', color: COLORS.violet }],
  },
  'harm-anti-butterfly': {
    candles: ABFLY,
    title: { en: 'Anti-Butterfly', th: 'Anti-Butterfly' },
    summary: {
      en: 'The Anti-Butterfly mirrors a butterfly with D extending about 2.0 of XA below the X point — the deepest harmonic reversal, often after panic selling.',
      th: 'Anti-Butterfly เป็นภาพสะท้อนของ Butterfly ที่จุด D ยื่นลงไปประมาณ 2.0 ของ XA ต่ำกว่าจุด X — การกลับตัวที่ลึกสุด มักเกิดหลังการเทขายตื่นตระหนก',
    },
    keyPoints: [
      { en: 'D at ~2.0 of XA below X.', th: 'D ลึก ~2.0 ของ XA ใต้ X' },
      { en: 'Deepest of the harmonics.', th: 'ลึกที่สุดในตระกูลฮาร์โมนิก' },
      { en: 'Reversal from D is powerful.', th: 'การกลับตัวจาก D แรงมาก' },
    ],
    trendLines: [
      { from: { time: abflyT(0), price: 99.4 }, to: { time: abflyT(3), price: 105.2 }, color: COLORS.violet, dashed: false },
      { from: { time: abflyT(3), price: 105.2 }, to: { time: abflyT(4), price: 103.0 }, color: COLORS.cyan, dashed: false },
      { from: { time: abflyT(5), price: 104.4 }, to: { time: abflyT(9), price: 97.8 }, color: COLORS.violet, dashed: false },
    ],
    markers: [
      { time: abflyT(0), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: 'X' },
      { time: abflyT(3), position: 'aboveBar', shape: 'circle', color: COLORS.muted, text: 'A' },
      { time: abflyT(4), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: 'B' },
      { time: abflyT(5), position: 'aboveBar', shape: 'circle', color: COLORS.muted, text: 'C' },
      { time: abflyT(9), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'D — Reversal', th: 'D — จุดกลับตัว' } },
    ],
    legend: [{ label: 'X-A-B-C-D', color: COLORS.violet }],
  },
  'ew-zigzag': {
    candles: ZIGZAG,
    title: { en: 'Elliott Zigzag', th: 'Elliott Zigzag (ซิกแซก)' },
    summary: {
      en: 'A zigzag is a sharp 5-3-5 three-wave correction — wave A drops in five, wave B bounces in three, wave C drops in five. The classic “sharp” correction.',
      th: 'Zigzag คือการปรับฐาน 5-3-5 ที่คม: คลื่น A ลง 5 คลื่นย่อย, B ดีด 3, C ลง 5 เป็นการปรับฐาน “แบบคม” คลาสสิก',
    },
    keyPoints: [
      { en: 'Pattern: 5-3-5.', th: 'โครงสร้าง: 5-3-5' },
      { en: 'Sharp, deep correction.', th: 'การปรับฐานที่คมและลึก' },
      { en: 'Wave B never passes A.', th: 'คลื่น B ไม่เกินจุดเริ่ม A' },
    ],
    trendLines: [
      { from: { time: zigzagT(0), price: 108.8 }, to: { time: zigzagT(4), price: 103.8 }, color: COLORS.bear, dashed: false },
      { from: { time: zigzagT(5), price: 103.8 }, to: { time: zigzagT(7), price: 106.2 }, color: COLORS.bull, dashed: false },
      { from: { time: zigzagT(8), price: 106.1 }, to: { time: zigzagT(12), price: 98.8 }, color: COLORS.bear, dashed: false },
    ],
    markers: [
      { time: zigzagT(4), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: 'A' },
      { time: zigzagT(7), position: 'aboveBar', shape: 'circle', color: COLORS.muted, text: 'B' },
      { time: zigzagT(12), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: 'C' },
    ],
    legend: [{ label: 'Zigzag (5-3-5)', color: COLORS.bear }],
  },
  'ew-flat': {
    candles: FLAT,
    title: { en: 'Elliott Flat', th: 'Elliott Flat (แบนราบ)' },
    summary: {
      en: 'A flat is a sideways 3-3-5 correction — wave A drops in three (shallow), wave B recovers back near the high in three, wave C drops in five.',
      th: 'Flat คือการปรับฐานข้าง ๆ 3-3-5: คลื่น A ลง 3 (ตื้น), B ดีดกลับใกล้ยอด 3, C ลง 5 เป็นการปรับฐานแบบด้าน ๆ',
    },
    keyPoints: [
      { en: 'Pattern: 3-3-5.', th: 'โครงสร้าง: 3-3-5' },
      { en: 'Sideways, not sharp.', th: 'ด้าน ๆ ไม่คม' },
      { en: 'B often reaches the prior high.', th: 'B มักกลับถึงยอดเดิม' },
    ],
    trendLines: [
      { from: { time: flatT(0), price: 103.8 }, to: { time: flatT(2), price: 101.7 }, color: COLORS.bear, dashed: false },
      { from: { time: flatT(3), price: 101.7 }, to: { time: flatT(5), price: 103.9 }, color: COLORS.bull, dashed: false },
      { from: { time: flatT(6), price: 103.8 }, to: { time: flatT(10), price: 99.6 }, color: COLORS.bear, dashed: false },
    ],
    markers: [
      { time: flatT(2), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: 'A' },
      { time: flatT(5), position: 'aboveBar', shape: 'circle', color: COLORS.muted, text: 'B' },
      { time: flatT(10), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: 'C' },
    ],
    legend: [{ label: 'Flat (3-3-5)', color: COLORS.bear }],
  },
  'ew-triangle': {
    candles: TRI,
    title: { en: 'Elliott Triangle', th: 'Elliott Triangle (สามเหลี่ยม)' },
    summary: {
      en: 'A contracting triangle is a 3-3-3-3-3 sideways correction — five waves with lower highs and higher lows coiling into a point before the breakout.',
      th: 'Triangle คือการปรับฐานด้าน ๆ 3-3-3-3-3 ห้าคลื่นที่มี High ต่ำลงและ Low สูงขึ้น ขดเข้าหาจุดก่อนทะลุ',
    },
    keyPoints: [
      { en: 'Pattern: 3-3-3-3-3.', th: 'โครงสร้าง: 3-3-3-3-3' },
      { en: 'Contracting highs and lows.', th: 'High/Low ขดเข้าหากัน' },
      { en: 'Breakout follows wave 5.', th: 'การทะลุตามหลังคลื่น 5' },
    ],
    trendLines: [
      { from: { time: triT(0), price: 100.8 }, to: { time: triT(4), price: 100.3 }, color: COLORS.bear, dashed: false },
      { from: { time: triT(1), price: 99.6 }, to: { time: triT(5), price: 99.9 }, color: COLORS.bull, dashed: false },
    ],
    markers: [{ time: triT(6), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Breakout', th: 'ทะลุ' } }],
    legend: [
      { label: 'Upper trendline', color: COLORS.bear },
      { label: 'Lower trendline', color: COLORS.bull },
    ],
  },
  'ew-diagonal': {
    candles: DIAG,
    title: { en: 'Elliott Diagonal', th: 'Elliott Diagonal (เส้นทแยง)' },
    summary: {
      en: 'An ending diagonal is a five-wave wedge where waves overlap each other — momentum is fading inside a rising (or falling) wedge, and a sharp reversal follows.',
      th: 'Ending Diagonal คือลิ่ม 5 คลื่นที่คลื่นทับกัน โมเมนตัมค่อย ๆ จางหายในลิ่มที่ลาดขึ้น (หรือลง) แล้วตามด้วยการกลับตัวที่คม',
    },
    keyPoints: [
      { en: 'Waves overlap (1-4 touch).', th: 'คลื่นทับกัน (1-4 แตะ)' },
      { en: 'Wedge shape narrows.', th: 'ลิ่มค่อย ๆ แคบลง' },
      { en: 'Sharp reversal after wave 5.', th: 'กลับตัวคมหลังคลื่น 5' },
    ],
    trendLines: [
      { from: { time: diagT(0), price: 101.2 }, to: { time: diagT(4), price: 102.8 }, color: COLORS.violet, dashed: false },
      { from: { time: diagT(1), price: 100.2 }, to: { time: diagT(3), price: 101.2 }, color: COLORS.cyan, dashed: false },
    ],
    markers: [
      { time: diagT(0), position: 'aboveBar', shape: 'circle', color: COLORS.muted, text: '1' },
      { time: diagT(1), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: '2' },
      { time: diagT(2), position: 'aboveBar', shape: 'circle', color: COLORS.muted, text: '3' },
      { time: diagT(3), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: '4' },
      { time: diagT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: '5 — Reversal', th: '5 — กลับตัว' } },
    ],
    legend: [{ label: 'Ending diagonal', color: COLORS.violet }],
  },
  'ew-extension': {
    candles: EXT,
    title: { en: 'Elliott Wave 3 Extension', th: 'Elliott Wave 3 (ขยายตัว)' },
    summary: {
      en: 'In an impulse, wave 3 is often the longest and strongest — the “extension”. When wave 3 extends, the move is usually not over: wave 5 still follows.',
      th: 'ในคลื่น Impulse คลื่น 3 มักยาวและแรงที่สุด — เรียกว่า Extension เมื่อคลื่น 3 ขยายตัว การเคลื่อนไหวมักยังไม่จบ เพราะยังมีคลื่น 5 ตามมา',
    },
    keyPoints: [
      { en: 'Wave 3 is the longest.', th: 'คลื่น 3 ยาวที่สุด' },
      { en: 'Subdivides into 5 smaller waves.', th: 'แตกเป็น 5 คลื่นย่อย' },
      { en: 'Wave 5 follows the extension.', th: 'คลื่น 5 ตามหลัง' },
    ],
    trendLines: [
      { from: { time: extT(0), price: 100.0 }, to: { time: extT(8), price: 106.6 }, color: COLORS.violet, dashed: false },
    ],
    markers: [
      { time: extT(0), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: '1' },
      { time: extT(1), position: 'aboveBar', shape: 'circle', color: COLORS.muted, text: '2' },
      { time: extT(6), position: 'aboveBar', shape: 'circle', color: COLORS.cyan, text: '3' },
      { time: extT(7), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: '4' },
      { time: extT(8), position: 'aboveBar', shape: 'circle', color: COLORS.muted, text: '5' },
    ],
    legend: [{ label: 'Extended wave 3', color: COLORS.cyan }],
  },
  'ew-wxy': {
    candles: WXY,
    title: { en: 'Elliott WXY (Double Zigzag)', th: 'Elliott WXY (ซิกแซกคู่)' },
    summary: {
      en: 'When a single correction is not enough, the market runs a double zigzag: W down, X bounce, then Y down — two zigzags connected by a corrective link.',
      th: 'เมื่อการปรับฐานครั้งเดียวไม่พอ ตลาดจะทำซิกแซกคู่: W ลง, X ดีด, แล้ว Y ลง — ซิกแซกสองชุดเชื่อมด้วยคลื่นเชื่อม X',
    },
    keyPoints: [
      { en: 'W and Y are zigzags.', th: 'W กับ Y คือซิกแซก' },
      { en: 'X connects them.', th: 'X เป็นตัวเชื่อม' },
      { en: 'X never exceeds W start.', th: 'X ไม่เกินจุดเริ่มของ W' },
    ],
    trendLines: [
      { from: { time: wxyT(0), price: 108.8 }, to: { time: wxyT(4), price: 103.6 }, color: COLORS.bear, dashed: false },
      { from: { time: wxyT(5), price: 103.6 }, to: { time: wxyT(7), price: 105.8 }, color: COLORS.bull, dashed: false },
      { from: { time: wxyT(8), price: 105.7 }, to: { time: wxyT(12), price: 98.4 }, color: COLORS.bear, dashed: false },
    ],
    markers: [
      { time: wxyT(4), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: 'W' },
      { time: wxyT(7), position: 'aboveBar', shape: 'circle', color: COLORS.muted, text: 'X' },
      { time: wxyT(12), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: 'Y' },
    ],
    legend: [{ label: 'W-X-Y', color: COLORS.bear }],
  },

  // ---- Batch F: new categories ----
  'dow-theory': {
    candles: DOW,
    title: { en: 'Dow Theory', th: 'Dow Theory (ทฤษฎีดาว)' },
    summary: {
      en: 'Dow Theory — the grandfather of technical analysis — says markets move in three trends: primary (months), secondary (weeks) and minor (days). The primary trend is your friend.',
      th: 'Dow Theory คือบิดาแห่งเทคนิคัล: ตลาดเคลื่อนที่ใน 3 เทรนด์ — Primary (เดือน), Secondary (สัปดาห์), Minor (วัน) จงเทรดตาม Primary Trend',
    },
    keyPoints: [
      { en: 'Primary trend is the main direction.', th: 'Primary คือทิศทางหลัก' },
      { en: 'Secondary trends are corrections.', th: 'Secondary คือการย่อใหญ่' },
      { en: 'Trends last until confirmed reversal.', th: 'เทรนด์อยู่จนกว่าจะยืนยันการกลับตัว' },
    ],
    zones: [
      { startTime: dowT(10), endTime: dowT(30), topPrice: 108, bottomPrice: 104, color: COLORS.zoneBull },
      { startTime: dowT(31), endTime: dowT(49), topPrice: 114, bottomPrice: 110, color: COLORS.zoneAmber },
    ],
    trendLines: [
      { from: { time: dowT(0), price: 99.5 }, to: { time: dowT(49), price: 117.5 }, color: COLORS.violet, dashed: false },
    ],
    legend: [
      { label: 'Primary uptrend', color: COLORS.violet },
      { label: 'Swing phases', color: COLORS.zoneBull },
    ],
  },
  'gann-angles': {
    candles: GANN_D,
    title: { en: 'Gann Angles', th: 'Gann Angles (มุมแกนน์)' },
    summary: {
      en: 'Gann angles are trendlines drawn from a pivot at specific slopes — the 1×1 (45°) is the most important. Price above the 1×1 is strong; below it, weak.',
      th: 'Gann Angles คือเส้นแนวโน้มที่ลากจากจุดหมุนด้วยมุมเฉพาะ เส้น 1×1 (45°) สำคัญที่สุด ราคาเหนือ 1×1 = แข็งแรง ใต้เส้น = อ่อนแอ',
    },
    keyPoints: [
      { en: '1×1 = 45° is the key line.', th: '1×1 = 45° คือเส้นหลัก' },
      { en: 'Price respects the angles.', th: 'ราคาเคารพมุมเหล่านี้' },
      { en: 'Crossing the 1×1 = trend change.', th: 'ตัด 1×1 = เทรนด์เปลี่ยน' },
    ],
    trendLines: [
      { from: { time: gannT(0), price: 99.6 }, to: { time: gannT(11), price: 105.0 }, color: COLORS.amber, dashed: false }, // 1x1
      { from: { time: gannT(0), price: 99.6 }, to: { time: gannT(11), price: 106.5 }, color: COLORS.bull, dashed: true }, // 2x1
      { from: { time: gannT(0), price: 99.6 }, to: { time: gannT(11), price: 103.8 }, color: COLORS.bear, dashed: true }, // 1x2
    ],
    markers: [{ time: gannT(0), position: 'belowBar', shape: 'circle', color: COLORS.amber, text: { en: 'Pivot', th: 'จุดหมุน' } }],
    legend: [
      { label: '1×1 (45°)', color: COLORS.amber },
      { label: '2×1 / 1×2', color: COLORS.bull },
    ],
  },
  'market-profile': {
    candles: MP_D,
    title: { en: 'Market Profile (TPO)', th: 'Market Profile (TPO)' },
    summary: {
      en: 'Market Profile shows how much time (TPO count) price spent at each level. The value area (~70% of activity) is where institutions trade; the POC is its center.',
      th: 'Market Profile แสดงเวลาที่ราคาใช้ในแต่ละระดับ (TPO) Value Area (~70% ของกิจกรรม) คือโซนที่สถาบันเทรด POC คือศูนย์กลางของมัน',
    },
    keyPoints: [
      { en: 'TPO counts time at each price.', th: 'TPO นับเวลาที่แต่ละราคา' },
      { en: 'Value area = ~70% of activity.', th: 'Value Area = ~70% ของกิจกรรม' },
      { en: 'POC acts as support/resistance.', th: 'POC เป็นแนวรับ/ต้าน' },
    ],
    showVolume: true,
    zones: [{ startTime: mpT(0), endTime: mpT(15), topPrice: 103.6, bottomPrice: 102.0, color: COLORS.zoneAmber }],
    priceLines: [{ price: 102.8, color: COLORS.amber, title: 'POC', dashed: false }],
    markers: [{ time: mpT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.amber, text: { en: 'Value Area Low', th: 'ขอบล่าง Value Area' } }],
    legend: [{ label: 'Value area', color: COLORS.zoneAmber }],
  },
  'auction-market-theory': {
    candles: AMT,
    title: { en: 'Auction Market Theory', th: 'Auction Market Theory (ทฤษฎีประมูล)' },
    summary: {
      en: 'Markets are auctions: price oscillates between balance (ranges, where fair value is found) and imbalance (trends, where price moves to find new fair value).',
      th: 'ตลาดคือการประมูล: ราคาแกว่งระหว่าง Balance (กรอบ ที่ราคายุติธรรมถูกค้นพบ) กับ Imbalance (เทรนด์ ที่ราคาวิ่งหา Fair Value ใหม่)',
    },
    keyPoints: [
      { en: 'Balance = two-sided trade in a range.', th: 'Balance = มีทั้งซื้อขายในกรอบ' },
      { en: 'Imbalance = one-sided trend.', th: 'Imbalance = เทรนด์ฝั่งเดียว' },
      { en: 'Ranges set up trends, trends find ranges.', th: 'กรอบสร้างเทรนด์ เทรนด์หากรอบใหม่' },
    ],
    zones: [
      { startTime: amtT(0), endTime: amtT(3), topPrice: 101.2, bottomPrice: 99.4, color: COLORS.zoneAmber },
      { startTime: amtT(4), endTime: amtT(6), topPrice: 104.4, bottomPrice: 100.0, color: COLORS.zoneBull },
      { startTime: amtT(7), endTime: amtT(9), topPrice: 105.0, bottomPrice: 103.4, color: COLORS.zoneAmber },
    ],
    legend: [
      { label: 'Balance', color: COLORS.zoneAmber },
      { label: 'Imbalance', color: COLORS.zoneBull },
    ],
  },
  'pa-inside-bar': {
    candles: INBAR,
    title: { en: 'Inside Bar', th: 'Inside Bar (แท่งใน)' },
    summary: {
      en: 'An inside bar is fully contained within the prior “mother” bar — the market is pausing. A breakout of the mother bar range often continues the trend.',
      th: 'Inside Bar คือแท่งที่อยู่ภายในแท่งแม่ (Mother Bar) ราคากำลังพักตัว การทะลุกรอบแท่งแม่มักเดินตามเทรนด์เดิม',
    },
    keyPoints: [
      { en: 'Inside bar nests in the mother bar.', th: 'แท่งในซ้อนในแท่งแม่' },
      { en: 'Compression = pause.', th: 'การบีบ = พักตัว' },
      { en: 'Breakout of the range continues.', th: 'ทะลุกรอบแล้วเดินต่อ' },
    ],
    zones: [{ startTime: inbarT(1), endTime: inbarT(3), topPrice: 100.9, bottomPrice: 99.9, color: COLORS.zoneAmber }],
    markers: [{ time: inbarT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Breakout', th: 'ทะลุ' } }],
    legend: [{ label: 'Mother bar range', color: COLORS.zoneAmber }],
  },
  'pa-outside-bar': {
    candles: OUTBAR,
    title: { en: 'Outside Bar', th: 'Outside Bar (แท่งนอก)' },
    summary: {
      en: 'An outside bar engulfs the entire prior range — volatility expands and one side takes control. It marks the start of a new move.',
      th: 'Outside Bar กลืนช่วงราคาก่อนหน้าทั้งหมด ความผันผวนขยายตัวและฝ่ายหนึ่งคุมเกม เป็นจุดเริ่มของการเคลื่อนไหวใหม่',
    },
    keyPoints: [
      { en: 'Engulfs the prior bar’s range.', th: 'กลืนช่วงแท่งก่อนหน้า' },
      { en: 'Volatility expansion.', th: 'ความผันผวนขยาย' },
      { en: 'Direction of close = control.', th: 'ทิศปิดบ่งบอกผู้คุม' },
    ],
    markers: [{ time: outbarT(3), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Outside Bar', th: 'แท่งนอก' } }],
    legend: [{ label: 'Outside bar', color: COLORS.bull }],
  },
  'pa-fakey': {
    candles: FAKEY,
    title: { en: 'Fakey (False Breakout)', th: 'Fakey (หลอกทะลุ)' },
    summary: {
      en: 'A fakey is a false breakout of an inside bar — price pokes outside the range, then snaps back inside. The trapped breakout traders fuel the reversal.',
      th: 'Fakey คือการหลอกทะลุกรอบแท่งแม่ ราคาโผล่ออกนอกกรอบแล้วดึงกลับ คนที่ไล่ตามทะลุติดกับและกลายเป็นเชื้อเพลิงการกลับตัว',
    },
    keyPoints: [
      { en: 'Poke outside, then snap back.', th: 'โผล่ออกแล้วดึงกลับ' },
      { en: 'Traps the breakout traders.', th: 'ดักคนไล่ทะลุ' },
      { en: 'Reversal in the opposite direction.', th: 'กลับตัวสวนทาง' },
    ],
    zones: [{ startTime: fakeyT(1), endTime: fakeyT(1), topPrice: 100.9, bottomPrice: 99.9, color: COLORS.zoneAmber }],
    markers: [{ time: fakeyT(2), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Fakey', th: 'หลอกทะลุ' } }],
    legend: [{ label: 'Mother bar range', color: COLORS.zoneAmber }],
  },
  'pa-123-reversal': {
    candles: P123,
    title: { en: '1-2-3 Reversal', th: '1-2-3 Reversal (กลับตัว 1-2-3)' },
    summary: {
      en: 'A classic reversal: 1 = the trend makes a new extreme, 2 = a counter-trend move, 3 = a pullback that holds — the break of point 2’s extreme confirms.',
      th: 'การกลับตัวคลาสสิก: 1 = เทรนด์ทำจุดสุดขั้วใหม่, 2 = ขาสวนเทรนด์, 3 = ย่อที่ไม่หลุดจุด 1 — การทะลุจุด 2 ยืนยันสัญญาณ',
    },
    keyPoints: [
      { en: 'Point 1 = the extreme.', th: 'จุด 1 = จุดสุดขั้ว' },
      { en: 'Point 3 = higher low / lower high.', th: 'จุด 3 = Low สูงขึ้น / High ต่ำลง' },
      { en: 'Break of point 2 confirms.', th: 'ทะลุจุด 2 ยืนยัน' },
    ],
    trendLines: [
      { from: { time: p123T(1), price: 105.0 }, to: { time: p123T(4), price: 100.4 }, color: COLORS.bear, dashed: false },
    ],
    markers: [
      { time: p123T(4), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: '1' },
      { time: p123T(5), position: 'aboveBar', shape: 'circle', color: COLORS.muted, text: '2' },
      { time: p123T(6), position: 'belowBar', shape: 'circle', color: COLORS.muted, text: '3' },
      { time: p123T(7), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Confirm', th: 'ยืนยัน' } },
    ],
    legend: [{ label: 'Trendline break', color: COLORS.bear }],
  },
  'pa-pin-bar': {
    candles: PINBAR,
    title: { en: 'Pin Bar', th: 'Pin Bar (แท่งเข็ม)' },
    summary: {
      en: 'A pin bar has a long wick and a small body — the wick shows a strong rejection of a level. It is a universal reversal signal on any timeframe.',
      th: 'Pin Bar มีไส้เทียนยาวและตัวเล็ก ไส้เทียนแสดงการปฏิเสธระดับนั้นอย่างรุนแรง เป็นสัญญาณกลับตัวที่ใช้ได้ทุกไทม์เฟรม',
    },
    keyPoints: [
      { en: 'Long wick = strong rejection.', th: 'ไส้เทียนยาว = ปฏิเสธแรง' },
      { en: 'Works at support/resistance.', th: 'ใช้ได้ที่แนวรับ/ต้าน' },
      { en: 'Trade the close beyond the body.', th: 'เทรดการปิดพ้นตัวแท่ง' },
    ],
    markers: [{ time: pinbarT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Pin Bar', th: 'แท่งเข็ม' } }],
    legend: [{ label: 'Pin bar', color: COLORS.bull }],
  },
  'risk-position-sizing': {
    candles: TREND1,
    title: { en: 'Position Sizing & Risk', th: 'การคำนวณขนาดออเดอร์ (Position Sizing)' },
    summary: {
      en: 'Risk a fixed percentage (e.g. 1–2%) of your account per trade, not a fixed amount. Position size = risk $ ÷ stop distance — this is what keeps you alive.',
      th: 'เสี่ยงเป็นเปอร์เซ็นต์คงที่ของเงินทุนต่อเทรด (เช่น 1–2%) ไม่ใช่จำนวนเงินตายตัว ขนาดออเดอร์ = เงินเสี่ยง ÷ ระยะห่าง Stop นี่คือสิ่งที่ทำให้อยู่รอด',
    },
    keyPoints: [
      { en: 'Risk % of account, not $ amount.', th: 'เสี่ยง % ของทุน ไม่ใช่เงินตายตัว' },
      { en: 'Size = risk $ ÷ stop distance.', th: 'ขนาด = เงินเสี่ยง ÷ ระยะ Stop' },
      { en: 'Protect capital first.', th: 'ปกป้องเงินทุนก่อน' },
    ],
    priceLines: [
      { price: 116.5, color: COLORS.bull, title: 'Entry zone', dashed: false },
      { price: 114.8, color: COLORS.bear, title: 'Stop (1R)', dashed: true },
    ],
    markers: [{ time: trend1T(30), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: '1–2% risk', th: 'เสี่ยง 1–2%' } }],
    legend: [{ label: 'Risk plan', color: COLORS.bull }],
  },
  'risk-r-multiple': {
    candles: TREND1,
    title: { en: 'R-Multiples & Expectancy', th: 'R-Multiples (ผลตอบแทนเทียบเสี่ยง)' },
    summary: {
      en: 'Express every trade in R (risk). A 3R win is three times your risk. Track your expectancy — the average R per trade — to know if your edge is real.',
      th: 'แปลงทุกเทรดเป็นหน่วย R (ความเสี่ยง) กำไร 3R คือสามเท่าของความเสี่ยง ติดตาม Expectancy (ค่าเฉลี่ย R ต่อเทรด) เพื่อรู้ว่า Edge จริงหรือไม่',
    },
    keyPoints: [
      { en: '1R = your risk per trade.', th: '1R = ความเสี่ยงต่อเทรด' },
      { en: 'Expectancy = average R per trade.', th: 'Expectancy = ค่าเฉลี่ย R ต่อเทรด' },
      { en: 'Win rate alone means nothing.', th: 'Win rate อย่างเดียวไม่พอ' },
    ],
    priceLines: [
      { price: 115.5, color: COLORS.bull, title: 'Entry', dashed: false },
      { price: 114.0, color: COLORS.bear, title: 'SL (−1R)', dashed: true },
      { price: 118.5, color: COLORS.accent, title: 'TP (+2R)', dashed: true },
    ],
    legend: [{ label: '1R / 2R plan', color: COLORS.bull }],
  },
  'risk-stop-placement': {
    candles: TREND2,
    title: { en: 'Stop Placement', th: 'การวาง Stop Loss' },
    summary: {
      en: 'Place stops beyond structure, not at round numbers: below the swing low (longs) or above the swing high (shorts), with room for noise — sized by ATR.',
      th: 'วาง Stop เกินโครงสร้าง ไม่ใช่เลขกลม ๆ: ใต้ Swing Low (ฝั่งซื้อ) หรือเหนือ Swing High (ฝั่งขาย) เผื่อเสียงรบกวนด้วย ATR',
    },
    keyPoints: [
      { en: 'Beyond structure, not round numbers.', th: 'เกินโครงสร้าง ไม่ใช่เลขกลม' },
      { en: 'Give room for noise (ATR).', th: 'เผื่อความผันผวน (ATR)' },
      { en: 'Wide enough to work, tight enough to protect.', th: 'กว้างพอให้เทรดทำงาน แคบพอป้องกันทุน' },
    ],
    priceLines: [
      { price: 97.0, color: COLORS.bear, title: 'Entry (short)', dashed: false },
      { price: 99.2, color: COLORS.bear, title: 'Stop above swing', dashed: true },
    ],
    markers: [{ time: trend2T(25), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Stop beyond structure', th: 'Stop เกินโครงสร้าง' } }],
    legend: [{ label: 'Stop placement', color: COLORS.bear }],
  },
  'strategy-swing-trading': {
    candles: SWING,
    title: { en: 'Swing Trading', th: 'Swing Trading (เทรดสวิง)' },
    summary: {
      en: 'Swing trading holds positions for days to weeks, riding secondary trends. Trades are taken on daily/4H charts with structure-based stops and targets.',
      th: 'Swing Trading ถือออเดอร์หลายวันถึงหลายสัปดาห์ ตาม Secondary Trend เข้าเทรดบนกราฟรายวัน/4H ใช้โครงสร้างวาง Stop และเป้าหมาย',
    },
    keyPoints: [
      { en: 'Hold days to weeks.', th: 'ถือหลายวันถึงสัปดาห์' },
      { en: 'Daily / 4H charts.', th: 'กราฟรายวัน / 4H' },
      { en: 'Trade the secondary trend.', th: 'เทรด Secondary Trend' },
    ],
    zones: [{ startTime: swingT(15), endTime: swingT(25), topPrice: 108, bottomPrice: 104, color: COLORS.zoneBull }],
    trendLines: [
      { from: { time: swingT(0), price: 99.8 }, to: { time: swingT(59), price: 113.5 }, color: COLORS.violet, dashed: false },
    ],
    legend: [{ label: 'Swing structure', color: COLORS.violet }],
  },
  'strategy-scalping': {
    candles: SCALP,
    title: { en: 'Scalping', th: 'Scalping (เทรดถี่)' },
    summary: {
      en: 'Scalping trades tiny moves over seconds to minutes, often dozens of times a day. It demands tight spreads, fast execution and strict discipline.',
      th: 'Scalping เทรดการเคลื่อนไหวเล็ก ๆ ในเวลาไม่กี่วินาทีถึงนาที วันละหลายสิบครั้ง ต้องมีสเปรดแคบ การสั่งงานเร็ว และวินัยเข้มงวด',
    },
    keyPoints: [
      { en: 'Seconds-to-minutes holds.', th: 'ถือไม่กี่วินาทีถึงนาที' },
      { en: 'High frequency, small targets.', th: 'ถี่ เป้าเล็ก' },
      { en: 'Tight spreads are essential.', th: 'สเปรดแคบเป็นสิ่งจำเป็น' },
    ],
    zones: [{ startTime: scalpT(0), endTime: scalpT(9), topPrice: 100.9, bottomPrice: 99.7, color: COLORS.zoneAmber }],
    markers: [
      { time: scalpT(3), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Buy', th: 'ซื้อ' } },
      { time: scalpT(6), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Sell', th: 'ขาย' } },
    ],
    legend: [{ label: 'Scalp range', color: COLORS.zoneAmber }],
  },
  'trading-journal': {
    candles: RANGE,
    title: { en: 'Trading Journal & Metrics', th: 'Trading Journal (บันทึกการเทรด)' },
    summary: {
      en: 'A journal records every trade: setup, entry, exit, R result, emotions. Over time it reveals your real edge, your worst habits and your best conditions.',
      th: 'บันทึกทุกเทรด: เซ็ตอัป จุดเข้า-ออก ผลลัพธ์เป็น R และอารมณ์ เมื่อเวลาผ่านไปมันจะเผย Edge จริง นิสัยแย่ที่สุด และสภาวะที่เทรดดีที่สุด',
    },
    keyPoints: [
      { en: 'Record the setup and the R result.', th: 'บันทึกเซ็ตอัปและผลเป็น R' },
      { en: 'Review weekly, not after losses.', th: 'ทบทวนรายสัปดาห์ ไม่ใช่หลังขาดทุน' },
      { en: 'Find your edge in the data.', th: 'หา Edge จากข้อมูล' },
    ],
    markers: [
      { time: rangeT(8), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: '+2R', th: '+2R' } },
      { time: rangeT(20), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: '−1R', th: '−1R' } },
      { time: rangeT(30), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: '+3R', th: '+3R' } },
    ],
    legend: [{ label: 'Tracked trades', color: COLORS.bull }],
  },
};

