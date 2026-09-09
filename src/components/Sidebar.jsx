import { useMemo } from 'react';
import { fmt, sidebarSolve } from '../lib/numerics.js';

export default function Sidebar({ pivotOn, setPivotOn, tabCond }) {
  const { u, v, log } = useMemo(() => sidebarSolve(pivotOn), [pivotOn]);

  return (
    <aside>
      <div className="kicker-side">Reliability Toolkit · always on</div>
      <h1>Pivot or <em>perish.</em></h1>
      <div className="side-card">
        <div className="side-card-title">Classic system — exact answer u = 1</div>
        <div className="eqbox">
          <b>0.0001·u + 1·v = 1</b><br />
          <b>&nbsp;&nbsp;&nbsp;−1·u + 1·v = 0</b><br />
          <span className="dim">3-digit computer arithmetic</span>
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
            {pivotOn ? '✓ Correct' : '✕ Wrong — 100% error'}
          </span>
        </div>
        <div className="steps">{log}</div>
      </div>
      <div className="cond">
        <div className="side-card-title">Condition number κ₂ · live</div>
        <div className="big">κ ≈ {fmt(tabCond.value, 2)}</div>
        <div className="mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>{tabCond.what}</div>
        <div className="side-note" style={{ marginTop: 8 }} dangerouslySetInnerHTML={{ __html: tabCond.note }} />
      </div>
      <div className="side-note">Flip the toggle, then try each tab. Tab 5 is the bonus head-to-head.</div>
    </aside>
  );
}
