import { ColorType, CrosshairMode, LineStyle, type DeepPartial, type ChartOptions, type CandlestickSeriesPartialOptions } from 'lightweight-charts';

/** Dark trading-terminal palette for the chart. */
export const CHART_BG = 'transparent';
export const CHART_GRID = 'rgba(255, 255, 255, 0.04)';
export const CHART_BORDER = 'rgba(255, 255, 255, 0.08)';

export const chartOptions: DeepPartial<ChartOptions> = {
  autoSize: true,
  layout: {
    background: { type: ColorType.Solid, color: 'transparent' },
    textColor: '#94a3b8',
    fontSize: 12,
    attributionLogo: false,
  },
  grid: {
    vertLines: { color: CHART_GRID },
    horzLines: { color: CHART_GRID },
  },
  crosshair: {
    mode: CrosshairMode.Magnet,
    vertLine: { 
      color: 'rgba(245, 158, 11, 0.6)', 
      width: 1, 
      style: LineStyle.Dashed, 
      labelBackgroundColor: '#f59e0b' 
    },
    horzLine: { 
      color: 'rgba(245, 158, 11, 0.6)', 
      width: 1, 
      style: LineStyle.Dashed, 
      labelBackgroundColor: '#f59e0b' 
    },
  },
  // Explicitly enable mouse-wheel / pinch zoom and drag-to-pan.
  handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
  handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
  rightPriceScale: { 
    borderColor: CHART_BORDER,
    scaleMargins: { top: 0.15, bottom: 0.15 }
  },
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
