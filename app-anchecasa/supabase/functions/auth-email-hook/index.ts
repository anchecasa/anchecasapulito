import * as React from 'npm:react@18.3.1'
import { Webhook } from 'npm:standardwebhooks@1.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'
// 12.10.2026: iscrizione e password con il look della mail d'invito approvata da Nando (mail/invito/mail-invito.js,
// copiata in ../_shared/mail-invito.js). La copia definisce globalThis.MailInvito.
import '../_shared/mail-invito.js'
import { mailMarchio } from '../_shared/mail-marchio.ts'

type Mail = { oggetto: string; html: string }
// deno-lint-ignore no-explicit-any
const MailInvito = (globalThis as any).MailInvito as {
  iscrizione: (famiglia: string, d: { link: string; nome?: string }) => Mail
  avviso: (tipo: string, d: { link: string; famiglia?: string; nome?: string }) => Mail
}
const FAMIGLIE = ['privato', 'azienda', 'agente', 'fornitore']

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature',
}

type AuthEmailPayload = {
  email_data?: Record<string, unknown>
  user?: { email?: string; user_metadata?: Record<string, unknown> }
  type?: string
}

const SITE_NAME = 'AncheCasa'
const SITE_URL = 'https://www.anchecasa.it'
const AUTH_FROM = 'AncheCasa Registrazioni <registrazioni@anchecasa.it>'

function hookSecretBase64(): string | null {
  const raw = Deno.env.get('SEND_EMAIL_HOOK_SECRET')?.trim()
  if (!raw) return null
  return raw.replace(/^v1,whsec_/, '')
}

function getActionLink(payload: AuthEmailPayload, supabaseUrl: string): string {
  const emailData = payload.email_data || {}
  if (emailData.action_link) return String(emailData.action_link)
  if (emailData.confirmation_url) return String(emailData.confirmation_url)

  const tokenHash = emailData.token_hash || emailData.token
  const type = emailData.email_action_type || payload.type || 'signup'
  const redirectTo = emailData.redirect_to || SITE_URL
  if (!tokenHash) return SITE_URL

  const url = new URL(`${supabaseUrl}/auth/v1/verify`)
  url.searchParams.set('token_hash', String(tokenHash))
  url.searchParams.set('type', String(type))
  url.searchParams.set('redirect_to', String(redirectTo))
  return url.toString()
}

// Iscrizione e password: le mail del marchio (stesso look dell'invito). Torna null per gli altri tipi.
function mailDelMarchio(payload: AuthEmailPayload, actionLink: string): { subject: string; html: string; text: string } | null {
  const emailData = payload.email_data || {}
  const actionType = String(emailData.email_action_type || payload.type || 'signup')
  const meta = payload.user?.user_metadata || {}
  const famiglia = FAMIGLIE.includes(String(meta.famiglia)) ? String(meta.famiglia) : 'privato'
  const nome = String(meta.nome || '').trim().split(' ')[0]
  let m: Mail | null = null
  if (actionType === 'signup') {
    if (famiglia === 'agente' && meta.invito) {
      // Agente invitato da Nando: non è una richiesta da valutare, entra subito nella rete.
      m = {
        oggetto: nome ? nome + ', benvenuto nella rete AncheCasa' : 'Benvenuto nella rete AncheCasa',
        html: mailMarchio({
          oggetto: 'Benvenuto nella rete AncheCasa', anteprima: 'Conferma la mail ed entri nel tuo pannello da agente.',
          etichetta: 'Rete AncheCasa', titolo: nome ? 'Benvenuto nella rete, ' + nome + '.' : 'Benvenuto nella rete AncheCasa.',
          intro: 'Il tuo profilo da agente è pronto. Conferma la mail con il pulsante qui sotto ed <strong>entri subito</strong> nel tuo pannello.',
          punti: [['La tua squadra e i tuoi clienti', 'Nel pannello trovi i clienti, la squadra e i tuoi numeri.'], ['La formazione', 'Le regole e i documenti per partire bene.']] as [string, string][],
          bottone: 'Conferma ed entra', link: actionLink, chiusura: 'Il link è personale e vale poco tempo.',
          passiTitolo: 'Come si parte', passi: ['Conferma la mail', 'Entra nel pannello', 'Leggi la formazione'] as [string, string, string],
          perche: 'Ricevi questa mail perché sei stato invitato nella rete AncheCasa.', tu: true, foto: 'agente' as const,
        }),
      }
    } else {
      m = MailInvito.iscrizione(famiglia, { link: actionLink, nome })
    }
  } else if (actionType === 'recovery') {
    m = MailInvito.avviso('password', { link: actionLink, famiglia })
  }
  if (!m) return null
  const text = m.oggetto + '\n\nApri questo link: ' + actionLink + '\n\nIl team AncheCasa · info@anchecasa.it'
  return { subject: m.oggetto, html: m.html, text }
}

function resolveTemplate(payload: AuthEmailPayload, actionLink: string, recipient: string) {
  const emailData = payload.email_data || {}
  const actionType = String(emailData.email_action_type || payload.type || 'signup')
  const props = {
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    recipient,
    confirmationUrl: actionLink,
  }

  switch (actionType) {
    case 'invite':
      return {
        subject: 'Il tuo invito su AncheCasa',
        element: React.createElement(InviteEmail, props),
      }
    case 'magiclink':
      return {
        subject: 'Il tuo link di accesso AncheCasa',
        element: React.createElement(MagicLinkEmail, props),
      }
    case 'recovery':
      return {
        subject: 'Reimposta la password AncheCasa',
        element: React.createElement(RecoveryEmail, props),
      }
    case 'email_change':
      return {
        subject: 'Conferma cambio email AncheCasa',
        element: React.createElement(EmailChangeEmail, {
          siteName: SITE_NAME,
          email: String(emailData.email || recipient),
          newEmail: String(emailData.new_email || emailData.newEmail || recipient),
          confirmationUrl: actionLink,
        }),
      }
    case 'reauthentication':
      return {
        subject: 'Conferma operazione sensibile AncheCasa',
        element: React.createElement(ReauthenticationEmail, {
          token: String(emailData.token || emailData.token_hash || ''),
        }),
      }
    case 'signup':
    default:
      return {
        subject: 'Conferma il tuo Profilo AncheCasa',
        element: React.createElement(SignupEmail, props),
      }
  }
}

async function parsePayload(req: Request): Promise<AuthEmailPayload | Response> {
  const rawBody = await req.text()
  const secret = hookSecretBase64()

  if (secret) {
    try {
      const wh = new Webhook(secret)
      const headers = Object.fromEntries(req.headers)
      return wh.verify(rawBody, headers) as AuthEmailPayload
    } catch (err) {
      console.error('Auth email hook signature verification failed', err)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  try {
    return JSON.parse(rawBody) as AuthEmailPayload
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const apiKey = Deno.env.get('RESEND_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  if (!apiKey || !supabaseUrl) {
    console.error('Missing RESEND_API_KEY or SUPABASE_URL')
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const parsed = await parsePayload(req)
  if (parsed instanceof Response) return parsed
  const payload = parsed

  const emailData = payload.email_data || {}
  const recipient = String(emailData.email || payload.user?.email || '')
    .trim()
    .toLowerCase()
  if (!recipient || !recipient.includes('@')) {
    return new Response(JSON.stringify({ error: 'Missing recipient email' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const actionLink = getActionLink(payload, supabaseUrl)
  let subject: string, html: string, text: string
  const marchio = mailDelMarchio(payload, actionLink)
  if (marchio) {
    ({ subject, html, text } = marchio)
  } else {
    const t = resolveTemplate(payload, actionLink, recipient)
    subject = t.subject
    html = await renderAsync(t.element)
    text = await renderAsync(t.element, { plainText: true })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: AUTH_FROM,
      to: [recipient],
      subject,
      html,
      text,
    }),
  })

  if (!res.ok) {
    const details = await res.text()
    console.error('Auth email send failed', { status: res.status, details })
    return new Response(JSON.stringify({ error: 'Failed to send auth email' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
