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
    description: 'ระบบเบรกเอาท์ 20 วัน พร้อม Stop แบบ ATR',
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
