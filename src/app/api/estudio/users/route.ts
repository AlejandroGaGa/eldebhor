import { body, err, guard, json, safe } from "@/lib/admin-api";
import { emailOk, hashPassword, isOwnerEmail, normalizeEmail, readUsers, verifyLogin, writeUsers } from "@/lib/auth";

const view = (users: { email: string }[]) => users.map((u) => ({ email: u.email }));

export async function GET(req: Request) {
  const g = await guard(req, { owner: true });
  if ("res" in g) return g.res;
  return safe(async () => json({ users: view(await readUsers()) }));
}

export async function POST(req: Request) {
  const g = await guard(req, { mutating: true });
  if ("res" in g) return g.res;
  return safe(async () => {
    const b = await body<{ action?: string; email?: unknown; password?: unknown; actual?: unknown; nueva?: unknown }>(req);
    if (!b) return err("Datos inválidos.");

    // cualquier admin puede cambiar su propia contraseña (el dueño la cambia en las variables de entorno)
    if (b.action === "password") {
      if (g.session.owner) return err("La contraseña del dueño se cambia en las variables de entorno (ADMIN_PASSWORD).");
      if (typeof b.actual !== "string" || typeof b.nueva !== "string") return err("Datos inválidos.");
      if (b.nueva.length < 10 || b.nueva.length > 200) return err("La contraseña nueva debe tener al menos 10 caracteres.");
      if (!(await verifyLogin(g.session.email, b.actual))) return err("La contraseña actual no es correcta.", 401);
      const users = await readUsers();
      const { salt, hash } = await hashPassword(b.nueva);
      await writeUsers(users.map((u) => (u.email === g.session.email ? { ...u, salt, hash } : u)));
      return json({ ok: true });
    }

    if (!g.session.owner) return err("Solo la persona dueña puede hacer esto.", 403);
    const users = await readUsers();

    if (b.action === "add") {
      const email = normalizeEmail(b.email);
      if (!emailOk(email)) return err("Escribe un correo válido.");
      if (isOwnerEmail(email) || users.some((u) => u.email === email)) return err("Ese correo ya tiene acceso.");
      if (typeof b.password !== "string" || b.password.length < 10 || b.password.length > 200) return err("La contraseña debe tener al menos 10 caracteres.");
      if (users.length >= 20) return err("Ya hay demasiados accesos.");
      const { salt, hash } = await hashPassword(b.password);
      const next = [...users, { email, salt, hash, creado: new Date().toISOString() }];
      await writeUsers(next);
      return json({ users: view(next) });
    }

    if (b.action === "remove") {
      const email = normalizeEmail(b.email);
      if (!users.some((u) => u.email === email)) return err("Ese acceso ya no existe.", 404);
      const next = users.filter((u) => u.email !== email);
      await writeUsers(next);
      return json({ users: view(next) });
    }

    return err("Acción desconocida.");
  });
}
