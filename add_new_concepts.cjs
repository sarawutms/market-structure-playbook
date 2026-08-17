const fs = require('fs');

const CONCEPTS_PATH = 'src/data/concepts.ts';
const SCENARIOS_PATH = 'src/data/scenarios.ts';

const conceptsNew = `
  {
    id: 'ict-silver-bullet',
    name: 'ICT Silver Bullet',
    tag: 'ICT·SB',
    scenarioId: 'ict-silver-bullet',
    group: 'Advanced ICT',
    category: 'SMC & ICT',
    description: 'Trading the FVG during a specific time window.',
  },
  {
    id: 'ict-amd',
    name: 'ICT AMD (Power of 3)',
    tag: 'ICT·AMD',
    scenarioId: 'ict-amd',
    group: 'Advanced ICT',
    category: 'SMC & ICT',
    description: 'Accumulation, Manipulation, Distribution cycle.',
  },
  {
    id: 'fibonacci-golden-zone',
    name: 'Fibonacci Golden Zone',
    tag: 'FIB·618',
    scenarioId: 'fibonacci-golden-zone',
    group: 'Harmonics',
    category: 'Wave & Harmonics',
    description: 'Reversal at the 61.8% to 78.6% retracement level.',
  },
  {
    id: 'rsi-divergence',
    name: 'RSI Divergence',
    tag: 'RSI·DIV',
    scenarioId: 'rsi-divergence',
    group: 'Mean Reversion',
    category: 'Volume & Systematic',
    description: 'Price makes a new high, RSI makes a lower high.',
  },
  {
    id: 'macd-crossover',
    name: 'MACD Crossover',
    tag: 'MACD·X',
    scenarioId: 'macd-crossover',
    group: 'Trend Following',
    category: 'Volume & Systematic',
    description: 'MACD line crosses the signal line.',
  },
`;

const scenariosNew = `
  'ict-silver-bullet': {
    candles: KZ,
    title: { en: 'ICT Silver Bullet', th: 'กลยุทธ์ ICT Silver Bullet' },
    summary: {
      en: 'The Silver Bullet setup occurs during a specific time window (e.g., 10 AM - 11 AM EST). It relies on a liquidity sweep followed by an displacement that creates a Fair Value Gap (FVG), offering a high-probability entry.',
      th: 'เทคนิค Silver Bullet เกิดขึ้นในช่วงเวลาเจาะจง (Time & Price) โดยราคากวาดสภาพคล่อง (Liquidity) ก่อนเกิดการทะลุแรงๆ (Displacement) ที่ทิ้งช่องว่าง FVG ไว้ให้เราเข้าเทรด'
    },
    keyPoints: [
      { en: 'Identify the Silver Bullet time window.', th: 'รอให้ถึงช่วงเวลา Silver Bullet' },
      { en: 'Wait for a liquidity sweep.', th: 'รอราคาเคลียร์ Liquidity' },
      { en: 'Enter on the FVG return.', th: 'เข้าเทรดที่ FVG' }
    ],
    zones: [
      { startTime: KZ[10].time, endTime: KZ[14].time, color: COLORS.zoneBull },
    ],
    markers: [
      { time: KZ[9].time, position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Liquidity Sweep', th: 'กวาด Liquidity' } },
      { time: KZ[12].time, position: 'belowBar', shape: 'arrowUp', color: COLORS.cyan, text: { en: 'FVG Entry (Silver Bullet Window)', th: 'จุดเข้า FVG ในช่วงเวลา Silver Bullet' } },
    ],
    legend: [
      { label: 'Silver Bullet Window (Time)', color: COLORS.zoneBull },
    ]
  },
  'ict-amd': {
    candles: SIDE,
    title: { en: 'ICT AMD (Power of 3)', th: 'วงจร ICT AMD (Power of 3)' },
    summary: {
      en: 'AMD stands for Accumulation (building positions), Manipulation (false breakout to trap retail), and Distribution (the real move).',
      th: 'วงจร AMD คือ 1. Accumulation (สะสมพลัง/ไซด์เวย์) 2. Manipulation (ทุบหลอกกิน Stop loss) 3. Distribution (วิ่งพุ่งไปทิศทางจริง)'
    },
    keyPoints: [
      { en: 'Accumulation phase builds liquidity.', th: 'ช่วงไซด์เวย์สร้าง Liquidity' },
      { en: 'Manipulation sweeps the range.', th: 'ทุบหลอกกิน Stop Loss' },
      { en: 'Distribution is the real trend.', th: 'วิ่งจริงแรงและเร็ว' }
    ],
    zones: [
      { startTime: sideT(0), endTime: sideT(8), topPrice: 106, bottomPrice: 99, color: COLORS.zoneAmber },
      { startTime: sideT(9), endTime: sideT(12), topPrice: 99, bottomPrice: 94, color: COLORS.zoneBear },
      { startTime: sideT(13), endTime: sideT(20), topPrice: 115, bottomPrice: 100, color: COLORS.zoneBull },
    ],
    markers: [
      { time: sideT(4), position: 'aboveBar', shape: 'arrowDown', color: COLORS.amber, text: { en: 'Accumulation', th: 'A - สะสม' } },
      { time: sideT(10), position: 'belowBar', shape: 'arrowUp', color: COLORS.bear, text: { en: 'Manipulation (Trap)', th: 'M - หลอกทุบ' } },
      { time: sideT(16), position: 'aboveBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Distribution', th: 'D - วิ่งจริง' } },
    ],
    legend: [
      { label: 'Accumulation', color: COLORS.zoneAmber },
      { label: 'Manipulation', color: COLORS.zoneBear },
      { label: 'Distribution', color: COLORS.zoneBull },
    ]
  },
  'fibonacci-golden-zone': {
    candles: UP,
    title: { en: 'Fibonacci Golden Zone', th: 'โซนทองคำ Fibonacci (61.8%)' },
    summary: {
      en: 'The Golden Zone (61.8% to 78.6% retracement) is considered the highest probability area for a trend to resume after a pullback.',
      th: 'Golden Zone คือช่วงย่อตัวที่ 61.8% ถึง 78.6% ของ Fibonacci ซึ่งเป็นจุดที่มีโอกาสเด้งกลับไปตามเทรนด์เดิมสูงที่สุด (Optimal Trade Entry)'
    },
    keyPoints: [
      { en: 'Draw Fib from Swing Low to Swing High.', th: 'ลาก Fib จาก Low ไป High' },
      { en: 'Wait for price to retrace into the 61.8% - 78.6% zone.', th: 'รอราคาย่อเข้าโซน 61.8% - 78.6%' },
      { en: 'Look for reversal confirmation.', th: 'หาจุดกลับตัว' }
    ],
    trendLines: [
      { from: { time: upT(0), price: UP[0].low }, to: { time: upT(12), price: UP[12].high }, color: COLORS.violet, dashed: false },
    ],
    priceLines: [
      { price: UP[12].high, color: COLORS.muted, title: '0% (Swing High)', dashed: true },
      { price: UP[12].high - (UP[12].high - UP[0].low) * 0.5, color: COLORS.muted, title: '50%', dashed: true },
      { price: UP[12].high - (UP[12].high - UP[0].low) * 0.618, color: COLORS.bull, title: '61.8% (Golden)', dashed: false },
      { price: UP[0].low, color: COLORS.muted, title: '100% (Swing Low)', dashed: true },
    ],
    markers: [
      { time: upT(15), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Golden Zone Rejection', th: 'เด้งที่โซน 61.8%' } },
    ],
    legend: [
      { label: 'Impulse Swing', color: COLORS.violet },
      { label: '61.8% Golden Ratio', color: COLORS.bull },
    ]
  },
  'rsi-divergence': {
    candles: UP,
    title: { en: 'RSI Divergence', th: 'RSI Divergence (ความขัดแย้ง)' },
    summary: {
      en: 'A bearish divergence occurs when price makes a Higher High (HH), but the RSI oscillator makes a Lower High (LH), signaling weakening momentum.',
      th: 'Bearish Divergence เกิดขึ้นเมื่อราคาสร้างจุดสูงสุดใหม่ (HH) แต่ RSI กลับทำจุดสูงสุดที่ต่ำลง (LH) เป็นสัญญาณเตือนว่าแรงซื้อเริ่มหมดและเตรียมกลับตัว'
    },
    keyPoints: [
      { en: 'Price makes a HH.', th: 'ราคาทำจุดสูงสุดใหม่' },
      { en: 'RSI makes a LH.', th: 'RSI ทำจุดสูงสุดที่ต่ำลง' },
      { en: 'Potential reversal.', th: 'เตรียมกลับตัวเป็นขาลง' }
    ],
    trendLines: [
      { from: { time: upT(12), price: UP[12].high + 0.5 }, to: { time: upT(24), price: UP[24].high + 0.5 }, color: COLORS.bear, dashed: false },
    ],
    markers: [
      { time: upT(12), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Price HH', th: 'ราคาทำ High ใหม่' } },
      { time: upT(24), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'RSI LH (Divergence)', th: 'RSI ทำ High ต่ำลง' } },
    ],
    legend: [
      { label: 'Divergence Trend', color: COLORS.bear },
    ]
  },
  'macd-crossover': {
    candles: DOWN,
    title: { en: 'MACD Crossover', th: 'จุดตัด MACD Crossover' },
    summary: {
      en: 'The MACD strategy generates signals when the fast MACD line crosses the slow Signal line. A cross below is bearish, a cross above is bullish.',
      th: 'กลยุทธ์ MACD ดูจังหวะที่เส้น MACD ตัดกับเส้น Signal ถ้าตัดลงเป็นสัญญาณขาย (Bearish Cross) ถ้าตัดขึ้นเป็นสัญญาณซื้อ (Bullish Cross)'
    },
    keyPoints: [
      { en: 'Fast line crosses below signal line (Bearish).', th: 'เส้นเร็วตัดลง (ขาลง)' },
      { en: 'Fast line crosses above signal line (Bullish).', th: 'เส้นเร็วตัดขึ้น (ขาขึ้น)' }
    ],
    markers: [
      { time: downT(5), position: 'aboveBar', shape: 'arrowDown', color: COLORS.bear, text: { en: 'Bearish Cross (Sell)', th: 'เส้นตัดลง (จุดขาย)' } },
      { time: downT(15), position: 'belowBar', shape: 'arrowUp', color: COLORS.bull, text: { en: 'Bullish Cross (Buy)', th: 'เส้นตัดขึ้น (จุดซื้อ)' } },
    ],
    legend: [
      { label: 'Bearish Signal', color: COLORS.bear },
      { label: 'Bullish Signal', color: COLORS.bull },
    ]
  },
`;

// we already updated concepts.ts before but we checked it out via git checkout for scenarios only?
// let's do both to be sure (if concepts.ts was already updated, replace might fail if regex doesn't match)
let conceptsStr = fs.readFileSync(CONCEPTS_PATH, 'utf-8');
if (!conceptsStr.includes('ict-silver-bullet')) {
  conceptsStr = conceptsStr.replace(/];\s*\n\/\*\* Top-level accordion categories/, conceptsNew + '\n];\n\n/** Top-level accordion categories');
  fs.writeFileSync(CONCEPTS_PATH, conceptsStr);
}

let scenariosStr = fs.readFileSync(SCENARIOS_PATH, 'utf-8');
if (!scenariosStr.includes('ict-silver-bullet')) {
  scenariosStr = scenariosStr.replace(/\n};\s*$/, '\n' + scenariosNew + '\n};\n');
  fs.writeFileSync(SCENARIOS_PATH, scenariosStr);
}

console.log('Successfully added concepts and scenarios.');
