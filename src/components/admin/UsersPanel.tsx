"use client";

import { useEffect, useState } from "react";
import { api, ui } from "./client";

export default function UsersPanel({ owner }: { owner: boolean }) {
  return owner ? <Owner /> : <ChangePassword />;
}

function Owner() {
  const [users, setUsers] = useState<{ email: string }[] | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    api<{ users: { email: string }[] }>("/api/admin/users")
      .then((r) => setUsers(r.users))
      .catch((e) => setError((e as Error).message));
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const r = await api<{ users: { email: string }[] }>("/api/admin/users", { json: { action: "add", email, password } });
      setUsers(r.users);
      setMsg(`Listo: ${email} ya puede entrar con la contraseña que le pusiste. Pásasela por un medio privado.`);
      setEmail("");
      setPassword("");
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  };

  const remove = async (em: string) => {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const r = await api<{ users: { email: string }[] }>("/api/admin/users", { json: { action: "remove", email: em } });
      setUsers(r.users);
      setMsg(`${em} ya no tiene acceso.`);
    } catch (err) {
      setError((err as Error).message);
    }
    setConfirm("");
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <section className={`${ui.card} space-y-4`} aria-labelledby="acc-title">
        <div>
          <h1 id="acc-title" className="font-block text-xl">
            Personas con acceso
          </h1>
          <p className={ui.hint}>Tú (dueño) siempre tienes acceso. Cada persona que agregues puede editar productos y ofertas, pero no dar ni quitar accesos.</p>
        </div>
        {!users ? (
          <p role="status">Cargando…</p>
        ) : users.length === 0 ? (
          <p className="text-base">Todavía no has dado acceso a nadie.</p>
        ) : (
          <ul className="divide-y divide-bone/20">
            {users.map((u) => (
              <li key={u.email} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="break-all text-base font-bold">{u.email}</span>
                {confirm === u.email ? (
                  <span className="flex flex-wrap gap-2">
                    <button type="button" disabled={busy} onClick={() => remove(u.email)} className={ui.danger}>
                      Sí, quitar acceso
                    </button>
                    <button type="button" onClick={() => setConfirm("")} className={ui.secondary}>
                      Cancelar
                    </button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirm(u.email)} className={ui.secondary}>
                    Quitar acceso<span className="sr-only"> a {u.email}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={add} className={`${ui.card} space-y-4`} aria-labelledby="add-title">
        <h2 id="add-title" className="font-block text-xl">
          Dar acceso a otra persona
        </h2>
        <div>
          <label htmlFor="u-email" className={ui.label}>
            Su correo
          </label>
          <input id="u-email" type="email" required autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} className={ui.input} />
        </div>
        <div>
          <label htmlFor="u-pass" className={ui.label}>
            Contraseña para ella o él
          </label>
          <input id="u-pass" type="text" required minLength={10} autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} className={ui.input} />
          <p className={ui.hint}>Mínimo 10 caracteres. Puede cambiarla después desde su propio panel.</p>
        </div>
        {error && <p className={ui.error} role="alert">{error}</p>}
        {msg && <p className={ui.ok} role="status">{msg}</p>}
        <button type="submit" disabled={busy} className={ui.primary}>
          {busy ? "Guardando…" : "Dar acceso"}
        </button>
      </form>
    </div>
  );
}

function ChangePassword() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOk(false);
    try {
      await api("/api/admin/users", { json: { action: "password", actual, nueva } });
      setOk(true);
      setActual("");
      setNueva("");
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className={`${ui.card} max-w-md space-y-4`} aria-labelledby="pw-title">
      <h1 id="pw-title" className="font-block text-xl">
        Cambiar mi contraseña
      </h1>
      <div>
        <label htmlFor="pw-actual" className={ui.label}>
          Contraseña actual
        </label>
        <input id="pw-actual" type="password" autoComplete="current-password" required value={actual} onChange={(e) => setActual(e.target.value)} className={ui.input} />
      </div>
      <div>
        <label htmlFor="pw-nueva" className={ui.label}>
          Contraseña nueva
        </label>
        <input id="pw-nueva" type="password" autoComplete="new-password" required minLength={10} value={nueva} onChange={(e) => setNueva(e.target.value)} className={ui.input} />
        <p className={ui.hint}>Mínimo 10 caracteres.</p>
      </div>
      {error && <p className={ui.error} role="alert">{error}</p>}
      {ok && <p className={ui.ok} role="status">Contraseña cambiada.</p>}
      <button type="submit" disabled={busy} className={ui.primary}>
        {busy ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
