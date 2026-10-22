/** L'indirizzo pubblico del sito, per costruire i link da condividere (solo browser). */
export function baseUrlClient(): string {
  const env = process.env.NEXT_PUBLIC_BASE_URL?.trim().replace(/^"|"$/g, "");
  const utile = env && env !== "INSERIRE" && !/localhost|127\.0\.0\.1/.test(env);
  if (utile) return env.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return env ? env.replace(/\/+$/, "") : "http://localhost:3000";
}
