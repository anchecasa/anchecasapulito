import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Ingresso admin esistente: SSO da IN Jobs (con link alternativo via email). */
export const ADMIN_LOGIN_PATH = "/admin-sso";

type AdminState = { user: User | null; admin: boolean };

/**
 * Admin = email in ADMIN_EMAILS (come Procione e middleware MFA)
 * oppure riga in public.admin_users (come le policy RLS).
 */
export async function adminState(): Promise<AdminState> {
  let user: User | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user ?? null;
  } catch {
    return { user: null, admin: false };
  }
  if (!user) return { user: null, admin: false };
  if (isAdminEmail(user.email)) return { user, admin: true };
  try {
    const { data } = await createAdminClient()
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    return { user, admin: Boolean(data) };
  } catch {
    return { user, admin: false };
  }
}

/** Per layout e pagine admin: senza login va all'accesso, senza permessi 404. */
export async function requireAdminPage(): Promise<User> {
  const { user, admin } = await adminState();
  if (!user) redirect(ADMIN_LOGIN_PATH);
  if (!admin) notFound();
  return user;
}

/** Per ogni server action admin: controllo sul server, sempre. */
export async function requireAdminAction(): Promise<{ id: string; email: string }> {
  const { user, admin } = await adminState();
  if (!user || !admin) throw new Error("Non autorizzato.");
  return { id: user.id, email: user.email ?? user.id };
}
