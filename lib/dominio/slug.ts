export const ALFABETO_SLUG = "23456789abcdefghjkmnpqrstuvwxyz";
export const LUNGHEZZA_SLUG = 10;

type FonteCasuale = (n: number) => Uint8Array;

function fonteCrittografica(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  globalThis.crypto.getRandomValues(buf);
  return buf;
}

/**
 * 10 caratteri da un alfabeto di 31 simboli (≈ 49,5 bit), da un generatore crittografico.
 * Campionamento per scarto per non introdurre distorsioni nell'indice.
 */
export function generaSlug(fonte: FonteCasuale = fonteCrittografica): string {
  const n = ALFABETO_SLUG.length;
  const limite = Math.floor(256 / n) * n;
  let out = "";
  while (out.length < LUNGHEZZA_SLUG) {
    for (const b of fonte(LUNGHEZZA_SLUG * 2)) {
      if (b < limite) out += ALFABETO_SLUG[b % n];
      if (out.length === LUNGHEZZA_SLUG) break;
    }
  }
  return out;
}

/** Genera uno slug non ancora in uso. `esiste` interroga il database. */
export async function generaSlugLibero(
  esiste: (slug: string) => Promise<boolean>,
  tentativi = 5,
): Promise<string> {
  for (let i = 0; i < tentativi; i++) {
    const slug = generaSlug();
    if (!(await esiste(slug))) return slug;
  }
  throw new Error("Non riesco a generare un link libero, riprova.");
}

export function slugValido(slug: string): boolean {
  return /^[a-z0-9]{3,32}$/.test(slug);
}
