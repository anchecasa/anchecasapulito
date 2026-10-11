import Link from "next/link";
import { faultSearchParams } from "@/lib/sos/artisan-maps";
import { GuideSteps } from "@/components/supermastro/guide-steps";
import { Mascot, poseForSkill } from "@/components/supermastro/mascot";
import type { LoadedDiagnosis } from "@/lib/sos/save-diagnosis";

export function DaSoloView({
  base,
  diagnosis,
  preview,
}: {
  base: "/m" | "/supermastro";
  diagnosis: LoadedDiagnosis;
  preview?: string;
}) {
  const home = base === "/m" ? "/m/home" : "/supermastro";
  const back = preview ? `${base}/esito?prova=${preview}` : `${base}/esito?id=${diagnosis.id}`;
  const passi = diagnosis.payload.fai_da_te?.passi ?? [];
  const attrezzi = diagnosis.payload.fai_da_te?.attrezzi ?? [];

  if (diagnosis.esito !== "fai_da_te" || passi.length < 3) {
    return (
      <section className="bg-[var(--sm-paper)] px-5 py-8 text-[var(--sm-ink)]">
        <p className="text-base">Questa diagnosi non ha una guida da seguire.</p>
        <Link href={back} className="mt-4 inline-flex min-h-11 items-center text-base font-semibold text-[var(--sm-accent-strong)]">
          Torna all&apos;esito
        </Link>
      </section>
    );
  }

  const ricercaParams =
    diagnosis.payload.lat != null && diagnosis.payload.lng != null
      ? faultSearchParams({
          label: diagnosis.skillLabel || diagnosis.skillSlug,
          lat: diagnosis.payload.lat,
          lng: diagnosis.payload.lng,
          summary: diagnosis.payload.summary,
        })
      : null;
  if (ricercaParams && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(diagnosis.id)) {
    ricercaParams.set("id", diagnosis.id);
  }
  const ricerca = ricercaParams ? `${base}/ricerca?${ricercaParams.toString()}` : back;

  return (
    <section className="min-h-full bg-[var(--sm-paper)] px-5 py-6 text-[var(--sm-ink)]">
      <Link href={home} className="inline-flex min-h-11 items-center text-base font-semibold">
        Home
      </Link>
      <div className="mt-4">
        <Mascot
          pose={poseForSkill(diagnosis.skillSlug)}
          size={112}
          alt=""
          speech="Segui i passi, con calma. Se non ce la fai, chiama un professionista."
        />
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--sm-accent)]">
        {diagnosis.skillLabel}
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Lo risolvo da solo</h1>
      <p className="mt-2 text-base leading-relaxed">{diagnosis.payload.visto_sentito}</p>
      {attrezzi.length > 0 && (
        <>
          <h2 className="mt-6 text-sm font-semibold uppercase tracking-[0.12em]">Attrezzi</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {attrezzi.map((tool) => (
              <li key={tool} className="rounded-full bg-white px-3 py-2 text-sm font-semibold">
                {tool}
              </li>
            ))}
          </ul>
        </>
      )}
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-[0.12em]">Punto per punto</h2>
      <GuideSteps passi={passi} ricercaHref={ricerca} diagnosisId={preview ? null : diagnosis.id} />
    </section>
  );
}
