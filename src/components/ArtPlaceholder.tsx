import type { Obra } from "@/data/obras";

const SURFACE: Record<Obra["tipo"], (bg: string) => React.CSSProperties> = {
  Muro: (bg) => ({
    backgroundColor: "#b8513f",
    backgroundImage: `radial-gradient(60% 55% at 50% 50%, ${bg} 55%, transparent 72%), var(--bricks)`,
    backgroundSize: "auto, 70px 32px",
  }),
  Lienzo: (bg) => ({
    backgroundColor: bg,
    backgroundImage:
      "radial-gradient(circle at 20% 25%, rgba(0,0,0,.35) 0 3%, transparent 4%), radial-gradient(circle at 78% 70%, rgba(255,255,255,.5) 0 5%, transparent 6%), radial-gradient(circle at 70% 18%, rgba(0,0,0,.25) 0 2%, transparent 3%), repeating-linear-gradient(45deg, rgba(0,0,0,.05) 0 2px, transparent 2px 5px)",
  }),
  Tren: (bg) => ({
    backgroundColor: "#c9ced6",
    backgroundImage: `radial-gradient(70% 45% at 50% 55%, ${bg} 60%, transparent 75%), repeating-linear-gradient(90deg, #d5d8dd 0 7px, #9fa4ab 7px 9px, #eef0f3 9px 15px)`,
  }),
  Boceto: (bg) => ({
    backgroundColor: bg,
    backgroundImage: "repeating-linear-gradient(180deg, transparent 0 22px, rgba(0,120,255,.18) 22px 23px), linear-gradient(90deg, transparent 10%, rgba(255,0,0,.25) 10% calc(10% + 1px), transparent 0)",
  }),
};

/** Pieza dibujada en código mientras no hay foto real. */
export default function ArtPlaceholder({ obra, big = false }: { obra: Obra; big?: boolean }) {
  const { texto, bg, fg } = obra.ph;
  const sketch = obra.tipo === "Boceto";
  return (
    <div className="absolute inset-0 overflow-hidden [container-type:inline-size]" style={SURFACE[obra.tipo](bg)}>
      <div className="absolute inset-0 flex items-center justify-center p-[6cqw]">
        <span
          className={`${sketch ? "font-marker" : "font-tag"} block -rotate-6 text-center leading-[0.85]`}
          style={{
            fontSize: texto.length > 7 ? "17cqw" : "26cqw",
            color: sketch ? "transparent" : fg,
            WebkitTextStroke: sketch ? `0.5cqw ${fg}` : "1.4cqw #0b0b0b",
            paintOrder: "stroke fill",
            textShadow: sketch ? undefined : "1.2cqw 1.4cqw 0 #0b0b0b",
          }}
        >
          {texto}
        </span>
      </div>
      <span className={`absolute bottom-2 left-2 rounded-sm bg-ink/85 px-1.5 py-0.5 font-mono text-bone ${big ? "text-sm" : "text-[11px]"}`}>
        imagen de ejemplo
      </span>
    </div>
  );
}
