import "server-only";
import { connection } from "next/server";
import { adminConfigured, getSession, type Session } from "./auth";
import { StorageError } from "./db";

export const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export const err = (error: string, status = 400) => json({ error }, status);

/** Misma origen: el navegador manda Origin en cada POST, y debe coincidir con el host del sitio. */
function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Revisa configuración, origen, sesión (y rol de dueño si hace falta). */
export async function guard(req: Request, opts: { mutating?: boolean; owner?: boolean } = {}): Promise<{ session: Session } | { res: Response }> {
  await connection(); // siempre dinámico: nunca se congela en la compilación
  if (!adminConfigured) return { res: err("El panel no está configurado en el servidor (faltan variables de entorno).", 503) };
  if (opts.mutating && !sameOrigin(req)) return { res: err("Solicitud rechazada.", 403) };
  const session = await getSession();
  if (!session) return { res: err("Tu sesión terminó. Entra de nuevo.", 401) };
  if (opts.owner && !session.owner) return { res: err("Solo la persona dueña puede hacer esto.", 403) };
  return { session };
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as T) : null;
  } catch {
    return null;
  }
}

/** Convierte un fallo de almacenamiento en un mensaje claro en vez de un 500 mudo. */
export async function safe(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    console.error("[admin]", e instanceof Error ? e.message : e);
    if (e instanceof StorageError) return err("No se pudo guardar: falta conectar la base de datos (Upstash) o falló la conexión.", 503);
    return err("Algo salió mal. Intenta de nuevo.", 500);
  }
}
