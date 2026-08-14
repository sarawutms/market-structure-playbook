import type { UTCTimestamp } from 'lightweight-charts';
import { bollingerBands, computeVolumeProfile } from './indicators';
import type { Candle, ConceptScenario, MarkerSpec } from './types';

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

/** Builds candles from [open, high, low, close] tuples, one day apart. */
function toCandles(bars: Array<[number, number, number, number]>, startDate: string): Candle[] {
  const date = new Date(`${startDate}T00:00:00Z`);
  return bars.map(([open, high, low, close]) => {
    const time = date.toISOString().slice(0, 10);
    date.setUTCDate(date.getUTCDate() + 1);
    return { time, open, high, low, close };
  });
}

/** Builds candles with volume from [open, high, low, close, volume] tuples. */
function toCandlesWithVolume(
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

interface SeriesOptions {
  startPrice: number;
  /** Per-bar drift (trend). */
  drift: number;
  /** Sine-wave amplitude. */
  amplitude: number;
  /** Sine-wave frequency. */
  frequency: number;
  /** Per-bar random noise. */
  noise: number;
  seed: number;
  /** Extra deviations at specific indices (e.g. band-testing spikes). */
  spikes?: Record<number, number>;
}

/** Generates a deterministic OHLC series with a trend + wave + noise. */
function generateSeries(count: number, startDate: string, opts: SeriesOptions): Candle[] {
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

/** Unix seconds for an hour of a fixed UTC day (used by the kill-zones data). */
function utcHour(hour: number): UTCTimestamp {
  return Math.floor(Date.UTC(2024, 5, 3, hour, 0, 0) / 1000) as UTCTimestamp;
}

/* ---------------------------------------------------------------------------
 * Theme colors (must match the chart theme)
 * ------------------------------------------------------------------------- */

export const COLORS = {
  bull: '#0ecb81', // bullish green
  bear: '#f6465d', // bearish red
  accent: '#4f8cff', // brand blue
  cyan: '#22d3ee', // structure / lows
  amber: '#fbbf24', // ranges / equal highs
  violet: '#a78bfa', // fractal / macro swings
  muted: '#8a94a6', // neutral structure lines
  zoneBull: 'rgba(14, 203, 129, 0.10)',
  zoneBear: 'rgba(246, 70, 93, 0.10)',
  zoneAmber: 'rgba(251, 191, 36, 0.10)',
  zoneCyan: 'rgba(34, 211, 238, 0.10)',
} as const;

/* ---------------------------------------------------------------------------
 * Dataset 1 — Uptrend (Higher Highs / Higher Lows, ends in a BOS)
 * ------------------------------------------------------------------------- */

const UPTREND_BARS: Array<[number, number, number, number]> = [
  [100.0, 102.0, 99.5, 101.5],
  [101.5, 103.0, 100.5, 102.5],
  [102.5, 103.5, 101.5, 102.0],
  [102.0, 104.0, 101.5, 103.5],
  [103.5, 105.0, 103.0, 104.5], // SH1 = 105.0
  [104.5, 105.0, 103.0, 103.5],
  [103.5, 104.0, 102.0, 102.5], // HL1 = 102.0
  [102.5, 104.5, 102.0, 104.0],
  [104.0, 106.0, 103.5, 105.5], // SH2 = 106.0
  [105.5, 106.0, 104.5, 105.0],
  [105.0, 105.5, 103.5, 104.0], // HL2 = 103.5
  [104.0, 106.5, 103.5, 106.0],
  [106.0, 107.5, 105.5, 107.0], // SH3 = 107.5
  [107.0, 107.5, 106.0, 106.5],
  [106.5, 107.0, 105.0, 105.5], // HL3 = 105.0
  [105.5, 107.0, 105.0, 106.5],
  [106.5, 108.5, 106.0, 108.0], // SH4 = 108.5
  [108.0, 108.5, 107.0, 107.5],
  [107.5, 108.0, 106.0, 106.5], // HL4 = 106.0
  [106.5, 108.0, 106.0, 107.5],
  [107.5, 109.5, 107.0, 109.0], // SH5 = 109.5
  [109.0, 109.5, 107.5, 108.0],
  [108.0, 108.5, 106.5, 107.0], // HL5 = 106.5
  [107.0, 108.5, 106.5, 108.0],
  [108.0, 110.0, 107.5, 109.5], // SH6 = 110.0 (last swing high)
  [109.5, 110.0, 108.5, 109.0],
  [109.0, 109.8, 108.0, 108.5], // HL6 = 108.0
  [108.5, 110.0, 108.0, 109.8], // retest of 110.0
  [109.8, 111.8, 109.5, 111.2], // BOS — breaks 110.0
  [111.2, 112.5, 110.5, 112.0], // momentum continues
];

const UP = toCandles(UPTREND_BARS, '2024-01-02');
const upT = (i: number) => UP[i].time;

/* ---------------------------------------------------------------------------
 * Dataset 2 — Reversal (uptrend ends with a CHoCH, then downtrend)
 * ------------------------------------------------------------------------- */

const REVERSAL_BARS: Array<[number, number, number, number]> = [
  [100.0, 102.0, 99.5, 101.5],
  [101.5, 103.0, 100.5, 102.5],
  [102.5, 103.5, 101.5, 102.0],
  [102.0, 104.0, 101.5, 103.5],
  [103.5, 105.0, 103.0, 104.5], // SH1 = 105.0
  [104.5, 105.0, 103.0, 103.5],
  [103.5, 104.0, 102.0, 102.5], // HL1 = 102.0
  [102.5, 104.5, 102.0, 104.0],
  [104.0, 106.0, 103.5, 105.5], // SH2 = 106.0
  [105.5, 106.0, 104.5, 105.0],
  [105.0, 105.5, 103.5, 104.0], // HL2 = 103.5
  [104.0, 106.5, 103.5, 106.0],
  [106.0, 107.5, 105.5, 107.0], // SH3 = 107.5
  [107.0, 107.5, 106.0, 106.5],
  [106.5, 107.0, 105.0, 105.5], // HL3 = 105.0 (last swing low)
  [105.5, 107.0, 105.0, 106.5],
  [106.5, 108.2, 106.0, 107.8], // SH4 = 108.2 (final higher high)
  [107.8, 108.2, 106.2, 106.5], // first rejection
  [106.5, 106.8, 104.6, 104.9], // CHoCH — closes below 105.0
  [104.9, 105.4, 103.2, 103.5], // LH1 = 105.4
  [103.5, 104.6, 103.0, 104.2],
  [104.2, 104.6, 102.4, 102.6], // LL1 = 102.4
  [102.6, 103.8, 102.2, 103.4],
  [103.4, 103.8, 101.2, 101.4], // LH2 = 103.8, LL2 = 101.2
  [101.4, 102.6, 101.0, 102.2],
  [102.2, 102.6, 99.8, 100.0], // LL3 = 99.8
  [100.0, 101.2, 99.6, 100.8],
  [100.8, 101.2, 98.9, 99.1], // LL4 = 98.9
  [99.1, 100.0, 98.5, 99.6],
  [99.6, 100.0, 97.8, 98.0], // LL5 = 97.8
];

const REV = toCandles(REVERSAL_BARS, '2024-03-04');
const revT = (i: number) => REV[i].time;

/* ---------------------------------------------------------------------------
 * Dataset 3 — Downtrend (Lower Highs / Lower Lows)
 * ------------------------------------------------------------------------- */

const DOWNTREND_BARS: Array<[number, number, number, number]> = [
  [108.0, 110.0, 107.5, 109.5], // top swing high = 110.0
  [109.5, 110.0, 108.5, 109.0],
  [109.0, 109.5, 107.0, 107.5], // LH1 = 109.5
  [107.5, 108.0, 105.5, 106.0], // LL1 = 105.5
  [106.0, 107.5, 105.5, 107.0],
  [107.0, 107.5, 104.5, 105.0], // LH2 = 107.5, LL2 = 104.5
  [105.0, 106.0, 104.0, 105.5],
  [105.5, 106.0, 102.5, 103.0], // LH3 = 106.0, LL3 = 102.5
  [103.0, 104.0, 102.0, 103.5],
  [103.5, 104.0, 100.5, 101.0], // LH4 = 104.0, LL4 = 100.5
  [101.0, 102.0, 100.0, 101.5],
  [101.5, 102.0, 98.5, 99.0], // LH5 = 102.0, LL5 = 98.5
  [99.0, 100.0, 98.0, 99.5],
  [99.5, 100.0, 96.5, 97.0], // LH6 = 100.0, LL6 = 96.5
];

const DOWN = toCandles(DOWNTREND_BARS, '2024-04-01');
const downT = (i: number) => DOWN[i].time;

/* ---------------------------------------------------------------------------
 * Dataset 4 — Sideways / Range (Equal Highs and Equal Lows)
 * ------------------------------------------------------------------------- */

const SIDEWAYS_BARS: Array<[number, number, number, number]> = [
  [100.0, 102.5, 99.5, 102.0],
  [102.0, 104.0, 101.0, 103.0],
  [103.0, 104.0, 101.5, 102.0], // EQH touch 1 (104.0)
  [102.0, 102.5, 100.0, 100.5],
  [100.5, 101.5, 99.5, 100.0], // EQL touch 1 (99.5)
  [100.0, 102.0, 99.5, 101.5],
  [101.5, 103.0, 101.0, 102.5],
  [102.5, 104.0, 102.0, 103.5], // EQH touch 2 (104.0)
  [103.5, 104.0, 101.0, 101.5],
  [101.5, 102.0, 99.5, 100.0], // EQL touch 2 (99.5)
  [100.0, 102.0, 99.5, 101.5],
  [101.5, 103.5, 101.0, 103.0],
  [103.0, 104.0, 102.5, 103.5], // EQH touch 3 (104.0)
  [103.5, 104.0, 101.5, 102.0],
  [102.0, 102.5, 99.5, 100.0], // EQL touch 3 (99.5)
  [100.0, 101.5, 99.5, 101.0],
  [101.0, 103.0, 100.5, 102.5],
  [102.5, 104.0, 102.0, 103.5], // EQH touch 4 (104.0)
  [103.5, 104.0, 102.0, 102.5],
];

const SIDE = toCandles(SIDEWAYS_BARS, '2024-05-06');
const sideT = (i: number) => SIDE[i].time;

/* ---------------------------------------------------------------------------
 * Dataset 5 — SMC: drop → Order Block → impulsive FVG → pullback → rally
 * ------------------------------------------------------------------------- */

const SMC_BARS: Array<[number, number, number, number]> = [
  [110.0, 111.0, 108.5, 109.0],
  [109.0, 109.5, 107.0, 107.5],
  [107.5, 108.0, 105.5, 106.0],
  [106.0, 107.5, 105.5, 107.0],
  [107.0, 107.5, 104.5, 105.0],
  [105.0, 106.0, 104.0, 105.5],
  [105.5, 106.0, 102.5, 103.0],
  [103.0, 104.0, 102.0, 103.5],
  [103.5, 104.0, 101.0, 101.6], // bearish
  [101.6, 102.0, 100.2, 100.6], // bearish → Order Block (100.2–102.0)
  [100.6, 103.9, 100.5, 103.6], // impulse candle 1 (high 103.9)
  [103.6, 106.3, 103.2, 106.0], // impulse candle 2
  [106.0, 108.6, 105.8, 108.3], // impulse candle 3 (low 105.8) → FVG 103.9–105.8
  [108.3, 108.6, 106.0, 107.2], // pullback 1
  [107.2, 107.4, 105.1, 105.6], // pullback 2 wicks into the FVG
  [105.6, 109.2, 105.4, 108.9], // rejection from FVG
  [108.9, 111.0, 108.4, 110.7], // continuation
  [110.7, 111.2, 109.0, 109.5], // pullback
  [109.5, 111.8, 109.2, 111.5], // continuation
  [111.5, 112.6, 111.0, 112.3],
];

const SMC = toCandles(SMC_BARS, '2024-06-10');
const smcT = (i: number) => SMC[i].time;

/* ---------------------------------------------------------------------------
 * Dataset 6 — Liquidity sweep (uptrend, sweep below last swing low, reversal)
 * ------------------------------------------------------------------------- */

const SWEEP_BARS: Array<[number, number, number, number]> = [
  [100.0, 102.0, 99.5, 101.5],
  [101.5, 103.0, 100.5, 102.5],
  [102.5, 103.5, 101.5, 102.0],
  [102.0, 104.0, 101.5, 103.5],
  [103.5, 105.0, 103.0, 104.5], // SH1 = 105.0
  [104.5, 105.0, 103.0, 103.5],
  [103.5, 104.0, 102.0, 102.5], // HL1 = 102.0
  [102.5, 104.5, 102.0, 104.0],
  [104.0, 106.0, 103.5, 105.5], // SH2 = 106.0
  [105.5, 106.0, 104.5, 105.0],
  [105.0, 105.5, 103.5, 104.0], // HL2 = 103.5
  [104.0, 106.5, 103.5, 106.0],
  [106.0, 107.5, 105.5, 107.0], // SH3 = 107.5
  [107.0, 107.5, 106.0, 106.5],
  [106.5, 107.0, 105.0, 105.5], // HL3 = 105.0 (last swing low)
  [105.5, 107.0, 105.0, 106.5],
  [106.5, 107.0, 103.2, 106.8], // SWEEP: wicks to 103.2, closes back up
  [106.8, 109.0, 106.5, 108.7], // rally
  [108.7, 110.2, 108.2, 109.9],
  [109.9, 110.5, 108.6, 109.1],
];

const SWEEP = toCandles(SWEEP_BARS, '2024-07-01');
const swpT = (i: number) => SWEEP[i].time;

/* ---------------------------------------------------------------------------
 * Dataset 7 — Inducement (minor high baits sellers, fakeout, then breaks)
 * ------------------------------------------------------------------------- */

const IDM_BARS: Array<[number, number, number, number]> = [
  [100.0, 102.0, 99.5, 101.5],
  [101.5, 103.0, 100.5, 102.5],
  [102.5, 103.5, 101.5, 102.0],
  [102.0, 104.0, 101.5, 103.5],
  [103.5, 105.0, 103.0, 104.5],
  [104.5, 105.0, 103.0, 103.5],
  [103.5, 104.0, 102.0, 102.5],
  [102.5, 104.5, 102.0, 104.0],
  [104.0, 105.8, 103.5, 105.5], // IDM high 105.8 (minor swing high)
  [105.5, 105.8, 103.8, 104.2], // rejection at IDM
  [104.2, 104.6, 102.8, 103.2],
  [103.2, 103.8, 102.0, 102.4], // breaks minor low 102.8 — fakeout
  [102.4, 106.0, 102.2, 105.6], // strong reversal
  [105.6, 108.0, 105.2, 107.6], // breaks the IDM high
  [107.6, 108.4, 106.6, 107.0],
];

const IDM = toCandles(IDM_BARS, '2024-07-15');
const idmT = (i: number) => IDM[i].time;

/* ---------------------------------------------------------------------------
 * Dataset 8 — Kill zones (intraday, London 08–12, New York 13–17 UTC)
 * ------------------------------------------------------------------------- */

const KZ_BARS: Array<[number, number, number, number]> = [
  [100.0, 100.6, 99.7, 100.3],
  [100.3, 100.9, 100.0, 100.6], // London open
  [100.6, 101.4, 100.4, 101.1],
  [101.1, 101.8, 100.9, 101.5],
  [101.5, 102.1, 101.2, 101.8],
  [101.8, 102.4, 101.6, 102.1],
  [102.1, 102.8, 102.0, 102.5], // New York open
  [102.5, 103.4, 102.3, 103.1],
  [103.1, 103.8, 102.9, 103.5],
  [103.5, 104.2, 103.3, 103.9],
  [103.9, 104.6, 103.7, 104.3],
];

const KZ: Candle[] = KZ_BARS.map(([open, high, low, close], i) => ({
  time: utcHour(7 + i),
  open,
  high,
  low,
  close,
}));

/* ---------------------------------------------------------------------------
 * Dataset 9 — Wyckoff accumulation (volume) with Spring → markup
 * ------------------------------------------------------------------------- */

const WACC_BARS: Array<[number, number, number, number, number]> = [
  [112.0, 112.8, 110.2, 110.8, 9000],
  [110.8, 111.4, 109.0, 109.4, 8500],
  [109.4, 110.0, 107.6, 108.0, 9000],
  [108.0, 108.8, 106.2, 106.8, 9500],
  [106.8, 107.4, 104.6, 105.0, 10000], // PS — preliminary support
  [105.0, 105.6, 102.4, 102.9, 16000], // SC — selling climax (high volume)
  [102.9, 105.8, 102.6, 105.4, 13000], // AR — automatic rally
  [105.4, 106.0, 103.8, 104.4, 7000], // ST — secondary test (low volume)
  [104.4, 105.2, 103.2, 103.8, 5500],
  [103.8, 104.8, 103.0, 103.6, 5000],
  [103.6, 105.2, 103.2, 104.8, 6000],
  [104.8, 105.6, 104.0, 104.6, 5500],
  [104.6, 105.4, 103.4, 104.0, 5000],
  [104.0, 105.0, 102.8, 103.4, 5200],
  [103.4, 104.4, 102.6, 103.2, 4800], // range low 102.6
  [103.2, 104.0, 101.8, 102.2, 9000], // SPRING — shakeout below the range
  [102.2, 104.6, 101.6, 104.2, 11000], // rally back inside
  [104.2, 106.0, 103.8, 105.6, 12000], // SOS — sign of strength
  [105.6, 106.4, 104.6, 105.0, 6000], // LPS — last point of support
  [105.0, 107.2, 104.6, 106.8, 10000], // markup
  [106.8, 108.6, 106.4, 108.2, 11000],
  [108.2, 109.8, 107.8, 109.4, 12000],
  [109.4, 110.6, 109.0, 110.2, 13000],
  [110.2, 111.4, 109.8, 111.0, 13500],
  [111.0, 112.2, 110.6, 111.8, 14000],
];

const WACC = toCandlesWithVolume(WACC_BARS, '2024-08-05');
const waccT = (i: number) => WACC[i].time;

/* ---------------------------------------------------------------------------
 * Dataset 10 — Wyckoff distribution (volume) with UTAD → markdown
 * ------------------------------------------------------------------------- */

const WDIST_BARS: Array<[number, number, number, number, number]> = [
  [108.0, 110.0, 107.5, 109.5, 8000],
  [109.5, 111.2, 109.0, 110.8, 9000],
  [110.8, 112.4, 110.4, 112.0, 10000],
  [112.0, 113.6, 111.6, 113.2, 11000],
  [113.2, 114.8, 112.8, 114.4, 12000], // BC — buying climax
  [114.4, 114.8, 112.4, 112.8, 14500], // AR — automatic reaction (high volume)
  [112.8, 114.0, 112.0, 113.6, 9000], // ST — secondary test
  [113.6, 114.2, 112.2, 112.6, 7000],
  [112.6, 113.8, 111.8, 113.4, 8000],
  [113.4, 114.4, 112.6, 113.0, 7500],
  [113.0, 114.2, 112.0, 112.4, 8000],
  [112.4, 113.6, 111.6, 112.0, 7000],
  [112.0, 113.2, 111.2, 111.6, 6500], // range low 111.2
  [111.6, 112.8, 111.0, 112.4, 7000],
  [112.4, 115.6, 112.2, 114.8, 11500], // UTAD — upthrust above the range
  [114.8, 115.0, 112.6, 113.0, 9000], // failure
  [113.0, 113.6, 111.0, 111.4, 9500], // markdown begins
  [111.4, 111.8, 109.4, 109.8, 11000],
  [109.8, 110.4, 107.8, 108.2, 12000],
  [108.2, 108.8, 106.2, 106.6, 13000],
];

const WDIST = toCandlesWithVolume(WDIST_BARS, '2024-09-02');
const wdistT = (i: number) => WDIST[i].time;

/* ---------------------------------------------------------------------------
 * Dataset 11 — Price action: Doji at trend extremes
 * ------------------------------------------------------------------------- */

const DOJI_BARS: Array<[number, number, number, number]> = [
  [100.0, 102.0, 99.5, 101.5],
  [101.5, 103.0, 100.5, 102.5],
  [102.5, 104.0, 102.0, 103.6],
  [103.6, 105.2, 103.2, 104.8],
  [104.8, 106.4, 104.4, 106.0],
  [106.0, 107.6, 105.6, 107.2],
  [107.2, 108.8, 106.8, 108.4],
  [108.4, 109.9, 108.0, 109.5],
  [109.5, 109.9, 108.2, 109.4], // DOJI at the top — indecision
  [109.4, 109.6, 107.0, 107.4], // drop
  [107.4, 107.6, 105.4, 105.8],
  [105.8, 106.0, 103.8, 104.2],
  [104.2, 104.4, 102.2, 102.6],
  [102.6, 102.8, 100.6, 101.0],
  [101.0, 101.2, 98.9, 99.3],
  [99.3, 99.5, 97.8, 98.2],
  [98.2, 98.4, 96.6, 97.0],
  [97.0, 97.2, 95.4, 95.8],
  [95.8, 96.0, 95.5, 95.8], // DOJI at the bottom — exhaustion
  [95.8, 98.0, 95.7, 97.6], // rally
];

const DOJI = toCandles(DOJI_BARS, '2024-09-23');
const dojiT = (i: number) => DOJI[i].time;

/* ---------------------------------------------------------------------------
 * Dataset 12 — Price action: Engulfing at both extremes
 * ------------------------------------------------------------------------- */

const ENG_BARS: Array<[number, number, number, number]> = [
  [100.0, 102.0, 99.5, 101.5],
  [101.5, 103.0, 100.5, 102.5],
  [102.5, 104.0, 102.0, 103.6],
  [103.6, 105.2, 103.2, 104.8],
  [104.8, 106.4, 104.4, 106.0],
  [106.0, 107.6, 105.6, 107.2],
  [107.2, 108.8, 106.8, 108.4],
  [108.4, 109.9, 108.0, 109.5],
  [109.5, 109.8, 107.6, 108.0], // small bearish candle
  [108.0, 110.0, 107.8, 109.6], // BEARISH ENGULFING
  [109.6, 109.8, 107.4, 107.8], // drop
  [107.8, 108.0, 105.6, 106.0],
  [106.0, 106.2, 103.8, 104.2],
  [104.2, 104.4, 102.2, 102.6],
  [102.6, 102.8, 100.4, 100.8],
  [100.8, 101.0, 99.2, 99.6],
  [99.6, 99.8, 97.4, 97.8], // small bearish candle
  [97.8, 100.2, 97.6, 99.9], // BULLISH ENGULFING
  [99.9, 102.0, 99.5, 101.6], // rally
  [101.6, 103.2, 101.2, 102.8],
];

const ENG = toCandles(ENG_BARS, '2024-10-07');
const engT = (i: number) => ENG[i].time;

/* ---------------------------------------------------------------------------
 * Dataset 13 — Quasimodo: HH → break of neckline → retest → decline
 * ------------------------------------------------------------------------- */

const QML_BARS: Array<[number, number, number, number]> = [
  [100.0, 102.0, 99.5, 101.5],
  [101.5, 103.0, 100.5, 102.5],
  [102.5, 104.0, 102.0, 103.6],
  [103.6, 105.2, 103.2, 104.8],
  [104.8, 106.4, 104.4, 106.0], // SH1 = 106.4
  [106.0, 106.4, 104.2, 104.6], // pullback
  [104.6, 105.2, 103.0, 103.4], // HL1 = 103.0 (neckline)
  [103.4, 105.6, 103.0, 105.2], // rally
  [105.2, 107.4, 104.8, 106.8], // SH2 = 107.4 (higher high — liquidity grab)
  [106.8, 107.0, 102.2, 102.6], // BREAK of the neckline
  [102.6, 104.8, 102.4, 104.4], // retest of the broken neckline (QML entry)
  [104.4, 104.6, 101.6, 102.0], // decline resumes
  [102.0, 102.2, 99.4, 99.8],
  [99.8, 100.0, 97.6, 98.0],
];

const QML = toCandles(QML_BARS, '2024-10-21');
const qmlT = (i: number) => QML[i].time;

/* ---------------------------------------------------------------------------
 * Dataset 14 — Supply & Demand zones
 * ------------------------------------------------------------------------- */

const SND_BARS: Array<[number, number, number, number]> = [
  [100.0, 100.8, 99.2, 99.6],
  [99.6, 100.0, 98.0, 98.4], // demand zone base
  [98.4, 101.8, 98.2, 101.4], // strong rally away from demand
  [101.4, 103.6, 101.0, 103.2],
  [103.2, 105.4, 102.8, 105.0],
  [105.0, 107.2, 104.6, 106.8],
  [106.8, 108.6, 106.4, 108.2],
  [108.2, 109.8, 107.8, 109.4],
  [109.4, 111.0, 109.0, 110.6],
  [110.6, 112.2, 110.2, 111.8],
  [111.8, 112.4, 110.4, 110.8], // supply zone top
  [110.8, 111.0, 108.8, 109.2], // reversal from supply
  [109.2, 109.4, 107.2, 107.6],
  [107.6, 107.8, 105.4, 105.8],
  [105.8, 106.0, 103.6, 104.0],
  [104.0, 104.2, 101.8, 102.2],
];

const SND = toCandles(SND_BARS, '2024-11-04');
const sndT = (i: number) => SND[i].time;

/* ---------------------------------------------------------------------------
 * Dataset 15 — Elliott Wave: 5-wave impulse + ABC correction
 * ------------------------------------------------------------------------- */

const EW_BARS: Array<[number, number, number, number]> = [
  [103.0, 103.2, 101.2, 101.6], // lead-in drift (context before the pattern)
  [101.6, 101.8, 99.6, 100.2], // lead-in drift
  [100.0, 101.5, 99.5, 101.2], // wave 1
  [101.2, 101.4, 99.8, 100.2], // wave 2
  [100.2, 103.5, 100.0, 103.2], // wave 3
  [103.2, 103.8, 101.8, 102.2], // wave 4
  [102.2, 105.8, 102.0, 105.5], // wave 5
  [105.5, 105.7, 103.4, 103.8], // wave A
  [103.8, 105.0, 103.6, 104.6], // wave B
  [104.6, 104.8, 102.2, 102.5], // wave C
  [102.5, 104.0, 102.3, 103.6], // next cycle begins
];

const EW = toCandles(EW_BARS, '2024-11-14');
/** Lead-in bars prepended before wave 1 so the first marker isn't clipped at the chart edge. */
const EW_OFF = 2;
const ewT = (i: number) => EW[i + EW_OFF].time;

/* ---------------------------------------------------------------------------
 * Dataset 16 — Harmonic (Gartley X-A-B-C-D)
 * ------------------------------------------------------------------------- */

const HARM_BARS: Array<[number, number, number, number]> = [
  [103.4, 103.6, 101.8, 102.2], // lead-in drift (context before X)
  [102.2, 102.6, 100.2, 100.8], // lead-in drift
  [100.0, 100.8, 99.4, 100.6], // X
  [100.6, 104.0, 100.4, 103.6], // X→A
  [103.6, 108.2, 103.2, 107.8],
  [107.8, 112.2, 107.4, 111.8], // A = 112.2
  [111.8, 112.0, 108.6, 109.0], // A→B
  [109.0, 109.2, 106.6, 107.2], // B = 106.6
  [107.2, 110.8, 107.0, 110.4], // B→C
  [110.4, 110.6, 108.2, 108.6], // C = 110.6
  [108.6, 108.8, 105.2, 105.6], // C→D
  [105.6, 105.8, 102.4, 102.8], // D = 102.4 (~0.79 of XA)
  [102.8, 106.0, 102.6, 105.6], // reversal up from D
  [105.6, 108.4, 105.2, 108.0],
];

const HARM = toCandles(HARM_BARS, '2024-11-28');
/** Lead-in bars prepended before X so the first marker isn't clipped at the chart edge. */
const HARM_OFF = 2;
const harmT = (i: number) => HARM[i + HARM_OFF].time;

/* ---------------------------------------------------------------------------
 * Dataset 17 — VSA signals with volume
 * ------------------------------------------------------------------------- */

const VSA_BARS: Array<[number, number, number, number, number]> = [
  [110.0, 110.8, 108.6, 109.0, 10000],
  [109.0, 109.6, 107.4, 107.8, 11000],
  [107.8, 108.4, 106.0, 106.4, 12000],
  [106.4, 107.0, 104.4, 104.8, 13000],
  [104.8, 105.4, 102.8, 103.2, 14000],
  [103.2, 103.8, 101.0, 101.4, 15000],
  [101.4, 102.0, 99.4, 99.8, 17000],
  [99.8, 100.4, 98.0, 98.4, 19000],
  [98.4, 99.0, 96.2, 96.6, 22000],
  [96.6, 98.4, 96.4, 98.0, 26000], // SELLING CLIMAX — huge volume, wide spread
  [98.0, 99.6, 97.8, 99.2, 18000],
  [99.2, 100.4, 98.8, 100.0, 14000],
  [100.0, 100.6, 98.6, 99.0, 9000], // NO DEMAND — down close on low volume
  [99.0, 100.8, 98.8, 100.4, 8000], // NO SUPPLY — up bar on low volume
  [100.4, 102.2, 100.0, 101.8, 10000],
  [101.8, 103.6, 101.4, 103.2, 12000],
  [103.2, 104.8, 102.8, 104.4, 14000],
  [104.4, 105.8, 104.0, 105.4, 16000],
  [105.4, 106.6, 105.0, 106.2, 18000],
  [106.2, 107.4, 105.8, 107.0, 20000],
];

const VSA = toCandlesWithVolume(VSA_BARS, '2024-12-16');
const vsaT = (i: number) => VSA[i].time;

/* ---------------------------------------------------------------------------
 * Dataset 18 — Volume profile (range with distinct value area)
 * ------------------------------------------------------------------------- */

const VPROF_BARS: Array<[number, number, number, number, number]> = [
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
  [103.8, 104.6, 103.4, 104.2, 13500],
  [104.2, 105.0, 103.6, 103.8, 15500],
  [103.8, 104.4, 102.6, 103.0, 17000],
  [103.0, 103.8, 101.8, 102.2, 18500],
];

const VPROF = toCandlesWithVolume(VPROF_BARS, '2025-01-06');
const vprofT = (i: number) => VPROF[i].time;

// POC / value area computed from the same buckets the chart plugin draws.
const VPROF_PROFILE = computeVolumeProfile(VPROF, 24);

/* ---------------------------------------------------------------------------
 * Dataset 19 — Ichimoku (generated trending series)
 * ------------------------------------------------------------------------- */

const ICH = generateSeries(90, '2025-01-06', {
  startPrice: 100,
  drift: 0.32,
  amplitude: 1.7,
  frequency: 0.22,
  noise: 0.55,
  seed: 42,
});

/* ---------------------------------------------------------------------------
 * Dataset 20 — Mean reversion (range with Bollinger-band-testing spikes)
 * ------------------------------------------------------------------------- */

const MR = generateSeries(44, '2025-02-17', {
  startPrice: 100,
  drift: 0,
  amplitude: 2.8,
  frequency: 0.28,
  noise: 0.5,
  seed: 7,
  spikes: { 5: 4.5, 17: -4.5, 28: 4.5, 39: -4.5 },
});

// Markers where price closes outside the Bollinger bands (mean-reversion trades).
function meanReversionMarkers(candles: Candle[]): MarkerSpec[] {
  const bands = bollingerBands(candles, 20, 2);
  const markers: MarkerSpec[] = [];
  candles.forEach((c, i) => {
    const upper = bands.upper[i];
    const lower = bands.lower[i];
    if (upper !== null && c.close > upper) {
      markers.push({
        time: c.time,
        position: 'aboveBar',
        shape: 'arrowDown',
        color: COLORS.amber,
        text: 'Overbought',
      });
    }
    if (lower !== null && c.close < lower) {
      markers.push({
        time: c.time,
        position: 'belowBar',
        shape: 'arrowUp',
        color: COLORS.bull,
        text: 'Oversold',
      });
    }
  });
  return markers;
}

const MR_MARKERS = meanReversionMarkers(MR);

/* ---------------------------------------------------------------------------
 * Trading Playbook datasets — high-volatility, Gold/XAUUSD-like price levels
 * with noticeable wicks and liquidity sweeps. Each is a complete, tradable
 * setup with Entry / Stop Loss / Take Profit metadata (see `trade`).
 * ------------------------------------------------------------------------- */

/** SMC Order Block Entry (long) — sweep of equal lows → CHoCH → OB retest. */
const PB_OB_BARS: Array<[number, number, number, number]> = [
  [2412, 2414, 2400, 2404],
  [2404, 2406, 2382, 2386],
  [2386, 2390, 2370, 2374],
  [2374, 2378, 2352, 2356],
  [2356, 2358, 2348, 2350], // equal lows = sell-side liquidity (2348)
  [2350, 2352, 2342, 2345], // SWEEP below 2348 → 2342 (bullish OB candle)
  [2345, 2370, 2343, 2368], // CHoCH — strong reversal
  [2368, 2395, 2365, 2392], // impulse
  [2392, 2412, 2388, 2408], // higher high
  [2408, 2412, 2396, 2400], // pullback
  [2400, 2404, 2355, 2360], // deep pullback toward the OB
  [2360, 2365, 2348, 2356], // OB tap + rejection → entry
  [2356, 2405, 2352, 2400], // expansion
  [2400, 2435, 2398, 2432], // rally → TP (opposing liquidity 2435)
  [2432, 2438, 2426, 2430],
];
const PB_OB = toCandles(PB_OB_BARS, '2025-11-10');
const pbObT = (i: number) => PB_OB[i].time;

/** FVG Fill (long) — 3-candle impulse leaves a gap, pullback fills it. */
const PB_FVG_BARS: Array<[number, number, number, number]> = [
  [2398, 2400, 2385, 2388],
  [2388, 2392, 2380, 2384],
  [2384, 2388, 2376, 2380],
  [2380, 2385, 2372, 2376], // consolidation base (demand zone)
  [2376, 2400, 2374, 2396], // impulse A
  [2396, 2435, 2394, 2430], // impulse B
  [2430, 2450, 2428, 2445], // impulse C — FVG = A.high (2400) → C.low (2428)
  [2445, 2452, 2436, 2440], // distribution high 2452 (buy-side liquidity)
  [2440, 2444, 2415, 2420], // pullback
  [2420, 2426, 2405, 2410], // filling the gap
  [2410, 2414, 2398, 2406], // gap filled + rejection → entry
  [2406, 2440, 2404, 2438], // expansion
  [2438, 2460, 2435, 2455], // → TP (prior high 2452 / liquidity)
  [2455, 2462, 2448, 2452],
];
const PB_FVG = toCandles(PB_FVG_BARS, '2025-11-10');
const pbFvgT = (i: number) => PB_FVG[i].time;

/** Wyckoff Accumulation / Spring (long) — SC → AR → ST → Test → Spring. */
const PB_SPRING_BARS: Array<[number, number, number, number, number]> = [
  [2420, 2422, 2406, 2408, 980],
  [2408, 2410, 2392, 2394, 1120],
  [2394, 2396, 2378, 2380, 1900], // SC — selling climax: wide spread, huge volume, closes near lows
  [2380, 2398, 2378, 2394, 860], // AR — automatic rally
  [2394, 2398, 2384, 2388, 620], // ST — secondary test holds above the SC low
  [2388, 2392, 2380, 2384, 540], // Test — quiet retest of the range low
  [2384, 2386, 2380, 2382, 600], // pin at the range low
  [2380, 2384, 2362, 2382, 1380], // SPRING — sweep to 2362, closes back inside, volume spike
  [2382, 2392, 2380, 2388, 950], // confirmation → entry
  [2388, 2400, 2386, 2398, 1100], // SOS — sign of strength
  [2398, 2418, 2396, 2414, 1250], // markup
  [2414, 2432, 2412, 2428, 1400], // → TP (range high / UTAD area)
  [2428, 2438, 2424, 2432, 1050],
];
const PB_SPRING = toCandlesWithVolume(PB_SPRING_BARS, '2025-11-10');
const pbSprT = (i: number) => PB_SPRING[i].time;

/** QML Reversal (short) — higher high, neckline break, retest entry. */
const PB_QML_BARS: Array<[number, number, number, number]> = [
  [2380, 2385, 2372, 2376],
  [2376, 2398, 2374, 2394],
  [2394, 2398, 2386, 2390],
  [2390, 2420, 2388, 2416], // rally
  [2416, 2420, 2408, 2412], // pullback — swing low 2408 (the neckline)
  [2412, 2442, 2410, 2438], // rally
  [2438, 2450, 2436, 2444], // higher high 2450 — grabs buy-side liquidity (2442)
  [2444, 2448, 2426, 2430], // reversal candle
  [2430, 2434, 2406, 2410], // break of neckline 2408 → CHoCH
  [2410, 2414, 2402, 2406], // follow-through down
  [2406, 2418, 2404, 2412], // neckline retest → entry (short)
  [2412, 2416, 2392, 2396], // decline
  [2396, 2400, 2372, 2376], // → TP (sell-side liquidity below)
  [2376, 2380, 2366, 2370],
];
const PB_QML = toCandles(PB_QML_BARS, '2025-11-10');
const pbQmlT = (i: number) => PB_QML[i].time;

/** Bearish Bat (short) — X→A impulse, B 0.5, C 0.886 of AB, D at 0.886 of XA. */
const PB_BAT_BARS: Array<[number, number, number, number]> = [
  [2412, 2416, 2404, 2408], // lead-in drift (context before X)
  [2408, 2412, 2392, 2396], // lead-in drift
  [2390, 2396, 2388, 2394], // X = 2388 (swing low)
  [2394, 2420, 2392, 2416], // X→A rally
  [2416, 2422, 2408, 2412],
  [2412, 2432, 2410, 2428],
  [2428, 2450, 2426, 2446], // A = 2450 (high) — buy-side liquidity grab
  [2446, 2448, 2430, 2434], // A→B drop
  [2434, 2438, 2424, 2428],
  [2428, 2432, 2418, 2422], // B = 2418 (low) — 0.5 of XA
  [2422, 2440, 2420, 2436], // B→C rally
  [2436, 2445, 2432, 2440], // C = 2445 (high) — 0.886 of AB (below A)
  [2440, 2442, 2420, 2424], // C→D drop
  [2424, 2428, 2406, 2410],
  [2410, 2414, 2395, 2399], // D = 2395 (0.886 of XA) — PRZ, rejection close
  [2399, 2402, 2378, 2382], // decline
  [2382, 2386, 2360, 2364], // → TP 2360 (sell-side liquidity below X)
  [2364, 2368, 2352, 2356],
];
const PB_BAT = toCandles(PB_BAT_BARS, '2025-11-06');
/** Lead-in bars prepended before X so the first marker isn't clipped at the chart edge. */
const PB_BAT_OFF = 2;
const pbBatT = (i: number) => PB_BAT[i + PB_BAT_OFF].time;

/** VSA Stopping Volume at Support (long) — climax, no demand, SOS. */
const PB_VSA_BARS: Array<[number, number, number, number, number]> = [
  [2428, 2430, 2416, 2418, 820],
  [2418, 2420, 2404, 2406, 900],
  [2406, 2408, 2392, 2394, 980],
  [2394, 2396, 2382, 2384, 1050], // approach support 2382
  [2384, 2392, 2374, 2386, 2150], // STOPPING VOLUME — wide spread, huge volume, close in upper half
  [2386, 2388, 2378, 2380, 540], // no demand 1
  [2380, 2382, 2372, 2374, 470], // no demand 2 — even lower volume
  [2374, 2390, 2372, 2388, 1180], // SOS — up bar, rising volume → entry
  [2388, 2410, 2386, 2406, 1360], // expansion
  [2406, 2432, 2404, 2428, 1520], // → TP 2430 (resistance / buy-side liquidity)
  [2428, 2435, 2424, 2430, 920],
];
const PB_VSA = toCandlesWithVolume(PB_VSA_BARS, '2025-11-10');
const pbVsaT = (i: number) => PB_VSA[i].time;

/** Uptrend Continuation (long) — HH/HL sequence, BOS, pullback entry. */
const PB_UP_BARS: Array<[number, number, number, number]> = [
  [2400, 2404, 2394, 2398],
  [2398, 2412, 2396, 2408], // rally
  [2408, 2410, 2398, 2400], // HL1 = 2398
  [2400, 2416, 2398, 2412], // SH1 = 2416
  [2412, 2414, 2404, 2406], // pullback
  [2406, 2408, 2398, 2400], // HL2 = 2398 — equal lows (demand)
  [2400, 2424, 2398, 2420], // HH = 2424
  [2420, 2422, 2410, 2412], // pullback
  [2412, 2414, 2404, 2406], // HL3 = 2404
  [2406, 2430, 2404, 2426], // BOS — breaks 2424
  [2426, 2428, 2418, 2420], // pullback after the BOS
  [2420, 2422, 2412, 2416], // HL4 = 2412, rejection → entry
  [2416, 2440, 2414, 2436], // continuation
  [2436, 2448, 2434, 2444], // → TP (external high / liquidity)
];
const PB_UP = toCandles(PB_UP_BARS, '2025-11-10');
const pbUpT = (i: number) => PB_UP[i].time;

/** Turtle Trading (breakout) — consolidation then a 20-day high breakout. */
const TURTLE_BARS: Array<[number, number, number, number]> = [
  [2398, 2402, 2392, 2396],
  [2396, 2400, 2390, 2394],
  [2394, 2398, 2388, 2392],
  [2392, 2396, 2386, 2390],
  [2390, 2394, 2384, 2388], // 20-day low = 2384
  [2388, 2396, 2386, 2394],
  [2394, 2398, 2390, 2396],
  [2396, 2400, 2392, 2398],
  [2398, 2404, 2396, 2402],
  [2402, 2406, 2398, 2404],
  [2404, 2408, 2400, 2406],
  [2406, 2410, 2402, 2408],
  [2408, 2412, 2404, 2410],
  [2410, 2414, 2406, 2412],
  [2412, 2416, 2408, 2414],
  [2414, 2418, 2410, 2416],
  [2416, 2420, 2412, 2418], // testing the 20-day high (2420)
  [2418, 2420, 2414, 2416], // rejection
  [2416, 2420, 2412, 2418],
  [2418, 2424, 2416, 2422], // BREAKOUT above 2420 → entry
  [2422, 2436, 2420, 2434], // follow-through
  [2434, 2444, 2432, 2440],
];
const TURTLE = toCandles(TURTLE_BARS, '2025-11-10');
const turtleT = (i: number) => TURTLE[i].time;

const FLAG_BARS: Array<[number, number, number, number]> = [
  [100, 102, 99, 101],
  [101, 105, 100, 104],
  [104, 110, 103, 109],
  [109, 115, 108, 114],
  [114, 120, 113, 119], // peak 4
  [119, 120, 117, 118], // 5
  [118, 119, 115, 116], // 6
  [116, 117, 114, 115], // 7
  [115, 118, 113, 114], // 8
  [114, 116, 112, 113], // 9
  [113, 118, 112, 117], // 10 breakout
  [117, 122, 116, 121],
  [121, 126, 120, 125],
];
const FLAG = toCandles(FLAG_BARS, '2024-05-01');
const flagT = (i: number) => FLAG[i].time;

const DOUBLE_TOP_BARS: Array<[number, number, number, number]> = [
  [100, 105, 99, 104],
  [104, 110, 102, 108],
  [108, 115, 106, 114],
  [114, 120, 112, 118], // First top start
  [118, 122, 116, 117], // First peak 4
  [117, 118, 110, 111],
  [111, 113, 106, 108], // Neckline 6
  [108, 115, 107, 114],
  [114, 121, 112, 119],
  [119, 123, 115, 117], // Second peak 9
  [117, 118, 110, 112],
  [112, 114, 106, 107], // Neckline test 11
  [107, 110, 100, 102], // Breakout 12
  [102, 105, 95, 98],
];
const DOUBLE_TOP = toCandles(DOUBLE_TOP_BARS, '2024-06-01');
const dtT = (i: number) => DOUBLE_TOP[i].time;

const HS_BARS: Array<[number, number, number, number]> = [
  [100, 105, 99, 104],
  [104, 115, 102, 112], // Left shoulder peak 1
  [112, 113, 106, 108], // Neckline 2
  [108, 120, 107, 118],
  [118, 125, 115, 117], // Head peak 4
  [117, 118, 107, 109], // Neckline 5
  [109, 116, 108, 114],
  [114, 115, 109, 110], // Right shoulder peak 7
  [110, 111, 105, 106],
  [106, 108, 98, 100], // Breakout 9
];
const HEAD_SHOULDERS = toCandles(HS_BARS, '2024-07-01');
const hsT = (i: number) => HEAD_SHOULDERS[i].time;

const ASC_TRI_BARS: Array<[number, number, number, number]> = [
  [100, 103, 99.5, 102.5],
  [102.5, 105, 102, 104.5],
  [104.5, 106, 103.5, 105], // H1 = 106 (resistance)
  [105, 105.5, 103, 103.5], // L1 = 103
  [103.5, 106, 103.5, 105.5], // H2 = 106 (equal high)
  [105.5, 106, 104, 104.5], // L2 = 104 (higher low)
  [104.5, 106, 104.5, 105.5], // H3 = 106 (equal high)
  [105.5, 106, 105, 105.5], // L3 = 105 (higher low)
  [105.5, 108.5, 105.5, 108], // Breakout above 106 → entry
  [108, 111, 107.5, 110.5], // follow-through
];
const ASC_TRI = toCandles(ASC_TRI_BARS, '2024-08-01');
const ascT = (i: number) => ASC_TRI[i].time;

const DESC_TRI_BARS: Array<[number, number, number, number]> = [
  [110, 112, 109.5, 111.5],
  [111.5, 111.5, 109, 109.5], // L1 = 109 (support)
  [109.5, 112, 109.5, 111.5], // H1 = 112
  [111.5, 111.5, 109, 109.5], // L2 = 109 (equal low)
  [109.5, 111, 109.5, 110], // H2 = 111 (lower high)
  [110, 110.5, 109, 109.5], // L3 = 109 (equal low)
  [109.5, 110.5, 109.5, 110], // H3 = 110.5 (lower high)
  [110, 110, 108.5, 109], // L4 = 109
  [109, 109.5, 106, 106.5], // Breakdown below 109 → entry
  [106.5, 107, 104, 104.5], // follow-through
];
const DESC_TRI = toCandles(DESC_TRI_BARS, '2024-08-15');
const descT = (i: number) => DESC_TRI[i].time;

const CUP_BARS: Array<[number, number, number, number]> = [
  [100, 102, 99.5, 101.5],
  [101.5, 104, 101, 103.5],
  [103.5, 106, 103, 105.5],
  [105.5, 108, 105, 107.5], // left rim 108 (index 3)
  [107.5, 108, 105.5, 106], // cup descent starts
  [106, 106.5, 104, 104.5],
  [104.5, 105, 102.5, 103],
  [103, 103.5, 101.5, 102], // cup bottom ~101.5 (index 7)
  [102, 103.5, 101.5, 103],
  [103, 105, 102.5, 104.5],
  [104.5, 106.5, 104, 106], // cup ascent
  [106, 108, 105.5, 107.5], // right rim 108 (index 11)
  [107.5, 108, 106, 106.5], // handle starts
  [106.5, 107, 105, 105.5], // handle low ~105 (index 13)
  [105.5, 109.5, 105.5, 109], // breakout above 108 (index 14)
  [109, 112, 108.5, 111.5],
];
const CUP = toCandles(CUP_BARS, '2024-09-01');
const cupT = (i: number) => CUP[i].time;

const WEDGE_BARS: Array<[number, number, number, number]> = [
  [110, 111, 108.5, 109.5], // H1 = 111 (index 0)
  [109.5, 110.5, 107, 107.5], // L1 = 107 (index 1)
  [107.5, 109, 106.5, 108], // H2 = 109 (index 2)
  [108, 108.5, 105.5, 106], // L2 = 105.5 (index 3)
  [106, 107.5, 105, 106.5], // H3 = 107.5 (index 4)
  [106.5, 107, 104, 104.5], // L3 = 104 (index 5)
  [104.5, 106, 104, 105.5], // H4 = 106 (index 6)
  [105.5, 106, 102.5, 103], // L4 = 102.5 (index 7)
  [103, 105, 102.5, 104.5], // H5 = 105 (index 8) — converging
  [104.5, 108.5, 104, 108], // breakout above upper wedge (index 9)
  [108, 111, 107.5, 110.5],
];
const WEDGE = toCandles(WEDGE_BARS, '2024-09-15');
const wedgeT = (i: number) => WEDGE[i].time;

const BEAR_FLAG_BARS: Array<[number, number, number, number]> = [
  [110, 112, 109.5, 111.5],
  [111.5, 111.5, 108, 108.5], // drop starts
  [108.5, 109, 105, 105.5],
  [105.5, 106, 102, 102.5], // pole low ~102 (index 3)
  [102.5, 105, 102.5, 104.5], // flag rally starts
  [104.5, 106.5, 104, 106], // flag high 106.5 (index 5)
  [106, 106.5, 104.5, 105],
  [105, 106, 104, 104.5], // flag low 104 (index 7)
  [104.5, 105.5, 103, 103.5],
  [103.5, 104.5, 101.5, 102], // breakdown below flag (index 9)
  [102, 102.5, 99, 99.5], // follow-through
];
const BEAR_FLAG = toCandles(BEAR_FLAG_BARS, '2024-10-01');
const bfT = (i: number) => BEAR_FLAG[i].time;

const DBL_BOTTOM_BARS: Array<[number, number, number, number]> = [
  [110, 112, 109.5, 111.5],
  [111.5, 111.5, 108, 108.5], // decline begins
  [108.5, 109, 105, 105.5],
  [105.5, 106, 102, 102.5], // Bottom 1 = 102 (index 3)
  [102.5, 105.5, 102.5, 105], // rally to neckline
  [105, 107, 104.5, 106.5], // neckline test ~106.5
  [106.5, 107, 104, 104.5], // pullback
  [104.5, 105, 102, 102.5], // Bottom 2 = 102 (index 7) — equal low
  [102.5, 106.5, 102.5, 106], // rally back to neckline
  [106, 109, 105.5, 108.5], // breakout above neckline (index 9)
  [108.5, 111, 108, 110.5], // follow-through
  [110.5, 113, 110, 112.5],
];
const DBL_BOTTOM = toCandles(DBL_BOTTOM_BARS, '2024-10-15');
const dbT = (i: number) => DBL_BOTTOM[i].time;

const RISING_WEDGE_BARS: Array<[number, number, number, number]> = [
  [100, 102, 99.5, 101.5],
  [101.5, 103.5, 101, 103], // H1 = 103.5 (index 1)
  [103, 104, 101.5, 102], // L1 = 101.5 (index 2)
  [102, 105, 102, 104.5], // H2 = 105 (index 3)
  [104.5, 105.5, 103.5, 104], // L2 = 103.5 (index 4)
  [104, 106.5, 104, 106], // H3 = 106.5 (index 5)
  [106, 106.5, 105, 105.5], // L3 = 105 (index 6)
  [105.5, 107.5, 105.5, 107], // H4 = 107.5 (index 7)
  [107, 107.5, 104, 104.5], // breakdown below lower line (index 8)
  [104.5, 105, 101.5, 102], // follow-through
];
const RISING_WEDGE = toCandles(RISING_WEDGE_BARS, '2024-11-01');
const rwT = (i: number) => RISING_WEDGE[i].time;

const PENNANT_BARS: Array<[number, number, number, number]> = [
  [100, 102, 99.5, 101.5],
  [101.5, 105, 101, 104.5], // pole up
  [104.5, 110, 104, 109.5], // pole top 110 (index 2)
  [109.5, 109.5, 107, 107.5], // flag: lower high 109.5 (index 3)
  [107.5, 108, 106, 106.5], // flag: higher low 106 (index 4)
  [106.5, 108.5, 106.5, 108], // flag: lower high 108.5 (index 5)
  [108, 108.5, 107, 107.5], // flag: higher low 107 (index 6)
  [107.5, 111, 107.5, 110.5], // breakout above pennant (index 7)
  [110.5, 113.5, 110, 113], // follow-through
  [113, 116, 112.5, 115.5],
];
const PENNANT = toCandles(PENNANT_BARS, '2024-11-15');
const pnT = (i: number) => PENNANT[i].time;

const INV_HS_BARS: Array<[number, number, number, number]> = [
  [110, 112, 109.5, 111.5],
  [111.5, 112, 108, 108.5], // decline begins
  [108.5, 109, 104, 104.5], // LS low 104 (index 2)
  [104.5, 108, 104.5, 107.5], // rally to neckline
  [107.5, 108, 106, 106.5], // pullback
  [106.5, 107, 101, 101.5], // Head low 101 (index 5)
  [101.5, 106.5, 101.5, 106], // rally to neckline
  [106, 106.5, 104, 104.5], // pullback
  [104.5, 105.5, 103, 103.5], // RS low 103 (index 8)
  [103.5, 108.5, 103.5, 108], // breakout above neckline (index 9)
  [108, 112, 107.5, 111.5], // follow-through
];
const INV_HS = toCandles(INV_HS_BARS, '2024-12-01');
const ihsT = (i: number) => INV_HS[i].time;

const TRIPLE_TOP_BARS: Array<[number, number, number, number]> = [
  [100, 102, 99.5, 101.5],
  [101.5, 105, 101, 104.5], // H1 = 105 (index 1)
  [104.5, 105, 102, 102.5], // pullback to neckline 102
  [102.5, 104.5, 102.5, 104], // rally
  [104, 105, 103, 103.5], // H2 = 105 (index 4)
  [103.5, 104, 102, 102.5], // pullback
  [102.5, 104.5, 102.5, 104], // rally
  [104, 105, 103.5, 104], // H3 = 105 (index 7)
  [104, 104.5, 101.5, 102], // pullback to neckline
  [102, 102.5, 99, 99.5], // breakdown below neckline (index 9)
  [99.5, 100, 96, 96.5], // follow-through
];
const TRIPLE_TOP = toCandles(TRIPLE_TOP_BARS, '2024-12-15');
const ttT = (i: number) => TRIPLE_TOP[i].time;

const TRIPLE_BOTTOM_BARS: Array<[number, number, number, number]> = [
  [100, 102, 99.5, 101.5],
  [101.5, 102, 98, 98.5], // L1 = 98 (index 1)
  [98.5, 101, 98.5, 100.5], // rally to neckline 100.5
  [100.5, 101, 99, 99.5], // pullback
  [99.5, 100.5, 98, 98.5], // L2 = 98 (index 4)
  [98.5, 101, 98.5, 100.5], // rally
  [100.5, 101, 99.5, 100], // pullback
  [100, 100.5, 98, 98.5], // L3 = 98 (index 7)
  [98.5, 102, 98.5, 101.5], // breakout above neckline (index 8)
  [101.5, 105, 101, 104.5], // follow-through
];
const TRIPLE_BOTTOM = toCandles(TRIPLE_BOTTOM_BARS, '2025-01-01');
const tbT = (i: number) => TRIPLE_BOTTOM[i].time;

const ROUND_TOP_BARS: Array<[number, number, number, number]> = [
  [100, 102, 99.5, 101.5],
  [101.5, 104, 101, 103.5], // rally
  [103.5, 106, 103, 105.5], // H1 = 106 (index 2)
  [105.5, 106.5, 105, 105.5], // H2 = 106.5 — dome top (index 3)
  [105.5, 106, 104.5, 105], // rounding down begins
  [105, 105.5, 103.5, 104], // gradual decline
  [104, 104.5, 102.5, 103], // 
  [103, 103.5, 101.5, 102], // decline to neckline 101.5
  [102, 102.5, 100, 100.5], // breakdown below neckline (index 8)
  [100.5, 101, 98, 98.5], // follow-through
];
const ROUND_TOP = toCandles(ROUND_TOP_BARS, '2025-01-15');
const rTopT = (i: number) => ROUND_TOP[i].time;

const ROUND_BOTTOM_BARS: Array<[number, number, number, number]> = [
  [100, 102, 99.5, 101.5],
  [101.5, 102, 99.5, 100], // decline begins
  [100, 100.5, 98, 98.5], // 
  [98.5, 99, 96.5, 97], // L1 = 96.5 (index 3)
  [97, 97.5, 96, 96.5], // L2 = 96 — saucer bottom (index 4)
  [96.5, 98, 96.5, 97.5], // rounding up begins
  [97.5, 99.5, 97.5, 99], // gradual rise
  [99, 101, 98.5, 100.5], // 
  [100.5, 102, 100, 101.5], // back to neckline 102 (index 8)
  [101.5, 105, 101.5, 104.5], // breakout above neckline
];
const ROUND_BOTTOM = toCandles(ROUND_BOTTOM_BARS, '2025-02-01');
const rBotT = (i: number) => ROUND_BOTTOM[i].time;

const DIAMOND_TOP_BARS: Array<[number, number, number, number]> = [
  [100, 102, 99.5, 101.5],
  [101.5, 104, 101, 103.5], // H1 = 104 (index 1)
  [103.5, 104, 102, 102.5], // L1 = 102 (index 2)
  [102.5, 105.5, 102.5, 105], // H2 = 105.5 (index 3) — widening
  [105, 105.5, 102.5, 103], // L2 = 102.5 (index 4)
  [103, 104.5, 103, 104], // H3 = 104.5 (index 5) — narrowing
  [104, 104.5, 102.5, 103], // L3 = 102.5 (index 6)
  [103, 103.5, 101.5, 102], // L4 = 101.5 (index 7)
  [102, 102.5, 99.5, 100], // breakdown below 102 (index 8)
  [100, 100.5, 97.5, 98], // follow-through
];
const DIAMOND_TOP = toCandles(DIAMOND_TOP_BARS, '2025-02-15');
const dTopT = (i: number) => DIAMOND_TOP[i].time;

const DIAMOND_BOTTOM_BARS: Array<[number, number, number, number]> = [
  [110, 112, 109.5, 111.5],
  [111.5, 112, 109, 109.5], // L1 = 109 (index 1)
  [109.5, 110.5, 109, 109.5], // H1 = 110.5 (index 2)
  [109.5, 109.5, 106.5, 107], // L2 = 106.5 (index 3) — widening
  [107, 108, 106.5, 107], // H2 = 108 (index 4)
  [107, 107.5, 105, 105.5], // L3 = 105 (index 5) — narrowing
  [105.5, 107, 105.5, 106.5], // H3 = 107 (index 6)
  [106.5, 107, 105.5, 106], // L4 = 105.5 (index 7)
  [106, 109.5, 106, 109], // breakout above 107 (index 8)
  [109, 112, 108.5, 111.5], // follow-through
];
const DIAMOND_BOTTOM = toCandles(DIAMOND_BOTTOM_BARS, '2025-03-01');
const dBotT = (i: number) => DIAMOND_BOTTOM[i].time;

const BROADEN_TOP_BARS: Array<[number, number, number, number]> = [
  [100, 102, 99.5, 101.5],
  [101.5, 104, 101, 103.5], // H1 = 104 (index 1)
  [103.5, 104, 101.5, 102], // L1 = 101.5 (index 2)
  [102, 106, 102, 105.5], // H2 = 106 (index 3) — higher high
  [105.5, 106, 102.5, 103], // L2 = 102.5 (index 4) — lower low
  [103, 107.5, 103, 107], // H3 = 107.5 (index 5) — higher high
  [107, 107.5, 102, 102.5], // L3 = 102 (index 6) — lower low
  [102.5, 103.5, 99.5, 100], // breakdown below 102 (index 7)
  [100, 100.5, 97.5, 98], // follow-through
];
const BROADEN_TOP = toCandles(BROADEN_TOP_BARS, '2025-03-15');
const brT = (i: number) => BROADEN_TOP[i].time;

const ISLAND_REV_BARS: Array<[number, number, number, number]> = [
  [100, 102, 99.5, 101.5],
  [101.5, 105, 101, 104.5], // rally
  [104.5, 108, 104, 107.5], // H1 = 108 (index 2) — island top
  [107.5, 108, 106, 106.5], // island
  [106.5, 107.5, 105.5, 106], // island (index 4)
  [106, 107, 105, 105.5], // island L = 105 (index 5)
  [105.5, 106, 101, 101.5], // gap down — breakdown (index 6)
  [101.5, 102, 98.5, 99], // follow-through
  [99, 99.5, 96, 96.5],
];
const ISLAND_REV = toCandles(ISLAND_REV_BARS, '2025-04-01');
const islT = (i: number) => ISLAND_REV[i].time;

const BEAR_PENNANT_BARS: Array<[number, number, number, number]> = [
  [110, 112, 109.5, 111.5],
  [111.5, 111.5, 107, 107.5], // pole down
  [107.5, 108, 103, 103.5], // pole low 103 (index 2)
  [103.5, 105, 103.5, 104.5], // pennant
  [104.5, 106, 104, 105.5], // pennant high 106 (index 4)
  [105.5, 106, 104.5, 105], // pennant low 104.5 (index 5)
  [105, 105.5, 102.5, 103], // breakdown below pennant (index 6)
  [103, 103.5, 100, 100.5], // follow-through
  [100.5, 101, 97.5, 98],
];
const BEAR_PENNANT = toCandles(BEAR_PENNANT_BARS, '2025-04-15');
const bpT = (i: number) => BEAR_PENNANT[i].time;

const SYM_TRI_BARS: Array<[number, number, number, number]> = [
  [100, 102, 99.5, 101.5],
  [101.5, 105, 101, 104.5], // H1 = 105 (index 1)
  [104.5, 105, 101.5, 102], // L1 = 101.5 (index 2)
  [102, 104, 102, 103.5], // H2 = 104 (index 3) — lower high
  [103.5, 104, 101.5, 102], // L2 = 101.5 (index 4) — higher low
  [102, 103.5, 102, 103], // H3 = 103.5 (index 5)
  [103, 103.5, 101.5, 102], // L3 = 101.5 (index 6)
  [102, 105.5, 102, 105], // breakout above (index 7)
  [105, 108, 104.5, 107.5], // follow-through
];
const SYM_TRI = toCandles(SYM_TRI_BARS, '2025-05-01');
const stT = (i: number) => SYM_TRI[i].time;

const BULL_RECT_BARS: Array<[number, number, number, number]> = [
  [100, 102, 99.5, 101.5],
  [101.5, 105, 101, 104.5], // H1 = 105 (index 1)
  [104.5, 105, 101.5, 102], // L1 = 101.5 (index 2)
  [102, 105, 102, 104.5], // H2 = 105
  [104.5, 105, 101.5, 102], // L2 = 101.5 (index 4)
  [102, 105, 102, 104.5], // H3 = 105
  [104.5, 105, 101.5, 102], // L3 = 101.5 (index 6)
  [102, 106.5, 102, 106], // breakout above (index 7)
  [106, 109, 105.5, 108.5], // follow-through
];
const BULL_RECT = toCandles(BULL_RECT_BARS, '2025-05-15');
const bullRctT = (i: number) => BULL_RECT[i].time;

const BEAR_RECT_BARS: Array<[number, number, number, number]> = [
  [110, 112, 109.5, 111.5],
  [111.5, 111.5, 108, 108.5], // L1 = 108 (index 1)
  [108.5, 111, 108.5, 110.5], // H1 = 111
  [110.5, 111, 108, 108.5], // L2 = 108 (index 3)
  [108.5, 111, 108.5, 110.5], // H2 = 111
  [110.5, 111, 108, 108.5], // L3 = 108 (index 5)
  [108.5, 111, 108.5, 110.5], // H3 = 111
  [110.5, 111, 107, 107.5], // breakdown below 108 (index 7)
  [107.5, 108, 104.5, 105], // follow-through
  [105, 105.5, 102, 102.5],
];
const BEAR_RECT = toCandles(BEAR_RECT_BARS, '2025-06-01');
const bearRctT = (i: number) => BEAR_RECT[i].time;

const HAMMER_BARS: Array<[number, number, number, number]> = [
  [110, 112, 109.5, 111.5],
  [111.5, 111.5, 108, 108.5], // decline
  [108.5, 109, 105, 105.5], // decline
  [105.5, 106, 102, 102.5], // decline into the bottom
  [102.5, 104.5, 98, 104], // HAMMER — long lower wick, small body, close near high
  [104, 107, 103.5, 106.5], // confirmation rally
];
const HAMMER = toCandles(HAMMER_BARS, '2025-06-15');
const hamT = (i: number) => HAMMER[i].time;

const SHOOTING_STAR_BARS: Array<[number, number, number, number]> = [
  [100, 102, 99.5, 101.5],
  [101.5, 104, 101, 103.5], // rally
  [103.5, 106, 103, 105.5], // rally
  [105.5, 108, 105, 107.5], // rally into the top
  [107.5, 114, 107.5, 108], // SHOOTING STAR — long upper wick, small body, close near low
  [108, 108.5, 104, 104.5], // confirmation drop
];
const SHOOTING_STAR = toCandles(SHOOTING_STAR_BARS, '2025-07-01');
const sstarT = (i: number) => SHOOTING_STAR[i].time;

const MORNING_STAR_BARS: Array<[number, number, number, number]> = [
  [110, 112, 109.5, 111.5],
  [111.5, 111.5, 108, 108.5], // decline
  [108.5, 109, 105, 105.5], // decline
  [105.5, 106, 100, 100.5], // long bearish candle (1)
  [100.5, 101.5, 99, 100], // small body — the star (2)
  [100, 104.5, 100, 104.5], // long bullish candle closes above mid (3)
  [104.5, 107, 104, 106.5], // follow-through
];
const MORNING_STAR = toCandles(MORNING_STAR_BARS, '2025-07-15');
const mstarT = (i: number) => MORNING_STAR[i].time;

const EVENING_STAR_BARS: Array<[number, number, number, number]> = [
  [100, 102, 99.5, 101.5],
  [101.5, 104, 101, 103.5], // rally
  [103.5, 106, 103, 105.5], // rally
  [105.5, 110, 105.5, 110], // long bullish candle (1)
  [110, 111, 109, 109.5], // small body — the star (2)
  [109.5, 109.5, 104, 104.5], // long bearish candle closes below mid (3)
  [104.5, 105, 101, 101.5], // follow-through
];
const EVENING_STAR = toCandles(EVENING_STAR_BARS, '2025-08-01');
const estarT = (i: number) => EVENING_STAR[i].time;

const HARAMI_BARS: Array<[number, number, number, number]> = [
  [110, 112, 109.5, 111.5],
  [111.5, 111.5, 108, 108.5], // decline
  [108.5, 109, 105, 105.5], // decline
  [105.5, 106, 100, 100.5], // long bearish candle (mother)
  [100.5, 103.5, 100.5, 103], // small bullish candle inside the mother — harami
  [103, 106, 102.5, 105.5], // follow-through
];
const HARAMI = toCandles(HARAMI_BARS, '2025-08-15');
const harT = (i: number) => HARAMI[i].time;

const THREE_SOLDIERS_BARS: Array<[number, number, number, number]> = [
  [110, 112, 109.5, 111.5],
  [111.5, 111.5, 108, 108.5], // decline
  [108.5, 109, 105, 105.5], // decline
  [105.5, 106, 102, 102.5], // bottom
  [102.5, 104.5, 102.5, 104.5], // soldier 1
  [104.5, 106.5, 104, 106.5], // soldier 2
  [106.5, 109, 106, 109], // soldier 3
  [109, 110.5, 107.5, 108.5], // slight pullback
];
const THREE_SOLDIERS = toCandles(THREE_SOLDIERS_BARS, '2025-09-01');
const soldiersT = (i: number) => THREE_SOLDIERS[i].time;

const THREE_CROWS_BARS: Array<[number, number, number, number]> = [
  [100, 102, 99.5, 101.5],
  [101.5, 104, 101, 103.5], // rally
  [103.5, 106, 103, 105.5], // rally
  [105.5, 108, 105, 107.5], // top
  [107.5, 107.5, 105, 105], // crow 1
  [105, 105, 102.5, 102.5], // crow 2
  [102.5, 102.5, 100, 100], // crow 3
  [100, 101, 97.5, 98], // follow-through
];
const THREE_CROWS = toCandles(THREE_CROWS_BARS, '2025-09-15');
const crowsT = (i: number) => THREE_CROWS[i].time;

/* ── Harmonic datasets (X-A-B-C-D) ─────────────────────────────────────── */

const BUTTERFLY_BARS: Array<[number, number, number, number]> = [
  [103.4, 103.6, 101.8, 102.2], // lead-in
  [102.2, 102.6, 100.2, 100.8], // lead-in
  [100, 100.8, 99.4, 100.6], // X
  [100.6, 104, 100.4, 103.6], // X→A
  [103.6, 108, 103.2, 107.6], // A = 108
  [107.6, 107.8, 104.6, 105], // A→B
  [105, 105.2, 103, 103.5], // B = 103.5
  [103.5, 106.8, 103.3, 106.4], // B→C
  [106.4, 106.8, 104.8, 105.2], // C = 106.8
  [105.2, 105.4, 101.8, 102.2], // C→D
  [102.2, 102.4, 92, 92.4], // D = 92 (~1.27 of XA)
  [92.4, 97, 92.2, 96.6], // reversal up from D
  [96.6, 99.5, 96.2, 99], // follow-through
];
const BUTTERFLY = toCandles(BUTTERFLY_BARS, '2025-10-01');
const bflyT = (i: number) => BUTTERFLY[i + 2].time;

const CRAB_BARS: Array<[number, number, number, number]> = [
  [103.4, 103.6, 101.8, 102.2], // lead-in
  [102.2, 102.6, 100.2, 100.8], // lead-in
  [100, 100.8, 99.4, 100.6], // X
  [100.6, 104, 100.4, 103.6], // X→A
  [103.6, 108, 103.2, 107.6], // A = 108
  [107.6, 107.8, 104.6, 105], // A→B
  [105, 105.2, 103, 103.5], // B = 103.5
  [103.5, 106.8, 103.3, 106.4], // B→C
  [106.4, 106.8, 104.8, 105.2], // C = 106.8
  [105.2, 105.4, 101.8, 102.2], // C→D
  [102.2, 102.4, 88, 88.4], // D = 88 (~1.618 of XA)
  [88.4, 94, 88.2, 93.6], // reversal up from D
  [93.6, 97, 93.2, 96.5], // follow-through
];
const CRAB = toCandles(CRAB_BARS, '2025-10-15');
const crabT = (i: number) => CRAB[i + 2].time;

const CYPHER_BARS: Array<[number, number, number, number]> = [
  [103.4, 103.6, 101.8, 102.2], // lead-in
  [102.2, 102.6, 100.2, 100.8], // lead-in
  [100, 100.8, 99.4, 100.6], // X
  [100.6, 103, 100.4, 102.8], // X→A
  [102.8, 106, 102.4, 105.6], // A = 106
  [105.6, 105.8, 103.2, 103.6], // A→B
  [103.6, 103.8, 102.8, 103.2], // B = 103.2 (~0.618 of XA)
  [103.2, 107.2, 103, 106.8], // B→C
  [106.8, 109, 106.4, 108.6], // C = 109 (~1.13 of XA)
  [108.6, 108.8, 105.4, 105.8], // C→D
  [105.8, 106, 101.4, 101.8], // D = 101.5 (~0.786 of XC)
  [101.8, 105, 101.6, 104.6], // reversal up from D
  [104.6, 107.5, 104.2, 107], // follow-through
];
const CYPHER = toCandles(CYPHER_BARS, '2025-11-01');
const cypherT = (i: number) => CYPHER[i + 2].time;

const SHARK_BARS: Array<[number, number, number, number]> = [
  [103.4, 103.6, 101.8, 102.2], // lead-in
  [102.2, 102.6, 100.2, 100.8], // lead-in
  [100, 100.8, 99.4, 100.6], // X
  [100.6, 103.4, 100.4, 103], // X→A
  [103, 104, 102.6, 103.6], // A = 104
  [103.6, 106.8, 103.4, 106.4], // A→B
  [106.4, 107, 105.8, 106.2], // B = 107 (~1.618 of XA)
  [106.2, 106.4, 102.8, 103.2], // B→C
  [103.2, 103.4, 102, 102.4], // C = 102
  [102.4, 106.4, 102.2, 106], // C→D
  [106, 108.5, 105.6, 108.2], // D = 108.5 (~1.13 of XC)
  [108.2, 108.4, 104.6, 105], // reversal down from D
  [105, 105.2, 102.2, 102.6], // follow-through
];
const SHARK = toCandles(SHARK_BARS, '2025-11-15');
const sharkT = (i: number) => SHARK[i + 2].time;

const ABCD_BARS: Array<[number, number, number, number]> = [
  [103.4, 103.6, 101.8, 102.2], // lead-in
  [102.2, 102.6, 100.2, 100.8], // lead-in
  [100, 100.8, 99.4, 100.6], // X
  [100.6, 104.6, 100.4, 104.2], // X→A
  [104.2, 106, 103.8, 105.6], // A = 106
  [105.6, 105.8, 103.4, 103.8], // A→B
  [103.8, 104, 102, 102.4], // B = 102 (AB = 4)
  [102.4, 105, 102.2, 104.6], // B→C
  [104.6, 105.4, 104, 104.4], // C = 105.2
  [104.4, 104.6, 101, 101.4], // C→D
  [101.4, 101.6, 98, 98.4], // D = 98 (CD = 4 ≈ AB → 1:1)
  [98.4, 102, 98.2, 101.6], // reversal up from D
  [101.6, 104.5, 101.2, 104], // follow-through
];
const ABCD = toCandles(ABCD_BARS, '2025-12-01');
const abcdT = (i: number) => ABCD[i + 2].time;

/* ---------------------------------------------------------------------------
 * Scenarios — one per concept. Candles are shared; overlays are tailored.
 * ------------------------------------------------------------------------- */

export const SCENARIOS: Record<string, ConceptScenario> = {
  'pattern-double-top': {
    candles: DOUBLE_TOP,
    title: { en: 'Double Top (M Pattern)', th: 'Double Top (รูปแบบตัว M)' },
    summary: {
      en: 'A bearish reversal pattern characterized by two peaks at approximately the same price level. The pattern is confirmed when the price breaks below the neckline (support level).',
      th: 'รูปแบบการกลับตัวเป็นขาลง (Bearish Reversal) มีลักษณะคล้ายตัว M โดยมีจุดยอดสองจุดที่ระดับราคาใกล้เคียงกัน รูปแบบนี้จะสมบูรณ์เมื่อราคาทะลุแนวรับ (Neckline) ลงมา',
    },
    keyPoints: [
      { en: 'First peak establishes resistance.', th: 'ยอดที่ 1 สร้างระดับแนวต้าน' },
      { en: 'The pullback establishes the neckline (support).', th: 'การย่อตัวสร้างระดับ Neckline (แนวรับ)' },
      { en: 'Second peak fails to break higher.', th: 'ยอดที่ 2 ไม่สามารถทำราคาสูงกว่ายอดแรกได้' },
      { en: 'Entry is triggered on the neckline breakdown.', th: 'จุดเข้าเทรดเกิดขึ้นเมื่อราคาทะลุ Neckline ลงมา' },
    ],
    priceLines: [
      { price: 108, color: COLORS.bear, title: 'Neckline', dashed: true },
      { price: 122, color: COLORS.cyan, title: 'Resistance', dashed: true },
    ],
    trendLines: [
      { from: { time: dtT(3), price: 112 }, to: { time: dtT(6), price: 108 }, color: COLORS.muted, dashed: false },
      { from: { time: dtT(6), price: 108 }, to: { time: dtT(9), price: 123 }, color: COLORS.muted, dashed: false },
      { from: { time: dtT(9), price: 123 }, to: { time: dtT(12), price: 102 }, color: COLORS.bear, dashed: false },
    ],
    markers: [
      { time: dtT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Top 1', th: 'ยอดที่ 1' } },
      { time: dtT(6), position: 'belowBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: 'Neckline', th: 'เส้นคอ (Neckline)' } },
      { time: dtT(9), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Top 2', th: 'ยอดที่ 2' } },
      { time: dtT(12), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Breakdown', th: 'ทะลุ Neckline' } },
    ],
  },
  'pattern-head-shoulders': {
    candles: HEAD_SHOULDERS,
    title: { en: 'Head & Shoulders', th: 'Head & Shoulders (หัวและไหล่)' },
    summary: {
      en: 'A reliable bearish reversal pattern consisting of three peaks: a higher peak (Head) flanked by two lower peaks (Shoulders). It signals the exhaustion of an uptrend.',
      th: 'รูปแบบการกลับตัวที่แม่นยำสูง ประกอบด้วยยอด 3 จุด: ยอดตรงกลางที่สูงที่สุด (หัว) และยอดที่ต่ำกว่าขนาบข้างซ้ายขวา (ไหล่) เป็นสัญญาณบ่งบอกว่าเทรนด์ขาขึ้นเริ่มหมดแรง',
    },
    keyPoints: [
      { en: 'Left Shoulder forms after a strong advance.', th: 'ไหล่ซ้ายเกิดขึ้นหลังจากราคาขึ้นมาแรง' },
      { en: 'Head marks the highest point (exhaustion).', th: 'หัวเป็นจุดที่สูงที่สุด (แรงซื้อหมด)' },
      { en: 'Right Shoulder is a lower high.', th: 'ไหล่ขวาคือจุดยอดที่ต่ำลง (Lower High)' },
      { en: 'A break of the Neckline confirms the reversal.', th: 'การทะลุ Neckline ยืนยันการเปลี่ยนเทรนด์เป็นขาลง' },
    ],
    trendLines: [
      { from: { time: hsT(2), price: 108 }, to: { time: hsT(5), price: 109 }, color: COLORS.bear, dashed: true }, // Neckline slope
    ],
    markers: [
      { time: hsT(1), position: 'aboveBar', shape: 'arrowDown', color: COLORS.cyan, text: { en: 'Left Shoulder', th: 'ไหล่ซ้าย' } },
      { time: hsT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Head', th: 'หัว' } },
      { time: hsT(7), position: 'aboveBar', shape: 'arrowDown', color: COLORS.cyan, text: { en: 'Right Shoulder', th: 'ไหล่ขวา' } },
      { time: hsT(9), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Neckline Break', th: 'ทะลุ Neckline' } },
    ],
  },
  'pattern-ascending-triangle': {
    candles: ASC_TRI,
    title: { en: 'Ascending Triangle', th: 'Ascending Triangle (สามเหลี่ยมขึ้น)' },
    summary: {
      en: 'A bullish continuation pattern formed by a flat resistance line and a rising support line. The converging structure squeezes sellers before price breaks out higher.',
      th: 'รูปแบบการไปต่อฝั่งขาขึ้น เกิดจากเส้นแนวต้านแนวนอน (Flat Resistance) และเส้นแนวรับที่สูงขึ้นเรื่อย ๆ โครงสร้างที่ค่อย ๆ แคบลงบีบผู้ขายก่อนที่ราคาจะเบรกขึ้น',
    },
    keyPoints: [
      { en: 'The flat top represents equal resistance (EQH).', th: 'ด้านบนราบคือแนวต้านที่เท่ากัน (EQH)' },
      { en: 'Higher lows form an ascending support line.', th: 'จุดต่ำที่สูงขึ้นเรื่อย ๆ สร้างเส้นแนวรับที่สูงขึ้น' },
      { en: 'A close above the resistance confirms the breakout.', th: 'การปิดเหนือแนวต้านยืนยันการเบรกเอาต์' },
    ],
    trendLines: [
      { from: { time: ascT(2), price: 106 }, to: { time: ascT(7), price: 106 }, color: COLORS.amber, dashed: true },
      { from: { time: ascT(3), price: 103 }, to: { time: ascT(7), price: 105 }, color: COLORS.cyan, dashed: true },
    ],
    markers: [
      { time: ascT(2), position: 'aboveBar', shape: 'arrowDown', color: COLORS.amber, text: { en: 'Resistance', th: 'แนวต้าน' } },
      { time: ascT(3), position: 'belowBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: 'Higher low', th: 'จุดต่ำที่สูงขึ้น' } },
      { time: ascT(8), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Breakout → Entry', th: 'เบรกเอาต์ → จุดเข้า' } },
    ],
    trade: {
      direction: 'long',
      setup: { en: 'Ascending Triangle Breakout', th: 'เบรกเอาต์สามเหลี่ยมขึ้น' },
      logic: {
        en: 'Enter on a strong bullish close above the flat resistance. Stop below the last higher low. Target measured by the triangle height projected from the breakout.',
        th: 'เข้าเทรดเมื่อแท่งปิดเขียวแข็งแรงเหนือแนวต้านราบ วาง Stop ใต้จุดต่ำที่สูงขึ้นล่าสุด เป้าหมายคือความสูงของสามเหลี่ยมฉายจากจุดเบรกเอาต์',
      },
      steps: [
        { n: 1, title: { en: 'Identify the Triangle', th: 'หารูปสามเหลี่ยม' }, description: { en: 'Find a flat resistance with rising lows beneath it.', th: 'หาแนวต้านราบพร้อมจุดต่ำที่สูงขึ้นข้างใต้' } },
        { n: 2, title: { en: 'Wait for the Breakout', th: 'รอการเบรกเอาต์' }, description: { en: 'Price must close above the flat resistance line.', th: 'ราคาต้องปิดเหนือเส้นแนวต้านราบ' } },
        { n: 3, title: { en: 'Trade the Projection', th: 'เทรดตามเป้าหมาย' }, description: { en: 'Target the triangle height added to the breakout price.', th: 'ตั้งเป้าเท่ากับความสูงของสามเหลี่ยมบวกจุดเบรกเอาต์' } },
      ],
      riskReward: '2.5',
      entry: { price: 106.5, conditions: { en: 'Close above resistance', th: 'ราคาปิดเหนือแนวต้าน' } },
      sl: { price: 104, conditions: { en: 'Below last higher low', th: 'ใต้จุดต่ำที่สูงขึ้นล่าสุด' } },
      tp: { price: 113.5, conditions: { en: 'Height projection (106 + 7.5)', th: 'ความสูงของสามเหลี่ยม (106 + 7.5)' } },
    },
  },
  'pattern-descending-triangle': {
    candles: DESC_TRI,
    title: { en: 'Descending Triangle', th: 'Descending Triangle (สามเหลี่ยมลง)' },
    summary: {
      en: 'A bearish continuation pattern formed by a flat support line and a falling resistance line. Sellers progressively win before price breaks down.',
      th: 'รูปแบบการไปต่อฝั่งขาลง เกิดจากเส้นแนวรับแนวนอน (Flat Support) และเส้นแนวต้านที่ต่ำลงเรื่อย ๆ ผู้ขายค่อย ๆ ชนะก่อนที่ราคาจะเบรกลง',
    },
    keyPoints: [
      { en: 'The flat bottom represents equal support (EQL).', th: 'ด้านล่างราบคือแนวรับที่เท่ากัน (EQL)' },
      { en: 'Lower highs form a falling resistance line.', th: 'จุดสูงที่ต่ำลงเรื่อย ๆ สร้างเส้นแนวต้านที่ต่ำลง' },
      { en: 'A close below the support confirms the breakdown.', th: 'การปิดใต้แนวรับยืนยันการเบรกลง' },
    ],
    trendLines: [
      { from: { time: descT(0), price: 112 }, to: { time: descT(6), price: 110.5 }, color: COLORS.bear, dashed: true },
      { from: { time: descT(1), price: 109 }, to: { time: descT(7), price: 109 }, color: COLORS.amber, dashed: true },
    ],
    markers: [
      { time: descT(1), position: 'belowBar', shape: 'arrowUp', color: COLORS.amber, text: { en: 'Support', th: 'แนวรับ' } },
      { time: descT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Lower high', th: 'จุดสูงที่ต่ำลง' } },
      { time: descT(8), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Breakdown → Entry', th: 'เบรกลง → จุดเข้า' } },
    ],
    trade: {
      direction: 'short',
      setup: { en: 'Descending Triangle Breakdown', th: 'เบรกลงสามเหลี่ยมลง' },
      logic: {
        en: 'Enter on a strong bearish close below the flat support. Stop above the last lower high. Target measured by the triangle height projected from the breakdown.',
        th: 'เข้าเทรดเมื่อแท่งปิดแดงแข็งแรงใต้แนวรับราบ วาง Stop เหนือจุดสูงที่ต่ำลงล่าสุด เป้าหมายคือความสูงของสามเหลี่ยมฉายจากจุดเบรกลง',
      },
      steps: [
        { n: 1, title: { en: 'Identify the Triangle', th: 'หารูปสามเหลี่ยม' }, description: { en: 'Find a flat support with falling highs above it.', th: 'หาแนวรับราบพร้อมจุดสูงที่ต่ำลงข้างบน' } },
        { n: 2, title: { en: 'Wait for the Breakdown', th: 'รอการเบรกลง' }, description: { en: 'Price must close below the flat support line.', th: 'ราคาต้องปิดใต้เส้นแนวรับราบ' } },
        { n: 3, title: { en: 'Trade the Projection', th: 'เทรดตามเป้าหมาย' }, description: { en: 'Target the triangle height subtracted from the breakdown price.', th: 'ตั้งเป้าเท่ากับความสูงของสามเหลี่ยมลบจุดเบรกลง' } },
      ],
      riskReward: '2.5',
      entry: { price: 108.5, conditions: { en: 'Close below support', th: 'ราคาปิดใต้แนวรับ' } },
      sl: { price: 111, conditions: { en: 'Above last lower high', th: 'เหนือจุดสูงที่ต่ำลงล่าสุด' } },
      tp: { price: 101, conditions: { en: 'Height projection (109 − 8)', th: 'ความสูงของสามเหลี่ยม (109 − 8)' } },
    },
  },
  'pattern-cup-handle': {
    candles: CUP,
    title: { en: 'Cup & Handle', th: 'Cup & Handle (ถ้วยพร้อมหู)' },
    summary: {
      en: 'A bullish continuation pattern shaped like a tea cup: a rounded bowl (the cup) followed by a small pullback (the handle) before the breakout to new highs.',
      th: 'รูปแบบการไปต่อฝั่งขาขึ้นที่มีรูปร่างคล้ายถ้วยชา: ก้นถ้วยกลม (ตัวถ้วย) ตามด้วยการย่อเล็ก ๆ (หูถ้วย) ก่อนเบรกเอาต์ขึ้นทำจุดสูงสุดใหม่',
    },
    keyPoints: [
      { en: 'The cup should be rounded, like a "U", not a "V".', th: 'ก้นถ้วยต้องโค้งกลมแบบตัว U ไม่ใช่ตัว V' },
      { en: 'The handle is a shallow pullback on the right side.', th: 'หูถ้วยคือการย่อตื้น ๆ ทางด้านขวาของถ้วย' },
      { en: 'A close above the rim (the handle high) triggers the entry.', th: 'การปิดเหนือขอบถ้วย (จุดสูงของหูถ้วย) เป็นจุดเข้าเทรด' },
    ],
    trendLines: [
      { from: { time: cupT(3), price: 108 }, to: { time: cupT(11), price: 108 }, color: COLORS.amber, dashed: true },
    ],
    markers: [
      { time: cupT(3), position: 'aboveBar', shape: 'arrowDown', color: COLORS.amber, text: { en: 'Left rim', th: 'ขอบถ้วยซ้าย' } },
      { time: cupT(7), position: 'belowBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: 'Cup bottom', th: 'ก้นถ้วย' } },
      { time: cupT(13), position: 'aboveBar', shape: 'arrowDown', color: COLORS.muted, text: { en: 'Handle low', th: 'จุดต่ำหูถ้วย' } },
      { time: cupT(14), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Breakout → Entry', th: 'เบรกเอาต์ → จุดเข้า' } },
    ],
    trade: {
      direction: 'long',
      setup: { en: 'Cup & Handle Breakout', th: 'เบรกเอาต์ Cup & Handle' },
      logic: {
        en: 'Enter on a strong bullish close above the cup rim. Stop below the handle low. Target is the cup depth projected above the rim.',
        th: 'เข้าเทรดเมื่อแท่งปิดเขียวแข็งแรงเหนือขอบถ้วย วาง Stop ใต้จุดต่ำของหูถ้วย เป้าหมายคือความลึกของถ้วยฉายขึ้นจากขอบถ้วย',
      },
      steps: [
        { n: 1, title: { en: 'Spot the Cup', th: 'หาถ้วย' }, description: { en: 'Look for a rounded U-shaped pullback after a rally.', th: 'หาการย่อโค้งรูปตัว U หลังช่วงขาขึ้น' } },
        { n: 2, title: { en: 'Wait for the Handle', th: 'รอหูถ้วย' }, description: { en: 'A shallow dip forms on the right side of the rim.', th: 'การย่อตื้น ๆ เกิดทางด้านขวาของขอบถ้วย' } },
        { n: 3, title: { en: 'Trade the Breakout', th: 'เทรดตอนเบรกเอาต์' }, description: { en: 'Buy on the close above the rim; stop below the handle.', th: 'ซื้อเมื่อปิดเหนือขอบถ้วย วาง Stop ใต้หูถ้วย' } },
      ],
      riskReward: '2.6',
      entry: { price: 109, conditions: { en: 'Close above rim (108)', th: 'ราคาปิดเหนือขอบถ้วย (108)' } },
      sl: { price: 103.5, conditions: { en: 'Below handle low', th: 'ใต้จุดต่ำของหูถ้วย' } },
      tp: { price: 118, conditions: { en: 'Cup depth projection (108 + 10)', th: 'ความลึกของถ้วยฉาย (108 + 10)' } },
    },
  },
  'pattern-falling-wedge': {
    candles: WEDGE,
    title: { en: 'Falling Wedge', th: 'Falling Wedge (ลิ่มตก)' },
    summary: {
      en: 'A bullish reversal pattern: price carves lower highs and lower lows inside two converging trendlines, then breaks out upward once selling pressure fades.',
      th: 'รูปแบบกลับตัวฝั่งขาขึ้น: ราคาทำจุดสูงและจุดต่ำที่ลดลงเรื่อย ๆ ภายในเส้นแนวโน้มสองเส้นที่ค่อย ๆ บรรจบกัน แล้วเบรกขึ้นเมื่อแรงขายหมดลง',
    },
    keyPoints: [
      { en: 'Both trendlines slope down, but the lower one falls faster.', th: 'เส้นแนวโน้มทั้งสองเอียงลง แต่เส้นล่างลาดชันกว่า' },
      { en: 'The tightening range signals fading selling pressure.', th: 'กรอบที่แคบลงบ่งบอกว่าแรงขายกำลังหมด' },
      { en: 'A close above the upper trendline confirms the breakout.', th: 'การปิดเหนือเส้นแนวโน้มบนยืนยันการเบรกเอาต์' },
    ],
    trendLines: [
      { from: { time: wedgeT(0), price: 111 }, to: { time: wedgeT(8), price: 105 }, color: COLORS.bear, dashed: true },
      { from: { time: wedgeT(1), price: 107 }, to: { time: wedgeT(7), price: 102.5 }, color: COLORS.cyan, dashed: true },
    ],
    markers: [
      { time: wedgeT(5), position: 'belowBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: 'Lower low', th: 'จุดต่ำที่ต่ำลง' } },
      { time: wedgeT(8), position: 'aboveBar', shape: 'arrowDown', color: COLORS.muted, text: { en: 'Converging lines', th: 'เส้นบรรจบกัน' } },
      { time: wedgeT(9), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Breakout → Entry', th: 'เบรกเอาต์ → จุดเข้า' } },
    ],
    trade: {
      direction: 'long',
      setup: { en: 'Falling Wedge Breakout', th: 'เบรกเอาต์ลิ่มตก' },
      logic: {
        en: 'Enter on a strong bullish close above the upper trendline. Stop below the last low. Target is the wedge height projected from the breakout.',
        th: 'เข้าเทรดเมื่อแท่งปิดเขียวแข็งแรงเหนือเส้นแนวโน้มบน วาง Stop ใต้จุดต่ำสุดล่าสุด เป้าหมายคือความสูงของลิ่มฉายจากจุดเบรกเอาต์',
      },
      steps: [
        { n: 1, title: { en: 'Draw the Wedge', th: 'วาดลิ่ม' }, description: { en: 'Connect the descending highs and lows — they must converge.', th: 'ลากเส้นเชื่อมจุดสูงและจุดต่ำที่ลดลง — ต้องบรรจบกัน' } },
        { n: 2, title: { en: 'Wait for the Breakout', th: 'รอการเบรกเอาต์' }, description: { en: 'Price must close above the upper trendline.', th: 'ราคาต้องปิดเหนือเส้นแนวโน้มบน' } },
        { n: 3, title: { en: 'Trade the Reversal', th: 'เทรดการกลับตัว' }, description: { en: 'Buy the breakout with a stop below the wedge low.', th: 'ซื้อตอนเบรกเอาต์ วาง Stop ใต้จุดต่ำของลิ่ม' } },
      ],
      riskReward: '2.4',
      entry: { price: 106, conditions: { en: 'Close above upper line', th: 'ราคาปิดเหนือเส้นแนวโน้มบน' } },
      sl: { price: 101.5, conditions: { en: 'Below last low', th: 'ใต้จุดต่ำสุดล่าสุด' } },
      tp: { price: 114, conditions: { en: 'Wedge height projection (106 + 8)', th: 'ความสูงของลิ่มฉาย (106 + 8)' } },
    },
  },
  'pattern-bear-flag': {
    candles: BEAR_FLAG,
    title: { en: 'Bear Flag', th: 'Bear Flag (ธงหมี)' },
    summary: {
      en: 'A bearish continuation pattern: a sharp drop (the pole) followed by a small upward-sloping consolidation (the flag), then a breakdown to continue lower.',
      th: 'รูปแบบการไปต่อฝั่งขาลง: การร่วงแรง (เสาธง) ตามด้วยการพักตัวเฉียงขึ้นเล็กน้อย (ตัวธง) แล้วเบรกลงเพื่อไปต่อในทิศทางเดิม',
    },
    keyPoints: [
      { en: 'The pole is a strong, impulsive move downward.', th: 'เสาธงคือช่วงที่ราคาร่วงแรงและเร็ว' },
      { en: 'The flag pulls back against the downtrend.', th: 'ตัวธงย่อสวนทางกับเทรนด์ขาลง' },
      { en: 'A close below the flag support triggers the entry.', th: 'การปิดใต้แนวรับของธงเป็นจุดเข้าเทรด' },
    ],
    trendLines: [
      { from: { time: bfT(3), price: 102 }, to: { time: bfT(7), price: 104 }, color: COLORS.accent, dashed: true },
      { from: { time: bfT(4), price: 105 }, to: { time: bfT(8), price: 104.5 }, color: COLORS.accent, dashed: true },
      { from: { time: bfT(0), price: 112 }, to: { time: bfT(3), price: 102 }, color: COLORS.bear, dashed: false },
    ],
    markers: [
      { time: bfT(0), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: '① Flag Pole', th: '① เสาธง' } },
      { time: bfT(5), position: 'aboveBar', shape: 'arrowUp', color: COLORS.accent, text: { en: '② Consolidation (Flag)', th: '② การพักตัว (ตัวธง)' } },
      { time: bfT(9), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: { en: '③ Breakdown → Entry', th: '③ เบรกลง → จุดเข้า' } },
    ],
    trade: {
      direction: 'short',
      setup: { en: 'Bear Flag Breakdown', th: 'เบรกลง Bear Flag' },
      logic: {
        en: 'Enter on the close of a strong bearish candle breaking the flag support. Stop is above the flag high. Target is the length of the pole.',
        th: 'เข้าเทรดเมื่อแท่งเทียนปิดทะลุแนวรับของธงด้วยแรงขายที่แข็งแกร่ง ตั้ง Stop ไว้เหนือจุดสูงสุดของธง เป้าหมายคือความยาวของเสาธง',
      },
      steps: [
        { n: 1, title: { en: 'Identify the Pole', th: 'หาเสาธง' }, description: { en: 'Find a strong impulsive move downward.', th: 'หาการร่วงลงอย่างรุนแรง' } },
        { n: 2, title: { en: 'Draw the Flag', th: 'วาดกรอบธง' }, description: { en: 'Connect the rising lows of the pullback.', th: 'ตีเส้นเชื่อมจุดต่ำที่สูงขึ้นของการย่อตัว' } },
        { n: 3, title: { en: 'Trade the Breakdown', th: 'เทรดตอนเบรกลง' }, description: { en: 'Wait for price to close below the flag support.', th: 'รอราคาปิดทะลุเส้นแนวรับของธง' } },
      ],
      riskReward: '2.2',
      entry: { price: 101.5, conditions: { en: 'Close below flag support', th: 'ราคาปิดทะลุแนวรับธง' } },
      sl: { price: 107, conditions: { en: 'Above flag structure', th: 'เหนือโครงสร้างของธง' } },
      tp: { price: 90.5, conditions: { en: 'Pole projection (101.5 − 11)', th: 'ระยะความยาวของเสาธง (101.5 − 11)' } },
    },
  },
  'pattern-double-bottom': {
    candles: DBL_BOTTOM,
    title: { en: 'Double Bottom', th: 'Double Bottom (ก้นคู่)' },
    summary: {
      en: 'A bullish reversal pattern shaped like a "W": two troughs at roughly the same price level, with the second one failing to break lower before price breaks above the neckline.',
      th: 'รูปแบบกลับตัวฝั่งขาขึ้นที่มีรูปร่างคล้ายตัว W: ก้นสองจุดที่ระดับราคาใกล้เคียงกัน โดยก้นที่สองไม่สามารถทำราคาต่ำลงได้ ก่อนที่ราคาจะเบรกขึ้นเหนือ Neckline',
    },
    keyPoints: [
      { en: 'The two bottoms form at the same support level.', th: 'ก้นทั้งสองอยู่ที่ระดับแนวรับเดียวกัน' },
      { en: 'The rally between them creates the neckline (resistance).', th: 'การดีดระหว่างก้นทั้งสองสร้าง Neckline (แนวต้าน)' },
      { en: 'A close above the neckline confirms the reversal.', th: 'การปิดเหนือ Neckline ยืนยันการกลับตัวเป็นขาขึ้น' },
    ],
    priceLines: [{ price: 106.5, color: COLORS.amber, title: 'Neckline', dashed: true }],
    trendLines: [
      { from: { time: dbT(3), price: 102 }, to: { time: dbT(7), price: 102 }, color: COLORS.cyan, dashed: true },
    ],
    markers: [
      { time: dbT(3), position: 'belowBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: 'Bottom 1', th: 'ก้นที่ 1' } },
      { time: dbT(5), position: 'aboveBar', shape: 'arrowDown', color: COLORS.amber, text: { en: 'Neckline', th: 'เส้นคอ (Neckline)' } },
      { time: dbT(7), position: 'belowBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: 'Bottom 2', th: 'ก้นที่ 2' } },
      { time: dbT(9), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Breakout → Entry', th: 'เบรกขึ้น → จุดเข้า' } },
    ],
    trade: {
      direction: 'long',
      setup: { en: 'Double Bottom Breakout', th: 'เบรกขึ้นก้นคู่' },
      logic: {
        en: 'Enter on a strong bullish close above the neckline. Stop below the twin bottoms. Target is the distance from the bottoms to the neckline projected above it.',
        th: 'เข้าเทรดเมื่อแท่งปิดเขียวแข็งแรงเหนือ Neckline วาง Stop ใต้ก้นคู่ เป้าหมายคือระยะจากก้นถึง Neckline ฉายขึ้นด้านบน',
      },
      steps: [
        { n: 1, title: { en: 'Find the W', th: 'หาตัว W' }, description: { en: 'Look for two equal lows after a decline.', th: 'หาจุดต่ำที่เท่ากันสองจุดหลังช่วงขาลง' } },
        { n: 2, title: { en: 'Draw the Neckline', th: 'ลากเส้น Neckline' }, description: { en: 'Connect the high between the two bottoms.', th: 'ลากเส้นเชื่อมจุดสูงระหว่างก้นทั้งสอง' } },
        { n: 3, title: { en: 'Trade the Breakout', th: 'เทรดตอนเบรกขึ้น' }, description: { en: 'Buy on the close above the neckline; stop below the lows.', th: 'ซื้อเมื่อปิดเหนือ Neckline วาง Stop ใต้ก้น' } },
      ],
      riskReward: '2.0',
      entry: { price: 107.5, conditions: { en: 'Close above neckline (106.5)', th: 'ราคาปิดเหนือ Neckline (106.5)' } },
      sl: { price: 101.5, conditions: { en: 'Below twin bottoms', th: 'ใต้ก้นคู่' } },
      tp: { price: 115.5, conditions: { en: 'Height projection (106.5 + 9)', th: 'ความสูงฉายขึ้น (106.5 + 9)' } },
    },
  },
  'pattern-rising-wedge': {
    candles: RISING_WEDGE,
    title: { en: 'Rising Wedge', th: 'Rising Wedge (ลิ่มขึ้น)' },
    summary: {
      en: 'A bearish reversal pattern: price carves higher highs and higher lows inside two converging trendlines, then breaks down once buying pressure fades.',
      th: 'รูปแบบกลับตัวฝั่งขาลง: ราคาทำจุดสูงและจุดต่ำที่สูงขึ้นเรื่อย ๆ ภายในเส้นแนวโน้มสองเส้นที่ค่อย ๆ บรรจบกัน แล้วเบรกลงเมื่อแรงซื้อหมดลง',
    },
    keyPoints: [
      { en: 'Both trendlines slope up, but the upper one is steeper.', th: 'เส้นแนวโน้มทั้งสองเอียงขึ้น แต่เส้นบนชันกว่า' },
      { en: 'The tightening range signals fading buying pressure.', th: 'กรอบที่แคบลงบ่งบอกว่าแรงซื้อกำลังหมด' },
      { en: 'A close below the lower trendline confirms the breakdown.', th: 'การปิดใต้เส้นแนวโน้มล่างยืนยันการเบรกลง' },
    ],
    trendLines: [
      { from: { time: rwT(1), price: 103.5 }, to: { time: rwT(7), price: 107.5 }, color: COLORS.bear, dashed: true },
      { from: { time: rwT(2), price: 101.5 }, to: { time: rwT(6), price: 105 }, color: COLORS.amber, dashed: true },
    ],
    markers: [
      { time: rwT(3), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Higher high', th: 'จุดสูงที่สูงขึ้น' } },
      { time: rwT(6), position: 'belowBar', shape: 'arrowUp', color: COLORS.amber, text: { en: 'Converging lines', th: 'เส้นบรรจบกัน' } },
      { time: rwT(8), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Breakdown → Entry', th: 'เบรกลง → จุดเข้า' } },
    ],
    trade: {
      direction: 'short',
      setup: { en: 'Rising Wedge Breakdown', th: 'เบรกลงลิ่มขึ้น' },
      logic: {
        en: 'Enter on a strong bearish close below the lower trendline. Stop above the last high. Target is the wedge height projected from the breakdown.',
        th: 'เข้าเทรดเมื่อแท่งปิดแดงแข็งแรงใต้เส้นแนวโน้มล่าง วาง Stop เหนือจุดสูงสุดล่าสุด เป้าหมายคือความสูงของลิ่มฉายจากจุดเบรกลง',
      },
      steps: [
        { n: 1, title: { en: 'Draw the Wedge', th: 'วาดลิ่ม' }, description: { en: 'Connect the rising highs and lows — they must converge.', th: 'ลากเส้นเชื่อมจุดสูงและจุดต่ำที่สูงขึ้น — ต้องบรรจบกัน' } },
        { n: 2, title: { en: 'Wait for the Breakdown', th: 'รอการเบรกลง' }, description: { en: 'Price must close below the lower trendline.', th: 'ราคาต้องปิดใต้เส้นแนวโน้มล่าง' } },
        { n: 3, title: { en: 'Trade the Reversal', th: 'เทรดการกลับตัว' }, description: { en: 'Short the breakdown with a stop above the wedge high.', th: 'ชอร์ตตอนเบรกลง วาง Stop เหนือจุดสูงของลิ่ม' } },
      ],
      riskReward: '2.4',
      entry: { price: 104, conditions: { en: 'Close below lower line', th: 'ราคาปิดใต้เส้นแนวโน้มล่าง' } },
      sl: { price: 108, conditions: { en: 'Above last high', th: 'เหนือจุดสูงสุดล่าสุด' } },
      tp: { price: 96, conditions: { en: 'Wedge height projection (104 − 8)', th: 'ความสูงของลิ่มฉาย (104 − 8)' } },
    },
  },
  'pattern-pennant': {
    candles: PENNANT,
    title: { en: 'Bullish Pennant', th: 'Pennant ขาขึ้น' },
    summary: {
      en: 'A bullish continuation pattern: a sharp rally (the pole) followed by a small symmetric triangle (the pennant), then a breakout to continue the uptrend.',
      th: 'รูปแบบการไปต่อฝั่งขาขึ้น: การพุ่งแรง (เสาธง) ตามด้วยสามเหลี่ยมเล็ก ๆ สมมาตร (ตัวธง) แล้วเบรกขึ้นเพื่อไปต่อในเทรนด์เดิม',
    },
    keyPoints: [
      { en: 'The pole is a strong, impulsive move upward.', th: 'เสาธงคือช่วงที่ราคาพุ่งแรงและเร็ว' },
      { en: 'The pennant is a tight, symmetric consolidation.', th: 'ตัวธงคือการพักตัวที่แน่นและสมมาตร' },
      { en: 'A close above the pennant triggers the entry.', th: 'การปิดเหนือตัวธงเป็นจุดเข้าเทรด' },
    ],
    trendLines: [
      { from: { time: pnT(3), price: 109.5 }, to: { time: pnT(5), price: 108.5 }, color: COLORS.accent, dashed: true },
      { from: { time: pnT(4), price: 106 }, to: { time: pnT(6), price: 107 }, color: COLORS.accent, dashed: true },
      { from: { time: pnT(0), price: 100 }, to: { time: pnT(2), price: 110 }, color: COLORS.bull, dashed: false },
    ],
    markers: [
      { time: pnT(2), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: { en: '① Flag Pole', th: '① เสาธง' } },
      { time: pnT(4), position: 'belowBar', shape: 'arrowDown', color: COLORS.accent, text: { en: '② Pennant', th: '② ตัวธง' } },
      { time: pnT(7), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: '③ Breakout → Entry', th: '③ เบรกขึ้น → จุดเข้า' } },
    ],
    trade: {
      direction: 'long',
      setup: { en: 'Pennant Breakout', th: 'เบรกขึ้น Pennant' },
      logic: {
        en: 'Enter on the close of a strong bullish candle breaking the pennant. Stop is below the pennant low. Target is the length of the pole projected from the breakout.',
        th: 'เข้าเทรดเมื่อแท่งเทียนปิดทะลุตัวธงด้วยแรงซื้อที่แข็งแกร่ง ตั้ง Stop ไว้ใต้จุดต่ำสุดของตัวธง เป้าหมายคือความยาวของเสาธงฉายจากจุดเบรกขึ้น',
      },
      steps: [
        { n: 1, title: { en: 'Identify the Pole', th: 'หาเสาธง' }, description: { en: 'Find a strong impulsive move upward.', th: 'หาการพุ่งขึ้นอย่างรุนแรง' } },
        { n: 2, title: { en: 'Spot the Pennant', th: 'หาตัวธง' }, description: { en: 'Price coils into a small symmetric triangle.', th: 'ราคาสะสมตัวเป็นสามเหลี่ยมสมมาตรเล็ก ๆ' } },
        { n: 3, title: { en: 'Trade the Breakout', th: 'เทรดตอนเบรกขึ้น' }, description: { en: 'Wait for price to close above the pennant.', th: 'รอราคาปิดทะลุตัวธง' } },
      ],
      riskReward: '2.6',
      entry: { price: 110, conditions: { en: 'Close above pennant', th: 'ราคาปิดทะลุตัวธง' } },
      sl: { price: 105.5, conditions: { en: 'Below pennant structure', th: 'ใต้โครงสร้างตัวธง' } },
      tp: { price: 120, conditions: { en: 'Pole projection (110 + 10)', th: 'ระยะความยาวของเสาธง (110 + 10)' } },
    },
  },
  'pattern-inverse-hs': {
    candles: INV_HS,
    title: { en: 'Inverse Head & Shoulders', th: 'Inverse Head & Shoulders (หัวและไหล่กลับด้าน)' },
    summary: {
      en: 'A bullish reversal pattern: a lower trough (Head) between two shallower troughs (Shoulders). The breakout above the neckline signals the start of an uptrend.',
      th: 'รูปแบบกลับตัวฝั่งขาขึ้น: ก้นที่ลึกกว่า (หัว) คั่นกลางระหว่างก้นที่ตื้นกว่าสองข้าง (ไหล่) การเบรกขึ้นเหนือ Neckline ส่งสัญญาณเริ่มต้นเทรนด์ขาขึ้น',
    },
    keyPoints: [
      { en: 'The Head is the deepest low; Shoulders sit higher on both sides.', th: 'หัวเป็นจุดต่ำสุดที่ลึกที่สุด ไหล่ทั้งสองข้างอยู่สูงกว่า' },
      { en: 'The neckline connects the two recovery highs.', th: 'Neckline เชื่อมจุดสูงของการดีดทั้งสองครั้ง' },
      { en: 'A close above the neckline confirms the reversal.', th: 'การปิดเหนือ Neckline ยืนยันการกลับตัวเป็นขาขึ้น' },
    ],
    priceLines: [{ price: 108, color: COLORS.amber, title: 'Neckline', dashed: true }],
    markers: [
      { time: ihsT(2), position: 'belowBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: 'Left Shoulder', th: 'ไหล่ซ้าย' } },
      { time: ihsT(5), position: 'belowBar', shape: 'arrowUp', color: COLORS.bear, text: { en: 'Head', th: 'หัว' } },
      { time: ihsT(8), position: 'belowBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: 'Right Shoulder', th: 'ไหล่ขวา' } },
      { time: ihsT(9), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Breakout → Entry', th: 'เบรกขึ้น → จุดเข้า' } },
    ],
    trade: {
      direction: 'long',
      setup: { en: 'Inverse H&S Breakout', th: 'เบรกขึ้นหัวและไหล่กลับด้าน' },
      logic: {
        en: 'Enter on a strong bullish close above the neckline. Stop below the Head. Target is the Head-to-neckline distance projected above the neckline.',
        th: 'เข้าเทรดเมื่อแท่งปิดเขียวแข็งแรงเหนือ Neckline วาง Stop ใต้หัว เป้าหมายคือระยะจากหัวถึง Neckline ฉายขึ้นจาก Neckline',
      },
      steps: [
        { n: 1, title: { en: 'Spot the Three Troughs', th: 'หาก้นสามจุด' }, description: { en: 'A deeper middle low between two shallower lows.', th: 'ก้นกลางลึกกว่าก้นสองข้าง' } },
        { n: 2, title: { en: 'Draw the Neckline', th: 'ลากเส้น Neckline' }, description: { en: 'Connect the highs between the troughs.', th: 'ลากเส้นเชื่อมจุดสูงระหว่างก้น' } },
        { n: 3, title: { en: 'Trade the Breakout', th: 'เทรดตอนเบรกขึ้น' }, description: { en: 'Buy on the close above the neckline.', th: 'ซื้อเมื่อปิดเหนือ Neckline' } },
      ],
      riskReward: '2.0',
      entry: { price: 108.5, conditions: { en: 'Close above neckline (108)', th: 'ราคาปิดเหนือ Neckline (108)' } },
      sl: { price: 100.5, conditions: { en: 'Below the Head', th: 'ใต้หัว' } },
      tp: { price: 115.5, conditions: { en: 'Height projection (108 + 7.5)', th: 'ความสูงฉายขึ้น (108 + 7.5)' } },
    },
  },
  'pattern-triple-top': {
    candles: TRIPLE_TOP,
    title: { en: 'Triple Top', th: 'Triple Top (ยอดสามยอด)' },
    summary: {
      en: 'A bearish reversal pattern with three peaks at roughly the same level. The pattern is confirmed when price breaks below the neckline (support).',
      th: 'รูปแบบกลับตัวฝั่งขาลง ประกอบด้วยยอดสามยอดในระดับใกล้เคียงกัน รูปแบบสมบูรณ์เมื่อราคาเบรกใต้แนวรับ (Neckline)',
    },
    keyPoints: [
      { en: 'Three peaks form at the same resistance level.', th: 'ยอดทั้งสามอยู่ที่ระดับแนวต้านเดียวกัน' },
      { en: 'The pullbacks between them create the neckline.', th: 'การย่อระหว่างยอดสร้างเส้น Neckline' },
      { en: 'A close below the neckline confirms the breakdown.', th: 'การปิดใต้ Neckline ยืนยันการเบรกลง' },
    ],
    priceLines: [{ price: 102, color: COLORS.amber, title: 'Neckline', dashed: true }],
    trendLines: [
      { from: { time: ttT(1), price: 105 }, to: { time: ttT(7), price: 105 }, color: COLORS.bear, dashed: true },
    ],
    markers: [
      { time: ttT(1), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Top 1', th: 'ยอดที่ 1' } },
      { time: ttT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Top 2', th: 'ยอดที่ 2' } },
      { time: ttT(7), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Top 3', th: 'ยอดที่ 3' } },
      { time: ttT(9), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Breakdown → Entry', th: 'เบรกลง → จุดเข้า' } },
    ],
    trade: {
      direction: 'short',
      setup: { en: 'Triple Top Breakdown', th: 'เบรกลงยอดสามยอด' },
      logic: {
        en: 'Enter on a strong bearish close below the neckline. Stop above the tops. Target is the pattern height projected below the neckline.',
        th: 'เข้าเทรดเมื่อแท่งปิดแดงแข็งแรงใต้ Neckline วาง Stop เหนือยอด เป้าหมายคือความสูงของรูปแบบฉายลงจาก Neckline',
      },
      steps: [
        { n: 1, title: { en: 'Count the Tops', th: 'นับยอด' }, description: { en: 'Find three peaks at the same level.', th: 'หายอดสามยอดในระดับเดียวกัน' } },
        { n: 2, title: { en: 'Draw the Neckline', th: 'ลากเส้น Neckline' }, description: { en: 'Connect the lows between the peaks.', th: 'ลากเส้นเชื่อมจุดต่ำระหว่างยอด' } },
        { n: 3, title: { en: 'Trade the Breakdown', th: 'เทรดตอนเบรกลง' }, description: { en: 'Short on the close below the neckline.', th: 'ชอร์ตเมื่อปิดใต้ Neckline' } },
      ],
      riskReward: '1.6',
      entry: { price: 101.5, conditions: { en: 'Close below neckline (102)', th: 'ราคาปิดใต้ Neckline (102)' } },
      sl: { price: 105.5, conditions: { en: 'Above the tops', th: 'เหนือยอด' } },
      tp: { price: 96.5, conditions: { en: 'Height projection (102 − 5.5)', th: 'ความสูงฉายลง (102 − 5.5)' } },
    },
  },
  'pattern-triple-bottom': {
    candles: TRIPLE_BOTTOM,
    title: { en: 'Triple Bottom', th: 'Triple Bottom (ก้นสามก้น)' },
    summary: {
      en: 'A bullish reversal pattern with three troughs at roughly the same level. The pattern is confirmed when price breaks above the neckline (resistance).',
      th: 'รูปแบบกลับตัวฝั่งขาขึ้น ประกอบด้วยก้นสามก้นในระดับใกล้เคียงกัน รูปแบบสมบูรณ์เมื่อราคาเบรกเหนือแนวต้าน (Neckline)',
    },
    keyPoints: [
      { en: 'Three troughs form at the same support level.', th: 'ก้นทั้งสามอยู่ที่ระดับแนวรับเดียวกัน' },
      { en: 'The rallies between them create the neckline.', th: 'การดีดระหว่างก้นสร้างเส้น Neckline' },
      { en: 'A close above the neckline confirms the breakout.', th: 'การปิดเหนือ Neckline ยืนยันการเบรกขึ้น' },
    ],
    priceLines: [{ price: 100.5, color: COLORS.amber, title: 'Neckline', dashed: true }],
    trendLines: [
      { from: { time: tbT(1), price: 98 }, to: { time: tbT(7), price: 98 }, color: COLORS.cyan, dashed: true },
    ],
    markers: [
      { time: tbT(1), position: 'belowBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: 'Bottom 1', th: 'ก้นที่ 1' } },
      { time: tbT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: 'Bottom 2', th: 'ก้นที่ 2' } },
      { time: tbT(7), position: 'belowBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: 'Bottom 3', th: 'ก้นที่ 3' } },
      { time: tbT(8), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Breakout → Entry', th: 'เบรกขึ้น → จุดเข้า' } },
    ],
    trade: {
      direction: 'long',
      setup: { en: 'Triple Bottom Breakout', th: 'เบรกขึ้นก้นสามก้น' },
      logic: {
        en: 'Enter on a strong bullish close above the neckline. Stop below the bottoms. Target is the pattern height projected above the neckline.',
        th: 'เข้าเทรดเมื่อแท่งปิดเขียวแข็งแรงเหนือ Neckline วาง Stop ใต้ก้น เป้าหมายคือความสูงของรูปแบบฉายขึ้นจาก Neckline',
      },
      steps: [
        { n: 1, title: { en: 'Count the Bottoms', th: 'นับก้น' }, description: { en: 'Find three troughs at the same level.', th: 'หาก้นสามก้นในระดับเดียวกัน' } },
        { n: 2, title: { en: 'Draw the Neckline', th: 'ลากเส้น Neckline' }, description: { en: 'Connect the highs between the troughs.', th: 'ลากเส้นเชื่อมจุดสูงระหว่างก้น' } },
        { n: 3, title: { en: 'Trade the Breakout', th: 'เทรดตอนเบรกขึ้น' }, description: { en: 'Buy on the close above the neckline.', th: 'ซื้อเมื่อปิดเหนือ Neckline' } },
      ],
      riskReward: '2.0',
      entry: { price: 101, conditions: { en: 'Close above neckline (100.5)', th: 'ราคาปิดเหนือ Neckline (100.5)' } },
      sl: { price: 97.5, conditions: { en: 'Below the bottoms', th: 'ใต้ก้น' } },
      tp: { price: 106.5, conditions: { en: 'Height projection (100.5 + 6)', th: 'ความสูงฉายขึ้น (100.5 + 6)' } },
    },
  },
  'pattern-rounding-top': {
    candles: ROUND_TOP,
    title: { en: 'Rounding Top', th: 'Rounding Top (ยอดโค้ง)' },
    summary: {
      en: 'A slow, dome-shaped top that signals a gradual shift from buyers to sellers. Confirmation comes when price breaks below the neckline at the rim.',
      th: 'ยอดรูปโดมที่ค่อย ๆ เกิดขึ้น ส่งสัญญาณการเปลี่ยนจากฝั่งซื้อไปฝั่งขายอย่างช้า ๆ ยืนยันเมื่อราคาเบรกใต้ Neckline ที่ขอบถ้วย',
    },
    keyPoints: [
      { en: 'The rounding action is gradual — the dome takes many bars.', th: 'การโค้งเกิดขึ้นช้า ๆ — โดมต้องใช้หลายแท่ง' },
      { en: 'Volume often fades as the dome rounds over.', th: 'วอลุ่มมักลดลงขณะโดมโค้งผ่านยอด' },
      { en: 'A close below the rim support confirms the reversal.', th: 'การปิดใต้แนวรับขอบถ้วยยืนยันการกลับตัว' },
    ],
    priceLines: [{ price: 101.5, color: COLORS.amber, title: 'Neckline', dashed: true }],
    markers: [
      { time: rTopT(2), position: 'aboveBar', shape: 'arrowDown', color: COLORS.cyan, text: { en: 'Left rim', th: 'ขอบซ้าย' } },
      { time: rTopT(3), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Dome top', th: 'ยอดโดม' } },
      { time: rTopT(8), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Breakdown → Entry', th: 'เบรกลง → จุดเข้า' } },
    ],
    trade: {
      direction: 'short',
      setup: { en: 'Rounding Top Breakdown', th: 'เบรกลงยอดโค้ง' },
      logic: {
        en: 'Enter on a strong bearish close below the rim support. Stop above the dome. Target is the dome height projected below the neckline.',
        th: 'เข้าเทรดเมื่อแท่งปิดแดงแข็งแรงใต้แนวรับขอบถ้วย วาง Stop เหนือโดม เป้าหมายคือความสูงของโดมฉายลงจาก Neckline',
      },
      steps: [
        { n: 1, title: { en: 'See the Dome', th: 'เห็นโดม' }, description: { en: 'Price rounds over slowly after an advance.', th: 'ราคาโค้งลงอย่างช้า ๆ หลังช่วงขาขึ้น' } },
        { n: 2, title: { en: 'Mark the Rim', th: 'ทำเครื่องหมายขอบถ้วย' }, description: { en: 'The neckline sits at the level where the rounding began.', th: 'Neckline อยู่ที่ระดับที่การโค้งเริ่มต้น' } },
        { n: 3, title: { en: 'Trade the Breakdown', th: 'เทรดตอนเบรกลง' }, description: { en: 'Short on the close below the rim.', th: 'ชอร์ตเมื่อปิดใต้ขอบถ้วย' } },
      ],
      riskReward: '1.4',
      entry: { price: 101, conditions: { en: 'Close below neckline (101.5)', th: 'ราคาปิดใต้ Neckline (101.5)' } },
      sl: { price: 104.5, conditions: { en: 'Above the dome', th: 'เหนือโดม' } },
      tp: { price: 96, conditions: { en: 'Height projection (101.5 − 5.5)', th: 'ความสูงฉายลง (101.5 − 5.5)' } },
    },
  },
  'pattern-rounding-bottom': {
    candles: ROUND_BOTTOM,
    title: { en: 'Rounding Bottom', th: 'Rounding Bottom (ก้นโค้ง)' },
    summary: {
      en: 'A slow, saucer-shaped bottom that signals a gradual shift from sellers to buyers. Confirmation comes when price breaks above the neckline at the rim.',
      th: 'ก้นรูปจานรองที่ค่อย ๆ เกิดขึ้น ส่งสัญญาณการเปลี่ยนจากฝั่งขายไปฝั่งซื้ออย่างช้า ๆ ยืนยันเมื่อราคาเบรกเหนือ Neckline ที่ขอบถ้วย',
    },
    keyPoints: [
      { en: 'The rounding action is gradual — the saucer takes many bars.', th: 'การโค้งเกิดขึ้นช้า ๆ — จานรองต้องใช้หลายแท่ง' },
      { en: 'Volume often expands as the saucer completes.', th: 'วอลุ่มมักเพิ่มขึ้นเมื่อจานรองใกล้สมบูรณ์' },
      { en: 'A close above the rim resistance confirms the breakout.', th: 'การปิดเหนือแนวต้านขอบถ้วยยืนยันการเบรกขึ้น' },
    ],
    priceLines: [{ price: 102, color: COLORS.amber, title: 'Neckline', dashed: true }],
    markers: [
      { time: rBotT(2), position: 'aboveBar', shape: 'arrowDown', color: COLORS.cyan, text: { en: 'Left rim', th: 'ขอบซ้าย' } },
      { time: rBotT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Saucer bottom', th: 'ก้นจานรอง' } },
      { time: rBotT(8), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Breakout → Entry', th: 'เบรกขึ้น → จุดเข้า' } },
    ],
    trade: {
      direction: 'long',
      setup: { en: 'Rounding Bottom Breakout', th: 'เบรกขึ้นก้นโค้ง' },
      logic: {
        en: 'Enter on a strong bullish close above the rim resistance. Stop below the saucer. Target is the saucer depth projected above the neckline.',
        th: 'เข้าเทรดเมื่อแท่งปิดเขียวแข็งแรงเหนือแนวต้านขอบถ้วย วาง Stop ใต้จานรอง เป้าหมายคือความลึกของจานรองฉายขึ้นจาก Neckline',
      },
      steps: [
        { n: 1, title: { en: 'See the Saucer', th: 'เห็นจานรอง' }, description: { en: 'Price rounds up slowly after a decline.', th: 'ราคาโค้งขึ้นอย่างช้า ๆ หลังช่วงขาลง' } },
        { n: 2, title: { en: 'Mark the Rim', th: 'ทำเครื่องหมายขอบถ้วย' }, description: { en: 'The neckline sits at the level where the rounding began.', th: 'Neckline อยู่ที่ระดับที่การโค้งเริ่มต้น' } },
        { n: 3, title: { en: 'Trade the Breakout', th: 'เทรดตอนเบรกขึ้น' }, description: { en: 'Buy on the close above the rim.', th: 'ซื้อเมื่อปิดเหนือขอบถ้วย' } },
      ],
      riskReward: '1.7',
      entry: { price: 102.5, conditions: { en: 'Close above neckline (102)', th: 'ราคาปิดเหนือ Neckline (102)' } },
      sl: { price: 99, conditions: { en: 'Below the saucer', th: 'ใต้จานรอง' } },
      tp: { price: 108, conditions: { en: 'Depth projection (102 + 6)', th: 'ความลึกฉายขึ้น (102 + 6)' } },
    },
  },
  'pattern-diamond-top': {
    candles: DIAMOND_TOP,
    title: { en: 'Diamond Top', th: 'Diamond Top (เพชรยอด)' },
    summary: {
      en: 'A bearish reversal pattern shaped like a diamond: price widens into higher highs and lower lows, then narrows before breaking down below the pattern.',
      th: 'รูปแบบกลับตัวฝั่งขาลงรูปทรงเพชร: ราคาขยายกว้างเป็นจุดสูงที่สูงขึ้นและจุดต่ำที่ต่ำลง จากนั้นแคบลงก่อนเบรกลงใต้รูปแบบ',
    },
    keyPoints: [
      { en: 'The diamond broadens first, then narrows.', th: 'เพชรขยายกว้างก่อน แล้วค่อยแคบลง' },
      { en: 'The widening phase traps trend traders on both sides.', th: 'ช่วงขยายกว้างดักเทรดเดอร์ทั้งสองฝั่ง' },
      { en: 'A close below the final low confirms the breakdown.', th: 'การปิดใต้จุดต่ำสุดท้ายยืนยันการเบรกลง' },
    ],
    trendLines: [
      { from: { time: dTopT(1), price: 104 }, to: { time: dTopT(3), price: 105.5 }, color: COLORS.bear, dashed: true },
      { from: { time: dTopT(2), price: 102 }, to: { time: dTopT(4), price: 102.5 }, color: COLORS.cyan, dashed: true },
    ],
    markers: [
      { time: dTopT(3), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Widening', th: 'ขยายกว้าง' } },
      { time: dTopT(6), position: 'aboveBar', shape: 'arrowDown', color: COLORS.cyan, text: { en: 'Narrowing', th: 'แคบลง' } },
      { time: dTopT(8), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Breakdown → Entry', th: 'เบรกลง → จุดเข้า' } },
    ],
    trade: {
      direction: 'short',
      setup: { en: 'Diamond Top Breakdown', th: 'เบรกลงเพชรยอด' },
      logic: {
        en: 'Enter on a strong bearish close below the final low. Stop above the right side of the diamond. Target is the pattern height projected below.',
        th: 'เข้าเทรดเมื่อแท่งปิดแดงแข็งแรงใต้จุดต่ำสุดท้าย วาง Stop เหนือด้านขวาของเพชร เป้าหมายคือความสูงของรูปแบบฉายลง',
      },
      steps: [
        { n: 1, title: { en: 'Spot the Diamond', th: 'เห็นเพชร' }, description: { en: 'Price widens then narrows into a diamond shape.', th: 'ราคาขยายกว้างแล้วแคบลงเป็นรูปเพชร' } },
        { n: 2, title: { en: 'Watch the Final Low', th: 'ดูจุดต่ำสุดท้าย' }, description: { en: 'The breakdown happens below the last low.', th: 'การเบรกลงเกิดขึ้นใต้จุดต่ำสุดท้าย' } },
        { n: 3, title: { en: 'Trade the Breakdown', th: 'เทรดตอนเบรกลง' }, description: { en: 'Short on the close below the diamond.', th: 'ชอร์ตเมื่อปิดใต้เพชร' } },
      ],
      riskReward: '1.6',
      entry: { price: 101, conditions: { en: 'Close below final low (102)', th: 'ราคาปิดใต้จุดต่ำสุดท้าย (102)' } },
      sl: { price: 104.5, conditions: { en: 'Above the right side', th: 'เหนือด้านขวาของเพชร' } },
      tp: { price: 96.5, conditions: { en: 'Height projection (102 − 5.5)', th: 'ความสูงฉายลง (102 − 5.5)' } },
    },
  },
  'pattern-diamond-bottom': {
    candles: DIAMOND_BOTTOM,
    title: { en: 'Diamond Bottom', th: 'Diamond Bottom (เพชรก้น)' },
    summary: {
      en: 'A bullish reversal pattern shaped like a diamond: price widens into lower lows and higher highs, then narrows before breaking out above the pattern.',
      th: 'รูปแบบกลับตัวฝั่งขาขึ้นรูปทรงเพชร: ราคาขยายกว้างเป็นจุดต่ำที่ต่ำลงและจุดสูงที่สูงขึ้น จากนั้นแคบลงก่อนเบรกขึ้นเหนือรูปแบบ',
    },
    keyPoints: [
      { en: 'The diamond broadens first, then narrows.', th: 'เพชรขยายกว้างก่อน แล้วค่อยแคบลง' },
      { en: 'The widening phase shakes out late sellers.', th: 'ช่วงขยายกว้างเขย่าผู้ขายที่เข้าช้า' },
      { en: 'A close above the final high confirms the breakout.', th: 'การปิดเหนือจุดสูงสุดท้ายยืนยันการเบรกขึ้น' },
    ],
    trendLines: [
      { from: { time: dBotT(1), price: 109 }, to: { time: dBotT(3), price: 106.5 }, color: COLORS.cyan, dashed: true },
      { from: { time: dBotT(2), price: 110.5 }, to: { time: dBotT(4), price: 108 }, color: COLORS.bull, dashed: true },
    ],
    markers: [
      { time: dBotT(3), position: 'belowBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: 'Widening', th: 'ขยายกว้าง' } },
      { time: dBotT(6), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Narrowing', th: 'แคบลง' } },
      { time: dBotT(8), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Breakout → Entry', th: 'เบรกขึ้น → จุดเข้า' } },
    ],
    trade: {
      direction: 'long',
      setup: { en: 'Diamond Bottom Breakout', th: 'เบรกขึ้นเพชรก้น' },
      logic: {
        en: 'Enter on a strong bullish close above the final high. Stop below the right side of the diamond. Target is the pattern height projected above.',
        th: 'เข้าเทรดเมื่อแท่งปิดเขียวแข็งแรงเหนือจุดสูงสุดท้าย วาง Stop ใต้ด้านขวาของเพชร เป้าหมายคือความสูงของรูปแบบฉายขึ้น',
      },
      steps: [
        { n: 1, title: { en: 'Spot the Diamond', th: 'เห็นเพชร' }, description: { en: 'Price widens then narrows into a diamond shape.', th: 'ราคาขยายกว้างแล้วแคบลงเป็นรูปเพชร' } },
        { n: 2, title: { en: 'Watch the Final High', th: 'ดูจุดสูงสุดท้าย' }, description: { en: 'The breakout happens above the last high.', th: 'การเบรกขึ้นเกิดขึ้นเหนือจุดสูงสุดท้าย' } },
        { n: 3, title: { en: 'Trade the Breakout', th: 'เทรดตอนเบรกขึ้น' }, description: { en: 'Buy on the close above the diamond.', th: 'ซื้อเมื่อปิดเหนือเพชร' } },
      ],
      riskReward: '1.7',
      entry: { price: 108, conditions: { en: 'Close above final high (107)', th: 'ราคาปิดเหนือจุดสูงสุดท้าย (107)' } },
      sl: { price: 104.5, conditions: { en: 'Below the right side', th: 'ใต้ด้านขวาของเพชร' } },
      tp: { price: 114.5, conditions: { en: 'Height projection (107 + 7.5)', th: 'ความสูงฉายขึ้น (107 + 7.5)' } },
    },
  },
  'pattern-broadening-top': {
    candles: BROADEN_TOP,
    title: { en: 'Broadening Top (Megaphone)', th: 'Broadening Top (ปากแตร)' },
    summary: {
      en: 'A bearish pattern with expanding highs and lows, shaped like a megaphone. Each swing is more volatile than the last, and price eventually breaks down.',
      th: 'รูปแบบขาลงที่จุดสูงและจุดต่ำขยายกว้างขึ้นเรื่อย ๆ รูปทรงปากแตร ความผันผวนเพิ่มขึ้นทุกสวิง และสุดท้ายราคาเบรกลง',
    },
    keyPoints: [
      { en: 'Higher highs and lower lows widen the range.', th: 'จุดสูงที่สูงขึ้นและจุดต่ำที่ต่ำลงขยายกรอบราคา' },
      { en: 'The widening shows emotional, two-sided trading.', th: 'การขยายกว้างบ่งบอกถึงการเทรดสองฝั่งที่ขาดเหตุผล' },
      { en: 'A close below the latest low confirms the breakdown.', th: 'การปิดใต้จุดต่ำล่าสุดยืนยันการเบรกลง' },
    ],
    trendLines: [
      { from: { time: brT(1), price: 104 }, to: { time: brT(5), price: 107.5 }, color: COLORS.bear, dashed: true },
      { from: { time: brT(2), price: 101.5 }, to: { time: brT(6), price: 102 }, color: COLORS.cyan, dashed: true },
    ],
    markers: [
      { time: brT(3), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Higher high', th: 'จุดสูงที่สูงขึ้น' } },
      { time: brT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: 'Lower low', th: 'จุดต่ำที่ต่ำลง' } },
      { time: brT(7), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Breakdown → Entry', th: 'เบรกลง → จุดเข้า' } },
    ],
    trade: {
      direction: 'short',
      setup: { en: 'Broadening Top Breakdown', th: 'เบรกลงปากแตร' },
      logic: {
        en: 'Enter on a strong bearish close below the latest low. Stop above the last high. Target is the height of the megaphone projected below.',
        th: 'เข้าเทรดเมื่อแท่งปิดแดงแข็งแรงใต้จุดต่ำล่าสุด วาง Stop เหนือจุดสูงสุดท้าย เป้าหมายคือความสูงของปากแตรฉายลง',
      },
      steps: [
        { n: 1, title: { en: 'See the Megaphone', th: 'เห็นปากแตร' }, description: { en: 'Price swings widen in both directions.', th: 'ราคาแกว่งกว้างขึ้นทั้งสองทิศทาง' } },
        { n: 2, title: { en: 'Wait for the Break', th: 'รอการเบรก' }, description: { en: 'The breakdown comes below the latest low.', th: 'การเบรกลงเกิดใต้จุดต่ำล่าสุด' } },
        { n: 3, title: { en: 'Trade the Breakdown', th: 'เทรดตอนเบรกลง' }, description: { en: 'Short on the close below the pattern.', th: 'ชอร์ตเมื่อปิดใต้รูปแบบ' } },
      ],
      riskReward: '1.5',
      entry: { price: 101.5, conditions: { en: 'Close below latest low (102)', th: 'ราคาปิดใต้จุดต่ำล่าสุด (102)' } },
      sl: { price: 104.5, conditions: { en: 'Above the last high', th: 'เหนือจุดสูงสุดท้าย' } },
      tp: { price: 97, conditions: { en: 'Height projection (102 − 5)', th: 'ความสูงฉายลง (102 − 5)' } },
    },
  },
  'pattern-island-reversal': {
    candles: ISLAND_REV,
    title: { en: 'Island Reversal', th: 'Island Reversal (เกาะกลับตัว)' },
    summary: {
      en: 'A bearish reversal: an isolated cluster of candles separated by gaps on both sides. The gap down after the island traps late buyers and signals a trend change.',
      th: 'รูปแบบกลับตัวฝั่งขาลง: กลุ่มแท่งเทียนที่โดดเดี่ยว คั่นด้วยช่องว่างทั้งสองด้าน ช่องว่างที่เกิดหลังเกาะดักผู้ซื้อที่เข้าช้าและส่งสัญญาณเปลี่ยนเทรนด์',
    },
    keyPoints: [
      { en: 'The island is surrounded by gaps on both sides.', th: 'เกาะถูกล้อมรอบด้วยช่องว่างทั้งสองด้าน' },
      { en: 'The pattern traps buyers who chased the breakout.', th: 'รูปแบบดักผู้ซื้อที่ไล่ตามการเบรก' },
      { en: 'The gap down confirms the reversal to the downside.', th: 'ช่องว่างที่เกิดขาลงยืนยันการกลับตัว' },
    ],
    markers: [
      { time: islT(2), position: 'aboveBar', shape: 'arrowDown', color: COLORS.cyan, text: { en: 'Gap up', th: 'ช่องว่างขึ้น' } },
      { time: islT(5), position: 'belowBar', shape: 'arrowUp', color: COLORS.bear, text: { en: 'Island', th: 'เกาะ' } },
      { time: islT(6), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Gap down → Entry', th: 'ช่องว่างลง → จุดเข้า' } },
    ],
    trade: {
      direction: 'short',
      setup: { en: 'Island Reversal Short', th: 'ชอร์ตเกาะกลับตัว' },
      logic: {
        en: 'Enter on the bearish close that leaves the gap down from the island. Stop above the island high. Target is the island height projected below.',
        th: 'เข้าเทรดเมื่อแท่งปิดแดงที่สร้างช่องว่างลงจากเกาะ วาง Stop เหนือจุดสูงของเกาะ เป้าหมายคือความสูงของเกาะฉายลง',
      },
      steps: [
        { n: 1, title: { en: 'Find the Island', th: 'หาเกาะ' }, description: { en: 'A cluster of candles isolated by gaps.', th: 'กลุ่มแท่งเทียนที่โดดเดี่ยวด้วยช่องว่าง' } },
        { n: 2, title: { en: 'Watch for the Gap Down', th: 'รอช่องว่างลง' }, description: { en: 'Price gaps away from the island to the downside.', th: 'ราคาสร้างช่องว่างลงห่างจากเกาะ' } },
        { n: 3, title: { en: 'Trade the Reversal', th: 'เทรดการกลับตัว' }, description: { en: 'Short on the gap-down close.', th: 'ชอร์ตเมื่อปิดแท่งช่องว่างลง' } },
      ],
      riskReward: '1.8',
      entry: { price: 104, conditions: { en: 'Gap-down close below island', th: 'ปิดแท่งช่องว่างลงใต้เกาะ' } },
      sl: { price: 108.5, conditions: { en: 'Above island high', th: 'เหนือจุดสูงของเกาะ' } },
      tp: { price: 98, conditions: { en: 'Island height projection (104 − 6)', th: 'ความสูงของเกาะฉายลง (104 − 6)' } },
    },
  },
  'pattern-bear-pennant': {
    candles: BEAR_PENNANT,
    title: { en: 'Bearish Pennant', th: 'Pennant ขาลง' },
    summary: {
      en: 'A bearish continuation pattern: a sharp decline (the pole) followed by a small symmetric triangle (the pennant), then a breakdown to continue the downtrend.',
      th: 'รูปแบบการไปต่อฝั่งขาลง: การร่วงแรง (เสาธง) ตามด้วยสามเหลี่ยมเล็ก ๆ สมมาตร (ตัวธง) แล้วเบรกลงเพื่อไปต่อในเทรนด์เดิม',
    },
    keyPoints: [
      { en: 'The pole is a strong, impulsive move downward.', th: 'เสาธงคือช่วงที่ราคาร่วงแรงและเร็ว' },
      { en: 'The pennant is a tight, symmetric consolidation.', th: 'ตัวธงคือการพักตัวที่แน่นและสมมาตร' },
      { en: 'A close below the pennant triggers the entry.', th: 'การปิดใต้ตัวธงเป็นจุดเข้าเทรด' },
    ],
    trendLines: [
      { from: { time: bpT(3), price: 105 }, to: { time: bpT(4), price: 106 }, color: COLORS.accent, dashed: true },
      { from: { time: bpT(2), price: 103 }, to: { time: bpT(5), price: 104.5 }, color: COLORS.accent, dashed: true },
      { from: { time: bpT(0), price: 112 }, to: { time: bpT(2), price: 103 }, color: COLORS.bear, dashed: false },
    ],
    markers: [
      { time: bpT(2), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: { en: '① Flag Pole', th: '① เสาธง' } },
      { time: bpT(4), position: 'aboveBar', shape: 'arrowUp', color: COLORS.accent, text: { en: '② Pennant', th: '② ตัวธง' } },
      { time: bpT(6), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: { en: '③ Breakdown → Entry', th: '③ เบรกลง → จุดเข้า' } },
    ],
    trade: {
      direction: 'short',
      setup: { en: 'Bear Pennant Breakdown', th: 'เบรกลง Pennant' },
      logic: {
        en: 'Enter on the close of a strong bearish candle breaking the pennant. Stop is above the pennant high. Target is the length of the pole projected from the breakdown.',
        th: 'เข้าเทรดเมื่อแท่งเทียนปิดทะลุตัวธงด้วยแรงขายที่แข็งแกร่ง ตั้ง Stop ไว้เหนือจุดสูงสุดของตัวธง เป้าหมายคือความยาวของเสาธงฉายจากจุดเบรกลง',
      },
      steps: [
        { n: 1, title: { en: 'Identify the Pole', th: 'หาเสาธง' }, description: { en: 'Find a strong impulsive move downward.', th: 'หาการร่วงลงอย่างรุนแรง' } },
        { n: 2, title: { en: 'Spot the Pennant', th: 'หาตัวธง' }, description: { en: 'Price coils into a small symmetric triangle.', th: 'ราคาสะสมตัวเป็นสามเหลี่ยมสมมาตรเล็ก ๆ' } },
        { n: 3, title: { en: 'Trade the Breakdown', th: 'เทรดตอนเบรกลง' }, description: { en: 'Wait for price to close below the pennant.', th: 'รอราคาปิดทะลุตัวธง' } },
      ],
      riskReward: '2.6',
      entry: { price: 104, conditions: { en: 'Close below pennant', th: 'ราคาปิดทะลุตัวธง' } },
      sl: { price: 106.5, conditions: { en: 'Above pennant structure', th: 'เหนือโครงสร้างตัวธง' } },
      tp: { price: 95, conditions: { en: 'Pole projection (104 − 9)', th: 'ระยะความยาวของเสาธง (104 − 9)' } },
    },
  },
  'pattern-symmetrical-triangle': {
    candles: SYM_TRI,
    title: { en: 'Symmetrical Triangle', th: 'Symmetrical Triangle (สามเหลี่ยมสมมาตร)' },
    summary: {
      en: 'A neutral continuation pattern: lower highs and higher lows converge into a tightening triangle. A breakout in either direction, here upward, continues the trend.',
      th: 'รูปแบบการไปต่อที่เป็นกลาง: จุดสูงที่ต่ำลงและจุดต่ำที่สูงขึ้นบรรจบเป็นสามเหลี่ยมที่แคบลง การเบรกทั้งสองทิศทาง — ในที่นี้คือขึ้น — เดินต่อตามเทรนด์',
    },
    keyPoints: [
      { en: 'Both trendlines converge toward an apex.', th: 'เส้นแนวโน้มทั้งสองบรรจบเข้าหาจุดยอด' },
      { en: 'The triangle is a pause, not a reversal.', th: 'สามเหลี่ยมคือการพักตัว ไม่ใช่การกลับตัว' },
      { en: 'Trade the direction of the breakout close.', th: 'เทรดตามทิศทางของการปิดเบรก' },
    ],
    trendLines: [
      { from: { time: stT(1), price: 105 }, to: { time: stT(5), price: 103.5 }, color: COLORS.bear, dashed: true },
      { from: { time: stT(2), price: 101.5 }, to: { time: stT(6), price: 101.5 }, color: COLORS.cyan, dashed: true },
    ],
    markers: [
      { time: stT(1), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Lower high', th: 'จุดสูงที่ต่ำลง' } },
      { time: stT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: 'Higher low', th: 'จุดต่ำที่สูงขึ้น' } },
      { time: stT(7), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Breakout → Entry', th: 'เบรกขึ้น → จุดเข้า' } },
    ],
    trade: {
      direction: 'long',
      setup: { en: 'Symmetrical Triangle Breakout', th: 'เบรกขึ้นสามเหลี่ยมสมมาตร' },
      logic: {
        en: 'Enter on the close in the breakout direction. Stop on the opposite side of the triangle. Target is the triangle height projected from the breakout.',
        th: 'เข้าเทรดเมื่อปิดแท่งเบรกตามทิศทาง วาง Stop ฝั่งตรงข้ามของสามเหลี่ยม เป้าหมายคือความสูงของสามเหลี่ยมฉายจากจุดเบรก',
      },
      steps: [
        { n: 1, title: { en: 'Draw the Triangle', th: 'วาดสามเหลี่ยม' }, description: { en: 'Connect the converging highs and lows.', th: 'ลากเส้นเชื่อมจุดสูงและจุดต่ำที่บรรจบกัน' } },
        { n: 2, title: { en: 'Wait for the Breakout', th: 'รอการเบรก' }, description: { en: 'Price must close outside the triangle.', th: 'ราคาต้องปิดออกนอกสามเหลี่ยม' } },
        { n: 3, title: { en: 'Trade the Direction', th: 'เทรดตามทิศทาง' }, description: { en: 'Follow the breakout close direction.', th: 'ตามทิศทางของแท่งปิดเบรก' } },
      ],
      riskReward: '2.0',
      entry: { price: 105.5, conditions: { en: 'Close above upper line', th: 'ราคาปิดเหนือเส้นบน' } },
      sl: { price: 101, conditions: { en: 'Below lower line', th: 'ใต้เส้นล่าง' } },
      tp: { price: 109.5, conditions: { en: 'Height projection (105.5 + 4)', th: 'ความสูงฉายขึ้น (105.5 + 4)' } },
    },
  },
  'pattern-bull-rectangle': {
    candles: BULL_RECT,
    title: { en: 'Bullish Rectangle', th: 'Bullish Rectangle (กรอบขาขึ้น)' },
    summary: {
      en: 'A bullish continuation pattern: price trades sideways between parallel support and resistance, then breaks out above the range to continue the uptrend.',
      th: 'รูปแบบการไปต่อฝั่งขาขึ้น: ราคาแกว่งด้านข้างระหว่างแนวรับและแนวต้านขนานกัน แล้วเบรกขึ้นเหนือกรอบเพื่อไปต่อเทรนด์ขาขึ้น',
    },
    keyPoints: [
      { en: 'Price oscillates between two parallel lines.', th: 'ราคาแกว่งระหว่างเส้นขนานสองเส้น' },
      { en: 'Each touch of support and resistance tests the range.', th: 'ทุกการแตะแนวรับและแนวต้านทดสอบกรอบราคา' },
      { en: 'A close above the range high triggers the entry.', th: 'การปิดเหนือจุดสูงของกรอบเป็นจุดเข้าเทรด' },
    ],
    priceLines: [
      { price: 105, color: COLORS.amber, title: 'Resistance', dashed: true },
      { price: 101.5, color: COLORS.cyan, title: 'Support', dashed: true },
    ],
    markers: [
      { time: bullRctT(1), position: 'aboveBar', shape: 'arrowDown', color: COLORS.amber, text: { en: 'Resistance', th: 'แนวต้าน' } },
      { time: bullRctT(2), position: 'belowBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: 'Support', th: 'แนวรับ' } },
      { time: bullRctT(7), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Breakout → Entry', th: 'เบรกขึ้น → จุดเข้า' } },
    ],
    trade: {
      direction: 'long',
      setup: { en: 'Bullish Rectangle Breakout', th: 'เบรกขึ้นกรอบขาขึ้น' },
      logic: {
        en: 'Enter on a strong bullish close above the range high. Stop below the range low. Target is the range height projected above the breakout.',
        th: 'เข้าเทรดเมื่อแท่งปิดเขียวแข็งแรงเหนือจุดสูงของกรอบ วาง Stop ใต้จุดต่ำของกรอบ เป้าหมายคือความสูงของกรอบฉายขึ้นจากจุดเบรก',
      },
      steps: [
        { n: 1, title: { en: 'See the Box', th: 'เห็นกรอบ' }, description: { en: 'Price ranges between two parallel levels.', th: 'ราคาแกว่งระหว่างเส้นขนานสองระดับ' } },
        { n: 2, title: { en: 'Wait for the Breakout', th: 'รอการเบรกขึ้น' }, description: { en: 'Price must close above the range high.', th: 'ราคาต้องปิดเหนือจุดสูงของกรอบ' } },
        { n: 3, title: { en: 'Trade the Projection', th: 'เทรดตามเป้าหมาย' }, description: { en: 'Target the range height above the breakout.', th: 'ตั้งเป้าเท่ากับความสูงของกรอบเหนือจุดเบรก' } },
      ],
      riskReward: '2.2',
      entry: { price: 105.5, conditions: { en: 'Close above range high (105)', th: 'ราคาปิดเหนือจุดสูงของกรอบ (105)' } },
      sl: { price: 101, conditions: { en: 'Below range low', th: 'ใต้จุดต่ำของกรอบ' } },
      tp: { price: 109.5, conditions: { en: 'Height projection (105 + 4.5)', th: 'ความสูงของกรอบฉาย (105 + 4.5)' } },
    },
  },
  'pattern-bear-rectangle': {
    candles: BEAR_RECT,
    title: { en: 'Bearish Rectangle', th: 'Bearish Rectangle (กรอบขาลง)' },
    summary: {
      en: 'A bearish continuation pattern: price trades sideways between parallel support and resistance, then breaks out below the range to continue the downtrend.',
      th: 'รูปแบบการไปต่อฝั่งขาลง: ราคาแกว่งด้านข้างระหว่างแนวรับและแนวต้านขนานกัน แล้วเบรกลงใต้กรอบเพื่อไปต่อเทรนด์ขาลง',
    },
    keyPoints: [
      { en: 'Price oscillates between two parallel lines.', th: 'ราคาแกว่งระหว่างเส้นขนานสองเส้น' },
      { en: 'Each touch of support and resistance tests the range.', th: 'ทุกการแตะแนวรับและแนวต้านทดสอบกรอบราคา' },
      { en: 'A close below the range low triggers the entry.', th: 'การปิดใต้จุดต่ำของกรอบเป็นจุดเข้าเทรด' },
    ],
    priceLines: [
      { price: 111, color: COLORS.bear, title: 'Resistance', dashed: true },
      { price: 108, color: COLORS.amber, title: 'Support', dashed: true },
    ],
    markers: [
      { time: bearRctT(1), position: 'belowBar', shape: 'arrowUp', color: COLORS.amber, text: { en: 'Support', th: 'แนวรับ' } },
      { time: bearRctT(2), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Resistance', th: 'แนวต้าน' } },
      { time: bearRctT(7), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Breakdown → Entry', th: 'เบรกลง → จุดเข้า' } },
    ],
    trade: {
      direction: 'short',
      setup: { en: 'Bearish Rectangle Breakdown', th: 'เบรกลงกรอบขาลง' },
      logic: {
        en: 'Enter on a strong bearish close below the range low. Stop above the range high. Target is the range height projected below the breakdown.',
        th: 'เข้าเทรดเมื่อแท่งปิดแดงแข็งแรงใต้จุดต่ำของกรอบ วาง Stop เหนือจุดสูงของกรอบ เป้าหมายคือความสูงของกรอบฉายลงจากจุดเบรกลง',
      },
      steps: [
        { n: 1, title: { en: 'See the Box', th: 'เห็นกรอบ' }, description: { en: 'Price ranges between two parallel levels.', th: 'ราคาแกว่งระหว่างเส้นขนานสองระดับ' } },
        { n: 2, title: { en: 'Wait for the Breakdown', th: 'รอการเบรกลง' }, description: { en: 'Price must close below the range low.', th: 'ราคาต้องปิดใต้จุดต่ำของกรอบ' } },
        { n: 3, title: { en: 'Trade the Projection', th: 'เทรดตามเป้าหมาย' }, description: { en: 'Target the range height below the breakdown.', th: 'ตั้งเป้าเท่ากับความสูงของกรอบใต้จุดเบรกลง' } },
      ],
      riskReward: '2.2',
      entry: { price: 107.5, conditions: { en: 'Close below range low (108)', th: 'ราคาปิดใต้จุดต่ำของกรอบ (108)' } },
      sl: { price: 111.5, conditions: { en: 'Above range high', th: 'เหนือจุดสูงของกรอบ' } },
      tp: { price: 104, conditions: { en: 'Height projection (108 − 4)', th: 'ความสูงของกรอบฉาย (108 − 4)' } },
    },
  },
  'playbook-trendline': {
    candles: FLAG,
    title: { en: 'Bull Flag Pattern Breakout', th: 'การเบรกเอาต์รูปแบบ Bull Flag' },
    summary: {
      en: 'A trend continuation pattern featuring an impulsive flag pole, a downward-sloping consolidation channel (the flag), and a decisive breakout.',
      th: 'รูปแบบการไปต่อของเทรนด์ ประกอบด้วยช่วงราคาวิ่งแรง (เสาธง) การพักตัวแบบเฉียงลง (ตัวธง) และการเบรกเอาต์อย่างชัดเจนเพื่อไปต่อ',
    },
    keyPoints: [
      { en: 'The impulsive move creates the flag pole.', th: 'การพุ่งแรงของราคา สร้าง "เสาธง"' },
      { en: 'The consolidation forms a downward sloping channel.', th: 'การพักตัวสร้างกรอบราคา (Channel) ที่เฉียงลง' },
      { en: 'A breakout above the upper trendline triggers the entry.', th: 'การทะลุผ่านเส้น Trendline ด้านบน เป็นจุดเข้าเทรด' },
    ],
    trendLines: [
      { from: { time: flagT(4), price: 120 }, to: { time: flagT(9), price: 116 }, color: COLORS.accent, dashed: true },
      { from: { time: flagT(5), price: 117 }, to: { time: flagT(9), price: 112 }, color: COLORS.accent, dashed: true },
      { from: { time: flagT(0), price: 100 }, to: { time: flagT(4), price: 120 }, color: COLORS.bull, dashed: false },
    ],
    markers: [
      { time: flagT(2), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: { en: '① Flag Pole', th: '① เสาธง' } },
      { time: flagT(7), position: 'aboveBar', shape: 'arrowDown', color: COLORS.accent, text: { en: '② Consolidation (Flag)', th: '② การพักตัว (ตัวธง)' } },
      { time: flagT(10), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: '③ Breakout → Entry', th: '③ เบรกเอาต์ → จุดเข้า' } },
    ],
    trade: {
      direction: 'long',
      setup: { en: 'Bull Flag Breakout', th: 'เบรกเอาต์ Bull Flag' },
      logic: {
        en: 'Enter upon the close of a strong bullish candle breaking the upper flag resistance. Stop loss is below the flag low. Target is the length of the pole.',
        th: 'เข้าเทรดเมื่อแท่งเทียนปิดทะลุเส้นแนวต้านด้านบนของธงด้วยแรงซื้อที่แข็งแกร่ง ตั้ง Stop loss ไว้ใต้จุดต่ำสุดของธง เป้าหมายคือความยาวของเสาธง',
      },
      steps: [
        { n: 1, title: { en: 'Identify the Pole', th: 'หาเสาธง' }, description: { en: 'Find a strong impulsive move upward.', th: 'หาการพุ่งขึ้นอย่างรุนแรง' } },
        { n: 2, title: { en: 'Draw the Flag', th: 'วาดกรอบธง' }, description: { en: 'Connect the lower highs and lower lows of the pullback.', th: 'ตีเส้นเชื่อมจุดยอดที่ต่ำลงและจุดต่ำที่ต่ำลงของการย่อตัว' } },
        { n: 3, title: { en: 'Trade the Breakout', th: 'เทรดตอนเบรกเอาต์' }, description: { en: 'Wait for price to close above the upper trendline.', th: 'รอราคาปิดทะลุเส้น Trendline ด้านบน' } },
      ],
      riskReward: '3.0',
      entry: { price: 118, conditions: { en: 'Close above flag resistance', th: 'ราคาปิดทะลุแนวต้านธง' } },
      sl: { price: 111, conditions: { en: 'Below flag structure', th: 'ใต้โครงสร้างของธง' } },
      tp: { price: 139, conditions: { en: 'Pole projection', th: 'ระยะความยาวของเสาธง' } },
    }
  },

  /* ========================== Basic Structure ============================= */

  high: {
    candles: UP,
    title: 'High',
    summary:
      'The High is the highest price traded during a given period (this candle, day, session, or swing). It marks the peak of buying pressure before sellers stepped in.',
    keyPoints: [
      'The high is the top of the wick, not the close.',
      'A swing high forms when price reverses down from a peak, leaving lower prices on at least one bar each side.',
      'Multiple touches of the same high create resistance (see EQH).',
    ],
    markers: [
      { time: upT(29), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'High 112.5' },
    ],
    priceLines: [{ price: 112.5, color: COLORS.bull, title: 'High', dashed: true }],
    legend: [
      { label: 'Period high', color: COLORS.bull },
      { label: 'High level', color: COLORS.bull, dashed: true },
    ],
  },

  low: {
    candles: DOWN,
    title: 'Low',
    summary:
      'The Low is the lowest price traded during a given period. It marks the peak of selling pressure before buyers stepped back in.',
    keyPoints: [
      'The low is the bottom of the wick, not the close.',
      'A swing low forms when price reverses up from a trough, leaving higher prices on at least one bar each side.',
      'Multiple touches of the same low create support (see EQL).',
    ],
    markers: [
      { time: downT(13), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: 'Low 96.5' },
    ],
    priceLines: [{ price: 96.5, color: COLORS.bear, title: 'Low', dashed: true }],
    legend: [
      { label: 'Period low', color: COLORS.bear },
      { label: 'Low level', color: COLORS.bear, dashed: true },
    ],
  },

  'swing-high': {
    candles: UP,
    title: 'Swing High',
    summary:
      'A Swing High (SH) is a peak where price reversed lower. It is confirmed by lower prices on at least one bar to the left and one to the right, making it a pivot point.',
    keyPoints: [
      'Swing highs are the pivots that define downtrend legs and resistance.',
      'In an uptrend, swing highs keep getting higher — that is the HH sequence.',
      'A break above a swing high is the trigger for BOS.',
    ],
    markers: [
      { time: upT(4), position: 'aboveBar', shape: 'square', color: COLORS.bull, text: 'Swing High' },
      { time: upT(12), position: 'aboveBar', shape: 'square', color: COLORS.bull, text: 'Swing High' },
      { time: upT(24), position: 'aboveBar', shape: 'square', color: COLORS.bull, text: 'Swing High' },
    ],
    legend: [{ label: 'Swing High pivot', color: COLORS.bull }],
  },

  'swing-low': {
    candles: DOWN,
    title: 'Swing Low',
    summary:
      'A Swing Low (SL) is a trough where price reversed higher, confirmed by higher prices on at least one bar to the left and one to the right.',
    keyPoints: [
      'Swing lows are the pivots that define uptrend legs and support.',
      'In a downtrend, swing lows keep getting lower — that is the LL sequence.',
      'A break below a swing low is the trigger for a bearish BOS / CHoCH.',
    ],
    markers: [
      { time: downT(3), position: 'belowBar', shape: 'square', color: COLORS.bear, text: 'Swing Low' },
      { time: downT(7), position: 'belowBar', shape: 'square', color: COLORS.bear, text: 'Swing Low' },
      { time: downT(13), position: 'belowBar', shape: 'square', color: COLORS.bear, text: 'Swing Low' },
    ],
    legend: [{ label: 'Swing Low pivot', color: COLORS.bear }],
  },

  hh: {
    candles: UP,
    title: 'Higher High (HH)',
    summary:
      'A Higher High is a swing high that is higher than the previous swing high. Consecutive HHs confirm that buyers are in control and the trend is up.',
    keyPoints: [
      'HH + HL (Higher Low) is the fingerprint of a healthy uptrend.',
      'Each HH shows demand absorbing supply at higher and higher prices.',
      'When price stops making HHs, watch for a possible reversal (CHoCH).',
    ],
    markers: [
      { time: upT(8), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'HH' },
      { time: upT(12), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'HH' },
      { time: upT(16), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'HH' },
      { time: upT(20), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'HH' },
      { time: upT(24), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'HH' },
    ],
    legend: [{ label: 'Higher High', color: COLORS.bull }],
  },

  hl: {
    candles: UP,
    title: 'Higher Low (HL)',
    summary:
      'A Higher Low is a swing low that is higher than the previous swing low. HLs show that even the dips are being bought, a hallmark of bullish structure.',
    keyPoints: [
      'HLs are the "steps" of an uptrend — each pullback stops higher than the last.',
      'As long as price keeps making HLs, the path of least resistance is up.',
      'The last HL is the invalidation point for the bullish trend.',
    ],
    markers: [
      { time: upT(6), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'HL' },
      { time: upT(10), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'HL' },
      { time: upT(14), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'HL' },
      { time: upT(18), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'HL' },
      { time: upT(22), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'HL' },
      { time: upT(26), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'HL' },
    ],
    legend: [{ label: 'Higher Low', color: COLORS.cyan }],
  },

  lh: {
    candles: DOWN,
    title: 'Lower High (LH)',
    summary:
      'A Lower High is a swing high that is lower than the previous swing high. Consecutive LHs confirm that sellers are in control and the trend is down.',
    keyPoints: [
      'LH + LL (Lower Low) is the fingerprint of a healthy downtrend.',
      'Each failed rally shows supply overwhelming demand at lower prices.',
      'When price stops making LHs, watch for a possible bullish reversal.',
    ],
    markers: [
      { time: downT(2), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bear, text: 'LH' },
      { time: downT(5), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bear, text: 'LH' },
      { time: downT(7), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bear, text: 'LH' },
      { time: downT(9), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bear, text: 'LH' },
      { time: downT(11), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bear, text: 'LH' },
    ],
    legend: [{ label: 'Lower High', color: COLORS.bear }],
  },

  ll: {
    candles: DOWN,
    title: 'Lower Low (LL)',
    summary:
      'A Lower Low is a swing low that is lower than the previous swing low. LLs show that rallies keep failing and each sell-off extends further.',
    keyPoints: [
      'LLs are the "steps" of a downtrend — each sell-off bottoms lower than the last.',
      'As long as price keeps making LLs, the path of least resistance is down.',
      'The last LL is the invalidation point for the bearish trend.',
    ],
    markers: [
      { time: downT(3), position: 'belowBar', shape: 'arrowDown', color: COLORS.amber, text: 'LL' },
      { time: downT(5), position: 'belowBar', shape: 'arrowDown', color: COLORS.amber, text: 'LL' },
      { time: downT(7), position: 'belowBar', shape: 'arrowDown', color: COLORS.amber, text: 'LL' },
      { time: downT(9), position: 'belowBar', shape: 'arrowDown', color: COLORS.amber, text: 'LL' },
      { time: downT(11), position: 'belowBar', shape: 'arrowDown', color: COLORS.amber, text: 'LL' },
      { time: downT(13), position: 'belowBar', shape: 'arrowDown', color: COLORS.amber, text: 'LL' },
    ],
    legend: [{ label: 'Lower Low', color: COLORS.amber }],
  },

  eqh: {
    candles: SIDE,
    title: 'Equal Highs (EQH)',
    summary:
      'Equal Highs are two or more swing highs that form at (nearly) the same price. The repeated rejection marks a supply zone that traders watch for a break.',
    keyPoints: [
      'The more touches, the stronger the level — a magnet for stop orders.',
      'If price finally breaks above the EQH, the zone often flips into support.',
      'Inside a range, EQH + EQL define the tradable edges.',
    ],
    zones: [
      { startTime: sideT(0), endTime: sideT(18), topPrice: 104.0, bottomPrice: 103.5, color: COLORS.zoneAmber },
    ],
    priceLines: [{ price: 104.0, color: COLORS.amber, title: 'EQH', dashed: true }],
    markers: [
      { time: sideT(2), position: 'aboveBar', shape: 'arrowUp', color: COLORS.amber, text: 'EQH' },
      { time: sideT(7), position: 'aboveBar', shape: 'arrowUp', color: COLORS.amber, text: 'EQH' },
      { time: sideT(12), position: 'aboveBar', shape: 'arrowUp', color: COLORS.amber, text: 'EQH' },
      { time: sideT(17), position: 'aboveBar', shape: 'arrowUp', color: COLORS.amber, text: 'EQH' },
    ],
    legend: [
      { label: 'EQH zone', color: COLORS.amber },
      { label: 'EQH level', color: COLORS.amber, dashed: true },
    ],
  },

  eql: {
    candles: SIDE,
    title: 'Equal Lows (EQL)',
    summary:
      'Equal Lows are two or more swing lows that form at (nearly) the same price. The repeated bounce marks a demand zone where buyers defend the level.',
    keyPoints: [
      'EQL acts as support — price bounces each time it arrives.',
      'If price finally breaks below the EQL, the zone often flips into resistance.',
      'Inside a range, EQL is where traders look for long entries.',
    ],
    zones: [
      { startTime: sideT(0), endTime: sideT(18), topPrice: 100.0, bottomPrice: 99.5, color: COLORS.zoneCyan },
    ],
    priceLines: [{ price: 99.5, color: COLORS.cyan, title: 'EQL', dashed: true }],
    markers: [
      { time: sideT(4), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'EQL' },
      { time: sideT(9), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'EQL' },
      { time: sideT(14), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'EQL' },
    ],
    legend: [
      { label: 'EQL zone', color: COLORS.cyan },
      { label: 'EQL level', color: COLORS.cyan, dashed: true },
    ],
  },

  uptrend: {
    candles: UP,
    title: 'Uptrend',
    summary:
      'An Uptrend is a market regime defined by a sequence of Higher Highs and Higher Lows. Buyers absorb every dip, pushing price into new highs.',
    keyPoints: [
      'Structure: HH → HL → HH → HL… Each swing is higher than the last.',
      'The ascending line along the swing lows is the trend’s backbone.',
      'Traders buy pullbacks into the HLs and hold until the last HL breaks.',
    ],
    markers: [
      { time: upT(8), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'HH' },
      { time: upT(10), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'HL' },
      { time: upT(16), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'HH' },
      { time: upT(18), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'HL' },
      { time: upT(24), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'HH' },
    ],
    trendLines: [
      { from: { time: upT(6), price: 102.0 }, to: { time: upT(26), price: 108.0 }, color: COLORS.bull, dashed: true },
    ],
    legend: [
      { label: 'Higher High', color: COLORS.bull },
      { label: 'Higher Low', color: COLORS.cyan },
      { label: 'Ascending swing-low line', color: COLORS.bull, dashed: true },
    ],
  },

  downtrend: {
    candles: DOWN,
    title: 'Downtrend',
    summary:
      'A Downtrend is a market regime defined by a sequence of Lower Highs and Lower Lows. Sellers overwhelm every rally, pushing price into new lows.',
    keyPoints: [
      'Structure: LH → LL → LH → LL… Each swing is lower than the last.',
      'The descending line along the swing highs is the trend’s backbone.',
      'Traders sell rallies into the LHs and hold until the last LH is reclaimed.',
    ],
    markers: [
      { time: downT(2), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bear, text: 'LH' },
      { time: downT(3), position: 'belowBar', shape: 'arrowDown', color: COLORS.amber, text: 'LL' },
      { time: downT(7), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bear, text: 'LH' },
      { time: downT(9), position: 'belowBar', shape: 'arrowDown', color: COLORS.amber, text: 'LL' },
      { time: downT(11), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bear, text: 'LH' },
      { time: downT(13), position: 'belowBar', shape: 'arrowDown', color: COLORS.amber, text: 'LL' },
    ],
    trendLines: [
      { from: { time: downT(2), price: 109.5 }, to: { time: downT(13), price: 100.0 }, color: COLORS.bear, dashed: true },
    ],
    legend: [
      { label: 'Lower High', color: COLORS.bear },
      { label: 'Lower Low', color: COLORS.amber },
      { label: 'Descending swing-high line', color: COLORS.bear, dashed: true },
    ],
  },

  sideway: {
    candles: SIDE,
    title: 'Sideways / Range',
    summary:
      'A Sideways market (range) has no directional bias: price oscillates between a demand zone (EQL) and a supply zone (EQH). Range traders fade the edges.',
    keyPoints: [
      'Both EQH and EQL hold — no HH/HL or LH/LL sequence develops.',
      'Range rules: buy at EQL, sell at EQH, and stay out of the middle.',
      'A break of either level signals the range may be ending (watch for BOS).',
    ],
    zones: [
      { startTime: sideT(0), endTime: sideT(18), topPrice: 104.0, bottomPrice: 103.5, color: COLORS.zoneAmber },
      { startTime: sideT(0), endTime: sideT(18), topPrice: 100.0, bottomPrice: 99.5, color: COLORS.zoneCyan },
    ],
    priceLines: [
      { price: 104.0, color: COLORS.amber, title: 'EQH', dashed: true },
      { price: 99.5, color: COLORS.cyan, title: 'EQL', dashed: true },
    ],
    markers: [
      { time: sideT(2), position: 'aboveBar', shape: 'arrowUp', color: COLORS.amber, text: 'EQH' },
      { time: sideT(4), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'EQL' },
      { time: sideT(7), position: 'aboveBar', shape: 'arrowUp', color: COLORS.amber, text: 'EQH' },
      { time: sideT(9), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'EQL' },
      { time: sideT(12), position: 'aboveBar', shape: 'arrowUp', color: COLORS.amber, text: 'EQH' },
      { time: sideT(14), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'EQL' },
    ],
    legend: [
      { label: 'EQH supply zone', color: COLORS.amber },
      { label: 'EQL demand zone', color: COLORS.cyan },
    ],
  },

  impulse: {
    candles: UP,
    title: 'Impulse',
    summary:
      'An Impulse is the strong, fast, directional leg of a trend — usually the move that makes the new HH. It is the "fuel" of the trend, powered by momentum.',
    keyPoints: [
      'Impulses are steep, close on their highs, and often expand in range.',
      'A trend is a series of impulses separated by smaller pullbacks.',
      'The impulse leg is where the big profits of the move are made.',
    ],
    markers: [
      { time: upT(14), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'Impulse start' },
      { time: upT(20), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'Impulse end' },
    ],
    trendLines: [
      { from: { time: upT(14), price: 105.0 }, to: { time: upT(20), price: 109.5 }, color: COLORS.bull },
    ],
    legend: [
      { label: 'Impulse leg', color: COLORS.bull },
      { label: 'Swing low start', color: COLORS.cyan },
    ],
  },

  pullback: {
    candles: UP,
    title: 'Pullback',
    summary:
      'A Pullback is the counter-trend retracement that follows an impulse. In an uptrend it is a temporary dip into demand — the place traders look to join the trend.',
    keyPoints: [
      'Pullbacks are shallower and slower than impulses.',
      'In an uptrend, pullbacks find buyers at the HL / demand zone.',
      'Entry setups: buy the pullback, place the stop below the pullback low.',
    ],
    markers: [
      { time: upT(20), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'Swing High' },
      { time: upT(22), position: 'belowBar', shape: 'arrowDown', color: COLORS.amber, text: 'Pullback low' },
    ],
    trendLines: [
      { from: { time: upT(20), price: 109.5 }, to: { time: upT(22), price: 106.5 }, color: COLORS.amber, dashed: true },
    ],
    legend: [
      { label: 'Pullback leg', color: COLORS.amber, dashed: true },
      { label: 'Pullback low', color: COLORS.amber },
    ],
  },

  bos: {
    candles: UP,
    title: 'Break of Structure (BOS)',
    summary:
      'A Break of Structure (BOS) occurs when price breaks beyond the last swing high (or low) with conviction, confirming trend continuation in the same direction.',
    keyPoints: [
      'BOS = continuation. The trend keeps its direction; the structure simply extends.',
      'Here price breaks above the last swing high at 110.0 with a strong close.',
      'A genuine BOS usually comes with momentum — not a marginal, wicking break.',
    ],
    markers: [
      { time: upT(24), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'Last swing high' },
      { time: upT(28), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'BOS' },
    ],
    priceLines: [{ price: 110.0, color: COLORS.cyan, title: 'BOS level', dashed: true }],
    legend: [
      { label: 'Broken swing high', color: COLORS.bull },
      { label: 'BOS level', color: COLORS.cyan, dashed: true },
    ],
  },

  choch: {
    candles: REV,
    title: 'Change of Character (CHoCH)',
    summary:
      'A Change of Character (CHoCH) is the first break of the last swing point against the prevailing trend. Here, the bullish trend loses its last Higher Low — a warning that the trend may be over.',
    keyPoints: [
      'CHoCH = first sign of reversal, not confirmation yet.',
      'The break of the last swing low (105.0) happens with a strong bearish close.',
      'After the CHoCH, watch for the market to start making LH / LL instead of HH / HL.',
    ],
    markers: [
      { time: revT(14), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'Last swing low' },
      { time: revT(18), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: 'CHoCH' },
    ],
    priceLines: [{ price: 105.0, color: COLORS.bear, title: 'Last swing low', dashed: true }],
    legend: [
      { label: 'CHoCH break candle', color: COLORS.bear },
      { label: 'Broken swing low', color: COLORS.cyan },
      { label: 'Break level', color: COLORS.bear, dashed: true },
    ],
  },

  mss: {
    candles: REV,
    title: 'Market Structure Shift (MSS)',
    summary:
      'A Market Structure Shift (MSS) is the break of internal (minor) structure after a final push into liquidity. It is the first crack in the old trend — often used interchangeably with CHoCH.',
    keyPoints: [
      'Here the final Higher High (108.2) is followed by a fast break of the internal swing low (105.0).',
      'MSS describes the internal break; CHoCH describes the same event on the higher-timeframe structure.',
      'Smart Money Concepts: MSS after liquidity grab = high-probability reversal zone.',
    ],
    markers: [
      { time: revT(16), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'Final HH' },
      { time: revT(14), position: 'belowBar', shape: 'circle', color: COLORS.cyan, text: 'Internal swing low' },
      { time: revT(18), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: 'MSS' },
    ],
    priceLines: [{ price: 105.0, color: COLORS.cyan, title: 'Internal low', dashed: true }],
    legend: [
      { label: 'MSS break candle', color: COLORS.bear },
      { label: 'Internal swing low', color: COLORS.cyan },
      { label: 'Final higher high', color: COLORS.bull },
    ],
  },

  'internal-structure': {
    candles: UP,
    title: 'Internal Structure',
    summary:
      'Internal Structure is the lower-timeframe (minor) swings that make up a larger leg. These smaller HH/HL pivots are what traders use to time entries inside the bigger move.',
    keyPoints: [
      'Internal swings are the "micro" pivots — here every minor HL and SH.',
      'Traders mark internal structure to find precise entries on pullbacks.',
      'An MSS (shift) is defined by a break of internal structure.',
    ],
    markers: [
      { time: upT(6), position: 'belowBar', shape: 'circle', color: COLORS.cyan, text: 'HL' },
      { time: upT(10), position: 'belowBar', shape: 'circle', color: COLORS.cyan, text: 'HL' },
      { time: upT(14), position: 'belowBar', shape: 'circle', color: COLORS.cyan, text: 'HL' },
      { time: upT(18), position: 'belowBar', shape: 'circle', color: COLORS.cyan, text: 'HL' },
      { time: upT(22), position: 'belowBar', shape: 'circle', color: COLORS.cyan, text: 'HL' },
      { time: upT(4), position: 'aboveBar', shape: 'square', color: COLORS.bull, text: 'SH' },
      { time: upT(12), position: 'aboveBar', shape: 'square', color: COLORS.bull, text: 'SH' },
      { time: upT(20), position: 'aboveBar', shape: 'square', color: COLORS.bull, text: 'SH' },
    ],
    legend: [
      { label: 'Minor swing low (HL)', color: COLORS.cyan },
      { label: 'Minor swing high (SH)', color: COLORS.bull },
    ],
  },

  'external-structure': {
    candles: UP,
    title: 'External Structure',
    summary:
      'External Structure is the higher-timeframe (macro) swings that define the overall trend. It ignores minor noise and shows the big-picture direction of the market.',
    keyPoints: [
      'External swings are the "macro" pivots — the majors that define the trend.',
      'Zoom out: the trend is up as long as external HH/HL sequence holds.',
      'External structure is what CHoCH refers to when the last major swing breaks.',
    ],
    markers: [
      { time: upT(16), position: 'aboveBar', shape: 'arrowUp', color: COLORS.violet, text: 'SH' },
      { time: upT(20), position: 'aboveBar', shape: 'arrowUp', color: COLORS.violet, text: 'SH' },
      { time: upT(24), position: 'aboveBar', shape: 'arrowUp', color: COLORS.violet, text: 'SH' },
      { time: upT(14), position: 'belowBar', shape: 'arrowDown', color: COLORS.violet, text: 'HL' },
      { time: upT(18), position: 'belowBar', shape: 'arrowDown', color: COLORS.violet, text: 'HL' },
      { time: upT(22), position: 'belowBar', shape: 'arrowDown', color: COLORS.violet, text: 'HL' },
    ],
    trendLines: [
      { from: { time: upT(16), price: 108.5 }, to: { time: upT(24), price: 110.0 }, color: COLORS.violet, dashed: true },
    ],
    legend: [
      { label: 'Macro swing high', color: COLORS.violet },
      { label: 'Macro swing low', color: COLORS.violet },
      { label: 'Macro trend line', color: COLORS.violet, dashed: true },
    ],
  },

  /* ============================ SMC & ICT ================================= */

  'order-block': {
    candles: SMC,
    title: 'Order Block (OB)',
    summary:
      'An Order Block is the last opposite-color candle before an impulsive move. In SMC, institutions leave resting orders there — the zone acts as future support (bullish OB) or resistance (bearish OB).',
    keyPoints: [
      'The bullish OB is the last down candle before the rally began.',
      'Treat the whole candle range as the zone — not just the body.',
      'Price often returns to the OB before continuing; it is a draw on liquidity.',
    ],
    zones: [
      { startTime: smcT(9), endTime: smcT(11), topPrice: 102.0, bottomPrice: 100.2, color: COLORS.zoneBull },
    ],
    priceLines: [{ price: 102.0, color: COLORS.bull, title: 'OB top', dashed: true }],
    markers: [
      { time: smcT(9), position: 'belowBar', shape: 'square', color: COLORS.bull, text: 'Bullish OB' },
      { time: smcT(10), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'Impulse' },
    ],
    legend: [
      { label: 'Order Block zone', color: COLORS.bull },
      { label: 'OB top', color: COLORS.bull, dashed: true },
    ],
  },

  fvg: {
    candles: SMC,
    title: 'Fair Value Gap (FVG) / Imbalance',
    summary:
      'A Fair Value Gap is the imbalance left when a 3-candle impulse leaves a price void: the first candle’s high is below the third candle’s low (bullish FVG). Price tends to revisit it.',
    keyPoints: [
      'FVG = space between candle 1 high and candle 3 low of an impulse.',
      'The gap represents unfilled orders — price usually returns to it.',
      'Partial fills are normal; a full close through it invalidates the zone.',
    ],
    zones: [
      { startTime: smcT(10), endTime: smcT(14), topPrice: 105.8, bottomPrice: 103.9, color: COLORS.zoneCyan },
    ],
    priceLines: [
      { price: 105.8, color: COLORS.cyan, title: 'FVG top', dashed: true },
      { price: 103.9, color: COLORS.cyan, title: 'FVG bottom', dashed: true },
    ],
    markers: [
      { time: smcT(12), position: 'aboveBar', shape: 'arrowUp', color: COLORS.cyan, text: 'FVG' },
      { time: smcT(14), position: 'belowBar', shape: 'arrowDown', color: COLORS.bull, text: 'Revisit' },
    ],
    legend: [
      { label: 'Fair Value Gap', color: COLORS.cyan },
      { label: 'FVG bounds', color: COLORS.cyan, dashed: true },
    ],
  },

  'liquidity-sweep': {
    candles: SWEEP,
    title: 'Liquidity Sweep',
    summary:
      'A Liquidity Sweep is a wick that takes out resting stops beyond a swing point before reversing. Institutions hunt the clustered stops, then trade the other direction.',
    keyPoints: [
      'Stops sit below swing lows — the "sell-side liquidity".',
      'The sweep (103.2) pierces the last swing low (105.0) but closes back inside.',
      'A sweep + rejection is a classic reversal trigger (and often precedes BOS).',
    ],
    zones: [
      { startTime: swpT(14), endTime: swpT(16), topPrice: 105.0, bottomPrice: 103.0, color: COLORS.zoneBear },
    ],
    priceLines: [{ price: 105.0, color: COLORS.cyan, title: 'Swept low', dashed: true }],
    markers: [
      { time: swpT(14), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'Swing low' },
      { time: swpT(16), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: 'Sweep' },
      { time: swpT(17), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'Rejection' },
    ],
    legend: [
      { label: 'Sweep candle', color: COLORS.bear },
      { label: 'Sell-side liquidity zone', color: COLORS.bear },
      { label: 'Swept level', color: COLORS.cyan, dashed: true },
    ],
  },

  inducement: {
    candles: IDM,
    title: 'Inducement (IDM)',
    summary:
      'An Inducement is a minor swing high or low engineered to lure traders into premature entries. Price breaks it slightly, trapping them, then reverses into the real move.',
    keyPoints: [
      'The minor high at 105.8 looks like resistance — retail shorts pile in.',
      'Price breaks the minor low (102.8) to stop out longs, then reverses.',
      'The "real" move is the opposite direction after the trap is sprung.',
    ],
    priceLines: [
      { price: 105.8, color: COLORS.amber, title: 'IDM high', dashed: true },
      { price: 102.8, color: COLORS.bear, title: 'Minor low (bait)', dashed: true },
    ],
    markers: [
      { time: idmT(8), position: 'aboveBar', shape: 'arrowUp', color: COLORS.amber, text: 'IDM level' },
      { time: idmT(11), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: 'Fakeout' },
      { time: idmT(13), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'IDM broken' },
    ],
    legend: [
      { label: 'Inducement level', color: COLORS.amber },
      { label: 'Bait / fakeout', color: COLORS.bear },
      { label: 'Break of IDM', color: COLORS.bull },
    ],
  },

  'kill-zones': {
    candles: KZ,
    timeVisible: true,
    title: 'Kill Zones',
    summary:
      'Kill Zones are the sessions where most institutional volume executes — London (08:00–12:00 UTC) and New York (13:00–17:00 UTC). Liquidity is engineered and price moves hardest there.',
    keyPoints: [
      'London open often sets the day’s direction; NY open continues or reverses it.',
      'Ranges compress overnight, then expand as the sessions open.',
      'Traders time entries to these windows instead of low-liquidity hours.',
    ],
    zones: [
      { startTime: utcHour(8), endTime: utcHour(12), color: 'rgba(251, 191, 36, 0.09)' },
      { startTime: utcHour(13), endTime: utcHour(17), color: 'rgba(34, 211, 238, 0.09)' },
    ],
    markers: [
      { time: utcHour(8), position: 'aboveBar', shape: 'arrowUp', color: COLORS.amber, text: 'London Open' },
      { time: utcHour(13), position: 'aboveBar', shape: 'arrowUp', color: COLORS.cyan, text: 'NY Open' },
    ],
    legend: [
      { label: 'London Kill Zone (08–12 UTC)', color: COLORS.amber },
      { label: 'New York Kill Zone (13–17 UTC)', color: COLORS.cyan },
    ],
  },

  /* ============================== Wyckoff Logic =========================== */

  accumulation: {
    candles: WACC,
    showVolume: true,
    title: 'Accumulation',
    summary:
      'Accumulation is the Wyckoff phase where smart money buys while the public sells into a range. Volume tells the story: climax selling, then shrinking supply, then a breakout.',
    keyPoints: [
      'Phase A: PS (preliminary support) → SC (selling climax) → AR (automatic rally).',
      'Phase B: ST (secondary test) holds above the SC low on lower volume — supply is drying up.',
      'Phase C: the Spring shakes out weak hands; Phase D/E: SOS → markup.',
    ],
    zones: [
      { startTime: waccT(7), endTime: waccT(17), topPrice: 106.0, bottomPrice: 102.6, color: COLORS.zoneAmber },
    ],
    markers: [
      { time: waccT(4), position: 'belowBar', shape: 'circle', color: COLORS.cyan, text: 'PS' },
      { time: waccT(5), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: 'SC' },
      { time: waccT(6), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'AR' },
      { time: waccT(7), position: 'belowBar', shape: 'circle', color: COLORS.cyan, text: 'ST' },
      { time: waccT(15), position: 'belowBar', shape: 'arrowDown', color: COLORS.amber, text: 'Spring' },
      { time: waccT(17), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'SOS' },
    ],
    legend: [
      { label: 'Selling climax (SC)', color: COLORS.bear },
      { label: 'Automatic rally (AR)', color: COLORS.bull },
      { label: 'Secondary test (ST)', color: COLORS.cyan },
      { label: 'Spring', color: COLORS.amber },
      { label: 'Accumulation range', color: COLORS.amber },
    ],
  },

  spring: {
    candles: WACC,
    showVolume: true,
    title: 'Spring',
    summary:
      'The Spring is the shakeout that ends accumulation: price briefly breaks below the range low to trigger stops, then reverses violently — often on rising volume. The bear trap before the markup.',
    keyPoints: [
      'The spring violates the range low (102.6) but closes back inside.',
      'Rising volume on the spring shows absorption — big buyers stepped in.',
      'The spring low is the invalidation; the break back inside is the trigger.',
    ],
    zones: [
      { startTime: waccT(13), endTime: waccT(16), topPrice: 103.2, bottomPrice: 101.6, color: COLORS.zoneAmber },
    ],
    priceLines: [{ price: 102.6, color: COLORS.amber, title: 'Range low', dashed: true }],
    markers: [
      { time: waccT(15), position: 'belowBar', shape: 'arrowDown', color: COLORS.amber, text: 'Spring' },
      { time: waccT(16), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'Reversal' },
    ],
    legend: [
      { label: 'Spring candle', color: COLORS.amber },
      { label: 'Range low', color: COLORS.amber, dashed: true },
    ],
  },

  markup: {
    candles: WACC,
    showVolume: true,
    title: 'Markup',
    summary:
      'Markup is the Wyckoff advance that follows accumulation. After the SOS (sign of strength) breaks the range, price trends up in the third phase of the cycle.',
    keyPoints: [
      'The SOS breaking the range high confirms the markup has begun.',
      'Markup pulls back to LPS (last point of support) — the best entry.',
      'Volume stays healthy: expanding on up legs, drying on pullbacks.',
    ],
    markers: [
      { time: waccT(17), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'SOS' },
      { time: waccT(18), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'LPS' },
      { time: waccT(24), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'Markup high' },
    ],
    trendLines: [
      { from: { time: waccT(18), price: 104.6 }, to: { time: waccT(24), price: 112.2 }, color: COLORS.bull, dashed: true },
    ],
    legend: [
      { label: 'Markup leg', color: COLORS.bull, dashed: true },
      { label: 'SOS breakout', color: COLORS.bull },
      { label: 'LPS pullback', color: COLORS.cyan },
    ],
  },

  distribution: {
    candles: WDIST,
    showVolume: true,
    title: 'Distribution',
    summary:
      'Distribution is the Wyckoff topping phase: smart money sells into public buying. The mirror image of accumulation — climax buying, then a widening range, then markdown.',
    keyPoints: [
      'Phase A: BC (buying climax) → AR (automatic reaction) → ST (secondary test).',
      'Phase B: rallies fail around the same highs; volume thins.',
      'Phase C/E: the UTAD traps late buyers, then markdown begins.',
    ],
    zones: [
      { startTime: wdistT(6), endTime: wdistT(15), topPrice: 114.4, bottomPrice: 111.2, color: COLORS.zoneBear },
    ],
    markers: [
      { time: wdistT(4), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'BC' },
      { time: wdistT(5), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: 'AR' },
      { time: wdistT(6), position: 'aboveBar', shape: 'circle', color: COLORS.cyan, text: 'ST' },
      { time: wdistT(14), position: 'aboveBar', shape: 'arrowUp', color: COLORS.amber, text: 'UTAD' },
      { time: wdistT(16), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: 'Markdown' },
    ],
    legend: [
      { label: 'Buying climax (BC)', color: COLORS.bull },
      { label: 'Automatic reaction (AR)', color: COLORS.bear },
      { label: 'UTAD trap', color: COLORS.amber },
      { label: 'Distribution range', color: COLORS.bear },
    ],
  },

  utad: {
    candles: WDIST,
    showVolume: true,
    title: 'UTAD (Upthrust After Distribution)',
    summary:
      'UTAD is the final upthrust of a distribution phase: price spikes above the range to trigger buy stops, then collapses. It is the bull trap that confirms the top.',
    keyPoints: [
      'The spike (115.6) breaks above the range high (114.4) on strong volume.',
      'The immediate failure — close back inside — reveals the trap.',
      'UTAD is the opposite of the Spring: a bull trap instead of a bear trap.',
    ],
    zones: [
      { startTime: wdistT(14), endTime: wdistT(15), topPrice: 115.6, bottomPrice: 114.4, color: COLORS.zoneBear },
    ],
    priceLines: [{ price: 114.4, color: COLORS.bear, title: 'Range high', dashed: true }],
    markers: [
      { time: wdistT(14), position: 'aboveBar', shape: 'arrowUp', color: COLORS.amber, text: 'UTAD' },
      { time: wdistT(15), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: 'Failure' },
    ],
    legend: [
      { label: 'UTAD spike', color: COLORS.amber },
      { label: 'Range high', color: COLORS.bear, dashed: true },
    ],
  },

  /* ============================ Advanced PA =============================== */

  doji: {
    candles: DOJI,
    title: 'Doji',
    summary:
      'A Doji forms when open and close are nearly identical — the market opened and closed at the same place. It signals indecision and often appears at trend turning points.',
    keyPoints: [
      'Dojis have tiny bodies and long wicks — neither side won.',
      'At the top of an uptrend, a doji warns of exhaustion (bulls can’t push on).',
      'At the bottom of a downtrend, a doji shows sellers losing control.',
    ],
    markers: [
      { time: dojiT(8), position: 'aboveBar', shape: 'arrowDown', color: COLORS.amber, text: 'Doji — indecision' },
      { time: dojiT(18), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: 'Doji — exhaustion' },
    ],
    legend: [
      { label: 'Doji at the top', color: COLORS.amber },
      { label: 'Doji at the bottom', color: COLORS.bull },
    ],
  },

  engulfing: {
    candles: ENG,
    title: 'Engulfing Pattern',
    summary:
      'An Engulfing pattern is a candle whose body completely engulfs the previous candle’s body. Bullish engulfing at support and bearish engulfing at resistance are strong reversal signals.',
    keyPoints: [
      'The bearish engulfing swallows the prior up-candle — sellers take over.',
      'The bullish engulfing swallows the prior down-candle — buyers take over.',
      'Strength increases when engulfing happens at key zones with volume.',
    ],
    zones: [
      { startTime: engT(8), endTime: engT(9), topPrice: 110.0, bottomPrice: 107.6, color: COLORS.zoneBear },
      { startTime: engT(16), endTime: engT(17), topPrice: 100.2, bottomPrice: 97.4, color: COLORS.zoneBull },
    ],
    markers: [
      { time: engT(9), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: 'Bearish Engulfing' },
      { time: engT(17), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: 'Bullish Engulfing' },
    ],
    legend: [
      { label: 'Bearish engulfing', color: COLORS.bear },
      { label: 'Bullish engulfing', color: COLORS.bull },
    ],
  },

  hammer: {
    candles: HAMMER,
    title: { en: 'Hammer', th: 'Hammer (ค้อน)' },
    summary: {
      en: 'A bullish reversal candle that appears at the bottom of a downtrend: a small body at the top with a long lower wick, showing sellers were rejected and buyers took over.',
      th: 'แท่งเทียนกลับตัวขาขึ้นที่เกิดที่ก้นของเทรนด์ขาลง: ตัวแท่งเล็กอยู่ด้านบน มีไส้ล่างยาว แสดงว่าผู้ขายถูกปฏิเสธและผู้ซื้อเข้ามาแทน',
    },
    keyPoints: [
      { en: 'The lower wick is at least twice the body — rejection of sellers.', th: 'ไส้ล่างยาวอย่างน้อย 2 เท่าของตัวแท่ง — การปฏิเสธผู้ขาย' },
      { en: 'The body sits at the top of the range.', th: 'ตัวแท่งอยู่ด้านบนของช่วงราคา' },
      { en: 'Confirmation is a bullish close on the next candle.', th: 'การยืนยันคือแท่งถัดไปปิดเขียว' },
    ],
    zones: [{ startTime: hamT(3), endTime: hamT(4), topPrice: 104.5, bottomPrice: 98, color: COLORS.zoneBull }],
    markers: [
      { time: hamT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Hammer', th: 'ค้อน' } },
      { time: hamT(5), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Confirmation', th: 'การยืนยัน' } },
    ],
  },

  'shooting-star': {
    candles: SHOOTING_STAR,
    title: { en: 'Shooting Star', th: 'Shooting Star (ดาวตก)' },
    summary: {
      en: 'A bearish reversal candle at the top of an uptrend: a small body at the bottom with a long upper wick, showing buyers were rejected and sellers took over.',
      th: 'แท่งเทียนกลับตัวขาลงที่ยอดของเทรนด์ขาขึ้น: ตัวแท่งเล็กอยู่ด้านล่าง มีไส้บนยาว แสดงว่าผู้ซื้อถูกปฏิเสธและผู้ขายเข้ามาแทน',
    },
    keyPoints: [
      { en: 'The upper wick is at least twice the body — rejection of buyers.', th: 'ไส้บนยาวอย่างน้อย 2 เท่าของตัวแท่ง — การปฏิเสธผู้ซื้อ' },
      { en: 'The body sits at the bottom of the range.', th: 'ตัวแท่งอยู่ด้านล่างของช่วงราคา' },
      { en: 'Confirmation is a bearish close on the next candle.', th: 'การยืนยันคือแท่งถัดไปปิดแดง' },
    ],
    zones: [{ startTime: sstarT(3), endTime: sstarT(4), topPrice: 114, bottomPrice: 107.5, color: COLORS.zoneBear }],
    markers: [
      { time: sstarT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Shooting Star', th: 'ดาวตก' } },
      { time: sstarT(5), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Confirmation', th: 'การยืนยัน' } },
    ],
  },

  'morning-star': {
    candles: MORNING_STAR,
    title: { en: 'Morning Star', th: 'Morning Star (ดาวรุ่ง)' },
    summary: {
      en: 'A bullish three-candle reversal at a downtrend bottom: a long bearish candle, a small indecisive body (the star), and a long bullish candle that recovers the losses.',
      th: 'รูปแบบกลับตัวขาขึ้น 3 แท่งที่ก้นของเทรนด์ขาลง: แท่งแดงยาว, แท่งเล็กที่ลังเล (ดาว), และแท่งเขียวยาวที่กู้คืนการขาดทุน',
    },
    keyPoints: [
      { en: 'Candle 1 is long and bearish — momentum down.', th: 'แท่งที่ 1 ยาวและแดง — โมเมนตัมลง' },
      { en: 'Candle 2 gaps down into a small body — indecision.', th: 'แท่งที่ 2 เป็นแท่งเล็ก — ความลังเล' },
      { en: 'Candle 3 is long and bullish, closing above the middle.', th: 'แท่งที่ 3 ยาวและเขียว ปิดเหนือกึ่งกลาง' },
    ],
    markers: [
      { time: mstarT(3), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: { en: '① Bearish', th: '① ขาลง' } },
      { time: mstarT(4), position: 'belowBar', shape: 'circle', color: COLORS.amber, text: { en: '② Star', th: '② ดาว' } },
      { time: mstarT(5), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: '③ Bullish', th: '③ ขาขึ้น' } },
    ],
  },

  'evening-star': {
    candles: EVENING_STAR,
    title: { en: 'Evening Star', th: 'Evening Star (ดาวดับ)' },
    summary: {
      en: 'A bearish three-candle reversal at an uptrend top: a long bullish candle, a small indecisive body (the star), and a long bearish candle that gives back the gains.',
      th: 'รูปแบบกลับตัวขาลง 3 แท่งที่ยอดของเทรนด์ขาขึ้น: แท่งเขียวยาว, แท่งเล็กที่ลังเล (ดาว), และแท่งแดงยาวที่คืนกำไรทั้งหมด',
    },
    keyPoints: [
      { en: 'Candle 1 is long and bullish — momentum up.', th: 'แท่งที่ 1 ยาวและเขียว — โมเมนตัมขึ้น' },
      { en: 'Candle 2 gaps up into a small body — indecision.', th: 'แท่งที่ 2 เป็นแท่งเล็ก — ความลังเล' },
      { en: 'Candle 3 is long and bearish, closing below the middle.', th: 'แท่งที่ 3 ยาวและแดง ปิดใต้กึ่งกลาง' },
    ],
    markers: [
      { time: estarT(3), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: { en: '① Bullish', th: '① ขาขึ้น' } },
      { time: estarT(4), position: 'aboveBar', shape: 'circle', color: COLORS.amber, text: { en: '② Star', th: '② ดาว' } },
      { time: estarT(5), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: '③ Bearish', th: '③ ขาลง' } },
    ],
  },

  harami: {
    candles: HARAMI,
    title: { en: 'Harami', th: 'Harami (ฮารามิ)' },
    summary: {
      en: 'A two-candle reversal hint: a large "mother" candle followed by a small "baby" candle entirely inside its body. It signals the prior momentum is losing steam.',
      th: 'สัญญาณกลับตัว 2 แท่ง: แท่ง "แม่" ใหญ่ตามด้วยแท่ง "ลูก" เล็กที่อยู่ภายในตัวแท่งทั้งหมด บ่งชี้ว่าโมเมนตัมเดิมกำลังหมดแรง',
    },
    keyPoints: [
      { en: 'The baby candle sits fully inside the mother’s body.', th: 'แท่งลูกอยู่ภายในตัวแท่งแม่ทั้งหมด' },
      { en: 'The smaller range shows hesitation after a strong move.', th: 'ช่วงราคาที่เล็กลงแสดงความลังเลหลังการเคลื่อนไหวแรง' },
      { en: 'More reliable at support/resistance with confirmation.', th: 'เชื่อถือได้มากขึ้นที่แนวรับ/แนวต้านพร้อมการยืนยัน' },
    ],
    markers: [
      { time: harT(3), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Mother', th: 'แท่งแม่' } },
      { time: harT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Baby', th: 'แท่งลูก' } },
    ],
  },

  'three-soldiers': {
    candles: THREE_SOLDIERS,
    title: { en: 'Three White Soldiers', th: 'Three White Soldiers (ทหารสามนาย)' },
    summary: {
      en: 'A bullish continuation pattern: three consecutive strong bullish candles that open within the prior body and close near their highs, confirming buyers are in control.',
      th: 'รูปแบบไปต่อขาขึ้น: แท่งเขียวแข็งแรง 3 แท่งติดต่อกัน เปิดภายในตัวแท่งก่อนหน้าและปิดใกล้จุดสูง ยืนยันว่าผู้ซื้อควบคุมตลาด',
    },
    keyPoints: [
      { en: 'Each candle opens inside the previous body.', th: 'แต่ละแท่งเปิดภายในตัวแท่งก่อนหน้า' },
      { en: 'Each closes near its high — strong buying.', th: 'แต่ละแท่งปิดใกล้จุดสูง — การซื้อที่แข็งแรง' },
      { en: 'Shrinking bodies toward the end warn of exhaustion.', th: 'ตัวแท่งที่เล็กลงท้าย ๆ เตือนถึงความอ่อนล้า' },
    ],
    markers: [
      { time: soldiersT(4), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Soldier 1', th: 'นายที่ 1' } },
      { time: soldiersT(5), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Soldier 2', th: 'นายที่ 2' } },
      { time: soldiersT(6), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Soldier 3', th: 'นายที่ 3' } },
    ],
  },

  'three-crows': {
    candles: THREE_CROWS,
    title: { en: 'Three Black Crows', th: 'Three Black Crows (อีกาสามตัว)' },
    summary: {
      en: 'A bearish continuation pattern: three consecutive strong bearish candles that open within the prior body and close near their lows, confirming sellers are in control.',
      th: 'รูปแบบไปต่อขาลง: แท่งแดงแข็งแรง 3 แท่งติดต่อกัน เปิดภายในตัวแท่งก่อนหน้าและปิดใกล้จุดต่ำ ยืนยันว่าผู้ขายควบคุมตลาด',
    },
    keyPoints: [
      { en: 'Each candle opens inside the previous body.', th: 'แต่ละแท่งเปิดภายในตัวแท่งก่อนหน้า' },
      { en: 'Each closes near its low — strong selling.', th: 'แต่ละแท่งปิดใกล้จุดต่ำ — การขายที่แข็งแรง' },
      { en: 'Often follows a rally top and confirms the reversal.', th: 'มักเกิดหลังยอดขาขึ้นและยืนยันการกลับตัว' },
    ],
    markers: [
      { time: crowsT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Crow 1', th: 'ตัวที่ 1' } },
      { time: crowsT(5), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Crow 2', th: 'ตัวที่ 2' } },
      { time: crowsT(6), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Crow 3', th: 'ตัวที่ 3' } },
    ],
  },

  'g-artley': {
    candles: HARM,
    title: { en: 'Gartley (222)', th: 'Gartley (222)' },
    summary: {
      en: 'The classic bullish harmonic: X-A-B-C-D where B retraces 0.618 of XA, and D completes near the 0.786 retracement — the Potential Reversal Zone to buy.',
      th: 'ฮาร์โมนิกขาขึ้นคลาสสิก: X-A-B-C-D โดย B ย่อ 0.618 ของ XA และ D จบใกล้ระดับ 0.786 — โซนกลับตัวที่อาจเกิดขึ้นสำหรับการซื้อ',
    },
    keyPoints: [
      { en: 'AB = 0.618 of XA — the first retracement.', th: 'AB = 0.618 ของ XA — การย่อครั้งแรก' },
      { en: 'BC retraces 0.382–0.886 of AB.', th: 'BC ย่อ 0.382–0.886 ของ AB' },
      { en: 'D lands at 0.786 of XA — the buy zone.', th: 'D จบที่ 0.786 ของ XA — โซนซื้อ' },
    ],
    zones: [{ startTime: harmT(8), endTime: harmT(10), topPrice: 103.5, bottomPrice: 102.0, color: COLORS.zoneBull }],
    trendLines: [
      { from: { time: harmT(0), price: 99.4 }, to: { time: harmT(3), price: 112.2 }, color: COLORS.violet },
      { from: { time: harmT(3), price: 112.2 }, to: { time: harmT(5), price: 106.6 }, color: COLORS.violet },
      { from: { time: harmT(5), price: 106.6 }, to: { time: harmT(7), price: 110.6 }, color: COLORS.violet },
      { from: { time: harmT(7), price: 110.6 }, to: { time: harmT(9), price: 102.4 }, color: COLORS.violet },
    ],
    markers: [
      { time: harmT(0), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'X' },
      { time: harmT(3), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'A' },
      { time: harmT(5), position: 'belowBar', shape: 'square', color: COLORS.violet, text: 'B' },
      { time: harmT(7), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'C' },
      { time: harmT(9), position: 'belowBar', shape: 'square', color: COLORS.amber, text: 'D' },
    ],
  },

  butterfly: {
    candles: BUTTERFLY,
    title: { en: 'Butterfly', th: 'Butterfly (ผีเสื้อ)' },
    summary: {
      en: 'A bullish harmonic where D extends beyond X to 1.27 of XA — a deep, high-probability reversal zone for buyers at the extreme.',
      th: 'ฮาร์โมนิกขาขึ้นที่ D ยื่นเลย X ไปถึง 1.27 ของ XA — โซนกลับตัวที่ลึกและความน่าจะเป็นสูงสำหรับผู้ซื้อที่จุดสุดขั้ว',
    },
    keyPoints: [
      { en: 'B retraces 0.786 of XA — deeper than the Gartley.', th: 'B ย่อ 0.786 ของ XA — ลึกกว่า Gartley' },
      { en: 'D completes at 1.27 of XA, beyond point X.', th: 'D จบที่ 1.27 ของ XA เลยจุด X ไป' },
      { en: 'The extension creates an extreme price zone to buy.', th: 'การยื่นเกินสร้างโซนราคาที่สุดขั้วสำหรับการซื้อ' },
    ],
    zones: [{ startTime: bflyT(9), endTime: bflyT(10), topPrice: 94, bottomPrice: 88, color: COLORS.zoneBull }],
    trendLines: [
      { from: { time: bflyT(0), price: 99.4 }, to: { time: bflyT(3), price: 108 }, color: COLORS.violet },
      { from: { time: bflyT(3), price: 108 }, to: { time: bflyT(5), price: 103 }, color: COLORS.violet },
      { from: { time: bflyT(5), price: 103 }, to: { time: bflyT(7), price: 106.8 }, color: COLORS.violet },
      { from: { time: bflyT(7), price: 106.8 }, to: { time: bflyT(10), price: 92 }, color: COLORS.violet },
    ],
    markers: [
      { time: bflyT(0), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'X' },
      { time: bflyT(3), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'A' },
      { time: bflyT(5), position: 'belowBar', shape: 'square', color: COLORS.violet, text: 'B' },
      { time: bflyT(7), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'C' },
      { time: bflyT(10), position: 'belowBar', shape: 'square', color: COLORS.amber, text: 'D' },
    ],
  },

  crab: {
    candles: CRAB,
    title: { en: 'Crab', th: 'Crab (ปู)' },
    summary: {
      en: 'A bullish harmonic where D extends to 1.618 of XA — the deepest extension pattern, marking an extreme price zone where reversals are often sharp.',
      th: 'ฮาร์โมนิกขาขึ้นที่ D ยื่นถึง 1.618 ของ XA — รูปแบบการยื่นที่ลึกที่สุด ทำเครื่องหมายโซนราคาที่สุดขั้วซึ่งมักเกิดการกลับตัวอย่างรุนแรง',
    },
    keyPoints: [
      { en: 'D completes at 1.618 of XA — beyond the Butterfly.', th: 'D จบที่ 1.618 ของ XA — ลึกกว่า Butterfly' },
      { en: 'The 1.618 extension is the defining Crab ratio.', th: 'การยื่น 1.618 คืออัตราส่วนเฉพาะของ Crab' },
      { en: 'Reversals from the PRZ tend to be fast and sharp.', th: 'การกลับตัวจาก PRZ มักเร็วและรุนแรง' },
    ],
    zones: [{ startTime: crabT(9), endTime: crabT(10), topPrice: 90, bottomPrice: 84, color: COLORS.zoneBull }],
    trendLines: [
      { from: { time: crabT(0), price: 99.4 }, to: { time: crabT(3), price: 108 }, color: COLORS.violet },
      { from: { time: crabT(3), price: 108 }, to: { time: crabT(5), price: 103 }, color: COLORS.violet },
      { from: { time: crabT(5), price: 103 }, to: { time: crabT(7), price: 106.8 }, color: COLORS.violet },
      { from: { time: crabT(7), price: 106.8 }, to: { time: crabT(10), price: 88 }, color: COLORS.violet },
    ],
    markers: [
      { time: crabT(0), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'X' },
      { time: crabT(3), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'A' },
      { time: crabT(5), position: 'belowBar', shape: 'square', color: COLORS.violet, text: 'B' },
      { time: crabT(7), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'C' },
      { time: crabT(10), position: 'belowBar', shape: 'square', color: COLORS.amber, text: 'D' },
    ],
  },

  cypher: {
    candles: CYPHER,
    title: { en: 'Cypher', th: 'Cypher (ไซเฟอร์)' },
    summary: {
      en: 'A bullish harmonic where B retraces 0.382–0.618 of XA, C extends past A to 1.13–1.414 of XA, and D completes at the 0.786 retracement of XC — a deep entry zone.',
      th: 'ฮาร์โมนิกขาขึ้นที่ B ย่อ 0.382–0.618 ของ XA, C ยื่นเลย A ไปที่ 1.13–1.414 ของ XA และ D จบที่ระดับ 0.786 ของ XC — โซนเข้าที่ลึก',
    },
    keyPoints: [
      { en: 'C extends beyond A — the defining Cypher leg.', th: 'C ยื่นเลย A ไป — ขาที่กำหนดรูปแบบ Cypher' },
      { en: 'D completes at 0.786 of the X-C range.', th: 'D จบที่ 0.786 ของช่วง X-C' },
      { en: 'The PRZ sits deep, giving a wide target to the upside.', th: 'PRZ อยู่ลึก ให้เป้าหมายขาขึ้นที่กว้าง' },
    ],
    zones: [{ startTime: cypherT(9), endTime: cypherT(10), topPrice: 103, bottomPrice: 100, color: COLORS.zoneBull }],
    trendLines: [
      { from: { time: cypherT(0), price: 99.4 }, to: { time: cypherT(3), price: 106 }, color: COLORS.violet },
      { from: { time: cypherT(3), price: 106 }, to: { time: cypherT(5), price: 103.2 }, color: COLORS.violet },
      { from: { time: cypherT(5), price: 103.2 }, to: { time: cypherT(7), price: 109 }, color: COLORS.violet },
      { from: { time: cypherT(7), price: 109 }, to: { time: cypherT(10), price: 101.5 }, color: COLORS.violet },
    ],
    markers: [
      { time: cypherT(0), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'X' },
      { time: cypherT(3), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'A' },
      { time: cypherT(5), position: 'belowBar', shape: 'square', color: COLORS.violet, text: 'B' },
      { time: cypherT(7), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'C' },
      { time: cypherT(10), position: 'belowBar', shape: 'square', color: COLORS.amber, text: 'D' },
    ],
  },

  shark: {
    candles: SHARK,
    title: { en: 'Shark', th: 'Shark (ฉลาม)' },
    summary: {
      en: 'A bearish harmonic where B extends beyond A to 1.13–1.618 of XA, C pulls back, and D completes at 1.13 of XC — an extreme high-probability short zone.',
      th: 'ฮาร์โมนิกขาลงที่ B ยื่นเลย A ไปที่ 1.13–1.618 ของ XA, C ย่อกลับ และ D จบที่ 1.13 ของ XC — โซนชอร์ตความน่าจะเป็นสูงที่จุดสุดขั้ว',
    },
    keyPoints: [
      { en: 'B extends beyond A — momentum overshoot.', th: 'B ยื่นเลย A — โมเมนตัมที่ยิงเกิน' },
      { en: 'D completes at the 1.13 extension of XC.', th: 'D จบที่การยื่น 1.13 ของ XC' },
      { en: 'The extension marks an extreme zone to short.', th: 'การยื่นเกินทำเครื่องหมายโซนสุดขั้วสำหรับการชอร์ต' },
    ],
    zones: [{ startTime: sharkT(9), endTime: sharkT(10), topPrice: 108.5, bottomPrice: 106, color: COLORS.zoneBear }],
    trendLines: [
      { from: { time: sharkT(0), price: 99.4 }, to: { time: sharkT(3), price: 104 }, color: COLORS.violet },
      { from: { time: sharkT(3), price: 104 }, to: { time: sharkT(5), price: 107 }, color: COLORS.violet },
      { from: { time: sharkT(5), price: 107 }, to: { time: sharkT(7), price: 102 }, color: COLORS.violet },
      { from: { time: sharkT(7), price: 102 }, to: { time: sharkT(10), price: 108.5 }, color: COLORS.violet },
    ],
    markers: [
      { time: sharkT(0), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'X' },
      { time: sharkT(3), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'A' },
      { time: sharkT(5), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'B' },
      { time: sharkT(7), position: 'belowBar', shape: 'square', color: COLORS.violet, text: 'C' },
      { time: sharkT(10), position: 'aboveBar', shape: 'square', color: COLORS.amber, text: 'D' },
    ],
  },

  abcd: {
    candles: ABCD,
    title: { en: 'AB=CD', th: 'AB=CD' },
    summary: {
      en: 'The simplest harmonic: an impulsive leg X-A, a retracement A-B, a smaller retracement B-C, then a final leg C-D that matches A-B in length (the 1:1). D is the reversal entry.',
      th: 'ฮาร์โมนิกที่ง่ายที่สุด: ขาพุ่ง X-A, การย่อ A-B, การย่อเล็กกว่า B-C, แล้วขาสุดท้าย C-D ที่ยาวเท่ากับ A-B (1:1) — จุด D คือจุดเข้าเทรด',
    },
    keyPoints: [
      { en: 'CD mirrors AB in length — the 1:1 balance.', th: 'CD ยาวเท่ากับ AB — ความสมดุล 1:1' },
      { en: 'BC retraces AB before the final leg.', th: 'BC ย่อ AB ก่อนขาสุดท้าย' },
      { en: 'D completes the pattern — trade the reversal.', th: 'D ทำให้รูปแบบสมบูรณ์ — เทรดการกลับตัว' },
    ],
    zones: [{ startTime: abcdT(9), endTime: abcdT(10), topPrice: 99.5, bottomPrice: 97.5, color: COLORS.zoneBull }],
    trendLines: [
      { from: { time: abcdT(0), price: 99.4 }, to: { time: abcdT(3), price: 106 }, color: COLORS.violet },
      { from: { time: abcdT(3), price: 106 }, to: { time: abcdT(5), price: 102 }, color: COLORS.violet },
      { from: { time: abcdT(5), price: 102 }, to: { time: abcdT(7), price: 105.2 }, color: COLORS.violet },
      { from: { time: abcdT(7), price: 105.2 }, to: { time: abcdT(10), price: 98 }, color: COLORS.violet },
    ],
    markers: [
      { time: abcdT(0), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'X' },
      { time: abcdT(3), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'A' },
      { time: abcdT(5), position: 'belowBar', shape: 'square', color: COLORS.violet, text: 'B' },
      { time: abcdT(7), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'C' },
      { time: abcdT(10), position: 'belowBar', shape: 'square', color: COLORS.amber, text: 'D' },
    ],
  },

  qml: {
    candles: QML,
    title: 'Quasimodo (QML)',
    summary:
      'The Quasimodo is a 1-2-3 reversal structure: a higher high (1), a break of the previous swing low — the neckline (2) — and a retest of that broken level (3). The retest is the short entry.',
    keyPoints: [
      'The higher high grabs liquidity above the prior high.',
      'The break of the neckline (103.0) confirms the shift.',
      'The retest of 103.0–104.8 is the QML entry — stop above the retest high.',
    ],
    priceLines: [{ price: 103.0, color: COLORS.bear, title: 'Neckline', dashed: true }],
    zones: [
      { startTime: qmlT(9), endTime: qmlT(11), topPrice: 104.8, bottomPrice: 103.0, color: COLORS.zoneBear },
    ],
    markers: [
      { time: qmlT(8), position: 'aboveBar', shape: 'arrowUp', color: COLORS.amber, text: 'Higher High' },
      { time: qmlT(9), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: 'Break' },
      { time: qmlT(10), position: 'aboveBar', shape: 'arrowUp', color: COLORS.cyan, text: 'Retest (entry)' },
      { time: qmlT(11), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: 'Decline' },
    ],
    legend: [
      { label: 'Neckline', color: COLORS.bear, dashed: true },
      { label: 'Retest zone', color: COLORS.bear },
      { label: 'QML entry', color: COLORS.cyan },
    ],
  },

  'supply-demand': {
    candles: SND,
    title: 'Supply & Demand Zones',
    summary:
      'Supply and Demand zones are the footprints of institutional orders: a Demand zone at the base of a strong rally, a Supply zone at the top of one. Price tends to respect them for a long time.',
    keyPoints: [
      'Demand: the last down candle before the explosive rally (98.0–100.0).',
      'Supply: the last up candle before the sharp reversal (110.4–112.4).',
      'The fresher the zone and the stronger the exit, the more reliable it is.',
    ],
    zones: [
      { startTime: sndT(1), endTime: sndT(2), topPrice: 100.0, bottomPrice: 98.0, color: COLORS.zoneBull },
      { startTime: sndT(10), endTime: sndT(11), topPrice: 112.4, bottomPrice: 110.4, color: COLORS.zoneBear },
    ],
    priceLines: [
      { price: 100.0, color: COLORS.bull, title: 'Demand top', dashed: true },
      { price: 112.4, color: COLORS.bear, title: 'Supply top', dashed: true },
    ],
    markers: [
      { time: sndT(2), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: 'Demand zone' },
      { time: sndT(11), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: 'Supply zone' },
    ],
    legend: [
      { label: 'Demand zone', color: COLORS.bull },
      { label: 'Supply zone', color: COLORS.bear },
    ],
  },

  /* ============================== Wave & Ratio ============================ */

  'elliott-wave': {
    candles: EW,
    title: 'Elliott Wave',
    summary:
      'Elliott Wave theory describes markets as fractal 5-3 waves: an impulse (1-2-3-4-5) with the trend, followed by a correction (A-B-C) against it. The pattern repeats at every timeframe.',
    keyPoints: [
      'Waves 1, 3 and 5 move with the trend; waves 2 and 4 pull back.',
      'Wave 3 is usually the longest and strongest — never the shortest.',
      'Wave 2 never fully retraces wave 1; wave 4 never enters wave 1’s territory.',
      'The A-B-C correction completes the 5-3 cycle before the next impulse.',
    ],
    markers: [
      { time: ewT(0), position: 'aboveBar', shape: 'arrowUp', color: COLORS.violet, text: '1' },
      { time: ewT(1), position: 'belowBar', shape: 'arrowDown', color: COLORS.violet, text: '2' },
      { time: ewT(2), position: 'aboveBar', shape: 'arrowUp', color: COLORS.violet, text: '3' },
      { time: ewT(3), position: 'belowBar', shape: 'arrowDown', color: COLORS.violet, text: '4' },
      { time: ewT(4), position: 'aboveBar', shape: 'arrowUp', color: COLORS.violet, text: '5' },
      { time: ewT(5), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: 'A' },
      { time: ewT(6), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bear, text: 'B' },
      { time: ewT(7), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: 'C' },
    ],
    trendLines: [
      { from: { time: ewT(0), price: 101.5 }, to: { time: ewT(1), price: 99.8 }, color: COLORS.violet },
      { from: { time: ewT(1), price: 99.8 }, to: { time: ewT(2), price: 103.5 }, color: COLORS.violet },
      { from: { time: ewT(2), price: 103.5 }, to: { time: ewT(3), price: 101.8 }, color: COLORS.violet },
      { from: { time: ewT(3), price: 101.8 }, to: { time: ewT(4), price: 105.8 }, color: COLORS.violet },
      { from: { time: ewT(4), price: 105.8 }, to: { time: ewT(5), price: 103.4 }, color: COLORS.bear },
      { from: { time: ewT(5), price: 103.4 }, to: { time: ewT(6), price: 105.0 }, color: COLORS.bear },
      { from: { time: ewT(6), price: 105.0 }, to: { time: ewT(7), price: 102.2 }, color: COLORS.bear },
    ],
    legend: [
      { label: 'Impulse (1-2-3-4-5)', color: COLORS.violet },
      { label: 'Correction (A-B-C)', color: COLORS.bear },
    ],
  },

  harmonic: {
    candles: HARM,
    title: 'Harmonic Patterns (Gartley)',
    summary:
      'Harmonic patterns are X-A-B-C-D structures built on Fibonacci ratios. In a Gartley, D completes near the 0.786 retracement of X-A — a high-probability reversal zone (PRZ).',
    keyPoints: [
      'AB retraces 0.618 of XA; BC retraces 0.382–0.886 of AB.',
      'CD extends 1.272–1.618 of BC and lands at D.',
      'D near 0.786 of XA is the Potential Reversal Zone — the buy zone.',
      'Confluence (PRZ + demand + trend) raises the probability.',
    ],
    zones: [
      { startTime: harmT(8), endTime: harmT(10), topPrice: 103.5, bottomPrice: 102.0, color: COLORS.zoneBull },
    ],
    trendLines: [
      { from: { time: harmT(0), price: 99.4 }, to: { time: harmT(3), price: 112.2 }, color: COLORS.violet },
      { from: { time: harmT(3), price: 112.2 }, to: { time: harmT(5), price: 106.6 }, color: COLORS.violet },
      { from: { time: harmT(5), price: 106.6 }, to: { time: harmT(7), price: 110.6 }, color: COLORS.violet },
      { from: { time: harmT(7), price: 110.6 }, to: { time: harmT(9), price: 102.4 }, color: COLORS.violet },
    ],
    markers: [
      { time: harmT(0), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'X' },
      { time: harmT(3), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'A' },
      { time: harmT(5), position: 'belowBar', shape: 'square', color: COLORS.violet, text: 'B' },
      { time: harmT(7), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: 'C' },
      { time: harmT(9), position: 'belowBar', shape: 'square', color: COLORS.amber, text: 'D' },
    ],
    legend: [
      { label: 'Gartley legs (X-A-B-C-D)', color: COLORS.violet },
      { label: 'Potential Reversal Zone', color: COLORS.bull },
    ],
  },

  /* ========================== Volume & Order Flow ========================= */

  vsa: {
    candles: VSA,
    showVolume: true,
    title: 'Volume Spread Analysis (VSA)',
    summary:
      'VSA reads supply and demand through the relationship of volume, spread (range) and close position. Every bar is a clue about who is in control — no indicators needed.',
    keyPoints: [
      'Selling climax: huge volume + wide spread + close in upper half = absorption.',
      'No demand: a down close on shrinking volume — sellers are exhausted.',
      'No supply: an up bar on shrinking volume — buyers are ready to push.',
      'Volume confirms price; divergences warn of reversal.',
    ],
    markers: [
      { time: vsaT(9), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: 'Selling climax' },
      { time: vsaT(12), position: 'belowBar', shape: 'arrowDown', color: COLORS.amber, text: 'No demand' },
      { time: vsaT(13), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'No supply' },
    ],
    legend: [
      { label: 'Selling climax (climax volume)', color: COLORS.bear },
      { label: 'No demand (low volume down)', color: COLORS.amber },
      { label: 'No supply (low volume up)', color: COLORS.bull },
    ],
  },

  'volume-profile': {
    candles: VPROF,
    indicators: ['volumeProfile'],
    title: 'Volume Profile & POC',
    summary:
      'Volume Profile shows how much volume traded at each price — unlike volume bars, it is horizontal. The POC (Point of Control) is the price with the most volume; value area is where ~70% traded.',
    keyPoints: [
      'POC acts as a magnet — price returns to it again and again.',
      'The value area (thick part of the profile) is where institutions traded.',
      'A break above the value area high (or below the low) signals expansion.',
      'High nodes = support/resistance; low-volume nodes = fast moves.',
    ],
    zones: [
      {
        startTime: vprofT(0),
        endTime: vprofT(19),
        topPrice: VPROF_PROFILE.valueAreaHigh,
        bottomPrice: VPROF_PROFILE.valueAreaLow,
        color: COLORS.zoneAmber,
      },
    ],
    priceLines: [{ price: VPROF_PROFILE.poc, color: COLORS.amber, title: 'POC', dashed: true }],
    legend: [
      { label: 'Value area', color: COLORS.amber },
      { label: 'POC (Point of Control)', color: COLORS.amber, dashed: true },
    ],
  },

  /* ============================ Systematic ================================ */

  ichimoku: {
    candles: ICH,
    indicators: ['ichimoku'],
    title: 'Ichimoku Cloud',
    summary:
      'Ichimoku Kinko Hyo ("one look equilibrium chart") packs trend, support/resistance and momentum into one system: Tenkan/Kijun lines, the future cloud (Senkou A/B) and the Chikou span.',
    keyPoints: [
      'Tenkan-sen (9) & Kijun-sen (26): fast/slow averages — crossovers = momentum.',
      'The cloud (Senkou A/B, shifted +26) shows future support/resistance.',
      'Price above the cloud = bullish regime; below = bearish; inside = chop.',
      'Chikou span (close shifted −26) confirms: above price = bullish.',
      'The "cloud twist" (A/B crossing) marks a potential regime change.',
    ],
    legend: [
      { label: 'Tenkan-sen (conversion)', color: '#22d3ee' },
      { label: 'Kijun-sen (base)', color: '#f472b6' },
      { label: 'Senkou A / B (cloud)', color: '#4ade80' },
      { label: 'Chikou span (lagging)', color: '#4ade80' },
    ],
  },

  'mean-reversion': {
    candles: MR,
    indicators: ['bollinger'],
    title: 'Mean Reversion',
    summary:
      'Mean reversion trades the pull back to the average: when price stretches too far above or below the Bollinger Bands (20, 2σ), it tends to snap back toward the middle band.',
    keyPoints: [
      'Bands expand/contract with volatility — the channel adapts to the market.',
      'Closes outside the bands are statistically stretched moves.',
      'Traders fade the extremes: sell overbought, buy oversold, target the middle.',
      'Mean reversion works best in ranges; it is dangerous in strong trends.',
    ],
    markers: MR_MARKERS,
    legend: [
      { label: 'Middle band (SMA 20)', color: '#4f8cff' },
      { label: 'Upper / lower band (±2σ)', color: '#4a5468' },
      { label: 'Overbought fade', color: COLORS.amber },
      { label: 'Oversold fade', color: COLORS.bull },
    ],
  },

  /* ============================ Trading Playbook ==========================
   * Complete A-to-Z trade setups on gold-like data. Each carries a `trade`
   * plan — Entry (green), Stop Loss (red), Take Profit (blue) — rendered as
   * price lines on the chart and as an actionable plan under it.
   * ---------------------------------------------------------------------- */

  'playbook-ob': {
    candles: PB_OB,
    title: { en: 'SMC Order Block Entry', th: 'การเข้าเทรดด้วย Order Block (SMC)' },
    summary: {
      en: 'The full long setup: price sweeps sell-side liquidity below the equal lows, breaks structure (CHoCH) to the upside, then pulls back into the bullish Order Block — the last down candle before the impulse — where the trade is taken.',
      th: 'เซ็ตอัป Buy (long) ครบขั้นตอน: ราคากวาดสภาพคล่องฝั่งขายใต้แนว Equal Lows ก่อนจะเบรกโครงสร้างขึ้น (CHoCH) แล้วพักตัวกลับเข้าสู่ bullish Order Block — แท่งเทียนขาลงแท่งสุดท้ายก่อนการพุ่งแรง — เพื่อเข้าออเดอร์ตรงจุดนั้น',
    },
    keyPoints: [
      { en: 'The sweep (2342) takes out the equal lows at 2348 — sell-side liquidity is grabbed.', th: 'การกวาด (2342) ทะลุ Equal Lows ที่ 2348 — สภาพคล่องฝั่งขายถูกดูด' },
      { en: 'The CHoCH confirms the shift; the impulsive rally leaves a bullish OB behind.', th: 'CHoCH ยืนยันการเปลี่ยนโครงสร้าง; แท่งพุ่งแรงทิ้ง bullish OB ไว้เบื้องหลัง' },
      { en: 'The pullback taps the OB and rejects — that rejection is the entry trigger.', th: 'การพักตัวแตะ OB แล้วถูกปฏิเสธ — การปฏิเสธนั้นคือจุดเข้าเทรด' },
    ],
    zones: [
      { startTime: pbObT(5), endTime: pbObT(14), topPrice: 2352, bottomPrice: 2342, color: COLORS.zoneBull },
      { startTime: pbObT(4), endTime: pbObT(6), topPrice: 2350, bottomPrice: 2340, color: 'rgba(34, 211, 238, 0.08)' },
    ],
    priceLines: [{ price: 2348, color: COLORS.cyan, title: 'Swept low', dashed: true }],
    markers: [
      { time: pbObT(4), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: { en: '① Equal lows · liquidity', th: '① Equal Lows · สภาพคล่อง' } },
      { time: pbObT(5), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: { en: '② Sweep', th: '② กวาดสภาพคล่อง' } },
      { time: pbObT(6), position: 'aboveBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: '③ CHoCH', th: '③ CHoCH' } },
      { time: pbObT(11), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: { en: '④ OB retest → Entry', th: '④ รีเทสต์ OB → เข้าเทรด' } },
    ],
    legend: [
      { label: { en: 'Bullish Order Block', th: 'Order Block ขาขึ้น' }, color: COLORS.bull },
      { label: { en: 'Sell-side liquidity pool', th: 'แหล่งสภาพคล่องฝั่งขาย' }, color: COLORS.cyan },
      { label: { en: 'Swept equal lows', th: 'Equal Lows ที่ถูกกวาด' }, color: COLORS.cyan, dashed: true },
    ],
    trade: {
      direction: 'long',
      setup: { en: 'SMC Order Block Entry', th: 'การเข้าเทรดด้วย Order Block' },
      logic: {
        en: 'Liquidity was swept below the equal lows, structure shifted up (CHoCH), and price pulled back into the bullish OB — the zone where the impulse originated. Demand at the OB should reject price and resume the move.',
        th: 'สภาพคล่องถูกกวาดใต้ Equal Lows โครงสร้างเปลี่ยนเป็นขาขึ้น (CHoCH) และราคาพักตัวกลับเข้าสู่ bullish OB — โซนต้นกำเนิดของแท่งพุ่งแรง ความต้องการซื้อที่ OB ควรปฏิเสธราคาและพาราคากลับขึ้นต่อ',
      },
      steps: [
        {
          n: 1,
          title: { en: 'Sell-side liquidity — equal lows', th: 'สภาพคล่องฝั่งขาย — Equal Lows' },
          description: {
            en: 'Stops cluster below the equal lows at 2348 — the liquidity pool institutions will hunt.',
            th: 'ออเดอร์ Stop รวมตัวกันใต้ Equal Lows ที่ 2348 — แหล่งสภาพคล่องที่สถาบันจะล่า',
          },
        },
        {
          n: 2,
          title: { en: 'Liquidity sweep', th: 'การกวาดสภาพคล่อง' },
          description: {
            en: 'A wick takes out the 2348 lows down to 2342, then price snaps back — the trap is sprung.',
            th: 'ไส้เทียนกวาด Low ที่ 2348 ลงไปถึง 2342 แล้วราคาดีดกลับ — กับดักทำงานแล้ว',
          },
        },
        {
          n: 3,
          title: { en: 'CHoCH + bullish impulse', th: 'CHoCH + การพุ่งแรงขาขึ้น' },
          description: {
            en: 'Structure breaks to the upside; the rally leaves a bullish Order Block behind (the last down candle).',
            th: 'โครงสร้างเบรกขึ้น; การรีบาวด์ทิ้ง bullish Order Block ไว้เบื้องหลัง (แท่งแดงแท่งสุดท้าย)',
          },
        },
        {
          n: 4,
          title: { en: 'OB retest → Entry (long)', th: 'รีเทสต์ OB → เข้า Buy' },
          description: {
            en: 'The pullback taps the OB (2342–2352) and rejects — enter long with the stop below the zone.',
            th: 'การพักตัวแตะ OB (2342–2352) แล้วถูกปฏิเสธ — เข้า Buy โดย Stop อยู่ใต้โซน',
          },
        },
      ],
      riskReward: '1 : 4.6',
      entry: {
        price: 2356,
        conditions: {
          en: 'Wait for price to tap the bullish OB (2342–2352) and reject — a bullish close back above the zone confirms the entry.',
          th: 'รอให้ราคาแตะ bullish OB (2342–2352) แล้วถูกปฏิเสธ — การปิดแท่งเขียวกลับเหนือโซนยืนยันการเข้าเทรด',
        },
      },
      sl: {
        price: 2339,
        conditions: {
          en: 'Place 2 points below the OB low (2342). A full close through the OB invalidates the setup.',
          th: 'วาง Stop ใต้จุดต่ำสุดของ OB (2342) 2 จุด การปิดแท่งทะลุ OB ทั้งแท่งจะทำให้เซ็ตอัปเป็นโมฆะ',
        },
      },
      tp: {
        price: 2435,
        conditions: {
          en: 'Target the opposing buy-side liquidity — the prior EQH / swing high at 2435.',
          th: 'เป้าหมายคือสภาพคล่องฝั่งซื้อฝั่งตรงข้าม — แนว EQH / Swing High เดิมที่ 2435',
        },
      },
    },
  },

  'playbook-fvg': {
    candles: PB_FVG,
    title: { en: 'FVG Fill (Imbalance) Long', th: 'การเติมช่องว่าง FVG (Buy)' },
    summary: {
      en: 'A three-candle impulse leaves a Fair Value Gap — an unfilled imbalance between candle 1’s high and candle 3’s low. Price returns to fill the gap, rejects, and resumes the trend: the fill is the entry.',
      th: 'การพุ่งแรง 3 แท่งทิ้ง Fair Value Gap ไว้ — ความไม่สมดุลที่ยังไม่ถูกเติมเต็มระหว่าง High ของแท่งที่ 1 กับ Low ของแท่งที่ 3 ราคากลับมาเติมช่องว่าง ถูกปฏิเสธ แล้วเดินตามเทรนด์ต่อ: จุดที่เติมเต็มคือจุดเข้าเทรด',
    },
    keyPoints: [
      { en: 'The FVG (2400–2428) is the void between the first high and the third low of the impulse.', th: 'FVG (2400–2428) คือช่องว่างระหว่าง High แท่งแรกกับ Low แท่งที่สามของจังหวะพุ่งแรง' },
      { en: 'Price retraces into the gap — unfilled orders get paid.', th: 'ราคาย่อกลับเข้าไปในช่องว่าง — ออเดอร์ที่ยังไม่ถูกเติมจะถูกเติม' },
      { en: 'The rejection at the lower edge (2398) is the long trigger.', th: 'การถูกปฏิเสธที่ขอบล่าง (2398) คือทริกเกอร์การเข้าซื้อ' },
    ],
    zones: [
      { startTime: pbFvgT(4), endTime: pbFvgT(10), topPrice: 2428, bottomPrice: 2400, color: COLORS.zoneCyan },
      { startTime: pbFvgT(3), endTime: pbFvgT(10), topPrice: 2385, bottomPrice: 2372, color: COLORS.zoneBull },
    ],
    priceLines: [
      { price: 2428, color: COLORS.cyan, title: 'FVG top', dashed: true },
      { price: 2400, color: COLORS.cyan, title: 'FVG low', dashed: true },
    ],
    markers: [
      { time: pbFvgT(6), position: 'aboveBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: '① Impulse · FVG left', th: '① พุ่งแรง · FVG' } },
      { time: pbFvgT(9), position: 'belowBar', shape: 'arrowDown', color: COLORS.amber, text: { en: '② Filling gap', th: '② กำลังเติมช่องว่าง' } },
      { time: pbFvgT(10), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: { en: '③ Rejection → Entry', th: '③ ปฏิเสธ → เข้าเทรด' } },
    ],
    legend: [
      { label: { en: 'Fair Value Gap', th: 'Fair Value Gap (FVG)' }, color: COLORS.cyan },
      { label: { en: 'Demand base', th: 'ฐานดีมานด์' }, color: COLORS.bull },
    ],
    trade: {
      direction: 'long',
      setup: { en: 'FVG Fill', th: 'การเติมช่องว่าง FVG' },
      logic: {
        en: 'The impulse left an unfilled imbalance. Price returned to “pay” the gap, tapped the lower edge, and rejected — the imbalance is resolved and the trend resumes.',
        th: 'การพุ่งแรงทิ้งความไม่สมดุลที่ยังไม่ถูกเติม ราคากลับมา “เติม” ช่องว่าง แตะขอบล่างแล้วถูกปฏิเสธ — ความไม่สมดุลถูกจัดการ และเทรนด์กลับเดินต่อ',
      },
      steps: [
        {
          n: 1,
          title: { en: 'Impulse leaves the FVG', th: 'การพุ่งแรงทิ้ง FVG' },
          description: {
            en: 'A 3-candle rally leaves an unfilled imbalance between 2400 and 2428.',
            th: 'การรีบาวด์ 3 แท่งทิ้งความไม่สมดุลที่ยังไม่ถูกเติมระหว่าง 2400 ถึง 2428',
          },
        },
        {
          n: 2,
          title: { en: 'Pullback fills the gap', th: 'การย่อเติมเต็มช่องว่าง' },
          description: {
            en: 'Price retraces into the gap and taps the lower edge at 2398.',
            th: 'ราคาย่อกลับเข้าไปในช่องว่างและแตะขอบล่างที่ 2398',
          },
        },
        {
          n: 3,
          title: { en: 'Rejection → Entry (long)', th: 'การปฏิเสธ → เข้า Buy' },
          description: {
            en: 'A bullish rejection candle closes back above the gap — the imbalance is paid, enter long.',
            th: 'แท่งเขียวปฏิเสธปิดกลับเหนือช่องว่าง — ความไม่สมดุลถูกเติมแล้ว เข้า Buy',
          },
        },
      ],
      riskReward: '1 : 2.9',
      entry: {
        price: 2406,
        conditions: {
          en: 'Wait for price to fill the FVG (2400–2428) and print a bullish rejection candle back above the gap.',
          th: 'รอให้ราคาเติม FVG (2400–2428) และเกิดแท่งเขียวปฏิเสธกลับเหนือช่องว่าง',
        },
      },
      sl: {
        price: 2390,
        conditions: {
          en: 'Below the FVG low (2400) with buffer. A close through the gap bottom invalidates the setup.',
          th: 'ใต้จุดต่ำสุดของ FVG (2400) พร้อมเผื่อระยะ การปิดแท่งทะลุด้านล่างของช่องว่างทำให้เซ็ตอัปเป็นโมฆะ',
        },
      },
      tp: {
        price: 2452,
        conditions: {
          en: 'Target the prior swing high / buy-side liquidity at 2452.',
          th: 'เป้าหมายคือ Swing High เดิม / สภาพคล่องฝั่งซื้อที่ 2452',
        },
      },
    },
  },

  'playbook-spring': {
    candles: PB_SPRING,
    showVolume: true,
    title: { en: 'Wyckoff Accumulation · Spring', th: 'การสะสม Wyckoff · Spring' },
    summary: {
      en: 'The Accumulation phase: a selling climax (SC) on huge volume is absorbed, the automatic rally (AR) and secondary test (ST) confirm supply is drying up, and the Spring — a sweep below the range low that closes back inside — springs the bear trap. The close back inside is the long trigger for the markup.',
      th: 'ช่วงการสะสม: การเทขายไคลแมกซ์ (SC) ด้วยวอลุ่มมหาศาลถูกดูดซับ การดีดอัตโนมัติ (AR) และการทดสอบครั้งที่สอง (ST) ยืนยันว่าซัปพลายกำลังแห้ง และ Spring — การกวาดใต้ Low ของกรอบที่ปิดกลับเข้ามา — ปลดล็อกกับดักหมี การปิดกลับเข้ากรอบคือทริกเกอร์ Buy เพื่อรอช่วง Markup',
    },
    keyPoints: [
      { en: 'SC: huge volume + wide spread near the lows — absorption begins.', th: 'SC: วอลุ่มมหาศาล + ช่วงกว้างใกล้จุดต่ำสุด — การดูดซับเริ่มขึ้น' },
      { en: 'AR → ST: the retest holds above the SC low on lower volume.', th: 'AR → ST: การทดสอบยืนเหนือ Low ของ SC ด้วยวอลุ่มที่ลดลง' },
      { en: 'Spring: the sweep to 2362 closes back inside — the bear trap before markup.', th: 'Spring: การกวาดไป 2362 ปิดกลับเข้ากรอบ — กับดักหมีก่อนช่วง Markup' },
    ],
    zones: [
      { startTime: pbSprT(0), endTime: pbSprT(11), topPrice: 2422, bottomPrice: 2380, color: COLORS.zoneAmber },
    ],
    priceLines: [
      { price: 2380, color: COLORS.amber, title: 'Range low', dashed: true },
      { price: 2422, color: COLORS.amber, title: 'Range high', dashed: true },
    ],
    markers: [
      { time: pbSprT(2), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: { en: '① SC', th: '① SC' } },
      { time: pbSprT(3), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'AR' },
      { time: pbSprT(4), position: 'belowBar', shape: 'circle', color: COLORS.cyan, text: { en: '② ST', th: '② ST' } },
      { time: pbSprT(5), position: 'belowBar', shape: 'circle', color: COLORS.amber, text: 'Test' },
      { time: pbSprT(7), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: { en: '③ Spring', th: '③ Spring' } },
      { time: pbSprT(8), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: { en: '④ Close back inside → Entry', th: '④ ปิดกลับเข้ากรอบ → เข้าเทรด' } },
      { time: pbSprT(9), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: 'SOS' },
    ],
    legend: [
      { label: { en: 'Selling climax (SC)', th: 'การเทขายไคลแมกซ์ (SC)' }, color: COLORS.bear },
      { label: { en: 'Secondary test (ST)', th: 'การทดสอบครั้งที่สอง (ST)' }, color: COLORS.cyan },
      { label: { en: 'Spring candle', th: 'แท่ง Spring' }, color: COLORS.bear },
      { label: { en: 'Accumulation range', th: 'กรอบสะสม (Accumulation)' }, color: COLORS.amber },
      { label: { en: 'Sign of strength (SOS)', th: 'สัญญาณความแข็งแกร่ง (SOS)' }, color: COLORS.bull },
    ],
    trade: {
      direction: 'long',
      setup: { en: 'Wyckoff Accumulation · Spring', th: 'การสะสม Wyckoff · Spring' },
      logic: {
        en: 'The selling climax was absorbed, the secondary test held on lower volume, and the Spring shook out weak hands below the range before closing back inside on rising volume. The markup follows.',
        th: 'การเทขายไคลแมกซ์ถูกดูดซับ การทดสอบครั้งที่สองยืนได้ด้วยวอลุ่มที่ลดลง และ Spring เขย่ามืออ่อนใต้กรอบก่อนปิดกลับเข้ากรอบพร้อมวอลุ่มที่เพิ่มขึ้น ตามด้วยช่วง Markup',
      },
      steps: [
        {
          n: 1,
          title: { en: 'Selling climax (SC)', th: 'การเทขายไคลแมกซ์ (SC)' },
          description: {
            en: 'A wide-spread down bar on huge volume closes near the lows — the first sign that the selling is being absorbed.',
            th: 'แท่งแดงช่วงกว้างพร้อมวอลุ่มมหาศาลปิดใกล้จุดต่ำสุด — สัญญาณแรกว่าแรงขายกำลังถูกดูดซับ',
          },
        },
        {
          n: 2,
          title: { en: 'Secondary test (ST)', th: 'การทดสอบครั้งที่สอง (ST)' },
          description: {
            en: 'The retest of the SC low holds on lower volume — supply is drying up.',
            th: 'การทดสอบ Low ของ SC อีกครั้งยืนอยู่ได้ด้วยวอลุ่มที่ลดลง — ซัปพลายกำลังแห้ง',
          },
        },
        {
          n: 3,
          title: { en: 'Spring — sweep below the range', th: 'Spring — กวาดใต้กรอบ' },
          description: {
            en: 'A wick takes out the range low to 2362 and closes back inside on rising volume — the bear trap.',
            th: 'ไส้เทียนกวาด Low ของกรอบลงไป 2362 แล้วปิดกลับเข้ากรอบพร้อมวอลุ่มที่เพิ่มขึ้น — กับดักหมี',
          },
        },
        {
          n: 4,
          title: { en: 'Close back inside → Entry (long)', th: 'ปิดกลับเข้ากรอบ → เข้า Buy' },
          description: {
            en: 'The close back inside + a sign of strength (SOS) confirms; enter long for the markup.',
            th: 'การปิดกลับเข้ากรอบ + สัญญาณความแข็งแกร่ง (SOS) ยืนยัน; เข้า Buy เพื่อรอช่วง Markup',
          },
        },
      ],
      riskReward: '1 : 1.9',
      entry: {
        price: 2386,
        conditions: {
          en: 'Enter after the spring closes back inside the range (above 2380) and the next candle confirms on higher volume.',
          th: 'เข้าหลังจาก Spring ปิดกลับเข้ากรอบ (เหนือ 2380) และแท่งถัดไปยืนยันด้วยปริมาณที่สูงขึ้น',
        },
      },
      sl: {
        price: 2360,
        conditions: {
          en: 'Below the spring low (2362) with buffer. A close below it means the shakeout failed and the range is breaking down.',
          th: 'ใต้จุดต่ำสุดของ Spring (2362) พร้อมเผื่อระยะ การปิดต่ำกว่านั้นหมายถึงการเขย่าล้มเหลวและกรอบกำลังพังลง',
        },
      },
      tp: {
        price: 2435,
        conditions: {
          en: 'First target: the range high / UTAD area (2422–2435). Trail the remainder into the markup.',
          th: 'เป้าหมายแรก: แนวสูงของกรอบ / โซน UTAD (2422–2435) แล้วเลื่อน Stop ตามส่วนที่เหลือเข้าสู่ช่วง Markup',
        },
      },
    },
  },

  'playbook-qml': {
    candles: PB_QML,
    title: { en: 'Quasimodo (QML) Reversal', th: 'การกลับตัว Quasimodo (QML)' },
    summary: {
      en: 'The QML is a 1-2-3 short structure: a higher high (1) grabs buy-side liquidity, price breaks the prior swing low — the neckline (2) — and the retest of the broken level (3) is the short entry.',
      th: 'QML คือโครงสร้างกลับตัวแบบ 1-2-3 สำหรับขาย: Higher High (1) ดูดสภาพคล่องฝั่งซื้อ ราคาเบรก Swing Low เดิม — แนวคอ (neckline) (2) — และการรีเทสต์แนวที่เบรกไปแล้ว (3) คือจุดเข้า Short',
    },
    keyPoints: [
      { en: 'The higher high at 2450 takes out the buy-side liquidity above 2442.', th: 'Higher High ที่ 2450 ดูดสภาพคล่องฝั่งซื้อเหนือ 2442' },
      { en: 'The break of the neckline (2408) confirms the shift in character.', th: 'การเบรกแนวคอ (2408) ยืนยันการเปลี่ยนลักษณะของตลาด' },
      { en: 'The retest of 2408–2418 is the short — stop above the retest high.', th: 'การรีเทสต์ 2408–2418 คือจุดเข้า Short — วาง Stop เหนือ High ของการรีเทสต์' },
    ],
    zones: [
      { startTime: pbQmlT(8), endTime: pbQmlT(10), topPrice: 2418, bottomPrice: 2404, color: COLORS.zoneBear },
      { startTime: pbQmlT(5), endTime: pbQmlT(7), topPrice: 2450, bottomPrice: 2442, color: 'rgba(251, 191, 36, 0.08)' },
    ],
    priceLines: [{ price: 2408, color: COLORS.bear, title: 'QML line', dashed: true }],
    markers: [
      { time: pbQmlT(4), position: 'belowBar', shape: 'circle', color: COLORS.cyan, text: { en: 'LL', th: 'LL' } },
      { time: pbQmlT(6), position: 'aboveBar', shape: 'arrowUp', color: COLORS.amber, text: { en: '① HH · liquidity', th: '① HH · สภาพคล่อง' } },
      { time: pbQmlT(8), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: { en: '② Break (CHoCH)', th: '② เบรก (CHoCH)' } },
      { time: pbQmlT(10), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: '③ Retest → Entry (short)', th: '③ รีเทสต์ → เข้า Short' } },
    ],
    legend: [
      { label: { en: 'Neckline', th: 'แนวคอ (Neckline)' }, color: COLORS.bear, dashed: true },
      { label: { en: 'Retest zone', th: 'โซนรีเทสต์' }, color: COLORS.bear },
      { label: { en: 'Buy-side liquidity (grabbed)', th: 'สภาพคล่องฝั่งซื้อ (ถูกดูด)' }, color: COLORS.amber },
    ],
    trade: {
      direction: 'short',
      setup: { en: 'QML Reversal', th: 'การกลับตัว QML' },
      logic: {
        en: 'The higher high grabbed buy-side liquidity, then price broke the neckline — a change of character. The retest of the broken neckline (support → resistance) is the short.',
        th: 'Higher High ดูดสภาพคล่องฝั่งซื้อ จากนั้นราคาเบรกแนวคอ — การเปลี่ยนลักษณะของตลาด การรีเทสต์แนวคอที่เบรกไปแล้ว (แนวรับ → แนวต้าน) คือจุดเข้า Short',
      },
      steps: [
        {
          n: 1,
          title: { en: 'Higher high (liquidity grab)', th: 'Higher High (ดูดสภาพคล่อง)' },
          description: {
            en: 'Price spikes to 2450, taking out the buy-side liquidity above 2442.',
            th: 'ราคาพุ่งไป 2450 ดูดสภาพคล่องฝั่งซื้อเหนือ 2442',
          },
        },
        {
          n: 2,
          title: { en: 'Break of the neckline (CHoCH)', th: 'เบรกแนวคอ (CHoCH)' },
          description: {
            en: 'The prior swing low at 2408 breaks with a strong bearish close — character changes.',
            th: 'Swing Low เดิมที่ 2408 ถูกเบรกด้วยแท่งแดงปิดแข็งแรง — ลักษณะของตลาดเปลี่ยน',
          },
        },
        {
          n: 3,
          title: { en: 'Retest → Entry (short)', th: 'รีเทสต์ → เข้า Short' },
          description: {
            en: 'Price retests the broken neckline (2408–2418) and rejects — short the retest.',
            th: 'ราคารีเทสต์แนวคอที่เบรก (2408–2418) แล้วถูกปฏิเสธ — ขายที่จังหวะรีเทสต์',
          },
        },
      ],
      riskReward: '1 : 4.2',
      entry: {
        price: 2414,
        conditions: {
          en: 'Wait for price to retest the broken neckline (2408–2418) and reject — a bearish close back below the zone confirms the short.',
          th: 'รอให้ราคารีเทสต์แนวคอที่เบรก (2408–2418) แล้วถูกปฏิเสธ — การปิดแท่งแดงกลับใต้โซนยืนยันการเข้า Short',
        },
      },
      sl: {
        price: 2424,
        conditions: {
          en: 'Place 2 points above the retest high (2418). A close above the neckline zone invalidates the QML.',
          th: 'วาง Stop เหนือ High ของการรีเทสต์ (2418) 2 จุด การปิดแท่งเหนือโซนแนวคอทำให้ QML เป็นโมฆะ',
        },
      },
      tp: {
        price: 2372,
        conditions: {
          en: 'Target the opposing sell-side liquidity — the equal lows at 2372.',
          th: 'เป้าหมายคือสภาพคล่องฝั่งขายฝั่งตรงข้าม — แนว Equal Lows ที่ 2372',
        },
      },
    },
  },

  'playbook-bat': {
    candles: PB_BAT,
    title: { en: 'Bearish Bat Pattern', th: 'รูปแบบ Bat ขาลง' },
    summary: {
      en: 'The Bearish Bat is an X-A-B-C-D reversal structure built on Fibonacci ratios: B retraces 0.382–0.5 of XA, C retraces 0.382–0.886 of AB, and D completes at the 0.886 retracement of XA — the Potential Reversal Zone (PRZ) where the short is taken.',
      th: 'Bat ขาลงคือโครงสร้างกลับตัว X-A-B-C-D ที่สร้างจากอัตราส่วน Fibonacci: B ย่อ 0.382–0.5 ของ XA, C ย่อ 0.382–0.886 ของ AB และ D จบที่ 0.886 ของ XA — โซนกลับตัวที่อาจเกิดขึ้น (PRZ) ซึ่งเป็นจุดเข้า Short',
    },
    keyPoints: [
      { en: 'The X→A impulse draws liquidity up to 2450 — the pattern’s fuel.', th: 'การพุ่ง X→A ดึงสภาพคล่องขึ้นไป 2450 — เชื้อเพลิงของรูปแบบ' },
      { en: 'B retraces ~0.5 of XA; C fails below A (0.886 of AB) — lower high.', th: 'B ย่อ ~0.5 ของ XA; C ล้มเหลวใต้ A (0.886 ของ AB) — Higher ต่ำลง' },
      { en: 'D at the 0.886 retracement (2395) is the PRZ — the short trigger.', th: 'D ที่ 0.886 (2395) คือ PRZ — ทริกเกอร์การขาย' },
    ],
    zones: [
      { startTime: pbBatT(12), endTime: pbBatT(13), topPrice: 2408, bottomPrice: 2395, color: COLORS.zoneBear },
      { startTime: pbBatT(4), endTime: pbBatT(5), topPrice: 2450, bottomPrice: 2446, color: 'rgba(251, 191, 36, 0.08)' },
    ],
    priceLines: [{ price: 2395, color: COLORS.violet, title: '0.886 XA', dashed: true }],
    trendLines: [
      { from: { time: pbBatT(0), price: 2388 }, to: { time: pbBatT(4), price: 2450 }, color: COLORS.violet },
      { from: { time: pbBatT(4), price: 2450 }, to: { time: pbBatT(7), price: 2418 }, color: COLORS.violet },
      { from: { time: pbBatT(7), price: 2418 }, to: { time: pbBatT(9), price: 2445 }, color: COLORS.violet },
      { from: { time: pbBatT(9), price: 2445 }, to: { time: pbBatT(12), price: 2395 }, color: COLORS.bear },
    ],
    markers: [
      { time: pbBatT(0), position: 'belowBar', shape: 'square', color: COLORS.violet, text: { en: '① X', th: '① X' } },
      { time: pbBatT(4), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: { en: '② A', th: '② A' } },
      { time: pbBatT(7), position: 'belowBar', shape: 'square', color: COLORS.violet, text: { en: '③ B', th: '③ B' } },
      { time: pbBatT(9), position: 'aboveBar', shape: 'square', color: COLORS.violet, text: { en: '④ C', th: '④ C' } },
      { time: pbBatT(12), position: 'belowBar', shape: 'square', color: COLORS.amber, text: { en: '⑤ D · PRZ', th: '⑤ D · PRZ' } },
      { time: pbBatT(13), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Short → Entry', th: 'เข้า Short' } },
    ],
    legend: [
      { label: { en: 'X-A-B-C-D legs', th: 'ขา X-A-B-C-D' }, color: COLORS.violet },
      { label: { en: 'Potential Reversal Zone (PRZ)', th: 'โซนกลับตัว (PRZ)' }, color: COLORS.bear },
      { label: { en: '0.886 retracement of XA', th: '0.886 ของ XA' }, color: COLORS.violet, dashed: true },
    ],
    trade: {
      direction: 'short',
      setup: { en: 'Bearish Bat Pattern', th: 'รูปแบบ Bat ขาลง' },
      logic: {
        en: 'The X→A rally grabbed buy-side liquidity at 2450. B and C complete the Fibonacci retracements, and D lands at the 0.886 of XA — a high-probability reversal zone. The rejection at D is the short.',
        th: 'การพุ่ง X→A ดูดสภาพคล่องฝั่งซื้อที่ 2450 B และ C ทำครบอัตราส่วน Fibonacci และ D ลงจอดที่ 0.886 ของ XA — โซนกลับตัวความน่าจะเป็นสูง การปฏิเสธที่ D คือจุดขาย',
      },
      steps: [
        {
          n: 1,
          title: { en: 'X → A impulse', th: 'X → A จังหวะพุ่ง' },
          description: {
            en: 'The rally defines the XA swing and draws buy-side liquidity up to 2450.',
            th: 'การรีบาวด์กำหนดสวิง XA และดึงสภาพคล่องฝั่งซื้อขึ้นไปที่ 2450',
          },
        },
        {
          n: 2,
          title: { en: 'B — 0.5 retracement', th: 'B — ย่อ 0.5' },
          description: {
            en: 'Price pulls back to ~50% of XA (2418) — a valid retracement zone for the pattern.',
            th: 'ราคาย่อกลับไป ~50% ของ XA (2418) — โซนย่อที่ใช้ได้ของรูปแบบ',
          },
        },
        {
          n: 3,
          title: { en: 'C — 0.886 of AB', th: 'C — 0.886 ของ AB' },
          description: {
            en: 'The rally resumes to 2445 but fails below A — a lower high confirms the bearish setup.',
            th: 'การรีบาวด์กลับขึ้นไป 2445 แต่ล้มเหลวใต้ A — Higher ต่ำลงยืนยันเซ็ตอัปขาลง',
          },
        },
        {
          n: 4,
          title: { en: 'D at 0.886 of XA (PRZ)', th: 'D ที่ 0.886 ของ XA (PRZ)' },
          description: {
            en: 'The drop completes the 0.886 retracement (2395) — the Potential Reversal Zone.',
            th: 'การลงมาครบ 0.886 ของ XA (2395) — โซนกลับตัวที่อาจเกิดขึ้น (PRZ)',
          },
        },
        {
          n: 5,
          title: { en: 'Rejection → Entry (short)', th: 'การปฏิเสธ → เข้า Short' },
          description: {
            en: 'A bearish rejection candle at D confirms; short with the stop above D.',
            th: 'แท่งแดงปฏิเสธที่ D ยืนยัน; เข้า Short โดย Stop อยู่เหนือ D',
          },
        },
      ],
      riskReward: '1 : 2.3',
      entry: {
        price: 2399,
        conditions: {
          en: 'Wait for price to reach D (0.886 of XA = 2395) and print a bearish rejection candle — short the close back below the PRZ.',
          th: 'รอให้ราคามาถึง D (0.886 ของ XA = 2395) และเกิดแท่งแดงปฏิเสธ — ขายที่การปิดกลับใต้ PRZ',
        },
      },
      sl: {
        price: 2416,
        conditions: {
          en: 'Above the D swing high (2414) with buffer. A close above the PRZ invalidates the pattern.',
          th: 'เหนือ High ของ D (2414) พร้อมเผื่อระยะ การปิดเหนือ PRZ ทำให้รูปแบบเป็นโมฆะ',
        },
      },
      tp: {
        price: 2360,
        conditions: {
          en: 'Target the sell-side liquidity below X (2388) — the equal lows at 2360. Trail from there.',
          th: 'เป้าหมายคือสภาพคล่องฝั่งขายใต้ X (2388) — แนว Equal Lows ที่ 2360 แล้วเลื่อน Stop ตาม',
        },
      },
    },
  },

  'playbook-vsa': {
    candles: PB_VSA,
    showVolume: true,
    title: { en: 'VSA Stopping Volume at Support', th: 'VSA: ปริมาณหยุดที่แนวรับ' },
    summary: {
      en: 'VSA reads the fight between supply and demand. At a well-tested support, a wide-spread down bar on huge volume that closes in its upper half is stopping volume — the selling is absorbed. No-demand bars follow, and a sign of strength triggers the long.',
      th: 'VSA อ่านการต่อสู้ระหว่างซัปพลายและดีมานด์ ที่แนวรับที่ถูกทดสอบหลายครั้ง แท่งแดงช่วงกว้างพร้อมวอลุ่มมหาศาลที่ปิดในครึ่งบนคือปริมาณหยุด (stopping volume) — แรงขายถูกดูดซับ ตามด้วยแท่งไร้ดีมานด์ และสัญญาณความแข็งแกร่ง (SOS) คือทริกเกอร์ Buy',
    },
    keyPoints: [
      { en: 'Stopping volume: huge volume + wide spread + close in the upper half.', th: 'ปริมาณหยุด: วอลุ่มมหาศาล + ช่วงกว้าง + ปิดครึ่งบน' },
      { en: 'No demand: narrow-spread, low-volume down bars — supply is drying up.', th: 'ไร้ดีมานด์: แท่งลงช่วงแคบ วอลุ่มต่ำ — ซัปพลายกำลังแห้ง' },
      { en: 'Sign of strength: an up bar on rising volume confirms the reversal.', th: 'สัญญาณความแข็งแกร่ง: แท่งเขียวพร้อมวอลุ่มที่เพิ่มขึ้นยืนยันการกลับตัว' },
    ],
    zones: [
      { startTime: pbVsaT(3), endTime: pbVsaT(7), topPrice: 2384, bottomPrice: 2372, color: COLORS.zoneBull },
    ],
    priceLines: [{ price: 2374, color: COLORS.cyan, title: 'Support', dashed: true }],
    markers: [
      { time: pbVsaT(3), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: { en: '① Support', th: '① แนวรับ' } },
      { time: pbVsaT(4), position: 'belowBar', shape: 'arrowDown', color: COLORS.bear, text: { en: '② Stopping volume', th: '② ปริมาณหยุด' } },
      { time: pbVsaT(6), position: 'belowBar', shape: 'circle', color: COLORS.amber, text: { en: '③ No demand', th: '③ ไร้ดีมานด์' } },
      { time: pbVsaT(7), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: { en: '④ SOS → Entry', th: '④ SOS → เข้าเทรด' } },
    ],
    legend: [
      { label: { en: 'Support / demand zone', th: 'แนวรับ / โซนดีมานด์' }, color: COLORS.bull },
      { label: { en: 'Stopping volume', th: 'ปริมาณหยุด' }, color: COLORS.bear },
      { label: { en: 'No demand', th: 'ไร้ดีมานด์' }, color: COLORS.amber },
      { label: { en: 'Sign of strength (SOS)', th: 'สัญญาณความแข็งแกร่ง (SOS)' }, color: COLORS.bull },
    ],
    trade: {
      direction: 'long',
      setup: { en: 'VSA Stopping Volume', th: 'VSA: ปริมาณหยุด' },
      logic: {
        en: 'The wide-spread, high-volume down bar at support closed in its upper half — stopping volume. Sellers exhausted (no demand), then an up bar on rising volume (sign of strength) confirmed the reversal: the long trigger.',
        th: 'แท่งแดงช่วงกว้าง วอลุ่มสูง ที่แนวรับปิดในครึ่งบน — ปริมาณหยุด ผู้ขายหมดแรง (ไร้ดีมานด์) จากนั้นแท่งเขียวพร้อมวอลุ่มที่เพิ่มขึ้น (สัญญาณความแข็งแกร่ง) ยืนยันการกลับตัว: ทริกเกอร์ Buy',
      },
      steps: [
        {
          n: 1,
          title: { en: 'Support / demand zone', th: 'แนวรับ / โซนดีมานด์' },
          description: {
            en: 'Price reaches a well-tested support where selling should eventually run out of steam.',
            th: 'ราคามาถึงแนวรับที่ถูกทดสอบหลายครั้ง ซึ่งแรงขายควรจะหมดลงในที่สุด',
          },
        },
        {
          n: 2,
          title: { en: 'Stopping volume (climax)', th: 'ปริมาณหยุด (ไคลแมกซ์)' },
          description: {
            en: 'A wide-spread down bar on huge volume closes in its upper half — the selling is absorbed.',
            th: 'แท่งแดงช่วงกว้างพร้อมวอลุ่มมหาศาลปิดในครึ่งบน — แรงขายถูกดูดซับ',
          },
        },
        {
          n: 3,
          title: { en: 'No demand', th: 'ไร้ดีมานด์' },
          description: {
            en: 'Narrow-spread, low-volume down bars show sellers cannot push further — supply dries up.',
            th: 'แท่งลงช่วงแคบ วอลุ่มต่ำ แสดงว่าผู้ขายดันต่อไม่ได้ — ซัปพลายแห้งลง',
          },
        },
        {
          n: 4,
          title: { en: 'SOS → Entry (long)', th: 'SOS → เข้า Buy' },
          description: {
            en: 'An up bar on rising volume confirms demand; enter long with the stop below support.',
            th: 'แท่งเขียวพร้อมวอลุ่มที่เพิ่มขึ้นยืนยันดีมานด์; เข้า Buy โดย Stop อยู่ใต้แนวรับ',
          },
        },
      ],
      riskReward: '1 : 2.1',
      entry: {
        price: 2388,
        conditions: {
          en: 'Enter after the sign of strength (SOS) — the up bar on rising volume — once it closes above the stopping-volume bar.',
          th: 'เข้าหลังสัญญาณความแข็งแกร่ง (SOS) — แท่งเขียวพร้อมวอลุ่มที่เพิ่มขึ้น — เมื่อปิดเหนือแท่งปริมาณหยุด',
        },
      },
      sl: {
        price: 2368,
        conditions: {
          en: 'Below the stopping-volume low (2374) with buffer. A close below support invalidates the absorption story.',
          th: 'ใต้ Low ของแท่งปริมาณหยุด (2374) พร้อมเผื่อระยะ การปิดใต้แนวรับทำให้เรื่องการดูดซับเป็นโมฆะ',
        },
      },
      tp: {
        price: 2430,
        conditions: {
          en: 'Target the prior resistance / buy-side liquidity at 2430. Trail the remainder on the way up.',
          th: 'เป้าหมายคือแนวต้านเดิม / สภาพคล่องฝั่งซื้อที่ 2430 แล้วเลื่อน Stop ตามระหว่างทางขึ้น',
        },
      },
    },
  },

  'playbook-uptrend': {
    candles: PB_UP,
    title: { en: 'Uptrend Continuation', th: 'การต่อเนื่องของเทรนด์ขาขึ้น' },
    summary: {
      en: 'The trend is defined by a sequence of Higher Highs and Higher Lows. After the BOS extends the structure, the pullback to the demand zone / BOS level is the continuation entry — buy strength on a dip, not the breakout itself.',
      th: 'เทรนด์ถูกนิยามด้วยลำดับ Higher High และ Higher Low หลัง BOS ขยายโครงสร้าง การย่อสู่โซนดีมานด์ / ระดับ BOS คือจุดเข้าร่วมต่อเนื่อง — ซื้อความแข็งแกร่งตอนย่อ ไม่ใช่ตอนเบรกเอาท์เอง',
    },
    keyPoints: [
      { en: 'The HL sequence shows buyers defending every dip.', th: 'ลำดับ HL แสดงว่าผู้ซื้อปกป้องทุกการย่อ' },
      { en: 'The BOS above 2424 confirms continuation.', th: 'BOS เหนือ 2424 ยืนยันการต่อเนื่อง' },
      { en: 'Enter on the pullback — stop below the last HL.', th: 'เข้าระหว่างการย่อ — Stop ใต้ HL จุดล่าสุด' },
    ],
    zones: [
      { startTime: pbUpT(2), endTime: pbUpT(6), topPrice: 2404, bottomPrice: 2398, color: COLORS.zoneBull },
    ],
    priceLines: [{ price: 2424, color: COLORS.cyan, title: 'BOS level', dashed: true }],
    markers: [
      { time: pbUpT(2), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'HL' },
      { time: pbUpT(5), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: { en: '① Equal lows · demand', th: '① Equal Lows · ดีมานด์' } },
      { time: pbUpT(6), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: { en: '② HH', th: '② HH' } },
      { time: pbUpT(8), position: 'belowBar', shape: 'arrowDown', color: COLORS.cyan, text: 'HL' },
      { time: pbUpT(9), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: { en: '③ BOS', th: '③ BOS' } },
      { time: pbUpT(11), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: { en: '④ Pullback → Entry', th: '④ ย่อ → เข้าเทรด' } },
    ],
    legend: [
      { label: { en: 'Demand zone (HL)', th: 'โซนดีมานด์ (HL)' }, color: COLORS.bull },
      { label: { en: 'BOS level', th: 'ระดับ BOS' }, color: COLORS.cyan, dashed: true },
      { label: { en: 'Higher high', th: 'Higher High' }, color: COLORS.bull },
    ],
    trade: {
      direction: 'long',
      setup: { en: 'Uptrend Continuation (BOS)', th: 'การต่อเนื่องเทรนด์ขาขึ้น (BOS)' },
      logic: {
        en: 'The trend printed a higher high, then a BOS extended the structure. The pullback toward the BOS level and prior demand offers a low-risk long with the invalidation below the last higher low.',
        th: 'เทรนด์ทำ Higher High จากนั้น BOS ขยายโครงสร้างออก การย่อกลับสู่ระดับ BOS และดีมานด์เดิมให้โอกาส Buy ความเสี่ยงต่ำ โดยจุดยกเลิกอยู่ใต้ Higher Low จุดล่าสุด',
      },
      steps: [
        {
          n: 1,
          title: { en: 'Demand / equal lows (HL)', th: 'ดีมานด์ / Equal Lows (HL)' },
          description: {
            en: 'Price holds the prior HL area (2398–2404); buyers defend the swing low.',
            th: 'ราคายืนที่โซน HL เดิม (2398–2404); ผู้ซื้อปกป้อง Swing Low',
          },
        },
        {
          n: 2,
          title: { en: 'Higher high (HH)', th: 'Higher High (HH)' },
          description: {
            en: 'Price rallies to a new high at 2424 — the trend structure is intact.',
            th: 'ราคาพุ่งขึ้นทำ High ใหม่ที่ 2424 — โครงสร้างเทรนด์ยัง intact',
          },
        },
        {
          n: 3,
          title: { en: 'Break of structure (BOS)', th: 'การเบรกโครงสร้าง (BOS)' },
          description: {
            en: 'A strong close above 2424 confirms continuation — the structure extends.',
            th: 'การปิดแท่งแข็งแรงเหนือ 2424 ยืนยันการต่อเนื่อง — โครงสร้างขยายออก',
          },
        },
        {
          n: 4,
          title: { en: 'Pullback → Entry (long)', th: 'การย่อ → เข้า Buy' },
          description: {
            en: 'Price pulls back toward the BOS level / demand; a rejection there is the low-risk long.',
            th: 'ราคาย่อกลับสู่ระดับ BOS / ดีมานด์; การถูกปฏิเสธที่นั่นคือจุด Buy ความเสี่ยงต่ำ',
          },
        },
      ],
      riskReward: '1 : 2.6',
      entry: {
        price: 2418,
        conditions: {
          en: 'Wait for the post-BOS pullback to find buyers at the BOS level / demand (2412–2420) and print a bullish rejection candle.',
          th: 'รอให้การย่อหลัง BOS หาผู้ซื้อที่ระดับ BOS / ดีมานด์ (2412–2420) และเกิดแท่งเขียวปฏิเสธ',
        },
      },
      sl: {
        price: 2408,
        conditions: {
          en: 'Below the pullback low / last HL (2412) with buffer. A close below it breaks the bullish structure.',
          th: 'ใต้ Low ของการย่อ / HL จุดล่าสุด (2412) พร้อมเผื่อระยะ การปิดต่ำกว่านั้นจะทำลายโครงสร้างขาขึ้น',
        },
      },
      tp: {
        price: 2444,
        conditions: {
          en: 'Target the external structure high / buy-side liquidity at 2444.',
          th: 'เป้าหมายคือ High ของโครงสร้างภายนอก / สภาพคล่องฝั่งซื้อที่ 2444',
        },
      },
    },
  },

  turtle: {
    candles: TURTLE,
    title: 'Turtle Trading (Breakout)',
    summary:
      'Turtle Trading is the trend-following system from the 1983 “Turtle” experiment: buy on a breakout of the 20-day high, sell on a break of the 20-day low, add on 10-day breakouts, and risk no more than 2% per trade (2×ATR stop).',
    keyPoints: [
      'Entry: a close above the 20-day high (or below the 20-day low) triggers the position.',
      'Stops: 2×ATR (or the 10-day low/high) — the system lets winners run.',
      'Exits: the opposite 10-day breakout (sell when the 10-day low breaks).',
      'Sizing: risk a fixed % of equity per trade — manage capital, not price.',
    ],
    zones: [
      { startTime: turtleT(0), endTime: turtleT(18), topPrice: 2420, bottomPrice: 2384, color: COLORS.zoneAmber },
    ],
    priceLines: [
      { price: 2420, color: COLORS.cyan, title: '20-day high', dashed: true },
      { price: 2384, color: COLORS.amber, title: '20-day low', dashed: true },
    ],
    markers: [
      { time: turtleT(4), position: 'belowBar', shape: 'arrowDown', color: COLORS.amber, text: { en: '① 20-day low', th: '① Low 20 วัน' } },
      { time: turtleT(16), position: 'aboveBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: '② 20-day high', th: '② High 20 วัน' } },
      { time: turtleT(19), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: { en: '③ Breakout → Entry', th: '③ เบรกเอาท์ → เข้าเทรด' } },
    ],
    legend: [
      { label: '20-day high (Donchian)', color: COLORS.cyan, dashed: true },
      { label: '20-day low (Donchian)', color: COLORS.amber, dashed: true },
      { label: 'Consolidation range', color: COLORS.amber },
    ],
  },
};
