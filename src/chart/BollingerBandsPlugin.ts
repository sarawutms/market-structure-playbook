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
import { bollingerBands } from '../data/indicators';
import type { Candle } from '../data/types';

const COLOR_MIDDLE = '#4f8cff';
const COLOR_BAND = '#4a5468';
const COLOR_CHANNEL = 'rgba(79, 140, 255, 0.06)';

/**
 * Draws Bollinger Bands (20, 2σ) plus the middle moving average over the
 * candles — the framework for mean-reversion concepts.
 */
export class BollingerBandsPlugin implements ISeriesPrimitive<Time> {
  private readonly _candles: Candle[];
  private readonly _view: BollingerBandsPaneView;
  private _chart: IChartApi | null = null;
  private _series: ISeriesApi<'Candlestick'> | null = null;

  constructor(candles: Candle[]) {
    this._candles = candles;
    this._view = new BollingerBandsPaneView(this);
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

  get candles(): Candle[] {
    return this._candles;
  }

  get chart(): IChartApi | null {
    return this._chart;
  }

  get series(): ISeriesApi<'Candlestick'> | null {
    return this._series;
  }
}

class BollingerBandsPaneView implements IPrimitivePaneView {
  private readonly _source: BollingerBandsPlugin;

  constructor(source: BollingerBandsPlugin) {
    this._source = source;
  }

  renderer(): IPrimitivePaneRenderer {
    return new BollingerBandsPaneRenderer(this._source);
  }
}

class BollingerBandsPaneRenderer implements IPrimitivePaneRenderer {
  private readonly _source: BollingerBandsPlugin;

  constructor(source: BollingerBandsPlugin) {
    this._source = source;
  }

  drawBackground(target: CanvasRenderingTarget2D): void {
    const { chart, series, candles } = this._source;
    if (!chart || !series) return;

    const { upper, lower } = bollingerBands(candles);
    const timeScale = chart.timeScale();

    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      const hpr = scope.horizontalPixelRatio;
      const vpr = scope.verticalPixelRatio;

      const xs: number[] = [];
      const ys: number[] = [];
      for (let i = 0; i < candles.length; i++) {
        const up = upper[i];
        const low = lower[i];
        if (up === null || low === null) continue;
        const x = timeScale.timeToCoordinate(candles[i].time);
        const yUp = series.priceToCoordinate(up);
        const yLow = series.priceToCoordinate(low);
        if (x === null || yUp === null || yLow === null) continue;
        xs.push(x * hpr);
        ys.push(yUp * vpr);
      }
      for (let i = candles.length - 1; i >= 0; i--) {
        const low = lower[i];
        if (low === null) continue;
        const x = timeScale.timeToCoordinate(candles[i].time);
        const yLow = series.priceToCoordinate(low);
        if (x === null || yLow === null) continue;
        xs.push(x * hpr);
        ys.push(yLow * vpr);
      }
      if (xs.length < 4) return;

      ctx.beginPath();
      ctx.moveTo(xs[0], ys[0]);
      for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], ys[i]);
      ctx.closePath();
      ctx.fillStyle = COLOR_CHANNEL;
      ctx.fill();
    });
  }

  draw(target: CanvasRenderingTarget2D): void {
    const { chart, series, candles } = this._source;
    if (!chart || !series) return;

    const bands = bollingerBands(candles);
    const timeScale = chart.timeScale();

    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      const hpr = scope.horizontalPixelRatio;
      const vpr = scope.verticalPixelRatio;

      const serieses: Array<{ values: Array<number | null>; color: string; width: number }> = [
        { values: bands.upper, color: COLOR_BAND, width: 1 },
        { values: bands.middle, color: COLOR_MIDDLE, width: 1.4 },
        { values: bands.lower, color: COLOR_BAND, width: 1 },
      ];

      for (const line of serieses) {
        ctx.strokeStyle = line.color;
        ctx.lineWidth = Math.max(1, Math.floor(line.width * hpr));
        ctx.setLineDash([]);
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < candles.length; i++) {
          const value = line.values[i];
          if (value === null) {
            started = false;
            continue;
          }
          const x = timeScale.timeToCoordinate(candles[i].time);
          const y = series.priceToCoordinate(value);
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
