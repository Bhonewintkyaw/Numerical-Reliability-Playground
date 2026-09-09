import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import GraphsTab from './components/GraphsTab.jsx';
import MarkovTab from './components/MarkovTab.jsx';
import GraphicsTab from './components/GraphicsTab.jsx';
import CryptoTab from './components/CryptoTab.jsx';

const TABS = [
  { id: 'g', label: 'Graphs', sub: 'incidence → tree' },
  { id: 'm', label: 'Markov', sub: 'steady state' },
  { id: 'c', label: 'Graphics', sub: 'transforms' },
  { id: 'k', label: 'Crypto', sub: 'Hill mod 26' },
];

function initialTheme() {
  try {
    const saved = localStorage.getItem('nrp-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch { /* ignore */ }
  return 'light';
}

export default function App() {
  const [tab, setTab] = useState('g');
  const [pivotOn, setPivotOn] = useState(true);
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('nrp-theme', theme); } catch { /* ignore */ }
  }, [theme]);

  const dark = theme === 'dark';

  return (
    <div className="layout">
      <Sidebar pivotOn={pivotOn} setPivotOn={setPivotOn} />
      <main>
        <header>
          <div className="topbar">
            <div>
              <h2>Reliability Playground <span className="hdr-sub">· Ch. 10</span></h2>
              <p>Drag · slide · type. The sidebar shows why each demo can break.</p>
            </div>
            <button
              className="theme-btn"
              onClick={() => setTheme(dark ? 'light' : 'dark')}
              aria-label={dark ? 'Switch to day mode' : 'Switch to night mode'}
              title={dark ? 'Switch to day mode' : 'Switch to night mode'}
            >
              {dark ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                </svg>
              )}
              {dark ? 'Day' : 'Night'}
            </button>
          </div>
          <div className="tabs" role="tablist" aria-label="Applications">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id}
                className={tab === t.id ? 'tab-btn active' : 'tab-btn'} onClick={() => setTab(t.id)}>
                {t.label} <small>· {t.sub}</small>
              </button>
            ))}
          </div>
        </header>
        <div className="content">
          {tab === 'g' && <GraphsTab theme={theme} />}
          {tab === 'm' && <MarkovTab theme={theme} />}
          {tab === 'c' && <GraphicsTab theme={theme} />}
          {tab === 'k' && <CryptoTab theme={theme} />}
        </div>
        <footer>Pivot → measure → trust · Vite + React</footer>
      </main>
    </div>
  );
}
