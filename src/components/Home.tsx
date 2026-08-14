
import type { Language } from '../data/types';
import { UI } from '../i18n/ui';
import { LanguageToggle } from './LanguageToggle';

interface HomeProps {
  lang: Language;
  onLangChange: (lang: Language) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onOpenPlaybook: () => void;
}

export function Home({ lang, onLangChange, theme, onThemeToggle, onOpenPlaybook }: HomeProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-transparent relative overflow-x-hidden selection:bg-accent/30 selection:text-main">
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />

      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-3 px-6 py-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-gradient-to-br from-accent/30 to-accent/5 shadow-lg shadow-accent/20">
            <svg
              className="h-5 w-5 text-accent"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <span className="hidden sm:inline-block text-base font-bold text-main tracking-wide">
            Market Structure Playbook
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onThemeToggle}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge bg-panel-2 text-muted transition-colors hover:bg-panel hover:text-main hover:border-accent/50"
            title="Toggle theme"
          >
            {theme === 'light' ? (
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : (
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </button>
          <LanguageToggle lang={lang} onChange={onLangChange} />
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent shadow-md shadow-accent/10 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            Interactive Learning
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-main drop-shadow-sm leading-tight">
            {UI.heroTitle[lang].split(' ').map((word, i) => (
              <span key={i} className="inline-block hover:text-accent transition-colors duration-300 mr-[0.25em] last:mr-0">{word}</span>
            ))}
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted leading-relaxed">
            {UI.heroSubtitle[lang]}
          </p>

          <div className="pt-8">
            <button
              onClick={onOpenPlaybook}
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-accent px-8 py-4 font-bold text-black transition-all hover:scale-105 hover:shadow-xl hover:shadow-accent/40 active:scale-95"
            >
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-150%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(150%)]">
                <div className="relative h-full w-8 bg-main/20" />
              </div>
              <span className="relative text-lg">{UI.openPlaybook[lang]}</span>
              <svg className="relative h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="w-full max-w-5xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 px-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both ease-out">
          <div className="group rounded-2xl border border-edge bg-panel-2/50 backdrop-blur-sm p-6 text-left transition-all hover:-translate-y-1 hover:border-accent/50 hover:bg-panel-2 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:scale-110 transition-transform duration-300">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18M18 9l-5 5-3-3-4 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-main group-hover:text-accent transition-colors">{UI.feat1Title[lang]}</h3>
            <p className="text-dim leading-relaxed">{UI.feat1Desc[lang]}</p>
          </div>

          <div className="group rounded-2xl border border-edge bg-panel-2/50 backdrop-blur-sm p-6 text-left transition-all hover:-translate-y-1 hover:border-accent/50 hover:bg-panel-2 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:scale-110 transition-transform duration-300">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-main group-hover:text-accent transition-colors">{UI.feat2Title[lang]}</h3>
            <p className="text-dim leading-relaxed">{UI.feat2Desc[lang]}</p>
          </div>

          <div className="group rounded-2xl border border-edge bg-panel-2/50 backdrop-blur-sm p-6 text-left transition-all hover:-translate-y-1 hover:border-accent/50 hover:bg-panel-2 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:scale-110 transition-transform duration-300">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-main group-hover:text-accent transition-colors">{UI.feat3Title[lang]}</h3>
            <p className="text-dim leading-relaxed">{UI.feat3Desc[lang]}</p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="mt-auto shrink-0 py-6 text-center text-sm text-dim relative z-10 pb-8">
        {UI.disclaimer[lang]}
      </footer>
    </div>
  );
}
