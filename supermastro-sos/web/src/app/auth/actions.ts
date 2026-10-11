"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import {
  getAuthCallbackUrl,
  REGISTRATION_CONSENT_PURPOSE,
  type UserRole,
} from "@/lib/constants";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { translateAuthError } from "@/app/auth/errors";

export type AuthActionState = {
  error?: string;
  success?: string;
  directLink?: string;
};

export async function sendMagicLink(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "client") as UserRole;
  const next = String(formData.get("next") ?? "").trim() || null;

  if (!email) {
    return { error: "Inserisci la tua email." };
  }

  if (next?.startsWith("/procione") && !isAdminEmail(email)) {
    return { error: "Questa area è riservata agli admin Procione." };
  }

  const headersList = await headers();
  const origin =
    headersList.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  try {
    const redirectTo = getAuthCallbackUrl(role, origin, next);
    const admin = createAdminClient();

    // Area admin: mai il link diretto sullo schermo. Chi conosce l'email di un
    // admin non deve poter entrare: il link arriva solo nella casella email.
    if (isAdminEmail(email) || next?.startsWith("/admin")) {
      return sendEmailOnlyLink(email, redirectTo);
    }

    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (error || !data?.properties?.hashed_token) {
      return { error: translateAuthError(error?.message ?? "Link non generato.") };
    }

    if (data.user?.id) {
      const { data: adminRow } = await admin
        .from("admin_users")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (adminRow) return sendEmailOnlyLink(email, redirectTo);
    }

    const joiner = redirectTo.includes("?") ? "&" : "?";
    const directLink = `${redirectTo}${joiner}token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=magiclink`;

    return {
      success: "Clicca il pulsante verde qui sotto per entrare (link valido una sola volta).",
      directLink,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "fetch failed";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { error: "Configura SUPABASE_SERVICE_ROLE_KEY in web/.env.local" };
    }
    if (message.includes("fetch failed") || message.includes("ENOTFOUND")) {
      return {
        error:
          "Impossibile contattare Supabase. Verifica web/.env.local e riavvia il dev server.",
      };
    }
    return { error: message };
  }
}

async function sendEmailOnlyLink(email: string, redirectTo: string): Promise<AuthActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
  });
  if (error) {
    return { error: translateAuthError(error.message) };
  }
  return { success: "Ti ho mandato un link via email. Aprilo da questo dispositivo." };
}

export async function signOut(redirectTo: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(redirectTo);
}

export async function logRegistrationConsent() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("log_registration_consent", {
    p_purpose: REGISTRATION_CONSENT_PURPOSE,
    p_version: "1.0",
  });

  if (error) {
    console.error("consent log failed:", error.message);
  }
}
