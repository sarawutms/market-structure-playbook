import { useEffect, useRef } from 'react';
import {
  CandlestickSeries,
  HistogramSeries,
  createSeriesMarkers,
  LineStyle,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type ISeriesPrimitive,
  type Time,
} from 'lightweight-charts';
import type { ConceptScenario, IndicatorType, Language, TradeLevel } from '../data/types';
import { pickLang } from '../i18n/ui';
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
}

/** Colors for the Entry / Stop Loss / Take Profit price lines. */
const ENTRY_COLOR = '#0ecb81';
const SL_COLOR = '#f6465d';
const TP_COLOR = '#4f8cff';

/** Creates an Entry/SL/TP price line via the series' createPriceLine API. */
function createTradePriceLine(
  series: ISeriesApi<'Candlestick'>,
  level: TradeLevel,
  color: string,
  title: string,
  dashed: boolean,
): IPriceLine {
  return series.createPriceLine({
    price: level.price,
    color,
    lineWidth: dashed ? 1 : 2,
    lineStyle: dashed ? LineStyle.Dashed : LineStyle.Solid,
    axisLabelVisible: true,
    title,
  });
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
export function ChartPanel({ scenario, lang }: ChartPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const primitivesRef = useRef<ISeriesPrimitive<Time>[]>([]);
  const priceLinesRef = useRef<IPriceLine[]>([]);

  // Create / destroy the chart instance (runs once on mount).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, chartOptions);
    const series = chart.addSeries(CandlestickSeries, candlestickOptions);

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeRef.current = null;
      markersRef.current = null;
      primitivesRef.current = [];
      priceLinesRef.current = [];
    };
  }, []);

  // Re-apply data + overlays whenever the scenario changes.
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    // 1. Tear down overlays from the previous scenario.
    markersRef.current?.detach();
    markersRef.current = null;
    for (const primitive of primitivesRef.current) {
      series.detachPrimitive(primitive);
    }
    primitivesRef.current = [];
    for (const line of priceLinesRef.current) {
      series.removePriceLine(line);
    }
    priceLinesRef.current = [];

    // 2. Push the new candle data.
    series.setData(scenario.candles);

    // 3. Volume histogram pane (for Wyckoff / VSA scenarios).
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
        scenario.candles.map((c) => ({
          time: c.time,
          value: c.volume ?? 0,
          color: c.close >= c.open ? 'rgba(14, 203, 129, 0.45)' : 'rgba(246, 70, 93, 0.45)',
        })),
      );
    } else if (volumeRef.current) {
      chart.removeSeries(volumeRef.current);
      volumeRef.current = null;
    }

    // 4. Indicator overlays (Ichimoku cloud, Bollinger bands, volume profile).
    for (const indicator of scenario.indicators ?? []) {
      const primitive = createIndicatorPlugin(indicator, scenario.candles);
      series.attachPrimitive(primitive);
      primitivesRef.current.push(primitive);
    }

    // 5. Concept markers / zones / trend lines / price levels.
    if (scenario.markers && scenario.markers.length > 0) {
      markersRef.current = createSeriesMarkers(
        series,
        scenario.markers.map((m) => ({ ...m, text: pickLang(m.text, lang) })),
      );
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
      priceLinesRef.current.push(
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

    // 5b. Trade plans get explicit Entry (green) / SL (red) / TP (blue) lines.
    if (scenario.trade) {
      const { entry, sl, tp } = scenario.trade;
      priceLinesRef.current.push(createTradePriceLine(series, entry, ENTRY_COLOR, 'Entry', false));
      priceLinesRef.current.push(createTradePriceLine(series, sl, SL_COLOR, 'SL', true));
      priceLinesRef.current.push(createTradePriceLine(series, tp, TP_COLOR, 'TP', true));
    }

    // 6. Intraday scenarios show the time-of-day on the axis.
    chart.applyOptions({ timeScale: { timeVisible: scenario.timeVisible ?? false } });

    // 7. Fit the whole scenario into view.
    chart.timeScale().fitContent();
  }, [scenario, lang]);

  const trade = scenario.trade;
  const long = trade?.direction === 'long';

  return (
    <div className="relative flex min-w-0 flex-1 flex-col bg-terminal">
      {/* Status bar — trade direction, R:R and the Entry / SL / TP legend */}
      {trade && (
        <div className="flex flex-wrap items-center gap-1.5 px-3 pt-3">
          <span
            className={`flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] font-bold tracking-wider ${
              long ? 'border-bull/40 bg-bull/10 text-bull' : 'border-bear/40 bg-bear/10 text-bear'
            }`}
          >
            {long ? '▲ LONG' : '▼ SHORT'}
          </span>
          <span className="rounded-md border border-accent/30 bg-accent/10 px-2 py-1 font-mono text-[11px] font-bold text-accent">
            R:R {trade.riskReward}
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-edge bg-panel-2 px-2 py-1 font-mono text-[11px]">
            <span className="h-2 w-2 rounded-full bg-[#0ecb81]" />
            <span className="text-dim">Entry</span>
            <span className="font-bold text-white">{trade.entry.price.toFixed(1)}</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-edge bg-panel-2 px-2 py-1 font-mono text-[11px]">
            <span className="h-2 w-2 rounded-full bg-[#f6465d]" />
            <span className="text-dim">SL</span>
            <span className="font-bold text-white">{trade.sl.price.toFixed(1)}</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-edge bg-panel-2 px-2 py-1 font-mono text-[11px]">
            <span className="h-2 w-2 rounded-full bg-[#4f8cff]" />
            <span className="text-dim">TP</span>
            <span className="font-bold text-white">{trade.tp.price.toFixed(1)}</span>
          </span>
        </div>
      )}

      {/* Chart canvas (auto-resizes with the container via autoSize). */}
      {/* Fixed height on mobile so `h-full` always resolves; flex-1 on desktop. */}
      <div className="h-[420px] flex-1 p-3 pb-0 lg:h-auto lg:min-h-[440px]">
        <div
          ref={containerRef}
          className="h-full w-full overflow-hidden rounded-xl border border-edge"
        />
      </div>
    </div>
  );
}
