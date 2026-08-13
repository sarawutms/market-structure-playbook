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
import type { ZoneSpec } from '../data/types';

/**
 * Draws semi-transparent zones behind the candles:
 * - horizontal bands between `topPrice`/`bottomPrice` (EQH/EQL, OB, FVG…)
 * - full-height vertical bands across `startTime`–`endTime` when no prices
 *   are given (e.g. London / New York kill zones).
 */
export class ZonesPlugin implements ISeriesPrimitive<Time> {
  private readonly _zones: ZoneSpec[];
  private readonly _view: ZonesPaneView;
  private _chart: IChartApi | null = null;
  private _series: ISeriesApi<'Candlestick'> | null = null;

  constructor(zones: ZoneSpec[]) {
    this._zones = zones;
    this._view = new ZonesPaneView(this);
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

  get zones(): ZoneSpec[] {
    return this._zones;
  }

  get chart(): IChartApi | null {
    return this._chart;
  }

  get series(): ISeriesApi<'Candlestick'> | null {
    return this._series;
  }
}

class ZonesPaneView implements IPrimitivePaneView {
  private readonly _source: ZonesPlugin;

  constructor(source: ZonesPlugin) {
    this._source = source;
  }

  renderer(): IPrimitivePaneRenderer {
    return new ZonesPaneRenderer(this._source);
  }
}

class ZonesPaneRenderer implements IPrimitivePaneRenderer {
  private readonly _source: ZonesPlugin;

  constructor(source: ZonesPlugin) {
    this._source = source;
  }

  drawBackground(target: CanvasRenderingTarget2D): void {
    const { chart, series, zones } = this._source;
    if (!chart || !series || zones.length === 0) return;

    const timeScale = chart.timeScale();

    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      const hpr = scope.horizontalPixelRatio;
      const vpr = scope.verticalPixelRatio;
      const bitmapHeight = scope.bitmapSize.height;

      for (const zone of zones) {
        const x1 = timeScale.timeToCoordinate(zone.startTime);
        const x2 = timeScale.timeToCoordinate(zone.endTime);
        if (x1 === null || x2 === null) continue;

        const left = Math.min(x1, x2) * hpr;
        const width = Math.abs(x2 - x1) * hpr;

        let top: number;
        let height: number;
        if (zone.topPrice !== undefined && zone.bottomPrice !== undefined) {
          const yTop = series.priceToCoordinate(Math.max(zone.topPrice, zone.bottomPrice));
          const yBottom = series.priceToCoordinate(Math.min(zone.topPrice, zone.bottomPrice));
          if (yTop === null || yBottom === null) continue;
          top = Math.min(yTop, yBottom) * vpr;
          height = Math.abs(yBottom - yTop) * vpr;
        } else {
          // Full-height vertical band (kill zones).
          top = 0;
          height = bitmapHeight;
        }

        ctx.fillStyle = zone.color;
        ctx.fillRect(left, top, width, height);
      }
    });
  }

  draw(_target: CanvasRenderingTarget2D): void {
    // Zones render in the background pass only.
  }
}
