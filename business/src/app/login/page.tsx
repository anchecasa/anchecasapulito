import { redirect } from "next/navigation";
import { supabaseConfigurato } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function destinazioneSicura(valore: string | undefined) {
  if (!valore || !valore.startsWith("/") || valore.startsWith("//") || valore.startsWith("/login")) {
    return "/admin";
  }
  return valore;
}

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; errore?: string }>;
}) {
  const parametri = await searchParams;
  const dopo = destinazioneSicura(parametri.next);
  if (!supabaseConfigurato()) {
    return (
      <main className="mx-auto flex min-h-full w-full max-w-md flex-col gap-4 px-6 py-16">
        <h1 className="text-3xl font-semibold text-[#1A2432]">Accesso</h1>
        <p className="text-base text-[#2A3C54]">
          Manca il collegamento a Supabase. Il cruscotto resta aperto finché non ci sono le chiavi.
        </p>
      </main>
    );
  }

  async function entra(form: FormData) {
    "use server";
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const next = destinazioneSicura(String(form.get("next") ?? ""));
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      redirect(`/login?next=${encodeURIComponent(next)}&errore=1`);
    }
    redirect(next);
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col gap-6 px-6 py-16">
      <header>
        <p className="text-sm font-semibold text-[#E56B10]">AncheCasa</p>
        <h1 className="mt-1 text-3xl font-semibold text-[#1A2432]">Entra nel cruscotto</h1>
      </header>
      {parametri.errore ? (
        <p className="rounded-2xl bg-[#F8E6E1] px-4 py-3 text-base text-[#1A2432]" role="alert">
          Accesso non riuscito. Controlla mail e password.
        </p>
      ) : null}
      <form action={entra} className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-4">
        <input type="hidden" name="next" value={dopo} />
        <label className="flex flex-col gap-1 text-sm font-semibold text-[#1A2432]">
          Mail
          <input name="email" type="email" required autoComplete="username" className="min-h-11 rounded-xl border border-[#E7D3C3] px-3 text-base font-normal" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-[#1A2432]">
          Password
          <input name="password" type="password" required autoComplete="current-password" className="min-h-11 rounded-xl border border-[#E7D3C3] px-3 text-base font-normal" />
        </label>
        <button type="submit" className="min-h-11 rounded-full bg-[#E56B10] px-5 text-base font-semibold text-white">
          Entra
        </button>
      </form>
    </main>
  );
}
