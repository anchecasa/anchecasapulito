/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { CodeBox, EnterpriseEmailLayout, MutedP, P } from '../email-brand/enterprise-layout.tsx'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <EnterpriseEmailLayout
    preview="Il tuo codice di verifica AncheCasa"
    eyebrow="Verifica identità"
    title="Codice di verifica"
    legalNote="Se non hai richiesto questo codice, puoi ignorare questa email."
  >
    <P>Usa il codice qui sotto per confermare la tua identità:</P>
    <CodeBox>{token}</CodeBox>
    <MutedP>Il codice scade a breve.</MutedP>
  </EnterpriseEmailLayout>
)

export default ReauthenticationEmail
