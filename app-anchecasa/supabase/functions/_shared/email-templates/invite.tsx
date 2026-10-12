/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Link } from 'npm:@react-email/components@0.0.22'
import { BRAND, EnterpriseEmailLayout, MutedP, P } from '../email-brand/enterprise-layout.tsx'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteUrl, confirmationUrl }: InviteEmailProps) => (
  <EnterpriseEmailLayout
    preview="Sei stato invitato su AncheCasa"
    eyebrow="Invito piattaforma"
    title="Sei stato invitato!"
    cta={{ label: 'Accetta invito', href: confirmationUrl }}
    legalNote="Se non ti aspettavi questo invito, puoi ignorare questa email."
  >
    <P>
      Sei stato invitato a unirti a{' '}
      <Link href={siteUrl || BRAND.siteUrl} style={link}>
        <strong>AncheCasa</strong>
      </Link>
      . Clicca il pulsante per accettare l&apos;invito e creare il tuo account.
    </P>
    <MutedP>Dopo l&apos;accesso potrai completare il profilo dalla dashboard.</MutedP>
  </EnterpriseEmailLayout>
)

export default InviteEmail

const link = { color: BRAND.navySoft, textDecoration: 'underline' }
