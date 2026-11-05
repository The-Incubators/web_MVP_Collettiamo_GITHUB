/**
 * Il marchio Gifty della direzione A (docs/product/gifty/Gifty-UX-design-guidelines.md): il nastro arancio
 * (public/logo/gifty-nastro.svg) e la scritta «Gifty» in Urbanist verde. La scritta è testo, non immagine:
 * resta nitida a ogni misura. Il vecchio logo con la scatola (public/logo/gifty.png) resta nel repository.
 */
export function Logo({ className = "", priorita = false }: { className?: string; priorita?: boolean }) {
  return (
    <span className={`inline-flex h-8 items-center gap-1.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo/gifty-nastro.svg"
        alt=""
        width={68}
        height={48}
        decoding="async"
        loading={priorita ? "eager" : "lazy"}
        className="h-full w-auto"
      />
      <span className="font-display text-[28px] font-extrabold leading-none tracking-[-0.04em] text-accent">Gifty</span>
    </span>
  );
}
