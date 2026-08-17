import type { Concept, Language, Localizable } from '../data/types';

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

/** Resolves a `Localizable` to the active language (plain strings = English). */
export function pickLang(text: Localizable, lang: Language): string {
  return typeof text === 'string' ? text : text[lang] ?? text.en;
}

/** Returns the circled number glyph for a step (1 → ①, 2 → ②, …). */
export function stepMark(n: number): string {
  const GLYPHS = '①②③④⑤⑥⑦⑧⑨⑩';
  return GLYPHS[n - 1] ?? String(n);
}

/* ---------------------------------------------------------------------------
 * UI chrome strings (nested en / th)
 * ------------------------------------------------------------------------- */

export const UI = {
  appSubtitle: {
    en: 'Learn SMC, ICT, Wyckoff & price action on simulated charts',
    th: 'เรียนรู้ SMC, ICT, Wyckoff และ Price Action บนกราฟจำลอง',
  },
  playbookIndex: {
    en: 'Playbook Index',
    th: 'ดัชนีเพลย์บุ๊ก',
  },
  concepts: {
    en: 'concepts',
    th: 'แนวคิด',
  },
  candles: {
    en: 'candles',
    th: 'แท่งเทียน',
  },
  searchPlaceholder: {
    en: 'Search concepts…',
    th: 'ค้นหาแนวคิด…',
  },
  noMatches: {
    en: 'No concepts match “{q}”.',
    th: 'ไม่พบแนวคิดที่ตรงกับ “{q}”',
  },
  conceptExplanation: {
    en: 'Concept Explanation',
    th: 'คำอธิบายรูปแบบ',
  },
  chartBreakdown: {
    en: 'Chart Breakdown',
    th: 'การอ่านกราฟทีละสเต็ป',
  },
  actionPlan: {
    en: 'Action Plan',
    th: 'แผนการเทรด',
  },
  howToTrade: {
    en: 'How to Trade',
    th: 'วิธีหาจุดเข้าและออกออเดอร์',
  },
  chartLegend: {
    en: 'Chart legend',
    th: 'คำอธิบายแผนภูมิ',
  },
  long: {
    en: 'LONG',
    th: 'ซื้อ (LONG)',
  },
  short: {
    en: 'SHORT',
    th: 'ขาย (SHORT)',
  },
  entry: {
    en: 'How to find Entry',
    th: 'วิธีหาจุดเข้า',
  },
  stopLoss: {
    en: 'How to set SL',
    th: 'วิธีตั้งจุดตัดขาดทุน',
  },
  takeProfit: {
    en: 'How to set TP',
    th: 'วิธีตั้งจุดทำกำไร',
  },
  entryHint: {
    en: 'Entry trigger criteria',
    th: 'เงื่อนไขการเปิดออเดอร์',
  },
  slHint: {
    en: 'Invalidation logic',
    th: 'ตรรกะการยกเลิกออเดอร์',
  },
  tpHint: {
    en: 'Target selection logic',
    th: 'ตรรกะการเลือกเป้าหมาย',
  },
  instrument: {
    en: 'XAUUSD · Simulated',
    th: 'XAUUSD · ข้อมูลจำลอง',
  },
  zoomIn: {
    en: 'Zoom in',
    th: 'ขยายเข้า',
  },
  zoomOut: {
    en: 'Zoom out',
    th: 'ย่อออก',
  },
  zoomReset: {
    en: 'Reset zoom',
    th: 'คืนขนาดเดิม',
  },
  zoomHint: {
    en: 'Scroll / pinch to zoom · drag to pan',
    th: 'เลื่อนล้อหรือบีบสองนิ้วเพื่อซูม · ลากเพื่อเลื่อนกราฟ',
  },
  /* Bar Replay (simulation mode) — practice trading on the chart. */
  replayMode: {
    en: 'Bar Replay',
    th: 'โหมดจำลอง',
  },
  exitReplay: {
    en: 'Exit Replay',
    th: 'ออกจากโหมดจำลอง',
  },
  replayPickHint: {
    en: 'Pick a line to place it on the chart',
    th: 'คลิกปุ่มเพื่อหยิบเส้นไปวางบนกราฟ',
  },
  replayDragHint: {
    en: 'Drag the mouse to position… click the chart to confirm',
    th: 'กำลังเลื่อนเมาส์เพื่อวางเส้น... (คลิกกราฟเพื่อยืนยัน)',
  },
  draftEntry: {
    en: 'ENTRY',
    th: 'จุดเข้า',
  },
  placeOrder: {
    en: 'PLACE ORDER',
    th: 'วางคำสั่ง',
  },
  pendingStatus: {
    en: 'PENDING',
    th: 'รอเข้า',
  },
  tpHitStatus: {
    en: 'TP HIT',
    th: 'ถึง TP',
  },
  slHitStatus: {
    en: 'SL HIT',
    th: 'โดน SL',
  },
  closePosition: {
    en: 'CLOSE',
    th: 'ปิด',
  },
  clearPosition: {
    en: 'CLEAR',
    th: 'ล้าง',
  },
  nextCandle: {
    en: 'Next Candle',
    th: 'แท่งถัดไป',
  },
  nextShort: {
    en: 'Next',
    th: 'ถัดไป',
  },
  replayLong: {
    en: 'LONG',
    th: 'ซื้อ',
  },
  replayShort: {
    en: 'SHORT',
    th: 'ขาย',
  },
  resetChartView: {
    en: 'Reset Chart View',
    th: 'รีเซ็ตมุมมองกราฟ',
  },
  timeframe: {
    en: 'Timeframe',
    th: 'ไทม์เฟรม',
  },
  timeframeM5: {
    en: '5 minutes',
    th: '5 นาที',
  },
  timeframeM15: {
    en: '15 minutes',
    th: '15 นาที',
  },
  timeframeH1: {
    en: '1 hour',
    th: '1 ชั่วโมง',
  },
  timeframeH4: {
    en: '4 hours',
    th: '4 ชั่วโมง',
  },
  timeframeD1: {
    en: 'Daily',
    th: 'รายวัน',
  },
  openMenu: {
    en: 'Open playbook index',
    th: 'เปิดดัชนีเพลย์บุ๊ก',
  },
  closeMenu: {
    en: 'Close playbook index',
    th: 'ปิดดัชนีเพลย์บุ๊ก',
  },
  featured: {
    en: 'Featured setup',
    th: 'เซ็ตอัปเด่น',
  },
  disclaimer: {
    en: 'For education only — all data is simulated. Not financial advice.',
    th: 'เพื่อการศึกษาเท่านั้น — ข้อมูลทั้งหมดเป็นข้อมูลจำลอง ไม่ใช่คำแนะนำทางการเงิน',
  },
  heroTitle: {
    en: 'Master Market Structure',
    th: 'เจาะลึกโครงสร้างตลาด',
  },
  heroSubtitle: {
    en: 'Interactive playbook for SMC, ICT, Wyckoff, and advanced Price Action. Learn setups on simulated charts.',
    th: 'เพลย์บุ๊กแบบอินเทอร์แอกทีฟสำหรับ SMC, ICT, Wyckoff และ Price Action ขั้นสูง เรียนรู้ผ่านกราฟจำลอง',
  },
  openPlaybook: {
    en: 'Open Playbook',
    th: 'เริ่มเรียนรู้เลย',
  },
  featuresTitle: {
    en: 'Why use this playbook?',
    th: 'ทำไมต้องใช้เพลย์บุ๊กนี้?',
  },
  feat1Title: {
    en: 'Interactive Charts',
    th: 'กราฟอินเทอร์แอกทีฟ',
  },
  feat1Desc: {
    en: 'Analyze setups step-by-step on realistic simulated charts.',
    th: 'วิเคราะห์เซ็ตอัปแบบทีละขั้นตอนบนกราฟจำลองที่สมจริง',
  },
  feat2Title: {
    en: 'Multiple Timeframes',
    th: 'หลากหลายไทม์เฟรม',
  },
  feat2Desc: {
    en: 'See how market structure behaves across different timeframes.',
    th: 'ดูพฤติกรรมโครงสร้างตลาดในไทม์เฟรมต่างๆ',
  },
  feat3Title: {
    en: 'Actionable Logic',
    th: 'ตรรกะที่นำไปใช้ได้จริง',
  },
  feat3Desc: {
    en: 'Clear entry, stop-loss, and take-profit criteria for every setup.',
    th: 'เงื่อนไขจุดเข้า จุดตัดขาดทุน และจุดทำกำไรที่ชัดเจนในทุกเซ็ตอัป',
  },
} as const;

/* ---------------------------------------------------------------------------
 * Sidebar taxonomy — Thai translations keyed by the internal English name.
 * Technical abbreviations (BOS, OB, FVG…) stay unchanged in both languages.
 * ------------------------------------------------------------------------- */

export const TH_CATEGORIES: Record<string, string> = {
  'Trading Playbook': 'เพลย์บุ๊กการเทรด',
  'Basic Structure': 'โครงสร้างพื้นฐาน',
  'Chart Patterns': 'รูปแบบกราฟ',
  'SMC & ICT': 'SMC & ICT',
  'Wyckoff Logic': 'ทฤษฎี Wyckoff',
  'Advanced PA': 'Price Action ขั้นสูง',
  'Candlestick Patterns': 'รูปแบบแท่งเทียน',
  'Wave & Harmonics': 'ทฤษฎีคลื่นและฮาร์โมนิก',
  'Harmonic Patterns': 'รูปแบบฮาร์โมนิก',
  'Volume & Systematic': 'ปริมาณการซื้อขายและระบบเทรด',
  'Theories & Frameworks': 'ทฤษฎีและกรอบแนวคิด',
  'Price Action': 'Price Action',
  'Risk Management': 'การบริหารความเสี่ยง',
  'Trading Styles': 'สไตล์การเทรด',
};

export const TH_GROUPS: Record<string, string> = {
  'Featured Setups': 'เซ็ตอัปเด่น',
  'Price Levels': 'ระดับราคา',
  'Trend Structure': 'โครงสร้างแนวโน้ม',
  'Market Regime': 'สภาวะตลาด',
  Momentum: 'โมเมนตัม',
  'Structure Shifts': 'การเปลี่ยนโครงสร้าง',
  'Fractal Structure': 'โครงสร้างแฟร็กทัล',
  'SMC & ICT': 'SMC & ICT',
  Wyckoff: 'Wyckoff',
  'Reversal Patterns': 'รูปแบบกลับตัว',
  'Continuation Patterns': 'รูปแบบไปต่อ',
  'Single Candles': 'แท่งเดี่ยว',
  'Candlestick Patterns': 'รูปแบบแท่งเทียน',
  'Structural Patterns': 'รูปแบบโครงสร้าง',
  'Elliott Wave': 'คลื่น Elliott',
  Harmonics: 'ฮาร์โมนิก',
  VSA: 'VSA',
  'Volume Profile': 'Volume Profile',
  Ichimoku: 'Ichimoku',
  'Trend Following': 'การเทรดตามเทรนด์',
  'Mean Reversion': 'การกลับสู่ค่าเฉลี่ย',
  'Advanced ICT': 'ICT ขั้นสูง',
  Volatility: 'ความผันผวน',
  Volume: 'ปริมาณการซื้อขาย',
  'Pivot Levels': 'ระดับ Pivot',
  'Market Theory': 'ทฤษฎีตลาด',
  'Reversal Setups': 'เซ็ตอัปกลับตัว',
  'Continuation Setups': 'เซ็ตอัปต่อเนื่อง',
  'Sizing & Stops': 'ขนาดออเดอร์และ Stop',
  'Metrics & Process': 'เมตริกและกระบวนการ',
  Styles: 'สไตล์',
};

/** Thai concept names + descriptions, keyed by concept id. */
export const TH_CONCEPTS: Record<string, { name: string; description: string }> = {
  'playbook-ob': {
    name: 'การเข้าเทรด Order Block',
    description: 'Buy: กวาดสภาพคล่อง → CHoCH → รีเทสต์ OB',
  },
  'playbook-fvg': {
    name: 'การเติมช่องว่าง FVG',
    description: 'Buy: พุ่งแรงทิ้งช่องว่าง → เติมเต็ม → เดินต่อ',
  },
  'playbook-spring': {
    name: 'Spring ของ Wyckoff',
    description: 'Buy: เขย่ากรอบราคา → ปิดกลับเข้ากรอบ',
  },
  'playbook-qml': {
    name: 'การกลับตัว QML',
    description: 'Short: Higher High → เบรกแนวคอ → รีเทสต์',
  },
  'playbook-bat': {
    name: 'เซ็ตอัป Bat ขาลง',
    description: 'Short: XA พุ่ง → D ที่ 0.886 → เข้าที่ PRZ',
  },
  'playbook-vsa': {
    name: 'VSA: ปริมาณหยุด',
    description: 'Buy: ไคลแมกซ์ที่แนวรับ → ไร้ดีมานด์ → SOS เข้า',
  },
  'playbook-uptrend': {
    name: 'การต่อเนื่องเทรนด์ขาขึ้น',
    description: 'Buy: HH/HL → BOS → ย่อแล้วเข้า',
  },
  'playbook-trendline': {
    name: 'รูปแบบ Bull Flag',
    description: 'Buy: เสาธง → ตัวธง → เบรกเอาต์',
  },
  'pattern-double-top': {
    name: 'Double Top',
    description: 'รูปตัว M บ่งชี้การกลับตัวเป็นขาลงหลังขาขึ้น',
  },
  'pattern-head-shoulders': {
    name: 'Head & Shoulders',
    description: 'ยอด 3 จุดตรงกลางสูงสุด สัญญาณกลับตัว',
  },
  'pattern-ascending-triangle': {
    name: 'Ascending Triangle',
    description: 'แนวต้านราบกับจุดต่ำที่สูงขึ้น — เบรกขึ้น',
  },
  'pattern-descending-triangle': {
    name: 'Descending Triangle',
    description: 'แนวรับราบกับจุดสูงที่ต่ำลง — เบรกลง',
  },
  'pattern-cup-handle': {
    name: 'Cup & Handle',
    description: 'ก้นถ้วยโค้งกับหูถ้วย — เบรกขึ้น',
  },
  'pattern-bear-flag': {
    name: 'Bear Flag',
    description: 'เสาธงร่วงแรง ตามด้วยพักตัว — เบรกลง',
  },
  'pattern-falling-wedge': {
    name: 'Falling Wedge',
    description: 'จุดต่ำและจุดสูงบรรจบกัน — เบรกขึ้น',
  },
  'pattern-double-bottom': {
    name: 'Double Bottom',
    description: 'รูปตัว W ก้นคู่ — เบรกขึ้นเหนือ Neckline',
  },
  'pattern-rising-wedge': {
    name: 'Rising Wedge',
    description: 'จุดสูงและจุดต่ำบรรจบกัน — เบรกลง',
  },
  'pattern-pennant': {
    name: 'Pennant ขาขึ้น',
    description: 'เสาธงแล้วสามเหลี่ยมสมมาตร — เบรกขึ้น',
  },
  'pattern-inverse-hs': {
    name: 'Inverse Head & Shoulders',
    description: 'ก้นกลางลึกกว่าสองข้าง — เบรกขึ้นเหนือ Neckline',
  },
  'pattern-triple-top': {
    name: 'Triple Top',
    description: 'ยอดสามยอดเท่ากัน — เบรกลงใต้ Neckline',
  },
  'pattern-triple-bottom': {
    name: 'Triple Bottom',
    description: 'ก้นสามก้นเท่ากัน — เบรกขึ้นเหนือ Neckline',
  },
  'pattern-rounding-top': {
    name: 'Rounding Top',
    description: 'ยอดโค้งรูปโดม — เบรกลงที่ขอบถ้วย',
  },
  'pattern-rounding-bottom': {
    name: 'Rounding Bottom',
    description: 'ก้นโค้งรูปจานรอง — เบรกขึ้นที่ขอบถ้วย',
  },
  'pattern-diamond-top': {
    name: 'Diamond Top',
    description: 'ขยายกว้างแล้วแคบลง — เบรกลง',
  },
  'pattern-diamond-bottom': {
    name: 'Diamond Bottom',
    description: 'ขยายกว้างแล้วแคบลง — เบรกขึ้น',
  },
  'pattern-broadening-top': {
    name: 'Broadening Top',
    description: 'ปากแตรสวิงกว้างขึ้น — เบรกลง',
  },
  'pattern-island-reversal': {
    name: 'Island Reversal',
    description: 'แท่งเทียนโดดเดี่ยวคั่นช่องว่าง — กลับตัว',
  },
  'pattern-bear-pennant': {
    name: 'Pennant ขาลง',
    description: 'เสาธงร่วงแล้วสามเหลี่ยมสมมาตร — เบรกลง',
  },
  'pattern-symmetrical-triangle': {
    name: 'Symmetrical Triangle',
    description: 'จุดสูงและจุดต่ำบรรจบกัน — เบรกตามเทรนด์',
  },
  'pattern-bull-rectangle': {
    name: 'Bullish Rectangle',
    description: 'กรอบราคาแนวนอน — เบรกขึ้นเหนือกรอบ',
  },
  'pattern-bear-rectangle': {
    name: 'Bearish Rectangle',
    description: 'กรอบราคาแนวนอน — เบรกลงใต้กรอบ',
  },
  bat: {
    name: 'รูปแบบ Bat',
    description: 'โครงสร้างกลับตัวที่ Fibonacci 0.886',
  },
  turtle: {
    name: 'Turtle Trading',
    description: 'ระบบเบรกเอาต์ 20 วัน พร้อม Stop แบบ ATR',
  },
  high: { name: 'จุดสูงสุด', description: 'ราคาสูงสุดที่ซื้อขายได้ในหนึ่งช่วงเวลา' },
  low: { name: 'จุดต่ำสุด', description: 'ราคาต่ำสุดที่ซื้อขายได้ในหนึ่งช่วงเวลา' },
  'swing-high': { name: 'Swing High', description: 'จุดหมุนที่ราคาพลิกกลับลง' },
  'swing-low': { name: 'Swing Low', description: 'จุดหมุนที่ราคาพลิกกลับขึ้น' },
  hh: { name: 'Higher High', description: 'Swing High ที่สูงกว่า Swing High ก่อนหน้า' },
  hl: { name: 'Higher Low', description: 'Swing Low ที่สูงกว่า Swing Low ก่อนหน้า' },
  lh: { name: 'Lower High', description: 'Swing High ที่ต่ำกว่า Swing High ก่อนหน้า' },
  ll: { name: 'Lower Low', description: 'Swing Low ที่ต่ำกว่า Swing Low ก่อนหน้า' },
  eqh: { name: 'Equal Highs', description: 'Swing High ที่เกิดขึ้นในระดับราคาเท่ากัน' },
  eql: { name: 'Equal Lows', description: 'Swing Low ที่เกิดขึ้นในระดับราคาเท่ากัน' },
  uptrend: { name: 'เทรนด์ขาขึ้น', description: 'ลำดับ HH / HL — ผู้ซื้อควบคุมตลาด' },
  downtrend: { name: 'เทรนด์ขาลง', description: 'ลำดับ LH / LL — ผู้ขายควบคุมตลาด' },
  sideway: { name: 'Sideways / กรอบราคา', description: 'ไม่มีเทรนด์ — ราคาแกว่งระหว่าง EQH และ EQL' },
  impulse: { name: 'จังหวะพุ่งแรง', description: 'ขาที่แข็งแรงและมีทิศทางของเทรนด์' },
  pullback: { name: 'การย่อตัว', description: 'การย่อทวนเทรนด์หลังจังหวะพุ่งแรง' },
  bos: { name: 'การเบรกโครงสร้าง', description: 'เบรกจุดสวิงสุดท้าย — เทรนด์เดินต่อ' },
  choch: { name: 'การเปลี่ยนลักษณะ', description: 'การเบรกโครงสร้างครั้งแรกที่สวนเทรนด์' },
  mss: { name: 'การเปลี่ยนโครงสร้างตลาด', description: 'เบรกโครงสร้างภายในหลังการดันครั้งสุดท้าย' },
  'internal-structure': { name: 'โครงสร้างภายใน', description: 'สวิงย่อยที่ประกอบเป็นขาใหญ่' },
  'external-structure': { name: 'โครงสร้างภายนอก', description: 'สวิงหลักที่กำหนดเทรนด์โดยรวม' },
  'order-block': { name: 'Order Block', description: 'แท่งสีตรงข้ามแท่งสุดท้ายก่อนการพุ่งแรง' },
  fvg: { name: 'Fair Value Gap', description: 'ความไม่สมดุลจากการพุ่ง 3 แท่ง' },
  'liquidity-sweep': { name: 'การกวาดสภาพคล่อง', description: 'ไส้เทียนที่กวาด Stop ก่อนพลิกกลับ' },
  inducement: { name: 'Inducement', description: 'ระดับเล็ก ๆ ที่ถูกสร้างเพื่อล่อการเข้าเทรด' },
  'kill-zones': { name: 'Kill Zones', description: 'เซสชันลอนดอนและนิวยอร์กที่สภาพคล่องเคลื่อนไหว' },
  accumulation: { name: 'การสะสม', description: 'เม็ดเงินใหญ่ซื้อในขณะที่ราคาอยู่ในกรอบ' },
  spring: { name: 'Spring', description: 'การเขย่าใต้กรอบที่ดัก Short' },
  markup: { name: 'ช่วงขึ้น', description: 'ช่วงรีบาวด์หลังการสะสม' },
  distribution: { name: 'การกระจาย', description: 'เม็ดเงินใหญ่ขายในขณะที่ราคาสร้างยอด' },
  utad: { name: 'UTAD', description: 'การดันขึ้นครั้งสุดท้ายหลังการกระจาย — กับดักสุดท้าย' },
  doji: { name: 'โดจิ', description: 'แท่งเทียนที่ไม่มีตัวแท่ง — ความลังเล' },
  hammer: { name: 'Hammer', description: 'ตัวแท่งเล็ก ไส้ล่างยาว — เกิดที่ก้นขาลง' },
  'shooting-star': { name: 'Shooting Star', description: 'ตัวแท่งเล็ก ไส้บนยาว — เกิดที่ยอดขาขึ้น' },
  engulfing: { name: 'Engulfing', description: 'แท่งเทียนที่กลืนแท่งก่อนหน้าทั้งแท่ง' },
  'morning-star': { name: 'Morning Star', description: '3 แท่งที่ก้น: แดงยาว, เล็ก, เขียวยาว' },
  'evening-star': { name: 'Evening Star', description: '3 แท่งที่ยอด: เขียวยาว, เล็ก, แดงยาว' },
  harami: { name: 'Harami', description: 'แท่งเล็กอยู่ในตัวแท่งใหญ่ — ลังเล' },
  'three-soldiers': { name: 'Three White Soldiers', description: 'แท่งเขียวแรง 3 แท่งติดกันหลังก้น' },
  'three-crows': { name: 'Three Black Crows', description: 'แท่งแดงแรง 3 แท่งติดกันหลังยอด' },
  qml: { name: 'Quasimodo', description: 'Higher High, เบรกแนวคอ, และรีเทสต์' },
  'supply-demand': { name: 'โซน Supply & Demand', description: 'โซนที่สถาบันทิ้งรอยเท้าเอาไว้' },
  'elliott-wave': { name: 'คลื่น Elliott', description: 'คลื่น impulse 5 ลูกและการปรับฐาน 3 ลูก' },
  harmonic: { name: 'รูปแบบฮาร์โมนิก', description: 'รูปแบบ X-A-B-C-D ที่สร้างจาก Fibonacci' },
  'g-artley': { name: 'Gartley (222)', description: 'ขาขึ้น D ที่ 0.786 ของ XA — คลาสสิก' },
  butterfly: { name: 'Butterfly', description: 'D ยื่นถึง 1.27 ของ XA — การกลับตัวลึก' },
  crab: { name: 'Crab', description: 'D ยื่นถึง 1.618 ของ XA — ลึกที่สุด' },
  cypher: { name: 'Cypher', description: 'C ยื่นเลย A; D ที่ 0.786 ของ XC' },
  shark: { name: 'Shark', description: 'B เลย A; D ที่ 1.13 ของ XC — ชอร์ต' },
  abcd: { name: 'AB=CD', description: 'CD ยาวเท่ากับ AB (1:1) — จุด D คือจุดเข้า' },
  vsa: { name: 'Volume Spread Analysis', description: 'อ่านซัปพลาย/ดีมานด์จากวอลุ่มและสเปรด' },
  'volume-profile': { name: 'Volume Profile & POC', description: 'วอลุ่มรายระดับราคา — จุดที่มูลค่าอยู่' },
  ichimoku: { name: 'เมฆ Ichimoku', description: 'Tenkan, Kijun, เมฆ และ Chikou ในระบบเดียว' },
  'mean-reversion': { name: 'การกลับสู่ค่าเฉลี่ย', description: 'เทรดการย่อกลับเข้าหาค่าเฉลี่ย (BB)' },
  'ict-silver-bullet': {
    name: 'ICT Silver Bullet',
    description: 'เทรด FVG ในช่วงเวลาที่กำหนดของวัน',
  },
  'ict-amd': {
    name: 'ICT AMD (Power of 3)',
    description: 'รอบ Accumulation, Manipulation, Distribution',
  },
  'fibonacci-golden-zone': {
    name: 'Fibonacci Golden Zone',
    description: 'กลับตัวที่ระดับ 61.8% ถึง 78.6%',
  },
  'rsi-divergence': {
    name: 'RSI Divergence',
    description: 'ราคาทำ High ใหม่ แต่ RSI ทำ High ต่ำลง',
  },
  'macd-crossover': {
    name: 'MACD Crossover',
    description: 'เส้น MACD ตัดเส้น Signal',
  },
  'candle-hanging-man': {
    name: 'Hanging Man',
    description: 'แท่งกลับตัวขาลงที่ยอดขาขึ้น',
  },
  'candle-inverted-hammer': {
    name: 'Inverted Hammer',
    description: 'แท่งขาขึ้นไส้บนยาวที่ก้นขาลง',
  },
  'candle-spinning-top': {
    name: 'Spinning Top',
    description: 'ตัวแท่งเล็ก ไส้สองข้าง — ตลาดลังเล',
  },
  'candle-dragonfly-doji': {
    name: 'Dragonfly Doji',
    description: 'โดจิไส้ล่างยาว — ขาขึ้นที่ก้น',
  },
  'candle-gravestone-doji': {
    name: 'Gravestone Doji',
    description: 'โดจิไส้บนยาว — ขาลงที่ยอด',
  },
  'candle-long-legged-doji': {
    name: 'Long-Legged Doji',
    description: 'โดจิไส้ยาวสองข้าง — ลังเลมาก',
  },
  'candle-tweezer-top': {
    name: 'Tweezer Top',
    description: 'สองแท่งถูกปฏิเสธที่ High เท่ากัน',
  },
  'candle-tweezer-bottom': {
    name: 'Tweezer Bottom',
    description: 'สองแท่งถูกป้องกันที่ Low เท่ากัน',
  },
  'candle-piercing-line': {
    name: 'Piercing Line',
    description: 'ปิดเหนือกึ่งกลางแท่งแดงก่อนหน้า',
  },
  'candle-dark-cloud-cover': {
    name: 'Dark Cloud Cover',
    description: 'ปิดใต้กึ่งกลางแท่งเขียวก่อนหน้า',
  },
  'candle-kicker': {
    name: 'Kicker',
    description: 'ช่องว่างสวนเทรนด์ + แท่งตรงข้ามแรง',
  },
  'candle-belt-hold': {
    name: 'Belt Hold (Yokozuna)',
    description: 'แท่งเดียวเด็ดขาดที่เปิดที่ปลายสุด',
  },
  'candle-homing-pigeon': {
    name: 'Homing Pigeon',
    description: 'แท่งแดงลูกที่สองซ้อนในลูกแรก',
  },
  'candle-matching-low': {
    name: 'Matching Low',
    description: 'แท่งแดงสองแท่งปิดที่ Low เท่ากัน',
  },
  'candle-in-neck': {
    name: 'In-Neck Line',
    description: 'ดีดอ่อนปิดใกล้ Low เดิม — ขาลงต่อ',
  },
  'candle-on-neck': {
    name: 'On-Neck Line',
    description: 'ดีดปิดที่ Low เดิมพอดี',
  },
  'candle-thrusting': {
    name: 'Thrusting',
    description: 'ปิดเขียวในครึ่งล่างแท่งแดงก่อนหน้า',
  },
  'candle-three-inside-up': {
    name: 'Three Inside Up',
    description: 'Harami + ปิดเขียวแรง — กลับตัว 3 แท่ง',
  },
  'candle-three-inside-down': {
    name: 'Three Inside Down',
    description: 'Harami ขาลง + ปิดแดงแรง — กลับตัว',
  },
  'candle-three-outside-up': {
    name: 'Three Outside Up',
    description: 'Engulfing เขียว + ต่อเนื่อง — แรง',
  },
  'candle-three-outside-down': {
    name: 'Three Outside Down',
    description: 'Engulfing แดง + ต่อเนื่อง — แรง',
  },
  'candle-doji-star': {
    name: 'Doji Star',
    description: 'โดจิที่มีช่องว่างจากแท่งก่อนหน้า',
  },
  'candle-abandoned-baby': {
    name: 'Abandoned Baby',
    description: 'โดจิโดดเดี่ยวคั่นช่องว่างสองข้าง',
  },
  'candle-two-crows': {
    name: 'Two Crows',
    description: 'แท่งแดงสองแท่งกินเนื้อแท่งเขียวก่อนหน้า',
  },
  'candle-upside-gap-two-crows': {
    name: 'Upside Gap Two Crows',
    description: 'Gap ขึ้นแล้วแท่งแดงล้มเหลวสองแท่ง',
  },
  'candle-stick-sandwich': {
    name: 'Stick Sandwich',
    description: 'แดง-เขียว-แดง ปิดระดับเดียวกัน',
  },
  'candle-advance-block': {
    name: 'Advance Block',
    description: 'แท่งเขียวอ่อนแรงสามแท่งที่ยอด',
  },
  'candle-deliberation': {
    name: 'Deliberation',
    description: 'เขียวแรงสองแท่งแล้วแท่งเล็กชะงัก',
  },
  'candle-rising-three-methods': {
    name: 'Rising Three Methods',
    description: 'ย่อตื้นสามแท่งแล้วเบรกขึ้น',
  },
  'candle-falling-three-methods': {
    name: 'Falling Three Methods',
    description: 'ดีดตื้นสามแท่งแล้วเบรกลง',
  },
  'candle-tasuki-gap-up': {
    name: 'Upside Tasuki Gap',
    description: 'Gap ขึ้น ย่อแต่ไม่เติมช่องว่าง',
  },
  'candle-tasuki-gap-down': {
    name: 'Downside Tasuki Gap',
    description: 'Gap ลง ดีดแต่ไม่เติมช่องว่าง',
  },
  'candle-mat-hold': {
    name: 'Mat Hold',
    description: 'ย่อตื้นสี่แท่งแล้วเบรกขึ้นแรง',
  },
  'candle-separating-lines': {
    name: 'Separating Lines',
    description: 'สองแท่งสีเดียวกันเปิดที่ราคาเดียวกัน',
  },
  'pattern-channel-up': {
    name: 'Rising Channel',
    description: 'เส้นแนวโน้มขนานสองเส้นชันขึ้น',
  },
  'pattern-channel-down': {
    name: 'Falling Channel',
    description: 'เส้นแนวโน้มขนานสองเส้นชันลง',
  },
  'pattern-scallop-bottom': {
    name: 'Scallop Bottom (Bowl)',
    description: 'ก้นกลมยาวรูปตัว U',
  },
  'pattern-scallop-top': {
    name: 'Inverted Scallop (Top)',
    description: 'ยอดกลมยาวรูปโดม',
  },
  'pattern-bump-and-run': {
    name: 'Bump-and-Run Reversal',
    description: 'พุ่งชันแล้วเบรกกลับเส้น lead-in',
  },
  'pattern-hook-reversal': {
    name: 'Hook Reversal',
    description: 'ตะขอสวนเทรนด์ปลายขา',
  },
  'pattern-pipe-top': {
    name: 'Pipe Top',
    description: 'สองแท่ง High เท่ากันที่ยอด',
  },
  'pattern-pipe-bottom': {
    name: 'Pipe Bottom',
    description: 'สองแท่ง Low เท่ากันที่ก้น',
  },
  'pattern-v-top': {
    name: 'V-Top (Spike Top)',
    description: 'พุ่งตั้งฉากแล้วกลับตัวรุนแรง',
  },
  'pattern-v-bottom': {
    name: 'V-Bottom (Spike Bottom)',
    description: 'ร่วงตั้งฉากแล้วกลับตัวรุนแรง',
  },
  'pattern-dead-cat-bounce': {
    name: 'Dead Cat Bounce',
    description: 'ดีดอ่อนในขาลงแล้วร่วงต่อ',
  },
  'pattern-measured-move': {
    name: 'Measured Move',
    description: 'สองขาเท่ากันคั่นด้วยธง',
  },
  'pattern-gap-breakaway': {
    name: 'Breakaway Gap',
    description: 'ช่องว่างเบรกกรอบ เริ่มเทรนด์',
  },
  'pattern-gap-runaway': {
    name: 'Runaway Gap',
    description: 'ช่องว่างกลางเทรนด์ วัดระยะทาง',
  },
  'pattern-gap-exhaustion': {
    name: 'Exhaustion Gap',
    description: 'ช่องว่างสุดท้ายปลายเทรนด์ — เตือนกลับตัว',
  },
  'pattern-failed-breakout': {
    name: 'Failed Breakout (Headfake)',
    description: 'เบรกเอาต์ล้มเหลวแล้วพลิกกลับแรง',
  },
  'ict-ote': {
    name: 'ICT OTE (จุดเข้าที่ดีที่สุด)',
    description: 'โซนเข้าเทรดที่ดีที่สุดที่ 61.8–79.6%',
  },
  'ict-power-of-3': {
    name: 'ICT Power of 3 (P.O.3)',
    description: 'รอบรายวัน Accumulate / Manipulate / Distribute',
  },
  'ict-judas-swing': {
    name: 'ICT Judas Swing (จูดาส์สวิง)',
    description: 'ขาแรกสวนเทรนด์ก่อนขาจริง',
  },
  'ict-mitigation-block': {
    name: 'ICT Mitigation Block',
    description: 'Order Block ที่ถูกเติมเต็มแล้วพลิก',
  },
  'ict-reclaim-block': {
    name: 'ICT Reclaim Block (ยึดคืน)',
    description: 'ระดับที่เบรกแล้วราคากลับมายึดคืน',
  },
  'ict-premium-discount': {
    name: 'ICT Premium / Discount (แพง-ถูก)',
    description: 'Equilibrium แบ่งโซนถูก (ซื้อ) / แพง (ขาย)',
  },
  'ict-dealing-range': {
    name: 'ICT Dealing Range (ช่วงราคาหลัก)',
    description: 'กรอบระหว่างสภาพคล่องฝั่งซื้อและขาย',
  },
  'ict-orb': {
    name: 'ORB (เบรกกรอบเปิดตลาด)',
    description: 'เทรดการเบรกกรอบเปิดตลาดครั้งแรก',
  },
  'ict-liquidity-void': {
    name: 'ICT Liquidity Void (ช่องว่างราคา)',
    description: 'ช่องว่างราคาไร้การซื้อขาย — แม่เหล็ก',
  },
  'ict-buyside-liquidity': {
    name: 'ICT Buy-Side Liquidity',
    description: 'Stop order ที่ค้างเหนือ Swing High',
  },
  'ict-sellside-liquidity': {
    name: 'ICT Sell-Side Liquidity',
    description: 'Stop order ที่ค้างใต้ Swing Low',
  },
  'ict-inverse-fvg': {
    name: 'Inverse FVG (ช่องขาลง)',
    description: 'ความไม่สมดุลขาลงจากการพุ่งลง',
  },
  'ict-concealed-fvg': {
    name: 'Concealed FVG (ช่องซ่อน)',
    description: 'ความไม่สมดุลเล็กที่ไส้เทียนซ่อน',
  },
  'ict-displacement': {
    name: 'ICT Displacement (การพุ่งแรง)',
    description: 'ขาพุ่งแรงที่ขับเคลื่อนเทรนด์',
  },
  'ict-turtle-soup': {
    name: 'ICT Turtle Soup (กับดักเต่า)',
    description: 'เทรดกลับตัวหลังการกวาด Stop',
  },
  'ict-point-of-interest': {
    name: 'ICT POI (จุดสนใจ)',
    description: 'โซนบรรจบของเครื่องมือ ICT หลายตัว',
  },
  'ict-order-flow': {
    name: 'ICT Order Flow (กระแสออเดอร์)',
    description: 'อ่าน Absorption และ Expansion ใน tape',
  },
  'ict-htf-bias': {
    name: 'ICT HTF Bias (ไบแอสไทม์เฟรมใหญ่)',
    description: 'ทิศทางที่ไทม์เฟรมใหญ่แนะนำ',
  },
  'ict-asia-range': {
    name: 'Asia Range (กรอบเอเชีย)',
    description: 'กรอบข้ามคืนที่ลอนดอนเบรก',
  },
  'ict-consolidation': {
    name: 'การสะสมกำลัง (Consolidation)',
    description: 'ช่วงขดตัวก่อนการขยายตัว',
  },
  'ind-sma-ema': {
    name: 'Moving Average Crossover (ตัดเส้น)',
    description: 'Golden cross / death cross ของ MA',
  },
  'ind-adx': {
    name: 'ADX (ความแรงของเทรนด์)',
    description: 'วัดความแข็งแรงของเทรนด์ ไม่ใช่ทิศทาง',
  },
  'ind-stochastic': {
    name: 'Stochastic Oscillator',
    description: 'Overbought / oversold เทียบกรอบล่าสุด',
  },
  'ind-atr': {
    name: 'ATR (ความผันผวน)',
    description: 'Average True Range — ความผันผวน',
  },
  'ind-super-trend': {
    name: 'SuperTrend',
    description: 'Trailing stop แบบ ATR พลิกตามเทรนด์',
  },
  'ind-keltner': {
    name: 'Keltner Channel',
    description: 'EMA ในแถบความผันผวนแบบ ATR',
  },
  'ind-vwap': {
    name: 'VWAP (ราคาเฉลี่ยถ่วงวอลุ่ม)',
    description: 'ราคาเฉลี่ยถ่วงวอลุ่ม — มาตรฐานสถาบัน',
  },
  'ind-obv': {
    name: 'OBV (วอลุ่มสะสม)',
    description: 'วอลุ่มสะสมที่ยืนยันหรือ Divergence กับราคา',
  },
  'ind-mfi': {
    name: 'MFI (ดัชนีกระแสเงิน)',
    description: 'RSI ถ่วงวอลุ่ม overbought เกิน 80',
  },
  'ind-pivot-points': {
    name: 'Pivot Points (จุดหมุน)',
    description: 'แนวรับ/ต้านคลาสสิกจากช่วงก่อนหน้า',
  },
  'ind-bollinger-squeeze': {
    name: 'Bollinger Squeeze (บีบตัว)',
    description: 'แถบบีบอัด — เตรียมการขยายตัว',
  },
  'ind-parabolic-sar': {
    name: 'Parabolic SAR',
    description: 'จุดไล่ตามที่พลิกเมื่อเทรนด์เปลี่ยน',
  },
  'ind-cci': {
    name: 'CCI (ดัชนีช่องสินค้า)',
    description: 'ราคาเทียบเบี่ยงเบนจากค่าเฉลี่ย ±100',
  },
  'ind-williams-r': {
    name: 'Williams %R',
    description: 'โมเมนตัมนำ −20 / −80',
  },
  'ind-aroon': {
    name: 'Aroon',
    description: 'เวลาตั้งแต่ High/Low ล่าสุด — ความสดของเทรนด์',
  },
  'harm-deep-crab': {
    name: 'Deep Crab (ปูดำน้ำลึก)',
    description: 'ฮาร์โมนิกที่ D ยื่นต่ำกว่า X',
  },
  'harm-5-0': {
    name: 'รูปแบบ 5-0',
    description: 'ห้าจุด X-A-B-C-D ที่ B เลย X',
  },
  'harm-three-drives': {
    name: 'Three Drives (สามจังหวะ)',
    description: 'สามขาที่หมดแรงที่ขาที่สาม',
  },
  'harm-nenstar': {
    name: 'Nenstar',
    description: 'ฮาร์โมนิกที่ D จบใกล้ X',
  },
  'harm-alternate-bat': {
    name: 'Alternate Bat (ค้างคาวพิเศษ)',
    description: 'ฮาร์โมนิกที่ D ดันเลย A',
  },
  'harm-anti-butterfly': {
    name: 'Anti-Butterfly',
    description: 'Butterfly ที่ D ~2.0 ของ XA',
  },
  'ew-zigzag': {
    name: 'Elliott Zigzag (ซิกแซก)',
    description: 'การปรับฐาน 5-3-5 ที่คม',
  },
  'ew-flat': {
    name: 'Elliott Flat (แบนราบ)',
    description: 'การปรับฐาน 3-3-5 แนวราบ',
  },
  'ew-triangle': {
    name: 'Elliott Triangle (สามเหลี่ยม)',
    description: 'การปรับฐาน 3-3-3-3-3 หดแคบ',
  },
  'ew-diagonal': {
    name: 'Elliott Diagonal (เส้นทแยง)',
    description: 'ลิ่มซ้อนทับ จบด้วยการกลับตัว',
  },
  'ew-extension': {
    name: 'Elliott Wave 3 (ขยายตัว)',
    description: 'คลื่น 3 ยาวและแรงที่สุด',
  },
  'ew-wxy': {
    name: 'Elliott WXY (ซิกแซกคู่)',
    description: 'Zigzag สองลูกเชื่อมด้วย X',
  },
  'dow-theory': {
    name: 'Dow Theory (ทฤษฎีดาว)',
    description: 'เทรนด์ Primary / secondary / minor',
  },
  'gann-angles': {
    name: 'Gann Angles (มุมแกนน์)',
    description: 'เส้นมุมเฉพาะ; 1×1 (45°) สำคัญ',
  },
  'market-profile': {
    name: 'Market Profile (TPO)',
    description: 'เวลาต่อราคา value area และ POC',
  },
  'auction-market-theory': {
    name: 'Auction Market Theory (ทฤษฎีประมูล)',
    description: 'สมดุลและไม่สมดุล — กลไกราคา',
  },
  'pa-inside-bar': {
    name: 'Inside Bar (แท่งใน)',
    description: 'บีบอัดในแท่งแม่แล้วเบรกเอาต์',
  },
  'pa-outside-bar': {
    name: 'Outside Bar (แท่งนอก)',
    description: 'ขยายตัวกลืนแท่งก่อนหน้า',
  },
  'pa-fakey': {
    name: 'Fakey (หลอกทะลุ)',
    description: 'เบรกหลอกที่เด้งกลับเข้ากรอบ',
  },
  'pa-123-reversal': {
    name: '1-2-3 Reversal (กลับตัว 1-2-3)',
    description: 'จุดสุดขั้ว ขาสวน HL สูงขึ้น แล้วยืนยัน',
  },
  'pa-pin-bar': {
    name: 'Pin Bar (แท่งเข็ม)',
    description: 'ไส้เทียนยาวปฏิเสธ — สัญญาณกลับตัว',
  },
  'risk-position-sizing': {
    name: 'การคำนวณขนาดออเดอร์',
    description: 'เสี่ยง % ของทุน ขนาดตามระยะ Stop',
  },
  'risk-stop-placement': {
    name: 'การวาง Stop Loss',
    description: 'Stop เลยโครงสร้างเผื่อ Noise',
  },
  'risk-r-multiple': {
    name: 'R-Multiples (ผลตอบแทนเทียบเสี่ยง)',
    description: 'แสดงผลลัพธ์เป็น R และวัด Edge',
  },
  'trading-journal': {
    name: 'Trading Journal & Metrics',
    description: 'จดทุกเทรดและทบทวนข้อมูล',
  },
  'strategy-swing-trading': {
    name: 'Swing Trading',
    description: 'ถือออเดอร์หลายวันถึงหลายสัปดาห์',
  },
  'strategy-scalping': {
    name: 'Scalping',
    description: 'กำไรเล็ก เร็ว ความถี่สูง',
  },
};

/** Resolves a category display name for the current language. */
export function categoryName(name: string, lang: Language): string {
  if (lang === 'th' && TH_CATEGORIES[name]) return TH_CATEGORIES[name];
  return name;
}

/** Resolves a group heading for the current language. */
export function groupName(name: string, lang: Language): string {
  if (lang === 'th' && TH_GROUPS[name]) return TH_GROUPS[name];
  return name;
}

/** Resolves a concept's display name for the current language. */
export function conceptName(concept: Concept, lang: Language): string {
  if (lang === 'th' && TH_CONCEPTS[concept.id]) return TH_CONCEPTS[concept.id].name;
  return concept.name;
}

/** Resolves a concept's one-line description for the current language. */
export function conceptDescription(concept: Concept, lang: Language): string {
  if (lang === 'th' && TH_CONCEPTS[concept.id]) return TH_CONCEPTS[concept.id].description;
  return concept.description;
}
