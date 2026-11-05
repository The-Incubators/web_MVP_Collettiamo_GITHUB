import { describe, expect, it } from "vitest";
import { coefficientiOmografia, matriceOmografia, type Punto } from "./omografia";

function applica(k: number[], x: number, y: number): Punto {
  const [a, b, c, d, e, f, g, h] = k;
  const w = g * x + h * y + 1;
  return [(a * x + b * y + c) / w, (d * x + e * y + f) / w];
}

describe("omografia del biglietto sulla foto", () => {
  const dst: Punto[] = [
    [193, 242],
    [653, 197],
    [704, 691],
    [230, 763],
  ];

  it("porta i quattro vertici del rettangolo sui quattro punti della foto", () => {
    const k = coefficientiOmografia(640, 520, dst);
    const src: Punto[] = [
      [0, 0],
      [640, 0],
      [640, 520],
      [0, 520],
    ];
    src.forEach(([x, y], i) => {
      const [u, v] = applica(k, x, y);
      expect(u).toBeCloseTo(dst[i][0], 6);
      expect(v).toBeCloseTo(dst[i][1], 6);
    });
  });

  it("un rettangolo su sé stesso è l'identità", () => {
    const m = matriceOmografia(10, 20, [
      [0, 0],
      [10, 0],
      [10, 20],
      [0, 20],
    ]);
    const numeri = m.slice("matrix3d(".length, -1).split(",").map(Number);
    const identita = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    numeri.forEach((n, i) => expect(n).toBeCloseTo(identita[i], 9));
  });
});
