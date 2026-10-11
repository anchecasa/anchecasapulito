import Image from "next/image";

export type MascotPose =
  | "saluta"
  | "idraulico"
  | "elettricista"
  | "muratore"
  | "generico"
  | "viso"
  | "cuore";

const POSE: Record<MascotPose, { src: string; width: number; height: number }> = {
  saluta: { src: "/images/procione-1.png", width: 1024, height: 1024 },
  idraulico: { src: "/images/procione-3.png", width: 1024, height: 1024 },
  elettricista: { src: "/images/procione-4.png", width: 1024, height: 1024 },
  muratore: { src: "/images/procione-5.png", width: 1024, height: 1024 },
  generico: { src: "/images/procione-2.png", width: 1024, height: 1024 },
  viso: { src: "/images/supermastro-icona.png", width: 1024, height: 1024 },
  cuore: { src: "/images/supermastro-mezzobusto.png", width: 861, height: 578 },
};

const IDRAULICO = ["idraulico", "climatizzazione"];
const ELETTRICISTA = ["elettricista"];
const MURATORE = ["muratore", "piastrellista", "imbianchino", "cartongesso"];

function norm(slug: string) {
  return slug
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]+/g, " ")
    .trim();
}

export function poseForSkill(slug: string): MascotPose {
  const s = norm(slug);
  const hit = (words: string[]) => words.some((word) => s === word || s.includes(word));
  if (hit(IDRAULICO)) return "idraulico";
  if (hit(ELETTRICISTA)) return "elettricista";
  if (hit(MURATORE)) return "muratore";
  return "generico";
}

type Props = {
  pose: MascotPose;
  size: number;
  alt?: string;
  speech?: string;
  /** Solo sulla home. In Next 16 corrisponde a preload. */
  priority?: boolean;
};

export function Mascot({ pose, size, alt = "", speech, priority = false }: Props) {
  const img = POSE[pose];
  const picture = (
    <Image
      src={img.src}
      alt={alt}
      width={img.width}
      height={img.height}
      sizes={`${size}px`}
      preload={priority}
      style={{ width: size, height: "auto" }}
    />
  );

  if (!speech) return picture;

  return (
    <div className="flex w-full items-center gap-3">
      <span className="shrink-0">{picture}</span>
      <p className="min-w-0 flex-1 rounded-2xl border border-[var(--sm-ink)]/15 bg-white px-4 py-3 text-base font-semibold leading-snug text-[var(--sm-ink)]">
        {speech}
      </p>
    </div>
  );
}
