import { useMemo } from 'react';
import { EPS, cond2, fmt, matATA, sidebarSolve } from '../lib/numerics.js';

export default function Sidebar({ pivotOn, setPivotOn }) {
  const { u, v, log } = useMemo(() => sidebarSolve(pivotOn), [pivotOn]);
  const cond = useMemo(() => {
    const cc = cond2(EPS, 1, -1, 1);
    const [l1, l2] = matATA(EPS, 1, -1, 1);
    return { cc, sMax: Math.sqrt(l1), sMin: Math.sqrt(Math.max(l2, 0)) };
  }, []);

  return (
    <aside>
      <div className="kicker-side">Toolkit · always on</div>
      <h1>Pivot or <em>perish.</em></h1>
      <div className="side-card">
        <div className="side-card-title">Classic failure case</div>
        <div className="eqbox">
          <b>0.0001·u + 1·v = 1</b><br />
          <b>&nbsp;&nbsp;&nbsp;−1·u + 1·v = 0</b><br />
          <span className="dim">exact: u = 1, v ≈ 0.9999 · 3 sig figs</span>
        </div>
        <div className="toggle-row">
          <div>
            <div className="t-label">{pivotOn ? 'Pivoting: ON' : 'Pivoting: OFF'}</div>
            <div className="t-sub">{pivotOn ? 'pivot −1 · stable' : 'pivot 0.0001 · ×10 000'}</div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={pivotOn} onChange={(e) => setPivotOn(e.target.checked)} />
            <span className="slider" />
          </label>
        </div>
        <div className="answer" style={{ marginTop: 10 }}>
          <div className="answer-eyebrow">Answer</div>
          <div className="u-big">u = {fmt(u, 2)}</div>
          <div className="mono" style={{ fontSize: 13, color: 'var(--muted)' }}>v = {fmt(v, 2)}</div>
          <span className={pivotOn ? 'pill good' : 'pill bad'}>
            {pivotOn ? '✓ Correct' : '✕ Wrong — should be 1'}
          </span>
        </div>
        <div className="steps">{log}</div>
      </div>
      <div className="cond">
        <div className="side-card-title">Condition κ₂(A) · live</div>
        <div className="big">κ ≈ {fmt(cond.cc, 2)}</div>
        <div className="mono" style={{ fontSize: 11, opacity: 0.8 }}>
          σmax≈{fmt(cond.sMax, 2)} · σmin≈{fmt(cond.sMin, 2)} · det≈{fmt(EPS + 1, 4)}
        </div>
        <div className="side-note" style={{ marginTop: 8 }}>
          κ is small — the problem is fine. The <b>u = 0</b> failure is the <i>algorithm</i>: ÷ 0.0001 amplifies roundoff ×10 000.
        </div>
      </div>
      <div className="side-note">
        Flip the toggle, then try each tab.
      </div>
    </aside>
  );
}
