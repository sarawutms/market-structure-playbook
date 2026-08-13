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
import type { TrendLineSpec } from '../data/types';

/**
 * Renders sloped lines (impulse legs, trend backbones, structure breaks)
 * between arbitrary (time, price) points on a series.
 */
export class TrendLinesPlugin implements ISeriesPrimitive<Time> {
  private readonly _lines: TrendLineSpec[];
  private readonly _view: TrendLinesPaneView;
  private _chart: IChartApi | null = null;
  private _series: ISeriesApi<'Candlestick'> | null = null;

  constructor(lines: TrendLineSpec[]) {
    this._lines = lines;
    this._view = new TrendLinesPaneView(this);
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

  get lines(): TrendLineSpec[] {
    return this._lines;
  }

  get chart(): IChartApi | null {
    return this._chart;
  }

  get series(): ISeriesApi<'Candlestick'> | null {
    return this._series;
  }
}

class TrendLinesPaneView implements IPrimitivePaneView {
  private readonly _source: TrendLinesPlugin;

  constructor(source: TrendLinesPlugin) {
    this._source = source;
  }

  renderer(): IPrimitivePaneRenderer {
    return new TrendLinesPaneRenderer(this._source);
  }
}

class TrendLinesPaneRenderer implements IPrimitivePaneRenderer {
  private readonly _source: TrendLinesPlugin;

  constructor(source: TrendLinesPlugin) {
    this._source = source;
  }

  draw(target: CanvasRenderingTarget2D): void {
    const { chart, series, lines } = this._source;
    if (!chart || !series || lines.length === 0) return;

    const timeScale = chart.timeScale();

    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      const hpr = scope.horizontalPixelRatio;
      const vpr = scope.verticalPixelRatio;

      for (const line of lines) {
        const from = line.from;
        const to = line.to;
        const x1 = timeScale.timeToCoordinate(from.time);
        const y1 = series.priceToCoordinate(from.price);
        const x2 = timeScale.timeToCoordinate(to.time);
        const y2 = series.priceToCoordinate(to.price);

        // Skip lines with an endpoint outside the visible range.
        if (x1 === null || x2 === null || y1 === null || y2 === null) continue;

        const width = Math.max(1, Math.floor((line.lineWidth ?? 1.5) * hpr));
        ctx.lineWidth = width;
        ctx.strokeStyle = line.color;
        ctx.lineCap = 'round';
        if (line.dashed) {
          ctx.setLineDash([6 * hpr, 5 * hpr]);
        } else {
          ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.moveTo(x1 * hpr, y1 * vpr);
        ctx.lineTo(x2 * hpr, y2 * vpr);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    });
  }
}
