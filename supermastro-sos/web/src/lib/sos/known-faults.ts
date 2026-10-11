import type { ModelDraft } from "@/lib/sos/diagnosis-rules";
import { videoSkillLabel } from "@/lib/sos/video-skills";

export type KnownFault = {
  id: string;
  label: string;
  skill: string;
  testo: string;
};

/** Problemi già descritti nelle guide. Il server decide l'esito, il riquadro non lo sceglie. */
export const KNOWN_FAULTS: KnownFault[] = [
  {
    id: "sifone",
    label: "Perde il sifone del lavandino",
    skill: "idraulico",
    testo: "Perde acqua dal sifone sotto il lavandino.",
  },
  {
    id: "scintille",
    label: "Presa che fa scintille",
    skill: "elettricista",
    testo: "La presa fa scintille quando entra la spina.",
  },
  {
    id: "serratura",
    label: "Serratura che non gira",
    skill: "fabbro",
    testo: "La serratura non gira. Il cilindro è secco e la chiave è intera.",
  },
  {
    id: "irrigatore",
    label: "Irrigatore fermo",
    skill: "giardiniere",
    testo: "L'irrigatore del giardino non gira. La testina è piena di terra.",
  },
  {
    id: "grondaia",
    label: "Grondaia sul tetto",
    skill: "lattoniere",
    testo: "La grondaia sul tetto è piena di foglie.",
  },
  {
    id: "nido",
    label: "Nido di insetti",
    skill: "disinfestazione",
    testo: "C'è un nido di insetti vicino alla finestra.",
  },
  {
    id: "filtro",
    label: "Filtro del climatizzatore",
    skill: "climatizzazione",
    testo: "Il filtro del climatizzatore è sporco.",
  },
  {
    id: "crepa",
    label: "Crepa strutturale",
    skill: "muratore",
    testo: "C'è una crepa strutturale nel muro.",
  },
  {
    id: "pittura",
    label: "Pittura scrostata",
    skill: "imbianchino",
    testo: "La pittura è scrostata e il muro è asciutto.",
  },
  {
    id: "piastrella",
    label: "Piastrella rotta",
    skill: "piastrellista",
    testo: "Una piastrella del pavimento è rotta.",
  },
  {
    id: "anta",
    label: "Anta che non chiude",
    skill: "falegname",
    testo: "L'anta del mobile non chiude. La cerniera è allentata.",
  },
  {
    id: "finestra",
    label: "Finestra che non scorre",
    skill: "serramentista",
    testo: "La finestra non scorre. Il binario è sporco.",
  },
];

export function knownFaultById(id: string) {
  return KNOWN_FAULTS.find((fault) => fault.id === id) ?? null;
}

export function draftFromKnownFault(fault: KnownFault): ModelDraft {
  return {
    inScope: true,
    luogo: fault.skill === "giardiniere" || fault.skill === "lattoniere" ? "esterno" : "interno",
    skillSlug: fault.skill,
    skillLabel: videoSkillLabel(fault.skill),
    urgency: "medium",
    confidence: 0.9,
    summary: fault.testo,
    model: "guida",
    titolo: fault.label,
    vistoSentito: fault.testo,
    primaCosa: "",
    motivoProfessionista: "",
    tempoMinuti: null,
    difficolta: null,
    attrezzi: [],
    passi: [],
  };
}
