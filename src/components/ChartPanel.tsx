import { useEffect, useRef, useState } from 'react';
import {
  CandlestickSeries,
  HistogramSeries,
  createSeriesMarkers,
  LineStyle,
  createChart,
  ColorType,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type ISeriesPrimitive,
  type Time,
  type MouseEventParams,
} from 'lightweight-charts';
import type { ConceptScenario, IndicatorType, Language, Timeframe } from '../data/types';
import { UI, pickLang } from '../i18n/ui';
import { TrendLinesPlugin } from '../chart/TrendLinesPlugin';
import { ZonesPlugin } from '../chart/ZonesPlugin';
import { BollingerBandsPlugin } from '../chart/BollingerBandsPlugin';
import { IchimokuPlugin } from '../chart/IchimokuPlugin';
import { VolumeProfilePlugin } from '../chart/VolumeProfilePlugin';
import { candlestickOptions, chartOptions } from '../chart/theme';

interface ChartPanelProps {
  scenario: ConceptScenario;
  /** Active UI language — marker labels switch between Thai and English. */
  lang: Language;
  theme?: 'light' | 'dark';
  /** Selected timeframe — drives the time-axis zoom / intraday visibility. */
  tf?: Timeframe;
  /** Fired when the user picks a timeframe in the chart's TF control. */
  onTfChange?: (tf: Timeframe) => void;
}

/** Timeframe buttons shown on the chart — label + i18n key for the tooltip. */
const TIMEFRAME_OPTIONS: Array<{ value: Timeframe; label: string; titleKey: keyof typeof UI }> = [
  { value: 'm5', label: 'M5', titleKey: 'timeframeM5' },
  { value: 'm15', label: 'M15', titleKey: 'timeframeM15' },
  { value: 'h1', label: 'H1', titleKey: 'timeframeH1' },
  { value: 'h4', label: 'H4', titleKey: 'timeframeH4' },
  { value: 'd1', label: 'D1', titleKey: 'timeframeD1' },
];


/** Colors for the Entry / Stop Loss / Take Profit price lines. */
const ENTRY_COLOR = '#0ecb81';
const SL_COLOR = '#f6465d';
const TP_COLOR = '#4f8cff';

/** Creates an Entry/SL/TP price line via the series' createPriceLine API. */
function createTradePriceLine(
  series: ISeriesApi<'Candlestick'>,
  price: number,
  color: string,
  title: string,
  dashed: boolean,
): IPriceLine {
  return series.createPriceLine({
    price: price,
    color,
    lineWidth: dashed ? 1 : 2,
    lineStyle: dashed ? LineStyle.Dashed : LineStyle.Solid,
    axisLabelVisible: true,
    title,
  });
}

/**
 * Zooms the time scale around the current visible center (v5 API — `zoom()`
 * was removed; `factor < 1` zooms in, `factor > 1` zooms out).
 */
function zoomChart(chart: IChartApi | null, factor: number): void {
  if (!chart) return;
  const timeScale = chart.timeScale();
  const range = timeScale.getVisibleLogicalRange();
  if (!range) return;
  const { from, to } = range;
  const width = to - from;
  const center = (from + to) / 2;
  const next = width * factor;
  timeScale.setVisibleLogicalRange({ from: center - next / 2, to: center + next / 2 });
}

/** Maps indicator flags to their plugin constructors. */
function createIndicatorPlugin(
  type: IndicatorType,
  candles: ConceptScenario['candles'],
): ISeriesPrimitive<Time> {
  switch (type) {
    case 'ichimoku':
      return new IchimokuPlugin(candles);
    case 'bollinger':
      return new BollingerBandsPlugin(candles);
    case 'volumeProfile':
      return new VolumeProfilePlugin(candles);
  }
}

/**
 * Right panel — the interactive chart. Creates the lightweight-charts
 * instance once, then re-applies data + overlays whenever the scenario
 * changes (concept click in the Learning Hub).
 */
export function ChartPanel({ scenario, lang, theme = 'dark', tf = 'h1', onTfChange }: ChartPanelProps) {
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [isReplay, setIsReplay] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  
  // Trade Simulator States
  const [draftOrder, setDraftOrder] = useState<{ type: 'long' | 'short'; entry: number; sl: number; tp: number } | null>(null);
  const [editTarget, setEditTarget] = useState<'entry' | 'sl' | 'tp' | null>(null);
  const [position, setPosition] = useState<{ 
    type: 'long' | 'short'; 
    entry: number; 
    sl: number; 
    tp: number;
    status: 'pending' | 'open' | 'win' | 'loss';
    pnl: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const primitivesRef = useRef<ISeriesPrimitive<Time>[]>([]);
  const basePriceLinesRef = useRef<IPriceLine[]>([]);
  const tradeLinesRef = useRef<IPriceLine[]>([]);
  
  // Refs for smooth drag without React re-renders
  const editTargetRef = useRef<'entry' | 'sl' | 'tp' | null>(null);
  const draftEntryLineRef = useRef<IPriceLine | null>(null);
  const draftSlLineRef = useRef<IPriceLine | null>(null);
  const draftTpLineRef = useRef<IPriceLine | null>(null);
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
    window.addEventListener('click', closeContextMenu);
    return () => window.removeEventListener('click', closeContextMenu);
  }, []);

  // Reset replay and position state when scenario changes
  useEffect(() => {
    setIsReplay(false);
    setPosition(null);
    setDraftOrder(null);
    setEditTarget(null);
    setReplayIndex(Math.floor(scenario.candles.length * 0.45)); // Start at 45% of the chart
  }, [scenario]);

  // Sync ref so the event listeners can read the latest target without re-binding
  useEffect(() => {
    editTargetRef.current = editTarget;
  }, [editTarget]);

  // Create / destroy the chart instance (runs once on mount).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, chartOptions);
    const series = chart.addSeries(CandlestickSeries, candlestickOptions);

    chartRef.current = chart;
    seriesRef.current = series;

    // --- Attach Interaction Handlers (Drag & Drop Trade Lines) ---
    const moveHandler = (param: MouseEventParams) => {
      const target = editTargetRef.current;
      if (!target || !param.point) return;
      const price = series.coordinateToPrice(param.point.y);
      if (price !== null) {
        // Smoothly move the line natively
        if (target === 'entry' && draftEntryLineRef.current) draftEntryLineRef.current.applyOptions({ price });
        if (target === 'sl' && draftSlLineRef.current) draftSlLineRef.current.applyOptions({ price });
        if (target === 'tp' && draftTpLineRef.current) draftTpLineRef.current.applyOptions({ price });
      }
    };

    const clickHandler = (param: MouseEventParams) => {
      const target = editTargetRef.current;
      if (!target || !param.point) return;
      const price = series.coordinateToPrice(param.point.y);
      if (price !== null) {
        setDraftOrder(prev => prev ? { ...prev, [target]: price } : null);
        setEditTarget(null); // Lock the line in place
      }
    };

    chart.subscribeCrosshairMove(moveHandler);
    chart.subscribeClick(clickHandler);
    // -------------------------------------------------------------

    return () => {
      chart.unsubscribeCrosshairMove(moveHandler);
      chart.unsubscribeClick(clickHandler);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeRef.current = null;
      markersRef.current = null;
      primitivesRef.current = [];
      basePriceLinesRef.current = [];
      tradeLinesRef.current = [];
    };
  }, []);

  // Update chart theme when `theme` changes
  useEffect(() => {
    if (!chartRef.current) return;
    const isLight = theme === 'light';
    chartRef.current.applyOptions({
      layout: { 
        textColor: isLight ? '#475569' : '#94a3b8',
        background: { type: ColorType.Solid, color: isLight ? '#f8fafc' : '#07080b' }
      },
      grid: {
        vertLines: { color: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)' },
      },
    });
  }, [theme]);

  // 1. Data and Volume Series (runs when scenario candles/volume change or replay advances)
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const visibleCandles = isReplay ? scenario.candles.slice(0, replayIndex) : scenario.candles;
    series.setData(visibleCandles);

    if (scenario.showVolume) {
      if (!volumeRef.current) {
        const volume = chart.addSeries(HistogramSeries, {
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume',
          lastValueVisible: false,
          priceLineVisible: false,
        });
        chart.priceScale('volume').applyOptions({
          scaleMargins: { top: 0.82, bottom: 0 },
        });
        volumeRef.current = volume;
      }
      volumeRef.current.setData(
        visibleCandles.map((c) => ({
          time: c.time,
          value: c.volume ?? 0,
          color: c.close >= c.open ? 'rgba(14, 203, 129, 0.45)' : 'rgba(246, 70, 93, 0.45)',
        })),
      );
    } else if (volumeRef.current) {
      chart.removeSeries(volumeRef.current);
      volumeRef.current = null;
    }

    // Timeframe engine already sets timeVisible per TF.
    chart.applyOptions({ timeScale: { timeVisible: scenario.timeVisible ?? false } });

    // Note: We deliberately do NOT call fitContent() here when replayIndex changes.
    // If we did, the chart would zoom out and ruin the user's manual zoom every time they click "Next Candle".
  }, [scenario.candles, scenario.showVolume, scenario.timeVisible, isReplay, replayIndex]);

  // Fit content ONLY when switching to a completely new scenario (when the base candles array reference changes).
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [scenario.candles]);

  // 2. Overlays, Markers, and Indicators (runs when scenario features, lang, showAnalysis, or replay changes)
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const visibleCandles = isReplay ? scenario.candles.slice(0, replayIndex) : scenario.candles;
    const lastVisibleTime = visibleCandles.length > 0 ? visibleCandles[visibleCandles.length - 1].time : '';

    // Tear down overlays from the previous render.
    markersRef.current?.detach();
    markersRef.current = null;
    for (const primitive of primitivesRef.current) {
      series.detachPrimitive(primitive);
    }
    primitivesRef.current = [];
    for (const line of basePriceLinesRef.current) {
      series.removePriceLine(line);
    }
    basePriceLinesRef.current = [];

    // 4. Indicator overlays (Ichimoku cloud, Bollinger bands, volume profile).
    if (showAnalysis) {
      for (const indicator of scenario.indicators ?? []) {
        const primitive = createIndicatorPlugin(indicator, scenario.candles);
        series.attachPrimitive(primitive);
        primitivesRef.current.push(primitive);
      }

      // 5. Concept markers / zones / trend lines / price levels.
      if (scenario.markers && scenario.markers.length > 0) {
        // In replay mode, only show markers up to the current visible candle
        const filteredMarkers = isReplay 
          ? scenario.markers.filter(m => m.time <= lastVisibleTime)
          : scenario.markers;
        
        if (filteredMarkers.length > 0) {
          markersRef.current = createSeriesMarkers(
            series,
            filteredMarkers.map((m) => ({ ...m, text: pickLang(m.text, lang) })),
          );
        }
      }

      if (scenario.zones && scenario.zones.length > 0) {
        const primitive = new ZonesPlugin(scenario.zones);
        series.attachPrimitive(primitive);
        primitivesRef.current.push(primitive);
      }

      if (scenario.trendLines && scenario.trendLines.length > 0) {
        const primitive = new TrendLinesPlugin(scenario.trendLines);
        series.attachPrimitive(primitive);
        primitivesRef.current.push(primitive);
      }

      for (const level of scenario.priceLines ?? []) {
        basePriceLinesRef.current.push(
          series.createPriceLine({
            price: level.price,
            color: level.color,
            lineWidth: 1,
            lineStyle: level.dashed ? LineStyle.Dashed : LineStyle.Solid,
            axisLabelVisible: true,
            title: level.title,
          }),
        );
      }
    }
  }, [scenario, lang, showAnalysis, isReplay, replayIndex]);

  // 3. Trade and Position Lines (Separated to prevent lagging when dragging lines)
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    // Tear down only trade lines
    for (const line of tradeLinesRef.current) {
      series.removePriceLine(line);
    }
    tradeLinesRef.current = [];
    draftEntryLineRef.current = null;
    draftSlLineRef.current = null;
    draftTpLineRef.current = null;

    if (showAnalysis) {
      // Trade plans get explicit Entry (green) / SL (red) / TP (blue) lines.
      // In replay mode, hide the playbook's trade plan so the user can guess!
      if (scenario.trade && !isReplay) {
        const { entry, sl, tp } = scenario.trade;
        tradeLinesRef.current.push(createTradePriceLine(series, entry.price, ENTRY_COLOR, 'Entry', false));
        tradeLinesRef.current.push(createTradePriceLine(series, sl.price, SL_COLOR, 'SL', true));
        tradeLinesRef.current.push(createTradePriceLine(series, tp.price, TP_COLOR, 'TP', true));
      }

      // Draw the user's drafted order lines
      if (draftOrder && !position) {
        draftEntryLineRef.current = createTradePriceLine(series, draftOrder.entry, draftOrder.type === 'long' ? ENTRY_COLOR : SL_COLOR, 'Draft Entry', true);
        draftSlLineRef.current = createTradePriceLine(series, draftOrder.sl, SL_COLOR, 'Draft SL', true);
        draftTpLineRef.current = createTradePriceLine(series, draftOrder.tp, TP_COLOR, 'Draft TP', true);
        
        tradeLinesRef.current.push(draftEntryLineRef.current);
        tradeLinesRef.current.push(draftSlLineRef.current);
        tradeLinesRef.current.push(draftTpLineRef.current);
      }

      // Draw the user's active position lines
      if (position) {
        tradeLinesRef.current.push(createTradePriceLine(series, position.entry, position.type === 'long' ? ENTRY_COLOR : SL_COLOR, position.status === 'pending' ? 'LIMIT ORDER' : 'MY ENTRY', position.status === 'pending'));
        if (position.sl) tradeLinesRef.current.push(createTradePriceLine(series, position.sl, SL_COLOR, 'MY SL', true));
        if (position.tp) tradeLinesRef.current.push(createTradePriceLine(series, position.tp, TP_COLOR, 'MY TP', true));
      }
    }
  }, [scenario.trade, showAnalysis, isReplay, draftOrder, position]);

  const trade = scenario.trade;
  const long = trade?.direction === 'long';

  // Process Replay logic & Calculate PnL
  const visibleCandles = isReplay ? scenario.candles.slice(0, replayIndex) : scenario.candles;
  const currentCandle = visibleCandles.length > 0 ? visibleCandles[visibleCandles.length - 1] : null;
  const currentPrice = currentCandle?.close ?? 0;
  
  let pnl = 0;
  if (position && position.status === 'open') {
    pnl = position.type === 'long' ? currentPrice - position.entry : position.entry - currentPrice;
  } else if (position && (position.status === 'win' || position.status === 'loss')) {
    pnl = position.pnl;
  }

  // Handle Position triggers on Next Candle
  useEffect(() => {
    if (!position || !currentCandle || !isReplay) return;
    
    // Check Limit Order Entry
    if (position.status === 'pending') {
      const hitLong = position.type === 'long' && currentCandle.low <= position.entry;
      const hitShort = position.type === 'short' && currentCandle.high >= position.entry;
      if (hitLong || hitShort) {
        setPosition(p => p ? { ...p, status: 'open' } : null);
      }
    }
    
    // Check SL / TP
    if (position.status === 'open') {
      let closed = false;
      let finalPnl = 0;
      let status: 'win' | 'loss' = 'loss';

      if (position.type === 'long') {
        if (currentCandle.low <= position.sl) { closed = true; finalPnl = position.sl - position.entry; status = 'loss'; }
        else if (currentCandle.high >= position.tp) { closed = true; finalPnl = position.tp - position.entry; status = 'win'; }
      } else {
        if (currentCandle.high >= position.sl) { closed = true; finalPnl = position.entry - position.sl; status = 'loss'; }
        else if (currentCandle.low <= position.tp) { closed = true; finalPnl = position.entry - position.tp; status = 'win'; }
      }

      if (closed) {
        setPosition(p => p ? { ...p, status, pnl: finalPnl } : null);
      }
    }
  }, [replayIndex]);

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-transparent">
      {/* Status bar — trade direction, R:R and the Entry / SL / TP legend (Hidden in Replay) */}
      {trade && !isReplay && (
        <div className="flex flex-wrap items-center gap-1.5 px-3 pt-3">
          <span
            className={`flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-xs font-bold tracking-wider ${
              long ? 'border-bull/40 bg-bull/10 text-bull' : 'border-bear/40 bg-bear/10 text-bear'
            }`}
          >
            {long ? '▲ LONG' : '▼ SHORT'}
          </span>
          <span className="rounded-md border border-accent/30 bg-accent/10 px-2 py-1 font-mono text-xs font-bold text-accent">
            R:R {trade.riskReward}
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-edge bg-panel-2 px-2 py-1 font-mono text-xs">
            <span className="h-2 w-2 rounded-full bg-[#0ecb81]" />
            <span className="text-muted">Entry</span>
            <span className="font-bold text-main">{trade.entry.price.toFixed(1)}</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-edge bg-panel-2 px-2 py-1 font-mono text-xs">
            <span className="h-2 w-2 rounded-full bg-[#f6465d]" />
            <span className="text-muted">SL</span>
            <span className="font-bold text-main">{trade.sl.price.toFixed(1)}</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-edge bg-panel-2 px-2 py-1 font-mono text-xs">
            <span className="h-2 w-2 rounded-full bg-[#4f8cff]" />
            <span className="text-muted">TP</span>
            <span className="font-bold text-main">{trade.tp.price.toFixed(1)}</span>
          </span>
        </div>
      )}

      {/* Chart canvas (auto-resizes with the container via autoSize). */}
      {/* Fixed height on mobile so `h-full` always resolves; flex-1 on desktop. */}
      <div 
        className="relative h-[420px] shrink-0 p-3 pb-0 lg:h-auto lg:min-h-0 lg:shrink lg:flex-1"
        onContextMenu={handleContextMenu}
      >
        <div
          ref={containerRef}
          className="h-full w-full overflow-hidden rounded-xl border border-edge"
        />
        {/* Timeframe selector — M5 / M15 / H1 / H4 / D1 */}
        <div className="absolute left-5 top-5 z-10 flex items-center overflow-hidden rounded-lg border border-edge bg-panel-2/95 shadow-lg backdrop-blur">
          {TIMEFRAME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-label={`${pickLang(UI.timeframe, lang)} ${opt.label}`}
              title={pickLang(UI[opt.titleKey], lang)}
              onClick={() => onTfChange?.(opt.value)}
              className={`h-8 px-2.5 font-mono text-xs font-bold transition-colors active:scale-95 ${
                tf === opt.value
                  ? 'bg-accent text-main'
                  : 'text-muted hover:bg-panel-1 hover:text-main'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {/* Zoom & Toggle controls */}
        <div className="absolute right-5 top-5 flex flex-col overflow-hidden rounded-lg border border-edge bg-panel-2/95 shadow-lg backdrop-blur z-10">
          <button
            type="button"
            aria-label={pickLang({ en: 'Toggle Analysis', th: 'เปิด/ปิด การวิเคราะห์' }, lang)}
            title={pickLang({ en: 'Toggle Analysis', th: 'เปิด/ปิด การวิเคราะห์' }, lang)}
            onClick={() => setShowAnalysis(!showAnalysis)}
            className={`flex h-8 w-8 items-center justify-center text-sm transition-colors hover:bg-panel-1 hover:text-main active:scale-95 ${showAnalysis ? 'text-accent' : 'text-muted'}`}
          >
            {showAnalysis ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            )}
          </button>
          <div className="mx-1.5 h-px bg-edge" />
          <button
            type="button"
            aria-label={pickLang(UI.zoomIn, lang)}
            title={pickLang(UI.zoomIn, lang)}
            onClick={() => zoomChart(chartRef.current, 0.5)}
            className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:bg-panel-1 hover:text-main active:scale-95"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5v14" />
            </svg>
          </button>
          <div className="mx-1.5 h-px bg-edge" />
          <button
            type="button"
            aria-label={pickLang(UI.zoomOut, lang)}
            title={pickLang(UI.zoomOut, lang)}
            onClick={() => zoomChart(chartRef.current, 2)}
            className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:bg-panel-1 hover:text-main active:scale-95"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
            </svg>
          </button>
          <div className="mx-1.5 h-px bg-edge" />
          <button
            type="button"
            aria-label={pickLang({ en: 'Bar Replay', th: 'เปิด/ปิด โหมดจำลอง' }, lang)}
            title={pickLang({ en: 'Bar Replay', th: 'เปิด/ปิด โหมดจำลอง' }, lang)}
            onClick={() => setIsReplay(!isReplay)}
            className={`flex h-8 w-8 items-center justify-center transition-colors active:scale-95 ${isReplay ? 'bg-accent text-main' : 'text-muted hover:bg-panel-1 hover:text-main'}`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
          <div className="mx-1.5 h-px bg-edge" />
          <button
            type="button"
            aria-label={pickLang(UI.zoomReset, lang)}
            title={pickLang(UI.zoomReset, lang)}
            onClick={() => {
              if (chartRef.current) {
                chartRef.current.priceScale('right').applyOptions({ autoScale: true });
                chartRef.current.timeScale().fitContent();
              }
            }}
            className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:bg-panel-1 hover:text-main active:scale-95"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
        {/* Replay Controls or Hint bar */}
        {isReplay ? (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex w-[95%] max-w-[340px] flex-col items-center gap-2.5 z-10 animate-in slide-in-from-bottom-4 sm:bottom-6 sm:max-w-md sm:w-auto">
            
            {/* Draft Order Panel */}
            {draftOrder && !position && (
              <div className="flex w-full flex-col items-center gap-2.5 rounded-2xl border border-accent/40 bg-panel-2/95 p-2.5 shadow-2xl backdrop-blur-md sm:w-auto sm:p-3 sm:px-4">
                <div className="text-[11px] font-bold text-accent animate-pulse sm:text-xs">
                  {editTarget ? 'กำลังเลื่อนเมาส์เพื่อวางเส้น... (คลิกกราฟเพื่อยืนยัน)' : 'คลิกปุ่มเพื่อหยิบเส้นไปวางบนกราฟ'}
                </div>
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex w-full gap-1.5 sm:w-auto">
                    <button onClick={() => setEditTarget('entry')} className={`flex flex-1 flex-col items-center justify-center rounded-lg px-2 py-1.5 text-[10px] border sm:flex-none sm:px-3 sm:text-xs transition-all active:scale-95 ${editTarget === 'entry' ? 'border-accent bg-accent/20 text-accent ring-1 ring-accent' : 'border-edge hover:bg-panel-1 text-main'}`}>
                      <span className="text-muted text-[9px] sm:text-[10px]">ENTRY</span>
                      <span className="font-mono font-bold">{draftOrder.entry.toFixed(1)}</span>
                    </button>
                    <button onClick={() => setEditTarget('sl')} className={`flex flex-1 flex-col items-center justify-center rounded-lg px-2 py-1.5 text-[10px] border sm:flex-none sm:px-3 sm:text-xs transition-all active:scale-95 ${editTarget === 'sl' ? 'border-bear bg-bear/20 text-bear ring-1 ring-bear' : 'border-edge hover:bg-panel-1 text-main'}`}>
                      <span className="text-muted text-[9px] sm:text-[10px]">SL</span>
                      <span className="font-mono font-bold">{draftOrder.sl.toFixed(1)}</span>
                    </button>
                    <button onClick={() => setEditTarget('tp')} className={`flex flex-1 flex-col items-center justify-center rounded-lg px-2 py-1.5 text-[10px] border sm:flex-none sm:px-3 sm:text-xs transition-all active:scale-95 ${editTarget === 'tp' ? 'border-bull bg-bull/20 text-bull ring-1 ring-bull' : 'border-edge hover:bg-panel-1 text-main'}`}>
                      <span className="text-muted text-[9px] sm:text-[10px]">TP</span>
                      <span className="font-mono font-bold">{draftOrder.tp.toFixed(1)}</span>
                    </button>
                  </div>
                  <div className="flex w-full gap-1.5 sm:w-auto">
                    <button 
                      onClick={() => {
                        setPosition({ ...draftOrder, status: 'pending', pnl: 0 });
                        setDraftOrder(null);
                        setEditTarget(null);
                      }}
                      className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 sm:flex-none sm:px-5 sm:text-sm ${draftOrder.type === 'long' ? 'bg-bull hover:bg-bull/80 shadow-bull/20' : 'bg-bear hover:bg-bear/80 shadow-bear/20'}`}
                    >
                      PLACE ORDER
                    </button>
                    <button onClick={() => { setDraftOrder(null); setEditTarget(null); }} className="flex w-10 items-center justify-center rounded-lg bg-panel-1 text-muted hover:bg-bear hover:text-white transition-colors active:scale-95">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Position PnL Floating Badge */}
            {position && (
              <div className={`flex w-full flex-wrap items-center justify-center gap-2 rounded-xl border px-3 py-2 shadow-2xl backdrop-blur-md sm:w-auto sm:gap-4 sm:rounded-full sm:px-5 sm:py-2.5 ${position.status === 'win' ? 'border-bull/50 bg-bull/10' : position.status === 'loss' ? 'border-bear/50 bg-bear/10' : 'border-edge bg-panel-2/95'}`}>
                 <span className={`flex items-center gap-1.5 text-xs font-bold tracking-wider sm:text-sm ${position.type === 'long' ? 'text-bull' : 'text-bear'}`}>
                   {position.status === 'pending' ? '⏳ PENDING' : position.status === 'win' ? '🎯 TP HIT' : position.status === 'loss' ? '❌ SL HIT' : position.type === 'long' ? '▲ LONG' : '▼ SHORT'}
                 </span>
                 <span className="text-[10px] font-medium text-muted sm:text-sm">@ {position.entry.toFixed(1)}</span>
                 {position.status !== 'pending' && (
                   <span className={`font-mono text-sm font-bold sm:text-lg ${pnl > 0 ? 'text-bull' : pnl < 0 ? 'text-bear' : 'text-main'}`}>
                      {pnl > 0 ? '+' : ''}{pnl.toFixed(1)} pts
                   </span>
                 )}
                 <button 
                   onClick={() => setPosition(null)} 
                   className="ml-auto rounded-lg bg-edge px-2 py-1 text-[10px] font-bold text-main transition-colors hover:bg-bear hover:text-white sm:ml-2 sm:px-3 sm:py-1.5 sm:text-xs"
                 >
                    {position.status === 'open' ? 'CLOSE' : 'CLEAR'}
                 </button>
              </div>
            )}

            {/* Main Replay Controls */}
            <div className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-panel-2/95 px-2 py-1.5 shadow-xl backdrop-blur-md sm:gap-2 sm:px-3 sm:py-2">
              
              <button
                onClick={() => { setIsReplay(false); setPosition(null); setDraftOrder(null); setEditTarget(null); }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-panel-1 text-muted hover:bg-bear hover:text-white transition-colors sm:h-9 sm:w-9"
                title="Exit Replay"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>
              </button>
              
              <div className="h-5 w-px bg-edge" />
              
              {!position && !draftOrder && (
                <>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button 
                      onClick={() => setDraftOrder({ type: 'long', entry: currentPrice, sl: currentPrice - 20, tp: currentPrice + 40 })} 
                      className="flex h-8 items-center justify-center gap-1.5 rounded-full bg-bull/10 px-3.5 text-[11px] font-bold text-bull transition-all hover:bg-bull hover:text-white active:scale-95 sm:h-9 sm:px-5 sm:text-sm"
                    >
                      ▲ LONG
                    </button>
                    <button 
                      onClick={() => setDraftOrder({ type: 'short', entry: currentPrice, sl: currentPrice + 20, tp: currentPrice - 40 })} 
                      className="flex h-8 items-center justify-center gap-1.5 rounded-full bg-bear/10 px-3.5 text-[11px] font-bold text-bear transition-all hover:bg-bear hover:text-white active:scale-95 sm:h-9 sm:px-5 sm:text-sm"
                    >
                      ▼ SHORT
                    </button>
                  </div>
                  <div className="h-5 w-px bg-edge" />
                </>
              )}

              <button
                onClick={() => {
                  if (replayIndex < scenario.candles.length - 1) setReplayIndex(r => r + 1);
                  else { setIsReplay(false); setPosition(null); setDraftOrder(null); }
                }}
                className={`flex h-8 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold transition-all sm:h-9 sm:px-6 sm:text-sm ${position && position.status !== 'open' && position.status !== 'pending' ? 'bg-panel-1 text-muted' : 'bg-accent text-main hover:opacity-90 shadow-lg active:scale-95'}`}
                disabled={position?.status === 'win' || position?.status === 'loss'}
              >
                <span className="hidden sm:inline">{lang === 'en' ? 'Next Candle' : 'แท่งถัดไป'}</span>
                <span className="sm:hidden">{lang === 'en' ? 'Next' : 'ถัดไป'}</span>
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-edge bg-panel-2/80 px-2.5 py-1 text-[11px] text-muted backdrop-blur z-10">
            {pickLang(UI.zoomHint, lang)}
          </div>
        )}

        {/* Custom Context Menu */}
        {contextMenu && (
          <div 
            className="fixed z-50 min-w-[160px] rounded-lg border border-edge bg-panel/95 shadow-xl backdrop-blur-md p-1 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-main hover:bg-accent hover:text-white transition-colors"
              onClick={() => {
                if (chartRef.current) {
                  chartRef.current.priceScale('right').applyOptions({ autoScale: true });
                  chartRef.current.timeScale().fitContent();
                }
              }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              {lang === 'en' ? 'Reset Chart View' : 'รีเซ็ตมุมมองกราฟ'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
