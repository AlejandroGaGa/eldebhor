"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type MatterNS from "matter-js";
import { store, useStore } from "@/lib/store";
import { slap, blip } from "@/lib/audio";
import { Gotita } from "./Train";
import Image from "next/image";
import { hexToRgb } from "@/lib/color";

type Kind = "hello" | "eld" | "nobuff" | "eye" | "tape" | "burst" | "gotita" | "pinta" | "crown" | "color" | "veinte" | "payaso" | "logo";
type Spec = { id: number; kind: Kind; color: string };

const SHAPES: Record<Kind, { w: number; h: number; circle?: boolean }> = {
  hello: { w: 230, h: 150 },
  eld: { w: 130, h: 130, circle: true },
  nobuff: { w: 120, h: 120, circle: true },
  eye: { w: 110, h: 110, circle: true },
  tape: { w: 270, h: 58 },
  burst: { w: 150, h: 150, circle: true },
  gotita: { w: 100, h: 132 },
  pinta: { w: 210, h: 92 },
  crown: { w: 140, h: 96 },
  color: { w: 180, h: 110 },
  veinte: { w: 124, h: 124, circle: true },
  payaso: { w: 112, h: 142 },
  logo: { w: 210, h: 160 },
};

const INITIAL: Kind[] = ["logo", "veinte", "payaso", "hello", "eld", "nobuff", "payaso", "eye", "tape", "burst", "gotita", "logo", "pinta", "crown", "color", "eld", "eye", "burst"];
const RANDOM: Kind[] = ["veinte", "eld", "nobuff", "eye", "burst", "gotita", "crown", "color", "pinta", "hello", "tape", "payaso", "payaso", "logo"];

let uid = 0;

export default function StickerBomb() {
  const color = useStore((s) => s.color);
  const [specs, setSpecs] = useState<Spec[]>(() => INITIAL.map((kind) => ({ id: uid++, kind, color: "#2ec6ee" })));
  const specsRef = useRef(specs);
  useEffect(() => {
    specsRef.current = specs;
  });
  const section = useRef<HTMLElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const els = useRef(new Map<number, HTMLDivElement>());
  const physics = useRef<{
    M: typeof MatterNS;
    engine: MatterNS.Engine;
    bodies: Map<number, MatterNS.Body>;
    scale: number;
    started: boolean;
    spawn: (s: Spec, i: number) => void;
  } | null>(null);

  // boot physics lazily (matter-js only loads when you get close)
  useEffect(() => {
    const host = area.current!;
    let raf = 0;
    let running = false;
    let destroyed = false;
    let cleanup = () => {};

    const boot = async () => {
      const M = (await import("matter-js")).default;
      if (destroyed) return;
      const engine = M.Engine.create({ gravity: { x: 0, y: 1.15, scale: 0.001 } });
      const bodies = new Map<number, MatterNS.Body>();
      let walls: MatterNS.Body[] = [];
      const scale = () => Math.min(1, Math.max(0.62, host.clientWidth / 1300));

      const buildWalls = () => {
        if (walls.length) M.Composite.remove(engine.world, walls);
        const w = host.clientWidth;
        const h = host.clientHeight;
        const t = 200;
        walls = [
          M.Bodies.rectangle(w / 2, h + t / 2, w * 3, t, { isStatic: true }),
          M.Bodies.rectangle(-t / 2, h / 2 - 1000, t, h * 4, { isStatic: true }),
          M.Bodies.rectangle(w + t / 2, h / 2 - 1000, t, h * 4, { isStatic: true }),
        ];
        M.Composite.add(engine.world, walls);
      };
      buildWalls();

      const spawn = (s: Spec, i: number) => {
        if (bodies.has(s.id)) return;
        const sc = physics.current?.scale ?? scale();
        const sh = SHAPES[s.kind];
        const x = 80 + Math.random() * (host.clientWidth - 160);
        const y = -120 - i * 90;
        const opts = { restitution: 0.35, friction: 0.6, frictionAir: 0.012, chamfer: sh.circle ? undefined : { radius: 10 * sc }, angle: (Math.random() - 0.5) * 1.2 };
        const b = sh.circle ? M.Bodies.circle(x, y, (sh.w / 2) * sc, opts) : M.Bodies.rectangle(x, y, sh.w * sc, sh.h * sc, opts);
        bodies.set(s.id, b);
        M.Composite.add(engine.world, b);
      };

      physics.current = { M, engine, bodies, scale: scale(), started: false, spawn };

      let lastHit = 0;
      M.Events.on(engine, "collisionStart", (ev) => {
        const now = performance.now();
        for (const p of ev.pairs) {
          const sp = Math.max(p.bodyA.speed, p.bodyB.speed);
          if (sp > 7 && now - lastHit > 70) {
            lastHit = now;
            slap(Math.min(0.15 + sp / 40, 0.6));
          }
        }
      });

      const render = () => {
        M.Engine.update(engine, 1000 / 60);
        const sc = physics.current!.scale;
        bodies.forEach((b, id) => {
          const el = els.current.get(id);
          if (!el) return;
          const sh = el.dataset.kind ? SHAPES[el.dataset.kind as Kind] : null;
          if (!sh) return;
          el.style.transform = `translate(${b.position.x - sh.w / 2}px, ${b.position.y - sh.h / 2}px) rotate(${b.angle}rad) scale(${sc})`;
        });
        raf = running ? requestAnimationFrame(render) : 0;
      };

      const io = new IntersectionObserver(
        ([e]) => {
          running = e.isIntersecting;
          if (running && !physics.current!.started) {
            physics.current!.started = true;
            specsRef.current.forEach((s, i) => spawn(s, i));
          }
          if (running && !raf) raf = requestAnimationFrame(render);
        },
        { threshold: 0.25 },
      );
      io.observe(host);

      const ro = new ResizeObserver(() => {
        physics.current!.scale = scale();
        buildWalls();
      });
      ro.observe(host);

      cleanup = () => {
        io.disconnect();
        ro.disconnect();
        cancelAnimationFrame(raf);
        M.Engine.clear(engine);
      };
    };
    void boot();
    return () => {
      destroyed = true;
      cleanup();
    };
  }, []);

  // spawn bodies for stickers added later
  useEffect(() => {
    const ph = physics.current;
    if (!ph?.started) return;
    specs.forEach((s, i) => ph.spawn(s, i % 6));
  }, [specs]);

  // drag & throw with a spring constraint
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, id: number) => {
    const ph = physics.current;
    const body = ph?.bodies.get(id);
    if (!ph || !body) return;
    const { M, engine } = ph;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const r = area.current!.getBoundingClientRect();
    const p = { x: e.clientX - r.left, y: e.clientY - r.top };
    const c = M.Constraint.create({
      pointA: p,
      bodyB: body,
      pointB: { x: p.x - body.position.x, y: p.y - body.position.y },
      stiffness: 0.18,
      damping: 0.08,
      length: 0,
    });
    M.Composite.add(engine.world, c);
    blip(660);
    el.style.zIndex = "5";
    const move = (ev: PointerEvent) => {
      c.pointA = { x: ev.clientX - r.left, y: ev.clientY - r.top };
    };
    const up = () => {
      M.Composite.remove(engine.world, c);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.style.zIndex = "";
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  }, []);

  const shakeWall = () => {
    const ph = physics.current;
    if (!ph) return;
    slap(0.7);
    ph.bodies.forEach((b) => {
      ph.M.Body.setVelocity(b, { x: (Math.random() - 0.5) * 30, y: -14 - Math.random() * 18 });
      ph.M.Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.5);
    });
  };

  const more = () => {
    const c = store.get().color;
    blip(880);
    setSpecs((cur) => {
      const add = Array.from({ length: 5 }, () => ({ id: uid++, kind: RANDOM[Math.floor(Math.random() * RANDOM.length)], color: c }));
      const next = [...cur, ...add];
      // keep the DOM sane: drop the oldest when there are too many
      const overflow = next.length - 45;
      if (overflow > 0) {
        const ph = physics.current;
        next.slice(0, overflow).forEach((s) => {
          const b = ph?.bodies.get(s.id);
          if (ph && b) {
            ph.M.Composite.remove(ph.engine.world, b);
            ph.bodies.delete(s.id);
          }
        });
        return next.slice(overflow);
      }
      return next;
    });
  };

  return (
    <section ref={section} className="concrete-light relative h-[100dvh] min-h-[640px] overflow-hidden" aria-labelledby="stickers-title">
      <Posters />
      <div className="relative z-20 m-4 inline-block max-w-md -rotate-1 bg-ink p-5 shadow-[8px_8px_0_#000] sm:m-10">
        <h2 id="stickers-title" className="font-wet text-5xl leading-none text-bubble sm:text-6xl">
          Sticker bomb
        </h2>
        <p className="mt-3 text-base leading-relaxed text-bone">
          Agarra los stickers, avientalos, apílalos. Los nuevos salen con tu color de lata actual.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={more}
            data-cursor="+5"
            className="min-h-[48px] border-4 border-black px-4 py-2 font-block text-base text-ink shadow-[4px_4px_0_#000] transition-transform hover:-rotate-2 active:scale-95"
            style={{ background: color }}
          >
            Más stickers
          </button>
          <button
            type="button"
            onClick={shakeWall}
            data-cursor="BOOM"
            className="min-h-[48px] border-4 border-black bg-bone px-4 py-2 font-block text-base text-ink shadow-[4px_4px_0_#000] transition-transform hover:rotate-2 active:scale-95"
          >
            Sacudir pared
          </button>
        </div>
      </div>
      <div ref={area} className="absolute inset-0 z-10" aria-hidden="true">
        {specs.map((s) => (
          <div
            key={s.id}
            ref={(el) => {
              if (el) els.current.set(s.id, el);
              else els.current.delete(s.id);
            }}
            data-kind={s.kind}
            data-cursor="ARRASTRA"
            onPointerDown={(e) => onPointerDown(e, s.id)}
            className="absolute left-0 top-0 origin-center touch-none select-none will-change-transform"
            style={{ width: SHAPES[s.kind].w, height: SHAPES[s.kind].h, transform: "translate(-9999px,-9999px)", transformOrigin: "50% 50%" }}
          >
            <Sticker kind={s.kind} color={s.color} />
          </div>
        ))}
      </div>
    </section>
  );
}

function readable(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  return r * 0.299 + g * 0.587 + b * 0.114 > 140 ? "#121110" : "#f4f1ea";
}

function Sticker({ kind, color }: { kind: Kind; color: string }) {
  const base = "h-full w-full border-[5px] border-black shadow-[5px_5px_0_rgba(0,0,0,.5)]";
  switch (kind) {
    case "hello":
      return (
        <div className={`${base} flex flex-col overflow-hidden rounded-xl bg-white`}>
          <div className="bg-[#e3122b] px-2 pb-1 pt-2 text-center leading-none text-white">
            <div className="font-block text-3xl">HELLO</div>
            <div className="font-mono text-xs font-bold uppercase">my name is</div>
          </div>
          <div className="flex flex-1 items-center justify-center font-tag text-5xl text-black">eldebhor</div>
        </div>
      );
    case "eld":
      return (
        <div className={`${base} flex items-center justify-center rounded-full font-block text-4xl`} style={{ background: color, color: readable(color) }}>
          ELD
        </div>
      );
    case "nobuff":
      return (
        <div className={`${base} relative flex items-center justify-center rounded-full bg-white font-block text-xl text-black`}>
          BUFF
          <div className="absolute inset-2 rounded-full border-[8px] border-[#e3122b]" />
          <div className="absolute left-1/2 top-1/2 h-[8px] w-[85%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-[#e3122b]" />
        </div>
      );
    case "eye":
      return (
        <div className={`${base} relative flex items-center justify-center rounded-full bg-white`}>
          <div className="h-[48%] w-[48%] rounded-full border-4 border-black" style={{ background: color }}>
            <div className="ml-[30%] mt-[30%] h-1/2 w-1/2 rounded-full bg-black" />
          </div>
        </div>
      );
    case "tape":
      return (
        <div className={`${base} flex items-center justify-center bg-taxi font-block text-xl text-black`}>✦ CREW: NINGUNA ✦</div>
      );
    case "burst":
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[4px_4px_0_rgba(0,0,0,.5)]">
          <path
            d={Array.from({ length: 28 }, (_, i) => {
              const a = (i / 28) * Math.PI * 2;
              const r = i % 2 ? 36 : 48;
              return `${i ? "L" : "M"}${(50 + Math.cos(a) * r).toFixed(1)} ${(50 + Math.sin(a) * r).toFixed(1)}`;
            }).join(" ") + "Z"}
            fill={color === "#2ec6ee" ? "#ff2e88" : color}
            stroke="#000"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <text x="50" y="47" textAnchor="middle" fontFamily="var(--ff-block)" fontSize="15" fill="#000">
            100%
          </text>
          <text x="50" y="63" textAnchor="middle" fontFamily="var(--ff-block)" fontSize="11" fill="#000">
            A MANO
          </text>
        </svg>
      );
    case "gotita":
      return <Gotita className="h-full w-full drop-shadow-[4px_4px_0_rgba(0,0,0,.5)]" />;
    case "pinta":
      return (
        <div className={`${base} flex items-center justify-center rounded-md bg-black font-wet text-4xl`} style={{ color: color === "#141414" ? "#2ec6ee" : color }}>
          PINTA O NADA
        </div>
      );
    case "crown":
      return (
        <svg viewBox="0 0 140 96" className="h-full w-full drop-shadow-[4px_4px_0_rgba(0,0,0,.5)]">
          <path d="M10 88 L4 18 L42 52 L70 6 L98 52 L136 18 L130 88 Z" fill="#ffe600" stroke="#000" strokeWidth="6" strokeLinejoin="round" />
          <circle cx="70" cy="62" r="10" fill="#ff2e88" stroke="#000" strokeWidth="4" />
        </svg>
      );
    case "veinte":
      return (
        <div
          className="flex h-full w-full flex-col items-center justify-center rounded-full border-[5px] border-black text-ink shadow-[5px_5px_0_rgba(0,0,0,.5)]"
          style={{ background: "radial-gradient(circle, #e7c35a 0 55%, #c9ced6 56% 100%)" }}
        >
          <span className="font-block text-4xl leading-none">$20</span>
          <span className="font-mono text-[11px] font-bold uppercase">para comer</span>
        </div>
      );
    case "payaso":
      return <Image src="/stickers/payaso-arcoiris.png" alt="" width={420} height={535} draggable={false} className="h-full w-full object-contain [filter:drop-shadow(3px_0_0_#fff)_drop-shadow(-3px_0_0_#fff)_drop-shadow(0_3px_0_#fff)_drop-shadow(0_-3px_0_#fff)_drop-shadow(5px_6px_0_rgba(0,0,0,.5))]" />;
    case "logo":
      return <Image src="/brand/logo-tag.png" alt="" width={880} height={669} draggable={false} className="h-full w-full object-contain [filter:drop-shadow(3px_0_0_#fff)_drop-shadow(-3px_0_0_#fff)_drop-shadow(0_3px_0_#fff)_drop-shadow(0_-3px_0_#fff)_drop-shadow(5px_6px_0_rgba(0,0,0,.5))]" />;
    case "color":
      return (
        <div className={`${base} flex flex-col items-center justify-center rounded-2xl`} style={{ background: color, color: readable(color) }}>
          <span className="font-tag text-4xl leading-none">tu color</span>
          <span className="font-mono text-sm font-bold">{color.toUpperCase()}</span>
        </div>
      );
  }
}

function Posters() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="torn absolute right-[6%] top-[8%] w-56 rotate-3 bg-[#f1e9d2] p-5 text-ink shadow-xl sm:w-72">
        <p className="font-block text-3xl leading-none">SE BUSCA</p>
        <p className="mt-2 font-mono text-sm font-bold">PARED LIBRE, GRIS, ABURRIDA. RECOMPENSA: COLOR.</p>
      </div>
      <div className="torn absolute left-[38%] top-[30%] hidden w-64 -rotate-2 bg-[#ff6a00] p-5 text-ink shadow-xl md:block">
        <p className="font-tag text-5xl leading-none">clases de letras</p>
        <p className="mt-2 font-mono text-sm font-bold">MARTES 3 AM · TRAER LATA</p>
      </div>
      <div className="torn absolute bottom-[34%] left-[6%] hidden w-60 rotate-[-6deg] bg-[#00c2ff] p-5 text-ink shadow-xl sm:block">
        <p className="font-spray text-4xl leading-none">NO FIJAR CARTELES</p>
      </div>
      <div className="torn absolute right-[20%] top-[46%] w-56 rotate-6 bg-ink p-5 text-bone shadow-xl">
        <p className="font-mono text-sm font-bold text-taxi">HOY · EN VIVO</p>
        <p className="font-wet text-4xl leading-none">ELDEBHOR</p>
        <p className="font-mono text-sm">en todas partes</p>
      </div>
    </div>
  );
}
