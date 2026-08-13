# Market Structure Lab

An interactive educational web app for learning **price action** and
**Smart Money Concepts (SMC)**, plus Wyckoff, ICT, volume analysis and more —
all visualized on simulated candlestick charts.

Built with **React**, **TailwindCSS**, and **lightweight-charts** (TradingView).
Static site output (`dist/`) that deploys anywhere.

## Features

- **Bilingual UI (TH / EN)** — a language toggle in the top navigation bar
  switches every text element between Thai and English: sidebar categories
  and concept names, explanations, legends and the trade-plan cards. The
  four playbook setups carry nested `{ en, th }` text in the mock data;
  every other concept has Thai translations alongside the English source.
  Technical abbreviations (BOS, OB, FVG, SL, TP…) stay unchanged in both
  languages, and the UI uses the **Prompt** font family (Latin + Thai).
- **Trading Playbook (featured setups)** — a dedicated section at the top of
  the sidebar with **7 complete, tradable setups** on high-volatility,
  Gold/XAUUSD-like data (noticeable wicks and liquidity sweeps):
  1. **SMC Order Block with Liquidity Sweep** (long) — sweep → CHoCH → OB
  2. **FVG Fill** (long) — impulsive gap → fill → resume
  3. **Wyckoff Accumulation · Spring** (long) — SC → ST → Spring → entry
  4. **QML Reversal** (short) — HH/LL → neckline break → retest
  5. **Bearish Bat** (short) — XA impulse → D at 0.886 → PRZ entry
  6. **VSA Stopping Volume** (long) — climax at support → no demand → SOS
  7. **Uptrend Continuation** (long) — HH/HL → BOS → pullback entry

  Every setup draws **numbered ① ② ③ sequence markers** on the candles
  (`createSeriesMarkers`), **Entry (green), Stop Loss (red) and Take Profit
  (blue) price lines** via `createPriceLine`, and a three-part panel under the
  chart: **Concept Explanation**, **Chart Breakdown** (what happens at each
  numbered step) and the **Action Plan** with exact Entry / SL / TP
  conditions and the risk:reward.
- **Ultimate Master Index (left panel)** — searchable accordion of **47
  concepts** in 7 categories:
  1. **Trading Playbook** — the 7 featured setups
  2. **Basic Structure** — High/Low, Swing High/Low, HH/HL/LH/LL, EQH/EQL,
     Uptrend/Downtrend/Sideways, Impulse/Pullback, BOS/CHoCH/MSS,
     Internal/External Structure
  3. **SMC & ICT** — Order Block, Fair Value Gap (FVG)/Imbalance, Liquidity
     Sweep, Inducement (IDM), Kill Zones
  4. **Wyckoff Logic** — Accumulation, Spring, Markup, Distribution, UTAD
  5. **Advanced PA** — Doji, Engulfing, Quasimodo (QML), Supply & Demand Zones
  6. **Wave & Harmonics** — Elliott Wave, Harmonic Patterns (Gartley, Bat)
  7. **Volume & Systematic** — VSA, Volume Profile & POC, Ichimoku Cloud,
     Turtle Trading (Breakout), Mean Reversion (Bollinger)
- **Interactive chart (right panel)** — each concept swaps in a purpose-built
  simulated dataset with markers (arrows/labels), dashed structure-break lines,
  shaded zones (horizontal bands *and* full-height session bands), and price
  levels — plus indicator overlays where relevant:
  - **volume histogram pane** (Wyckoff / VSA scenarios)
  - **Ichimoku cloud** (Tenkan, Kijun, Senkou A/B, Chikou)
  - **Bollinger Bands** (mean reversion)
  - **Volume profile** with POC (right-edge, TradingView-style)
- **Explanation card** — definition, trading logic, a color legend, and — for
  playbook setups — the **How to Trade** action plan (Entry / SL / TP).
- Dark trading-terminal theme, green/red candles, fully responsive with
  auto-resizing chart (`autoSize`), intraday time axis where needed.

## Project structure

```
src/
  data/
    types.ts          # shared types (Candle, MarkerSpec, ConceptScenario, …)
    concepts.ts       # the 40 concepts, 7 categories, ordering
    indicators.ts     # pure math: volume profile, Bollinger bands
    scenarios.ts      # candle datasets + per-concept overlays & explanations
  chart/
    theme.ts          # dark chart options & candle colors
    TrendLinesPlugin.ts      # sloped trend lines
    ZonesPlugin.ts           # shaded zones (price bands + time bands)
    VolumeProfilePlugin.ts   # right-edge volume profile with POC
    IchimokuPlugin.ts        # full Ichimoku system + cloud
    BollingerBandsPlugin.ts  # BB(20, 2σ) channel
  components/
    ConceptList.tsx      # Learning Hub (search + category accordion)
    ChartPanel.tsx       # chart lifecycle, volume pane, indicator wiring
    ExplanationCard.tsx  # concept explanation + legend
  App.tsx
```

## Getting started

```bash
npm install
npm run dev       # local dev server
npm run build     # production build → dist/
npm run preview   # preview the production build
```

## Deployment

The build outputs a fully static site in `dist/`:

- **Vercel / Netlify** — build command `npm run build`, output directory `dist`.
- **GitHub Pages** — run `npm run build`, publish the `dist/` folder
  (add `"base": "/<repo>/"` to `vite.config.ts` if serving from a sub-path).
- **Any static host** — upload the `dist/` folder.

## Adding a concept

1. Add a candle dataset (or reuse/generate one) in `src/data/scenarios.ts`.
2. Add a `ConceptScenario` entry describing the overlays (markers, trend
   lines, price lines, zones, volume/indicators) and the explanation.
3. Add a `Concept` entry in `src/data/concepts.ts` (with `category` + `group`)
   pointing at it.

## Disclaimer

For education only — all data is simulated. Not financial advice.
