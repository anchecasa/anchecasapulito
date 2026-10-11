import Link from "next/link";
import { Mascot } from "@/components/supermastro/mascot";

const POINTS = [
  "Lo storico dei lavori resta tuo",
  "Acconto alla firma, saldo a lavoro finito",
  "Firmi il preventivo nello schermo",
  "A fine lavoro lasci stelle e foto",
];

export function PassScreen() {
  return (
    <section className="min-h-full bg-[#FBF8F3] px-4 py-5 text-[#1A2432]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E56B10]">Account</p>
      <h1 className="mt-2 text-2xl font-semibold">SuperMastro Pass</h1>
      <div className="mt-4 overflow-hidden rounded-[28px] bg-[#1A2432] text-[#FBF8F3]">
        <div className="flex items-end">
          <div className="flex-1 p-5">
            <p className="text-lg font-semibold leading-snug">Il pagamento resta nell&apos;app</p>
            <p className="mt-2 text-sm leading-relaxed text-[#FBF8F3]/75">
              Entri con Google, Facebook o Apple. La carta resta nel profilo, solo per acconto e saldo.
            </p>
          </div>
          <Mascot pose="saluta" size={140} alt="" />
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {POINTS.map((point) => (
          <li key={point} className="rounded-2xl bg-white px-4 py-3 text-sm">
            {point}
          </li>
        ))}
      </ul>
      <Link
        href="/m/iscrizione"
        className="mt-5 flex h-14 items-center justify-center rounded-full bg-[#E56B10] text-base font-semibold text-white"
      >
        Iscriviti
      </Link>
    </section>
  );
}
