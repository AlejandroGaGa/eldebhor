import type { Producto } from "@/data/merch";

/** Flat drawings of each product, used while there is no real photo. */
export default function ProductArt({ p }: { p: Producto }) {
  const { color: c, tinta: t } = p;
  const s = { stroke: "#0b0b0b", strokeWidth: 5, strokeLinejoin: "round" as const };
  const tag = (x: number, y: number, size: number, txt = "eld") => (
    <text x={x} y={y} textAnchor="middle" fontFamily="var(--ff-tag)" fontSize={size} fill={t} stroke="#0b0b0b" strokeWidth="2" paintOrder="stroke" transform={`rotate(-8 ${x} ${y})`}>
      {txt}
    </text>
  );
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
      {p.forma === "playera" && (
        <>
          <path d="M60 30 L40 38 L12 70 L36 92 L50 80 L50 180 L150 180 L150 80 L164 92 L188 70 L160 38 L140 30 C132 46 68 46 60 30Z" fill={c} {...s} />
          {tag(100, 118, 54)}
        </>
      )}
      {p.forma === "sudadera" && (
        <>
          <path d="M62 34 L36 46 L14 120 L38 128 L50 92 L50 182 L150 182 L150 92 L162 128 L186 120 L164 46 L138 34 C130 6 70 6 62 34Z" fill={c} {...s} />
          <path d="M70 36 C76 58 124 58 130 36" fill="none" {...s} />
          <path d="M70 140 L130 140 L136 170 L64 170Z" fill="rgba(0,0,0,.15)" {...s} />
          <path d="M92 58 L90 84 M108 58 L110 84" stroke={t} strokeWidth="4" strokeLinecap="round" />
          {tag(100, 118, 40)}
        </>
      )}
      {p.forma === "gorra" && (
        <>
          <path d="M30 120 C30 60 170 60 170 120Z" fill={c} {...s} />
          <path d="M20 122 L180 122 C190 122 190 140 170 140 L40 140 C10 140 10 122 20 122Z" fill={c} {...s} />
          <circle cx="100" cy="62" r="7" fill={c} {...s} />
          <path d="M72 108 L66 82 L84 96 L100 74 L116 96 L134 82 L128 108Z" fill={t} {...s} strokeWidth={4} />
        </>
      )}
      {p.forma === "tote" && (
        <>
          <path d="M70 70 C70 20 130 20 130 70" fill="none" stroke="#0b0b0b" strokeWidth="9" />
          <path d="M70 70 C70 20 130 20 130 70" fill="none" stroke={c} strokeWidth="4" />
          <path d="M40 66 L160 66 L170 188 L30 188Z" fill={c} {...s} />
          <path d="M60 110 q10 30 0 60 M140 104 q-6 20 2 40" stroke={t} strokeWidth="6" strokeLinecap="round" fill="none" />
          {tag(100, 140, 44, "muro")}
        </>
      )}
      {p.forma === "stickers" && (
        <>
          <rect x="30" y="40" width="110" height="80" rx="10" fill="#fff" {...s} transform="rotate(-10 85 80)" />
          <rect x="34" y="40" width="102" height="22" fill="#e3122b" transform="rotate(-10 85 80)" />
          <circle cx="132" cy="120" r="44" fill={c} {...s} />
          <text x="132" y="132" textAnchor="middle" fontFamily="var(--ff-block)" fontSize="30" fill={t}>
            ELD
          </text>
          <path d="M40 150 l10 -22 l10 22 l24 2 l-18 16 l6 24 l-22 -12 l-22 12 l6 -24 l-18 -16Z" fill="#ffe600" {...s} strokeWidth={4} />
        </>
      )}
      {p.forma === "print" && (
        <>
          <rect x="34" y="18" width="132" height="168" fill="#f4f1ea" {...s} />
          <rect x="48" y="32" width="104" height="120" fill={c} stroke="#0b0b0b" strokeWidth="3" />
          {tag(100, 104, 40, "eldbh")}
          <text x="140" y="174" textAnchor="end" fontFamily="var(--ff-marker)" fontSize="12" fill="#0b0b0b">
            7/50
          </text>
        </>
      )}
    </svg>
  );
}
