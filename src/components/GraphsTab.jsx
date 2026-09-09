import { useMemo, useRef, useState, useEffect } from 'react';

const INIT_NODES = [
  { id: 'A', x: 90, y: 70 },
  { id: 'B', x: 400, y: 60 },
  { id: 'C', x: 420, y: 230 },
  { id: 'D', x: 70, y: 220 },
];
const INIT_EDGES = [
  { id: 0, from: 0, to: 1, on: true, dead: false, tree: false },
  { id: 1, from: 1, to: 2, on: true, dead: false, tree: false },
  { id: 2, from: 2, to: 3, on: true, dead: false, tree: false },
  { id: 3, from: 3, to: 0, on: true, dead: false, tree: false },
  { id: 4, from: 0, to: 2, on: true, dead: false, tree: false },
];
const LOG_READY = 'Press “Eliminate to tree”.\nFaded = removed · bold = tree.';

export default function GraphsTab({ theme }) {
  const dark = theme === 'dark';
  const C = {
    edge: dark ? '#e8ece9' : '#22302f',
    edgeDead: dark ? '#4a4e4a' : '#c9d4d3',
    nodeFill: dark ? '#1c1f1c' : '#ffffff',
    nodeText: dark ? '#e8ece9' : '#22302f',
    edgeLabel: dark ? '#e0986f' : '#b65a3a',
    edgeLabelDead: dark ? '#6a706a' : '#a9b8b7',
    hint: dark ? '#8a918a' : '#71716a',
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
  const liveCount = edges.filter((e) => e.on && !e.dead).length;

  function incidenceText(rows) {
    let s = '     ' + onEdges.map((e) => ' e' + (e.id + 1) + ' ').join('') + '\n';
    rows.forEach((n, i) => {
      s += ' ' + n.id + '  ' + onEdges.map((e) => {
        if (e.from === i && e.to === i) return '  0 ';
        if (e.from === i) return ' −1 ';
        if (e.to === i) return ' +1 ';
        return '  0 ';
      }).join('') + '\n';
    });
    return s;
  }
  const incFull = incidenceText(nodes);
  const incRed = incidenceText(nodes.slice(0, 3));

  function toLocal(e) {
    const r = svgRef.current.getBoundingClientRect();
    return {
      x: Math.max(25, Math.min(535, ((e.clientX - r.left) * 560) / r.width)),
      y: Math.max(25, Math.min(275, ((e.clientY - r.top) * 300) / r.height)),
    };
  }

  function animate() {
    if (timer.current) return;
    setEdges((p) => p.map((e) => ({ ...e, dead: false, tree: false })));
    const order = [4, 3];
    let k = 0;
    setLog('');
    setRunning(true);
    timer.current = setInterval(() => {
      if (k < order.length) {
        const tid = order[k];
        setEdges((prev) => {
          const t = prev.find((e) => e.id === tid);
          if (t && t.on) {
            setLog((l) => l + `Step ${k + 1}: e${tid + 1} closes a cycle → removed.\n`);
            return prev.map((e) => (e.id === tid ? { ...e, dead: true } : e));
          }
          setLog((l) => l + `Step ${k + 1}: e${tid + 1} already disabled — skipping.\n`);
          return prev;
        });
        k += 1;
      } else {
        clearInterval(timer.current);
        timer.current = null;
        setRunning(false);
        setEdges((prev) => {
          const tree = prev.filter((e) => e.on && !e.dead).map((e) => 'e' + (e.id + 1)).join(', ');
          setLog((l) => l + `Done → tree {${tree}}.\n`);
          return prev.map((e) => (e.on && !e.dead ? { ...e, tree: true } : e));
        });
      }
    }, 1100);
  }

  function reset() {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    setRunning(false);
    setEdges((prev) => prev.map((e) => ({ ...e, on: e.id === 3 || e.id === 4 ? true : e.on, dead: false, tree: false })));
    setLog(LOG_READY);
  }

  return (
    <>
      <div className="kicker">01 · Graphs</div>
      <div className="card">
        <h3>Drag nodes — matrix follows</h3>
        <p>Click edge = reverse · ⇧-click = disable.</p>
        <div className="canvas-wrap">
          <svg ref={svgRef} width="560" height="300" style={{ width: '100%', maxWidth: 560 }}>
            <defs>
              <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" fill={C.edge} />
              </marker>
              <marker id="arrF" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" fill={C.edgeDead} />
              </marker>
            </defs>
            {edges.filter((e) => e.on).map((e) => {
              const a = nodes[e.from], b = nodes[e.to];
              const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
              const sx = a.x + (dx / L) * 20, sy = a.y + (dy / L) * 20;
              const ex = b.x - (dx / L) * 24, ey = b.y - (dy / L) * 24;
              const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
              return (
                <g key={e.id}>
                  <line
                    x1={sx} y1={sy} x2={ex} y2={ey}
                    stroke={e.dead ? C.edgeDead : C.edge}
                    strokeWidth={e.tree ? 4 : 2.5}
                    markerEnd={e.dead ? 'url(#arrF)' : 'url(#arr)'}
                    opacity={e.dead ? 0.35 : 1}
                    style={{ cursor: 'pointer' }}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      if (running) return;
                      setEdges((prev) => prev.map((p) => {
                        if (p.id !== e.id) return p;
                        if (ev.shiftKey) return { ...p, on: false, dead: false, tree: false };
                        return { ...p, from: p.to, to: p.from, dead: false, tree: false };
                      }));
                    }}
                  />
                  <text x={mx + 6} y={my - 6} fontSize="11" fontFamily="JetBrains Mono" fill={e.dead ? C.edgeLabelDead : C.edgeLabel}>
                    e{e.id + 1}{e.dead ? ' ✕' : ''}
                  </text>
                </g>
              );
            })}
            {nodes.map((n, i) => (
              <g
                key={n.id}
                style={{ cursor: 'grab' }}
                onPointerDown={(ev) => {
                  ev.preventDefault();
                  dragIdx.current = i;
                  ev.target.setPointerCapture?.(ev.pointerId);
                }}
                onPointerMove={(ev) => {
                  if (dragIdx.current !== i) return;
                  if (ev.buttons === 0 && ev.type === 'pointermove' && !ev.pressure) return;
                  const p = toLocal(ev);
                  setNodes((prev) => prev.map((q, j) => (j === i ? { ...q, ...p } : q)));
                }}
                onPointerUp={() => { dragIdx.current = null; }}
              >
                <circle cx={n.x} cy={n.y} r={18} fill={C.nodeFill} stroke={C.edge} strokeWidth={2} />
                <text x={n.x} y={n.y + 5} textAnchor="middle" fontWeight="700" fontSize="14" fill={C.nodeText}>{n.id}</text>
              </g>
            ))}
            <text x={10} y={292} fontSize="11" fill={C.hint}>drag · click = reverse · ⇧-click = disable</text>
          </svg>
        </div>
        <div className="controls">
          <button className="btn copper" onClick={animate} disabled={running}>▶ Eliminate to tree</button>
          <button className="btn ghost" onClick={reset}>Reset</button>
          <span className="tag">live edges {liveCount} · rank 3 · {liveCount > 3 ? `cycles: ${liveCount - 3}` : 'tree ✓'}</span>
        </div>
      </div>
      <div className="grid2">
        <div className="card">
          <h3>Incidence matrix — live</h3>
          <p>−1 at tail, +1 at head.</p>
          <div className="eq" style={{ marginTop: 8, whiteSpace: 'pre' }}>{incFull}</div>
          <div className="label">Reduced (drop D)</div>
          <div className="eq" style={{ whiteSpace: 'pre' }}>{incRed}{onEdges.length > 3 ? 'rank 3 → 2 dependent columns (cycles)' : 'rank = #edges → already a tree ✓'}</div>
        </div>
        <div className="card">
          <h3>Log</h3>
          <div className="steps light">{log}</div>
          <div className="note">Zero pivot = cycle edge. Pivoting = pick a fresh tree edge.</div>
        </div>
      </div>
    </>
  );
}
