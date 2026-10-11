import { getWorkerSkillLabel } from "@/lib/worker-skills";

/** Mestieri che il video può assegnare: interno di casa ed esterno, giardino compreso. */
export const VIDEO_SKILL_SLUGS = [
  "idraulico",
  "elettricista",
  "fabbro",
  "muratore",
  "imbianchino",
  "piastrellista",
  "falegname",
  "serramentista",
  "cartongesso",
  "climatizzazione",
  "lattoniere",
  "giardiniere",
  "disinfestazione",
] as const;

export type VideoSkillSlug = (typeof VIDEO_SKILL_SLUGS)[number];

export const OUT_OF_SCOPE_SLUG = "fuori_ambito";

export function isVideoSkill(slug: string): slug is VideoSkillSlug {
  return (VIDEO_SKILL_SLUGS as readonly string[]).includes(slug);
}

export function videoSkillLabel(slug: string): string {
  return getWorkerSkillLabel(slug);
}

export function videoSkillPromptLines(): string {
  return VIDEO_SKILL_SLUGS.map((slug) => `${slug} = ${getWorkerSkillLabel(slug)}`).join("\n");
}
