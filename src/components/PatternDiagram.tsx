import type { ReactNode } from 'react';
import type { Language } from '../data/types';

/**
 * Locally-drawn SVG diagrams for the chart-pattern techniques. Each pattern
 * gets its own schematic (lines, zones and labels) rendered with the app's
 * palette — no external images.
 */

/* Palette (mirrors the chart theme) */
const C = {
  bull: '#0ecb81',
  bear: '#f6465d',
  accent: '#4f8cff',
  cyan: '#22d3ee',
  amber: '#fbbf24',
  violet: '#a78bfa',
  muted: '#8a94a6',
  faint: '#3a4256',
  bg: 'rgba(16, 20, 29, 0.55)',
  text: 'var(--color-text-sub-val)',
  dim: '#8a94a6',
} as const;

const VIEW = '0 0 320 180';

interface DiagramProps {
  lang: Language;
}

/** A small price-path polyline with a soft glow underlay. */
function PricePath({ d, color = C.accent, width = 2.5 }: { d: string; color?: string; width?: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={width + 5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

/** A dashed structure line (neckline, support, resistance…). */
function Guide({ x1, y1, x2, y2, color = C.muted }: { x1: number; y1: number; x2: number; y2: number; color?: string }) {
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.5} strokeDasharray="5 4" strokeOpacity={0.9} />
  );
}

function Label({
  x,
  y,
  children,
  color = C.dim,
  anchor = 'middle',
  size = 10,
}: {
  x: number;
  y: number;
  children: ReactNode;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  size?: number;
}) {
  return (
    <text x={x} y={y} fill={color} fontSize={size} fontWeight={600} textAnchor={anchor} fontFamily="ui-monospace, monospace">
      {children}
    </text>
  );
}

/** Small filled circle marking a key pivot. */
function Dot({ cx, cy, color = C.accent, r = 4 }: { cx: number; cy: number; color?: string; r?: number }) {
  return <circle cx={cx} cy={cy} r={r} fill={color} />;
}

/** An arrow hinting the expected direction after the pattern completes. */
function Arrow({ x, y, dir, color = C.bull }: { x: number; y: number; dir: 'up' | 'down'; color?: string }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle r={13} fill={color} fillOpacity={0.14} />
      {dir === 'up' ? (
        <path d="M0 -7 L5 3 L-5 3 Z" fill={color} />
      ) : (
        <path d="M0 7 L5 -3 L-5 -3 Z" fill={color} />
      )}
    </g>
  );
}

/** A single candlestick: body rect + wick line. */
function Candle({ x, bodyTop, bodyBottom, wickTop, wickBottom, color }: { x: number; bodyTop: number; bodyBottom: number; wickTop: number; wickBottom: number; color: string }) {
  return (
    <g>
      <line x1={x} y1={wickTop} x2={x} y2={wickBottom} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <rect x={x - 8} y={bodyTop} width={16} height={Math.max(3, bodyBottom - bodyTop)} rx={2} fill={color} />
    </g>
  );
}

/* ---------------------------------------------------------------------------
 * Candlestick patterns
 * ------------------------------------------------------------------------- */

function DojiDiagram({ lang }: DiagramProps) {
  const t = lang === 'th' ? { top: 'Doji ที่ยอด', bottom: 'Doji ที่ก้น' } : { top: 'Doji at top', bottom: 'Doji at bottom' };
  return shell(
    <>
      <Candle x={50} bodyTop={60} bodyBottom={62} wickTop={40} wickBottom={86} color={C.amber} />
      <Candle x={120} bodyTop={100} bodyBottom={102} wickTop={78} wickBottom={124} color={C.amber} />
      <Candle x={190} bodyTop={50} bodyBottom={52} wickTop={28} wickBottom={76} color={C.amber} />
      <Candle x={260} bodyTop={122} bodyBottom={124} wickTop={98} wickBottom={148} color={C.amber} />
      <Label x={50} y={26} anchor="middle" color={C.amber}>{t.top}</Label>
      <Label x={260} y={162} anchor="middle" color={C.amber}>{t.bottom}</Label>
    </>,
  );
}

function Hammer({ lang }: DiagramProps) {
  const t = lang === 'th' ? { wick: 'ไส้ล่างยาว', body: 'ตัวเล็ก', confirm: 'ยืนยัน' } : { wick: 'Long lower wick', body: 'Small body', confirm: 'Confirm' };
  return shell(
    <>
      <Candle x={45} bodyTop={30} bodyBottom={70} wickTop={24} wickBottom={76} color={C.bear} />
      <Candle x={85} bodyTop={60} bodyBottom={100} wickTop={54} wickBottom={106} color={C.bear} />
      <Candle x={125} bodyTop={90} bodyBottom={130} wickTop={84} wickBottom={136} color={C.bear} />
      <Candle x={175} bodyTop={116} bodyBottom={126} wickTop={110} wickBottom={172} color={C.bull} />
      <Candle x={225} bodyTop={92} bodyBottom={126} wickTop={86} wickBottom={132} color={C.bull} />
      <Label x={175} y={116} anchor="middle" color={C.bull}>{t.body}</Label>
      <Label x={175} y={182} anchor="middle" color={C.bull}>{t.wick}</Label>
      <Label x={225} y={86} anchor="middle" color={C.bull}>{t.confirm}</Label>
    </>,
  );
}

function ShootingStar({ lang }: DiagramProps) {
  const t = lang === 'th' ? { wick: 'ไส้บนยาว', body: 'ตัวเล็ก', confirm: 'ยืนยัน' } : { wick: 'Long upper wick', body: 'Small body', confirm: 'Confirm' };
  return shell(
    <>
      <Candle x={45} bodyTop={110} bodyBottom={70} wickTop={116} wickBottom={64} color={C.bull} />
      <Candle x={85} bodyTop={80} bodyBottom={40} wickTop={86} wickBottom={34} color={C.bull} />
      <Candle x={125} bodyTop={50} bodyBottom={10} wickTop={56} wickBottom={4} color={C.bull} />
      <Candle x={175} bodyTop={64} bodyBottom={74} wickTop={8} wickBottom={80} color={C.bear} />
      <Candle x={225} bodyTop={88} bodyBottom={54} wickTop={94} wickBottom={48} color={C.bear} />
      <Label x={175} y={82} anchor="middle" color={C.bear}>{t.body}</Label>
      <Label x={175} y={6} anchor="middle" color={C.bear}>{t.wick}</Label>
      <Label x={225} y={96} anchor="middle" color={C.bear}>{t.confirm}</Label>
    </>,
  );
}

function Engulfing({ lang }: DiagramProps) {
  const t = lang === 'th' ? { bull: 'Engulfing ขาขึ้น', bear: 'Engulfing ขาลง' } : { bull: 'Bullish engulfing', bear: 'Bearish engulfing' };
  return shell(
    <>
      <Candle x={70} bodyTop={72} bodyBottom={118} wickTop={66} wickBottom={124} color={C.bear} />
      <Candle x={100} bodyTop={60} bodyBottom={132} wickTop={54} wickBottom={138} color={C.bull} />
      <Candle x={185} bodyTop={48} bodyBottom={108} wickTop={42} wickBottom={114} color={C.bull} />
      <Candle x={215} bodyTop={58} bodyBottom={128} wickTop={52} wickBottom={134} color={C.bear} />
      <Label x={85} y={148} anchor="middle" color={C.bull}>{t.bull}</Label>
      <Label x={200} y={148} anchor="middle" color={C.bear}>{t.bear}</Label>
    </>,
  );
}

function MorningStar({ lang }: DiagramProps) {
  const t = lang === 'th' ? { bear: 'แดงยาว', star: 'ดาว', bull: 'เขียวยาว' } : { bear: 'Long bear', star: 'Star', bull: 'Long bull' };
  return shell(
    <>
      <Candle x={70} bodyTop={40} bodyBottom={130} wickTop={34} wickBottom={136} color={C.bear} />
      <Candle x={145} bodyTop={80} bodyBottom={88} wickTop={72} wickBottom={96} color={C.amber} />
      <Candle x={220} bodyTop={40} bodyBottom={130} wickTop={34} wickBottom={136} color={C.bull} />
      <Label x={70} y={146} anchor="middle" color={C.bear}>{t.bear}</Label>
      <Label x={145} y={66} anchor="middle" color={C.amber}>{t.star}</Label>
      <Label x={220} y={146} anchor="middle" color={C.bull}>{t.bull}</Label>
    </>,
  );
}

function EveningStar({ lang }: DiagramProps) {
  const t = lang === 'th' ? { bull: 'เขียวยาว', star: 'ดาว', bear: 'แดงยาว' } : { bull: 'Long bull', star: 'Star', bear: 'Long bear' };
  return shell(
    <>
      <Candle x={70} bodyTop={40} bodyBottom={130} wickTop={34} wickBottom={136} color={C.bull} />
      <Candle x={145} bodyTop={80} bodyBottom={88} wickTop={72} wickBottom={96} color={C.amber} />
      <Candle x={220} bodyTop={40} bodyBottom={130} wickTop={34} wickBottom={136} color={C.bear} />
      <Label x={70} y={146} anchor="middle" color={C.bull}>{t.bull}</Label>
      <Label x={145} y={66} anchor="middle" color={C.amber}>{t.star}</Label>
      <Label x={220} y={146} anchor="middle" color={C.bear}>{t.bear}</Label>
    </>,
  );
}

function Harami({ lang }: DiagramProps) {
  const t = lang === 'th' ? { mother: 'แท่งแม่', baby: 'แท่งลูก' } : { mother: 'Mother', baby: 'Baby' };
  return shell(
    <>
      <Candle x={110} bodyTop={40} bodyBottom={140} wickTop={34} wickBottom={146} color={C.bear} />
      <Candle x={185} bodyTop={70} bodyBottom={108} wickTop={64} wickBottom={114} color={C.bull} />
      <Label x={110} y={156} anchor="middle" color={C.bear}>{t.mother}</Label>
      <Label x={185} y={124} anchor="middle" color={C.bull}>{t.baby}</Label>
    </>,
  );
}

function ThreeSoldiers({ lang }: DiagramProps) {
  const t = lang === 'th' ? { pull: 'ย่อเล็กน้อย' } : { pull: 'Small pullback' };
  return shell(
    <>
      <Candle x={60} bodyTop={110} bodyBottom={76} wickTop={116} wickBottom={70} color={C.bull} />
      <Candle x={125} bodyTop={88} bodyBottom={50} wickTop={94} wickBottom={44} color={C.bull} />
      <Candle x={190} bodyTop={64} bodyBottom={26} wickTop={70} wickBottom={20} color={C.bull} />
      <Candle x={252} bodyTop={42} bodyBottom={58} wickTop={36} wickBottom={64} color={C.bear} />
      <Label x={252} y={78} anchor="middle" color={C.bear}>{t.pull}</Label>
    </>,
  );
}

function ThreeCrows({ lang }: DiagramProps) {
  const t = lang === 'th' ? { pull: 'ดีดเล็กน้อย' } : { pull: 'Small bounce' };
  return shell(
    <>
      <Candle x={60} bodyTop={70} bodyBottom={104} wickTop={64} wickBottom={110} color={C.bear} />
      <Candle x={125} bodyTop={92} bodyBottom={130} wickTop={86} wickBottom={136} color={C.bear} />
      <Candle x={190} bodyTop={116} bodyBottom={154} wickTop={110} wickBottom={160} color={C.bear} />
      <Candle x={252} bodyTop={136} bodyBottom={120} wickTop={142} wickBottom={114} color={C.bull} />
      <Label x={252} y={106} anchor="middle" color={C.bull}>{t.pull}</Label>
    </>,
  );
}

/* ---------------------------------------------------------------------------
 * Harmonic patterns (X-A-B-C-D)
 * ------------------------------------------------------------------------- */

function GartleyHarmonic({ lang }: DiagramProps) {
  const t = lang === 'th' ? { d: 'PRZ ซื้อ', leg: 'X-A-B-C-D' } : { d: 'PRZ buy', leg: 'X-A-B-C-D' };
  return shell(
    <>
      <Guide x1={30} y1={112} x2={292} y2={112} color={C.amber} />
      <PricePath d="M40 110 L80 34 L120 74 L160 46 L200 102 L244 60" color={C.violet} />
      <Dot cx={40} cy={110} r={3.5} color={C.violet} />
      <Dot cx={80} cy={34} r={3.5} color={C.violet} />
      <Dot cx={120} cy={74} r={3.5} color={C.violet} />
      <Dot cx={160} cy={46} r={3.5} color={C.violet} />
      <Dot cx={200} cy={102} r={5} color={C.amber} />
      <Label x={40} y={124} color={C.violet}>X</Label>
      <Label x={80} y={22} color={C.violet}>A</Label>
      <Label x={120} y={88} color={C.violet}>B</Label>
      <Label x={160} y={34} color={C.violet}>C</Label>
      <Label x={200} y={116} color={C.amber}>{t.d}</Label>
      <Label x={244} y={48} color={C.violet}>D</Label>
      <Arrow x={244} y={60} dir="up" color={C.bull} />
      <Label x={160} y={158} anchor="middle" color={C.violet}>{t.leg}</Label>
    </>,
  );
}

function ButterflyHarmonic({ lang }: DiagramProps) {
  const t = lang === 'th' ? { d: 'D = 1.27 ของ XA', leg: 'X-A-B-C-D' } : { d: 'D = 1.27 of XA', leg: 'X-A-B-C-D' };
  return shell(
    <>
      <PricePath d="M40 84 L80 28 L120 70 L160 34 L200 98 L244 56 L288 148" color={C.violet} />
      <Dot cx={40} cy={84} r={3.5} color={C.violet} />
      <Dot cx={80} cy={28} r={3.5} color={C.violet} />
      <Dot cx={120} cy={70} r={3.5} color={C.violet} />
      <Dot cx={160} cy={34} r={3.5} color={C.violet} />
      <Dot cx={200} cy={98} r={3.5} color={C.violet} />
      <Dot cx={288} cy={148} r={5} color={C.amber} />
      <Label x={40} y={98} color={C.violet}>X</Label>
      <Label x={80} y={16} color={C.violet}>A</Label>
      <Label x={120} y={84} color={C.violet}>B</Label>
      <Label x={160} y={22} color={C.violet}>C</Label>
      <Label x={200} y={112} color={C.violet}>D</Label>
      <Label x={288} y={162} color={C.amber}>{t.d}</Label>
      <Label x={160} y={170} anchor="middle" color={C.violet}>{t.leg}</Label>
    </>,
  );
}

function CrabHarmonic({ lang }: DiagramProps) {
  const t = lang === 'th' ? { d: 'D = 1.618 ของ XA', leg: 'X-A-B-C-D' } : { d: 'D = 1.618 of XA', leg: 'X-A-B-C-D' };
  return shell(
    <>
      <PricePath d="M40 80 L80 24 L120 68 L160 32 L200 96 L248 54 L296 160" color={C.violet} />
      <Dot cx={40} cy={80} r={3.5} color={C.violet} />
      <Dot cx={80} cy={24} r={3.5} color={C.violet} />
      <Dot cx={120} cy={68} r={3.5} color={C.violet} />
      <Dot cx={160} cy={32} r={3.5} color={C.violet} />
      <Dot cx={200} cy={96} r={3.5} color={C.violet} />
      <Dot cx={296} cy={160} r={5} color={C.amber} />
      <Label x={40} y={94} color={C.violet}>X</Label>
      <Label x={80} y={12} color={C.violet}>A</Label>
      <Label x={120} y={82} color={C.violet}>B</Label>
      <Label x={160} y={20} color={C.violet}>C</Label>
      <Label x={200} y={110} color={C.violet}>D</Label>
      <Label x={296} y={174} anchor="end" color={C.amber}>{t.d}</Label>
      <Label x={160} y={176} anchor="middle" color={C.violet}>{t.leg}</Label>
    </>,
  );
}

function CypherHarmonic({ lang }: DiagramProps) {
  const t = lang === 'th' ? { d: 'D = 0.786 ของ XC', leg: 'X-A-B-C-D' } : { d: 'D = 0.786 of XC', leg: 'X-A-B-C-D' };
  return shell(
    <>
      <PricePath d="M40 100 L84 32 L124 70 L168 22 L204 88 L248 40 L292 118" color={C.violet} />
      <Dot cx={40} cy={100} r={3.5} color={C.violet} />
      <Dot cx={84} cy={32} r={3.5} color={C.violet} />
      <Dot cx={124} cy={70} r={3.5} color={C.violet} />
      <Dot cx={168} cy={22} r={3.5} color={C.violet} />
      <Dot cx={204} cy={88} r={3.5} color={C.violet} />
      <Dot cx={292} cy={118} r={5} color={C.amber} />
      <Label x={40} y={114} color={C.violet}>X</Label>
      <Label x={84} y={20} color={C.violet}>A</Label>
      <Label x={124} y={84} color={C.violet}>B</Label>
      <Label x={168} y={10} color={C.violet}>C</Label>
      <Label x={204} y={102} color={C.violet}>D</Label>
      <Label x={292} y={132} color={C.amber}>{t.d}</Label>
      <Label x={160} y={160} anchor="middle" color={C.violet}>{t.leg}</Label>
    </>,
  );
}

function SharkHarmonic({ lang }: DiagramProps) {
  const t = lang === 'th' ? { d: 'D = 1.13 ของ XC', leg: 'X-A-B-C-D' } : { d: 'D = 1.13 of XC', leg: 'X-A-B-C-D' };
  return shell(
    <>
      <PricePath d="M40 108 L84 44 L124 76 L168 18 L204 92 L248 56 L296 26" color={C.violet} />
      <Dot cx={40} cy={108} r={3.5} color={C.violet} />
      <Dot cx={84} cy={44} r={3.5} color={C.violet} />
      <Dot cx={124} cy={76} r={3.5} color={C.violet} />
      <Dot cx={168} cy={18} r={3.5} color={C.violet} />
      <Dot cx={204} cy={92} r={3.5} color={C.violet} />
      <Dot cx={296} cy={26} r={5} color={C.amber} />
      <Label x={40} y={122} color={C.violet}>X</Label>
      <Label x={84} y={32} color={C.violet}>A</Label>
      <Label x={124} y={90} color={C.violet}>B</Label>
      <Label x={168} y={6} color={C.violet}>C</Label>
      <Label x={204} y={106} color={C.violet}>D</Label>
      <Label x={296} y={14} color={C.amber}>{t.d}</Label>
      <Arrow x={296} y={44} dir="down" color={C.bear} />
      <Label x={160} y={160} anchor="middle" color={C.violet}>{t.leg}</Label>
    </>,
  );
}

function ABCDHarmonic({ lang }: DiagramProps) {
  const t = lang === 'th' ? { d: 'D (CD = AB)', leg: 'X-A-B-C-D · 1:1' } : { d: 'D (CD = AB)', leg: 'X-A-B-C-D · 1:1' };
  return shell(
    <>
      <Guide x1={24} y1={118} x2={296} y2={118} color={C.amber} />
      <PricePath d="M40 100 L80 30 L120 84 L164 38 L204 96 L244 52 L296 122" color={C.violet} />
      <Dot cx={40} cy={100} r={3.5} color={C.violet} />
      <Dot cx={80} cy={30} r={3.5} color={C.violet} />
      <Dot cx={120} cy={84} r={3.5} color={C.violet} />
      <Dot cx={164} cy={38} r={3.5} color={C.violet} />
      <Dot cx={204} cy={96} r={3.5} color={C.violet} />
      <Dot cx={296} cy={122} r={5} color={C.amber} />
      <Label x={40} y={114} color={C.violet}>X</Label>
      <Label x={80} y={18} color={C.violet}>A</Label>
      <Label x={120} y={98} color={C.violet}>B</Label>
      <Label x={164} y={26} color={C.violet}>C</Label>
      <Label x={204} y={110} color={C.violet}>D</Label>
      <Label x={296} y={136} color={C.amber}>{t.d}</Label>
      <Arrow x={296} y={100} dir="up" color={C.bull} />
      <Label x={160} y={164} anchor="middle" color={C.violet}>{t.leg}</Label>
    </>,
  );
}

function BatHarmonic({ lang }: DiagramProps) {
  const t = lang === 'th' ? { d: 'D = 0.886 ของ XA', leg: 'X-A-B-C-D' } : { d: 'D = 0.886 of XA', leg: 'X-A-B-C-D' };
  return shell(
    <>
      <PricePath d="M40 108 L80 34 L124 62 L168 28 L204 92 L244 44 L288 128" color={C.violet} />
      <Dot cx={40} cy={108} r={3.5} color={C.violet} />
      <Dot cx={80} cy={34} r={3.5} color={C.violet} />
      <Dot cx={124} cy={62} r={3.5} color={C.violet} />
      <Dot cx={168} cy={28} r={3.5} color={C.violet} />
      <Dot cx={204} cy={92} r={3.5} color={C.violet} />
      <Dot cx={288} cy={128} r={5} color={C.amber} />
      <Label x={40} y={122} color={C.violet}>X</Label>
      <Label x={80} y={22} color={C.violet}>A</Label>
      <Label x={124} y={76} color={C.violet}>B</Label>
      <Label x={168} y={16} color={C.violet}>C</Label>
      <Label x={204} y={106} color={C.violet}>D</Label>
      <Label x={288} y={142} color={C.amber}>{t.d}</Label>
      <Label x={160} y={166} anchor="middle" color={C.violet}>{t.leg}</Label>
    </>,
  );
}

function shell(inner: ReactNode) {
  return (
    <svg viewBox={VIEW} className="h-auto w-full" role="img" aria-label="Pattern diagram">
      <rect x="0" y="0" width="320" height="180" rx="10" fill={C.bg} />
      {inner}
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Reversal patterns
 * ------------------------------------------------------------------------- */

function DoubleTop({ lang }: DiagramProps) {
  const t = lang === 'th' ? { t1: 'ยอดที่ 1', t2: 'ยอดที่ 2', neck: 'Neckline', break: 'ทะลุลง' } : { t1: 'Top 1', t2: 'Top 2', neck: 'Neckline', break: 'Breakdown' };
  return shell(
    <>
      <Guide x1={24} y1={122} x2={296} y2={122} color={C.amber} />
      <PricePath d="M24 122 L56 58 Q80 34 96 62 L160 118 Q176 138 208 96 L244 58 Q268 34 284 66 L300 122 L312 142" color={C.bear} />
      <Dot cx={80} cy={40} color={C.bear} />
      <Dot cx={248} cy={40} color={C.bear} />
      <Label x={80} y={26} color={C.bear}>{t.t1}</Label>
      <Label x={248} y={26} color={C.bear}>{t.t2}</Label>
      <Label x={160} y={140} anchor="middle">{t.neck}</Label>
      <Arrow x={300} y={156} dir="down" color={C.bear} />
      <Label x={300} y={174} color={C.bear}>{t.break}</Label>
    </>,
  );
}

function HeadShoulders({ lang }: DiagramProps) {
  const t = lang === 'th' ? { ls: 'ไหล่ซ้าย', head: 'หัว', rs: 'ไหล่ขวา', neck: 'Neckline', break: 'ทะลุลง' } : { ls: 'Left', head: 'Head', rs: 'Right', neck: 'Neckline', break: 'Breakdown' };
  return shell(
    <>
      <Guide x1={60} y1={118} x2={244} y2={126} color={C.amber} />
      <PricePath d="M24 120 L48 104 L80 62 L104 106 L160 34 L216 108 L248 70 L276 112 L300 128 L310 144" color={C.bear} />
      <Dot cx={80} cy={58} color={C.cyan} />
      <Dot cx={160} cy={28} color={C.bear} />
      <Dot cx={248} cy={66} color={C.cyan} />
      <Label x={80} y={48} color={C.cyan}>{t.ls}</Label>
      <Label x={160} y={16} color={C.bear}>{t.head}</Label>
      <Label x={248} y={56} color={C.cyan}>{t.rs}</Label>
      <Label x={152} y={142} anchor="middle">{t.neck}</Label>
      <Arrow x={300} y={158} dir="down" color={C.bear} />
      <Label x={300} y={176} color={C.bear}>{t.break}</Label>
    </>,
  );
}

function FallingWedge({ lang }: DiagramProps) {
  const t = lang === 'th' ? { up: 'เส้นบน', low: 'เส้นล่าง', break: 'เบรกขึ้น' } : { up: 'Upper line', low: 'Lower line', break: 'Breakout' };
  return shell(
    <>
      <Guide x1={24} y1={62} x2={284} y2={102} color={C.bear} />
      <Guide x1={24} y1={128} x2={284} y2={146} color={C.cyan} />
      <PricePath d="M24 96 L60 74 L96 116 L132 88 L168 126 L204 100 L240 128 L276 108 L292 84 L304 68" color={C.accent} />
      <Label x={286} y={52} anchor="end" color={C.bear}>{t.up}</Label>
      <Label x={286} y={162} anchor="end" color={C.cyan}>{t.low}</Label>
      <Arrow x={296} y={54} dir="up" color={C.bull} />
      <Label x={296} y={36} color={C.bull}>{t.break}</Label>
    </>,
  );
}

function DoubleBottom({ lang }: DiagramProps) {
  const t = lang === 'th' ? { b1: 'ก้นที่ 1', b2: 'ก้นที่ 2', neck: 'Neckline', break: 'เบรกขึ้น' } : { b1: 'Bottom 1', b2: 'Bottom 2', neck: 'Neckline', break: 'Breakout' };
  return shell(
    <>
      <Guide x1={24} y1={70} x2={296} y2={70} color={C.amber} />
      <PricePath d="M24 52 L52 92 Q76 118 96 96 L148 76 L184 104 Q220 138 240 104 L268 76 L292 48 L306 30" color={C.bull} />
      <Dot cx={88} cy={128} color={C.cyan} />
      <Dot cx={232} cy={128} color={C.cyan} />
      <Label x={88} y={148} color={C.cyan}>{t.b1}</Label>
      <Label x={232} y={148} color={C.cyan}>{t.b2}</Label>
      <Label x={160} y={58} anchor="middle">{t.neck}</Label>
      <Arrow x={300} y={36} dir="up" color={C.bull} />
      <Label x={300} y={20} color={C.bull}>{t.break}</Label>
    </>,
  );
}

function RisingWedge({ lang }: DiagramProps) {
  const t = lang === 'th' ? { up: 'เส้นบน', low: 'เส้นล่าง', break: 'เบรกลง' } : { up: 'Upper line', low: 'Lower line', break: 'Breakdown' };
  return shell(
    <>
      <Guide x1={24} y1={58} x2={284} y2={96} color={C.bear} />
      <Guide x1={24} y1={122} x2={284} y2={140} color={C.amber} />
      <PricePath d="M24 92 L60 70 L96 112 L132 84 L168 120 L204 96 L240 128 L276 110 L294 134 L306 150" color={C.accent} />
      <Label x={286} y={48} anchor="end" color={C.bear}>{t.up}</Label>
      <Label x={286} y={156} anchor="end" color={C.amber}>{t.low}</Label>
      <Arrow x={296} y={162} dir="down" color={C.bear} />
      <Label x={296} y={176} anchor="end" color={C.bear}>{t.break}</Label>
    </>,
  );
}

function Pennant({ lang }: DiagramProps) {
  const t = lang === 'th' ? { pole: 'เสาธง', flag: 'ธง', break: 'เบรกขึ้น' } : { pole: 'Pole', flag: 'Pennant', break: 'Breakout' };
  return shell(
    <>
      <Guide x1={64} y1={128} x2={196} y2={86} color={C.accent} />
      <Guide x1={96} y1={140} x2={228} y2={104} color={C.accent} />
      <PricePath d="M24 142 L64 128 L96 56 L132 74 L164 96 L196 86 L228 104 L252 58 L276 30 L296 14" color={C.bull} />
      <Label x={64} y={156} color={C.bull}>{t.pole}</Label>
      <Label x={160} y={118} color={C.accent}>{t.flag}</Label>
      <Arrow x={288} y={20} dir="up" color={C.bull} />
      <Label x={288} y={4} color={C.bull}>{t.break}</Label>
    </>,
  );
}

/* ---------------------------------------------------------------------------
 * Continuation patterns
 * ------------------------------------------------------------------------- */

function AscTriangle({ lang }: DiagramProps) {
  const t = lang === 'th' ? { res: 'แนวต้าน', hl: 'จุดต่ำสูงขึ้น', break: 'เบรกขึ้น' } : { res: 'Resistance', hl: 'Higher lows', break: 'Breakout' };
  return shell(
    <>
      <Guide x1={24} y1={48} x2={296} y2={48} color={C.amber} />
      <Guide x1={24} y1={138} x2={296} y2={86} color={C.cyan} />
      <PricePath d="M24 108 L56 62 L88 118 L116 70 L148 122 L176 78 L204 116 L232 88 L256 62 L284 40" color={C.accent} />
      <Dot cx={56} cy={62} color={C.amber} />
      <Dot cx={148} cy={122} color={C.cyan} />
      <Label x={56} y={34} color={C.amber}>{t.res}</Label>
      <Label x={172} y={150} color={C.cyan}>{t.hl}</Label>
      <Arrow x={288} y={26} dir="up" color={C.bull} />
      <Label x={288} y={12} color={C.bull}>{t.break}</Label>
    </>,
  );
}

function DescTriangle({ lang }: DiagramProps) {
  const t = lang === 'th' ? { sup: 'แนวรับ', lh: 'จุดสูงต่ำลง', break: 'เบรกลง' } : { sup: 'Support', lh: 'Lower highs', break: 'Breakdown' };
  return shell(
    <>
      <Guide x1={24} y1={132} x2={296} y2={132} color={C.amber} />
      <Guide x1={24} y1={42} x2={296} y2={94} color={C.bear} />
      <PricePath d="M24 76 L56 116 L88 60 L120 112 L152 70 L184 104 L216 80 L248 100 L276 120 L296 146" color={C.accent} />
      <Dot cx={56} cy={116} color={C.amber} />
      <Dot cx={152} cy={70} color={C.bear} />
      <Label x={56} y={150} color={C.amber}>{t.sup}</Label>
      <Label x={140} y={36} color={C.bear}>{t.lh}</Label>
      <Arrow x={292} y={158} dir="down" color={C.bear} />
      <Label x={292} y={176} color={C.bear}>{t.break}</Label>
    </>,
  );
}

function CupHandle({ lang }: DiagramProps) {
  const t = lang === 'th' ? { cup: 'ถ้วย', handle: 'หูถ้วย', break: 'เบรกขึ้น' } : { cup: 'Cup', handle: 'Handle', break: 'Breakout' };
  return shell(
    <>
      <Guide x1={24} y1={52} x2={296} y2={52} color={C.amber} />
      <PricePath d="M24 52 L56 52 Q96 30 132 96 Q152 134 176 134 Q200 134 216 98 Q240 52 268 52 L284 74 L272 86" color={C.accent} />
      <Dot cx={56} cy={52} color={C.amber} />
      <Dot cx={268} cy={52} color={C.amber} />
      <Dot cx={176} cy={134} color={C.cyan} />
      <Label x={108} y={150} color={C.cyan}>{t.cup}</Label>
      <Label x={288} y={102} color={C.muted}>{t.handle}</Label>
      <Arrow x={296} y={38} dir="up" color={C.bull} />
      <Label x={296} y={22} color={C.bull}>{t.break}</Label>
    </>,
  );
}

function BullFlag({ lang }: DiagramProps) {
  const t = lang === 'th' ? { pole: 'เสาธง', flag: 'ธง', break: 'เบรกขึ้น' } : { pole: 'Pole', flag: 'Flag', break: 'Breakout' };
  return shell(
    <>
      <Guide x1={64} y1={142} x2={164} y2={104} color={C.accent} />
      <Guide x1={96} y1={56} x2={200} y2={86} color={C.accent} />
      <PricePath d="M24 140 L64 142 L96 56 L132 74 L164 104 L200 86 L236 52 L264 26 L284 12" color={C.bull} />
      <Label x={64} y={158} color={C.bull}>{t.pole}</Label>
      <Label x={156} y={122} color={C.accent}>{t.flag}</Label>
      <Arrow x={288} y={22} dir="up" color={C.bull} />
      <Label x={288} y={6} color={C.bull}>{t.break}</Label>
    </>,
  );
}

function BearFlag({ lang }: DiagramProps) {
  const t = lang === 'th' ? { pole: 'เสาธง', flag: 'ธง', break: 'เบรกลง' } : { pole: 'Pole', flag: 'Flag', break: 'Breakdown' };
  return shell(
    <>
      <Guide x1={64} y1={38} x2={168} y2={74} color={C.accent} />
      <Guide x1={100} y1={136} x2={204} y2={100} color={C.accent} />
      <PricePath d="M24 40 L64 38 L96 136 L132 116 L168 74 L204 100 L240 138 L268 158 L284 168" color={C.bear} />
      <Label x={64} y={24} color={C.bear}>{t.pole}</Label>
      <Label x={152} y={92} color={C.accent}>{t.flag}</Label>
      <Arrow x={288} y={172} dir="down" color={C.bear} />
      <Label x={292} y={176} anchor="end" color={C.bear}>{t.break}</Label>
    </>,
  );
}

function InverseHeadShoulders({ lang }: DiagramProps) {
  const t = lang === 'th' ? { ls: 'ไหล่ซ้าย', head: 'หัว', rs: 'ไหล่ขวา', neck: 'Neckline', break: 'เบรกขึ้น' } : { ls: 'Left', head: 'Head', rs: 'Right', neck: 'Neckline', break: 'Breakout' };
  return shell(
    <>
      <Guide x1={60} y1={62} x2={244} y2={54} color={C.amber} />
      <PricePath d="M24 60 L48 76 L80 118 L104 74 L160 146 L216 72 L248 110 L276 68 L300 52 L310 36" color={C.bull} />
      <Dot cx={80} cy={122} color={C.cyan} />
      <Dot cx={160} cy={150} color={C.bear} />
      <Dot cx={248} cy={114} color={C.cyan} />
      <Label x={80} y={136} color={C.cyan}>{t.ls}</Label>
      <Label x={160} y={164} color={C.bear}>{t.head}</Label>
      <Label x={248} y={128} color={C.cyan}>{t.rs}</Label>
      <Label x={152} y={40} anchor="middle">{t.neck}</Label>
      <Arrow x={300} y={22} dir="up" color={C.bull} />
      <Label x={300} y={6} color={C.bull}>{t.break}</Label>
    </>,
  );
}

function TripleTop({ lang }: DiagramProps) {
  const t = lang === 'th' ? { n: 'Neckline', break: 'เบรกลง' } : { n: 'Neckline', break: 'Breakdown' };
  return shell(
    <>
      <Guide x1={24} y1={122} x2={296} y2={122} color={C.amber} />
      <PricePath d="M24 120 L52 66 L88 120 L116 66 L148 120 L176 66 L208 120 L232 84 L268 122 L300 146" color={C.bear} />
      <Dot cx={52} cy={58} color={C.bear} />
      <Dot cx={116} cy={58} color={C.bear} />
      <Dot cx={176} cy={58} color={C.bear} />
      <Label x={52} y={46} color={C.bear}>1</Label>
      <Label x={116} y={46} color={C.bear}>2</Label>
      <Label x={176} y={46} color={C.bear}>3</Label>
      <Label x={160} y={140} anchor="middle">{t.n}</Label>
      <Arrow x={300} y={158} dir="down" color={C.bear} />
      <Label x={300} y={176} color={C.bear}>{t.break}</Label>
    </>,
  );
}

function TripleBottom({ lang }: DiagramProps) {
  const t = lang === 'th' ? { n: 'Neckline', break: 'เบรกขึ้น' } : { n: 'Neckline', break: 'Breakout' };
  return shell(
    <>
      <Guide x1={24} y1={58} x2={296} y2={58} color={C.amber} />
      <PricePath d="M24 60 L52 114 L88 60 L116 114 L148 60 L176 114 L208 60 L232 96 L268 58 L300 34" color={C.bull} />
      <Dot cx={52} cy={122} color={C.cyan} />
      <Dot cx={116} cy={122} color={C.cyan} />
      <Dot cx={176} cy={122} color={C.cyan} />
      <Label x={52} y={136} color={C.cyan}>1</Label>
      <Label x={116} y={136} color={C.cyan}>2</Label>
      <Label x={176} y={136} color={C.cyan}>3</Label>
      <Label x={160} y={40} anchor="middle">{t.n}</Label>
      <Arrow x={300} y={22} dir="up" color={C.bull} />
      <Label x={300} y={6} color={C.bull}>{t.break}</Label>
    </>,
  );
}

function RoundingTop({ lang }: DiagramProps) {
  const t = lang === 'th' ? { rim: 'ขอบถ้วย', break: 'เบรกลง' } : { rim: 'Rim', break: 'Breakdown' };
  return shell(
    <>
      <Guide x1={24} y1={92} x2={296} y2={92} color={C.amber} />
      <PricePath d="M24 92 Q56 30 128 34 Q180 36 216 74 Q244 100 272 92 L300 116" color={C.bear} />
      <Dot cx={60} cy={92} color={C.cyan} />
      <Dot cx={128} cy={30} color={C.bear} />
      <Dot cx={272} cy={92} color={C.cyan} />
      <Label x={60} y={108} color={C.cyan}>{t.rim}</Label>
      <Label x={128} y={18} color={C.bear}>Dome</Label>
      <Arrow x={300} y={130} dir="down" color={C.bear} />
      <Label x={300} y={148} color={C.bear}>{t.break}</Label>
    </>,
  );
}

function RoundingBottom({ lang }: DiagramProps) {
  const t = lang === 'th' ? { rim: 'ขอบถ้วย', break: 'เบรกขึ้น' } : { rim: 'Rim', break: 'Breakout' };
  return shell(
    <>
      <Guide x1={24} y1={88} x2={296} y2={88} color={C.amber} />
      <PricePath d="M24 88 Q56 150 128 146 Q180 144 216 106 Q244 80 272 88 L300 64" color={C.bull} />
      <Dot cx={60} cy={88} color={C.cyan} />
      <Dot cx={128} cy={146} color={C.bull} />
      <Dot cx={272} cy={88} color={C.cyan} />
      <Label x={60} y={74} color={C.cyan}>{t.rim}</Label>
      <Label x={128} y={162} color={C.bull}>Saucer</Label>
      <Arrow x={300} y={50} dir="up" color={C.bull} />
      <Label x={300} y={34} color={C.bull}>{t.break}</Label>
    </>,
  );
}

function DiamondTop({ lang }: DiagramProps) {
  const t = lang === 'th' ? { w: 'ขยายกว้าง', n: 'แคบลง', break: 'เบรกลง' } : { w: 'Widening', n: 'Narrowing', break: 'Breakdown' };
  return shell(
    <>
      <Guide x1={88} y1={52} x2={232} y2={110} color={C.bear} />
      <Guide x1={88} y1={128} x2={232} y2={70} color={C.cyan} />
      <PricePath d="M40 90 L88 52 L120 128 L160 66 L200 118 L232 110 L268 146" color={C.bear} />
      <Label x={96} y={40} color={C.bear}>{t.w}</Label>
      <Label x={214} y={126} color={C.cyan}>{t.n}</Label>
      <Arrow x={292} y={158} dir="down" color={C.bear} />
      <Label x={292} y={176} color={C.bear}>{t.break}</Label>
    </>,
  );
}

function DiamondBottom({ lang }: DiagramProps) {
  const t = lang === 'th' ? { w: 'ขยายกว้าง', n: 'แคบลง', break: 'เบรกขึ้น' } : { w: 'Widening', n: 'Narrowing', break: 'Breakout' };
  return shell(
    <>
      <Guide x1={88} y1={128} x2={232} y2={70} color={C.cyan} />
      <Guide x1={88} y1={52} x2={232} y2={110} color={C.bull} />
      <PricePath d="M40 90 L88 128 L120 66 L160 114 L200 52 L232 70 L268 34" color={C.bull} />
      <Label x={96} y={140} color={C.cyan}>{t.w}</Label>
      <Label x={214} y={54} color={C.bull}>{t.n}</Label>
      <Arrow x={292} y={22} dir="up" color={C.bull} />
      <Label x={292} y={6} color={C.bull}>{t.break}</Label>
    </>,
  );
}

function BroadeningTop({ lang }: DiagramProps) {
  const t = lang === 'th' ? { h: 'จุดสูงสูงขึ้น', l: 'จุดต่ำต่ำลง', break: 'เบรกลง' } : { h: 'Higher highs', l: 'Lower lows', break: 'Breakdown' };
  return shell(
    <>
      <Guide x1={40} y1={44} x2={268} y2={26} color={C.bear} />
      <Guide x1={40} y1={136} x2={268} y2={158} color={C.cyan} />
      <PricePath d="M40 90 L64 56 L96 122 L128 44 L160 134 L196 34 L228 142 L256 60 L292 152" color={C.accent} />
      <Label x={132} y={32} color={C.bear}>{t.h}</Label>
      <Label x={132} y={168} color={C.cyan}>{t.l}</Label>
      <Arrow x={292} y={164} dir="down" color={C.bear} />
      <Label x={292} y={178} anchor="end" color={C.bear}>{t.break}</Label>
    </>,
  );
}

function IslandReversal({ lang }: DiagramProps) {
  const t = lang === 'th' ? { island: 'เกาะ', break: 'เบรกลง' } : { island: 'Island', break: 'Breakdown' };
  return shell(
    <>
      <Guide x1={40} y1={70} x2={284} y2={70} color={C.cyan} />
      <Guide x1={40} y1={110} x2={284} y2={110} color={C.cyan} />
      <PricePath d="M24 92 L72 92 L92 44 L152 44 L172 84 L196 84 L216 40 L244 40 L264 112 L292 112 L306 132" color={C.bear} />
      <Label x={172} y={98} color={C.cyan}>{t.island}</Label>
      <Label x={58} y={80} color={C.muted}>Gap</Label>
      <Arrow x={298} y={146} dir="down" color={C.bear} />
      <Label x={298} y={164} color={C.bear}>{t.break}</Label>
    </>,
  );
}

function BearPennant({ lang }: DiagramProps) {
  const t = lang === 'th' ? { pole: 'เสาธง', flag: 'ธง', break: 'เบรกลง' } : { pole: 'Pole', flag: 'Pennant', break: 'Breakdown' };
  return shell(
    <>
      <Guide x1={72} y1={42} x2={204} y2={108} color={C.accent} />
      <Guide x1={104} y1={140} x2={236} y2={84} color={C.accent} />
      <PricePath d="M24 40 L72 42 L104 140 L136 116 L168 96 L204 108 L236 84 L260 132 L284 152 L300 164" color={C.bear} />
      <Label x={72} y={28} color={C.bear}>{t.pole}</Label>
      <Label x={164} y={128} color={C.accent}>{t.flag}</Label>
      <Arrow x={292} y={168} dir="down" color={C.bear} />
      <Label x={292} y={178} anchor="end" color={C.bear}>{t.break}</Label>
    </>,
  );
}

function SymTriangle({ lang }: DiagramProps) {
  const t = lang === 'th' ? { up: 'เส้นบน', low: 'เส้นล่าง', break: 'เบรกขึ้น' } : { up: 'Upper line', low: 'Lower line', break: 'Breakout' };
  return shell(
    <>
      <Guide x1={24} y1={48} x2={284} y2={92} color={C.bear} />
      <Guide x1={24} y1={132} x2={284} y2={88} color={C.cyan} />
      <PricePath d="M24 96 L60 64 L96 116 L132 84 L168 116 L204 92 L240 110 L276 84 L296 56" color={C.accent} />
      <Label x={286} y={40} anchor="end" color={C.bear}>{t.up}</Label>
      <Label x={286} y={148} anchor="end" color={C.cyan}>{t.low}</Label>
      <Arrow x={296} y={42} dir="up" color={C.bull} />
      <Label x={296} y={26} color={C.bull}>{t.break}</Label>
    </>,
  );
}

function BullRectangle({ lang }: DiagramProps) {
  const t = lang === 'th' ? { r: 'แนวต้าน', s: 'แนวรับ', break: 'เบรกขึ้น' } : { r: 'Resistance', s: 'Support', break: 'Breakout' };
  return shell(
    <>
      <Guide x1={24} y1={52} x2={296} y2={52} color={C.amber} />
      <Guide x1={24} y1={128} x2={296} y2={128} color={C.cyan} />
      <PricePath d="M24 90 L56 60 L88 118 L120 66 L152 120 L184 70 L216 118 L248 66 L280 44 L300 30" color={C.accent} />
      <Label x={24} y={40} anchor="start" color={C.amber}>{t.r}</Label>
      <Label x={24} y={144} anchor="start" color={C.cyan}>{t.s}</Label>
      <Arrow x={296} y={20} dir="up" color={C.bull} />
      <Label x={296} y={4} color={C.bull}>{t.break}</Label>
    </>,
  );
}

function BearRectangle({ lang }: DiagramProps) {
  const t = lang === 'th' ? { r: 'แนวต้าน', s: 'แนวรับ', break: 'เบรกลง' } : { r: 'Resistance', s: 'Support', break: 'Breakdown' };
  return shell(
    <>
      <Guide x1={24} y1={52} x2={296} y2={52} color={C.bear} />
      <Guide x1={24} y1={128} x2={296} y2={128} color={C.amber} />
      <PricePath d="M24 90 L56 120 L88 62 L120 116 L152 68 L184 112 L216 70 L248 114 L280 134 L300 148" color={C.accent} />
      <Label x={24} y={40} anchor="start" color={C.bear}>{t.r}</Label>
      <Label x={24} y={144} anchor="start" color={C.amber}>{t.s}</Label>
      <Arrow x={296} y={160} dir="down" color={C.bear} />
      <Label x={296} y={176} color={C.bear}>{t.break}</Label>
    </>,
  );
}

/* ---------------------------------------------------------------------------
 * Registry — scenario id → diagram
 * ------------------------------------------------------------------------- */

const DIAGRAMS: Record<string, (props: DiagramProps) => ReactNode> = {
  doji: DojiDiagram,
  hammer: Hammer,
  'shooting-star': ShootingStar,
  engulfing: Engulfing,
  'morning-star': MorningStar,
  'evening-star': EveningStar,
  harami: Harami,
  'three-soldiers': ThreeSoldiers,
  'three-crows': ThreeCrows,
  harmonic: GartleyHarmonic,
  'g-artley': GartleyHarmonic,
  butterfly: ButterflyHarmonic,
  crab: CrabHarmonic,
  'playbook-bat': BatHarmonic,
  cypher: CypherHarmonic,
  shark: SharkHarmonic,
  abcd: ABCDHarmonic,
  'pattern-double-top': DoubleTop,
  'pattern-head-shoulders': HeadShoulders,
  'pattern-falling-wedge': FallingWedge,
  'pattern-double-bottom': DoubleBottom,
  'pattern-rising-wedge': RisingWedge,
  'pattern-inverse-hs': InverseHeadShoulders,
  'pattern-triple-top': TripleTop,
  'pattern-triple-bottom': TripleBottom,
  'pattern-rounding-top': RoundingTop,
  'pattern-rounding-bottom': RoundingBottom,
  'pattern-diamond-top': DiamondTop,
  'pattern-diamond-bottom': DiamondBottom,
  'pattern-broadening-top': BroadeningTop,
  'pattern-island-reversal': IslandReversal,
  'pattern-ascending-triangle': AscTriangle,
  'pattern-descending-triangle': DescTriangle,
  'pattern-cup-handle': CupHandle,
  'pattern-pennant': Pennant,
  'pattern-bear-pennant': BearPennant,
  'pattern-symmetrical-triangle': SymTriangle,
  'pattern-bull-rectangle': BullRectangle,
  'pattern-bear-rectangle': BearRectangle,
  'playbook-trendline': BullFlag,
  'pattern-bear-flag': BearFlag,
};

/**
 * The "Pattern Diagram" card: draws the locally-made schematic for a
 * chart-pattern technique, or renders nothing when there is no dedicated
 * diagram for that scenario.
 */
export function PatternDiagramSection({ scenarioId, lang }: DiagramProps & { scenarioId: string }) {
  const draw = DIAGRAMS[scenarioId];
  if (!draw) return null;
  return (
    <div className="mt-4 border-t border-edge pt-4">
      <h4 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted uppercase">
        <span className="h-3 w-1 rounded-full bg-accent" />
        {lang === 'th' ? 'แผนภาพรูปแบบกราฟ' : 'Pattern Diagram'}
      </h4>
      <div className="mt-3 rounded-xl border border-edge bg-panel-2/40 p-2">{draw({ lang })}</div>
    </div>
  );
}
