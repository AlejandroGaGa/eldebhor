"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { store, useStore } from "@/lib/store";
import { useFinePointer, useReducedMotion } from "@/lib/scroll";

/** Cursor: cara del payasito + anillo con etiqueta de contexto + rastro de overspray. */
export default function Cursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const color = useStore((s) => s.color);
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const trail = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!fine) return;
    const r = ring.current!;
    const d = dot.current!;
    const lab = label.current!;
    const rx = gsap.quickTo(r, "x", { duration: 0.35, ease: "power3" });
    const ry = gsap.quickTo(r, "y", { duration: 0.35, ease: "power3" });
    const dx = gsap.quickTo(d, "x", { duration: 0.06 });
    const dy = gsap.quickTo(d, "y", { duration: 0.06 });
    let current = "";
    let visible = false;

    const canvas = trail.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener("resize", size);
    type P = { x: number; y: number; vx: number; vy: number; life: number; s: number; c: string };
    const parts: P[] = [];
    let raf = 0;
    let lx = 0;
    let ly = 0;
    const loop = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.life -= 0.022;
        if (p.life <= 0) {
          parts.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life * 0.8;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.s, p.s);
      }
      raf = parts.length ? requestAnimationFrame(loop) : 0;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!visible) {
        visible = true;
        gsap.set([r, d], { x: e.clientX, y: e.clientY });
        gsap.to([r, d], { autoAlpha: 1, duration: 0.2 });
      }
      rx(e.clientX);
      ry(e.clientY);
      dx(e.clientX);
      dy(e.clientY);
      const t = (e.target as Element | null)?.closest?.("[data-cursor]");
      const next = t?.getAttribute("data-cursor") ?? "";
      if (next !== current) {
        current = next;
        lab.textContent = next;
        gsap.to(r, { scale: next ? 2.3 : 1, duration: 0.35, ease: "back.out(2)" });
        gsap.to(lab, { autoAlpha: next ? 1 : 0, duration: 0.2 });
      }
      if (!reduced) {
        const speed = Math.hypot(e.clientX - lx, e.clientY - ly);
        lx = e.clientX;
        ly = e.clientY;
        const n = Math.min(6, 1 + Math.floor(speed / 8));
        const c = store.get().color;
        for (let i = 0; i < n; i++) {
          parts.push({
            x: e.clientX + (Math.random() - 0.5) * 14,
            y: e.clientY + (Math.random() - 0.5) * 14,
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2,
            life: 0.6 + Math.random() * 0.4,
            s: Math.random() * 2.5 + 0.8,
            c,
          });
        }
        if (parts.length > 400) parts.splice(0, parts.length - 400);
        if (!raf) raf = requestAnimationFrame(loop);
      }
    };
    let px = -1;
    let py = -1;
    const refresh = () => {
      if (px < 0) return;
      const t = document.elementFromPoint(px, py)?.closest("[data-cursor]");
      const next = t?.getAttribute("data-cursor") ?? "";
      if (next !== current) {
        current = next;
        lab.textContent = next;
        gsap.to(r, { scale: next ? 2.3 : 1, duration: 0.35, ease: "back.out(2)" });
        gsap.to(lab, { autoAlpha: next ? 1 : 0, duration: 0.2 });
      }
    };
    const track = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
    };
    window.addEventListener("pointermove", track, { passive: true });
    window.addEventListener("scroll", refresh, { passive: true });
    const onDown = () => gsap.to(d, { scale: 0.75, rotation: -14, duration: 0.12 });
    const onUp = () => gsap.to(d, { scale: 1, rotation: 0, duration: 0.4, ease: "elastic.out(1,0.4)" });
    const onLeave = () => {
      visible = false;
      gsap.to([r, d], { autoAlpha: 0, duration: 0.2 });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      window.removeEventListener("pointermove", track);
      window.removeEventListener("scroll", refresh);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [fine, reduced]);

  if (!fine) return null;

  return (
    <div aria-hidden="true">
      <canvas ref={trail} className="pointer-events-none fixed inset-0 z-[150] h-full w-full" />
      <div
        ref={ring}
        className="pointer-events-none invisible fixed left-0 top-0 z-[160] -ml-5 -mt-5 flex h-10 w-10 items-center justify-center rounded-full border-[3px] opacity-0"
        style={{ borderColor: color, boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000" }}
      >
        <span
          ref={label}
          className="invisible absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap rounded-sm px-1 font-block text-[7px] leading-none text-ink opacity-0"
          style={{ background: color }}
        />
      </div>
      <div ref={dot} className="pointer-events-none invisible fixed left-0 top-0 z-[161] -ml-[22px] -mt-7 h-14 w-[44px] opacity-0">
        <Image
          src="/stickers/payaso-arcoiris.webp"
          alt=""
          width={420}
          height={535}
          priority
          draggable={false}
          className="h-full w-full object-contain [filter:drop-shadow(2px_0_0_#fff)_drop-shadow(-2px_0_0_#fff)_drop-shadow(0_2px_0_#fff)_drop-shadow(0_-2px_0_#fff)]"
        />
      </div>
    </div>
  );
}
