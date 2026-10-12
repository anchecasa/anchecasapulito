import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { escHtml } from "../_shared/email-brand/brand.ts";
import { detailRow, wrapEmailHtml } from "../_shared/email-brand/wrap-html.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  destinatario_email: string;
  destinatario_nome?: string;
  titolo: string;
  categoria?: string;
  tipologia?: string;
  localita?: string;
  regione?: string;
  superficie?: string;
  prezzo_indicativo?: string;
  stato_pratica?: string;
  descrizione?: string;
  bacheca_url: string;
  note_staff?: string;
  documenti?: { label: string; url: string }[];
  opportunita_id?: string;
  site_origin?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as Payload;
    const email = payload.destinatario_email?.trim().toLowerCase();
    if (!email || !email.includes("@") || !payload.titolo?.trim()) {
      return new Response(JSON.stringify({ error: "Email e titolo obbligatori" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nome = payload.destinatario_nome?.trim() || email;
    const origin = (payload.site_origin || "https://www.anchecasa.it").replace(/\/$/, "");
    const bachecaUrl = payload.bacheca_url || `${origin}/opportunita/immobiliari`;

    const rows = [
      payload.categoria ? detailRow("Categoria", payload.categoria) : "",
      payload.tipologia ? detailRow("Tipologia", payload.tipologia) : "",
      payload.localita || payload.regione
        ? detailRow("Località", [payload.localita, payload.regione].filter(Boolean).join(", "))
        : "",
      payload.superficie ? detailRow("Superficie", payload.superficie) : "",
      payload.prezzo_indicativo ? detailRow("Prezzo indicativo", payload.prezzo_indicativo) : "",
      payload.stato_pratica ? detailRow("Stato pratica", payload.stato_pratica) : "",
    ].filter(Boolean);

    const descBlock = payload.descrizione?.trim()
      ? `<p style="margin:16px 0 0;font-size:14px;line-height:1.65;"><strong>Descrizione</strong><br/>${escHtml(payload.descrizione.trim()).replace(/\n/g, "<br/>")}</p>`
      : "";

    const docsBlock =
      payload.documenti?.length
        ? [
            '<p style="margin:18px 0 8px;font-size:14px;font-weight:700;">Documentazione</p>',
            "<ul style=\"margin:0;padding-left:18px;font-size:13px;line-height:1.6;\">",
            ...payload.documenti.map(
              (d) =>
                `<li><strong>${escHtml(d.label)}:</strong> <a href="${escHtml(d.url)}" style="color:#1e3a5f;">apri documento</a></li>`,
            ),
            "</ul>",
          ].join("")
        : "";

    const noteBlock = payload.note_staff?.trim()
      ? `<p style="margin:18px 0 0;padding:12px 14px;background:#f8fafc;border-left:3px solid #f59e0b;font-size:13px;line-height:1.6;"><strong>Nota AncheCasa</strong><br/>${escHtml(payload.note_staff.trim()).replace(/\n/g, "<br/>")}</p>`
      : "";

    const bodyHtml = [
      `<p style="margin:0 0 14px;">Gentile <strong>${escHtml(nome)}</strong>,`,
      " la selezione di AncheCasa mette a disposizione un'opportunità immobiliare riservata al network investitori qualificati.</p>",
      rows.join(""),
      descBlock,
      docsBlock,
      noteBlock,
    ].join("");

    const html = wrapEmailHtml({
      eyebrow: "Opportunità immobiliare",
      title: payload.titolo.trim(),
      bodyHtml,
      cta: { label: "Apri bacheca opportunità", href: bachecaUrl },
      signOff: "— Team AncheCasa",
      legalNote:
        "Comunicazione riservata. Per accedere alla bacheca completa potrebbe essere richiesto il codice di accesso fornito dal team commerciale.",
    });

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.log("[notify-opportunita-pacchetto] simulated", { email, titolo: payload.titolo });
      return new Response(JSON.stringify({ ok: true, simulated: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM") || "AncheCasa <info@anchecasa.it>",
        to: [email],
        subject: `[AncheCasa] Opportunità immobiliare — ${payload.titolo.trim()}`,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Resend error:", text);
      return new Response(JSON.stringify({ ok: false, error: "resend_failed", details: text }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from("contact_messages").insert({
        nome: nome,
        email,
        tipo: "opportunita_pacchetto_investitore",
        oggetto: `[AncheCasa] Opportunità — ${payload.titolo.trim()}`,
        messaggio: payload.note_staff?.trim() || payload.descrizione?.trim() || payload.titolo,
        dati_extra: { opportunita_id: payload.opportunita_id ?? null, bacheca_url: bachecaUrl },
      });
    }

    return new Response(JSON.stringify({ ok: true, emailed: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-opportunita-pacchetto:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
