/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Link } from 'npm:@react-email/components@0.0.22'
import { BRAND, EnterpriseEmailLayout, MutedP, P } from '../email-brand/enterprise-layout.tsx'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ email, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <EnterpriseEmailLayout
    preview="Conferma il cambio email AncheCasa"
    eyebrow="Sicurezza account"
    title="Conferma il cambio email"
    cta={{ label: 'Conferma cambio email', href: confirmationUrl }}
    legalNote="Se non hai richiesto questa modifica, metti in sicurezza il tuo account immediatamente."
  >
    <P>
      Hai richiesto di cambiare il tuo indirizzo email su AncheCasa da{' '}
      <Link href={`mailto:${email}`} style={link}>{email}</Link> a{' '}
      <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
    </P>
    <MutedP>Clicca il pulsante per confermare la modifica.</MutedP>
  </EnterpriseEmailLayout>
)

export default EmailChangeEmail

const link = { color: BRAND.navySoft, textDecoration: 'underline' }
