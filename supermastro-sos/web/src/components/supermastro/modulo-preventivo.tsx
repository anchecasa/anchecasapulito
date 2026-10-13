"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { loadCliente, type Cliente } from "@/lib/sos/cliente";
import {
  euro,
  findIntervento,
  interventoId,
  INTERVENTO_EVENT,
  saveIntervento,
  type Intervento,
} from "@/lib/sos/intervento";

type Role = "artigiano" | "cliente";

type Props = {
  nome: string;
  mestiere: string;
  guasto: string;
  ruolo: Role;
};

const DEFAULT_DESCRIPTION = "Sostituzione guarnizione e verifica dello scarico.";

export function ModuloPreventivo({ nome, mestiere, guasto, ruolo }: Props) {
  const id = interventoId(nome, guasto);
  const [role, setRole] = useState<Role>(ruolo);
  const [job, setJob] = useState<Intervento | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [total, setTotal] = useState("180");
  const [deposit, setDeposit] = useState("60");
  const [arrival, setArrival] = useState("16:30");
  const [signature, setSignature] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    let dead = false;
    queueMicrotask(() => {
      if (dead) return;
      const found = findIntervento(id);
      setJob(found);
      setCliente(loadCliente());
      if (!found) return;
      setDescription(found.description);
      setTotal(String(found.totalEuro));
      setDeposit(String(found.depositEuro));
      setArrival(found.arrivalTime);
      setStars(found.stars ?? 0);
      setReview(found.review ?? "");
      setPhotos(found.photos);
    });
    function refresh() {
      setJob(findIntervento(id));
      setCliente(loadCliente());
    }
    window.addEventListener(INTERVENTO_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      dead = true;
      window.removeEventListener(INTERVENTO_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [id]);

  const returnPath = `/supermastro/preventivo?ruolo=cliente&nome=${encodeURIComponent(nome)}&mestiere=${encodeURIComponent(mestiere)}&guasto=${encodeURIComponent(guasto)}`;

  function publish() {
    const totalEuro = Number(total.replace(",", "."));
    const depositEuro = Number(deposit.replace(",", "."));
    if (!description.trim()) {
      setNotice("Scrivi cosa comprende il preventivo.");
      return;
    }
    if (!Number.isFinite(totalEuro) || totalEuro <= 0) {
      setNotice("Indica l'importo totale.");
      return;
    }
    if (!Number.isFinite(depositEuro) || depositEuro <= 0 || depositEuro >= totalEuro) {
      setNotice("L'acconto resta maggiore di zero e sotto il totale.");
      return;
    }
    if (!arrival) {
      setNotice("Indica a che ora sarai dal cliente.");
      return;
    }
    const next: Intervento = {
      id,
      fault: guasto,
      trade: mestiere,
      artisanName: nome,
      description: description.trim(),
      totalEuro,
      depositEuro,
      arrivalTime: arrival,
      signature: job?.signature ?? null,
      signedAt: job?.signedAt ?? null,
      depositPaidAt: job?.depositPaidAt ?? null,
      balancePaidAt: job?.balancePaidAt ?? null,
      stars: job?.stars ?? null,
      review: job?.review ?? null,
      photos: job?.photos ?? [],
      updatedAt: new Date().toISOString(),
    };
    saveIntervento(next);
    setJob(next);
    setNotice("Preventivo inviato. Il cliente lo vede subito, firma e paga l'acconto.");
    setRole("cliente");
  }

  function payDeposit() {
    if (!job) return;
    if (!cliente) {
      setNotice("Prima iscriviti come privato e salva la carta.");
      return;
    }
    if (!signature) {
      setNotice("Firma nello spazio, poi accetta.");
      return;
    }
    const next: Intervento = {
      ...job,
      signature,
      signedAt: new Date().toISOString(),
      depositPaidAt: new Date().toISOString(),
    };
    saveIntervento(next);
    setJob(next);
    setNotice(`Acconto di ${euro(job.depositEuro)} sulla carta che finisce con ${cliente.cardLast4}.`);
  }

  function payBalance() {
    if (!job || !cliente) return;
    const next: Intervento = { ...job, balancePaidAt: new Date().toISOString() };
    saveIntervento(next);
    setJob(next);
    setNotice(`Saldo di ${euro(job.totalEuro - job.depositEuro)} sulla carta che finisce con ${cliente.cardLast4}.`);
  }

  function saveReview() {
    if (!job || stars < 1) {
      setNotice("Scegli le stelle.");
      return;
    }
    const next: Intervento = { ...job, stars, review: review.trim() || null, photos: photos.slice(0, 5) };
    saveIntervento(next);
    setJob(next);
    setNotice("Recensione salvata nello storico.");
  }

  return (
    <section className="mx-auto w-full max-w-5xl text-[#1A2432]">
      <div className="space-y-6">
        <div className="border-b border-[#2A3C54]/10 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E56B10]">
            Modulo preventivo
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Preventivo in tempo reale</h1>
          <p className="mt-2 text-sm text-[#2A3C54]">
            {mestiere} · {nome} · {guasto}
          </p>
          <div className="mt-4 inline-grid grid-cols-2 gap-1 rounded-xl border border-[#2A3C54]/10 bg-white p-1">
            {(["artigiano", "cliente"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRole(item)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                  role === item ? "bg-[#1A2432] text-[#FBF8F3]" : "text-[#2A3C54]"
                }`}
              >
                {item === "artigiano" ? "Artigiano" : "Cliente"}
              </button>
            ))}
          </div>
        </div>

        {role === "artigiano" ? (
          <form
            className="space-y-4 rounded-2xl border border-[#2A3C54]/10 bg-white p-5 lg:max-w-xl"
            onSubmit={(event) => {
              event.preventDefault();
              publish();
            }}
          >
            <label className="block text-sm font-medium">
              Lavori
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-[#2A3C54]/15 bg-[#FBF8F3] px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-sm font-medium">
              Totale, euro
              <input
                value={total}
                onChange={(event) => setTotal(event.target.value)}
                inputMode="decimal"
                className="mt-1 w-full rounded-xl border border-[#2A3C54]/15 bg-[#FBF8F3] px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-sm font-medium">
              Acconto, euro
              <input
                value={deposit}
                onChange={(event) => setDeposit(event.target.value)}
                inputMode="decimal"
                className="mt-1 w-full rounded-xl border border-[#2A3C54]/15 bg-[#FBF8F3] px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-sm font-medium">
              A che ora sarai dal cliente
              <input
                type="time"
                value={arrival}
                onChange={(event) => setArrival(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#2A3C54]/15 bg-[#FBF8F3] px-3 py-2.5 text-sm"
              />
            </label>
            <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl bg-[#E56B10] px-5 text-sm font-semibold text-white">
              Invia il preventivo
            </button>
          </form>
        ) : (
          <ClientePreventivo
            job={job}
            cliente={cliente}
            signature={signature}
            stars={stars}
            review={review}
            returnPath={returnPath}
            onSignature={setSignature}
            onPayDeposit={payDeposit}
            onPayBalance={payBalance}
            onStars={setStars}
            onReview={setReview}
            onSaveReview={saveReview}
          />
        )}

        {notice && <p className="rounded-2xl bg-white px-4 py-3 text-sm text-[#2A3C54] shadow-sm">{notice}</p>}
      </div>
    </section>
  );
}

function ClientePreventivo({
  job,
  cliente,
  signature,
  stars,
  review,
  returnPath,
  onSignature,
  onPayDeposit,
  onPayBalance,
  onStars,
  onReview,
  onSaveReview,
}: {
  job: Intervento | null;
  cliente: Cliente | null;
  signature: string | null;
  stars: number;
  review: string;
  returnPath: string;
  onSignature: (value: string | null) => void;
  onPayDeposit: () => void;
  onPayBalance: () => void;
  onStars: (value: number) => void;
  onReview: (value: string) => void;
  onSaveReview: () => void;
}) {
  if (!job || job.totalEuro <= 0) {
    return (
      <p className="rounded-2xl border border-[#2A3C54]/10 bg-white px-5 py-6 text-sm leading-relaxed text-[#2A3C54]">
        Il preventivo compare qui appena l&apos;artigiano iscritto lo compila nel modulo.
      </p>
    );
  }

  const balance = job.totalEuro - job.depositEuro;

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <article className="rounded-2xl bg-[#1A2432] px-6 py-6 text-[#FBF8F3]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E56B10]">Documento</p>
        <p className="mt-3 text-sm text-[#FBF8F3]/70">{job.artisanName}</p>
        <p className="mt-2 text-sm leading-relaxed">{job.description}</p>
        <p className="mt-6 text-4xl font-semibold leading-none">{euro(job.totalEuro)}</p>
        <p className="mt-2 text-sm text-[#FBF8F3]/80">
          Acconto {euro(job.depositEuro)} · saldo {euro(balance)}
        </p>
        <p className="mt-4 text-sm">Arrivo alle {job.arrivalTime}</p>
      </article>

      <div className="space-y-3">
      {!job.depositPaidAt && (
        <div className="space-y-3 rounded-2xl border border-[#2A3C54]/10 bg-white p-5">
          <p className="text-sm font-semibold">Firma a schermo</p>
          <SignaturePad onChange={onSignature} />
          {signature && (
            <p className="text-xs text-[#2A3C54]">Firma presa. Accetti il preventivo e paghi l&apos;acconto.</p>
          )}
          {cliente ? (
            <button
              type="button"
              onClick={onPayDeposit}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#E56B10] px-4 text-sm font-semibold text-white"
            >
              Accetta e paga l&apos;acconto con carta {cliente.cardLast4}
            </button>
          ) : (
            <Link
              href={`/supermastro/privato?next=${encodeURIComponent(returnPath)}`}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#E56B10] px-4 text-sm font-semibold text-white"
            >
              Iscriviti per pagare con carta
            </Link>
          )}
        </div>
      )}

      {job.depositPaidAt && (
        <div className="rounded-2xl border border-[#2A3C54]/10 bg-white p-5">
          <p className="text-sm font-semibold">Acconto pagato</p>
          <p className="mt-1 text-sm text-[#2A3C54]">
            {`${job.artisanName} sarà da te alle ${job.arrivalTime}. Carta ${cliente?.cardLast4 ?? "salvata"}.`}
          </p>
        </div>
      )}

      {job.depositPaidAt && !job.balancePaidAt && cliente && (
        <button
          type="button"
          onClick={onPayBalance}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#2A3C54] px-4 text-sm font-semibold text-[#FBF8F3]"
        >
          Lavoro finito. Paga il saldo di {euro(balance)}
        </button>
      )}

      {job.balancePaidAt && (
        <div className="space-y-3 rounded-2xl border border-[#2A3C54]/10 bg-white p-5">
          <p className="text-sm font-semibold">Recensione</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onStars(value)}
                aria-label={`${value} stelle`}
                className={`grid h-11 w-11 place-items-center rounded-xl text-lg ${
                  value <= stars ? "bg-[#E56B10] text-white" : "bg-[#FBF8F3] text-[#2A3C54]"
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <label className="block text-sm font-medium">
            Recensione
            <textarea
              value={review}
              onChange={(event) => onReview(event.target.value)}
              rows={3}
              maxLength={280}
              placeholder="Com'è andato il lavoro"
              className="mt-1 w-full rounded-xl border border-[#2A3C54]/15 bg-[#FBF8F3] px-3 py-2.5 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={onSaveReview}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#E56B10] px-4 text-sm font-semibold text-white"
          >
            Salva stelle e recensione
          </button>
        </div>
      )}
      </div>
    </div>
  );
}

function SignaturePad({ onChange }: { onChange: (value: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FBF8F3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1A2432";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
  }, []);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        className="h-28 w-full touch-none rounded-2xl border border-[#2A3C54]/15 bg-[#FBF8F3]"
        onPointerDown={(event) => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (!canvas || !ctx) return;
          canvas.setPointerCapture(event.pointerId);
          drawing.current = true;
          const start = point(event);
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
        }}
        onPointerMove={(event) => {
          if (!drawing.current) return;
          const ctx = canvasRef.current?.getContext("2d");
          if (!ctx) return;
          const next = point(event);
          ctx.lineTo(next.x, next.y);
          ctx.stroke();
        }}
        onPointerUp={() => {
          drawing.current = false;
          const canvas = canvasRef.current;
          onChange(canvas ? canvas.toDataURL("image/png") : null);
        }}
      />
      <button
        type="button"
        className="mt-2 text-xs font-semibold text-[#2A3C54]"
        onClick={() => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (!canvas || !ctx) return;
          ctx.fillStyle = "#FBF8F3";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          onChange(null);
        }}
      >
        Cancella firma
      </button>
    </div>
  );
}
