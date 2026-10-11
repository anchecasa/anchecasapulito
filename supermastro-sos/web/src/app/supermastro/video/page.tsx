import type { Metadata } from "next";
import { VideoDiagnosis } from "@/components/supermastro/video-diagnosis";

export const metadata: Metadata = {
  title: "Registra il video — SuperMastro",
};

const VISTE = ["pronta", "registra", "analisi", "guasto"] as const;

type Vista = (typeof VISTE)[number];

function isVista(value: string): value is Vista {
  return (VISTE as readonly string[]).includes(value);
}

export default async function VideoPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string | string[]; testo?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.vista) ? params.vista[0] : params.vista;
  const vista = raw && isVista(raw) ? raw : undefined;
  const written = Array.isArray(params.testo) ? params.testo[0] : params.testo;
  const note = (written ?? "").trim().slice(0, 300);
  return <VideoDiagnosis vista={vista} note={note} />;
}
