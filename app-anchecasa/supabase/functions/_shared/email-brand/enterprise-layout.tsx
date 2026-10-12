/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import { BRAND } from './brand.ts'

export { BRAND }

type EnterpriseEmailLayoutProps = {
  preview: string
  eyebrow?: string
  title: string
  children: React.ReactNode
  cta?: { label: string; href: string }
  legalNote?: string
  unsubscribeUrl?: string | null
  signOff?: React.ReactNode
  /** Override logo (default: AncheCasa) */
  logoUrl?: string
  logoAlt?: string
  logoWidth?: number
  tagline?: string | null
}

export const EnterpriseEmailLayout = ({
  preview,
  eyebrow,
  title,
  children,
  cta,
  legalNote,
  unsubscribeUrl,
  signOff,
  logoUrl,
  logoAlt,
  logoWidth,
  tagline,
}: EnterpriseEmailLayoutProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={outer}>
        <Section style={heroBanner}>
          <Img
            src={logoUrl || BRAND.logoUrl}
            alt={logoAlt || BRAND.name}
            width={String(logoWidth ?? 120)}
            height="auto"
            style={logoImg}
          />
          {tagline === null ? null : (
            <Text style={heroTagline}>{tagline ?? BRAND.tagline}</Text>
          )}
        </Section>

        <Section style={card}>
          {eyebrow ? <Text style={eyebrowStyle}>{eyebrow}</Text> : null}
          <Heading style={h1}>{title}</Heading>
          {children}

          {cta ? (
            <Section style={ctaWrap}>
              <Button href={cta.href} style={ctaButton}>
                {cta.label}
              </Button>
            </Section>
          ) : null}

          {signOff ? <Text style={signOffStyle}>{signOff}</Text> : null}
        </Section>

        <Section style={footer}>
          <Text style={footerTitle}>{BRAND.name} — Comunicazione istituzionale</Text>
          <Text style={footerText}>
            Per assistenza scrivi a{' '}
            <Link href={`mailto:${BRAND.supportEmail}`} style={footerLink}>
              {BRAND.supportEmail}
            </Link>
            . Per temi privacy:{' '}
            <Link href={`mailto:${BRAND.privacyEmail}`} style={footerLink}>
              {BRAND.privacyEmail}
            </Link>
            .
          </Text>
          {legalNote ? <Text style={footerText}>{legalNote}</Text> : null}
          {unsubscribeUrl ? (
            <Text style={footerText}>
              <Link href={unsubscribeUrl} style={footerLink}>
                Gestisci le preferenze email
              </Link>
            </Text>
          ) : null}
          <Hr style={footerRule} />
          <Text style={microText}>
            © {new Date().getFullYear()} {BRAND.name} —{' '}
            <Link href={BRAND.siteUrl} style={footerLink}>
              {BRAND.siteUrl.replace('https://', '')}
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const P = ({ children }: { children: React.ReactNode }) => (
  <Text style={paragraph}>{children}</Text>
)

export const MutedP = ({ children }: { children: React.ReactNode }) => (
  <Text style={mutedParagraph}>{children}</Text>
)

export const InfoBox = ({ children }: { children: React.ReactNode }) => (
  <Section style={infoBox}>{children}</Section>
)

export const Bullet = ({ children }: { children: React.ReactNode }) => (
  <Text style={bullet}>• {children}</Text>
)

export const CodeBox = ({ children }: { children: React.ReactNode }) => (
  <Text style={codeBox}>{children}</Text>
)

export const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <Text style={detailRow}>
    <strong>{label}:</strong> {value}
  </Text>
)

const main: React.CSSProperties = {
  backgroundColor: BRAND.paper,
  fontFamily: 'Arial, Helvetica, sans-serif',
  margin: 0,
}

const outer: React.CSSProperties = {
  maxWidth: '580px',
  margin: '0 auto',
  padding: '20px 12px',
}

const heroBanner: React.CSSProperties = {
  backgroundColor: BRAND.navy,
  padding: '36px 30px 28px',
  textAlign: 'center',
  borderRadius: '8px 8px 0 0',
}

const logoImg: React.CSSProperties = {
  margin: '0 auto 12px',
  display: 'block',
}

const heroTagline: React.CSSProperties = {
  color: '#dde7f4',
  fontSize: '13px',
  fontWeight: 600,
  margin: 0,
  lineHeight: 1.4,
}

const card: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: `1px solid ${BRAND.line}`,
  borderTop: 0,
  padding: '32px 30px 28px',
}

const eyebrowStyle: React.CSSProperties = {
  color: BRAND.amberDark,
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '1.1px',
  margin: '0 0 10px',
  textTransform: 'uppercase',
}

const h1: React.CSSProperties = {
  color: BRAND.ink,
  fontSize: '22px',
  fontWeight: 700,
  lineHeight: 1.3,
  margin: '0 0 18px',
}

const paragraph: React.CSSProperties = {
  color: BRAND.body,
  fontSize: '14px',
  lineHeight: 1.65,
  margin: '0 0 14px',
}

const mutedParagraph: React.CSSProperties = {
  color: BRAND.muted,
  fontSize: '12px',
  lineHeight: 1.6,
  margin: '0 0 12px',
}

const infoBox: React.CSSProperties = {
  backgroundColor: BRAND.hintBg,
  border: `1px solid ${BRAND.hintBorder}`,
  borderRadius: '8px',
  margin: '18px 0',
  padding: '16px 18px',
}

const bullet: React.CSSProperties = {
  color: BRAND.body,
  fontSize: '13px',
  lineHeight: 1.55,
  margin: '0 0 8px',
}

const detailRow: React.CSSProperties = {
  color: BRAND.body,
  fontSize: '14px',
  lineHeight: 1.55,
  margin: '0 0 8px',
}

const codeBox: React.CSSProperties = {
  backgroundColor: BRAND.paper,
  border: `2px solid ${BRAND.amber}`,
  borderRadius: '8px',
  color: BRAND.ink,
  display: 'inline-block',
  fontFamily: 'Courier, monospace',
  fontSize: '26px',
  fontWeight: 700,
  letterSpacing: '4px',
  margin: '8px 0 20px',
  padding: '12px 24px',
}

const ctaWrap: React.CSSProperties = {
  textAlign: 'center',
  margin: '26px 0 8px',
}

const ctaButton: React.CSSProperties = {
  backgroundColor: BRAND.amber,
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: 700,
  padding: '14px 36px',
  textDecoration: 'none',
}

const signOffStyle: React.CSSProperties = {
  color: BRAND.muted,
  fontSize: '13px',
  lineHeight: 1.6,
  margin: '20px 0 0',
}

const footer: React.CSSProperties = {
  backgroundColor: '#eef3f8',
  border: `1px solid ${BRAND.line}`,
  borderRadius: '0 0 8px 8px',
  borderTop: 0,
  padding: '22px 30px 26px',
}

const footerTitle: React.CSSProperties = {
  color: BRAND.navy,
  fontSize: '11px',
  fontWeight: 700,
  margin: '0 0 8px',
}

const footerText: React.CSSProperties = {
  color: BRAND.muted,
  fontSize: '11px',
  lineHeight: 1.6,
  margin: '0 0 8px',
}

const footerLink: React.CSSProperties = {
  color: BRAND.navySoft,
  textDecoration: 'underline',
}

const footerRule: React.CSSProperties = {
  borderColor: BRAND.line,
  margin: '14px 0 10px',
}

const microText: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '10px',
  lineHeight: 1.5,
  margin: 0,
}
