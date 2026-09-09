import { useEffect, useMemo, useRef, useState } from 'react';
import { cond2, fmt } from '../lib/numerics.js';

function steady(a, b) {
  const d = (1 - a) + b;
  const pi = d !== 0 ? [b / d, (1 - a) / d] : [0.5, 0.5];
  return { pi: isFinite(pi[0]) ? pi : [0.5, 0.5], l2: a - b };
}

export default function MarkovTab({ theme, onCond }) {
  const dark = theme === 'dark';
  const [a, setA] = useState(0.8);
  const [b, setB] = useState(0.3);
  const [x, setX] = useState([1, 0]);
  const [step, setStep] = useState(0);
  const [trace, setTrace] = useState([[1, 0]]);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);
  const canvasRef = useRef(null);

  const { pi, l2 } = useMemo(() => steady(a, b), [a, b]);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  useEffect(() => {
    onCond({
      value: cond2(a, b, 1 - a, 1 - b),
      what: 'Markov A (this tab)',
      note: 'Stochastic matrices are gentle: columns sum to 1, λ₁ = 1 always.',
    });
  }, [a, b, onCond]);

  function reset() {
    setX([1, 0]); setStep(0); setTrace([[1, 0]]);
  }
  function stop() {
    setPlaying(false);
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
  }
  function advance(prev) {
    return [a * prev[0] + b * prev[1], (1 - a) * prev[0] + (1 - b) * prev[1]];
  }
  function doStep() {
    stop();
    setX((prev) => {
      const nx = advance(prev);
      setTrace((t) => [...t, [...nx]]);
      return nx;
    });
    setStep((s) => s + 1);
  }
  function play() {
    if (playing) { stop(); return; }
    setPlaying(true);
    timer.current = setInterval(() => {
      setX((prev) => {
        const nx = advance(prev);
        setTrace((t) => [...t, [...nx]]);
        return nx;
      });
      setStep((s) => {
        if (s + 1 >= 60) stop();
        return s + 1;
      });
    }, 220);
  }

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = dark ? '#2c312e' : '#dde3e1';
    ctx.beginPath(); ctx.moveTo(30, 10); ctx.lineTo(30, 90); ctx.lineTo(430, 90); ctx.stroke();
    ctx.fillStyle = dark ? '#a3aaa1' : '#6f6f67'; ctx.font = '10px Inter';
    ctx.fillText('1.0', 4, 18); ctx.fillText('0', 12, 90);
    const n = trace.length;
    const px = (i) => 30 + i * (400 / Math.max(1, Math.min(n, 40)));
    const line = (idx, color) => {
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.beginPath();
      const start = Math.max(0, n - 40);
      for (let i = start; i < n; i++) {
        const X = px(i - start), Y = 90 - trace[i][idx] * 72;
        if (i === start) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.stroke();
    };
    line(0, dark ? '#eda94f' : '#b45309');
    line(1, dark ? '#8db4fb' : '#22302f');
  }, [trace, dark]);

  return (
    <>
      <div className="kicker">02 · Markov Chains — toward the steady state</div>
      <div className="grid2">
        <div className="card">
          <h3>Rental cars: city ⇄ suburb</h3>
          <p>Columns sum to 1. a = cars staying in the city, b = cars returning to it.</p>
          <div className="eq" style={{ marginTop: 8 }}>
            A = <b>[[{fmt(a, 2)}, {fmt(b, 2)}],[{fmt(1 - a, 2)}, {fmt(1 - b, 2)}]]</b>
          </div>
          <div className="controls">
            <div className="ctrl"><label>a <span className="mono">{fmt(a, 2)}</span></label>
              <input type="range" min="0" max="1" step="0.05" value={a} onChange={(e) => { setA(parseFloat(e.target.value)); stop(); reset(); }} /></div>
            <div className="ctrl"><label>b <span className="mono">{fmt(b, 2)}</span></label>
              <input type="range" min="0" max="1" step="0.05" value={b} onChange={(e) => { setB(parseFloat(e.target.value)); stop(); reset(); }} /></div>
          </div>
          <div className="controls">
            <button className="btn" onClick={play}>{playing ? '⏸ Pause' : '▶ Play'}</button>
            <button className="btn ghost" onClick={doStep}>Step</button>
            <button className="btn ghost" onClick={() => { stop(); reset(); }}>Reset</button>
          </div>
          <div className="eq">λ₁ = <b>1</b> always · λ₂ = <b>{fmt(l2, 2)}</b><br />
            π = <b>[{fmt(pi[0], 3)}, {fmt(pi[1], 3)}]</b>{' '}
            <span style={{ color: 'var(--muted)' }}>(Google ranks pages with the same vector)</span></div>
        </div>
        <div className="card">
          <h3>u₀ → u₁ → … → u∞</h3>
          <div className="bar-row">
            <div style={{ textAlign: 'center' }}>
              <div className="bar" style={{ background: 'var(--acc-m)', height: Math.max(8, x[0] * 170) + 'px' }}>◉</div>
              <div className="mono" style={{ fontSize: 14 }}>{fmt(x[0], 2)}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>city</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="bar" style={{ background: 'var(--ink)', opacity: 0.55, height: Math.max(8, x[1] * 170) + 'px' }}>◉</div>
              <div className="mono" style={{ fontSize: 14 }}>{fmt(x[1], 2)}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>suburb</div>
            </div>
          </div>
          <div className="eq" style={{ marginTop: 8 }}>step <b>{step}</b> · u = <b>[{fmt(x[0], 3)}, {fmt(x[1], 3)}]</b></div>
          <div className="canvas-wrap" style={{ marginTop: 8 }}><canvas ref={canvasRef} width="440" height="110" /></div>
        </div>
      </div>
    </>
  );
}
