// Solo per i test: costruisce uno zip «stored» (senza compressione) con i file dati.

export function zipStored(file: Record<string, string | Uint8Array>): Uint8Array {
  const enc = new TextEncoder();
  const locali: Uint8Array[] = [];
  const centrali: Uint8Array[] = [];
  let offset = 0;
  for (const [nome, testo] of Object.entries(file)) {
    const n = enc.encode(nome);
    const d = typeof testo === "string" ? enc.encode(testo) : testo;
    const l = new DataView(new ArrayBuffer(30));
    l.setUint32(0, 0x04034b50, true);
    l.setUint32(18, d.length, true);
    l.setUint32(22, d.length, true);
    l.setUint16(26, n.length, true);
    locali.push(new Uint8Array(l.buffer), n, d);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true);
    c.setUint32(20, d.length, true);
    c.setUint32(24, d.length, true);
    c.setUint16(28, n.length, true);
    c.setUint32(42, offset, true);
    centrali.push(new Uint8Array(c.buffer), n);
    offset += 30 + n.length + d.length;
  }
  const lungCentrale = centrali.reduce((s, x) => s + x.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(8, Object.keys(file).length, true);
  e.setUint16(10, Object.keys(file).length, true);
  e.setUint32(12, lungCentrale, true);
  e.setUint32(16, offset, true);
  const parti = [...locali, ...centrali, new Uint8Array(e.buffer)];
  const out = new Uint8Array(parti.reduce((s, x) => s + x.length, 0));
  let p = 0;
  for (const x of parti) {
    out.set(x, p);
    p += x.length;
  }
  return out;
}

