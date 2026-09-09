import { useEffect, useMemo, useRef, useState } from 'react';
import { EPS, cond2 } from '../lib/numerics.js';

const INIT_NODES = [
  { id: 'A', x: 280, y: 56 },
  { id: 'B', x: 474, y: 248 },
  { id: 'C', x: 86, y: 248 },
  { id: 'O', x: 280, y: 192 },
];
// outer triangle A→B→C→A + spokes into center O
const INIT_EDGES = [
  { id: 0, from: 0, to: 1, on: true, st: '' },
  { id: 1, from: 1, to: 2, on: true, st: '' },
  { id: 2, from: 2, to: 0, on: true, st: '' },
  { id: 3, from: 0, to: 3, on: true, st: '' },
  { id: 4, from: 1, to: 3, on: true, st: '' },
  { id: 5, from: 2, to: 3, on: true, st: '' },
];
const LOG_READY = 'Press “Reduce to spanning tree”.';
const COLS = ['A', 'B', 'C', 'O'];

function components(edges) {
  const p = [0, 1, 2, 3];
  const f = (i) => (p[i] === i ? i : (p[i] = f(p[i])));
  edges.forEach((e) => { const a = f(e.from), b = f(e.to); if (a !== b) p[a] = b; });
  return new Set(p.map(f)).size;
}

function forest(edges) {
  const adj = [[], [], [], []];
  edges.forEach((e) => { adj[e.from].push({ to: e.to, id: e.id }); adj[e.to].push({ to: e.from, id: e.id }); });
  const seen = new Set(), tree = new Set();
  for (let s = 0; s < 4; s++) {
    if (seen.has(s)) continue;
    seen.add(s);
    const q = [s];
    while (q.length) {
      const u = q.shift();
      for (const nb of adj[u]) {
        if (!seen.has(nb.to)) { seen.add(nb.to); tree.add(nb.id); q.push(nb.to); }
      }
    }
  }
  return tree;
}

export default function GraphsTab({ theme, onCond }) {
  const dark = theme === 'dark';
  const C = {
    edge: dark ? '#e8ece9' : '#22302f',
    edgeDead: dark ? '#4a4e4a' : '#c3c9c7',
    nodeFill: dark ? '#1c1f1c' : '#ffffff',
    edgeLabel: dark ? '#e0a37c' : '#b65a3a',
    hint: dark ? '#8a918a' : '#71716a',
    tree: dark ? '#7fce95' : '#177245',
  };
  const [nodes, setNodes] = useState(INIT_NODES);
  const [edges, setEdges] = useState(INIT_EDGES);
  const [log, setLog] = useState(LOG_READY);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const dragIdx = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const onEdges = useMemo(() => edges.filter((e) => e.on), [edges]);
  const active = useMemo(() => onEdges.filter((e) => e.st !== 'dead'), [onEdges]);
  const euler = useMemo(() => {
    const comp = components(active);
    const loops = active.length - 4 + comp;
    return { n: 4, e: active.length, l: loops, ok: 4 - active.length + loops === 1 };
  }, [active]);

  useEffect(() => {
    onCond({
      value: cond2(EPS, 1, -1, 1),
      what: 'toolkit κ (incidence is 6×4 — no 2×2 here)',
      note: 'κ is small — the problem is fine. The <b>u = 0</b> failure is the <i>algorithm</i>.',
    });
  }, [onCond]);

  function toLocal(e) {
    const r = svgRef.current.getBoundingClientRect();
    return {
      x: Math.max(24, Math.min(536, ((e.clientX - r.left) * 560) / r.width)),
      y: Math.max(24, Math.min(296, ((e.clientY - r.top) * 320) / r.height)),
    };
  }

  function flipEdge(e, ev) {
    if (ev.shiftKey) {
      setEdges((p) => p.map((x) => (x.id === e.id ? { ...x, on: false, st: '' } : x)));
    } else {
      setEdges((p) => p.map((x) => (x.id === e.id ? { ...x, from: x.to, to: x.from } : { ...x, st: '' })));
    }
    setLog('Topology changed — press “Reduce” again.');
  }

  function animate() {
    if (timer.current) return;
    setEdges((p) => p.map((e) => (e.on ? { ...e, st: '' } : e)));
    const tree = forest(onEdges);
    const loops = onEdges.filter((e) => !tree.has(e.id)).map((e) => e.id);
    let k = 0;
    setLog('');
    setRunning(true);
    if (!loops.length) {
      setLog('Already a tree — nothing to eliminate.\n');
      setEdges((p) => p.map((e) => (e.on ? { ...e, st: 'tree' } : e)));
      setRunning(false);
      return;
    }
    timer.current = setInterval(() => {
      if (k < loops.length) {
        const id = loops[k];
        setEdges((p) => p.map((e) => (e.id === id ? { ...e, st: 'dead' } : e)));
        setLog((l) => l + `Step ${k + 1}: e${id + 1} closes a loop → grayed out.\n`);
        k += 1;
      } else {
        clearInterval(timer.current);
        timer.current = null;
        setRunning(false);
        setEdges((p) => {
          const tr = forest(p.filter((e) => e.on && e.st !== 'dead'));
          return p.map((e) => (!e.on || e.st === 'dead' ? e : (tr.has(e.id) ? { ...e, st: 'tree' } : e)));
        });
        setLog((l) => l + 'Done → spanning tree (green). 4 − 3 + 0 = 1 ✓\n');
      }
    }, 900);
  }

  function reset() {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    setRunning(false);
    setEdges(INIT_EDGES.map((e) => ({ ...e })));
    setLog(LOG_READY);
  }

  return (
    <>
      <div className="kicker">01 · Graphs &amp; Networks — incidence → spanning tree</div>
      <div className="card">
        <h3>Drag nodes — matrix follows</h3>
        <p>Click an edge to reverse it · ⇧-click disables it. Kirchhoff's laws live on this matrix; GPS shortest-path runs on the same idea.</p>
        <div className="canvas-wrap">
          <svg
            ref={svgRef} width="560" height="320" style={{ width: '100%', maxWidth: 560 }}
            onPointerMove={(e) => {
              if (dragIdx.current == null) return;
              const p = toLocal(e);
              setNodes((prev) => prev.map((q, j) => (j === dragIdx.current ? { ...q, ...p } : q)));
            }}
            onPointerUp={() => { dragIdx.current = null; }}
          >
            <defs>
              <marker id="ga" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" fill={C.edge} />
              </marker>
              <marker id="gd" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" fill={C.edgeDead} />
              </marker>
            </defs>
            {edges.filter((e) => e.on).map((e) => {
              const a = nodes[e.from], b = nodes[e.to];
              const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
              const sx = a.x + (dx / L) * 22, sy = a.y + (dy / L) * 22;
              const ex = b.x - (dx / L) * 27, ey = b.y - (dy / L) * 27;
              const col = e.st === 'dead' ? C.edgeDead : e.st === 'tree' ? C.tree : C.edge;
              return (
                <g key={e.id}>
                  <line
                    x1={sx} y1={sy} x2={ex} y2={ey} stroke={col}
                    strokeWidth={e.st === 'tree' ? 4.5 : 2.5}
                    markerEnd={e.st === 'dead' ? 'url(#gd)' : 'url(#ga)'}
                    opacity={e.st === 'dead' ? 0.35 : 1}
                    style={{ cursor: 'pointer' }}
                    onClick={(ev) => { ev.stopPropagation(); if (!running) flipEdge(e, ev); }}
                  />
                  <text
                    x={(a.x + b.x) / 2 + 7} y={(a.y + b.y) / 2 - 7} fontSize="12" fontFamily="JetBrains Mono"
                    fill={e.st === 'dead' ? C.edgeDead : C.edgeLabel} style={{ cursor: 'pointer' }}
                    onClick={(ev) => { ev.stopPropagation(); if (!running) flipEdge(e, ev); }}
                  >
                    e{e.id + 1}{e.st === 'dead' ? ' ✕' : ''}
                  </text>
                </g>
              );
            })}
            {nodes.map((n, i) => (
              <g
                key={n.id} style={{ cursor: 'grab' }}
                onPointerDown={(ev) => { ev.preventDefault(); dragIdx.current = i; ev.target.setPointerCapture?.(ev.pointerId); }}
                onPointerUp={() => { dragIdx.current = null; }}
              >
                <circle cx={n.x} cy={n.y} r={19} fill={C.nodeFill} stroke={C.edge} strokeWidth={2.5} />
                <text x={n.x} y={n.y + 5} textAnchor="middle" fontWeight="700" fontSize="14" fill={C.edge}>{n.id}</text>
              </g>
            ))}
            <text x={10} y={312} fontSize="11" fill={C.hint}>drag · click edge = reverse · ⇧-click = disable</text>
          </svg>
        </div>
        <div className="controls">
          <button className="btn" onClick={animate} disabled={running}>▶ Reduce to spanning tree</button>
          <button className="btn ghost" onClick={reset}>Reset</button>
          <span className="tag">{euler.n} − {euler.e} + {euler.l} = {euler.n - euler.e + euler.l} {euler.ok ? '✓' : '✗'}</span>
        </div>
        <div className="cap">Eliminating a loop-closing edge = zeroing a dependent column — the sidebar idea, on graphs.</div>
      </div>
      <div className="grid2">
        <div className="card">
          <h3>Incidence matrix — live (6×4)</h3>
          <p>Rows = edges, −1 at tail, +1 at head.</p>
          <table className="mat">
            <thead><tr><th></th>{COLS.map((c) => <th key={c}>{c}</th>)}<th></th></tr></thead>
            <tbody>
              {onEdges.map((e) => (
                <tr key={e.id} className={e.st}>
                  <td>e{e.id + 1}</td>
                  {COLS.map((_, i) => (
                    <td key={i}>{e.from === i && e.to === i ? '0' : e.from === i ? '−1' : e.to === i ? '+1' : '0'}</td>
                  ))}
                  <td style={{ fontFamily: 'Inter', fontSize: 11 }}>{nodes[e.from].id}→{nodes[e.to].id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>Log</h3>
          <div className="steps" style={{ minHeight: 150 }}>{log}</div>
          <div className="note">Gray rows = eliminated loops · green rows = tree.</div>
        </div>
      </div>
    </>
  );
}
