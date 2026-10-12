/* Sopralluogo → cliente, SOLO per mail (12.10.2026, app-27). Decisioni di Nando:
   · l'invito parte in automatico per mail, mai WhatsApp; ogni comunicazione poi passa dall'area privata;
   · il cliente riceve la mail del marchio con la foto e «Guarda il tuo sopralluogo» → sceglie la password → vede la sua pagina;
   · preventivo dettagliato entro 5 giorni, 48 ore se l'agente segna «urgente». Lo prepara l'admin.
   Usata da imprese.js (pagina Sopralluoghi della rete): AC.sopralluogoInvio(box, pratica, ricarica).
   Con ?demo= non chiama nulla: mostra solo cosa succederebbe. */
(function () {
  "use strict";
  const AC = (window.AC = window.AC || {});
  const DEMO = /[?&]demo=/.test(location.search);
  const ERRORI = {
    serve_accesso: "Entra di nuovo nell'area privata.",
    non_trovata: "Pratica non trovata.",
    non_autorizzato: "Questa pratica non è tua.",
    pratica_chiusa: "La pratica è chiusa.",
    mail_non_valida: "Controlla la mail del cliente.",
    pacchetto_non_valido: "Scegli un livello di finitura.",
    errore_invio: "La mail non è partita. Riprova tra poco.",
  };
  const mailOk = (m) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m);
  const quando = (d) => new Date(d).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  AC.sopralluogoInvio = function (box, r, ricarica) {
    if (!box || !r) return;
    const esc = AC.ui.esc, toast = AC.ui.toast;
    const chiusa = r.stato === "chiusa" || r.stato === "persa";
    const stato = [];
    if (r.inviato_cliente_il) stato.push("✓ Mandato il " + quando(r.inviato_cliente_il));
    if (r.aperto_cliente_il) stato.push("👀 Aperto dal cliente il " + quando(r.aperto_cliente_il));
    if (r.cliente_ok_il) stato.push("👍 Il cliente ha detto «Mi piace» il " + quando(r.cliente_ok_il));
    if (r.preventivo_entro) stato.push((r.urgente ? "⚡ Urgente: " : "") + "preventivo entro il " + quando(r.preventivo_entro));

    box.innerHTML =
      '<h3>Manda il sopralluogo al cliente</h3>' +
      '<p class="note">Parte una mail di AncheCasa con la prima foto e il pulsante «Guarda il tuo sopralluogo». Se il cliente non ha l\'account, sceglie la password e resta tuo cliente. Niente WhatsApp: da lì tutto passa dall\'area privata.</p>' +
      (stato.length ? '<p class="note"><b>' + stato.map(esc).join("<br>") + "</b></p>" : "") +
      (chiusa ? "" :
        '<form class="prefs wide en-grid" data-inv-form>' +
        '<label>Mail del cliente<input name="mail" type="email" inputmode="email" autocomplete="off" maxlength="160" required value="' + esc(r.mail || "") + '" placeholder="nome@mail.it"></label>' +
        '<label>Livello di finitura<select name="pacchetto">' +
        [["", "Da decidere"], ["base", "Essenziale"], ["medio", "Comfort"], ["alto", "Prestige"]].map((p) => '<option value="' + p[0] + '"' + ((r.pacchetto || "") === p[0] ? " selected" : "") + ">" + p[1] + "</option>").join("") +
        "</select></label>" +
        '<label class="span2">Il progetto in breve (lo legge il cliente)<textarea name="riepilogo" maxlength="1500" placeholder="Cosa abbiamo visto, cosa vuole cambiare, misure principali">' + esc(r.riepilogo || r.nota_agente || "") + "</textarea></label>" +
        '<label class="span2" style="display:flex;gap:10px;align-items:center"><input type="checkbox" name="urgente"' + (r.urgente ? " checked" : "") + ' style="width:auto"> Urgente: preventivo in 48 ore (altrimenti entro 5 giorni)</label>' +
        '<div class="row-actions span2"><button class="btn-in" type="submit">' + (r.inviato_cliente_il ? "Manda di nuovo per mail" : "Invia al cliente per mail") + "</button></div>" +
        "</form>");

    const f = box.querySelector("[data-inv-form]");
    if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      const mail = f.mail.value.trim().toLowerCase();
      if (!mailOk(mail)) return toast("Scrivi la mail del cliente: l'invito parte solo per mail.", "error");
      const b = f.querySelector("button[type=submit]");
      const corpo = { azione: "invia", id: r.id, mail: mail, urgente: f.urgente.checked, riepilogo: f.riepilogo.value.trim(), pacchetto: f.pacchetto.value };
      b.disabled = true; b.textContent = "Invio…";

      if (DEMO || !window.acDb) {
        setTimeout(function () {
          Object.assign(r, { mail: mail, urgente: corpo.urgente, riepilogo: corpo.riepilogo, pacchetto: corpo.pacchetto,
            inviato_cliente_il: new Date().toISOString(), preventivo_entro: new Date(Date.now() + (corpo.urgente ? 48 : 120) * 3600e3).toISOString(),
            stato: ["nuova", "sopralluogo"].includes(r.stato) ? "preventivo" : r.stato });
          toast("Anteprima: la mail partirebbe a " + mail + ". Pagina cliente: sopralluogo.html?demo=1");
          AC.sopralluogoInvio(box, r, ricarica);
        }, 500);
        return;
      }

      window.acDb.functions.invoke("sopralluogo-invito", { body: corpo }).then(function (res) {
        let codice = res.error ? "errore_invio" : res.data && res.data.errore;
        if (res.error && res.error.context && typeof res.error.context.json === "function") {
          return res.error.context.json().then((d) => { throw new Error(ERRORI[d && d.errore] || ERRORI.errore_invio); }, () => { throw new Error(ERRORI.errore_invio); });
        }
        if (codice) throw new Error(ERRORI[codice] || ERRORI.errore_invio);
        toast("Mail mandata a " + res.data.mail + (res.data.urgente ? " · preventivo urgente in 48 ore." : " · preventivo entro 5 giorni."));
        if (typeof ricarica === "function") ricarica();
      }).catch(function (x) {
        b.disabled = false; b.textContent = "Invia al cliente per mail";
        toast((x && x.message) || ERRORI.errore_invio, "error");
      });
    });
  };
})();
