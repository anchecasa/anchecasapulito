/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { EnterpriseEmailLayout, MutedP, P } from '../email-brand/enterprise-layout.tsx'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <EnterpriseEmailLayout
    preview="Reimposta la tua password AncheCasa"
    eyebrow="Sicurezza account"
    title="Reimposta la password"
    cta={{ label: 'Reimposta password', href: confirmationUrl }}
    legalNote="Se non hai richiesto il reset, ignora questa email: la password non verrà modificata."
  >
    <P>
      Abbiamo ricevuto una richiesta per reimpostare la password del tuo account AncheCasa.
      Clicca il pulsante qui sotto per sceglierne una nuova.
    </P>
    <MutedP>Il link è personale e scade per motivi di sicurezza.</MutedP>
  </EnterpriseEmailLayout>
)

export default RecoveryEmail
