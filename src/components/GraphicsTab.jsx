import { useEffect, useRef, useState } from 'react';
import { fmt } from '../lib/numerics.js';

const HOUSE = [[-1.2, -1], [-1.2, 0.4], [-0.6, 1.2], [0, 1.8], [0.6, 1.2], [1.2, 0.4], [1.2, -1], [-1.2, -1]];

function buildMatrix(g) {
  const r = (g.th * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  const S = [[g.sx, 0, 0], [0, g.sy, 0], [0, 0, 1]];
  const R = [[c, -s, 0], [s, c, 0], [0, 0, 1]];
  const T1 = [[1, 0, -g.px], [0, 1, -g.py], [0, 0, 1]];
  const T2 = [[1, 0, g.px + g.tx], [0, 1, g.py + g.ty], [0, 0, 1]];
  const m3 = (A, B) => {
    const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) C[i][j] += A[i][k] * B[k][j];
    return C;
  };
  return m3(T2, m3(R, m3(S, T1)));
}

export default function GraphicsTab({ theme }) {
  const dark = theme === 'dark';
  const [g, setG] = useState({ sx: 1, sy: 1, th: 0, tx: 0, ty: 0, px: 0, py: 0 });
  const canvasRef = useRef(null);
  const drag = useRef(null);

  const M = buildMatrix(g);
  const apply = ([x, y]) => [M[0][0] * x + M[0][1] * y + M[0][2], M[1][0] * x + M[1][1] * y + M[1][2]];
  const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
  const kappa = Math.max(g.sx, g.sy) / Math.min(g.sx, g.sy);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const X = (x) => W / 2 + x * 52, Y = (y) => H / 2 - y * 52;
    ctx.strokeStyle = dark ? '#2b2f2c' : '#e6e4de'; ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(X(i), 0); ctx.lineTo(X(i), H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, Y(i)); ctx.lineTo(W, Y(i)); ctx.stroke();
    }
    ctx.strokeStyle = dark ? '#4a4e4a' : '#b9b9b1';
    ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H); ctx.stroke();
    ctx.strokeStyle = dark ? '#5a605a' : '#c3c9c7'; ctx.setLineDash([5, 4]); ctx.lineWidth = 2; ctx.beginPath();
    HOUSE.forEach((p, i) => { if (i) ctx.lineTo(X(p[0]), Y(p[1])); else ctx.moveTo(X(p[0]), Y(p[1])); });
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = dark ? 'rgba(127,209,192,.14)' : 'rgba(15,61,62,.09)'; ctx.strokeStyle = dark ? '#7fd1c0' : '#0f3d3e'; ctx.lineWidth = 2.5; ctx.beginPath();
    HOUSE.map(apply).forEach((p, i) => { if (i) ctx.lineTo(X(p[0]), Y(p[1])); else ctx.moveTo(X(p[0]), Y(p[1])); });
    ctx.closePath(); ctx.fill(); ctx.stroke();
    const d1 = apply([-0.25, -1]), d2 = apply([-0.25, 0]), d3 = apply([0.25, 0]), d4 = apply([0.25, -1]);
    ctx.fillStyle = dark ? '#e0986f' : '#b65a3a'; ctx.beginPath();
    ctx.moveTo(X(d1[0]), Y(d1[1])); ctx.lineTo(X(d2[0]), Y(d2[1])); ctx.lineTo(X(d3[0]), Y(d3[1])); ctx.lineTo(X(d4[0]), Y(d4[1]));
    ctx.closePath(); ctx.fill();
    const tp = apply([g.px, g.py]);
    const tpx = X(tp[0]), tpy = Y(tp[1]);
    ctx.strokeStyle = dark ? '#e0986f' : '#b65a3a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(tpx - 10, tpy); ctx.lineTo(tpx + 10, tpy); ctx.moveTo(tpx, tpy - 10); ctx.lineTo(tpx, tpy + 10); ctx.stroke();
    ctx.fillStyle = dark ? '#e0986f' : '#b65a3a'; ctx.font = 'bold 13px Inter'; ctx.fillText('✛ pivot', tpx + 12, tpy - 8);
  }, [g, dark]); // eslint-disable-line react-hooks/exhaustive-deps

  function toWorld(e) {
    const cv = canvasRef.current;
    const r = cv.getBoundingClientRect();
    const px = ((e.clientX - r.left) * cv.width) / r.width;
    const py = ((e.clientY - r.top) * cv.height) / r.height;
    return { x: (px - cv.width / 2) / 52, y: (cv.height / 2 - py) / 52 };
  }

  function onPointerDown(e) {
    const w = toWorld(e);
    const pvx = M[0][0] * g.px + M[0][1] * g.py + M[0][2];
    const pvy = M[1][0] * g.px + M[1][1] * g.py + M[1][2];
    drag.current = Math.hypot(w.x - pvx, w.y - pvy) < 0.45
      ? { mode: 'pivot' }
      : { mode: 'body', sx: e.clientX, sy: e.clientY, tx: g.tx, ty: g.ty, rect: canvasRef.current.getBoundingClientRect() };
    e.target.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (!drag.current) return;
    if (drag.current.mode === 'pivot') {
      const w = toWorld(e);
      setG((p) => ({ ...p, px: Math.round((w.x - p.tx) * 5) / 5, py: Math.round((w.y - p.ty) * 5) / 5 }));
    } else {
      const { sx, sy, tx, ty, rect } = drag.current;
      let ntx = tx + ((e.clientX - sx) * 4) / (rect.width / 2);
      let nty = ty - ((e.clientY - sy) * 3) / (rect.height / 2);
      ntx = Math.max(-4, Math.min(4, Math.round(ntx * 5) / 5));
      nty = Math.max(-3, Math.min(3, Math.round(nty * 5) / 5));
      setG((p) => ({ ...p, tx: ntx, ty: nty }));
    }
  }
  function onPointerUp() { drag.current = null; }

  const set = (k) => (e) => setG((p) => ({ ...p, [k]: parseFloat(e.target.value) }));
  const r = (g.th * Math.PI) / 180;

  return (
    <>
      <div className="kicker">03 · Graphics</div>
      <div className="grid2">
        <div className="card">
          <h3>House — drag ✛ pivot</h3>
          <p>Drag body to move.</p>
          <div className="canvas-wrap">
            <canvas ref={canvasRef} width="460" height="330" style={{ cursor: 'grab' }}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
          </div>
          <div className="controls">
            <button className="btn ghost" onClick={() => setG({ sx: 1, sy: 1, th: 0, tx: 0, ty: 0, px: 0, py: 0 })}>Reset</button>
            <span className="tag">pivot ({fmt(g.px, 1)}, {fmt(g.py, 1)}) · det={fmt(g.sx * g.sy, 2)} · κ={fmt(kappa, 2)}</span>
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
          <div className="label">M = T · R · S · T⁻¹</div>
          <div className="eq" style={{ fontSize: 12.5 }}>
            M = <b>[{fmt(M[0][0], 3)} &nbsp; {fmt(M[0][1], 3)} &nbsp; {fmt(M[0][2], 3)}]</b><br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>[{fmt(M[1][0], 3)} &nbsp; {fmt(M[1][1], 3)} &nbsp; {fmt(M[1][2], 3)}]</b><br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>[&nbsp;&nbsp;0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1]</b> &nbsp; det={fmt(det, 3)}
          </div>
          <div className="label">Parts</div>
          <div className="eq" style={{ fontSize: 11.5 }}>
            S=diag({fmt(g.sx, 2)},{fmt(g.sy, 2)}) · R=[{fmt(Math.cos(r), 2)},{fmt(-Math.sin(r), 2)};{fmt(Math.sin(r), 2)},{fmt(Math.cos(r), 2)}] ·
            t=({fmt(g.tx, 1)},{fmt(g.ty, 1)}) pivot=({fmt(g.px, 1)},{fmt(g.py, 1)})
          </div>
          <div className="note copper">R has κ = 1. Uneven scale raises κ = max/min.</div>
        </div>
      </div>
    </>
  );
}
