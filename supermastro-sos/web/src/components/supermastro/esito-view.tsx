import Link from "next/link";
import { artisanTradeLabel } from "@/lib/sos/artisan-maps";
import { DiagnosisThumb } from "@/components/supermastro/diagnosis-thumb";
import { FaultGrid } from "@/components/supermastro/fault-grid";
import { FindNearby } from "@/components/supermastro/find-nearby";
import { Mascot, poseForSkill } from "@/components/supermastro/mascot";
import type { LoadedDiagnosis } from "@/lib/sos/save-diagnosis";

const VERIFY = [
  "Avvicina il telefono al guasto.",
  "Accendi la luce.",
  "Se c'è un rumore, fallo sentire.",
  "Tieni il telefono fermo.",
];

export function EsitoView({
  base,
  diagnosis,
  preview,
}: {
  base: "/m" | "/supermastro";
  diagnosis: LoadedDiagnosis;
  preview?: string;
}) {
  const videoHref = `${base}/video`;
  const guideHref = preview ? `${base}/da-solo?prova=${preview}` : `${base}/da-solo?id=${diagnosis.id}`;
  const nearby = (text: string, className: string) => (
    <FindNearby
      base={base}
      label={diagnosis.skillLabel || diagnosis.skillSlug}
      summary={diagnosis.payload.summary}
      diagnosisId={diagnosis.id}
      lat={diagnosis.payload.lat}
      lng={diagnosis.payload.lng}
      text={text}
      className={className}
    />
  );
  const diy = diagnosis.payload.fai_da_te;
  const pose = poseForSkill(diagnosis.skillSlug);

  return (
    <section className="mx-auto flex min-h-full w-full max-w-lg flex-col bg-[var(--sm-paper)] px-4 py-6 text-[var(--sm-ink)]">
      <Link href={videoHref} className="inline-flex min-h-11 items-center text-base font-semibold text-[var(--sm-ink)]">
        Indietro
      </Link>

      {diagnosis.payload.parlato ? (
        <div className="mt-3 rounded-2xl bg-white px-4 py-3">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--sm-accent-strong)]">Hai detto</p>
          <p className="mt-1 text-base leading-relaxed">«{diagnosis.payload.parlato}»</p>
        </div>
      ) : null}

      {diagnosis.esito === "pericolo" ? (
        <Pericolo
          diagnosis={diagnosis}
          cerca={nearby(
            "Trova un tecnico abilitato",
            "mt-3 flex min-h-12 items-center justify-center rounded-full bg-[#8C1D18] px-5 text-center text-lg font-semibold text-white",
          )}
        />
      ) : diagnosis.esito === "fuori_tema" ? (
        <Fuori videoHref={videoHref} visto={diagnosis.payload.visto_sentito} diagnosisId={diagnosis.id} />
      ) : diagnosis.esito === "da_verificare" ? (
        <Verifica base={base} diagnosis={diagnosis} videoHref={videoHref} />
      ) : diagnosis.esito === "fai_da_te" && diy ? (
        <div className="mt-4">
          <Mascot
            pose={pose}
            size={112}
            alt=""
            speech="Puoi provarci tu. Se non ce la fai, chiami chi è vicino."
          />
          <h1 className="mt-4 text-2xl font-semibold leading-tight">{diagnosis.titolo}</h1>
          <h2 className="mt-5 text-lg font-semibold">Cosa ho visto e sentito</h2>
          <p className="mt-2 text-base leading-relaxed">{diagnosis.payload.visto_sentito}</p>
          {diagnosis.payload.prima_cosa && (
            <>
              <h2 className="mt-5 text-lg font-semibold">Prima di tutto</h2>
              <p className="mt-2 text-base leading-relaxed">{diagnosis.payload.prima_cosa}</p>
            </>
          )}
          <div className="mt-5 rounded-3xl bg-white p-4">
            <h2 className="text-lg font-semibold">Puoi provarci tu</h2>
            <p className="mt-2 text-base">
              {diy.difficolta === "facile" ? "Difficoltà facile" : "Difficoltà media"}
              {diy.tempo_minuti ? ` · circa ${diy.tempo_minuti} minuti` : ""}
            </p>
            {diy.attrezzi.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {diy.attrezzi.map((tool) => (
                  <li key={tool} className="rounded-full bg-[var(--sm-paper)] px-3 py-2 text-sm font-semibold">
                    {tool}
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={guideHref}
              className="mt-4 flex min-h-12 items-center justify-center rounded-full bg-[var(--sm-accent)] px-5 text-lg font-semibold text-white"
            >
              Segui la guida
            </Link>
          </div>
          {nearby(
            "Preferisco un artigiano vicino",
            "mt-3 flex min-h-12 items-center justify-center rounded-full border border-[var(--sm-ink)] bg-white px-5 text-center text-base font-semibold",
          )}
          <DiagnosisThumb diagnosisId={diagnosis.id} />
        </div>
      ) : (
        <div className="mt-4">
          <Mascot pose={pose} size={112} alt="" speech="Qui serve chi è del mestiere." />
          <h1 className="mt-4 text-2xl font-semibold leading-tight">{diagnosis.titolo}</h1>
          <p className="mt-3 text-base leading-relaxed">{diagnosis.payload.visto_sentito}</p>
          {diagnosis.payload.motivo_professionista && (
            <p className="mt-3 text-base font-semibold leading-relaxed">{diagnosis.payload.motivo_professionista}</p>
          )}
          {diagnosis.payload.prima_cosa && (
            <div className="mt-4 rounded-3xl bg-white p-4">
              <h2 className="text-lg font-semibold">Intanto fai questo</h2>
              <p className="mt-2 text-base leading-relaxed">{diagnosis.payload.prima_cosa}</p>
            </div>
          )}
          {nearby(
            `Trova un ${artisanTradeLabel(diagnosis.skillLabel).toLowerCase()} vicino`,
            "mt-6 flex min-h-12 items-center justify-center rounded-full bg-[var(--sm-accent)] px-5 text-center text-lg font-semibold text-white",
          )}
          <DiagnosisThumb diagnosisId={diagnosis.id} />
        </div>
      )}
    </section>
  );
}

function Pericolo({ diagnosis, cerca }: { diagnosis: LoadedDiagnosis; cerca: React.ReactNode }) {
  const gas = diagnosis.payload.pericolo === "gas";
  return (
    <div className="mt-4">
      <div className="rounded-3xl bg-[#8C1D18] px-4 py-5 text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.14em]">Pericolo</p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight">Attenzione: non farlo da solo</h1>
      </div>
      <p className="mt-4 text-base leading-relaxed">{diagnosis.payload.visto_sentito}</p>
      <h2 className="mt-4 text-lg font-semibold">Fai subito questo</h2>
      <ol className="mt-2 space-y-2">
        {diagnosis.payload.azioni.map((azione, index) => (
          <li key={azione} className="flex min-h-11 items-center gap-3 rounded-2xl bg-white px-3 py-3 text-base font-semibold">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#8C1D18] text-lg font-bold text-white">
              {index + 1}
            </span>
            {azione}
          </li>
        ))}
      </ol>
      <div className="mt-5 rounded-3xl border-2 border-[#8C1D18] bg-white px-4 py-4">
        <h2 className="text-lg font-semibold">Chiama il pronto intervento</h2>
        <p className="mt-2 text-base">Numero di emergenza:</p>
        <p className="mt-1 select-all text-4xl font-bold tracking-wide text-[#8C1D18]">112</p>
        {gas && (
          <p className="mt-2 text-base leading-relaxed">
            oppure il pronto intervento gas del tuo distributore (il numero è sulla bolletta)
          </p>
        )}
        <a
          href="tel:112"
          className="mt-4 flex min-h-12 items-center justify-center rounded-full bg-[#8C1D18] px-5 text-center text-lg font-semibold text-white"
        >
          Chiama il 112
        </a>
      </div>
      {cerca}
      <DiagnosisThumb diagnosisId={diagnosis.id} />
    </div>
  );
}

function Fuori({ videoHref, visto, diagnosisId }: { videoHref: string; visto: string; diagnosisId: string }) {
  return (
    <div className="mt-4">
      <Mascot
        pose="cuore"
        size={180}
        alt=""
        speech="Questo non è un problema di casa. Inquadra il guasto."
      />
      <h1 className="mt-4 text-2xl font-semibold leading-tight">Questo non è un problema di casa</h1>
      <p className="mt-3 text-base leading-relaxed">{visto}</p>
      <Link
        href={videoHref}
        className="mt-6 flex min-h-12 items-center justify-center rounded-full bg-[var(--sm-accent)] px-5 text-lg font-semibold text-white"
      >
        Inquadra il guasto
      </Link>
      <DiagnosisThumb diagnosisId={diagnosisId} />
    </div>
  );
}

function Verifica({
  base,
  diagnosis,
  videoHref,
}: {
  base: "/m" | "/supermastro";
  diagnosis: LoadedDiagnosis;
  videoHref: string;
}) {
  return (
    <div className="mt-4">
      <Mascot pose="viso" size={96} alt="" speech="Non vedo bene. Rifai il video, più vicino e con luce." />
      <h1 className="mt-4 text-2xl font-semibold leading-tight">Non vedo bene</h1>
      <p className="mt-3 text-base leading-relaxed">{diagnosis.payload.visto_sentito}</p>
      <ul className="mt-4 space-y-2">
        {VERIFY.map((tip) => (
          <li key={tip} className="rounded-2xl bg-white px-4 py-3 text-base font-semibold">
            {tip}
          </li>
        ))}
      </ul>
      <Link
        href={videoHref}
        className="mt-5 flex min-h-12 items-center justify-center rounded-full bg-[var(--sm-accent)] px-5 text-lg font-semibold text-white"
      >
        Rifai il video
      </Link>
      <FaultGrid base={base} lat={diagnosis.payload.lat} lng={diagnosis.payload.lng} />
      <DiagnosisThumb diagnosisId={diagnosis.id} />
    </div>
  );
}
