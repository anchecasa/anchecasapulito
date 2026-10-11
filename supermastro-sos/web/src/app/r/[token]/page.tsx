import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArtisanRequest } from "@/components/supermastro/artisan-request";
import { Mascot } from "@/components/supermastro/mascot";
import { minutesLabel } from "@/lib/sos/share-copy";
import { loadPublicShare } from "@/lib/sos/share";

export const metadata: Metadata = {
  title: "Richiesta di lavoro — SuperMastro",
  robots: { index: false, follow: false },
};

// Gli URL firmati durano 10 minuti: la pagina si genera sempre di nuovo.
export const dynamic = "force-dynamic";

export default async function PublicRequestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (token === "prova") {
    if (process.env.NODE_ENV !== "development") notFound();
    return (
      <ArtisanRequest
        preview
        token="prova"
        minutesLabel="inviata 2 minuti fa"
        zona="Roma"
        distanza="2,5 km"
        videoUrl={null}
        titolo="Perdita sotto il lavandino"
        visto="Si vede un gocciolio dal sifone."
        risposta={null}
        nome="Idraulico Acaia"
        mestiere="Idraulico"
        telefono="3331234567"
        optOut={false}
        answers={[]}
        verificato={false}
        accettato={false}
        clienteTelefono={null}
      />
    );
  }

  const loaded = await loadPublicShare(token);
  if (!loaded.ok) {
    const speech =
      loaded.reason === "closed"
        ? "Questa richiesta è chiusa."
        : loaded.reason === "unavailable"
          ? "La richiesta non si apre adesso."
          : "Questo link non corrisponde a una richiesta.";
    return (
      <section className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center bg-[#FBF8F3] px-5 py-8 text-[#1A2432]">
        <Mascot pose="viso" size={88} alt="" speech={speech} />
      </section>
    );
  }

  return (
    <ArtisanRequest
      token={loaded.token}
      minutesLabel={minutesLabel(loaded.createdAt)}
      zona={loaded.zona}
      distanza={loaded.distanza}
      videoUrl={loaded.videoUrl}
      titolo={loaded.titolo}
      visto={loaded.visto}
      risposta={loaded.risposta}
      nome={loaded.nome}
      mestiere={loaded.mestiere}
      telefono={loaded.telefono}
      optOut={loaded.optOut}
      answers={loaded.answers}
      verificato={loaded.verificato}
      accettato={loaded.accettato}
      clienteTelefono={loaded.clienteTelefono}
    />
  );
}
