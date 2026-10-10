"use client";

/**
 * Every sound on the site is synthesized live with Web Audio:
 * no audio files, just filtered noise and oscillators.
 */
import { store } from "./store";

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let master: GainNode | null = null;
let hiss: { gain: GainNode; bp: BiquadFilterNode } | null = null;

const on = () => store.get().sound && !!ctx;

export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
}

function getHiss() {
  if (!ctx || !noise || !master) return null;
  if (!hiss) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 5200;
    bp.Q.value = 0.6;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1600;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(bp).connect(hp).connect(gain).connect(master);
    src.start();
    hiss = { gain, bp };
  }
  return hiss;
}

export function sprayOn(intensity = 1) {
  if (!on()) return;
  const h = getHiss();
  if (!h || !ctx) return;
  const t = ctx.currentTime;
  h.gain.gain.cancelScheduledValues(t);
  h.gain.gain.setTargetAtTime(0.11 * intensity, t, 0.015);
  h.bp.frequency.setTargetAtTime(4600 + Math.random() * 1400, t, 0.05);
}

export function sprayOff() {
  if (!hiss || !ctx) return;
  const t = ctx.currentTime;
  hiss.gain.gain.cancelScheduledValues(t);
  hiss.gain.gain.setTargetAtTime(0, t, 0.04);
}

function burst(t: number, freq: number, dur: number, vol: number, type: BiquadFilterType = "bandpass") {
  if (!ctx || !noise || !master) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = type === "bandpass" ? 4 : 0.7;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random() * 1.5, dur + 0.05);
}

function tone(t: number, f0: number, f1: number, dur: number, vol: number, type: OscillatorType = "sine") {
  if (!ctx || !master) return;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** The "clack clack" of the mixing ball inside the can. */
export function rattle(count = 6, spread = 0.55) {
  if (!on() || !ctx) return;
  const now = ctx.currentTime;
  for (let i = 0; i < count; i++) {
    const t = now + (i * spread) / count + Math.random() * 0.03;
    burst(t, 2600 + Math.random() * 1600, 0.035, 0.5);
    tone(t, 3400 + Math.random() * 600, 2600, 0.03, 0.06, "triangle");
  }
}

/** Sticker slap / paint splat thump. */
export function slap(vol = 0.6) {
  if (!on() || !ctx) return;
  const t = ctx.currentTime;
  tone(t, 160, 48, 0.16, vol * 0.8);
  burst(t, 1100, 0.08, vol * 0.5, "lowpass");
}

export function blip(freq = 880) {
  if (!on() || !ctx) return;
  tone(ctx.currentTime, freq, freq * 1.5, 0.07, 0.05, "square");
}

/** Paint roller "buff" sweep. */
export function roll(duration = 1.2) {
  if (!on() || !ctx || !noise || !master) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(400, t);
  f.frequency.linearRampToValueAtTime(900, t + duration);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.1);
  g.gain.setValueAtTime(0.35, t + duration - 0.15);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(f).connect(g).connect(master);
  src.start(t);
  src.stop(t + duration + 0.1);
}
