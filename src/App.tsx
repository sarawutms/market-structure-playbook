import { useEffect, useMemo, useRef, useState } from 'react';
import { CONCEPTS } from './data/concepts';
import { SCENARIOS } from './data/scenarios';
import { scenarioForTimeframe } from './data/timeframes';
import type { Concept, Language, Timeframe } from './data/types';
import { ConceptList } from './components/ConceptList';
import { ChartPanel } from './components/ChartPanel';
import { ExplanationCard } from './components/ExplanationCard';
import { LanguageToggle } from './components/LanguageToggle';
import { Home } from './components/Home';
import { UI } from './i18n/ui';

/** localStorage key for the UI language preference (persists across reloads). */
const LANG_STORAGE_KEY = 'playbook.lang';

/** Reads the saved language; falls back to English when absent or invalid. */
function loadSavedLang(): Language {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    return saved === 'th' || saved === 'en' ? saved : 'en';
  } catch {
    return 'en'; // localStorage unavailable (private mode, etc.)
  }
}

const CONCEPT_STORAGE_KEY = 'playbook.concept';
const THEME_STORAGE_KEY = 'playbook.theme';
const TIMEFRAME_STORAGE_KEY = 'playbook.tf';
const VIEW_STORAGE_KEY = 'playbook.view';

const TIMEFRAMES: Timeframe[] = ['m5', 'm15', 'h1', 'h4', 'd1'];

function loadSavedView(): 'home' | 'playbook' {
  try {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY);
    return saved === 'playbook' ? 'playbook' : 'home';
  } catch {
    return 'home';
  }
}

const SIDEBAR_WIDTH_KEY = 'playbook.sidebarWidth';
const SIDEBAR_OPEN_KEY = 'playbook.sidebarOpen';
const RIGHT_SIDEBAR_WIDTH_KEY = 'playbook.rightSidebarWidth';

function loadSavedSidebarWidth(): number {
  try {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : 320;
  } catch {
    return 320;
  }
}

function loadSavedRightSidebarWidth(): number {
  try {
    const saved = localStorage.getItem(RIGHT_SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : 380;
  } catch {
    return 380;
  }
}

const RIGHT_SIDEBAR_OPEN_KEY = 'playbook.rightSidebarOpen';

function loadSavedRightSidebarOpen(): boolean {
  try {
    const saved = localStorage.getItem(RIGHT_SIDEBAR_OPEN_KEY);
    return saved === null ? true : saved === 'true';
  } catch {
    return true;
  }
}

function loadSavedSidebarOpen(): boolean {
  try {
    const saved = localStorage.getItem(SIDEBAR_OPEN_KEY);
    return saved === null ? true : saved === 'true';
  } catch {
    return true;
  }
}

function loadSavedTimeframe(): Timeframe {
  try {
    const saved = localStorage.getItem(TIMEFRAME_STORAGE_KEY);
    return TIMEFRAMES.includes(saved as Timeframe) ? (saved as Timeframe) : 'h1';
  } catch {
    return 'h1';
  }
}

function loadSavedConcept(): string {
  try {
    const saved = localStorage.getItem(CONCEPT_STORAGE_KEY);
    return saved ?? 'playbook-ob';
  } catch {
    return 'playbook-ob';
  }
}

function loadSavedTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export default function App() {
  const [view, setView] = useState<'home' | 'playbook'>(loadSavedView);
  const [selectedId, setSelectedId] = useState(loadSavedConcept);
  const [lang, setLang] = useState<Language>(loadSavedLang);
  const [theme, setTheme] = useState<'light' | 'dark'>(loadSavedTheme);
  const [tf, setTf] = useState<Timeframe>(loadSavedTimeframe);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(loadSavedSidebarWidth);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(loadSavedRightSidebarWidth);
  const [sidebarOpen, setSidebarOpen] = useState(loadSavedSidebarOpen);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(loadSavedRightSidebarOpen);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingRightSidebar, setIsDraggingRightSidebar] = useState(false);

  // Horizontal Resize (Left Sidebar)
  const handleSidebarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    setIsDraggingSidebar(true);
    
    const handleMouseMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startX;
      const newWidth = Math.max(240, Math.min(startWidth + deltaX, 600));
      setSidebarWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Horizontal Resize (Right Sidebar)
  const handleRightSidebarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightSidebarWidth;
    setIsDraggingRightSidebar(true);
    
    const handleMouseMove = (ev: MouseEvent) => {
      const deltaX = startX - ev.clientX; // drag left increases width
      const newWidth = Math.max(280, Math.min(startWidth + deltaX, 800));
      setRightSidebarWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsDraggingRightSidebar(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
      localStorage.setItem(RIGHT_SIDEBAR_WIDTH_KEY, rightSidebarWidth.toString());
      localStorage.setItem(SIDEBAR_OPEN_KEY, sidebarOpen.toString());
      localStorage.setItem(RIGHT_SIDEBAR_OPEN_KEY, rightSidebarOpen.toString());
    } catch {
      /* ignore */
    }
  }, [sidebarWidth, rightSidebarWidth, sidebarOpen, rightSidebarOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      /* ignore */
    }
  }, [view]);

  // Persist the language choice so it survives page reloads.
  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      /* ignore — storage unavailable */
    }
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem(CONCEPT_STORAGE_KEY, selectedId);
    } catch {
      /* ignore */
    }
  }, [selectedId]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      if (theme === 'light') {
        document.documentElement.classList.add('theme-light');
      } else {
        document.documentElement.classList.remove('theme-light');
      }
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(TIMEFRAME_STORAGE_KEY, tf);
    } catch {
      /* ignore */
    }
  }, [tf]);

  const concept = useMemo(
    () => CONCEPTS.find((c) => c.id === selectedId) ?? CONCEPTS[0],
    [selectedId],
  );
  // Derive the candle dataset + overlays for the selected timeframe.
  const scenario = useMemo(
    () => scenarioForTimeframe(SCENARIOS[concept.scenarioId], tf),
    [concept.scenarioId, tf],
  );
  const rightRef = useRef<HTMLDivElement>(null);

  // Close the mobile drawer with Escape and lock body scroll while open.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleSelect = (next: Concept) => {
    setSelectedId(next.id);
    setMenuOpen(false);
    // On mobile the index sits above the chart — bring the analysis into view.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => {
        rightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  if (view === 'home') {
    return (
      <Home 
        lang={lang} 
        onLangChange={setLang} 
        theme={theme} 
        onThemeToggle={() => setTheme(t => t === 'light' ? 'dark' : 'light')} 
        onOpenPlaybook={() => setView('playbook')} 
      />
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-transparent relative overflow-hidden">
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />
      
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-edge glass-panel px-4 py-3 lg:px-6 relative z-10">
        <div className="flex min-w-0 items-center gap-3">
          {/* Hamburger — opens the playbook index as a drawer on mobile */}
          <button
            type="button"
            aria-label={UI.openMenu[lang]}
            title={UI.openMenu[lang]}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="flex lg:hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-edge bg-panel-2 text-muted transition-colors hover:bg-panel hover:text-main active:scale-95"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
          
          {/* Sidebar Toggle (Desktop) */}
          <button
            type="button"
            aria-label={sidebarOpen ? "Close Left Panel" : "Open Left Panel"}
            title={sidebarOpen ? "Close Left Panel" : "Open Left Panel"}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-edge bg-panel-2 text-muted transition-colors hover:bg-panel hover:text-main active:scale-95"
          >
            {sidebarOpen ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m11 17-5-5 5-5" />
                <path d="m18 17-5-5 5-5" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            )}
          </button>
          <button 
            type="button"
            className="flex items-center gap-3 min-w-0 text-left group"
            onClick={() => setView('home')}
            title={lang === 'en' ? 'Return to Home' : 'กลับสู่หน้าหลัก'}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-gradient-to-br from-accent/30 to-accent/5 transition-colors group-hover:from-accent/40 group-hover:to-accent/10">
              <svg
                className="h-4.5 w-4.5 text-accent"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 17 9 12l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-main transition-colors group-hover:text-accent">Market Structure Playbook</h1>
              <p className="truncate text-[11px] text-dim">{UI.appSubtitle[lang]}</p>
            </div>
          </button>
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-edge bg-panel-2 px-2.5 py-1 font-mono text-[11px] text-muted md:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bull" />
            {UI.instrument[lang]}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded-full border border-edge bg-panel-2 px-2.5 py-1 font-mono text-[11px] text-muted">
              {concept.tag}
            </span>
            <span className="rounded-full border border-edge bg-panel-2 px-2.5 py-1 font-mono text-[11px] text-muted">
              {scenario.candles.length} {UI.candles[lang]}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-panel-2 text-muted transition-colors hover:bg-panel hover:text-main"
            title="Toggle theme"
          >
            {theme === 'light' ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </button>
          <LanguageToggle lang={lang} onChange={setLang} />
          
          {/* Right Sidebar Toggle (Desktop) */}
          <button
            type="button"
            aria-label={rightSidebarOpen ? "Close Right Panel" : "Open Right Panel"}
            title={rightSidebarOpen ? "Close Right Panel" : "Open Right Panel"}
            aria-expanded={rightSidebarOpen}
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="hidden lg:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-edge bg-panel-2 text-muted transition-colors hover:bg-panel hover:text-main active:scale-95"
          >
            {rightSidebarOpen ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 17 5-5-5-5" />
                <path d="m13 17 5-5-5-5" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M15 3v18" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile drawer — the playbook index slides in over the chart */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!menuOpen}
      >
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 w-80 max-w-[85vw] shadow-2xl transition-transform duration-300 ease-out ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <ConceptList selectedId={selectedId} onSelect={handleSelect} lang={lang} drawer />
          <button
            type="button"
            aria-label={UI.closeMenu[lang]}
            onClick={() => setMenuOpen(false)}
            className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-md text-dim transition-colors hover:bg-panel-2 hover:text-main lg:hidden"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main: Playbook Index (left) + Interactive chart (right) */}
      <main className="flex min-h-0 flex-1 flex-col lg:flex-row relative overflow-y-auto lg:overflow-hidden">
        <div 
          className={`hidden lg:flex flex-col relative will-change-[width,opacity] ${!isDraggingSidebar ? 'transition-[width,opacity,margin] duration-300 ease-in-out' : ''} ${sidebarOpen ? 'opacity-100' : 'w-0 opacity-0 overflow-hidden border-r-0'}`}
          style={{ width: sidebarOpen ? sidebarWidth : 0 }}
        >
          <div className="w-full h-full min-w-[240px]">
            <ConceptList selectedId={selectedId} onSelect={handleSelect} lang={lang} />
          </div>
          
          {/* Sidebar Resizer Handle */}
          <div 
            className={`absolute top-0 -right-1.5 h-full w-3 cursor-col-resize z-20 flex items-center justify-center group ${sidebarOpen ? '' : 'hidden'}`}
            onMouseDown={handleSidebarMouseDown}
            title={lang === 'en' ? 'Drag to resize sidebar' : 'ลากเพื่อปรับขนาดเมนู'}
          >
            <div className="h-10 w-0.5 rounded-full bg-dim/30 group-hover:bg-accent/70 group-active:bg-accent transition-colors" />
          </div>
        </div>

        <div className="flex min-h-[50vh] shrink-0 lg:shrink min-w-0 flex-1 flex-col relative z-0">
          <ChartPanel scenario={scenario} lang={lang} theme={theme} tf={tf} onTfChange={setTf} />
        </div>

        {/* Right Sidebar: Explanation Card */}
        <div 
          className={`flex flex-col w-full lg:w-[var(--right-width)] shrink-0 border-t lg:border-t-0 lg:border-l border-edge bg-panel shadow-sm relative will-change-[width,opacity] ${!isDraggingRightSidebar ? 'transition-[width,opacity,border] duration-300 ease-in-out' : ''} ${!rightSidebarOpen ? 'lg:opacity-0 lg:overflow-hidden lg:border-l-0' : ''}`}
          style={{ '--right-width': rightSidebarOpen ? `${rightSidebarWidth}px` : '0px' } as React.CSSProperties}
        >
          {/* Sidebar Resizer Handle (Left edge of Right Sidebar) */}
          <div 
            className={`absolute top-0 -left-1.5 h-full w-3 cursor-col-resize z-20 items-center justify-center group ${rightSidebarOpen ? 'hidden lg:flex' : 'hidden'}`}
            onMouseDown={handleRightSidebarMouseDown}
            title={lang === 'en' ? 'Drag to resize' : 'ลากเพื่อปรับขนาด'}
          >
            <div className="h-10 w-0.5 rounded-full bg-dim/30 group-hover:bg-accent/70 group-active:bg-accent transition-colors" />
          </div>

          <ExplanationCard concept={concept} scenario={scenario} scenarioId={concept.scenarioId} lang={lang} />
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-edge glass-panel px-4 py-2 text-center text-[11px] text-dim relative z-10">
        {UI.disclaimer[lang]}
      </footer>
    </div>
  );
}
