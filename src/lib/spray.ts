"use client";

/**
 * Tiny aerosol simulation on a 2D canvas:
 *  - gaussian overspray particles + soft core
 *  - paint accumulates on a coarse grid; when a cell gets too wet it drips
 *  - drips run down, slow down, and end in a little bulb (like real paint)
 */

const TAU = Math.PI * 2;

export type SprayOpts = { color: string; radius: number; flow?: number };
type Drip = { x: number; y: number; vy: number; w: number; color: string; wob: number };
export type Pt = [number, number];

function gauss() {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
}

export class Painter {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  w = 0;
  h = 0;
  dpr = 1;
  drips: Drip[] = [];
  dripsEnabled = true;
  private cell = 16;
  private cols = 0;
  private rows = 0;
  private acc = new Float32Array(0);
  private raf = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.resize();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let snap: HTMLCanvasElement | null = null;
    if (this.w && this.h) {
      snap = document.createElement("canvas");
      snap.width = this.canvas.width;
      snap.height = this.canvas.height;
      snap.getContext("2d")!.drawImage(this.canvas, 0, 0);
    }
    const oldW = this.w;
    const oldH = this.h;
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    this.w = r.width;
    this.h = r.height;
    this.dpr = dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (snap) this.ctx.drawImage(snap, 0, 0, oldW, oldH);
    this.cols = Math.ceil(this.w / this.cell) + 1;
    this.rows = Math.ceil(this.h / this.cell) + 1;
    this.acc = new Float32Array(this.cols * this.rows);
  }

  spray(x: number, y: number, o: SprayOpts) {
    const { ctx } = this;
    const r = o.radius;
    const flow = o.flow ?? 1;
    ctx.fillStyle = o.color;
    ctx.globalAlpha = 0.05 * flow;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.6, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.14 * flow;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.28, 0, TAU);
    ctx.fill();
    const n = Math.floor(r * 2.4 * flow);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const d = Math.min(Math.abs(gauss()) * r * 0.42, r * 1.25);
      const s = Math.random() * 1.5 + 0.4;
      ctx.globalAlpha = 0.3 + Math.random() * 0.55;
      ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, s, s);
    }
    ctx.globalAlpha = 1;

    if (this.dripsEnabled) {
      const cx = Math.floor(x / this.cell);
      const cy = Math.floor(y / this.cell);
      if (cx >= 0 && cy >= 0 && cx < this.cols && cy < this.rows) {
        const idx = cy * this.cols + cx;
        this.acc[idx] += flow * (r > 22 ? 1.1 : 0.75);
        if (this.acc[idx] > 16) {
          if (Math.random() < 0.55) this.drip(x + gauss() * r * 0.2, y + r * 0.25, o.color, r > 22 ? 3 + Math.random() * 3 : 1.6 + Math.random() * 1.6);
          this.acc[idx] = 5;
        }
      }
    }
  }

  stroke(x0: number, y0: number, x1: number, y1: number, o: SprayOpts) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const step = Math.max(1.5, o.radius * 0.22);
    const n = Math.max(1, Math.ceil(dist / step));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      this.spray(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, { ...o, flow: (o.flow ?? 1) * 0.55 });
    }
  }

  drip(x: number, y: number, color: string, w: number) {
    this.drips.push({ x, y, vy: 1.2 + Math.random() * 2.2, w, color, wob: Math.random() * TAU });
    this.kick();
  }

  /** big splat with a ring of droplets and a few drips */
  splat(x: number, y: number, color: string, size = 60) {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    const spikes = 18;
    for (let i = 0; i <= spikes; i++) {
      const a = (i / spikes) * TAU;
      const rr = size * (0.55 + Math.random() * 0.5);
      const px = x + Math.cos(a) * rr;
      const py = y + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.quadraticCurveTo(x + Math.cos(a - 0.17) * size * 0.4, y + Math.sin(a - 0.17) * size * 0.4, px, py);
    }
    ctx.fill();
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * TAU;
      const d = size * (0.8 + Math.random() * 1.1);
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, Math.random() * size * 0.09 + 1, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const k = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < k; i++) this.drip(x + gauss() * size * 0.35, y + size * 0.3, color, 3 + Math.random() * 5);
  }

  private kick() {
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
  }

  private tick = () => {
    this.raf = 0;
    const { ctx } = this;
    ctx.lineCap = "round";
    for (let i = this.drips.length - 1; i >= 0; i--) {
      const d = this.drips[i];
      const ny = d.y + d.vy;
      d.wob += 0.15;
      const nx = d.x + Math.sin(d.wob) * 0.12;
      ctx.strokeStyle = d.color;
      ctx.globalAlpha = 0.96;
      ctx.lineWidth = d.w;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      d.x = nx;
      d.y = ny;
      d.vy *= 0.982;
      d.w *= 0.9985;
      if (d.vy < 0.09 || d.y > this.h + 4) {
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y + d.w * 0.3, d.w * 0.8, 0, TAU);
        ctx.fill();
        this.drips.splice(i, 1);
      }
    }
    ctx.globalAlpha = 1;
    if (this.drips.length) this.kick();
  };

  clear() {
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.drips = [];
    this.acc.fill(0);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.drips = [];
  }
}

/* ------------------------------------------------------------------ */
/* Ghost writer: paints along a path over time                         */
/* ------------------------------------------------------------------ */

export function animatePath(painter: Painter, pts: Pt[], o: SprayOpts, ms: number, signal?: { cancelled: boolean }) {
  return new Promise<void>((resolve) => {
    if (pts.length < 2) return resolve();
    const seg: number[] = [0];
    for (let i = 1; i < pts.length; i++) seg.push(seg[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = seg[seg.length - 1] || 1;
    let done = 0;
    let idx = 0;
    let last: Pt = pts[0];
    const t0 = performance.now();
    const pointAt = (L: number): Pt => {
      while (idx < seg.length - 2 && seg[idx + 1] < L) idx++;
      const a = pts[idx];
      const b = pts[idx + 1];
      const span = seg[idx + 1] - seg[idx] || 1;
      const t = Math.min(1, Math.max(0, (L - seg[idx]) / span));
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    };
    const frame = (now: number) => {
      if (signal?.cancelled) return resolve();
      const p = Math.min(1, (now - t0) / ms);
      const L = p * total;
      // walk in small sub steps so corners stay crisp
      while (done < L) {
        done = Math.min(L, done + 6);
        const q = pointAt(done);
        painter.stroke(last[0], last[1], q[0], q[1], o);
        last = q;
      }
      if (p < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}

/** zig-zag fill of a wobbly ellipse – the "background cloud" behind a piece */
export function blobFillPath(cx: number, cy: number, rx: number, ry: number, step: number): Pt[] {
  const pts: Pt[] = [];
  let dir = 1;
  for (let y = cy - ry; y <= cy + ry; y += step) {
    const k = 1 - ((y - cy) / ry) ** 2;
    if (k <= 0) continue;
    const half = rx * Math.sqrt(k) * (0.88 + Math.random() * 0.2);
    const xa = cx - half * dir;
    const xb = cx + half * dir;
    pts.push([xa, y], [xb, y + step * 0.5]);
    dir *= -1;
  }
  return pts;
}

export function ringPath(cx: number, cy: number, rx: number, ry: number, wobble = 0.08): Pt[] {
  const pts: Pt[] = [];
  const n = 90;
  const ph = Math.random() * TAU;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const w = 1 + Math.sin(a * 5 + ph) * wobble + Math.sin(a * 11) * wobble * 0.4;
    pts.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]);
  }
  return pts;
}

/* Single-stroke "handstyle" alphabet (0..1 box) used by the ghost writer */
const ellipse = (cx: number, cy: number, rx: number, ry: number, from = 0, to = TAU, n = 18): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / n;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as Pt;
  });

export const GLYPHS: Record<string, Pt[][]> = {
  E: [[[0.55, 0.02], [0.02, 0], [0, 1], [0.6, 1.02]], [[0.02, 0.5], [0.45, 0.48]]],
  L: [[[0.02, -0.05], [0, 1], [0.55, 1.02]]],
  D: [[[0, 0], [0, 1], ...ellipse(0.05, 0.5, 0.5, 0.5, Math.PI / 2, -Math.PI / 2, 14)]],
  B: [
    [[0, 1], [0, 0], ...ellipse(0.12, 0.25, 0.36, 0.25, -Math.PI / 2, Math.PI / 2, 10), [0, 0.5]],
    [[0.1, 0.5], ...ellipse(0.12, 0.75, 0.44, 0.25, -Math.PI / 2, Math.PI / 2, 10), [0, 1]],
  ],
  H: [[[0, -0.05], [0.02, 1.02]], [[0.52, -0.05], [0.5, 1.02]], [[-0.05, 0.52], [0.6, 0.46]]],
  O: [ellipse(0.28, 0.5, 0.3, 0.52, -Math.PI / 2, Math.PI * 1.6, 22)],
  R: [
    [[0, 1.02], [0, 0], ...ellipse(0.1, 0.25, 0.4, 0.25, -Math.PI / 2, Math.PI / 2, 10), [0, 0.5]],
    [[0.15, 0.5], [0.62, 1.05]],
  ],
  A: [[[0, 1.02], [0.28, -0.02], [0.56, 1.02]], [[0.1, 0.62], [0.46, 0.6]]],
  C: [ellipse(0.3, 0.5, 0.3, 0.52, -Math.PI * 0.25, -Math.PI * 1.75, 16)],
  F: [[[0.55, 0.02], [0.02, 0], [0, 1.02]], [[0.02, 0.5], [0.42, 0.48]]],
  G: [[...ellipse(0.3, 0.5, 0.3, 0.52, -Math.PI * 0.2, -Math.PI * 1.75, 16), [0.3, 0.55], [0.58, 0.55], [0.58, 0.8]]],
  I: [[[0.1, -0.02], [0.12, 1.02]], [[0, 0], [0.24, 0]], [[0, 1.02], [0.24, 1.02]]],
  J: [[[0.5, -0.02], [0.5, 0.8], ...ellipse(0.28, 0.8, 0.22, 0.22, 0, Math.PI * 0.85, 8)]],
  K: [[[0, -0.02], [0.02, 1.02]], [[0.55, 0], [0.04, 0.55]], [[0.2, 0.42], [0.6, 1.02]]],
  M: [[[0, 1.02], [0.02, 0], [0.34, 0.7], [0.66, 0], [0.68, 1.02]]],
  N: [[[0, 1.02], [0.02, 0], [0.54, 1.0], [0.56, -0.02]]],
  P: [[[0, 1.02], [0, 0], ...ellipse(0.1, 0.25, 0.4, 0.25, -Math.PI / 2, Math.PI / 2, 10), [0, 0.5]]],
  Q: [ellipse(0.28, 0.5, 0.3, 0.52, -Math.PI / 2, Math.PI * 1.6, 22), [[0.3, 0.7], [0.62, 1.08]]],
  S: [[[0.54, 0.1], ...ellipse(0.28, 0.25, 0.28, 0.25, -Math.PI * 0.2, -Math.PI * 1.5, 10), ...ellipse(0.28, 0.75, 0.28, 0.25, -Math.PI / 2, Math.PI * 0.8, 10)]],
  T: [[[-0.05, 0], [0.62, 0.02]], [[0.28, 0], [0.3, 1.02]]],
  U: [[[0, -0.02], [0.02, 0.7], ...ellipse(0.28, 0.7, 0.26, 0.3, Math.PI, 0, 10), [0.54, -0.02]]],
  V: [[[0, 0], [0.3, 1.02], [0.6, -0.02]]],
  W: [[[0, 0], [0.18, 1.02], [0.36, 0.3], [0.54, 1.02], [0.72, -0.02]]],
  X: [[[0, 0], [0.56, 1.02]], [[0.58, -0.02], [0.02, 1.0]]],
  Y: [[[0, 0], [0.28, 0.5], [0.58, -0.02]], [[0.28, 0.5], [0.3, 1.02]]],
  Z: [[[0, 0], [0.58, 0.02], [0, 1], [0.6, 1.02]]],
  "0": [ellipse(0.26, 0.5, 0.26, 0.52, -Math.PI / 2, Math.PI * 1.6, 20)],
  "1": [[[0.05, 0.2], [0.3, 0], [0.3, 1.02]]],
  "2": [[[0, 0.2], ...ellipse(0.27, 0.25, 0.27, 0.25, -Math.PI, 0.3, 10), [0, 1], [0.58, 1.02]]],
  "3": [[[0, 0.05], [0.5, 0], [0.2, 0.45], ...ellipse(0.25, 0.73, 0.3, 0.27, -Math.PI / 2, Math.PI * 0.8, 10)]],
  "4": [[[0.45, 1.02], [0.45, -0.02], [0, 0.65], [0.6, 0.65]]],
  "5": [[[0.5, 0], [0.05, 0.02], [0.02, 0.45], ...ellipse(0.26, 0.72, 0.28, 0.28, -Math.PI * 0.75, Math.PI * 0.8, 10)]],
  "6": [[[0.45, 0], [0.1, 0.45], [0, 0.75], ...ellipse(0.26, 0.74, 0.26, 0.28, Math.PI, Math.PI * 3.3, 14)]],
  "7": [[[0, 0], [0.58, 0.02], [0.2, 1.02]]],
  "8": [ellipse(0.26, 0.25, 0.22, 0.25, Math.PI / 2, Math.PI * 2.5, 12), ellipse(0.26, 0.75, 0.28, 0.27, -Math.PI / 2, Math.PI * 1.5, 14)],
  "9": [[...ellipse(0.28, 0.27, 0.26, 0.27, 0, TAU, 14), [0.52, 0.3], [0.4, 1.02]]],
};

/** Per-glyph advance (in scale units) so narrow/wide letters don't collide. */
const ADVANCE: Record<string, number> = { I: 0.4, J: 0.62, "1": 0.5, M: 0.88, W: 0.95, T: 0.68, V: 0.72, X: 0.7, Y: 0.7, K: 0.7, N: 0.7 };

/** Builds strokes for a word, slanted & wobbly like a quick handstyle. */
export function handstyle(word: string, x: number, y: number, size: number): Pt[][] {
  const strokes: Pt[][] = [];
  let cursor = x;
  const slant = 0.28;
  for (const ch of word.toUpperCase()) {
    const g = GLYPHS[ch];
    if (!g) {
      cursor += size * 0.4;
      continue;
    }
    const jitterY = (Math.random() - 0.5) * size * 0.18;
    const scale = size * (0.9 + Math.random() * 0.25);
    for (const s of g) {
      strokes.push(
        s.map(([gx, gy]) => [
          cursor + (gx + (1 - gy) * slant) * scale * 0.75 + (Math.random() - 0.5) * size * 0.03,
          y + jitterY + gy * scale + (Math.random() - 0.5) * size * 0.03,
        ]),
      );
    }
    cursor += scale * (ADVANCE[ch] ?? 0.62);
  }
  // underline swoosh with an arrow
  const end = cursor + size * 0.2;
  const by = y + size * 1.3;
  const sw: Pt[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    sw.push([x - size * 0.2 + (end - x + size * 0.2) * t, by + Math.sin(t * Math.PI) * size * 0.25 - t * size * 0.2]);
  }
  strokes.push(sw);
  const last = sw[sw.length - 1];
  strokes.push([[last[0] - size * 0.25, last[1] - size * 0.12], last, [last[0] - size * 0.18, last[1] + size * 0.2]]);
  return strokes;
}

export function crownPath(x: number, y: number, s: number): Pt[] {
  return [
    [x, y],
    [x - s * 0.1, y - s * 0.7],
    [x + s * 0.3, y - s * 0.3],
    [x + s * 0.5, y - s * 0.9],
    [x + s * 0.7, y - s * 0.3],
    [x + s * 1.1, y - s * 0.7],
    [x + s, y],
    [x, y],
  ];
}
