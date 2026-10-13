import "server-only";
import crypto from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import { kv } from "./db";

/**
 * Acceso al panel.
 * - Dueño: ADMIN_EMAIL + ADMIN_PASSWORD (variables de entorno). Puede dar acceso a otras personas.
 * - Otros admins: se crean desde el panel; su contraseña se guarda con scrypt + sal (nunca en claro).
 * - Sesión: cookie httpOnly firmada con ADMIN_SECRET (HMAC-SHA256) que caduca a las 8 horas.
 */
const secret = process.env.ADMIN_SECRET?.trim() ?? "";
const ownerEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const ownerPass = process.env.ADMIN_PASSWORD ?? "";
export const adminConfigured = secret.length >= 32 && !!ownerEmail && ownerPass.length >= 8;

export const COOKIE = "eldebhor_admin";
const TTL_MS = 8 * 60 * 60 * 1000;
const scrypt = promisify(crypto.scrypt) as (pw: string, salt: string, len: number) => Promise<Buffer>;
const DUMMY_SALT = "0".repeat(32);

export type Session = { email: string; owner: boolean };
export type AdminUser = { email: string; salt: string; hash: string; creado: string };

const K_USERS = "admin:users";
export async function readUsers(): Promise<AdminUser[]> {
  try {
    const raw = await kv.get(K_USERS);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr as AdminUser[]) : [];
  } catch {
    return [];
  }
}
export const writeUsers = (u: AdminUser[]) => kv.set(K_USERS, JSON.stringify(u));

const sha = (s: string) => crypto.createHash("sha256").update(s).digest();
const safeEqual = (a: string, b: string) => crypto.timingSafeEqual(sha(a), sha(b));
const sign = (body: string) => crypto.createHmac("sha256", secret).update(body).digest("base64url");

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  return { salt, hash: (await scrypt(password, salt, 64)).toString("hex") };
}

export const normalizeEmail = (e: unknown) => (typeof e === "string" ? e.trim().toLowerCase().slice(0, 120) : "");
export const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const isOwnerEmail = (e: string) => e === ownerEmail;

export async function verifyLogin(email: string, password: string): Promise<Session | null> {
  const e = normalizeEmail(email);
  if (e === ownerEmail) return safeEqual(password, ownerPass) ? { email: e, owner: true } : null;
  const u = (await readUsers()).find((x) => x.email === e);
  // siempre se hace el cálculo, exista o no el usuario, para no delatar qué correos existen
  const hash = (await scrypt(password, u?.salt ?? DUMMY_SALT, 64)).toString("hex");
  return u && safeEqual(hash, u.hash) ? { email: e, owner: false } : null;
}

export async function startSession(s: Session) {
  const body = Buffer.from(JSON.stringify({ e: s.email, o: s.owner, x: Date.now() + TTL_MS })).toString("base64url");
  (await cookies()).set(COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}
export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  if (!adminConfigured) return null;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig || !safeEqual(sig, sign(body))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as { e: string; o: boolean; x: number };
    if (!p.x || p.x < Date.now()) return null;
    if (p.o) return p.e === ownerEmail ? { email: p.e, owner: true } : null;
    // si le quitaron el acceso, la sesión deja de valer al instante
    return (await readUsers()).some((u) => u.email === p.e) ? { email: p.e, owner: false } : null;
  } catch {
    return null;
  }
}

/* ---------- freno a intentos fallidos (por IP, en memoria) ---------- */
const attempts = new Map<string, { n: number; until: number }>();
const MAX_TRIES = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}
export const lockedFor = (ip: string) => {
  const a = attempts.get(ip);
  return a && a.until > Date.now() ? Math.ceil((a.until - Date.now()) / 60000) : 0;
};
export function registerFail(ip: string) {
  const a = attempts.get(ip);
  const n = (a && a.until === 0 ? a.n : 0) + 1;
  attempts.set(ip, n >= MAX_TRIES ? { n: 0, until: Date.now() + LOCK_MS } : { n, until: 0 });
}
export const clearFails = (ip: string) => void attempts.delete(ip);
