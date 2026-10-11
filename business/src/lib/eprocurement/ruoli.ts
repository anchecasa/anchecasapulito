export const RUOLO_ACQUIRENTE = "general_contractor_buyer";

export function ruoloAbilitato(admin: boolean, ruoli: readonly string[]) {
  return admin || ruoli.includes(RUOLO_ACQUIRENTE);
}
