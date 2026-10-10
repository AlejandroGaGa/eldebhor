"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { getLenis } from "@/lib/scroll";
import { OBRAS } from "@/data/obras";

const WINDOWS = ["4%", "35%", "53%", "84%"];
const DOORS = ["20%", "69%"];
const WHEELS = ["7%", "18%", "73%", "84%"];
const FRONT_WHEELS = ["12%", "30%", "62%", "80%"];

export default function Train() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const lights = useRef<HTMLDivElement>(null);
  const streaks = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tr = track.current!;
        const dist = () => tr.scrollWidth - window.innerWidth;
        const spin = gsap.quickSetter(tr, "--spin");
        const tween = gsap.to(tr, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            pin: true,
            scrub: 0.8,
            start: "top top",
            end: () => "+=" + dist() * 1.1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              spin(`${self.progress * 360 * 14}deg`);
              gsap.set(lights.current, { xPercent: -self.progress * 45 });
            },
          },
        });

        gsap.utils.toArray<HTMLElement>("[data-piece]", tr).forEach((p) => {
          gsap.fromTo(
            p,
            { clipPath: "inset(0% 100% 0% 0%)", filter: "blur(10px) saturate(0)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              filter: "blur(0px) saturate(1)",
              ease: "none",
              scrollTrigger: { trigger: p, containerAnimation: tween, start: "left 92%", end: "center 55%", scrub: true },
            },
          );
        });

        // speed streaks follow scroll velocity
        const op = gsap.quickTo(streaks.current, "opacity", { duration: 0.3 });
        const tick = () => {
          op(Math.min(Math.abs(getLenis()?.velocity ?? 0) / 30, 0.8));
        };
        gsap.ticker.add(tick);
        return () => gsap.ticker.remove(tick);
      });
    },
    { scope: section },
  );

  return (
    <section ref={section} className="relative overflow-hidden bg-[#0b0b0c]" aria-labelledby="train-title">
      <div className="relative flex h-[100dvh] min-h-[560px] flex-col justify-center">
        {/* tunnel */}
        <div ref={lights} className="pointer-events-none absolute inset-y-0 left-0 w-[400%]" aria-hidden="true">
          <div
            className="absolute inset-x-0 top-[12%] h-3"
            style={{ background: "repeating-linear-gradient(90deg, #ffd27a 0 140px, transparent 140px 520px)", boxShadow: "0 0 40px 10px rgba(255,190,90,.25)", filter: "blur(1px)" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "repeating-linear-gradient(90deg, transparent 0 380px, rgba(255,255,255,.04) 380px 440px, transparent 440px 760px)" }}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(255,180,80,.10),transparent_60%)]" aria-hidden="true" />
        <div
          ref={streaks}
          className="pointer-events-none absolute inset-0 z-20 opacity-0"
          aria-hidden="true"
          style={{
            background:
              "repeating-linear-gradient(180deg, transparent 0 37px, rgba(255,255,255,.18) 37px 38px, transparent 38px 91px, rgba(255,255,255,.1) 91px 93px)",
            mixBlendMode: "screen",
          }}
        />

        {/* station sign */}
        <div className="relative z-10 mx-4 mb-8 self-start sm:mx-10">
          <h2
            id="train-title"
            className="flicker inline-block rounded-md border-4 border-[#333] bg-black px-4 py-3 font-mono text-base font-bold uppercase tracking-[0.2em] text-[#ffb000] sm:text-xl"
            style={{
              textShadow: "0 0 8px rgba(255,176,0,.8)",
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,.06) 1px, transparent 1.5px)",
              backgroundSize: "5px 5px",
            }}
          >
            Línea 3 ▸ dirección: tu pared
          </h2>
          <p className="mt-3 max-w-md text-base text-bone/85">Sigue bajando: el tren pasa pintado de punta a punta.</p>
        </div>

        {/* the train */}
        <div className="relative z-10 motion-reduce:overflow-x-auto motion-reduce:pb-6">
          <div ref={track} className="flex w-max items-end gap-3 pl-[100vw] pr-[30vw] motion-reduce:pl-4 motion-reduce:pr-4">
            <Wagon front>
              <Image
                src="/brand/logo-tag.png"
                alt=""
                width={880}
                height={669}
                sizes="260px"
                className="absolute bottom-[12%] left-[40%] h-auto w-[30%] -rotate-3 drop-shadow-[3px_3px_0_rgba(0,0,0,.35)]"
              />
            </Wagon>
            <Wagon number="2026">
              <Panels ids={["verde-morado", "tag-cian", "wildstyle-cian-rojo"]} />
            </Wagon>
            <Wagon number="3417">
              <Panels ids={["burbuja-blanco-negro", "tag-humo", "gorila-vs-dino"]} />
            </Wagon>
            <Wagon number="0303">
              <Panels ids={["burbuja-blanca", "tag-cian", "verde-morado"]} />
            </Wagon>
            <Wagon number="9999">
              <PieceEnd />
            </Wagon>
          </div>
          {/* rails */}
          <div className="absolute inset-x-0 -bottom-6 h-3 bg-[#3a3a3a] shadow-[0_6px_0_#1a1a1a]" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

function Wagon({ children, number, front }: { children?: React.ReactNode; number?: string; front?: boolean }) {
  return (
    <div
      className="wagon [container-type:inline-size]"
      style={front ? { borderRadius: "140px 22px 8px 30px", width: "clamp(372px, 49.2vw, 690px)", aspectRatio: "1.47 / 1" } : undefined}
      aria-hidden={front ? true : undefined}
    >
      {front ? (
        <>
          <div className="wagon-window" style={{ left: "8%", width: "40%", height: "30%", borderRadius: "90px 12px 12px 12px" }} />
          <div className="wagon-window" style={{ left: "74%", width: "18%" }} />
          <div
            className="absolute left-[10%] top-[44%] rounded-sm bg-black px-2 py-1 font-mono text-[4cqw] font-bold text-[#ffb000]"
            style={{ textShadow: "0 0 6px #ffb000" }}
          >
            3 ▸ TU PARED
          </div>
          <div className="absolute bottom-[20%] left-[3%] h-[8%] w-[12%] rounded-full bg-[#fff6c8] shadow-[0_0_40px_14px_rgba(255,240,170,.7)]" />
          <div className="wagon-door" style={{ left: "56%", width: "15%" }} />
        </>
      ) : (
        <>
          {WINDOWS.map((l) => (
            <div key={l} className="wagon-window" style={{ left: l }} />
          ))}
          {DOORS.map((l) => (
            <div key={l} className="wagon-door" style={{ left: l }} />
          ))}
          <span className="absolute right-[3%] top-[2%] font-mono text-[1.6cqw] font-bold text-[#333]">N° {number}</span>
        </>
      )}
      {children}
      {(front ? FRONT_WHEELS : WHEELS).map((l) => (
        <div key={l} className="wheel" style={{ left: l, width: front ? "15%" : undefined }} />
      ))}
    </div>
  );
}

const pieceBox = "absolute inset-x-[3%] top-[37%] bottom-[11%]";

/** Relación de aspecto de cada foto (ancho / alto) para que el tablero no recorte la obra. */
const RATIO: Record<string, number> = {
  "verde-morado": 1080 / 607,
  "gorila-vs-dino": 739 / 949,
  "burbuja-blanca": 1200 / 1600,
  "tag-cian": 1,
  "tag-humo": 1,
  "burbuja-blanco-negro": 718 / 478,
  "wildstyle-cian-rojo": 512 / 733,
};
const TILT = ["-rotate-2", "rotate-1", "-rotate-1"];

/** Fotos de las obras de ELDEBHOR pegadas sobre el costado del vagón. */
function Panels({ ids }: { ids: string[] }) {
  const obras = ids.map((id) => OBRAS.find((o) => o.id === id)).filter((o): o is NonNullable<typeof o> => !!o?.imagen);
  return (
    <figure data-piece className={pieceBox}>
      <div className="flex h-full items-center justify-evenly gap-[1.5cqw]">
        {obras.map((o, i) => (
          <div
            key={`${o.id}-${i}`}
            className={`relative h-full overflow-hidden border-[0.6cqw] border-black bg-black shadow-[0.8cqw_0.8cqw_0_rgba(0,0,0,.45)] ${TILT[i % TILT.length]}`}
            style={{ aspectRatio: RATIO[o.id] ?? 1 }}
          >
            <Image src={o.imagen!} alt={o.alt ?? o.titulo} fill sizes="(min-width: 768px) 420px, 300px" className="object-cover" />
          </div>
        ))}
      </div>
    </figure>
  );
}

function PieceEnd() {
  return (
    <figure data-piece className={pieceBox}>
      <div className="absolute inset-[6%] -rotate-2 rounded-[30%] bg-[#9b5cff]" style={{ filter: "blur(4px)" }} />
      <div className="relative flex h-full items-center justify-center">
        <Image
          src="/brand/logo-tag.png"
          alt="Tag dhebor en cian con contorno azul marino"
          width={880}
          height={669}
          sizes="(min-width: 768px) 360px, 260px"
          className="h-[120%] w-auto drop-shadow-[0.6cqw_0.6cqw_0_rgba(0,0,0,.5)]"
        />
      </div>
    </figure>
  );
}

/** Original character: a one-eyed paint drop. */
export function Gotita({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 160" className={className} aria-hidden="true">
      <path d="M60 6 C80 46 112 70 112 104 C112 136 88 156 60 156 C32 156 8 136 8 104 C8 70 40 46 60 6Z" fill="#ff2e88" stroke="#000" strokeWidth="6" />
      <path d="M24 100 C24 80 36 64 48 52" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" opacity=".7" />
      <circle cx="62" cy="96" r="24" fill="#fff" stroke="#000" strokeWidth="5" />
      <circle cx="68" cy="100" r="11" fill="#000" />
      <circle cx="72" cy="95" r="4" fill="#fff" />
      <path d="M40 128 Q62 144 86 124" fill="#000" stroke="#000" strokeWidth="5" strokeLinecap="round" />
      <path d="M58 134 Q64 152 74 132" fill="#00c2ff" stroke="#000" strokeWidth="4" />
      <path d="M100 120 q4 18 0 28" stroke="#ff2e88" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}
