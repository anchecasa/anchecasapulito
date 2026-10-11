/** Costanti brand conmotionate per tutte le email AncheCasa. */
export const BRAND = {
  name: 'AncheCasa',
  tagline: 'Il ponte tra grandi opere, imprese e talenti.',
  logoUrl:
    'https://edsvmnxojsmknjuhobqa.supabase.co/storage/v1/object/public/email-assets/logo-anchecasa-email.png',
  siteUrl: 'https://www.anchecasa.it',
  supportEmail: 'info@anchecasa.it',
  privacyEmail: 'privacy@anchecasa.it',
  navy: '#1e3a5f',
  navySoft: '#243b5c',
  amber: '#e6960a',
  amberDark: '#d97706',
  ink: '#1e3a5f',
  body: '#55575d',
  muted: '#777777',
  line: '#e5e7eb',
  paper: '#f4f5f7',
  hintBg: '#fff8eb',
  hintBorder: '#fad9a3',
} as const

export function escHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
