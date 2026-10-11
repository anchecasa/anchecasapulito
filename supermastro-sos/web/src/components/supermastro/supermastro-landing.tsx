import { HardLink } from "@/components/layout/hard-link";

import { HowItWorksSteps } from "@/components/marketing/how-it-works-steps";

import { TrustStrip } from "@/components/marketing/trust-strip";

import { ClientEmailModule } from "@/components/supermastro/client-email-module";

import { HomeEntry } from "@/components/supermastro/home-entry";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";



type Props = {

  demoMode?: boolean;

  userEmail?: string | null;

  authError?: boolean;

  nuovaHref: string;

};



const HUB_SERVICES = [
  {
    title: "Sei un privato",
    body: "Entri con Google, Facebook o Apple. Poi acconto e saldo restano sulla carta.",
    href: "/supermastro/iscrizione?ruolo=privato",
    cta: "Iscriviti",
  },
  {
    title: "Sei artigiano",
    body: "Entri con lo stesso social. Nel profilo completi P.IVA, mestiere e sede. I primi tre mesi sono gratis.",
    href: "/supermastro/iscrizione?ruolo=artigiano",
    cta: "Iscriviti",
  },
] as const;



export function SuperMastroLanding({

  demoMode = false,

  userEmail,

  authError,

  nuovaHref,

}: Props) {

  const demoHref = "/supermastro/nuova";

  const startHref = demoMode ? demoHref : nuovaHref;

  const loginHref = demoMode

    ? demoHref

    : "/supermastro/auth/login?next=/supermastro/nuova";



  return (

    <>

      {authError && (

        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">

          Accesso non riuscito. Riprova.

        </div>

      )}



      {/* Mobile-first hub */}

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">

        <div className="rounded-[28px] bg-[var(--sm-paper)] px-4 py-6">
          <HomeEntry
            videoHref={
              demoMode || userEmail
                ? "/supermastro/video"
                : "/supermastro/auth/login?next=/supermastro/video"
            }
          />
        </div>



        <div className="mt-8 grid min-w-0 items-start gap-10 lg:grid-cols-2 lg:gap-14">

          <div className="min-w-0">

            <div className="hidden lg:block">

              <Badge variant="client" className="mb-4">

                Gratuito per te · SOS

              </Badge>

              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">

                Problema in casa.

              </h1>

              <p className="mt-4 text-xl text-muted">Scatta, invia, risolviamo.</p>

              <p className="mt-3 max-w-lg text-base leading-relaxed text-muted">

                Un video del guasto. SuperMastro capisce il problema e ti apre due strade: lo sistemi da solo, oppure trovi un artigiano in zona.

              </p>

            </div>



            <div className="mt-6 space-y-3 lg:mt-8">

              {HUB_SERVICES.map((s) => (

                <div

                  key={s.title}

                  className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"

                >

                  <div className="text-left">

                    <p className="font-semibold text-foreground">{s.title}</p>

                    <p className="mt-0.5 text-sm text-muted">{s.body}</p>

                  </div>

                  <Button asChild variant="client" size="sm">

                    <HardLink href={s.href}>{s.cta}</HardLink>

                  </Button>

                </div>

              ))}

            </div>



            {!demoMode && !userEmail && (

              <div className="mt-6 hidden lg:block">

                <ClientEmailModule loginHref={loginHref} />

              </div>

            )}



            {(demoMode || userEmail) && (

              <div className="mt-6 hidden lg:block">

                {userEmail && !demoMode && (

                  <p className="mb-3 text-sm text-muted">

                    Accesso come <strong className="text-foreground">{userEmail}</strong>

                  </p>

                )}

                <Button asChild variant="client" size="lg">

                  <HardLink href={startHref}>Invia richiesta SOS</HardLink>

                </Button>

              </div>

            )}

          </div>

        </div>

      </section>



      <TrustStrip

        items={[

          { value: "Video", label: "il guasto in casa" },

          { value: "Artigiani", label: "iscritti in zona" },

          { value: "19 euro", label: "dopo tre mesi gratis" },

        ]}

      />



      <HowItWorksSteps />



      <section className="bg-[var(--background)] py-14 sm:py-16">

        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">

          <h2 className="text-2xl font-semibold tracking-tight">Pronto a iniziare?</h2>

          <p className="mx-auto mt-2 max-w-lg text-muted">

            Un video del guasto. Privato e artigiano entrano con un social. L&apos;artigiano completa la P.IVA nel profilo.

          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">

            <Button asChild variant="client" size="lg">

              <HardLink href={demoMode || userEmail ? startHref : loginHref}>Fai il video</HardLink>

            </Button>

            <Button asChild variant="outline" size="lg">

              <HardLink href="/supermastro/iscrizione?ruolo=privato">Sei un privato</HardLink>

            </Button>

            <Button asChild variant="outline" size="lg">

              <HardLink href="/supermastro/iscrizione?ruolo=artigiano">Sei artigiano</HardLink>

            </Button>

          </div>

        </div>

      </section>



      <footer className="border-t border-[var(--border)] bg-white px-4 py-8 text-xs text-muted sm:px-6">

        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm text-foreground/80">SuperMastro — by AncheCasa</p>

          <div className="flex flex-wrap gap-x-5 gap-y-2">

            <HardLink href="/supermastro/iscrizione?ruolo=privato" className="hover:text-foreground">Sei un privato</HardLink>
            <HardLink href="/supermastro/storico" className="hover:text-foreground">Storico</HardLink>
            <HardLink href="/supermastro/iscrizione?ruolo=artigiano" className="hover:text-foreground">Sei artigiano</HardLink>
            <HardLink href="/supermastro/privacy" className="hover:text-foreground">Privacy</HardLink>
            <HardLink href="/supermastro/termini" className="hover:text-foreground">Termini</HardLink>
            <HardLink href="/supermastro/cookie" className="hover:text-foreground">Cookie</HardLink>
            <HardLink href="/supermastro/profilo" className="hover:text-foreground">Il mio profilo</HardLink>

          </div>

        </div>

      </footer>

    </>

  );

}


