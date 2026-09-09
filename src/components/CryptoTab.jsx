import { useMemo, useState } from 'react';
import { cleanText, egcd, modInv } from '../lib/numerics.js';

const group = (s) => s.replace(/(..)/g, '$1 ').trim();

export default function CryptoTab() {
  const [k, setK] = useState({ a: 3, b: 3, c: 2, d: 5 });
  const [plain, setPlain] = useState('HELLO WORLD');

  const info = useMemo(() => {
    const a = ((k.a % 26) + 26) % 26, b = ((k.b % 26) + 26) % 26;
    const c = ((k.c % 26) + 26) % 26, d = ((k.d % 26) + 26) % 26;
    const det = (((a * d - b * c) % 26) + 26) % 26;
    const g = egcd(det, 26)[0];
    const ok = g === 1;
    const inv = ok ? modInv(det, 26) : null;
    const invMat = ok ? { ia: (inv * d) % 26, ib: (((-inv * b) % 26) + 26) % 26, ic: (((-inv * c) % 26) + 26) % 26, id: (inv * a) % 26 } : null;
    let pt = cleanText(plain);
    if (pt.length % 2 === 1) pt += 'X';
    let ct = '';
    if (pt.length > 0) {
      for (let i = 0; i < pt.length; i += 2) {
        const x = pt.charCodeAt(i) - 65, y = pt.charCodeAt(i + 1) - 65;
        ct += String.fromCharCode(((a * x + b * y) % 26) + 65) + String.fromCharCode(((c * x + d * y) % 26) + 65);
      }
    }
    let dec = '';
    if (pt.length === 0) dec = '';
    else if (ok) {
      for (let i = 0; i < ct.length; i += 2) {
        const x = ct.charCodeAt(i) - 65, y = ct.charCodeAt(i + 1) - 65;
        dec += String.fromCharCode(((invMat.ia * x + invMat.ib * y) % 26) + 65) +
               String.fromCharCode(((invMat.ic * x + invMat.id * y) % 26) + 65);
      }
    } else dec = '— no inverse —';
    return { a, b, c, d, det, g, ok, inv, invMat, pt, ct, dec };
  }, [k, plain]);

  function applyPreset(v) {
    if (v === 'ok') setK({ a: 3, b: 3, c: 2, d: 5 });
    if (v === 'bad') setK({ a: 2, b: 4, c: 1, d: 2 });
    if (v === 'even') setK({ a: 4, b: 2, c: 2, d: 4 });
  }

  const num = (key) => (e) => setK((p) => ({ ...p, [key]: parseInt(e.target.value) || 0 }));

  return (
    <>
      <div className="kicker">04 · Crypto</div>
      <div className="grid2">
        <div className="card">
          <h3>Key matrix</h3>
          <div className="controls">
            <div className="ctrl"><label>a</label><input type="number" min="0" max="25" value={k.a} onChange={num('a')} /></div>
            <div className="ctrl"><label>b</label><input type="number" min="0" max="25" value={k.b} onChange={num('b')} /></div>
            <div className="ctrl"><label>c</label><input type="number" min="0" max="25" value={k.c} onChange={num('c')} /></div>
            <div className="ctrl"><label>d</label><input type="number" min="0" max="25" value={k.d} onChange={num('d')} /></div>
            <div className="ctrl"><label>preset</label>
              <select onChange={(e) => applyPreset(e.target.value)} defaultValue="ok">
                <option value="ok">Valid</option>
                <option value="bad">Bad · det 0</option>
                <option value="even">Bad · shares 2</option>
              </select></div>
          </div>
          <div className="eq">K = [[{info.a}, {info.b}], [{info.c}, {info.d}]] · det = {info.det} · gcd({info.det},26) = {info.g} {info.ok ? '✓ invertible' : '✕ NOT invertible'}</div>
          <div className="eq" style={{ marginTop: 8 }}>
            {info.ok
              ? <>K⁻¹ = [[{info.invMat.ia}, {info.invMat.ib}], [{info.invMat.ic}, {info.invMat.id}]] (× {info.inv})</>
              : <>K⁻¹ doesn't exist — gcd(det, 26) = {info.g}</>}
          </div>
          <div style={{ marginTop: 8 }}>
            <span className={info.ok ? 'pill good' : 'pill bad'}>{info.ok ? '✓ Invertible' : '✕ Not invertible'}</span>
          </div>
          <div className="note">Need gcd(det, 26) = 1 — else no inverse.</div>
        </div>
        <div className="card">
          <h3>Message</h3>
          <div className="ctrl"><label>A–Z only</label>
            <input type="text" value={plain} onChange={(e) => setPlain(e.target.value)} style={{ minWidth: '100%' }} /></div>
          <div className="crypt-flow">
            <div className="crypt-box"><div className="label" style={{ margin: '0 0 4px' }}>ciphertext</div><div>{info.ct ? group(info.ct) : '(type letters A–Z)'}</div></div>
            <div className="crypt-arrow">→</div>
            <div className="crypt-box"><div className="label" style={{ margin: '0 0 4px' }}>decrypted back</div>
              <div style={{ color: !info.ok ? 'var(--bad)' : info.dec === info.pt ? 'var(--good)' : 'var(--bad)' }}>{info.dec ? group(info.dec) : '—'}</div></div>
          </div>
          <div className="eq" style={{ marginTop: 8, fontSize: 11.5 }}>
            {info.pt.length >= 2 && (() => {
              const x = info.pt.charCodeAt(0) - 65, y = info.pt.charCodeAt(1) - 65;
              const cx = (info.a * x + info.b * y) % 26, cy = (info.c * x + info.d * y) % 26;
              return `“${info.pt.slice(0, 2)}” = [${x},${y}] → [${cx},${cy}] = “${String.fromCharCode(cx + 65)}${String.fromCharCode(cy + 65)}” ${info.ok ? '✓' : '✕'}`;
            })()}
          </div>
          {!info.ok && <div className="note copper" style={{ display: 'block' }}>⚠ Not invertible — can't decrypt.</div>}
        </div>
      </div>
    </>
  );
}
