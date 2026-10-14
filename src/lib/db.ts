import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Almacén clave-valor del panel (productos, ofertas, accesos y fotos).
 * - Upstash Redis (UPSTASH_REDIS_REST_URL / _TOKEN): para producción en Vercel.
 * - Archivo .data/db.json: para trabajar en local o en un servidor propio.
 * - Sin ninguna: en Vercel el disco es de solo lectura, así que no se puede guardar (se avisa en el panel).
 */
export type Storage = "upstash" | "file" | "none";

// Upstash se llama UPSTASH_REDIS_REST_* en su panel, pero la integración de Vercel crea KV_REST_API_* y a veces con un
// prefijo propio (p. ej. STORAGE_KV_REST_API_URL). Se acepta cualquiera de esos nombres.
const findEnv = (re: RegExp) => {
  const key = Object.keys(process.env).find((k) => re.test(k) && process.env[k]?.trim());
  return key ? process.env[key]?.trim() : undefined;
};
const URL_ = findEnv(/(^|_)(UPSTASH_REDIS_REST_URL|KV_REST_API_URL)$/)?.replace(/\/+$/, "");
const TOKEN = findEnv(/(^|_)(UPSTASH_REDIS_REST_TOKEN|KV_REST_API_TOKEN)$/);
export const storage: Storage = URL_ && TOKEN ? "upstash" : process.env.VERCEL ? "none" : "file";

export class StorageError extends Error {}

async function upstash(cmd: (string | number)[]): Promise<unknown> {
  const res = await fetch(URL_ as string, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const json = (await res.json().catch(() => ({}))) as { result?: unknown; error?: string };
  if (!res.ok || json.error) throw new StorageError(json.error ?? `Upstash respondió ${res.status}`);
  return json.result;
}

const dir = process.env.ADMIN_DATA_DIR?.trim() || path.join(process.cwd(), ".data");
const file = path.join(dir, "db.json");
let chain: Promise<unknown> = Promise.resolve();

async function readFile(): Promise<Record<string, string>> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}
function mutate(fn: (db: Record<string, string>) => void): Promise<void> {
  const run = chain.then(async () => {
    const db = await readFile();
    fn(db);
    await fs.mkdir(dir, { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db));
    await fs.rename(tmp, file);
  });
  chain = run.catch(() => undefined);
  return run;
}

export const kv = {
  async get(key: string): Promise<string | null> {
    if (storage === "upstash") return ((await upstash(["GET", key])) as string | null) ?? null;
    if (storage === "file") return (await readFile())[key] ?? null;
    return null;
  },
  async set(key: string, value: string): Promise<void> {
    if (storage === "upstash") await upstash(["SET", key, value]);
    else if (storage === "file") await mutate((db) => void (db[key] = value));
    else throw new StorageError("Sin base de datos");
  },
  async del(key: string): Promise<void> {
    if (storage === "upstash") await upstash(["DEL", key]);
    else if (storage === "file") await mutate((db) => void delete db[key]);
  },
};
