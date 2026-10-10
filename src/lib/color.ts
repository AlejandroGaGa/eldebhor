export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mix(a: string, b: string, t: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Graffiti fill: highlight dots, a light-to-dark fade and a contrasting "underside" band. */
export function pieceFill(main: string, under: string) {
  return [
    "radial-gradient(circle at 28% 22%, rgba(255,255,255,.9) 0 3.5%, transparent 4.5%)",
    "radial-gradient(circle at 38% 30%, rgba(255,255,255,.7) 0 1.6%, transparent 2.4%)",
    "radial-gradient(circle at 66% 48%, rgba(255,255,255,.45) 0 2%, transparent 3%)",
    `linear-gradient(172deg, ${mix(main, "#ffffff", 0.65)} 0%, ${main} 26%, ${mix(main, "#000000", 0.3)} 56%, ${mix(main, "#000000", 0.45)} 63%, ${under} 64.5%, ${under} 76%, ${mix(under, "#000000", 0.45)} 100%)`,
  ].join(",");
}

export function depthShadow(color: string, steps: number, unit = 0.0085) {
  return Array.from({ length: steps }, (_, i) => `${((i + 1) * unit).toFixed(4)}em ${((i + 1) * unit * 1.25).toFixed(4)}em 0 ${color}`).join(",");
}
