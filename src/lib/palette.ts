export const PALETTE = [
  { name: "Cian tag", hex: "#2ec6ee" },
  { name: "Chicle", hex: "#ff2e88" },
  { name: "Ácido", hex: "#b6ff00" },
  { name: "Taxi", hex: "#ffe600" },
  { name: "Naranja", hex: "#ff6a00" },
  { name: "Uva", hex: "#9b5cff" },
  { name: "Hueso", hex: "#f4f1ea" },
  { name: "Carbón", hex: "#141414" },
] as const;

/** Deterministic PRNG so server and client render the same "random" decoration. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(arr: readonly T[], r: () => number = Math.random): T {
  return arr[Math.floor(r() * arr.length)];
}
