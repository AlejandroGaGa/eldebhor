import { DEV_INSTAGRAM, DEV_NAME, devProfile } from "@/data/site";

/** Pie mínimo: solo el crédito del desarrollador con su Instagram. */
export default function Footer() {
  return (
    <footer className="bg-ink px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-10">
      <p className="mx-auto max-w-6xl border-t border-bone/20 pt-4 text-center text-base text-bone/85">
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
