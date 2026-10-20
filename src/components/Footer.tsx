import { DEV_INSTAGRAM, DEV_NAME, devProfile, REDES } from "@/data/site";

/** Pie: las redes del debhor (Instagram y Facebook, bien grandes) y abajo el crédito del desarrollador. */
export default function Footer() {
  return (
    <footer className="bg-ink px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-14 text-bone sm:px-10 sm:pt-20">
      <div className="mx-auto max-w-6xl text-center">
        <p className="font-body text-base font-bold uppercase tracking-[0.35em] text-bone/85">✦ Sigue al debhor</p>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-4" aria-label="Redes sociales del debhor">
          {REDES.map((r, i) => (
            <li key={r.red}>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor={r.red === "instagram" ? "IG" : "FB"}
                className={`inline-flex min-h-[56px] items-center gap-3 border-4 border-black bg-bone px-5 py-3 font-block text-lg text-ink transition-transform hover:scale-105 ${i % 2 ? "rotate-1 shadow-[6px_6px_0_#2ec6ee] hover:-rotate-1" : "-rotate-1 shadow-[6px_6px_0_#ff2e88] hover:rotate-1"}`}
              >
                {r.red === "instagram" ? <IgIcon /> : <FbIcon />}
                <span className="flex flex-col items-start leading-tight">
                  <span className="font-body text-xs font-bold uppercase tracking-[0.25em] text-ink/70">{r.nombre}</span>
                  {r.usuario}
                </span>
                <span className="sr-only"> (abre {r.nombre} en otra pestaña)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <p className="mx-auto mt-12 max-w-6xl border-t border-bone/20 pt-4 text-center text-base text-bone/85">
        Desarrollado por {DEV_NAME} ·{" "}
        <a
          href={devProfile}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor="IG"
          className="inline-flex min-h-[44px] items-center font-bold text-brand underline underline-offset-4"
        >
          @{DEV_INSTAGRAM}
          <span className="sr-only"> (abre Instagram en otra pestaña)</span>
        </a>
      </p>
    </footer>
  );
}

function IgIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FbIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M13.6 21.9v-7.7h2.6l.4-3h-3V9.3c0-.9.3-1.5 1.5-1.5h1.6V5.1c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.6v7.7h3Z" />
      <rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}
