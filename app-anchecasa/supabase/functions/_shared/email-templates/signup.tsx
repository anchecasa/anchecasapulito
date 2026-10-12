/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import { Link } from 'npm:@react-email/components@0.0.22'
import {
  BRAND,
  EnterpriseEmailLayout,
  InfoBox,
  MutedP,
  P,
} from '../email-brand/enterprise-layout.tsx'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <EnterpriseEmailLayout
    preview="Conferma il tuo profilo AncheCasa e accedi alla community."
    eyebrow="Double opt-in di sicurezza"
    title="Benvenuto in AncheCasa"
    cta={{ label: 'Conferma il tuo Profilo', href: confirmationUrl }}
    legalNote="Se non hai richiesto tu questa iscrizione, ignora il messaggio: nessun profilo verra attivato senza conferma."
  >
    <P>
      Grazie per esserti registrato su{' '}
      <Link href={siteUrl || BRAND.siteUrl} style={link}>
        <strong>AncheCasa</strong>
      </Link>
      . Prima di aprirti l'accesso ti chiediamo una conferma rapida del tuo indirizzo email.
    </P>

    <P>
      La convalida protegge il tuo profilo, riduce registrazioni non autorizzate e mantiene
      la community AncheCasa affidabile per privati, candidati e aziende.
    </P>

    <InfoBox>
      <P>
        Stai confermando l'indirizzo{' '}
        <Link href={`mailto:${recipient}`} style={link}>
          <strong>{recipient}</strong>
        </Link>
        . Il pulsante e personale e scade per ragioni di sicurezza.
      </P>
    </InfoBox>

    <MutedP>
      Dopo la conferma riceverai il Welcome Pack con il riepilogo privacy e le prime indicazioni
      operative per completare il tuo percorso su AncheCasa.
    </MutedP>
  </EnterpriseEmailLayout>
)

export default SignupEmail

const link = { color: BRAND.navySoft, textDecoration: 'underline' }
