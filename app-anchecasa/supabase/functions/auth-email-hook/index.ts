import * as React from 'npm:react@18.3.1'
import { Webhook } from 'npm:standardwebhooks@1.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

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
  const { subject, element } = resolveTemplate(payload, actionLink, recipient)
  const html = await renderAsync(element)
  const text = await renderAsync(element, { plainText: true })

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
