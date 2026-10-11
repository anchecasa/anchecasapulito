import { BRAND, escHtml } from './brand.ts'

export type WrapEmailOptions = {
  title: string
  bodyHtml: string
  eyebrow?: string
  cta?: { label: string; href: string }
  legalNote?: string
  signOff?: string
}

const TAG = 'div'

export function wrapEmailHtml(opts: WrapEmailOptions): string {
  const eyebrow = opts.eyebrow
    ? `<p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:${BRAND.amberDark};">${opts.eyebrow}</p>`
    : ''
  const cta = opts.cta
    ? `<p style="text-align:center;margin:26px 0 8px;"><a href="${opts.cta.href}" style="display:inline-block;background:${BRAND.amber};color:#fff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:8px;text-decoration:none;">${opts.cta.label}</a></p>`
    : ''
  const legal = opts.legalNote
    ? `<p style="margin:0 0 8px;font-size:11px;line-height:1.6;color:${BRAND.muted};">${opts.legalNote}</p>`
    : ''
  const signOff = opts.signOff
    ? `<p style="margin:20px 0 0;font-size:13px;color:${BRAND.muted};line-height:1.6;">${opts.signOff}</p>`
    : ''

  const o = (style: string) => `<${TAG} style="${style}">`
  const c = `</${TAG}>`

  return [
    '<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>',
    `<body style="margin:0;padding:0;background:${BRAND.paper};font-family:Arial,Helvetica,sans-serif;">`,
    o('max-width:580px;margin:0 auto;padding:20px 12px'),
    o(`background:${BRAND.navy};padding:36px 30px 28px;text-align:center;border-radius:8px 8px 0 0`),
    `<img src="${BRAND.logoUrl}" alt="${BRAND.name}" width="120" style="display:block;margin:0 auto 12px;height:auto;" />`,
    `<p style="margin:0;color:#dde7f4;font-size:13px;font-weight:600;line-height:1.4;">${BRAND.tagline}</p>`,
    c,
    o(`background:#fff;border:1px solid ${BRAND.line};border-top:0;padding:32px 30px 28px`),
    eyebrow,
    `<h1 style="margin:0 0 18px;font-size:22px;font-weight:700;color:${BRAND.ink};line-height:1.3;">${opts.title}</h1>`,
    o(`font-size:14px;line-height:1.65;color:${BRAND.body}`),
    opts.bodyHtml,
    c,
    cta,
    signOff,
    c,
    o(`background:#eef3f8;border:1px solid ${BRAND.line};border-top:0;border-radius:0 0 8px 8px;padding:22px 30px 26px`),
    `<p style="margin:0 0 8px;font-size:11px;font-weight:700;color:${BRAND.navy};">${BRAND.name} — Comunicazione istituzionale</p>`,
    `<p style="margin:0 0 8px;font-size:11px;line-height:1.6;color:${BRAND.muted};">Per assistenza: <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.navySoft};">${BRAND.supportEmail}</a> · Privacy: <a href="mailto:${BRAND.privacyEmail}" style="color:${BRAND.navySoft};">${BRAND.privacyEmail}</a></p>`,
    legal,
    `<p style="margin:14px 0 0;font-size:10px;color:#94a3b8;">© ${new Date().getFullYear()} ${BRAND.name} — <a href="${BRAND.siteUrl}" style="color:${BRAND.navySoft};">anchecasa.it</a></p>`,
    c,
    c,
    '</body></html>',
  ].join('')
}

export function detailRow(label: string, value: string): string {
  return `<p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:${BRAND.body};"><strong>${escHtml(label)}:</strong> ${escHtml(value)}</p>`
}
