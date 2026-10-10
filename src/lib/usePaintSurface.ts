"use client";

import { useEffect, useRef } from "react";
import { Painter } from "./spray";
import { store } from "./store";
import { sprayOff, sprayOn } from "./audio";

type Options = {
  /** radius of the spray cone in css px */
  radius?: () => number;
  /** allow painting with touch (blocks scroll inside the surface) */
  touch?: boolean;
  enabled?: () => boolean;
};

/**
 * Wires pointer input to a Painter. Holding still keeps spraying,
 * which floods the cell and makes the paint drip.
 */
export function usePaintSurface(canvasRef: React.RefObject<HTMLCanvasElement | null>, opts: Options = {}) {
  const painterRef = useRef<Painter | null>(null);
  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const painter = new Painter(canvas);
    painterRef.current = painter;

    let down = false;
    let last: [number, number] = [0, 0];
    let cur: [number, number] = [0, 0];
    let pressure = 1;
    let raf = 0;

    const pos = (e: PointerEvent): [number, number] => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const radius = () => optsRef.current.radius?.() ?? 26;
    const loop = () => {
      if (!down) return;
      const o = { color: store.get().color, radius: radius(), flow: pressure };
      if (cur[0] === last[0] && cur[1] === last[1]) painter.spray(cur[0], cur[1], { ...o, flow: pressure * 0.8 });
      else painter.stroke(last[0], last[1], cur[0], cur[1], o);
      last = cur;
      raf = requestAnimationFrame(loop);
    };

    const onDown = (e: PointerEvent) => {
      if (optsRef.current.enabled && !optsRef.current.enabled()) return;
      if (e.pointerType === "touch" && !optsRef.current.touch) return;
      if (e.button !== 0 && e.pointerType === "mouse") return;
      down = true;
      canvas.setPointerCapture(e.pointerId);
      last = cur = pos(e);
      pressure = e.pointerType === "pen" ? Math.max(0.3, e.pressure * 1.6) : 1;
      painter.spray(cur[0], cur[1], { color: store.get().color, radius: radius() });
      sprayOn();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      cur = pos(e);
      if (e.pointerType === "pen") pressure = Math.max(0.3, e.pressure * 1.6);
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      cancelAnimationFrame(raf);
      sprayOff();
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("lostpointercapture", onUp);

    const ro = new ResizeObserver(() => painter.resize());
    ro.observe(canvas);

    return () => {
      onUp();
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("lostpointercapture", onUp);
      painter.destroy();
      painterRef.current = null;
    };
  }, [canvasRef]);

  return painterRef;
}
