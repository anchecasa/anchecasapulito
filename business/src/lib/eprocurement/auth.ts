import "server-only";
import { getProcurementContext } from "@/lib/e-procurement/context";

export async function canAccessProcurement() {
  const ctx = await getProcurementContext();
  return ctx.canManageProcurement;
}
