import type { CanvasRenderingTarget2D } from 'fancy-canvas';
import type {
  IChartApi,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesApi,
  ISeriesPrimitive,
  SeriesAttachedParameter,
  Time,
} from 'lightweight-charts';
import type { Candle } from '../data/types';

interface IchimokuLine {
  color: string;
  values: Array<{ time: Time; value: number }>;
}

const COLOR_TENKAN = '#22d3ee'; // conversion line
const COLOR_KIJUN = '#f472b6'; // base line
const COLOR_CHIKOU = '#4ade80'; // lagging span
const COLOR_SENKOU_A = '#4ade80'; // cloud top / leading A
const COLOR_SENKOU_B = '#f87171'; // cloud bottom / leading B
const COLOR_CLOUD_UP = 'rgba(74, 222, 128, 0.10)';

/**
 * Computes and draws the Ichimoku Kinko Hyo system on a series:
 * Tenkan-sen, Kijun-sen, Senkou A/B (the cloud) and Chikou span.
 */
export class IchimokuPlugin implements ISeriesPrimitive<Time> {
  private readonly _candles: Candle[];
  private readonly _view: IchimokuPaneView;
  private _chart: IChartApi | null = null;
  private _series: ISeriesApi<'Candlestick'> | null = null;

  constructor(candles: Candle[]) {
    this._candles = candles;
    this._view = new IchimokuPaneView(this);
  }

  attached(param: SeriesAttachedParameter<Time, 'Candlestick'>): void {
    this._chart = param.chart;
    this._series = param.series;
  }

  detached(): void {
    this._chart = null;
    this._series = null;
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return [this._view];
  }

  get chart(): IChartApi | null {
    return this._chart;
  }

  get series(): ISeriesApi<'Candlestick'> | null {
    return this._series;
  }

  /** All computed Ichimoku data, exposed for the renderer. */
  get data(): IchimokuData {
    return computeIchimoku(this._candles);
  }
}

interface IchimokuData {
  tenkan: IchimokuLine;
  kijun: IchimokuLine;
  chikou: IchimokuLine;
  senkouA: IchimokuLine;
  senkouB: IchimokuLine;
  /** Aligned indices where the cloud has both bounds. */
  cloud: Array<{ time: Time; a: number; b: number }>;
}

function midpoint(candles: Candle[], from: number, to: number): number {
  let hi = -Infinity;
  let lo = Infinity;
  for (let i = from; i <= to; i++) {
    if (candles[i].high > hi) hi = candles[i].high;
    if (candles[i].low < lo) lo = candles[i].low;
  }
  return (hi + lo) / 2;
}

function computeIchimoku(candles: Candle[]): IchimokuData {
  const n = candles.length;
  const tenkan: Array<{ time: Time; value: number }> = [];
  const kijun: Array<{ time: Time; value: number }> = [];
  const senkouA: Array<{ time: Time; value: number }> = [];
  const senkouB: Array<{ time: Time; value: number }> = [];
  const chikou: Array<{ time: Time; value: number }> = [];

  for (let i = 0; i < n; i++) {
    if (i >= 8) tenkan.push({ time: candles[i].time, value: midpoint(candles, i - 8, i) });
    if (i >= 25) kijun.push({ time: candles[i].time, value: midpoint(candles, i - 25, i) });
    if (i >= 51) senkouB.push({ time: candles[i].time, value: midpoint(candles, i - 51, i) });
    // Chikou span: current close plotted 26 periods back.
    if (i >= 26) chikou.push({ time: candles[i - 26].time, value: candles[i].close });
  }

  // Senkou A needs tenkan + kijun at index i, plotted 26 periods ahead.
  for (let i = 25; i < n - 26; i++) {
    const t = tenkan[i - 8];
    const k = kijun[i - 25];
    if (t && k) {
      senkouA.push({ time: candles[i + 26].time, value: (t.value + k.value) / 2 });
    }
  }

  // Align senkouA/senkouB by time for the cloud polygon.
  const byTimeA = new Map(senkouA.map((p) => [String(p.time), p.value]));
  const cloud: Array<{ time: Time; a: number; b: number }> = [];
  for (const point of senkouB) {
    const a = byTimeA.get(String(point.time));
    if (a !== undefined) cloud.push({ time: point.time, a, b: point.value });
  }

  return {
    tenkan: { color: COLOR_TENKAN, values: tenkan },
    kijun: { color: COLOR_KIJUN, values: kijun },
    chikou: { color: COLOR_CHIKOU, values: chikou },
    senkouA: { color: COLOR_SENKOU_A, values: senkouA },
    senkouB: { color: COLOR_SENKOU_B, values: senkouB },
    cloud,
  };
}

class IchimokuPaneView implements IPrimitivePaneView {
  private readonly _source: IchimokuPlugin;

  constructor(source: IchimokuPlugin) {
    this._source = source;
  }

  renderer(): IPrimitivePaneRenderer {
    return new IchimokuPaneRenderer(this._source);
  }
}

class IchimokuPaneRenderer implements IPrimitivePaneRenderer {
  private readonly _source: IchimokuPlugin;

  constructor(source: IchimokuPlugin) {
    this._source = source;
  }

  drawBackground(target: CanvasRenderingTarget2D): void {
    const { chart, series, data } = this._source;
    if (!chart || !series) return;

    const timeScale = chart.timeScale();

    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      const hpr = scope.horizontalPixelRatio;
      const vpr = scope.verticalPixelRatio;

      // Cloud polygon: forward along A, back along B.
      const xs: number[] = [];
      const ys: number[] = [];
      for (const point of data.cloud) {
        const x = timeScale.timeToCoordinate(point.time);
        const yA = series.priceToCoordinate(point.a);
        const yB = series.priceToCoordinate(point.b);
        if (x === null || yA === null || yB === null) continue;
        xs.push(x * hpr);
        ys.push(yA * vpr);
      }
      for (let i = data.cloud.length - 1; i >= 0; i--) {
        const point = data.cloud[i];
        const x = timeScale.timeToCoordinate(point.time);
        const yB = series.priceToCoordinate(point.b);
        if (x === null || yB === null) continue;
        xs.push(x * hpr);
        ys.push(yB * vpr);
      }
      if (xs.length < 4) return;

      ctx.beginPath();
      ctx.moveTo(xs[0], ys[0]);
      for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], ys[i]);
      ctx.closePath();
      ctx.fillStyle = COLOR_CLOUD_UP;
      ctx.fill();
    });
  }

  draw(target: CanvasRenderingTarget2D): void {
    const { chart, series, data } = this._source;
    if (!chart || !series) return;

    const timeScale = chart.timeScale();

    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      const hpr = scope.horizontalPixelRatio;
      const vpr = scope.verticalPixelRatio;

      const lines: IchimokuLine[] = [data.tenkan, data.kijun, data.chikou, data.senkouA, data.senkouB];

      for (const line of lines) {
        ctx.strokeStyle = line.color;
        ctx.lineWidth = Math.max(1, Math.floor(1.2 * hpr));
        ctx.setLineDash([]);
        ctx.beginPath();
        let started = false;
        for (const point of line.values) {
          const x = timeScale.timeToCoordinate(point.time);
          const y = series.priceToCoordinate(point.value);
          if (x === null || y === null) {
            started = false;
            continue;
          }
          if (started) ctx.lineTo(x * hpr, y * vpr);
          else {
            ctx.moveTo(x * hpr, y * vpr);
            started = true;
          }
        }
        ctx.stroke();
      }
    });
  }
}
