import type { Candle } from './types';

/**
 * Pure indicator math shared by the scenario data and the chart plugins.
 */

export interface VolumeProfileBucket {
  /** Midpoint price of the bucket. */
  price: number;
  volume: number;
}

export interface VolumeProfileResult {
  buckets: VolumeProfileBucket[];
  /** Price of the highest-volume bucket (Point of Control). */
  poc: number;
  maxVolume: number;
  /** Value area bounds (the 70% of volume around the POC). */
  valueAreaHigh: number;
  valueAreaLow: number;
}

/**
 * Builds a volume profile from OHLCV candles by distributing each candle's
 * volume uniformly across its [low, high] range into `bucketCount` price
 * buckets. Returns the buckets plus POC / value area.
 */
export function computeVolumeProfile(candles: Candle[], bucketCount = 24): VolumeProfileResult {
  const lows = candles.map((c) => c.low);
  const highs = candles.map((c) => c.high);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const span = max - min;
  if (span <= 0 || bucketCount <= 0) {
    return { buckets: [], poc: min, maxVolume: 0, valueAreaHigh: max, valueAreaLow: min };
  }

  const size = span / bucketCount;
  const buckets: VolumeProfileBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
    price: min + (i + 0.5) * size,
    volume: 0,
  }));

  for (const candle of candles) {
    const vol = candle.volume ?? 0;
    if (vol <= 0) continue;
    const from = Math.max(0, Math.floor((candle.low - min) / size));
    const to = Math.min(bucketCount - 1, Math.floor((candle.high - min) / size));
    if (from === to) {
      buckets[from].volume += vol;
    } else {
      const per = vol / (to - from + 1);
      for (let i = from; i <= to; i++) buckets[i].volume += per;
    }
  }

  let pocIndex = 0;
  for (let i = 1; i < buckets.length; i++) {
    if (buckets[i].volume > buckets[pocIndex].volume) pocIndex = i;
  }

  // Value area: expand around the POC until it captures 70% of total volume.
  const total = buckets.reduce((sum, b) => sum + b.volume, 0);
  const target = total * 0.7;
  let lo = pocIndex;
  let hi = pocIndex;
  let acc = buckets[pocIndex].volume;
  while (acc < target && (lo > 0 || hi < buckets.length - 1)) {
    const left = lo > 0 ? buckets[lo - 1].volume : -1;
    const right = hi < buckets.length - 1 ? buckets[hi + 1].volume : -1;
    if (right >= left) hi += 1;
    else lo -= 1;
    acc += Math.max(left, right);
  }

  return {
    buckets,
    poc: buckets[pocIndex].price,
    maxVolume: buckets[pocIndex].volume,
    valueAreaHigh: buckets[hi].price + size / 2,
    valueAreaLow: buckets[lo].price - size / 2,
  };
}

export interface BollingerResult {
  middle: Array<number | null>;
  upper: Array<number | null>;
  lower: Array<number | null>;
}

/** Bollinger Bands (simple moving average ± k × standard deviation). */
export function bollingerBands(candles: Candle[], period = 20, k = 2): BollingerResult {
  const middle: Array<number | null> = [];
  const upper: Array<number | null> = [];
  const lower: Array<number | null> = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      middle.push(null);
      upper.push(null);
      lower.push(null);
      continue;
    }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    const mean = sum / period;
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) {
      variance += (candles[j].close - mean) ** 2;
    }
    const std = Math.sqrt(variance / period);
    middle.push(mean);
    upper.push(mean + k * std);
    lower.push(mean - k * std);
  }

  return { middle, upper, lower };
}
