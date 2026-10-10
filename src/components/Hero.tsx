"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { store, useStore } from "@/lib/store";
import { usePaintSurface } from "@/lib/usePaintSurface";
import { animatePath, blobFillPath, ringPath } from "@/lib/spray";
import { depthShadow, pieceFill } from "@/lib/color";
import { slap } from "@/lib/audio";
import { PALETTE } from "@/lib/palette";
import { useFinePointer, useReducedMotion } from "@/lib/scroll";

const WORD = "ELDEBHOR";
const FILLS = [
  ["#2ec6ee", "#241b51"],
  ["#45d2f5", "#241b51"],
  ["#2ec6ee", "#241b51"],
  ["#5adbf8", "#2d2266"],
  ["#2ec6ee", "#241b51"],
  ["#38cdf1", "#241b51"],
  ["#2ec6ee", "#2d2266"],
  ["#4fd6f6", "#241b51"],
];
const SPARKS = [
  { l: "8%", t: "18%", s: 46, d: 0 },
  { l: "30%", t: "8%", s: 30, d: 0.7 },
  { l: "56%", t: "14%", s: 52, d: 1.3 },
  { l: "88%", t: "22%", s: 36, d: 0.4 },
  { l: "74%", t: "78%", s: 28, d: 1.8 },
  { l: "18%", t: "82%", s: 34, d: 1.1 },
];

export default function Hero() {
  const entered = useStore((s) => s.entered);
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const sub = useRef<HTMLParagraphElement>(null);
  const painter = usePaintSurface(canvas, {
    radius: () => (window.innerWidth < 640 ? 18 : 30),
  });

  // Intro: ghost writer sprays the background cloud, then the letters land
  useGSAP(
    () => {
      if (!entered) return;
      const letters = gsap.utils.toArray<HTMLElement>(".tag-l", title.current);
      const extras = gsap.utils.toArray<HTMLElement>("[data-hero-extra]", section.current);
      if (reduced) {
        gsap.set([letters, extras, sub.current], { autoAlpha: 1 });
        return;
      }
      const signal = { cancelled: false };
      const p = painter.current;
      const tr = title.current!.getBoundingClientRect();
      const sr = section.current!.getBoundingClientRect();
      const cx = tr.left - sr.left + tr.width / 2;
      const cy = tr.top - sr.top + tr.height / 2;
      if (p) {
        const r = Math.max(22, tr.height * 0.12);
        void animatePath(p, blobFillPath(cx, cy, tr.width * 0.58, tr.height * 0.85, r * 0.9), { color: "#2ec6ee", radius: r }, 1100, signal).then(() =>
          animatePath(p, ringPath(cx, cy, tr.width * 0.6, tr.height * 0.9), { color: "#141414", radius: r * 0.5 }, 700, signal),
        );
      }
      const tl = gsap.timeline({ delay: 0.45 });
      tl.fromTo(
        letters,
        { autoAlpha: 0, scale: 2.8, y: () => gsap.utils.random(-200, -60), rotation: () => gsap.utils.random(-50, 50), filter: "blur(18px)" },
        {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          rotation: () => gsap.utils.random(-4, 4),
          filter: "blur(0px)",
          duration: 0.7,
          ease: "back.out(2.4)",
          stagger: 0.085,
          // a lingering blur(0px) keeps letters rasterized (blurry when scaled)
          clearProps: "filter",
        },
      )
        .add(() => {
          // paint drips fall off each letter onto the wall
          const pp = painter.current;
          if (!pp) return;
          letters.forEach((l, i) => {
            const r = l.getBoundingClientRect();
            const s = section.current!.getBoundingClientRect();
            const k = i % 3 === 0 ? 2 : 1;
            for (let j = 0; j < k; j++) pp.drip(r.left - s.left + r.width * gsap.utils.random(0.25, 0.75), r.bottom - s.top - r.height * 0.18, FILLS[i][0], gsap.utils.random(4, 9));
          });
        })
        .fromTo(extras, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, stagger: 0.06, duration: 0.5, ease: "back.out(3)" }, "-=0.2")
        .fromTo(sub.current, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5 }, "<");

      // scroll away: the piece just drifts up and fades a bit (no scaling).
      // Built after the intro ends with explicit start values, so a
      // ScrollTrigger refresh mid-intro can't capture intro transforms.
      tl.add(() => {
        gsap.fromTo(
          title.current!.parentElement,
          { y: 0, autoAlpha: 1 },
          {
            y: () => -window.innerHeight * 0.18,
            autoAlpha: 0.35,
            ease: "none",
            immediateRender: false,
            scrollTrigger: { trigger: section.current, start: "top top", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true },
          },
        );
      });
      return () => {
        signal.cancelled = true;
      };
    },
    { scope: section, dependencies: [entered, reduced] },
  );

  // Letters tilt in 3D toward the pointer and swell when it is close
  useEffect(() => {
    if (!fine || reduced || !entered) return;
    const sec = section.current!;
    const letters = gsap.utils.toArray<HTMLElement>(".tag-inner", title.current);
    // without perspective, rotateX/Y just squashes the letters flat
    gsap.set(letters, { transformPerspective: 700 });
    const qs = letters.map((l) => ({
      rx: gsap.quickTo(l, "rotationX", { duration: 0.6, ease: "power3" }),
      ry: gsap.quickTo(l, "rotationY", { duration: 0.6, ease: "power3" }),
      sx: gsap.quickTo(l, "scaleX", { duration: 0.5, ease: "power3" }),
      sy: gsap.quickTo(l, "scaleY", { duration: 0.5, ease: "power3" }),
    }));
    let centers: { x: number; y: number }[] = [];
    const measure = () => {
      centers = letters.map((l) => {
        const r = l.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
    };
    measure();
    const onMove = (e: PointerEvent) => {
      if (!centers.length) measure();
      const sy = window.scrollY;
      letters.forEach((_, i) => {
        const c = centers[i];
        const dx = (e.clientX - c.x) / window.innerWidth;
        const dy = (e.clientY - (c.y - sy + measuredScroll)) / window.innerHeight;
        qs[i].ry(gsap.utils.clamp(-16, 16, dx * 30));
        qs[i].rx(gsap.utils.clamp(-12, 12, -dy * 24));
        const dist = Math.hypot(dx * window.innerWidth, dy * window.innerHeight);
        const k = 1 + Math.max(0, 1 - dist / 260) * 0.06;
        qs[i].sx(k);
        qs[i].sy(k);
      });
    };
    let measuredScroll = window.scrollY;
    const remeasure = () => {
      measuredScroll = window.scrollY;
      measure();
    };
    const onLeave = () => qs.forEach((q) => (q.rx(0), q.ry(0), q.sx(1), q.sy(1)));
    sec.addEventListener("pointermove", onMove);
    sec.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", remeasure);
    const id = window.setTimeout(remeasure, 1800);
    return () => {
      window.clearTimeout(id);
      sec.removeEventListener("pointermove", onMove);
      sec.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", remeasure);
    };
  }, [fine, reduced, entered]);

  // Click a letter: it squashes, gets repainted with your color and splats the wall
  const hitLetter = (e: React.PointerEvent<HTMLSpanElement>) => {
    const el = e.currentTarget;
    const inner = el.querySelector<HTMLElement>(".tag-inner")!;
    const color = store.get().color;
    const under = PALETTE[Math.floor(Math.random() * PALETTE.length)].hex;
    inner.style.setProperty("--fill", pieceFill(color, under === color ? "#ff2e88" : under));
    slap(0.7);
    if (!reduced) {
      gsap.fromTo(inner, { scaleX: 1.35, scaleY: 0.6 }, { scaleX: 1, scaleY: 1, duration: 0.9, ease: "elastic.out(1.2,0.3)" });
    }
    const p = painter.current;
    const s = section.current!.getBoundingClientRect();
    const lr = el.getBoundingClientRect();
    // splat lands below/around the letter so it peeks out behind it
    if (p) p.splat(lr.left - s.left + lr.width * gsap.utils.random(0.1, 0.9), lr.bottom - s.top - lr.height * gsap.utils.random(0, 0.15), color, gsap.utils.random(55, 95));
  };

  return (
    <section
      ref={section}
      className="bricks relative isolate h-[100dvh] min-h-[560px] overflow-hidden"
      aria-labelledby="hero-title"
    >
      <canvas
        ref={canvas}
        className="absolute inset-0 h-full w-full touch-pan-y"
        data-cursor={fine ? "PINTA" : undefined}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,.55))]" aria-hidden="true" />

      {/* little handstyles around the wall */}
      <span aria-hidden="true" className="pointer-events-none absolute right-[6%] top-[14%] rotate-[-8deg] font-marker text-xl text-taxi opacity-90 sm:text-3xl" style={{ textShadow: "2px 2px 0 #000" }}>
        dbh &apos;26
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute bottom-[20%] left-[5%] rotate-[6deg] font-marker text-lg text-bone opacity-80 sm:text-2xl">
        x crew: nadie x
      </span>

      <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center px-2">
        <div className="relative">
          <h1
            id="hero-title"
            ref={title}
            aria-label="ELDEBHOR"
            className="tag flex select-none flex-wrap justify-center text-[30vw] sm:flex-nowrap sm:whitespace-nowrap sm:text-[clamp(3.6rem,19.5vw,16.5rem)]"
            style={{ filter: reduced || !fine ? undefined : "url(#boil)" }}
          >
            {WORD.split("").map((ch, i) => [
              i === 5 ? <span key="br" aria-hidden="true" className="basis-full sm:hidden" /> : null,
              <span
                key={i}
                aria-hidden="true"
                className="tag-l pointer-events-auto invisible"
                onPointerDown={(e) => e.pointerType === "mouse" && hitLetter(e)}
                onClick={(e) => {
                  // touch / pen tap
                  if ((e.nativeEvent as PointerEvent).pointerType !== "mouse") hitLetter(e as unknown as React.PointerEvent<HTMLSpanElement>);
                }}
                data-cursor="¡REVIENTA!"
              >
                <span
                  className="tag-inner relative block"
                  style={
                    {
                      "--fill": pieceFill(FILLS[i][0], FILLS[i][1]),
                      "--outer": "#241b51",
                      "--depth": depthShadow("#120b2e", 12),
                      "--depth-outer": depthShadow("#241b51", 14),
                    } as React.CSSProperties
                  }
                >
                  <span className="lo">{ch}</span>
                  <span className="ld">{ch}</span>
                  <span className="lf">{ch}</span>
                  <span className="lh">{ch}</span>
                </span>
              </span>,
            ])}
          </h1>

          {/* sparkles + crown + arrow */}
          {SPARKS.map((s, i) => (
            <svg
              key={i}
              data-hero-extra
              viewBox="0 0 40 40"
              width={s.s}
              height={s.s}
              aria-hidden="true"
              className="invisible absolute"
              style={{ left: s.l, top: s.t }}
            >
              <path
                className="twinkle"
                style={{ animationDelay: `${s.d}s`, transformOrigin: "20px 20px" }}
                d="M20 0 C22 14 26 18 40 20 C26 22 22 26 20 40 C18 26 14 22 0 20 C14 18 18 14 20 0Z"
                fill="#fff"
                stroke="#000"
                strokeWidth="2"
              />
            </svg>
          ))}
          <svg data-hero-extra viewBox="0 0 120 56" aria-hidden="true" className="invisible absolute -top-[17%] left-[34%] w-[15%] -rotate-3">
            <ellipse cx="60" cy="28" rx="50" ry="17" fill="none" stroke="#241b51" strokeWidth="15" />
            <ellipse cx="60" cy="28" rx="50" ry="17" fill="none" stroke="#2ec6ee" strokeWidth="7" />
          </svg>
          <svg data-hero-extra viewBox="0 0 200 90" aria-hidden="true" className="invisible absolute -bottom-[16%] right-[-4%] w-[22%] rotate-6">
            <path d="M6 60 C60 90 120 80 170 34" fill="none" stroke="#000" strokeWidth="20" strokeLinecap="round" />
            <path d="M6 60 C60 90 120 80 170 34" fill="none" stroke="#ffe600" strokeWidth="11" strokeLinecap="round" />
            <path d="M138 26 L184 20 L172 66 Z" fill="#ffe600" stroke="#000" strokeWidth="6" strokeLinejoin="round" />
          </svg>
        </div>

        <p
          ref={sub}
          className="invisible mt-6 max-w-[38ch] -rotate-2 text-center font-marker text-base leading-snug text-bone sm:mt-10 sm:text-xl"
          style={{ textShadow: "2px 2px 0 #000, 4px 4px 0 rgba(0,0,0,.4)" }}
        >
          «Hoy voy a comer con estos <span className="text-brand">20 varos</span>, porque todo mi dinero que tenía me lo gasté pintando y
          poniéndome bien pedote.»
          <span className="mt-3 block text-sm text-taxi sm:text-lg">
            — eldebhor · {fine ? "mantén el clic y pinta" : "baja y pinta el muro libre"}
          </span>
        </p>
      </div>

      <ScrollCue />
    </section>
  );
}

function ScrollCue() {
  return (
    <div className="pointer-events-none absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1" aria-hidden="true">
      <span className="rounded-sm bg-ink px-2 py-1 font-mono text-sm uppercase tracking-[0.25em] text-bone">Baja</span>
      <svg width="28" height="56" viewBox="0 0 28 56" className="wobble">
        <path d="M14 2 V44" stroke="#ffe600" strokeWidth="6" strokeLinecap="round" />
        <path d="M3 34 L14 50 L25 34" fill="none" stroke="#ffe600" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
