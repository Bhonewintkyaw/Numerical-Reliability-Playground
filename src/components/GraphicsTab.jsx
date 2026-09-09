import { useEffect, useMemo, useRef, useState } from 'react';
import { cond2, fmt } from '../lib/numerics.js';

const TRI = [[-1.2, -1], [1.2, -1], [0, 1.4]];

function m3(A, B) {
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) C[i][j] += A[i][k] * B[k][j];
  return C;
}

export default function GraphicsTab({ theme, onCond }) {
  const dark = theme === 'dark';
  const [g, setG] = useState({ sx: 1, sy: 1, th: 0, tx: 0, ty: 0, px: 0, py: 0 });
  const svgRef = useRef(null);
  const drag = useRef(null);

  const M = useMemo(() => {
    const r = (g.th * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
    const S = [[g.sx, 0, 0], [0, g.sy, 0], [0, 0, 1]];
    const R = [[c, -s, 0], [s, c, 0], [0, 0, 1]];
    const T1 = [[1, 0, -g.px], [0, 1, -g.py], [0, 0, 1]];
    const T2 = [[1, 0, g.px + g.tx], [0, 1, g.py + g.ty], [0, 0, 1]];
    return m3(T2, m3(R, m3(S, T1)));
  }, [g]);

  const apply = ([x, y]) => [M[0][0] * x + M[0][1] * y + M[0][2], M[1][0] * x + M[1][1] * y + M[1][2]];
  const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
  const kappa = Math.max(g.sx, g.sy) / Math.min(g.sx, g.sy);

  useEffect(() => {
    const r = (g.th * Math.PI) / 180;
    const L = [g.sx * Math.cos(r), -g.sy * Math.sin(r), g.sx * Math.sin(r), g.sy * Math.cos(r)];
    onCond({
      value: cond2(L[0], L[1], L[2], L[3]),
      what: 'graphics linear part (this tab)',
      note: 'κ = max|S| / min|S| — uneven scale makes it fragile.',
    });
  }, [g, onCond]);

  const W = 460, H = 330;
  const X = (x) => W / 2 + x * 52, Y = (y) => H / 2 - y * 52;
  const grid = dark ? '#2c312e' : '#e4e2da';
  const axis = dark ? '#4a4e4a' : '#b9b9b1';
  const ghost = dark ? '#5a605a' : '#c3c9c7';
  const acc = dark ? '#b79ffa' : '#6d28d9';
  const piv = dark ? '#e0a37c' : '#b65a3a';
  const pts = (a) => a.map((p) => `${X(p[0])},${Y(p[1])}`).join(' ');
  const T = TRI.map(apply);
  const tp = apply([g.px, g.py]);
  const cx = X(tp[0]), cy = Y(tp[1]);

  function toWorld(e) {
    const r = svgRef.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * W) / r.width / 52 - W / 2 / 52, y: H / 2 / 52 - ((e.clientY - r.top) * H) / r.height / 52 };
  }

  function onDown(e) {
    const t = e.target;
    if (t.closest('[data-pivot]')) drag.current = { mode: 'pivot' };
    else if (t.closest('[data-body]')) {
      drag.current = { mode: 'body', sx: e.clientX, sy: e.clientY, tx: g.tx, ty: g.ty, r: svgRef.current.getBoundingClientRect() };
    } else return;
    e.preventDefault();
    e.target.setPointerCapture?.(e.pointerId);
  }
  function onMove(e) {
    if (!drag.current) return;
    if (drag.current.mode === 'pivot') {
      const w = toWorld(e);
      setG((p) => ({ ...p, px: Math.round((w.x - p.tx) * 5) / 5, py: Math.round((w.y - p.ty) * 5) / 5 }));
    } else {
      const d = drag.current;
      const nx = d.tx + ((e.clientX - d.sx) * 4) / (d.r.width / 2);
      const ny = d.ty - ((e.clientY - d.sy) * 3) / (d.r.height / 2);
      setG((p) => ({
        ...p,
        tx: Math.max(-4, Math.min(4, Math.round(nx * 5) / 5)),
        ty: Math.max(-3, Math.min(3, Math.round(ny * 5) / 5)),
      }));
    }
  }

  const set = (k) => (e) => setG((p) => ({ ...p, [k]: parseFloat(e.target.value) }));

  return (
    <>
      <div className="kicker">03 · Computer Graphics — one matrix moves the shape</div>
      <div className="grid2">
        <div className="card">
          <h3>Triangle — drag ✛ pivot</h3>
          <p>Drag the pivot (rotation centre). Drag the triangle to move it. Same math a GPU runs per frame.</p>
          <div className="canvas-wrap">
            <svg
              ref={svgRef} width="460" height="330" style={{ width: '100%', maxWidth: 460, cursor: 'grab' }}
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={() => { drag.current = null; }}
            >
              {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((i) => (
                <g key={i}>
                  <line x1={X(i)} y1={0} x2={X(i)} y2={H} stroke={grid} />
                  <line x1={0} y1={Y(i)} x2={W} y2={Y(i)} stroke={grid} />
                </g>
              ))}
              <line x1={0} y1={Y(0)} x2={W} y2={Y(0)} stroke={axis} />
              <line x1={X(0)} y1={0} x2={X(0)} y2={H} stroke={axis} />
              <polygon points={pts(TRI)} fill="none" stroke={ghost} strokeWidth={2} strokeDasharray="6 4" data-body="1" />
              <polygon points={pts(T)} fill={dark ? 'rgba(183,159,250,.12)' : 'rgba(109,40,217,.08)'} stroke={acc} strokeWidth={2.5} data-body="1" />
              <g data-pivot="1">
                <line x1={cx - 11} y1={cy} x2={cx + 11} y2={cy} stroke={piv} strokeWidth={2.5} />
                <line x1={cx} y1={cy - 11} x2={cx} y2={cy + 11} stroke={piv} strokeWidth={2.5} />
                <text x={cx + 13} y={cy - 8} fontSize="13" fontWeight="700" fill={piv}>✛</text>
              </g>
            </svg>
          </div>
          <div className="controls">
            <button className="btn ghost" onClick={() => { setG({ sx: 1, sy: 1, th: 0, tx: 0, ty: 0, px: 0, py: 0 }); }}>Reset</button>
            <span className="tag">pivot ({fmt(g.px, 1)}, {fmt(g.py, 1)}) · det = {fmt(det, 2)} · κ = {fmt(kappa, 2)}</span>
          </div>
        </div>
        <div className="card">
          <h3>Matrix · live</h3>
          <div className="controls">
            <div className="ctrl"><label>sx <span className="mono">{fmt(g.sx, 1)}</span></label>
              <input type="range" min="0.2" max="2.5" step="0.1" value={g.sx} onChange={set('sx')} /></div>
            <div className="ctrl"><label>sy <span className="mono">{fmt(g.sy, 1)}</span></label>
              <input type="range" min="0.2" max="2.5" step="0.1" value={g.sy} onChange={set('sy')} /></div>
            <div className="ctrl"><label>θ <span className="mono">{g.th}°</span></label>
              <input type="range" min="-180" max="180" step="5" value={g.th} onChange={set('th')} /></div>
            <div className="ctrl"><label>tx <span className="mono">{fmt(g.tx, 1)}</span></label>
              <input type="range" min="-4" max="4" step="0.2" value={g.tx} onChange={set('tx')} /></div>
            <div className="ctrl"><label>ty <span className="mono">{fmt(g.ty, 1)}</span></label>
              <input type="range" min="-3" max="3" step="0.2" value={g.ty} onChange={set('ty')} /></div>
          </div>
          <div className="label">M = T(t)·T(p)·R·S·T(−p) — homogeneous 3×3</div>
          <div className="eq">
            M = <b>[{fmt(M[0][0], 3)}&nbsp;&nbsp;{fmt(M[0][1], 3)}&nbsp;&nbsp;{fmt(M[0][2], 3)}]</b><br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>[{fmt(M[1][0], 3)}&nbsp;&nbsp;{fmt(M[1][1], 3)}&nbsp;&nbsp;{fmt(M[1][2], 3)}]</b><br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>[&nbsp;&nbsp;0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1]</b> &nbsp; det = {fmt(det, 3)}
          </div>
          <div className="cap">Rotation about the pivot = translate to origin, rotate, translate back.</div>
        </div>
      </div>
    </>
  );
}
