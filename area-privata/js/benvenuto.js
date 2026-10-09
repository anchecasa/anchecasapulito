// Pagina di benvenuto dell'invito (01.10.2026; grafica per profilo 06.10.2026): niente più moduli lunghi. Chi apre il link vede la
// mail a cui è stato mandato e sceglie la password; l'account nasce con il solo signUp.
// Il database (trigger handle_new_user_marketplace, sezione 20) lega l'account all'invito, lo verifica
// subito e mette nel profilo la categoria; il resto dei dati lo compila lui nel Profilo, al primo accesso.
(function () {
  const token = new URLSearchParams(location.search).get("invito") || "";
  const el = (id) => document.getElementById(id);
  const attesa = el("bv-attesa");
  const errorePag = el("bv-errore");
  const form = el("bv-form");
  const fine = el("bv-fine");
  let invito = null;

  // Testi e foto del lato sinistro, secondo il profilo invitato (come nelle mail d'invito).
  const PROFILI = {
    privato: {
      foto: "sito/img/priv-offerta.jpg",
      etichetta: "Invito per privati",
      titolo: "La tua casa, con le persone giuste.",
      punti: ["<b>Trovi l'artigiano giusto</b> vicino a te e gli scrivi in chat.", "<b>Mostri il guasto con un video</b> e capisci a chi chiedere.", "<b>Pubblichi gratis</b> richieste e annunci della tua casa."],
      h1: "Benvenuto in AncheCasa",
      lead: "Manca un solo passo: <strong>scegli una tua password</strong> ed entri subito.",
      nota: "Iscriversi è gratis."
    },
    azienda: {
      foto: "sito/img/az-team.jpg",
      etichetta: "Invito per aziende",
      titolo: "Nuovi clienti nella sua zona.",
      punti: ["<b>Richieste dei clienti</b> per il suo mestiere, nella sua zona.", "<b>Prima nella ricerca</b> quando un cliente cerca il suo mestiere.", "<b>Albo fornitori, gare e grandi lavori</b> dal suo profilo."],
      h1: "Benvenuto in AncheCasa",
      lead: "Manca un solo passo: <strong>scelga una sua password</strong> ed entra subito nel pannello dell'azienda.",
      nota: "Il profilo dell'azienda lo completa dopo, con calma."
    },
    agente: {
      foto: "img/ag-network.jpg",
      etichetta: "Invito per agenti",
      titolo: "Costruisci la tua rete con AncheCasa.",
      punti: ["<b>Inviti con un link personale</b>, mandato per mail.", "<b>La tua rete in chiaro</b>, livello per livello.", "<b>Guadagno tracciato</b> e contratto firmato online."],
      h1: "Benvenuto in AncheCasa",
      lead: "Manca un solo passo: <strong>scegli una tua password</strong> ed entri nel tuo pannello da agente.",
      nota: "Sei stato invitato: entri subito nel pannello."
    }
  };

  function mostraProfilo(famiglia, categoria) {
    const p = PROFILI[famiglia] || PROFILI.privato;
    el("bv-h1").textContent = p.h1;
    el("bv-lead").innerHTML = p.lead;
    el("bv-nota").textContent = p.nota;
    if (famiglia === "azienda") {
      el("bv-occhio").textContent = "Mostra";
      document.querySelector('label[for="bv-password"]').textContent = "Scelga una sua password";
    }
  }

  function mostra(quale) {
    attesa.hidden = quale !== "attesa";
    errorePag.hidden = quale !== "errore";
    form.hidden = quale !== "form";
    fine.hidden = quale !== "fine";
  }

  function conTimeout(promessa, ms) {
    return Promise.race([
      promessa,
      new Promise(function (_, rifiuta) {
        setTimeout(function () { rifiuta(new Error("Il server non risponde. Riprova tra poco.")); }, ms);
      })
    ]);
  }

  function messaggioErrore(msg) {
    const m = String(msg || "").toLowerCase();
    if (m.indexOf("già") >= 0 || m.indexOf("already") >= 0) return "Questa mail ha già un account AncheCasa. Prova a entrare dalla pagina di accesso.";
    if (m.indexOf("password") >= 0) return "La password deve avere almeno 8 caratteri.";
    if (m.indexOf("rate limit") >= 0) return "Troppi tentativi. Riprova tra qualche minuto.";
    if (m.indexOf("email") >= 0) return "La mail non sembra valida.";
    if (m.indexOf("non risponde") >= 0) return String(msg);
    return "Non sono riuscito a creare l’account. Riprova tra poco.";
  }

  function errore(testo) {
    const box = el("bv-err");
    box.textContent = testo;
    box.hidden = !testo;
    el("bv-invia").disabled = false;
  }

  if (!token || !window.acDb) {
    mostra("errore");
    return;
  }

  conTimeout(window.acDb.rpc("dati_invito", { p_token: token }), 25000)
    .then(function (res) {
      const riga = res && !res.error && Array.isArray(res.data) ? res.data[0] : null;
      if (!riga) {
        mostra("errore");
        return;
      }
      invito = riga;
      mostraProfilo(riga.famiglia, riga.categoria);
      window.acDb.rpc("apri_invito_admin", { p_token: token }).then(function () {});
      const mail = el("bv-mail");
      mail.value = riga.mail || "";
      if (riga.mail) mail.readOnly = true;
      else document.querySelector('label[for="bv-mail"]').textContent = "La tua email";
      mostra("form");
      (riga.mail ? el("bv-password") : mail).focus();
    })
    .catch(function () {
      mostra("errore");
    });

  el("bv-password").addEventListener("input", function () {
    const v = this.value;
    let f = 0;
    if (v.length >= 8) f++;
    if (v.length >= 12) f++;
    if (/[0-9]/.test(v) && /[a-zA-Z]/.test(v)) f++;
    if (/[^a-zA-Z0-9]/.test(v)) f++;
    const bar = el("bv-forza");
    bar.style.width = (v ? Math.max(15, f * 25) : 0) + "%";
    bar.style.background = f >= 3 ? "#2e8b57" : f === 2 ? "#E56B10" : "#c0392b";
  });

  el("bv-occhio").addEventListener("click", function () {
    const pw = el("bv-password");
    const mostraPw = pw.type === "password";
    pw.type = mostraPw ? "text" : "password";
    this.textContent = mostraPw ? "Nascondi" : "Mostra";
    this.setAttribute("aria-pressed", mostraPw ? "true" : "false");
    this.setAttribute("aria-label", mostraPw ? "Nascondi la password" : "Mostra la password");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errore("");
    const email = el("bv-mail").value.trim();
    const password = el("bv-password").value;
    if (!email || email.indexOf("@") < 1) return errore("Scrivi la tua mail.");
    if (password.length < 8) return errore("La password deve avere almeno 8 caratteri.");
    if (!el("bv-privacy").checked) return errore("Per continuare serve aver letto l’informativa sulla privacy.");
    el("bv-invia").disabled = true;

    conTimeout(window.acDb.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: "https://areaprivata.anchecasa.it/",
        data: { famiglia: invito.famiglia, invito: token }
      }
    }), 25000)
      .then(function (res) {
        if (res.error) throw new Error(res.error.message);
        const user = res.data && res.data.user;
        // Mail già registrata: Supabase non dà errore ma restituisce un utente senza identità.
        if (!user || (user.identities && user.identities.length === 0)) throw new Error("already registered");
        mostra("fine");
        if (res.data.session) {
          setTimeout(function () {
            location.href = "dashboard/#/" + invito.famiglia + "/bacheca";
          }, 900);
        }
      })
      .catch(function (x) {
        errore(messaggioErrore(x && x.message));
      });
  });
})();
