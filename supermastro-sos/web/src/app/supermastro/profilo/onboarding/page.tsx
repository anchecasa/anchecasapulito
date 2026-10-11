import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TalentOnboardingForm } from "@/components/talent/talent-onboarding-form";

export default async function ProfiloOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/supermastro/auth/login?next=/supermastro/profilo/onboarding");

  const { data: worker } = await supabase
    .from("workers")
    .select("status, talent_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (worker?.status === "pending_verification") {
    return (
      <div className="mx-auto w-full min-w-0 max-w-lg px-4 py-8 sm:px-6">
        <div className="rounded-2xl surface-card p-6 text-center">
        <p className="text-lg font-medium">Profilo in verifica</p>
        <p className="mt-2 text-sm text-muted">
          Ti avvisiamo quando il profilo artigiano è attivo.
        </p>
        <Link href="/supermastro/profilo" className="mt-4 inline-block text-sm text-brand underline">
          Vai al profilo
        </Link>
        </div>
      </div>
    );
  }

  if (worker && !["registered", "pending_verification"].includes(worker.status)) {
    redirect("/supermastro/profilo");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-xl font-semibold">Completa il tuo profilo</h1>
        <p className="mt-1 text-sm text-muted">
          Foto e zona. Poi compari nella ricerca quando un cliente ha un guasto del tuo mestiere.
        </p>
      </div>
      <TalentOnboardingForm
        defaultEmail={user.email}
        defaultTalentType={worker?.talent_type ?? undefined}
      />
    </div>
  );
}
