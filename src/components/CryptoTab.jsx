import { useEffect, useMemo, useState } from 'react';
import { cleanText, cond2, gcd, modInv } from '../lib/numerics.js';

const group = (s) => s.replace(/(..)/g, '$1 ').trim();

export default function CryptoTab({ onCond }) {
  const [k, setK] = useState({ a: 3, b: 3, c: 2, d: 5 });
  const [plain, setPlain] = useState('HELLO WORLD');

  const info = useMemo(() => {
    const a = ((k.a % 26) + 26) % 26, b = ((k.b % 26) + 26) % 26;
    const c = ((k.c % 26) + 26) % 26, d = ((k.d % 26) + 26) % 26;
    const det = (((a * d - b * c) % 26) + 26) % 26;
    const g = gcd(det, 26);
    const ok = g === 1;
    const iv = ok ? modInv(det, 26) : null;
    const inv = ok
      ? { ia: (iv * d) % 26, ib: (((-iv * b) % 26) + 26) % 26, ic: (((-iv * c) % 26) + 26) % 26, id: (iv * a) % 26 }
      : null;
    let pt = cleanText(plain);
    if (pt.length % 2 === 1) pt += 'X';
    let ct = '';
    for (let i = 0; i < pt.length; i += 2) {
      const x = pt.charCodeAt(i) - 65, y = pt.charCodeAt(i + 1) - 65;
      ct += String.fromCharCode(((a * x + b * y) % 26) + 65) + String.fromCharCode(((c * x + d * y) % 26) + 65);
    }
    let dec = '';
    if (ok) {
      for (let i = 0; i < ct.length; i += 2) {
        const x = ct.charCodeAt(i) - 65, y = ct.charCodeAt(i + 1) - 65;
        dec += String.fromCharCode(((inv.ia * x + inv.ib * y) % 26) + 65)
             + String.fromCharCode(((inv.ic * x + inv.id * y) % 26) + 65);
      }
    } else dec = '— no inverse —';
    return { a, b, c, d, det, g, ok, inv, pt, ct, dec };
  }, [k, plain]);

  useEffect(() => {
    onCond({
      value: cond2(info.a, info.b, info.c, info.d),
      what: 'key matrix E (this tab)',
      note: info.ok ? 'Invertible mod 26 too (gcd = 1).' : '<b>Not invertible mod 26</b> — like a zero pivot.',
    });
  }, [info, onCond]);

  const num = (key) => (e) => setK((p) => ({ ...p, [key]: parseInt(e.target.value) || 0 }));
  function preset(v) {
    if (v === 'ok') { setK({ a: 3, b: 3, c: 2, d: 5 }); }
    else { setK({ a: 2, b: 4, c: 1, d: 2 }); }
  }

  return (
    <>
      <div className="kicker">04 · Cryptography — Hill cipher mod 26</div>
      <div className="grid2">
        <div className="card">
          <h3>Key matrix E</h3>
          <p>Letters only. Needs gcd(det, 26) = 1 — the modular version of a nonzero pivot.</p>
          <div className="controls">
            <div className="ctrl"><label>a</label><input type="number" min="0" max="25" value={k.a} onChange={num('a')} /></div>
            <div className="ctrl"><label>b</label><input type="number" min="0" max="25" value={k.b} onChange={num('b')} /></div>
            <div className="ctrl"><label>c</label><input type="number" min="0" max="25" value={k.c} onChange={num('c')} /></div>
            <div className="ctrl"><label>d</label><input type="number" min="0" max="25" value={k.d} onChange={num('d')} /></div>
            <div className="ctrl"><label>try</label>
              <select onChange={(e) => preset(e.target.value)} defaultValue="ok">
                <option value="ok">Valid key</option>
                <option value="bad">Bad key</option>
              </select></div>
          </div>
          <div className="eq">E = [[{info.a}, {info.b}], [{info.c}, {info.d}]] · det = {info.det} · gcd({info.det}, 26) = {info.g}</div>
          <div className="eq" style={{ marginTop: 8 }}>
            {info.ok
              ? <>D = E⁻¹ mod 26 = [[{info.inv.ia}, {info.inv.ib}], [{info.inv.ic}, {info.inv.id}]]</>
              : <>D doesn't exist — gcd(det, 26) = {info.g}</>}
          </div>
          <div style={{ marginTop: 8 }}>
            <span className={info.ok ? 'pill good' : 'pill bad'}>
              {info.ok ? '✓ Invertible' : 'Not invertible mod 26 — choose a different matrix'}
            </span>
          </div>
        </div>
        <div className="card">
          <h3>Message</h3>
          <div className="ctrl"><label>A–Z only</label>
            <input type="text" value={plain} onChange={(e) => setPlain(e.target.value)} style={{ minWidth: '100%' }} /></div>
          <div className="crypt-flow">
            <div className="crypt-box"><div className="label" style={{ margin: '0 0 4px' }}>ciphertext</div><div>{info.ct ? group(info.ct) : '(type A–Z)'}</div></div>
            <div className="crypt-arrow">→</div>
            <div className="crypt-box"><div className="label" style={{ margin: '0 0 4px' }}>decrypted</div>
              <div style={{ color: !info.ok ? 'var(--bad)' : 'var(--good)' }}>{info.dec ? group(info.dec) : '—'}</div></div>
          </div>
          <div style={{ marginTop: 10 }}>
            {!info.ok
              ? <span className="pill bad">✕ No inverse — cannot decrypt</span>
              : info.dec === info.pt
                ? <span className="pill good">Match! ✓</span>
                : <span className="pill bad">Mismatch</span>}
          </div>
          <div className="cap">Same idea as online banking: message × secret matrix (mod p). Hill is breakable today — demo only.</div>
        </div>
      </div>
    </>
  );
}
