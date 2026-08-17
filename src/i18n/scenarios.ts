/**
 * Thai translations for the concept scenarios. The four playbook setups carry
 * their own nested `{ en, th }` text inside `scenarios.ts`; every other
 * scenario falls back to this dictionary when the UI language is Thai.
 */
export interface ScenarioTh {
  title: string;
  summary: string;
  keyPoints: string[];
  /** Thai labels keyed by the English legend label. */
  legend?: Record<string, string>;
}

export const TH_SCENARIOS: Record<string, ScenarioTh> = {
  high: {
    title: 'จุดสูงสุด (High)',
    summary:
      'High คือราคาสูงสุดที่ซื้อขายได้ในช่วงเวลาที่กำหนด (แท่งเทียน วัน เซสชัน หรือสวิง) เป็นจุดพีคของแรงซื้อก่อนที่ผู้ขายจะเข้ามา',
    keyPoints: [
      'High คือปลายไส้เทียนบน ไม่ใช่ราคาปิด',
      'Swing High เกิดเมื่อราคาพลิกกลับลงจากพีค ทิ้งราคาที่ต่ำกว่าอย่างน้อยหนึ่งแท่งทั้งสองข้าง',
      'การแตะ High เดิมซ้ำ ๆ สร้างแนวต้าน (ดู EQH)',
    ],
    legend: {
      'Period high': 'High ของช่วงเวลา',
      'High level': 'ระดับ High',
    },
  },
  low: {
    title: 'จุดต่ำสุด (Low)',
    summary:
      'Low คือราคาต่ำสุดที่ซื้อขายได้ในช่วงเวลาที่กำหนด เป็นจุดพีคของแรงขายก่อนที่ผู้ซื้อจะกลับเข้ามา',
    keyPoints: [
      'Low คือปลายไส้เทียนล่าง ไม่ใช่ราคาปิด',
      'Swing Low เกิดเมื่อราคาพลิกกลับขึ้นจากก้น ทิ้งราคาที่สูงกว่าอย่างน้อยหนึ่งแท่งทั้งสองข้าง',
      'การแตะ Low เดิมซ้ำ ๆ สร้างแนวรับ (ดู EQL)',
    ],
    legend: {
      'Period low': 'Low ของช่วงเวลา',
      'Low level': 'ระดับ Low',
    },
  },
  'swing-high': {
    title: 'Swing High',
    summary:
      'Swing High (SH) คือจุดพีคที่ราคาพลิกกลับลง ยืนยันด้วยราคาที่ต่ำกว่าอย่างน้อยหนึ่งแท่งทั้งซ้ายและขวา ทำให้กลายเป็นจุดหมุน (pivot)',
    keyPoints: [
      'Swing High คือจุดหมุนที่กำหนดขา downtrend และแนวต้าน',
      'ใน uptrend Swing High จะสูงขึ้นเรื่อย ๆ — นั่นคือลำดับ HH',
      'การเบรกเหนือ Swing High คือทริกเกอร์ของ BOS',
    ],
    legend: { 'Swing High pivot': 'จุดหมุน Swing High' },
  },
  'swing-low': {
    title: 'Swing Low',
    summary:
      'Swing Low (SL) คือจุดก้นที่ราคาพลิกกลับขึ้น ยืนยันด้วยราคาที่สูงกว่าอย่างน้อยหนึ่งแท่งทั้งซ้ายและขวา',
    keyPoints: [
      'Swing Low คือจุดหมุนที่กำหนดขา uptrend และแนวรับ',
      'ใน downtrend Swing Low จะต่ำลงเรื่อย ๆ — นั่นคือลำดับ LL',
      'การเบรกใต้ Swing Low คือทริกเกอร์ของ BOS/CHoCH ฝั่งขาลง',
    ],
    legend: { 'Swing Low pivot': 'จุดหมุน Swing Low' },
  },
  hh: {
    title: 'Higher High (HH)',
    summary:
      'Higher High คือ Swing High ที่สูงกว่า Swing High ก่อนหน้า HH ติดต่อกันยืนยันว่าผู้ซื้อควบคุมตลาดและเทรนด์เป็นขาขึ้น',
    keyPoints: [
      'HH + HL (Higher Low) คือลายนิ้วมือของ uptrend ที่แข็งแรง',
      'HH แต่ละครั้งแสดงว่าดีมานด์ดูดซับซัปพลายได้ในระดับราคาที่สูงขึ้น',
      'เมื่อราคาหยุดสร้าง HH ให้ระวังการกลับตัว (CHoCH)',
    ],
    legend: { 'Higher High': 'Higher High' },
  },
  hl: {
    title: 'Higher Low (HL)',
    summary:
      'Higher Low คือ Swing Low ที่สูงกว่า Swing Low ก่อนหน้า HL แสดงว่าแม้การย่อก็ยังถูกซื้อ — ลักษณะเด่นของโครงสร้างขาขึ้น',
    keyPoints: [
      'HL คือ “ขั้นบันได” ของ uptrend — การย่อแต่ละครั้งหยุดสูงกว่าครั้งก่อน',
      'ตราบใดที่ราคายังสร้าง HL เส้นทางที่มีแรงต้านน้อยที่สุดคือขึ้น',
      'HL แท่งสุดท้ายคือจุดยกเลิก (invalidation) ของเทรนด์ขาขึ้น',
    ],
    legend: { 'Higher Low': 'Higher Low' },
  },
  lh: {
    title: 'Lower High (LH)',
    summary:
      'Lower High คือ Swing High ที่ต่ำกว่า Swing High ก่อนหน้า LH ติดต่อกันยืนยันว่าผู้ขายควบคุมตลาดและเทรนด์เป็นขาลง',
    keyPoints: [
      'LH + LL (Lower Low) คือลายนิ้วมือของ downtrend ที่แข็งแรง',
      'การดีดที่ล้มเหลวแต่ละครั้งแสดงว่าซัปพลายชนะดีมานด์ในราคาที่ต่ำลง',
      'เมื่อราคาหยุดสร้าง LH ให้ระวังการกลับตัวเป็นขาขึ้น',
    ],
    legend: { 'Lower High': 'Lower High' },
  },
  ll: {
    title: 'Lower Low (LL)',
    summary:
      'Lower Low คือ Swing Low ที่ต่ำกว่า Swing Low ก่อนหน้า LL แสดงว่าการดีดล้มเหลวซ้ำ ๆ และการเทขายแต่ละครั้งลึกขึ้นเรื่อย ๆ',
    keyPoints: [
      'LL คือ “ขั้นบันได” ของ downtrend — การเทขายแต่ละครั้งก้นต่ำกว่าครั้งก่อน',
      'ตราบใดที่ราคายังสร้าง LL เส้นทางที่มีแรงต้านน้อยที่สุดคือลง',
      'LL แท่งสุดท้ายคือจุดยกเลิกของเทรนด์ขาลง',
    ],
    legend: { 'Lower Low': 'Lower Low' },
  },
  eqh: {
    title: 'Equal Highs (EQH)',
    summary:
      'Equal Highs คือ Swing High ตั้งแต่สองจุดขึ้นไปที่เกิดขึ้นในระดับราคา (เกือบ) เท่ากัน การถูกปฏิเสธซ้ำ ๆ หมายถึงโซนซัปพลายที่เทรดเดอร์จับตาเพื่อรอการเบรก',
    keyPoints: [
      'ยิ่งแตะบ่อย ยิ่งแข็งแรง — เป็นแม่เหล็กดึงดูดออเดอร์ Stop',
      'หากราคาเบรกเหนือ EQH ได้ในที่สุด โซนมักจะพลิกเป็นแนวรับ',
      'ในกรอบราคา EQH + EQL คือขอบที่เทรดได้',
    ],
    legend: { 'EQH zone': 'โซน EQH', 'EQH level': 'ระดับ EQH' },
  },
  eql: {
    title: 'Equal Lows (EQL)',
    summary:
      'Equal Lows คือ Swing Low ตั้งแต่สองจุดขึ้นไปที่เกิดขึ้นในระดับราคา (เกือบ) เท่ากัน การดีดซ้ำ ๆ หมายถึงโซนดีมานด์ที่ผู้ซื้อปกป้องระดับนี้',
    keyPoints: [
      'EQL ทำหน้าที่เป็นแนวรับ — ราคาดีดทุกครั้งที่มาถึง',
      'หากราคาเบรกใต้ EQL ได้ในที่สุด โซนมักจะพลิกเป็นแนวต้าน',
      'ในกรอบราคา EQL คือจุดที่เทรดเดอร์มองหาโอกาสเข้าซื้อ',
    ],
    legend: { 'EQL zone': 'โซน EQL', 'EQL level': 'ระดับ EQL' },
  },
  uptrend: {
    title: 'เทรนด์ขาขึ้น (Uptrend)',
    summary:
      'Uptrend คือสภาวะตลาดที่นิยามด้วยลำดับ Higher High และ Higher Low ผู้ซื้อดูดซับทุกการย่อและพาราคาขึ้นสู่จุดสูงสุดใหม่',
    keyPoints: [
      'โครงสร้าง: HH → HL → HH → HL… แต่ละสวิงสูงกว่าครั้งก่อน',
      'เส้นแนวโน้มขาขึ้นตาม Swing Low คือกระดูกสันหลังของเทรนด์',
      'เทรนเดอร์ซื้อตอนย่อเข้าหา HL และถือจนกว่า HL สุดท้ายจะถูกเบรก',
    ],
    legend: {
      'Higher High': 'Higher High',
      'Higher Low': 'Higher Low',
      'Ascending swing-low line': 'เส้นแนวรับขาขึ้น',
    },
  },
  downtrend: {
    title: 'เทรนด์ขาลง (Downtrend)',
    summary:
      'Downtrend คือสภาวะตลาดที่นิยามด้วยลำดับ Lower High และ Lower Low ผู้ขายชนะทุกการดีดและพาราคาลงสู่จุดต่ำสุดใหม่',
    keyPoints: [
      'โครงสร้าง: LH → LL → LH → LL… แต่ละสวิงต่ำกว่าครั้งก่อน',
      'เส้นแนวโน้มขาลงตาม Swing High คือกระดูกสันหลังของเทรนด์',
      'เทรนเดอร์ขายตอนดีดเข้าหา LH และถือจนกว่า LH สุดท้ายจะถูกยึดคืน',
    ],
    legend: {
      'Lower High': 'Lower High',
      'Lower Low': 'Lower Low',
      'Descending swing-high line': 'เส้นแนวต้านขาลง',
    },
  },
  sideway: {
    title: 'Sideways / กรอบราคา',
    summary:
      'ตลาด Sideways (กรอบราคา) ไม่มีทิศทาง: ราคาแกว่งระหว่างโซนดีมานด์ (EQL) กับโซนซัปพลาย (EQH) เทรดเดอร์กรอบราคาจะเทรดที่ขอบ',
    keyPoints: [
      'ทั้ง EQH และ EQL ยืนอยู่ — ไม่เกิดลำดับ HH/HL หรือ LH/LL',
      'กติกากรอบราคา: ซื้อที่ EQL ขายที่ EQH และอยู่ห่างจากกลางกรอบ',
      'การเบรกระดับใดระดับหนึ่งบ่งบอกว่ากรอบกำลังจะจบ (ดู BOS)',
    ],
    legend: { 'EQH supply zone': 'โซนซัปพลาย EQH', 'EQL demand zone': 'โซนดีมานด์ EQL' },
  },
  impulse: {
    title: 'จังหวะพุ่งแรง (Impulse)',
    summary:
      'Impulse คือขาที่แข็งแรง รวดเร็ว และมีทิศทางของเทรนด์ — โดยปกติคือจังหวะที่สร้าง HH ใหม่ เป็น “เชื้อเพลิง” ของเทรนด์ที่ขับเคลื่อนด้วยโมเมนตัม',
    keyPoints: [
      'Impulse ชัน ปิดใกล้จุดสูงสุด และมักขยายช่วงราคา',
      'เทรนด์คือชุดของ Impulse ที่คั่นด้วยการย่อเล็ก ๆ',
      'กำไรก้อนใหญ่ของรอบนั้นเกิดในขา Impulse',
    ],
    legend: { 'Impulse leg': 'ขา Impulse', 'Swing low start': 'จุดเริ่ม Swing Low' },
  },
  pullback: {
    title: 'การย่อตัว (Pullback)',
    summary:
      'Pullback คือการย่อทวนเทรนด์ที่ตามหลัง Impulse ใน uptrend คือการย่อลงชั่วคราวสู่ดีมานด์ — จุดที่เทรดเดอร์มองหาเพื่อเข้าร่วมเทรนด์',
    keyPoints: [
      'Pullback ตื้นและช้ากว่า Impulse',
      'ใน uptrend การย่อหาผู้ซื้อที่ HL / โซนดีมานด์',
      'เซ็ตอัปเข้า: ซื้อตอนย่อ วาง Stop ใต้จุดต่ำสุดของการย่อ',
    ],
    legend: { 'Pullback leg': 'ขาการย่อ', 'Pullback low': 'จุดต่ำสุดของการย่อ' },
  },
  bos: {
    title: 'การเบรกโครงสร้าง (BOS)',
    summary:
      'Break of Structure (BOS) เกิดเมื่อราคาเบรกเกิน Swing High (หรือ Low) จุดสุดท้ายอย่างมีน้ำหนัก ยืนยันว่าเทรนด์เดินต่อในทิศทางเดิม',
    keyPoints: [
      'BOS = การต่อเนื่อง เทรนด์รักษาทิศทางไว้ โครงสร้างเพียงแค่ขยายออก',
      'ที่นี่ราคาเบรกเหนือ Swing High สุดท้ายที่ 110.0 ด้วยการปิดที่แข็งแรง',
      'BOS ที่แท้จริงมาพร้อมโมเมนตัม — ไม่ใช่การเบรกแบบไส้เทียนบาง ๆ',
    ],
    legend: { 'Broken swing high': 'Swing High ที่ถูกเบรก', 'BOS level': 'ระดับ BOS' },
  },
  choch: {
    title: 'การเปลี่ยนลักษณะ (CHoCH)',
    summary:
      'Change of Character (CHoCH) คือการเบรกจุดสวิงสุดท้ายครั้งแรกที่สวนทิศทางเทรนด์หลัก ที่นี่ uptrend เสีย Higher Low แท่งสุดท้าย — สัญญาณเตือนว่าเทรนด์อาจจบ',
    keyPoints: [
      'CHoCH = สัญญาณแรกของการกลับตัว ยังไม่ใช่การยืนยัน',
      'การเบรก Swing Low สุดท้าย (105.0) มาพร้อมแท่งแดงที่ปิดแข็งแรง',
      'หลัง CHoCH ให้ดูว่าตลาดเริ่มสร้าง LH/LL แทน HH/HL หรือไม่',
    ],
    legend: {
      'CHoCH break candle': 'แท่งเบรก CHoCH',
      'Broken swing low': 'Swing Low ที่ถูกเบรก',
      'Break level': 'ระดับเบรก',
    },
  },
  mss: {
    title: 'การเปลี่ยนโครงสร้างตลาด (MSS)',
    summary:
      'Market Structure Shift (MSS) คือการเบรกโครงสร้างภายใน (minor) หลังการดันครั้งสุดท้ายเข้าหาสภาพคล่อง เป็นรอยร้าวแรกของเทรนด์เก่า — มักใช้แทนกันได้กับ CHoCH',
    keyPoints: [
      'ที่นี่ Higher High สุดท้าย (108.2) ตามด้วยการเบรก Swing Low ภายใน (105.0) อย่างรวดเร็ว',
      'MSS หมายถึงการเบรกโครงสร้างภายใน ส่วน CHoCH หมายถึงเหตุการณ์เดียวกันบนโครงสร้างไทม์เฟรมใหญ่',
      'SMC: MSS หลังการกวาดสภาพคล่อง = โซนกลับตัวความน่าจะเป็นสูง',
    ],
    legend: {
      'MSS break candle': 'แท่งเบรก MSS',
      'Internal swing low': 'Swing Low ภายใน',
      'Final higher high': 'Higher High สุดท้าย',
    },
  },
  'internal-structure': {
    title: 'โครงสร้างภายใน (Internal Structure)',
    summary:
      'Internal Structure คือสวิงย่อย (minor) ของไทม์เฟรมเล็กที่ประกอบเป็นขาใหญ่ สวิง HH/HL เล็ก ๆ เหล่านี้คือสิ่งที่เทรดเดอร์ใช้กำหนดจุดเข้าในจังหวะที่แม่นยำขึ้น',
    keyPoints: [
      'สวิงภายในคือจุดหมุน “ไมโคร” — ที่นี่คือ HL และ SH เล็ก ๆ ทุกจุด',
      'เทรดเดอร์มาร์กโครงสร้างภายในเพื่อหาจุดเข้าที่แม่นยำตอนย่อ',
      'MSS ถูกนิยามด้วยการเบรกโครงสร้างภายใน',
    ],
    legend: { 'Minor swing low (HL)': 'Swing Low เล็ก (HL)', 'Minor swing high (SH)': 'Swing High เล็ก (SH)' },
  },
  'external-structure': {
    title: 'โครงสร้างภายนอก (External Structure)',
    summary:
      'External Structure คือสวิง (macro) ของไทม์เฟรมใหญ่ที่กำหนดเทรนด์โดยรวม มองข้ามเสียงรบกวนเล็ก ๆ แล้วเห็นทิศทางภาพใหญ่ของตลาด',
    keyPoints: [
      'สวิงภายนอกคือจุดหมุน “มาโคร” — ตัวหลักที่กำหนดเทรนด์',
      'ซูมออก: เทรนด์ขึ้นตราบใดที่ลำดับ HH/HL ภายนอกยัง intact',
      'CHoCH หมายถึงการเบรกโครงสร้างภายนอกเมื่อสวิงหลักจุดสุดท้ายถูกเบรก',
    ],
    legend: {
      'Macro swing high': 'Swing High มาโคร',
      'Macro swing low': 'Swing Low มาโคร',
      'Macro trend line': 'เส้นแนวโน้มมาโคร',
    },
  },
  'order-block': {
    title: 'Order Block (OB)',
    summary:
      'Order Block คือแท่งเทียนสีตรงข้ามแท่งสุดท้ายก่อนการเคลื่อนไหวที่พุ่งแรง ใน SMC สถาบันทิ้งออเดอร์ค้างไว้ตรงนั้น — โซนนี้ทำหน้าที่เป็นแนวรับในอนาคต (bullish OB) หรือแนวต้าน (bearish OB)',
    keyPoints: [
      'bullish OB คือแท่งแดงแท่งสุดท้ายก่อนที่การรีบาวด์จะเริ่ม',
      'ให้ถือทั้งช่วงแท่งเทียนเป็นโซน — ไม่ใช่แค่ตัวแท่ง',
      'ราคามักกลับมาที่ OB ก่อนเดินต่อ; เป็นตัวดึงดูดสภาพคล่อง',
    ],
    legend: { 'Order Block zone': 'โซน Order Block', 'OB top': 'ขอบบนของ OB' },
  },
  fvg: {
    title: 'Fair Value Gap (FVG) / ความไม่สมดุล',
    summary:
      'Fair Value Gap คือความไม่สมดุลที่เหลืออยู่เมื่อการพุ่ง 3 แท่งทิ้งช่องว่างราคา: High ของแท่งแรกต่ำกว่า Low ของแท่งที่สาม (bullish FVG) ราคามักกลับมาเยือน',
    keyPoints: [
      'FVG = ช่องว่างระหว่าง High แท่งที่ 1 กับ Low แท่งที่ 3 ของจังหวะพุ่งแรง',
      'ช่องว่างแทนออเดอร์ที่ยังไม่ถูกเติม — ราคามักกลับมา',
      'การเติมบางส่วนเป็นเรื่องปกติ; การปิดทะลุทั้งแท่งทำให้โซนเป็นโมฆะ',
    ],
    legend: { 'Fair Value Gap': 'Fair Value Gap', 'FVG bounds': 'ขอบของ FVG' },
  },
  'liquidity-sweep': {
    title: 'การกวาดสภาพคล่อง (Liquidity Sweep)',
    summary:
      'Liquidity Sweep คือไส้เทียนที่กวาด Stop ที่ค้างอยู่เกินจุดสวิงก่อนจะพลิกกลับ สถาบันล่าออเดอร์ Stop ที่รวมตัวกัน แล้วเทรดสวนทาง',
    keyPoints: [
      'Stop อยู่ใต้ Swing Low — “สภาพคล่องฝั่งขาย”',
      'การกวาด (103.2) ทะลุ Swing Low สุดท้าย (105.0) แต่ปิดกลับเข้ามา',
      'การกวาด + การปฏิเสธคือทริกเกอร์กลับตัวคลาสสิก (และมักนำหน้า BOS)',
    ],
    legend: {
      'Sweep candle': 'แท่งกวาดสภาพคล่อง',
      'Sell-side liquidity zone': 'โซนสภาพคล่องฝั่งขาย',
      'Swept level': 'ระดับที่ถูกกวาด',
    },
  },
  inducement: {
    title: 'Inducement (IDM)',
    summary:
      'Inducement คือ Swing High หรือ Low เล็ก ๆ ที่ถูกสร้างขึ้นเพื่อล่อให้เทรดเดอร์เข้าออเดอร์ก่อนเวลาอันควร ราคาเบรกมันเล็กน้อย ดักพวกเขาไว้ แล้วพลิกกลับสู่ทิศทางจริง',
    keyPoints: [
      'High เล็ก ๆ ที่ 105.8 ดูเหมือนแนวต้าน — นักเทรดรายย่อยเข้าชอร์ตกัน',
      'ราคาเบรก Low เล็ก ๆ (102.8) เพื่อไล่ Stop ผู้ถือ long แล้วพลิกกลับ',
      'การเคลื่อนไหว “จริง” คือทิศทางตรงข้ามหลังกับดักทำงาน',
    ],
    legend: {
      'Inducement level': 'ระดับ Inducement',
      'Bait / fakeout': 'เหยื่อ / การหลอก',
      'Break of IDM': 'การเบรก IDM',
    },
  },
  'kill-zones': {
    title: 'Kill Zones',
    summary:
      'Kill Zones คือช่วงเซสชันที่วอลุ่มสถาบันส่วนใหญ่เกิดขึ้น — ลอนดอน (08:00–12:00 UTC) และนิวยอร์ก (13:00–17:00 UTC) สภาพคล่องถูกสร้างและราคาเคลื่อนไหวแรงที่สุดที่นั่น',
    keyPoints: [
      'การเปิดตลาดลอนดอนมักกำหนดทิศทางของวัน; นิวยอร์กสานต่อหรือพลิกกลับ',
      'กรอบราคาบีบอัดข้ามคืน แล้วขยายตัวเมื่อเซสชันเปิด',
      'เทรดเดอร์จับจังหวะเข้าเทรดตามหน้าต่างเหล่านี้ แทนชั่วโมงที่มีสภาพคล่องต่ำ',
    ],
    legend: {
      'London Kill Zone (08–12 UTC)': 'Kill Zone ลอนดอน (08–12 UTC)',
      'New York Kill Zone (13–17 UTC)': 'Kill Zone นิวยอร์ก (13–17 UTC)',
    },
  },
  accumulation: {
    title: 'การสะสม (Accumulation)',
    summary:
      'Accumulation คือช่วงของ Wyckoff ที่เม็ดเงินใหญ่ซื้อในขณะที่ประชาชนขายเข้าสู่กรอบราคา วอลุ่มเล่าเรื่อง: การเทขายจุดไคลแมกซ์ แล้วซัปพลายหดตัว แล้วจึงเบรกเอาท์',
    keyPoints: [
      'เฟส A: PS (แนวรับเบื้องต้น) → SC (การเทขายไคลแมกซ์) → AR (การดีดอัตโนมัติ)',
      'เฟส B: ST (การทดสอบครั้งที่สอง) ยืนเหนือ Low ของ SC ด้วยวอลุ่มที่ลดลง — ซัปพลายกำลังแห้ง',
      'เฟส C: Spring เขย่ามืออ่อน; เฟส D/E: SOS → Markup',
    ],
    legend: {
      'Selling climax (SC)': 'การเทขายไคลแมกซ์ (SC)',
      'Automatic rally (AR)': 'การดีดอัตโนมัติ (AR)',
      'Secondary test (ST)': 'การทดสอบครั้งที่สอง (ST)',
      Spring: 'Spring',
      'Accumulation range': 'กรอบการสะสม',
    },
  },
  spring: {
    title: 'Spring',
    summary:
      'Spring คือการเขย่าที่ปิดท้ายช่วงสะสม: ราคาเบรกใต้แนวรับของกรอบชั่วครู่เพื่อไล่ Stop แล้วพลิกกลับอย่างรุนแรง — มักมาพร้อมวอลุ่มที่เพิ่มขึ้น เป็นกับดักหมีก่อนช่วง Markup',
    keyPoints: [
      'Spring ทะลุแนวรับของกรอบ (102.6) แต่ปิดกลับเข้ามา',
      'วอลุ่มที่เพิ่มขึ้นในช่วง Spring แสดงการดูดซับ — ผู้ซื้อรายใหญ่เข้ามา',
      'Low ของ Spring คือจุดยกเลิก; การปิดกลับเข้ากรอบคือทริกเกอร์',
    ],
    legend: { 'Spring candle': 'แท่ง Spring', 'Range low': 'แนวรับของกรอบ' },
  },
  markup: {
    title: 'ช่วงขึ้น (Markup)',
    summary:
      'Markup คือช่วงขึ้นของ Wyckoff ที่ตามหลังการสะสม หลัง SOS (สัญญาณความแข็งแกร่ง) เบรกกรอบได้ ราคาจะไต่ขึ้นในเฟสที่สามของวัฏจักร',
    keyPoints: [
      'SOS ที่เบรกแนวสูงของกรอบยืนยันว่า Markup เริ่มแล้ว',
      'Markup ย่อกลับที่ LPS (จุดแนวรับสุดท้าย) — จุดเข้าที่ดีที่สุด',
      'วอลุ่มยังแข็งแรง: ขยายตอนขาขึ้น หดตัวตอนย่อ',
    ],
    legend: {
      'Markup leg': 'ขา Markup',
      'SOS breakout': 'การเบรกเอาท์ SOS',
      'LPS pullback': 'การย่อที่ LPS',
    },
  },
  distribution: {
    title: 'การกระจาย (Distribution)',
    summary:
      'Distribution คือช่วงสร้างยอดของ Wyckoff: เม็ดเงินใหญ่ขายในขณะที่ประชาชนซื้อ เป็นภาพสะท้อนของการสะสม — การซื้อไคลแมกซ์ แล้วกรอบกว้างขึ้น แล้วจึง Markdown',
    keyPoints: [
      'เฟส A: BC (การซื้อไคลแมกซ์) → AR (การตอบสนองอัตโนมัติ) → ST (การทดสอบครั้งที่สอง)',
      'เฟส B: การดีดล้มเหลวรอบแนวสูงเดิม; วอลุ่มบางลง',
      'เฟส C/E: UTAD ดักผู้ซื้อรายปลาย จากนั้น Markdown เริ่ม',
    ],
    legend: {
      'Buying climax (BC)': 'การซื้อไคลแมกซ์ (BC)',
      'Automatic reaction (AR)': 'การตอบสนองอัตโนมัติ (AR)',
      'UTAD trap': 'กับดัก UTAD',
      'Distribution range': 'กรอบการกระจาย',
    },
  },
  utad: {
    title: 'UTAD (Upthrust After Distribution)',
    summary:
      'UTAD คือการดันขึ้นครั้งสุดท้ายของช่วงกระจาย: ราคาพุ่งเหนือกรอบเพื่อไล่ Stop ซื้อ แล้วทรุดตัวลง เป็นกับดักวัวที่ยืนยันยอด',
    keyPoints: [
      'การพุ่ง (115.6) เบรกเหนือแนวสูงของกรอบ (114.4) ด้วยวอลุ่มแรง',
      'ความล้มเหลวทันที — ปิดกลับเข้ากรอบ — เผยกับดัก',
      'UTAD ตรงข้ามกับ Spring: กับดักวัวแทนกับดักหมี',
    ],
    legend: { 'UTAD spike': 'การพุ่ง UTAD', 'Range high': 'แนวสูงของกรอบ' },
  },
  doji: {
    title: 'โดจิ (Doji)',
    summary:
      'Doji เกิดเมื่อราคาเปิดและปิดแทบเท่ากัน — ตลาดเปิดและปิดที่จุดเดียวกัน สื่อถึงความลังเลและมักปรากฏที่จุดเปลี่ยนเทรนด์',
    keyPoints: [
      'Doji มีตัวแท่งเล็กและไส้เทียนยาว — ไม่มีฝ่ายใดชนะ',
      'ที่ยอดของ uptrend doji เตือนถึงความอ่อนล้า (วัวดันต่อไม่ได้)',
      'ที่ก้นของ downtrend doji แสดงว่าผู้ขายเริ่มเสียการควบคุม',
    ],
    legend: { 'Doji at the top': 'Doji ที่ยอด', 'Doji at the bottom': 'Doji ที่ก้น' },
  },
  engulfing: {
    title: 'รูปแบบ Engulfing',
    summary:
      'Engulfing คือแท่งเทียนที่ตัวแท่งกลืนแท่งก่อนหน้าทั้งแท่ง Bullish engulfing ที่แนวรับและ bearish engulfing ที่แนวต้านคือสัญญาณกลับตัวที่แข็งแรง',
    keyPoints: [
      'bearish engulfing กลืนแท่งเขียวก่อนหน้า — ผู้ขายเข้ายึด',
      'bullish engulfing กลืนแท่งแดงก่อนหน้า — ผู้ซื้อเข้ายึด',
      'ความแข็งแรงเพิ่มขึ้นเมื่อเกิดที่โซนสำคัญพร้อมวอลุ่ม',
    ],
    legend: { 'Bearish engulfing': 'Engulfing ขาลง', 'Bullish engulfing': 'Engulfing ขาขึ้น' },
  },
  qml: {
    title: 'Quasimodo (QML)',
    summary:
      'Quasimodo คือโครงสร้างกลับตัวแบบ 1-2-3: Higher High (1), การเบรก Swing Low ก่อนหน้า — แนวคอ (2) — และการรีเทสต์แนวที่เบรก (3) การรีเทสต์คือจุดเข้า Short',
    keyPoints: [
      'Higher High ดูดสภาพคล่องเหนือ High ก่อนหน้า',
      'การเบรกแนวคอ (103.0) ยืนยันการเปลี่ยน',
      'การรีเทสต์ 103.0–104.8 คือจุดเข้า QML — วาง Stop เหนือ High ของการรีเทสต์',
    ],
    legend: { Neckline: 'แนวคอ (Neckline)', 'Retest zone': 'โซนรีเทสต์', 'QML entry': 'จุดเข้า QML' },
  },
  'supply-demand': {
    title: 'โซน Supply & Demand',
    summary:
      'โซน Supply และ Demand คือรอยเท้าของออเดอร์สถาบัน: โซน Demand ที่ฐานของการรีบาวด์แรง โซน Supply ที่ยอดของมัน ราคามักเคารพโซนเหล่านี้เป็นเวลานาน',
    keyPoints: [
      'Demand: แท่งแดงแท่งสุดท้ายก่อนการรีบาวด์ระเบิด (98.0–100.0)',
      'Supply: แท่งเขียวแท่งสุดท้ายก่อนการกลับตัวรุนแรง (110.4–112.4)',
      'โซนยิ่งใหม่และจุดออกยิ่งแรง ยิ่งเชื่อถือได้',
    ],
    legend: { 'Demand zone': 'โซน Demand', 'Supply zone': 'โซน Supply' },
  },
  'elliott-wave': {
    title: 'คลื่น Elliott',
    summary:
      'ทฤษฎีคลื่น Elliott อธิบายตลาดเป็นคลื่นแฟร็กทัล 5-3: คลื่น impulse (1-2-3-4-5) ตามเทรนด์ ตามด้วยการปรับฐาน (A-B-C) สวนทาง รูปแบบนี้เกิดขึ้นซ้ำทุกไทม์เฟรม',
    keyPoints: [
      'คลื่น 1, 3 และ 5 เดินตามเทรนด์; คลื่น 2 และ 4 ย่อ',
      'คลื่น 3 มักยาวและแรงที่สุด — ไม่มีวันสั้นที่สุด',
      'คลื่น 2 ไม่เคยย่อเต็มคลื่น 1; คลื่น 4 ไม่เคยลึกเข้าเขตคลื่น 1',
      'การปรับฐาน A-B-C ทำให้วัฏจักร 5-3 สมบูรณ์ก่อน impulse ถัดไป',
    ],
    legend: { 'Impulse (1-2-3-4-5)': 'Impulse (1-2-3-4-5)', 'Correction (A-B-C)': 'การปรับฐาน (A-B-C)' },
  },
  harmonic: {
    title: 'รูปแบบฮาร์โมนิก (Gartley)',
    summary:
      'รูปแบบฮาร์โมนิกคือโครงสร้าง X-A-B-C-D ที่สร้างจากอัตราส่วน Fibonacci ใน Gartley จุด D จบใกล้ระดับ 0.786 ของ X-A — โซนกลับตัวความน่าจะเป็นสูง (PRZ)',
    keyPoints: [
      'AB ย่อ 0.618 ของ XA; BC ย่อ 0.382–0.886 ของ AB',
      'CD ขยาย 1.272–1.618 ของ BC และสิ้นสุดที่ D',
      'D ใกล้ 0.786 ของ XA คือ Potential Reversal Zone — โซนซื้อ',
      'การบรรจบ (PRZ + ดีมานด์ + เทรนด์) เพิ่มความน่าจะเป็น',
    ],
    legend: { 'Gartley legs (X-A-B-C-D)': 'ขา Gartley (X-A-B-C-D)', 'Potential Reversal Zone': 'โซนกลับตัวที่อาจเกิดขึ้น' },
  },
  vsa: {
    title: 'Volume Spread Analysis (VSA)',
    summary:
      'VSA อ่านซัปพลายและดีมานด์ผ่านความสัมพันธ์ของวอลุ่ม สเปรด (ช่วงราคา) และตำแหน่งปิด ทุกแท่งคือเบาะแสว่าใครควบคุมตลาด — ไม่ต้องใช้อินดิเคเตอร์',
    keyPoints: [
      'Selling climax: วอลุ่มมหาศาล + สเปรดกว้าง + ปิดครึ่งบน = การดูดซับ',
      'No demand: ปิดขาลงด้วยวอลุ่มหด — ผู้ขายหมดแรง',
      'No supply: แท่งขึ้นด้วยวอลุ่มหด — ผู้ซื้อพร้อมดัน',
      'วอลุ่มยืนยันราคา; divergence เตือนการกลับตัว',
    ],
    legend: {
      'Selling climax (climax volume)': 'การเทขายไคลแมกซ์ (วอลุ่มจุดสูงสุด)',
      'No demand (low volume down)': 'ไร้ดีมานด์ (ลงด้วยวอลุ่มต่ำ)',
      'No supply (low volume up)': 'ไร้ซัปพลาย (ขึ้นด้วยวอลุ่มต่ำ)',
    },
  },
  'volume-profile': {
    title: 'Volume Profile & POC',
    summary:
      'Volume Profile แสดงปริมาณการซื้อขายในแต่ละระดับราคา — ต่างจากแท่งวอลุ่มตรงที่เป็นแนวนอน POC (Point of Control) คือระดับราคาที่มีวอลุ่มมากที่สุด; value area คือบริเวณที่ ~70% ของวอลุ่มเกิดขึ้น',
    keyPoints: [
      'POC ทำหน้าที่เป็นแม่เหล็ก — ราคากลับมาที่มันซ้ำแล้วซ้ำเล่า',
      'value area (ส่วนหนาของโปรไฟล์) คือบริเวณที่สถาบันเทรด',
      'การเบรกเหนือ High ของ value area (หรือใต้ Low) สัญญาณการขยายตัว',
      'โหนดสูง = แนวรับ/แนวต้าน; โหนดวอลุ่มต่ำ = การเคลื่อนไหวเร็ว',
    ],
    legend: { 'Value area': 'Value area', 'POC (Point of Control)': 'POC (Point of Control)' },
  },
  ichimoku: {
    title: 'เมฆ Ichimoku',
    summary:
      'Ichimoku Kinko Hyo (“แผนภูมิสมดุลมองครั้งเดียว”) รวมเทรนด์ แนวรับ/แนวต้าน และโมเมนตัมไว้ในระบบเดียว: เส้น Tenkan/Kijun, เมฆอนาคต (Senkou A/B) และ Chikou span',
    keyPoints: [
      'Tenkan-sen (9) & Kijun-sen (26): ค่าเฉลี่ยเร็ว/ช้า — การไขว้กันคือโมเมนตัม',
      'เมฆ (Senkou A/B, เลื่อน +26) แสดงแนวรับ/แนวต้านในอนาคต',
      'ราคาเหนือเมฆ = ภาวะขาขึ้น; ใต้เมฆ = ขาลง; ในเมฆ = สับไปมา',
      'Chikou span (ปิดเลื่อน −26) ยืนยัน: เหนือราคา = ขาขึ้น',
      '“การบิดของเมฆ” (A/B ไขว้) หมายถึงการเปลี่ยนภาวะที่อาจเกิดขึ้น',
    ],
    legend: {
      'Tenkan-sen (conversion)': 'Tenkan-sen (conversion)',
      'Kijun-sen (base)': 'Kijun-sen (base)',
      'Senkou A / B (cloud)': 'Senkou A / B (เมฆ)',
      'Chikou span (lagging)': 'Chikou span (lagging)',
    },
  },
  'mean-reversion': {
    title: 'การกลับสู่ค่าเฉลี่ย (Mean Reversion)',
    summary:
      'Mean reversion เทรดการย่อกลับเข้าหาค่าเฉลี่ย: เมื่อราคายืดไกลเกินไปเหนือหรือใต้ Bollinger Bands (20, 2σ) ราคามักดีดกลับเข้าหาแถบกลาง',
    keyPoints: [
      'แถบขยาย/หดตามความผันผวน — ช่องสัญญาณปรับตามตลาด',
      'การปิดนอกแถบคือการเคลื่อนไหวที่ยืดเกินทางสถิติ',
      'เทรดเดอร์เทรดสวนจุดสุดขั้ว: ขายเมื่อ overbought ซื้อเมื่อ oversold เป้าแถบกลาง',
      'Mean reversion ใช้ได้ดีในกรอบราคา; อันตรายในเทรนด์แรง',
    ],
    legend: {
      'Middle band (SMA 20)': 'แถบกลาง (SMA 20)',
      'Upper / lower band (±2σ)': 'แถบบน / ล่าง (±2σ)',
      'Overbought fade': 'เทรดสวนตอน overbought',
      'Oversold fade': 'เทรดสวนตอน oversold',
    },
  },
  turtle: {
    title: 'Turtle Trading (เบรกเอาท์)',
    summary:
      'Turtle Trading คือระบบเทรดตามเทรนด์จากทดลอง “Turtle” ปี 1983: ซื้อเมื่อราคาเบรก High 20 วัน ขายเมื่อเบรก Low 20 วัน เพิ่มตำแหน่งเมื่อเบรก 10 วัน และเสี่ยงไม่เกิน 2% ต่อออเดอร์ (Stop ที่ 2×ATR)',
    keyPoints: [
      'เข้าเทรด: การปิดแท่งเหนือ High 20 วัน (หรือใต้ Low 20 วัน) คือสัญญาณเปิดออเดอร์',
      'Stop: 2×ATR (หรือ Low/High 10 วัน) — ระบบปล่อยให้กำไรวิ่ง',
      'ออกจากออเดอร์: เบรก 10 วันฝั่งตรงข้าม (ขายเมื่อ Low 10 วันถูกเบรก)',
      'ขนาดตำแหน่ง: เสี่ยงเป็นเปอร์เซ็นต์คงที่ของทุนต่อออเดอร์ — บริหารเงิน ไม่ใช่ราคา',
    ],
    legend: {
      '20-day high (Donchian)': 'High 20 วัน (Donchian)',
      '20-day low (Donchian)': 'Low 20 วัน (Donchian)',
      'Consolidation range': 'กรอบการสะสม',
    },
  },
};

/**
 * Thai legend labels keyed by scenario id, then by the English legend label.
 * The newer scenarios carry inline `{ en, th }` title/summary/keyPoints, so
 * only their chart-legend labels need this dictionary.
 */
export const TH_LEGENDS: Record<string, Record<string, string>> = {
  'ict-silver-bullet': {
    'Silver Bullet Window (Time)': 'หน้าต่างเวลา Silver Bullet',
  },
  'ict-amd': {
    Accumulation: 'Accumulation (การสะสม)',
    Manipulation: 'Manipulation (การปั่น)',
    Distribution: 'Distribution (การกระจาย)',
  },
  'fibonacci-golden-zone': {
    'Impulse Swing': 'ขา Impulse',
    '61.8% Golden Ratio': '61.8% Golden Ratio',
  },
  'rsi-divergence': {
    'Divergence Trend': 'แนว Divergence',
  },
  'macd-crossover': {
    'Bearish Signal': 'สัญญาณขาลง',
    'Bullish Signal': 'สัญญาณขาขึ้น',
  },
  'candle-hanging-man': { 'Hanging Man': 'Hanging Man (คนแขวนคอ)' },
  'candle-inverted-hammer': { 'Inverted Hammer': 'Inverted Hammer (ค้อนกลับหัว)' },
  'candle-spinning-top': { 'Spinning Top': 'Spinning Top (ลูกข่าง)' },
  'candle-dragonfly-doji': { 'Dragonfly Doji': 'Dragonfly Doji (แมลงปอ)' },
  'candle-gravestone-doji': { 'Gravestone Doji': 'Gravestone Doji (หลุมศพ)' },
  'candle-long-legged-doji': { 'Long-Legged Doji': 'Long-Legged Doji (โดจิขายาว)' },
  'candle-tweezer-top': { 'Tweezer Top': 'Tweezer Top (ยอดแหนบ)' },
  'candle-tweezer-bottom': { 'Tweezer Bottom': 'Tweezer Bottom (ก้นแหนบ)' },
  'candle-piercing-line': { 'Piercing Line': 'Piercing Line (แทงทะลุ)' },
  'candle-dark-cloud-cover': { 'Dark Cloud Cover': 'Dark Cloud Cover (เมฆดำ)' },
  'candle-kicker': { 'Bullish Kicker': 'Bullish Kicker (เตะกลับ)' },
  'candle-belt-hold': { 'Belt Hold': 'Belt Hold (โยโกซูน่า)' },
  'candle-homing-pigeon': { 'Homing Pigeon': 'Homing Pigeon (นกพิราบ)' },
  'candle-matching-low': { 'Matching Low': 'Matching Low (ก้นเท่ากัน)' },
  'candle-in-neck': { 'In-Neck': 'In-Neck Line (เข้าคอ)' },
  'candle-on-neck': { 'On-Neck': 'On-Neck Line (ติดคอ)' },
  'candle-thrusting': { Thrusting: 'Thrusting (ดันเข้า)' },
  'candle-three-inside-up': { 'Three Inside Up': 'Three Inside Up (สามแท่งใน-ขึ้น)' },
  'candle-three-inside-down': { 'Three Inside Down': 'Three Inside Down (สามแท่งใน-ลง)' },
  'candle-three-outside-up': { 'Three Outside Up': 'Three Outside Up (สามแท่งนอก-ขึ้น)' },
  'candle-three-outside-down': { 'Three Outside Down': 'Three Outside Down (สามแท่งนอก-ลง)' },
  'candle-doji-star': { 'Doji Star': 'Doji Star (ดาวโดจิ)' },
  'candle-abandoned-baby': { 'Abandoned Baby': 'Abandoned Baby (ทารกโดดเดี่ยว)' },
  'candle-two-crows': { 'Two Crows': 'Two Crows (อีกาสองตัว)' },
  'candle-upside-gap-two-crows': { 'Upside Gap Two Crows': 'Upside Gap Two Crows (อีกา Gap ขึ้น)' },
  'candle-stick-sandwich': { 'Stick Sandwich': 'Stick Sandwich (แซนด์วิช)' },
  'candle-advance-block': { 'Advance Block': 'Advance Block (ขบวนขึ้นที่อ่อนแรง)' },
  'candle-deliberation': { Deliberation: 'Deliberation (การไตร่ตรอง)' },
  'candle-rising-three-methods': { 'Rising Three Methods': 'Rising Three Methods (ขึ้นสามวิธี)' },
  'candle-falling-three-methods': { 'Falling Three Methods': 'Falling Three Methods (ลงสามวิธี)' },
  'candle-tasuki-gap-up': { 'Upside Tasuki Gap': 'Upside Tasuki Gap (Gap ขึ้นแบบ Tasuki)' },
  'candle-tasuki-gap-down': { 'Downside Tasuki Gap': 'Downside Tasuki Gap (Gap ลงแบบ Tasuki)' },
  'candle-mat-hold': { 'Mat Hold': 'Mat Hold (ยึดเสื่อ)' },
  'candle-separating-lines': { 'Separating Lines': 'Separating Lines (เส้นแยก)' },
  'pattern-channel-up': {
    'Channel support': 'แนวรับของช่อง',
    'Channel resistance': 'แนวต้านของช่อง',
  },
  'pattern-channel-down': {
    'Channel resistance': 'แนวต้านของช่อง',
    'Channel support': 'แนวรับของช่อง',
  },
  'pattern-scallop-bottom': {
    'Rim-to-rim': 'ขอบชามถึงขอบชาม',
    'Bowl low': 'ก้นชาม',
  },
  'pattern-scallop-top': {
    'Rim-to-rim': 'ขอบชามถึงขอบชาม',
    'Bowl high': 'ยอดชามคว่ำ',
  },
  'pattern-bump-and-run': {
    'Lead-in trendline': 'เส้นแนวโน้ม Lead-in',
  },
  'pattern-hook-reversal': { 'Hook low': 'จุดต่ำสุดของตะขอ' },
  'pattern-pipe-top': { 'Pipe top': 'ยอดท่อ (Pipe Top)' },
  'pattern-pipe-bottom': { 'Pipe bottom': 'ก้นท่อ (Pipe Bottom)' },
  'pattern-v-top': { 'Blow-off top': 'ยอดพุ่งสุดขีด' },
  'pattern-v-bottom': { 'Capitulation low': 'ก้นยอมแพ้ (Capitulation)' },
  'pattern-dead-cat-bounce': { 'Dead cat bounce': 'Dead Cat Bounce (เด้งปลอม)' },
  'pattern-measured-move': {
    'Leg 1': 'ขาที่ 1',
    'Leg 2 (measured)': 'ขาที่ 2 (วัดจากขาที่ 1)',
  },
  'pattern-gap-breakaway': { 'Breakaway gap': 'Breakaway Gap (ช่องว่างเบรกเอาต์)' },
  'pattern-gap-runaway': { 'Runaway gap': 'Runaway Gap (ช่องว่างกลางเทรนด์)' },
  'pattern-gap-exhaustion': { 'Exhaustion gap': 'Exhaustion Gap (ช่องว่างหมดแรง)' },
  'pattern-failed-breakout': { Range: 'กรอบราคา' },
  'ict-ote': { 'OTE zone (61.8–79.6%)': 'โซน OTE (61.8–79.6%)' },
  'ict-power-of-3': {
    Accumulation: 'Accumulation (การสะสม)',
    Manipulation: 'Manipulation (การปั่น)',
    Distribution: 'Distribution (การกระจาย)',
  },
  'ict-judas-swing': {
    'Judas swing': 'Judas Swing (ขาหลอก)',
    'Real move': 'ขาจริง',
  },
  'ict-mitigation-block': { 'Mitigation block': 'Mitigation Block (บล็อกเติมเต็ม)' },
  'ict-reclaim-block': { 'Reclaim level': 'ระดับ Reclaim (ยึดคืน)' },
  'ict-premium-discount': {
    'Discount (buy)': 'Discount (โซนซื้อถูก)',
    'Premium (sell)': 'Premium (โซนขายแพง)',
  },
  'ict-dealing-range': { 'Dealing range': 'Dealing Range (ช่วงราคาหลัก)' },
  'ict-orb': { 'Opening range': 'กรอบเปิดตลาด' },
  'ict-liquidity-void': { 'Liquidity void': 'Liquidity Void (ช่องว่างราคา)' },
  'ict-buyside-liquidity': { 'Buy-side liquidity': 'สภาพคล่องฝั่งซื้อ' },
  'ict-sellside-liquidity': { 'Sell-side liquidity': 'สภาพคล่องฝั่งขาย' },
  'ict-inverse-fvg': { 'Inverse FVG': 'Inverse FVG (FVG กลับด้าน)' },
  'ict-concealed-fvg': { 'Concealed FVG': 'Concealed FVG (FVG ซ่อน)' },
  'ict-displacement': { 'Displacement leg': 'ขา Displacement (พุ่งแรง)' },
  'ict-turtle-soup': { 'Turtle soup entry': 'จุดเข้า Turtle Soup' },
  'ict-point-of-interest': { 'Point of interest': 'Point of Interest (POI)' },
  'ict-order-flow': {
    Absorption: 'Absorption (การดูดซับ)',
    Expansion: 'Expansion (การขยายตัว)',
  },
  'ict-htf-bias': { 'HTF uptrend': 'เทรนด์ขึ้นไทม์เฟรมใหญ่' },
  'ict-asia-range': { 'Asia range': 'Asia Range (กรอบเอเชีย)' },
  'ict-consolidation': { Consolidation: 'Consolidation (การพักตัว)' },
  'ind-sma-ema': {
    'Fast MA': 'MA เร็ว',
    'Slow MA': 'MA ช้า',
  },
  'ind-adx': { 'Strong trend zone': 'โซนเทรนด์แข็งแรง' },
  'ind-stochastic': {
    Overbought: 'Overbought (ซื้อมากเกิน)',
    Oversold: 'Oversold (ขายมากเกิน)',
  },
  'ind-atr': {
    'Quiet (low ATR)': 'เงียบ (ATR ต่ำ)',
    'Volatile (high ATR)': 'ผันผวน (ATR สูง)',
  },
  'ind-super-trend': { 'SuperTrend (short)': 'SuperTrend (ชอร์ต)' },
  'ind-keltner': { 'Keltner bands': 'Keltner Bands (แถบเคลท์เนอร์)' },
  'ind-vwap': { VWAP: 'VWAP' },
  'ind-obv': { 'OBV divergence': 'OBV Divergence' },
  'ind-mfi': { 'MFI signal': 'สัญญาณ MFI' },
  'ind-pivot-points': { 'Pivot levels': 'ระดับ Pivot' },
  'ind-bollinger-squeeze': { Squeeze: 'Squeeze (การบีบอัด)' },
  'ind-parabolic-sar': { 'Parabolic SAR': 'Parabolic SAR' },
  'ind-cci': {
    Overbought: 'Overbought (ซื้อมากเกิน)',
    Oversold: 'Oversold (ขายมากเกิน)',
  },
  'ind-williams-r': {
    Overbought: 'Overbought (ซื้อมากเกิน)',
    Oversold: 'Oversold (ขายมากเกิน)',
  },
  'ind-aroon': { 'Aroon signal': 'สัญญาณ Aroon' },
  'harm-deep-crab': { 'X-A-B-C-D': 'ขา X-A-B-C-D' },
  'harm-5-0': { 'X-A-B-C-D': 'ขา X-A-B-C-D' },
  'harm-three-drives': { 'Three drives': 'Three Drives (สามขาขับ)' },
  'harm-nenstar': { 'X-A-B-C-D': 'ขา X-A-B-C-D' },
  'harm-alternate-bat': { 'X-A-B-C-D': 'ขา X-A-B-C-D' },
  'harm-anti-butterfly': { 'X-A-B-C-D': 'ขา X-A-B-C-D' },
  'ew-zigzag': { 'Zigzag (5-3-5)': 'Zigzag (5-3-5)' },
  'ew-flat': { 'Flat (3-3-5)': 'Flat (3-3-5)' },
  'ew-triangle': {
    'Upper trendline': 'เส้นแนวโน้มบน',
    'Lower trendline': 'เส้นแนวโน้มล่าง',
  },
  'ew-diagonal': { 'Ending diagonal': 'Ending Diagonal (ลิ่มจบ)' },
  'ew-extension': { 'Extended wave 3': 'คลื่น 3 ขยาย' },
  'ew-wxy': { 'W-X-Y': 'W-X-Y' },
  'dow-theory': {
    'Primary uptrend': 'เทรนด์ขึ้นหลัก',
    'Swing phases': 'เฟสสวิง',
  },
  'gann-angles': {
    '1×1 (45°)': '1×1 (45°)',
    '2×1 / 1×2': '2×1 / 1×2',
  },
  'market-profile': { 'Value area': 'Value Area (โซนมูลค่า)' },
  'auction-market-theory': {
    Balance: 'Balance (สมดุล)',
    Imbalance: 'Imbalance (ไม่สมดุล)',
  },
  'pa-inside-bar': { 'Mother bar range': 'กรอบแท่งแม่' },
  'pa-outside-bar': { 'Outside bar': 'Outside Bar (แท่งนอก)' },
  'pa-fakey': { 'Mother bar range': 'กรอบแท่งแม่' },
  'pa-123-reversal': { 'Trendline break': 'การเบรกเส้นแนวโน้ม' },
  'pa-pin-bar': { 'Pin bar': 'Pin Bar (แท่งเข็ม)' },
  'risk-position-sizing': { 'Risk plan': 'แผนความเสี่ยง' },
  'risk-r-multiple': { '1R / 2R plan': 'แผน 1R / 2R' },
  'risk-stop-placement': { 'Stop placement': 'ตำแหน่ง Stop' },
  'strategy-swing-trading': { 'Swing structure': 'โครงสร้าง Swing' },
  'strategy-scalping': { 'Scalp range': 'กรอบ Scalp' },
  'trading-journal': { 'Tracked trades': 'ออเดอร์ที่บันทึก' },
};
