# 📈 Market Structure Playbook

[![Live Demo](https://img.shields.io/badge/Live-Demo-success?style=for-the-badge&logo=github)](https://sarawutms.github.io/market-structure-playbook/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=for-the-badge&logo=tailwind-css)](#)

An interactive educational web application designed for learning **Price Action**, **Smart Money Concepts (SMC)**, **Wyckoff**, **ICT**, and **Volume Analysis**. It features highly customizable, simulated candlestick charts that visualize trading setups and theories step-by-step.

## ✨ Key Features

- 🌐 **Bilingual UI (TH / EN)**
  - Instantly toggle between Thai and English across the entire application.
  - Includes translated concept names, detailed explanations, legends, and trade plans.
  - Uses the **Prompt** font family for perfect Latin and Thai typography.
- 📖 **Ultimate Master Index**
  - A fully searchable hub containing **91 trading concepts** organized into 9 distinct categories:
    1. *Trading Playbook* (Featured setups)
    2. *Basic Structure* (HH/HL, BOS, CHoCH, etc.)
    3. *SMC & ICT* (Order Blocks, FVG, Liquidity Sweeps)
    4. *Wyckoff Logic* (Accumulation, Distribution, Spring)
    5. *Advanced PA* (Quasimodo, Supply/Demand)
    6. *Wave & Harmonics* (Elliott Wave, Harmonic Patterns)
    7. *Volume & Systematic* (VSA, Volume Profile, Ichimoku, Bollinger)
- 📊 **Interactive Simulated Charts**
  - Powered by **TradingView's lightweight-charts**.
  - Dynamic Overlays: Custom structure-break dashed lines, shaded zones, volume profiles (right-edge), Ichimoku clouds, and Bollinger bands.
  - Interactive **Replay Mode** & Trade Simulator for practicing entries and exits!
- 🎯 **Trading Playbook (Actionable Setups)**
  - 7 complete, tradable setups (e.g., SMC Order Block, Wyckoff Spring, Bearish Bat).
  - Features step-by-step chart breakdowns with sequence markers (① ② ③) and specific actionable **Entry, Stop Loss (SL), and Take Profit (TP)** parameters.
- 🎨 **Premium UI/UX**
  - Modern "Glassmorphism" dark theme with ambient glowing effects.
  - Fully responsive design that works beautifully on both desktop and mobile devices.

## 📂 Project Architecture

```text
src/
├── data/
│   ├── types.ts                 # Core type definitions (Candle, MarkerSpec, etc.)
│   ├── concepts.ts              # 47 Concept definitions & category groupings
│   ├── indicators.ts            # Pure math functions (Volume Profile, BB)
│   └── scenarios.ts             # Simulated datasets + indicator overlays
├── chart/
│   ├── theme.ts                 # Chart UI styling & color palettes
│   ├── TrendLinesPlugin.ts      # Custom plugin: Sloped trend lines
│   ├── ZonesPlugin.ts           # Custom plugin: Shaded price/time bands
│   ├── VolumeProfilePlugin.ts   # Custom plugin: Right-edge volume profile
│   ├── IchimokuPlugin.ts        # Custom plugin: Ichimoku cloud rendering
│   └── BollingerBandsPlugin.ts  # Custom plugin: BB channel rendering
├── components/
│   ├── ConceptList.tsx          # Sidebar: Learning Hub & Search
│   ├── ChartPanel.tsx           # Main: Chart lifecycle & Replay Simulator
│   ├── ExplanationCard.tsx      # Bottom/Sidebar: Details & Trade Plans
│   └── ...
└── App.tsx                      # Main application layout & state
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/sarawutms/market-structure-playbook.git

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

### Build for Production
```bash
npm run build
npm run preview
```

## 🛠 Adding a New Concept

Expanding the playbook is straightforward:
1. **Create Data:** Add a new candle dataset (or reuse an existing one) in `src/data/scenarios.ts`.
2. **Define Overlays:** Create a `ConceptScenario` entry that describes markers, trend lines, price zones, indicators, and detailed textual explanations.
3. **Register Concept:** Add the concept metadata to `src/data/concepts.ts` under your desired category. The UI will automatically pick it up!

## 🌍 Deployment

The project builds into a fully static site located in the `dist/` directory.
- **GitHub Pages:** Set `"base": "/<repo-name>/"` in `vite.config.ts` and push the `dist/` folder.
- **Vercel / Netlify:** Use the build command `npm run build` and publish the `dist` output directory.

## ⚠️ Disclaimer
**For Educational Purposes Only.** All chart data is procedurally simulated. This application does not provide financial advice. Trading involves significant risk.
