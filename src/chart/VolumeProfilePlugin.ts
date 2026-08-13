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
import { computeVolumeProfile } from '../data/indicators';
import type { Candle } from '../data/types';

interface VolumeProfileOptions {
  /** Number of price buckets. */
  bucketCount?: number;
  /** Max width of the profile bars, in media pixels. */
  maxBarWidth?: number;
}

const POC_COLOR = '#fbbf24';
const FAR_COLOR = '#232c3d';

/**
 * Draws a volume profile on the right edge of the pane. Bars are colored
 * by proximity to the Point of Control (POC) — hot near the POC, fading away.
 */
export class VolumeProfilePlugin implements ISeriesPrimitive<Time> {
  private readonly _candles: Candle[];
  private readonly _options: VolumeProfileOptions;
  private readonly _view: VolumeProfilePaneView;
  private _chart: IChartApi | null = null;
  private _series: ISeriesApi<'Candlestick'> | null = null;

  constructor(candles: Candle[], options: VolumeProfileOptions = {}) {
    this._candles = candles;
    this._options = options;
    this._view = new VolumeProfilePaneView(this);
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

  get options(): VolumeProfileOptions {
    return this._options;
  }

  get chart(): IChartApi | null {
    return this._chart;
  }

  get series(): ISeriesApi<'Candlestick'> | null {
    return this._series;
  }
}

class VolumeProfilePaneView implements IPrimitivePaneView {
  private readonly _source: VolumeProfilePlugin;

  constructor(source: VolumeProfilePlugin) {
    this._source = source;
  }

  renderer(): IPrimitivePaneRenderer {
    return new VolumeProfilePaneRenderer(this._source);
  }
}

class VolumeProfilePaneRenderer implements IPrimitivePaneRenderer {
  private readonly _source: VolumeProfilePlugin;

  constructor(source: VolumeProfilePlugin) {
    this._source = source;
  }

  draw(target: CanvasRenderingTarget2D): void {
    const { chart, series, candles, options } = this._source;
    if (!chart || !series || candles.length === 0) return;

    const profile = computeVolumeProfile(candles, options.bucketCount ?? 24);
    if (profile.buckets.length === 0 || profile.maxVolume <= 0) return;

    const maxBarWidth = options.maxBarWidth ?? 90;

    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      const hpr = scope.horizontalPixelRatio;
      const vpr = scope.verticalPixelRatio;
      const bitmapWidth = scope.bitmapSize.width;

      const rightEdge = bitmapWidth - 4 * hpr;
      const sizePerBucket = profile.buckets[1].price - profile.buckets[0].price;
      const halfBucketPx = Math.max(1, (sizePerBucket / 2) * vpr);

      const pocIndex = profile.buckets.findIndex((b) => b.volume === profile.maxVolume);
      const maxDist = Math.max(pocIndex, profile.buckets.length - 1 - pocIndex);

      for (let i = 0; i < profile.buckets.length; i++) {
        const bucket = profile.buckets[i];
        const yCenter = series.priceToCoordinate(bucket.price);
        if (yCenter === null) continue;

        const length = (bucket.volume / profile.maxVolume) * maxBarWidth;
        const t = maxDist > 0 ? Math.abs(i - pocIndex) / maxDist : 0;
        ctx.fillStyle = mixHex(POC_COLOR, FAR_COLOR, t);

        const left = rightEdge - length * hpr;
        ctx.fillRect(left, (yCenter - halfBucketPx) * vpr, length * hpr, halfBucketPx * 2);
      }
    });
  }
}

/** Mixes two hex colors; t = 0 → a, t = 1 → b. */
function mixHex(a: string, b: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const ca = parse(a);
  const cb = parse(b);
  const ch = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `rgb(${ch[0]}, ${ch[1]}, ${ch[2]})`;
}
