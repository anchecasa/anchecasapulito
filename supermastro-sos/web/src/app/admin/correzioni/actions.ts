"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function reviewFeedback(id: string, stato: "approvata" | "scartata") {
  const reviewer = await requireAdminAction();
  if (!UUID.test(id)) return;
  if (stato !== "approvata" && stato !== "scartata") return;
  const admin = createAdminClient();
  const revisionataDa = UUID.test(reviewer.id) ? reviewer.id : null;
  const { error } = await admin
    .from("sos_diagnosis_feedback")
    .update({ stato, revisionata_da: revisionataDa })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/correzioni");
}
