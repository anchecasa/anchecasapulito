import { z } from "zod";

export const schemaBozza = z.object({
  org: z.string().uuid(),
  titolo: z.string().trim().min(3).max(180),
  descrizione: z.string().trim().max(4000).optional().default(""),
  scadenza: z.string().trim().optional().default(""),
});

export const schemaGara = z.object({
  gara: z.string().uuid(),
});
