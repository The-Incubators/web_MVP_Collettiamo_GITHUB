/**
 * L'omografia che posa un rettangolo HTML su un quadrilatero della foto (prototipi/comuni.js, `posaSullaFoto`):
 * risolve gli otto coefficienti della trasformazione prospettica che porta i quattro vertici del rettangolo `w`×`h`
 * sui quattro punti `dst` (in pixel, in senso orario dall'alto a sinistra) e la scrive come `matrix3d` per CSS.
 */
export type Punto = readonly [x: number, y: number];

function risolvi(A: number[][], b: number[]): number[] {
  const n = b.length;
  for (let i = 0; i < n; i++) {
    let m = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[m][i])) m = r;
    [A[i], A[m]] = [A[m], A[i]];
    [b[i], b[m]] = [b[m], b[i]];
    for (let r = i + 1; r < n; r++) {
      const f = A[r][i] / A[i][i];
      for (let c = i; c < n; c++) A[r][c] -= f * A[i][c];
      b[r] -= f * b[i];
    }
  }
  const x = new Array<number>(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let c = i + 1; c < n; c++) s -= A[i][c] * x[c];
    x[i] = s / A[i][i];
  }
  return x;
}

/** I coefficienti (a, b, c, d, e, f, g, h) dell'omografia: u = (a x + b y + c) / (g x + h y + 1), v = (d x + e y + f) / (…). */
export function coefficientiOmografia(w: number, h: number, dst: readonly Punto[]): number[] {
  const src: Punto[] = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  return risolvi(A, b);
}

/** La `matrix3d(...)` che porta il rettangolo (0,0)–(w,h) su `dst`, con l'origine della trasformazione in alto a sinistra. */
export function matriceOmografia(w: number, h: number, dst: readonly Punto[]): string {
  const [a, b, c, d, e, f, g, hh] = coefficientiOmografia(w, h, dst);
  return `matrix3d(${a},${d},0,${g},${b},${e},0,${hh},0,0,1,0,${c},${f},0,1)`;
}
