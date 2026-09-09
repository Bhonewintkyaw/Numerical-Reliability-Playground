import { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import GraphsTab from './components/GraphsTab.jsx';
import MarkovTab from './components/MarkovTab.jsx';
import GraphicsTab from './components/GraphicsTab.jsx';
import CryptoTab from './components/CryptoTab.jsx';
import BonusTab from './components/BonusTab.jsx';
import { EPS, cond2 } from './lib/numerics.js';

const TABS = [
  { id: 'g', label: '01 Graphs', sub: 'networks' },
  { id: 'm', label: '02 Markov', sub: 'steady state' },
  { id: 'c', label: '03 Graphics', sub: 'transforms' },
  { id: 'k', label: '04 Crypto', sub: 'Hill mod 26' },
  { id: 'b', label: '★ Bonus', sub: 'naive vs reliable' },
];

function initialTheme() {
  try {
    const saved = localStorage.getItem('nrp-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch { /* ignore */ }
  return 'light';
}

const FALLBACK_COND = {
  value: cond2(EPS, 1, -1, 1),
  what: 'toolkit system',
  note: 'κ is small — the problem is fine. The <b>u = 0</b> failure is the <i>algorithm</i>.',
};

export default function App() {
  const [tab, setTab] = useState('g');
  const [pivotOn, setPivotOn] = useState(true);
  const [theme, setTheme] = useState(initialTheme);
  const [tabCond, setTabCond] = useState(FALLBACK_COND);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('nrp-theme', theme); } catch { /* ignore */ }
  }, [theme]);

  const reportCond = useCallback((c) => { setTabCond(c); }, []);
  const dark = theme === 'dark';

  return (
    <div className="layout">
      <Sidebar pivotOn={pivotOn} setPivotOn={setPivotOn} tabCond={tabCond} />
      <main>
        <header>
          <div className="topbar">
            <div>
              <h2>The Numerical Reliability Playground <span className="hdr-sub">· Ch. 10 + 11</span></h2>
              <p>Tabs 1–4: the main demo — one toolkit, four faces. Tab 5: bonus head-to-head.</p>
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
          <div className="tabs" role="tablist" aria-label="Demos">
            {TABS.map((t) => (
              <button
                key={t.id} role="tab" aria-selected={tab === t.id} data-t={t.id}
                className={tab === t.id ? 'tab-btn active' : 'tab-btn'} onClick={() => setTab(t.id)}
              >
                {t.label} <small>· {t.sub}</small>
              </button>
            ))}
          </div>
        </header>
        <div className="content">
          {tab === 'g' && <div className="panel active acc-g"><GraphsTab theme={theme} onCond={reportCond} /></div>}
          {tab === 'm' && <div className="panel active acc-m"><MarkovTab theme={theme} onCond={reportCond} /></div>}
          {tab === 'c' && <div className="panel active acc-c"><GraphicsTab theme={theme} onCond={reportCond} /></div>}
          {tab === 'k' && <div className="panel active acc-k"><CryptoTab onCond={reportCond} /></div>}
          {tab === 'b' && <div className="panel active acc-b"><BonusTab onCond={reportCond} /></div>}
        </div>
        <footer>Pivot → measure → trust · main demo tabs 1–4, bonus tab 5 · Vite + React</footer>
      </main>
    </div>
  );
}
