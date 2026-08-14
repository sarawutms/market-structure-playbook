const fs = require('fs');
const path = require('path');

function replaceInFile(filepath, replacements) {
  let content = fs.readFileSync(filepath, 'utf8');
  let original = content;
  for (const [search, replace] of replacements) {
    content = content.split(search).join(replace);
  }
  if (original !== content) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log('Updated ' + filepath);
  }
}

const dir = 'C:\\Users\\-\\Documents\\dev\\freebuff\\src';
const files = [
  'App.tsx',
  'components/Home.tsx',
  'components/ConceptList.tsx',
  'components/ExplanationCard.tsx',
  'components/ChartPanel.tsx',
  'components/LanguageToggle.tsx',
  'components/PatternDiagram.tsx'
];

for (const file of files) {
  replaceInFile(path.join(dir, file), [
    ['text-white', 'text-main'],
    ['hover:text-white', 'hover:text-main'],
    ['group-hover:text-white', 'group-hover:text-main'],
    ['bg-white/20', 'bg-main/20'],
    ['bg-white/50', 'bg-main/50'],
    ['bg-white/70', 'bg-main/70'],
    ['group-active:bg-white', 'group-active:bg-main'],
    ['text-[#d6dae4]', 'text-sub'],
    ['text-[#c9d1e0]', 'text-sub'],
    ["text: '#d6dae4'", "text: 'var(--color-text-sub-val)'"]
  ]);
}
