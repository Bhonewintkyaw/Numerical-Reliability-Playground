export function sigRound(x, sig) {
  if (!isFinite(x) || x === 0) return 0;
  if (sig >= 15) return x;
  const s = Math.sign(x), a = Math.abs(x);
  const m = Math.floor(Math.log10(a));
  const f = Math.pow(10, sig - 1 - m);
  return (s * Math.round(a * f)) / f;
}

export function fmt(x, d = 4) {
  if (!isFinite(x)) return '∞';
  return Number(x.toFixed(d)).toString();
}

export function matATA(a, b, c, d) {
  const s11 = a * a + c * c, s12 = a * b + c * d, s22 = b * b + d * d;
  const tr = s11 + s22, det = s11 * s22 - s12 * s12;
  const disc = Math.max(0, tr * tr - 4 * det);
  return [(tr + Math.sqrt(disc)) / 2, (tr - Math.sqrt(disc)) / 2];
}

export function cond2(a, b, c, d) {
  const [l1, l2] = matATA(a, b, c, d);
  if (l2 <= 1e-14) return Infinity;
  return Math.sqrt(l1 / l2);
}

export function egcd(a, b) {
  if (b === 0) return [a, 1, 0];
  const [g, x1, y1] = egcd(b, a % b);
  return [g, y1, x1 - Math.floor(a / b) * y1];
}

export function modInv(a, m) {
  a = ((a % m) + m) % m;
  const [g, x] = egcd(a, m);
  if (g !== 1) return null;
  return ((x % m) + m) % m;
}

export function cleanText(s) {
  return (s || '').toUpperCase().replace(/[^A-Z]/g, '');
}

export const EPS = 0.0001;

/** Sidebar 3-sig-fig demo: returns {u, v, log} for pivot on/off */
export function sidebarSolve(pivotOn) {
  if (!pivotOn) {
    const mult = sigRound(1 / EPS, 3); // 10000
    const coeff = sigRound(1 + 1 / EPS, 3); // 10001 -> 10000
    const v = sigRound(1 / EPS / coeff, 3); // 1
    const u = sigRound((1 - v) / EPS, 3); // 0
    return {
      u, v,
      log: `WITHOUT pivoting (3 sig figs)\nmult = 1/ε = ${mult}\n(1+1/ε)·v = 1/ε → ${coeff}·v = ${mult}\nv = ${fmt(v, 4)}\nu = (1−v)/ε = ${fmt(u, 4)}  ← WRONG`,
    };
  }
  const coeff = sigRound(1 + EPS, 3); // 1.00
  const v = sigRound(1 / coeff, 3); // 1
  return {
    u: v, v,
    log: `WITH pivoting (3 sig figs)\nswap rows → pivot = −1\nmult = ε/−1 = −0.0001\n(1+ε)·v = 1 → ${coeff}·v = 1\nv = ${fmt(v, 4)} · u = v = ${fmt(v, 4)}  ✓`,
  };
}
