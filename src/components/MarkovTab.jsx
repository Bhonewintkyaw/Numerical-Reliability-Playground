import { useEffect, useMemo, useRef, useState } from 'react';
import { fmt } from '../lib/numerics.js';

function steady(a, b) {
  const l2 = a + (1 - b) - 1; // λ1=1, λ2=tr−1
  const d = (1 - a) + b;
  let pi = d !== 0 ? [b / d, (1 - a) / d] : [0.5, 0.5];
  if (!isFinite(pi[0])) pi = [0.5, 0.5];
  return { pi, l2 };
}

export default function MarkovTab({ theme }) {
  const dark = theme === 'dark';
  const [a, setA] = useState(0.8);
  const [b, setB] = useState(0.3);
  const [x, setX] = useState([1, 0]);
  const [step, setStep] = useState(0);
  const [trace, setTrace] = useState([[1, 0]]);
  const [playing, setPlaying] = useState(false);
  const [x0, setX0] = useState('sunny');
  const timer = useRef(null);
  const canvasRef = useRef(null);

  const { pi, l2 } = useMemo(() => steady(a, b), [a, b]);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function reset(keepSliders = true, nextX0 = x0) {
    const v = nextX0 === 'sunny' ? [1, 0] : nextX0 === 'rainy' ? [0, 1] : [0.5, 0.5];
    setX(v); setStep(0); setTrace([[...v]]);
    if (!keepSliders) { /* sliders stay */ }
  }

  function doStep() {
    stop();
    setX((prev) => {
      const nx = [a * prev[0] + b * prev[1], (1 - a) * prev[0] + (1 - b) * prev[1]];
      setTrace((t) => [...t, [...nx]]);
      return nx;
    });
    setStep((s) => s + 1);
  }

  function stop() {
    setPlaying(false);
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
  }

  function play() {
    if (playing) { stop(); return; }
    setPlaying(true);
    timer.current = setInterval(() => {
      setX((prev) => {
        const nx = [a * prev[0] + b * prev[1], (1 - a) * prev[0] + (1 - b) * prev[1]];
        setTrace((t) => [...t, [...nx]]);
        return nx;
      });
      setStep((s) => {
        if (s + 1 >= 60) stop();
        return s + 1;
      });
    }, 220);
  }

  // draw trace whenever trace changes
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = dark ? '#2b2f2c' : '#dde6e5';
    ctx.beginPath(); ctx.moveTo(30, 10); ctx.lineTo(30, 90); ctx.lineTo(430, 90); ctx.stroke();
    ctx.fillStyle = dark ? '#a3aaa1' : '#6b7c7c'; ctx.font = '10px Inter';
    ctx.fillText('1.0', 4, 18); ctx.fillText('0', 12, 90); ctx.fillText('step →', 380, 102);
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
    line(0, dark ? '#7fd1c0' : '#0f3d3e'); line(1, dark ? '#e0986f' : '#b65a3a');
    ctx.fillStyle = dark ? '#7fd1c0' : '#0f3d3e'; ctx.fillText('— sunny', 330, 20);
    ctx.fillStyle = dark ? '#e0986f' : '#b65a3a'; ctx.fillText('— rainy', 330, 34);
  }, [trace, dark]);

  return (
    <>
      <div className="kicker">02 · Markov</div>
      <div className="grid2">
        <div className="card">
          <h3>Markov matrix</h3>
          <p>Columns sum to 1.</p>
          <div className="eq" style={{ marginTop: 8 }}>
            M = <b>[[{fmt(a, 2)}, {fmt(b, 2)}],[{fmt(1 - a, 2)}, {fmt(1 - b, 2)}]]</b> · columns sum to 1 ✓
          </div>
          <div className="controls">
            <div className="ctrl"><label>a <span className="mono">{fmt(a, 2)}</span></label>
              <input type="range" min="0" max="1" step="0.05" value={a} onChange={(e) => { setA(parseFloat(e.target.value)); stop(); reset(true); }} /></div>
            <div className="ctrl"><label>b <span className="mono">{fmt(b, 2)}</span></label>
              <input type="range" min="0" max="1" step="0.05" value={b} onChange={(e) => { setB(parseFloat(e.target.value)); stop(); reset(true); }} /></div>
          </div>
          <div className="controls">
            <div className="ctrl"><label>x₀</label>
              <select value={x0} onChange={(e) => { setX0(e.target.value); stop(); reset(true, e.target.value); }}>
                <option value="sunny">all sunny [1, 0]</option>
                <option value="rainy">all rainy [0, 1]</option>
                <option value="half">fifty-fifty [0.5, 0.5]</option>
              </select></div>
            <button className="btn" onClick={play}>{playing ? '⏸ Pause' : '▶ Play'}</button>
            <button className="btn ghost" onClick={doStep}>Step ×1</button>
            <button className="btn ghost" onClick={() => { stop(); reset(true); }}>Reset</button>
          </div>
          <div className="note">x<sub>k+1</sub> = Mx<sub>k</sub> · |λ₂| sets the speed.</div>
        </div>
        <div className="card">
          <h3>Toward π</h3>
          <div className="bar-row">
            <div style={{ textAlign: 'center' }}>
              <div className="bar" style={{ background: dark ? '#3f7a72' : 'var(--accent)', height: Math.max(8, x[0] * 170) + 'px' }}>☀</div>
              <div className="mono" style={{ fontSize: 13 }}>{fmt(x[0], 2)}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>sunny</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="bar" style={{ background: 'var(--copper)', height: Math.max(8, x[1] * 170) + 'px' }}>🌧</div>
              <div className="mono" style={{ fontSize: 13 }}>{fmt(x[1], 2)}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>rainy</div>
            </div>
          </div>
          <div className="eq" style={{ marginTop: 8 }}>step <b>{step}</b> · x = <b>[{fmt(x[0], 3)}, {fmt(x[1], 3)}]</b><br />
            steady state π = <b>[{fmt(pi[0], 3)}, {fmt(pi[1], 3)}]</b> · λ₂ = <b>{fmt(l2, 3)}</b>{' '}
            <span style={{ color: 'var(--muted)' }}>(speed: |λ₂|^k)</span></div>
          <div className="canvas-wrap" style={{ marginTop: 8 }}><canvas ref={canvasRef} width="440" height="110" /></div>
        </div>
      </div>
    </>
  );
}
