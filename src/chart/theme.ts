import { ColorType, CrosshairMode, type DeepPartial, type ChartOptions, type CandlestickSeriesPartialOptions } from 'lightweight-charts';

/** Dark trading-terminal palette for the chart. */
export const CHART_BG = '#10141d';
export const CHART_GRID = 'rgba(31, 38, 52, 0.55)';
export const CHART_BORDER = '#1f2634';

export const chartOptions: DeepPartial<ChartOptions> = {
  autoSize: true,
  layout: {
    background: { type: ColorType.Solid, color: CHART_BG },
    textColor: '#8b94a7',
    fontSize: 11,
    attributionLogo: false,
  },
  grid: {
    vertLines: { color: CHART_GRID },
    horzLines: { color: CHART_GRID },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: { color: '#3a4458', labelBackgroundColor: '#3a4458' },
    horzLine: { color: '#3a4458', labelBackgroundColor: '#3a4458' },
  },
  rightPriceScale: { borderColor: CHART_BORDER },
  timeScale: { borderColor: CHART_BORDER, rightOffset: 2 },
  localization: { locale: 'en-US' },
};

export const candlestickOptions: CandlestickSeriesPartialOptions = {
  upColor: '#0ecb81',
  downColor: '#f6465d',
  borderUpColor: '#0ecb81',
  borderDownColor: '#f6465d',
  wickUpColor: '#0ecb81',
  wickDownColor: '#f6465d',
};
