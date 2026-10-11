export type OrgGestita = { id: string; nome: string };

export type ProcurementContext = {
  configured: boolean;
  userId: string | null;
  canManageProcurement: boolean;
  orgs: OrgGestita[];
};

export type DocumentoGara = {
  id: string;
  gara: string;
  nome: string;
  sha256: string;
  byte: number;
};

export type GaraPrivata = {
  id: string;
  org: string;
  titolo: string;
  descrizione: string;
  stato: "bozza" | "pubblicata" | "chiusa";
  scadenza: string | null;
  creato: string;
  documenti: DocumentoGara[];
};

export type EsitoAzione = { errore: string; fatto: string };
