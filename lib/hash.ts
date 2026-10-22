/** FNV-1a a 32 bit: stabile, senza dipendenze. Serve a derivare le tinte delle immagini dal seme. */
export function hashSeme(seme: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seme.length; i++) {
    h ^= seme.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
