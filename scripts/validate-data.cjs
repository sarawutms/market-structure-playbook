/*
 * Data integrity checker for the playbook's scenario layer.
 *
 * Compiles the data modules to a temp dir, then verifies:
 *   - every scenario module loads without throwing (catches out-of-bounds
 *     `xxT(n)` index bugs that caused the white-screen crashes),
 *   - every marker / trend-line / zone time exists in its scenario's candles,
 *   - OHLC values are finite and geometrically sane,
 *   - trade plans (entry/SL/TP) have correct long/short geometry,
 *   - every timeframe transform (M5/M15/H1/H4/D1) stays in bounds,
 *   - every concept references an existing scenario, ids are unique.
 *
 * Usage: node scripts/validate-data.cjs
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TMP = path.join(ROOT, '.tmp-check');

const DATA_FILES = [
  'src/data/scenarios.ts',
  'src/data/scenarios-extra.ts',
  'src/data/timeframes.ts',
  'src/data/indicators.ts',
  'src/data/concepts.ts',
];

function run(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

try {
  // 1. Compile the data modules to CommonJS in a temp dir.
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });
  fs.writeFileSync(path.join(TMP, 'package.json'), '{ "type": "commonjs" }\n');
  // --noUnusedLocals/Parameters off: helpers may be unused while a batch is still being authored.
  run(
    `npx tsc --ignoreConfig --ignoreDeprecations 6.0 --noUnusedLocals false --noUnusedParameters false ` +
      `${DATA_FILES.join(' ')} --outDir ${TMP} ` +
      '--module commonjs --target es2022 --moduleResolution node10 --skipLibCheck --esModuleInterop',
  );

  // 2. Run the actual checks inside the temp dir so relative requires resolve.
  const checkSrc = `
const { SCENARIOS } = require('./scenarios.js');
const { CONCEPTS, CATEGORY_ORDER, CATEGORY_GROUPS } = require('./concepts.js');
const { scenarioForTimeframe } = require('./timeframes.js');

const TFS = ['m5', 'm15', 'h1', 'h4', 'd1'];
let errors = 0;
const fail = (msg) => { errors++; console.log('  ✗ ' + msg); };

function finite(n, what) {
  if (typeof n !== 'number' || !Number.isFinite(n)) fail(\`\${what} is not a finite number: \${n}\`);
}

function checkBase(name, sc) {
  const candles = sc.candles;
  if (!candles || candles.length === 0) return fail(\`\${name}: no candles\`);
  const times = new Set(candles.map((c) => String(c.time)));
  if (times.size !== candles.length) fail(\`\${name}: duplicate candle times\`);
  const minLow = Math.min(...candles.map((c) => c.low));
  const maxHigh = Math.max(...candles.map((c) => c.high));

  candles.forEach((c, i) => {
    if (c.time === undefined || c.time === null || c.time === '') fail(\`\${name} candle[\${i}].time missing\`);
    finite(c.open, \`\${name} candle[\${i}].open\`);
    finite(c.high, \`\${name} candle[\${i}].high\`);
    finite(c.low, \`\${name} candle[\${i}].low\`);
    finite(c.close, \`\${name} candle[\${i}].close\`);
    if (c.high < c.low) fail(\`\${name} candle[\${i}]: high < low\`);
    if (c.high < Math.max(c.open, c.close)) fail(\`\${name} candle[\${i}]: high below body\`);
    if (c.low > Math.min(c.open, c.close)) fail(\`\${name} candle[\${i}]: low above body\`);
    if (c.volume !== undefined) finite(c.volume, \`\${name} candle[\${i}].volume\`);
  });

  for (const m of sc.markers ?? []) {
    if (!times.has(String(m.time))) fail(\`\${name} marker '\${m.text}' time \${String(m.time)} not in candles\`);
  }
  for (const tl of sc.trendLines ?? []) {
    if (!times.has(String(tl.from.time))) fail(\`\${name} trendline from \${String(tl.from.time)} not in candles\`);
    if (!times.has(String(tl.to.time))) fail(\`\${name} trendline to \${String(tl.to.time)} not in candles\`);
    finite(tl.from.price, \`\${name} trendline from.price\`);
    finite(tl.to.price, \`\${name} trendline to.price\`);
  }
  for (const z of sc.zones ?? []) {
    if (!times.has(String(z.startTime))) fail(\`\${name} zone start \${String(z.startTime)} not in candles\`);
    if (!times.has(String(z.endTime))) fail(\`\${name} zone end \${String(z.endTime)} not in candles\`);
    if (z.topPrice !== undefined && z.bottomPrice !== undefined && z.topPrice < z.bottomPrice) {
      fail(\`\${name} zone topPrice < bottomPrice\`);
    }
  }
  for (const l of sc.priceLines ?? []) {
    finite(l.price, \`\${name} priceLine '\${l.title}' price\`);
    if (l.price > maxHigh * 1.02 || l.price < minLow * 0.98) {
      fail(\`\${name} priceLine '\${l.title}' price \${l.price} far outside [\${minLow}, \${maxHigh}]\`);
    }
  }
  if (sc.trade) {
    const t = sc.trade;
    finite(t.entry.price, \`\${name} trade entry\`);
    finite(t.sl.price, \`\${name} trade sl\`);
    finite(t.tp.price, \`\${name} trade tp\`);
    if (t.direction === 'long' && !(t.entry.price > t.sl.price && t.tp.price > t.entry.price)) {
      fail(\`\${name} long trade geometry wrong (entry \${t.entry.price}, sl \${t.sl.price}, tp \${t.tp.price})\`);
    }
    if (t.direction === 'short' && !(t.entry.price < t.sl.price && t.tp.price < t.entry.price)) {
      fail(\`\${name} short trade geometry wrong (entry \${t.entry.price}, sl \${t.sl.price}, tp \${t.tp.price})\`);
    }
  }
}

function checkTf(name, sc, tf) {
  let out;
  try {
    out = scenarioForTimeframe(sc, tf);
  } catch (e) {
    fail(\`\${name} \${tf}: threw \${e.message}\`);
    return;
  }
  const times = new Set(out.candles.map((c) => String(c.time)));
  if (times.size !== out.candles.length) fail(\`\${name} \${tf}: duplicate times after transform\`);
  for (const m of out.markers ?? []) {
    if (!times.has(String(m.time))) fail(\`\${name} \${tf}: marker time \${String(m.time)} missing after transform\`);
  }
  for (const tl of out.trendLines ?? []) {
    if (!times.has(String(tl.from.time))) fail(\`\${name} \${tf}: trendline from missing after transform\`);
    if (!times.has(String(tl.to.time))) fail(\`\${name} \${tf}: trendline to missing after transform\`);
  }
  for (const z of out.zones ?? []) {
    if (!times.has(String(z.startTime))) fail(\`\${name} \${tf}: zone start missing after transform\`);
    if (!times.has(String(z.endTime))) fail(\`\${name} \${tf}: zone end missing after transform\`);
  }
}

// Concept → scenario mapping + uniqueness.
const seen = new Set();
for (const c of CONCEPTS) {
  if (seen.has(c.id)) fail(\`duplicate concept id \${c.id}\`);
  seen.add(c.id);
  if (!SCENARIOS[c.scenarioId]) fail(\`concept \${c.id}: scenarioId '\${c.scenarioId}' not in SCENARIOS\`);
}

// Category / group integrity — a concept with an unknown category or group
// silently disappears from the accordion UI, so verify both.
for (const c of CONCEPTS) {
  if (!CATEGORY_ORDER.includes(c.category)) {
    fail('concept ' + c.id + ': category "' + c.category + '" not in CATEGORY_ORDER');
  }
  if (!(CATEGORY_GROUPS[c.category] ?? []).includes(c.group)) {
    fail('concept ' + c.id + ': group "' + c.group + '" not in CATEGORY_GROUPS["' + c.category + '"]');
  }
}
for (const cat of CATEGORY_ORDER) {
  if (CONCEPTS.filter((c) => c.category === cat).length === 0) {
    fail('category "' + cat + '" has no concepts');
  }
}
console.log('  ℹ category counts — ' + CATEGORY_ORDER.map((cat) => cat + ': ' + CONCEPTS.filter((c) => c.category === cat).length).join(' | '));

const count = Object.keys(SCENARIOS).length;
for (const [name, sc] of Object.entries(SCENARIOS)) {
  checkBase(name, sc);
  for (const tf of TFS) checkTf(name, sc, tf);
}

const used = new Set(CONCEPTS.map((c) => c.scenarioId));
const unused = Object.keys(SCENARIOS).filter((n) => !used.has(n));
if (unused.length) console.log('  ℹ scenarios not referenced by any concept:', unused.join(', '));

console.log(\`Checked \${Object.keys(SCENARIOS).length} scenarios × \${TFS.length} timeframes, \${CONCEPTS.length} concepts.\`);
console.log(errors === 0 ? '✅ All data integrity checks passed' : \`❌ \${errors} problem(s) found\`);
process.exit(errors === 0 ? 0 : 1);
`;
  fs.writeFileSync(path.join(TMP, 'check.cjs'), checkSrc);
  run(`node ${path.join(TMP, 'check.cjs')}`);
  process.exitCode = 0;
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}
