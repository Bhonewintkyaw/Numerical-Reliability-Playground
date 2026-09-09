import { useEffect, useMemo, useState } from 'react';
import { cond2, fmt, sci, sigRound } from '../lib/numerics.js';

const RSTEP = (7 * Math.PI) / 180;

function mmul4(A, B) {
  const C = [[0, 0], [0, 0]];
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    let v = 0;
    for (let k = 0; k < 2; k++) v += A[i][k] * B[k][j];
    C[i][j] = sigRound(v, 4);
  }
  return C;
}

function readout(ex, s) {
  if (ex === 'sys') {
    const eps = 1e-4 * Math.pow(10, (-2 * s) / 100), t = 1 / eps;
    const coeff = sigRound(1 + t, 6), v = sigRound(t / coeff, 6), u = sigRound((1 - v) / eps, 6);
    const errN = Math.abs(u - 1) * 100, cond = cond2(eps, 1, -1, 1);
    return {
      errN, errR: 0, cond,
      condNote: 'κ ≈ 2.6 the whole way — the problem stays fine.',
      cap: `ε = ${sci(eps)} · naive 6-digit arithmetic gives u = ${fmt(u, 4)} (${fmt(errN, 1)}% err) · pivoting stays exact.`,
      sWhat: 'Slider shrinks the 0.0001 coefficient down to 0.000001.',
      naive: { title: 'no swap · 6-digit arithmetic', lines: [['u', fmt(u, 4)], ['error', fmt(errN, 1) + '% (true u = 1)']], cap: 'Watch for the cliff: 1 + 1/ε rounds away.' },
      rel: { title: 'largest pivot first (row swap)', lines: [['u', '1'], ['error', '0%'], ['κ₂', fmt(cond, 2)]], cap: 'Same κ, correct answer — stability wins.' },
    };
  }
  if (ex === 'markov') {
    const t = s / 100, a = 0.8 + 0.19 * t, b = 0.05 - 0.04 * t, l2 = a - b;
    const d = (1 - a) + b, pi = [b / d, (1 - a) / d];
    let x = [1, 0];
    for (let i = 0; i < 10; i++) x = [a * x[0] + b * x[1], (1 - a) * x[0] + (1 - b) * x[1]];
    const errN = Math.max(Math.abs(x[0] - pi[0]), Math.abs(x[1] - pi[1])) * 100;
    const err0 = Math.max(Math.abs(1 - pi[0]), Math.abs(pi[1]));
    const need = Math.abs(l2) >= 1 ? Infinity : Math.ceil(Math.log(1e-6 / err0) / Math.log(Math.abs(l2)));
    const cond = cond2(a, b, 1 - a, 1 - b);
    return {
      errN, errR: 0, cond,
      condNote: 'A is nearly singular as λ₂ → 1.',
      cap: `λ₂ = ${fmt(l2, 3)} · 10 fixed steps leave ${fmt(errN, 1)}% · true π = [${fmt(pi[0], 3)}, ${fmt(pi[1], 3)}] needs ≈ ${need} steps.`,
      sWhat: 'Slider pushes λ₂ = a − b from 0.75 toward 0.98 (near-singular).',
      naive: { title: 'A¹⁰·u₀ after 10 fixed steps', lines: [['u', `[${fmt(x[0], 3)}, ${fmt(x[1], 3)}]`], ['left-over error', fmt(errN, 1) + '%']], cap: 'Fixed budget — wrong when convergence is slow.' },
      rel: { title: 'steady state directly', lines: [['π', `[${fmt(pi[0], 3)}, ${fmt(pi[1], 3)}]`], ['error', '0%'], ['naive would need', `≈ ${need} steps`]], cap: 'Eigen-decomposition skips the waiting.' },
    };
  }
  const N = 1 + Math.round(s * 1.99);
  const c = Math.cos(RSTEP), sn = Math.sin(RSTEP);
  const base = [[sigRound(c, 4), sigRound(-sn, 4)], [sigRound(sn, 4), sigRound(c, 4)]];
  let Rn = base.map((r) => [...r]);
  for (let k = 1; k < N; k++) Rn = mmul4(Rn, base);
  const tot = N * RSTEP;
  const Re = [[Math.cos(tot), -Math.sin(tot)], [Math.sin(tot), Math.cos(tot)]];
  const P = [[0, 0], [2, 0], [1, 1.6]], piv = [1, 0];
  const tf = (Mm, p) => {
    const q = [p[0] - piv[0], p[1] - piv[1]];
    return [Mm[0][0] * q[0] + Mm[0][1] * q[1] + piv[0], Mm[1][0] * q[0] + Mm[1][1] * q[1] + piv[1]];
  };
  const R0 = Math.max(...P.map((p) => Math.hypot(p[0] - piv[0], p[1] - piv[1])));
  const errN = P.reduce((sum, p) => { const q = tf(Rn, p), r = tf(Re, p); return sum + Math.hypot(q[0] - r[0], q[1] - r[1]); }, 0) / 3 / R0 * 100;
  const poly = (arr) => arr.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
  return {
    errN, errR: 0, cond: 1,
    condNote: 'Rotations have κ = 1 — drift is pure roundoff pile-up.',
    cap: `N = ${N} × 7° about (1, 0) · repeated 4-digit rounding drifts ${fmt(errN, 1)}% · direct R(Nθ) is exact.`,
    sWhat: 'Slider sets N = 1 … 200 repeated rotations.',
    naive: { title: `rounded R multiplied ${N}×`, lines: [['drift', fmt(errN, 1) + '%']], cap: 'Red dashed = drifted · green = correct.', svg: true, naivePts: poly(P.map((p) => tf(Rn, p))), exactPts: poly(P.map((p) => tf(Re, p))) },
    rel: { title: `single R(${N * 7}°) from total angle`, lines: [['drift', '0%'], ['κ', '1']], cap: 'Recompute — never accumulate.' },
  };
}

function DuelBox({ data }) {
  return (
    <>
      <div className="eq">
        {data.title}<br />
        {data.lines.map(([k, v]) => (
          <span key={k}>{k} = <b>{v}</b><br /></span>
        ))}
      </div>
      {data.svg && (
        <svg width="300" height="170" viewBox="-0.5 -2 4 3.4" style={{ width: '100%', maxWidth: 300, marginTop: 8 }}>
          <polygon points={data.exactPts} fill="none" stroke="var(--good)" strokeWidth="0.05" />
          <polygon points={data.naivePts} fill="none" stroke="var(--bad)" strokeWidth="0.05" strokeDasharray="0.12 0.08" />
          <circle cx="1" cy="0" r="0.07" fill="var(--ink)" />
        </svg>
      )}
      <div className="cap">{data.cap}</div>
    </>
  );
}

export default function BonusTab({ onCond }) {
  const [ex, setEx] = useState('sys');
  const [s, setS] = useState(0);
  const r = useMemo(() => readout(ex, s), [ex, s]);

  useEffect(() => {
    onCond({ value: r.cond, what: 'bonus matrix (this tab)', note: r.condNote });
  }, [r, onCond]);

  return (
    <>
      <div className="kicker">★ Bonus · Model vs Compute — naive vs reliable head-to-head</div>
      <div className="card">
        <div className="controls" style={{ marginTop: 0 }}>
          <div className="ctrl"><label>Example</label>
            <select value={ex} onChange={(e) => setEx(e.target.value)} style={{ minWidth: 240 }}>
              <option value="sys">2×2 Linear System</option>
              <option value="markov">Markov Chain Steady State</option>
              <option value="rot">Rotation Composition</option>
            </select></div>
        </div>
        <div className="score">
          <div className="score-box score-naive"><div className="label" style={{ marginTop: 0 }}>% error (Naive)</div><div className="score-num">{fmt(r.errN, 1)}%</div></div>
          <div className="score-box score-good"><div className="label" style={{ marginTop: 0 }}>% error (Reliable)</div><div className="score-num">{fmt(r.errR, 1)}%</div></div>
        </div>
        <div className="cap" style={{ fontSize: 14 }}>{r.cap}</div>
      </div>
      <div className="big-slider">
        <div className="ctrl"><label>Push toward instability: <span className="mono">{s}</span> / 100</label>
          <input type="range" min="0" max="100" step="1" value={s} onChange={(e) => setS(parseInt(e.target.value, 10))} /></div>
        <div className="cap">{r.sWhat}</div>
      </div>
      <div className="duel">
        <div className="duel-card naive"><h4>Naive</h4><DuelBox data={r.naive} /></div>
        <div className="duel-card reliable"><h4>Reliable</h4><DuelBox data={r.rel} /></div>
      </div>
    </>
  );
}
