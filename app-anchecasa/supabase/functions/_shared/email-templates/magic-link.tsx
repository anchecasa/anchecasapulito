/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { EnterpriseEmailLayout, MutedP, P } from '../email-brand/enterprise-layout.tsx'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <EnterpriseEmailLayout
    preview="Il tuo link di accesso AncheCasa"
    eyebrow="Accesso rapido"
    title="Il tuo link di accesso"
    cta={{ label: 'Accedi ad AncheCasa', href: confirmationUrl }}
    legalNote="Se non hai richiesto questo link, puoi ignorare questa email."
  >
    <P>Clicca il pulsante per accedere alla piattaforma. Il link scade a breve per la tua sicurezza.</P>
    <MutedP>Non condividere questo link con altri: e strettamente personale.</MutedP>
  </EnterpriseEmailLayout>
)

export default MagicLinkEmail
