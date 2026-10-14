"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ui } from "./client";
import ProductsPanel from "./ProductsPanel";
import PromoPanel from "./PromoPanel";
import UsersPanel from "./UsersPanel";

type Me = { configured: boolean; storage: "upstash" | "file" | "none"; user: { email: string; owner: boolean } | null };
type Tab = "productos" | "oferta" | "accesos";

export default function AdminApp() {
  const [me, setMe] = useState<Me | null>(null);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);
  const load = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let live = true;
    api<Me>("/api/estudio/session")
      .then((m) => {
        if (!live) return;
        setMe(m);
        setFailed(false);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [tick]);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      {failed ? (
        <p className={ui.error} role="alert">
          No se pudo conectar con el servidor. Revisa tu internet y recarga la página.
        </p>
      ) : !me ? (
        <p className="text-lg" role="status">
          Cargando…
        </p>
      ) : !me.configured ? (
        <Setup />
      ) : !me.user ? (
        <Login onDone={load} />
      ) : (
        <Panel me={me as Me & { user: NonNullable<Me["user"]> }} onLogout={load} />
      )}
    </main>
  );
}

function Brand() {
  return <p className="font-block text-2xl leading-none sm:text-3xl">ELDEBHOR <span className="text-brand">Admin</span></p>;
}

function Setup() {
  return (
    <div className={`${ui.card} mx-auto max-w-xl`}>
      <Brand />
      <h1 className="mt-4 font-block text-xl">Falta configurar el acceso</h1>
      <p className="mt-2 text-base leading-relaxed">
        Agrega estas variables de entorno en el servidor (en local, en <code className="rounded bg-ink px-1">.env.local</code>) y reinicia:
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-6 text-base">
        <li>
          <code className="rounded bg-ink px-1">ADMIN_EMAIL</code>: tu correo
        </li>
        <li>
          <code className="rounded bg-ink px-1">ADMIN_PASSWORD</code>: contraseña (mínimo 8 caracteres)
        </li>
        <li>
          <code className="rounded bg-ink px-1">ADMIN_SECRET</code>: texto largo al azar (mínimo 32 caracteres)
        </li>
      </ul>
      <p className="mt-3 text-base">Los pasos completos están en el README.</p>
    </div>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/estudio/login", { json: { email, password } });
      onDone();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={`${ui.card} mx-auto mt-4 max-w-md space-y-4 sm:mt-12`} aria-labelledby="login-title">
      <Brand />
      <h1 id="login-title" className="font-block text-xl">
        Iniciar sesión
      </h1>
      <div>
        <label htmlFor="email" className={ui.label}>
          Correo
        </label>
        <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={ui.input} />
      </div>
      <div>
        <label htmlFor="password" className={ui.label}>
          Contraseña
        </label>
        <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={ui.input} />
      </div>
      {error && (
        <p className={ui.error} role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={`${ui.primary} w-full`}>
        {busy ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

function Panel({ me, onLogout }: { me: Me & { user: NonNullable<Me["user"]> }; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("productos");
  const tabs: [Tab, string][] = [
    ["productos", "Productos"],
    ["oferta", "Oferta del sitio"],
    ["accesos", me.user.owner ? "Accesos" : "Mi contraseña"],
  ];

  const logout = async () => {
    await api("/api/estudio/logout", { method: "POST", json: {} }).catch(() => undefined);
    onLogout();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Brand />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-bone/80">{me.user.email}</span>
          <a href="/" target="_blank" rel="noopener noreferrer" className={ui.secondary}>
            Ver sitio<span className="sr-only"> (abre en otra pestaña)</span>
          </a>
          <button type="button" onClick={logout} className={ui.secondary}>
            Salir
          </button>
        </div>
      </header>

      {me.storage === "none" && (
        <p className={ui.error} role="alert">
          No hay base de datos conectada: puedes ver el panel, pero los cambios no se guardarán. Conecta Upstash (ver README).
        </p>
      )}
      {me.storage === "file" && <p className="text-sm text-bone/80">Modo local: los cambios se guardan en el archivo .data/db.json de esta computadora.</p>}

      <nav aria-label="Secciones" className="flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            className={`min-h-[48px] rounded-md border-2 px-4 text-base font-bold ${tab === id ? "border-brand bg-brand text-ink" : "border-bone/50 text-bone hover:bg-bone/10"}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "productos" && <ProductsPanel />}
      {tab === "oferta" && <PromoPanel />}
      {tab === "accesos" && <UsersPanel owner={me.user.owner} />}
    </div>
  );
}
