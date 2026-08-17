import type { Language } from '../data/types';

interface LanguageToggleProps {
  lang: Language;
  onChange: (lang: Language) => void;
}

const OPTIONS: Array<{ value: Language; label: string }> = [
  { value: 'th', label: 'TH' },
  { value: 'en', label: 'EN' },
];

/**
 * Top-nav language toggle. A segmented TH | EN control that updates the
 * global language state, switching all UI text between Thai and English.
 */
export function LanguageToggle({ lang, onChange }: LanguageToggleProps) {
  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-edge bg-panel-2 p-0.5"
      role="group"
      aria-label="Language"
      title="Language / ภาษา"
    >
      {OPTIONS.map((opt) => {
        const active = lang === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider transition-all active:scale-95 ${
              active ? 'bg-accent text-main shadow-sm' : 'text-dim hover:text-main hover:bg-panel'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
