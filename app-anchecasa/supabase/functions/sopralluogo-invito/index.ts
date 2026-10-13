// sopralluogo-invito · il sopralluogo arriva al cliente SOLO per mail (12.10.2026, app-27).
//   { azione: "invia", id, mail, urgente, riepilogo, pacchetto }  (token dell'agente)
//       → prepara la pratica (ristrutturazione_prepara_invio), firma la prima foto e manda la mail del marchio:
//         foto del sopralluogo, titolo, pulsante «Guarda il tuo sopralluogo». Chi non ha account passa dall'invito
//         (benvenuto.html?invito=…&poi=…): sceglie la password e resta cliente dell'agente.
//   { azione: "vedi", t }   (pubblica, con il link segreto) → dati della pagina sopralluogo.html, foto firmate 1 ora, senza prezzi interni.
//   { azione: "ok", t }     (pubblica, con il link segreto) → il cliente conferma «Mi piace, voglio il preventivo».
// app-28 (dossier del tecnico):
//   · con "invia" parte anche la mail all'admin: «Nuovo dossier, preventivo entro…» con il link al dossier;
//   { azione: "preventivo", id, nota }  (token dell'admin o del tecnico) → fotografa il computo (solo prezzi al cliente),
//       mail al cliente «Il tuo preventivo è pronto» e all'agente; il cliente lo vede nella stessa pagina sopralluogo.html.
//   { azione: "accetta", t } (pubblica, link segreto) → il cliente accetta il preventivo; mail all'admin.
// Segreti già presenti: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM. Deploy con verify_jwt spento.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { esc, mailMarchio } from "../_shared/mail-marchio.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND = Deno.env.get("RESEND_API_KEY")!;
const FROM = Deno.env.get("RESEND_FROM") || "AncheCasa <info@anchecasa.it>";
const SITO = "https://entra.anchecasa.it";
const PUBBLICA = Deno.env.get("AC_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "sb_publishable_QbYv61SkMkjA9_GGb1hhOA_6v6GEw87";
const FOTO_PREDEFINITA = "https://anchecasa.it/assets/mail/privato.jpg";
const ADMIN_MAIL = Deno.env.get("ADMIN_MAIL") || "info@anchecasa.it";
const eur = (n: unknown) => (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const PACCHETTI: Record<string, string> = { base: "Essenziale", medio: "Comfort", alto: "Prestige" };

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const uuid = (s: unknown) => typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const data = (d: string) => new Date(d).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Rome" });

async function manda(a: string, oggetto: string, html: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [a], subject: oggetto, html }),
  });
  if (!r.ok) throw new Error("Resend: " + (await r.text()));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ errore: "metodo" }, 405);
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { return json({ errore: "richiesta_non_valida" }, 400); }

  const admin = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false } });
  const db = admin.schema("marketplace");
  const azione = String(b.azione || "");

  try {
    // ── L'agente manda il sopralluogo al cliente ──────────────────────────────
    if (azione === "invia") {
      const auth = req.headers.get("Authorization") || "";
      if (!/^Bearer\s+/i.test(auth) || !uuid(b.id)) return json({ errore: "richiesta_non_valida" }, 400);
      // La regola (chi può, quale mail, scadenza 5 giorni o 48 ore) sta nel database: la chiamiamo come l'agente.
      const comeLui = createClient(SUPABASE_URL, PUBBLICA, { auth: { persistSession: false }, global: { headers: { Authorization: auth } } });
      const { data: p, error } = await comeLui.schema("marketplace").rpc("ristrutturazione_prepara_invio", {
        p_id: b.id, p_mail: String(b.mail || ""), p_urgente: !!b.urgente,
        p_riepilogo: String(b.riepilogo || "").slice(0, 1500), p_pacchetto: String(b.pacchetto || ""),
      });
      if (error) return json({ errore: (error.message || "errore").replace(/^.*?(serve_accesso|non_trovata|non_autorizzato|pratica_chiusa|mail_non_valida|pacchetto_non_valido).*$/s, "$1") }, 400);

      // Foto di copertina: la prima foto del sopralluogo (link firmato 7 giorni), altrimenti quella del marchio.
      let foto = FOTO_PREDEFINITA;
      const { data: m } = await db.from("ristrutturazioni_media").select("path").eq("ristrutturazione_id", p.id).eq("tipo", "foto").order("creato").limit(1);
      if (m && m[0]) {
        const { data: s } = await admin.storage.from("sopralluoghi").createSignedUrl(m[0].path, 60 * 60 * 24 * 7);
        if (s?.signedUrl) foto = s.signedUrl;
      }

      const pagina = "sopralluogo.html?t=" + p.link;
      const link = p.iscritto ? `${SITO}/${pagina}` : `${SITO}/benvenuto.html?invito=${encodeURIComponent(p.invito)}&poi=${encodeURIComponent(pagina)}`;
      const nome = String(p.nome || "").split(" ")[0];
      const entro = p.urgente ? "entro 48 ore" : "entro 5 giorni";
      const punti: [string, string][] = [
        ["Le foto della tua casa", "Quelle scattate oggi, stanza per stanza, con i lavori da fare."],
        ["Il tuo progetto in breve", p.riepilogo ? esc(String(p.riepilogo).slice(0, 220)) + (String(p.riepilogo).length > 220 ? "…" : "") : "Cosa vuoi cambiare e come lo abbiamo pensato insieme."],
        [p.urgente ? "Preventivo urgente: entro 48 ore" : "Preventivo dettagliato entro 5 giorni", "Con il computo, l'impresa scelta e i tempi. Pronto per " + esc(data(p.preventivo_entro)) + "."],
      ];
      if (p.pacchetto && PACCHETTI[p.pacchetto]) punti.splice(2, 0, ["Livello di finitura: " + PACCHETTI[p.pacchetto], "Lo potrai cambiare quando vedrai il preventivo."]);

      const html = mailMarchio({
        oggetto: (nome ? nome + ", " : "") + "ecco il tuo sopralluogo AncheCasa",
        anteprima: "Foto, lavori e prossimi passi. Il preventivo dettagliato arriva " + entro + ".",
        etichetta: "Il tuo sopralluogo" + (p.comune ? " · " + esc(p.comune) : ""),
        titolo: (nome ? esc(nome) + ", il" : "Il") + " tuo sopralluogo è pronto",
        intro: esc(p.agente) + " è stato da te e ha preparato tutto qui: foto, lavori da fare e prossimi passi. Il preventivo dettagliato arriva <strong>" + entro + "</strong>.",
        punti,
        bottone: "Guarda il tuo sopralluogo",
        link,
        chiusura: p.iscritto ? "Entri con la tua mail e la tua password." : "Scegli la tua password in un attimo: da lì segui tutto, anche i messaggi con il tuo consulente.",
        passiTitolo: "Cosa succede adesso",
        passi: ["Guardi il tuo sopralluogo", "Il tecnico prepara il preventivo", "Scegli e si parte"],
        perche: "Ricevi questa mail perché " + esc(p.agente) + " ha fatto un sopralluogo a casa tua con AncheCasa. Tutte le comunicazioni passano dalla tua area privata.",
        tu: true,
        foto: "privato",
      }).replace(FOTO_PREDEFINITA, esc(foto));

      await manda(p.mail, (nome ? nome + ", " : "") + "ecco il tuo sopralluogo AncheCasa", html);
      await db.from("ristrutturazioni").update({ inviato_cliente_il: new Date().toISOString() }).eq("id", p.id);

      // Al tecnico AncheCasa (per ora l'admin): il dossier per il preventivo, con la scadenza.
      // Il video non lo legge l'IA: è un allegato di questi documenti.
      try {
        const { data: video } = await db.from("ristrutturazioni_media").select("path,nota").eq("ristrutturazione_id", p.id).eq("tipo", "video").order("creato");
        const linkVideo: string[] = [];
        for (const v of (video || []).slice(0, 6)) {
          const { data: s } = await admin.storage.from("sopralluoghi").createSignedUrl(v.path, 60 * 60 * 24 * 7);
          if (s?.signedUrl) linkVideo.push(s.signedUrl);
        }
        const voceVideo = linkVideo.length
          ? linkVideo.map((u, i) => '<a href="' + esc(u) + '">Apri il video ' + (i + 1) + "</a>").join(" · ") + ". Vale 7 giorni. L'IA non lo ha letto: è allegato a questi documenti per il preventivo."
          : "In questo sopralluogo non c'è un video.";
        const dossier = `${SITO}/dashboard/?dossier=${p.id}#/admin/ristrutturazioni-admin`;
        await manda(ADMIN_MAIL, (p.urgente ? "URGENTE 48 ore · " : "") + "Nuovo dossier: " + p.nome + (p.comune ? " · " + p.comune : ""), mailMarchio({
          oggetto: (p.urgente ? "URGENTE 48 ore · " : "") + "Nuovo dossier: " + p.nome,
          anteprima: "Preventivo da mandare entro " + data(p.preventivo_entro) + ".",
          etichetta: p.urgente ? "Urgente · 48 ore" : "Preventivo entro 5 giorni",
          titolo: "Nuovo dossier: " + esc(p.nome) + (p.comune ? " · " + esc(p.comune) : ""),
          intro: esc(p.agente) + " ha fatto il sopralluogo e l'ha mandato al cliente. Il preventivo va mandato entro <strong>" + esc(data(p.preventivo_entro)) + "</strong>.",
          punti: [
            ["Il progetto", p.riepilogo ? esc(String(p.riepilogo).slice(0, 260)) : "Vedi le note e le foto nel dossier."],
            ["Nel dossier", "Misure delle stanze, pre-computo, foto, planimetria, note vocali, dati del comune. L'IA ha letto solo le foto."],
            ["Video allegato", voceVideo],
            ["Domande all'agente", "Solo dalla chat del dossier: resta tutto nella pratica."],
          ],
          bottone: "Apri il dossier",
          link: dossier,
          chiusura: "Dal dossier compili il computo e premi «Manda il preventivo al cliente».",
          passiTitolo: "Cosa fare",
          passi: ["Controlla misure e foto", "Compila il computo", "Manda il preventivo"],
          perche: "Mail interna AncheCasa: un agente ha mandato un sopralluogo al cliente.",
          tu: true,
          foto: "agente",
        }));
      } catch (e) { console.error("mail admin", e); }
      return json({ ok: true, mail: p.mail, entro: p.preventivo_entro, urgente: p.urgente, nuovo: !p.iscritto });
    }

    // ── Il cliente apre la sua pagina (link segreto) ───────────────────────────
    if (azione === "vedi" || azione === "ok" || azione === "accetta") {
      if (!uuid(b.t)) return json({ errore: "link_non_valido" }, 400);
      const { data: r } = await db.from("ristrutturazioni")
        .select("id,nome,comune,provincia,indirizzo,descrizione,riepilogo,pacchetto,urgente,preventivo_entro,inviato_cliente_il,aperto_cliente_il,cliente_ok_il,stato,agente_id,computo,creato,preventivo,preventivo_mandato_il,preventivo_accettato_il,ia,relazione_pubblicata_il")
        .eq("link", b.t).maybeSingle();
      if (!r) return json({ errore: "link_non_valido" }, 404);

      if (azione === "ok") {
        if (!r.cliente_ok_il) await db.from("ristrutturazioni").update({ cliente_ok_il: new Date().toISOString() }).eq("id", r.id);
        return json({ ok: true });
      }
      if (azione === "accetta") {
        if (!r.preventivo || !r.preventivo_mandato_il) return json({ errore: "nessun_preventivo" }, 400);
        if (!r.preventivo_accettato_il) {
          await db.from("ristrutturazioni").update({ preventivo_accettato_il: new Date().toISOString() }).eq("id", r.id);
          try {
            await manda(ADMIN_MAIL, "Preventivo accettato: " + r.nome + " · " + eur(r.preventivo.totale), mailMarchio({
              oggetto: "Preventivo accettato: " + r.nome, anteprima: "Il cliente ha accettato il preventivo di " + eur(r.preventivo.totale) + ".",
              etichetta: "Preventivo accettato", titolo: esc(r.nome) + " ha accettato il preventivo",
              intro: "Totale " + esc(eur(r.preventivo.totale)) + (r.comune ? " · " + esc(r.comune) : "") + ". Adesso il contratto e la scelta dell'impresa.",
              punti: [["Contratto", "Preparalo dalla pratica: il cliente lo firma dal telefono."], ["Impresa", "Dalla pratica: «Affida a un'impresa»."]],
              bottone: "Apri la pratica", link: `${SITO}/dashboard/?dossier=${r.id}#/admin/ristrutturazioni-admin`,
              chiusura: "", passiTitolo: "Prossimi passi", passi: ["Contratto", "Impresa", "Cantiere"],
              perche: "Mail interna AncheCasa.", tu: true, foto: "privato",
            }));
          } catch (e) { console.error("mail accetta", e); }
        }
        return json({ ok: true });
      }
      if (!r.aperto_cliente_il) await db.from("ristrutturazioni").update({ aperto_cliente_il: new Date().toISOString() }).eq("id", r.id);

      const { data: media } = await db.from("ristrutturazioni_media").select("id,path,tipo,nota,fonte,prima_id").eq("ristrutturazione_id", r.id).eq("tipo", "foto").order("creato");
      const foto: { id: string; url: string; nota: string; fonte: string; prima_id: string | null }[] = [];
      for (const f of (media || []).slice(0, 60)) {
        const { data: s } = await admin.storage.from("sopralluoghi").createSignedUrl(f.path, 3600);
        if (s?.signedUrl) foto.push({ id: f.id, url: s.signedUrl, nota: f.nota || "", fonte: f.fonte || "agente", prima_id: f.prima_id || null });
      }
      // app-29: la relazione dell'IA, solo se il tecnico l'ha pubblicata. Senza le note interne (voci, dubbi, trascrizioni).
      let relazione = null;
      if (r.relazione_pubblicata_il && r.ia?.stato === "fatto") {
        const { voci: _v, dubbi: _d, trascrizioni: _t, video: _vi, titolo_motivo: _tm, modello: _m, errore: _e, ...pubblica } = r.ia;
        relazione = { ...pubblica, pubblicata: r.relazione_pubblicata_il };
      }
      let agente = { nome: "Il tuo consulente AncheCasa", iniziali: "AC" };
      if (r.agente_id) {
        const { data: a } = await db.from("profiles").select("nome").eq("id", r.agente_id).maybeSingle();
        if (a?.nome) agente = { nome: a.nome, iniziali: a.nome.split(/\s+/).map((x: string) => x[0] || "").join("").slice(0, 2).toUpperCase() };
      }
      // Solo le lavorazioni e le quantità: i prezzi interni restano all'admin.
      const voci = Array.isArray(r.computo) ? r.computo.slice(0, 40).map((v: Record<string, unknown>) => ({ voce: String(v.voce || ""), servizio: String(v.servizio || ""), qta: v.qta ?? null, um: String(v.um || "") })) : [];
      return json({
        nome: r.nome, comune: r.comune, provincia: r.provincia, indirizzo: r.indirizzo, descrizione: r.descrizione, riepilogo: r.riepilogo,
        pacchetto: r.pacchetto, urgente: r.urgente, preventivo_entro: r.preventivo_entro, inviato: r.inviato_cliente_il || r.creato,
        stato: r.stato, cliente_ok: !!r.cliente_ok_il, foto, voci, agente,
        relazione,
        preventivo: r.preventivo_mandato_il ? r.preventivo : null, preventivo_il: r.preventivo_mandato_il, preventivo_accettato: !!r.preventivo_accettato_il,
      });
    }

    // ── Il tecnico manda il preventivo al cliente ──────────────────────────────
    if (azione === "preventivo") {
      const auth = req.headers.get("Authorization") || "";
      if (!/^Bearer\s+/i.test(auth) || !uuid(b.id)) return json({ errore: "richiesta_non_valida" }, 400);
      const comeLui = createClient(SUPABASE_URL, PUBBLICA, { auth: { persistSession: false }, global: { headers: { Authorization: auth } } });
      const { data: p, error } = await comeLui.schema("marketplace").rpc("ristrutturazione_prepara_preventivo", { p_id: b.id, p_nota: String(b.nota || "").slice(0, 1000) });
      if (error) return json({ errore: (error.message || "errore").replace(/^.*?(non_autorizzato|non_trovata|pratica_chiusa|manca_invio_sopralluogo|computo_senza_prezzi).*$/s, "$1") }, 400);
      const nome = String(p.nome || "").split(" ")[0];
      const link = `${SITO}/sopralluogo.html?t=${p.link}`;
      await manda(p.mail, (nome ? nome + ", " : "") + "il tuo preventivo AncheCasa è pronto", mailMarchio({
        oggetto: (nome ? nome + ", " : "") + "il tuo preventivo AncheCasa è pronto",
        anteprima: "Tutte le voci, una per una. Totale " + eur(p.totale) + ".",
        etichetta: "Il tuo preventivo" + (p.comune ? " · " + esc(p.comune) : ""),
        titolo: (nome ? esc(nome) + ", il" : "Il") + " tuo preventivo è pronto",
        intro: "Il tecnico AncheCasa ha preparato il preventivo dettagliato dal sopralluogo di " + esc(p.agente) + ": <strong>" + p.voci + " voci, totale " + esc(eur(p.totale)) + "</strong> (IVA esclusa).",
        punti: [
          ["Ogni voce con quantità e prezzo", "Niente sorprese: vedi cosa paghi e perché."],
          ["Lo accetti con un tocco", "Dalla stessa pagina del tuo sopralluogo."],
          ["Domande?", "Scrivi a " + esc(p.agente) + " dalla tua area privata."],
        ],
        bottone: "Guarda il tuo preventivo",
        link,
        chiusura: "Il preventivo è nella pagina del tuo sopralluogo, insieme alle foto.",
        passiTitolo: "Cosa succede adesso",
        passi: ["Guardi il preventivo", "Lo accetti", "Contratto e si parte"],
        perche: "Ricevi questa mail perché hai chiesto un preventivo ad AncheCasa dopo il sopralluogo.",
        tu: true,
        foto: "privato",
      }));
      // All'agente: il suo cliente ha il preventivo.
      try {
        if (p.agente_id) {
          const { data: u } = await admin.auth.admin.getUserById(p.agente_id);
          const a = u?.user?.email;
          if (a) await manda(a, "Preventivo mandato a " + p.nome, mailMarchio({
            oggetto: "Preventivo mandato a " + p.nome, anteprima: "Totale " + eur(p.totale) + ".",
            etichetta: "Il tuo cliente", titolo: "Il preventivo di " + esc(p.nome) + " è partito",
            intro: "Totale " + esc(eur(p.totale)) + ". Quando lo accetta lo vedi nei tuoi sopralluoghi.",
            punti: [["Segui il cliente", "Rispondi alle sue domande dall'app."]],
            bottone: "I miei sopralluoghi", link: `${SITO}/dashboard/#/agente/re-sopralluoghi`,
            chiusura: "", passiTitolo: "Prossimi passi", passi: ["Il cliente guarda", "Accetta", "Contratto"],
            perche: "Mail interna AncheCasa.", tu: true, foto: "agente",
          }));
        }
      } catch (e) { console.error("mail agente", e); }
      return json({ ok: true, mail: p.mail, totale: p.totale });
    }

    return json({ errore: "azione_sconosciuta" }, 400);
  } catch (e) {
    console.error("sopralluogo-invito", e);
    return json({ errore: "errore_invio" }, 500);
  }
});
