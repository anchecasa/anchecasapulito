import type { Metadata } from "next";
import { VideoDiagnosis } from "@/components/supermastro/video-diagnosis";

export const metadata: Metadata = { title: "Video — SuperMastro" };

export default async function VideoRoute({
  searchParams,
}: {
  searchParams: Promise<{ testo?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.testo) ? params.testo[0] : params.testo;
  const note = (raw ?? "").trim().slice(0, 300);
  return <VideoDiagnosis contained flowBase="/m" homeHref="/m/home" note={note} />;
}
