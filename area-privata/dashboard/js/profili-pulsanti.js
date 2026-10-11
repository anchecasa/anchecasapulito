/* Pulsanti a quattro aspetti e pagine dell'iscrizione unica. 11.10.2026.
   Acceso, completa il profilo, attiva, nascosto. In anteprima i conti sono locali;
   con la sessione si leggono da app_stato_pulsanti(). */
(function () {
  var AC = window.AC = window.AC || {};
  var CATALOGO = {
    guasto: { nome: "Ho un guasto", cat: "privato", req: "nessuno", href: "https://anchecasa.it/supermastro" },
    trova: { nome: "Trova un artigiano o un'impresa", cat: "privato", req: "nessuno", href: "https://anchecasa.it/trova.html" },
    ristruttura: { nome: "Ristruttura con AncheCasa", cat: "privato", req: "telefono", href: "https://anchecasa.it/ristruttura.html" },
    "mio-cantiere": { nome: "Il mio cantiere", cat: "privato", req: "nessuno", soloSe: "cantiere" },
    vendo: { nome: "Vendo o affitto", cat: "privato", req: "telefono" },
    "cerco-casa": { nome: "Cerco casa", cat: "privato", req: "nessuno", href: "https://anchecasa.it/bacheca.html" },
    "cerco-lavoro": { nome: "Cerco lavoro", cat: "privato", req: "nessuno", href: "https://anchecasa.it/bacheca.html" },
    richieste: { nome: "Richieste", cat: "privato", req: "telefono" },
    chat: { nome: "Chat", cat: "privato", req: "telefono" },
    bollette: { nome: "Check Bollette", cat: "privato", req: "nessuno", href: "https://anchecasa.it/magazine" },
    segnala: { nome: "Segnala ad AncheCasa", cat: "privato", req: "nessuno" },
    corsi: { nome: "Corsi AncheSicura", cat: "privato", req: "nessuno", href: "https://sicura.anchecasa.it/corsi" },
    "ricevi-clienti": { nome: "Ricevi clienti", cat: "azienda", req: "piva_verificata" },
    "pubblico-lavoro": { nome: "Pubblico un lavoro", cat: "azienda", req: "nessuno" },
    "cerco-fornitori": { nome: "Cerco fornitori", cat: "azienda", req: "nessuno" },
    cantieri: { nome: "Cantieri", cat: "azienda", req: "modulo", modulo: "cantieri", prezzo: "29 €" },
    "sicurezza-cantiere": { nome: "Sicurezza Cantiere", cat: "azienda", req: "modulo", modulo: "sicantiere", prezzo: "19 €" },
    flash: { nome: "Sopralluogo Flash", cat: "azienda", req: "abbonamento", prezzo: "provvisorio" },
    "richieste-ricevute": { nome: "Richieste ricevute", cat: "fornitore", req: "nessuno" },
    "tutte-richieste": { nome: "Tutte le richieste della zona", cat: "fornitore", req: "abbonamento", prezzo: "99 €" },
    "rispondo-gare": { nome: "Rispondo a gare e richieste", cat: "fornitore", req: "abbonamento", prezzo: "99 €" },
    notifiche: { nome: "Notifiche", cat: "tutti", req: "nessuno" },
    profilo: { nome: "Profilo", cat: "tutti", req: "nessuno" },
    abbonamento: { nome: "Abbonamento e moduli", cat: "azienda", req: "nessuno" },
    invita: { nome: "Invita", cat: "tutti", req: "nessuno" },
    assistenza: { nome: "Assistenza", cat: "tutti", req: "nessuno", href: "mailto:info@anchecasa.it" }
  };

  function bozza() {
    try { return JSON.parse(sessionStorage.getItem("ac-iscrizione") || "null") || {}; } catch (e) { return {}; }
  }
  function telefonoFatto() {
    var b = bozza();
    return !!(b.telefono && String(b.telefono).replace(/\D/g, "").length >= 8);
  }
  function aspettoLocale(id, famiglia) {
    var c = CATALOGO[id];
    if (!c) return { aspetto: "acceso", motivo: "", passo: "", prova: false };
    var cat = famiglia === "fornitore" ? "fornitore" : famiglia;
    if (c.cat !== "tutti" && c.cat !== cat && !(c.cat === "azienda" && cat === "fornitore" && id === "abbonamento")) {
      return { aspetto: "nascosto", motivo: "Non è per questa categoria", passo: "", prova: false };
    }
    if (c.soloSe === "cantiere" && !bozza().cantiere) return { aspetto: "nascosto", motivo: "", passo: "", prova: false };
    var b = bozza();
    if (c.req === "telefono" && cat === "privato" && !telefonoFatto()) {
      return { aspetto: "completa_profilo", motivo: "Verifica il telefono: potrai pubblicare e scrivere in chat", passo: "telefono", prova: false };
    }
    if (c.req === "piva_verificata" && b.verifica !== "verificata") {
      var pivaOk = String(b.piva || "").replace(/\D/g, "").length === 11;
      if (!pivaOk) return { aspetto: "completa_profilo", motivo: "Manca la partita IVA", passo: "piva", prova: false };
      if (cat === "fornitore" && !(b.ateco || []).length) return { aspetto: "completa_profilo", motivo: "Scegli le categorie", passo: "categorie", prova: false };
      return { aspetto: "completa_profilo", motivo: "Servono i documenti: l'azienda diventa Verificata", passo: "documenti", prova: false };
    }
    if ((c.req === "abbonamento" || c.req === "modulo") && !b.abbonamento) {
      return { aspetto: "attiva", motivo: "Prova gratis", passo: "", prova: true, modulo: c.modulo || "base" };
    }
    if (c.req === "modulo" && b.abbonamento && !(b.moduli || {})[c.modulo]) {
      return { aspetto: "attiva", motivo: "Prova gratis", passo: "", prova: true, modulo: c.modulo };
    }
    return { aspetto: "acceso", motivo: "", passo: "", prova: false };
  }

  function scheda(id, famiglia) {
    var c = CATALOGO[id] || { nome: id, href: "" };
    var st = aspettoLocale(id, famiglia);
    if (st.aspetto === "nascosto") {
      return '<div class="card"><strong>Questa funzione non è nel tuo profilo.</strong></div>';
    }
    if (st.aspetto === "completa_profilo") {
      return '<div class="card"><p class="iu-lucchetto">Completa il profilo</p><strong>' + c.nome + "</strong><p>" + st.motivo + '</p><p><a class="btn" href="#/' + famiglia + '/passo/' + st.passo + '">Vai al passo</a></p></div>';
    }
    if (st.aspetto === "attiva") {
      return '<div class="card"><strong>' + c.nome + '</strong><p><span class="iu-attiva">Prova gratis</span></p><p><button type="button" class="btn" id="chiedi-modulo">Richiedi l\'attivazione</button></p><p id="esito-modulo"></p></div>';
    }
    var vai = c.href ? '<p><a class="btn" href="' + c.href + '">Apri</a></p>' : "<p>La funzione è aperta.</p>";
    return '<div class="card"><strong>' + c.nome + "</strong>" + vai + "</div>";
  }

  function registra() {
    var V = AC.views;
    if (!V) return;
    Object.keys(CATALOGO).forEach(function (id) {
      if (V[id]) return;
      V[id] = {
        title: CATALOGO[id].nome,
        sub: "Dal catalogo dei pulsanti.",
        render: function (el) {
          var fam = (window.S && S.data && S.data.famiglia) || "privato";
          el.innerHTML = scheda(id, fam);
          var b = el.querySelector("#chiedi-modulo");
          if (b) b.addEventListener("click", function () {
            el.querySelector("#esito-modulo").textContent = "Richiesta registrata. L'amministrazione attiva il modulo dopo il pagamento. La prova di 14 giorni è provvisoria.";
          });
        }
      };
    });
    V.inizio = {
      title: "Home",
      sub: "Le funzioni del tuo profilo.",
      render: function (el) {
        var fam = (window.S && S.data && S.data.famiglia) || "privato";
        var ids = fam === "fornitore"
          ? ["richieste-ricevute", "tutte-richieste", "rispondo-gare"]
          : fam === "azienda"
            ? ["ricevi-clienti", "pubblico-lavoro", "cerco-fornitori", "cantieri", "sicurezza-cantiere", "flash"]
            : ["guasto", "trova", "ristruttura", "vendo", "cerco-casa", "cerco-lavoro", "richieste", "chat", "bollette", "segnala", "corsi"];
        el.innerHTML = ids.map(function (id) {
          var st = aspettoLocale(id, fam);
          if (st.aspetto === "nascosto") return "";
          var nome = (CATALOGO[id] || {}).nome || id;
          var et = st.aspetto === "completa_profilo" ? '<span class="iu-lucchetto">Completa il profilo</span>' : st.aspetto === "attiva" ? '<span class="iu-attiva">Prova gratis</span>' : "";
          var href = st.aspetto === "completa_profilo" ? "#/" + fam + "/passo/" + (st.passo || "telefono") : "#/" + fam + "/" + id;
          var nota = st.motivo && st.motivo.indexOf("€") < 0 ? "<p>" + st.motivo + "</p>" : "";
          return '<a class="card" href="' + href + '"><strong>' + nome + "</strong> " + et + nota + "</a>";
        }).join("");
      }
    };
    V["passo"] = V["passo"] || {
      title: "Completa il profilo",
      sub: "Il passo che sblocca la funzione.",
      render: function (el) {
        var pezzi = location.hash.split("/").filter(Boolean);
        var quale = pezzi[2] || "telefono";
        if (quale === "piva") {
          el.innerHTML = '<div class="card"><strong>Partita IVA</strong><p>11 cifre.</p><label>Partita IVA <input id="piva-passo" inputmode="numeric"></label><p><button type="button" class="btn" id="salva-piva">Salva la partita IVA</button></p></div>';
          el.querySelector("#salva-piva").addEventListener("click", function () {
            var b = bozza();
            b.piva = el.querySelector("#piva-passo").value;
            try { sessionStorage.setItem("ac-iscrizione", JSON.stringify(b)); } catch (e) { /* niente */ }
            location.hash = "#/" + ((window.S && S.data && S.data.famiglia) || "azienda") + "/passo/documenti";
          });
          return;
        }
        if (quale === "categorie") {
          el.innerHTML = '<div class="card"><strong>Categorie</strong><p>Scegli almeno un codice.</p><label><input type="checkbox" name="ateco" value="41.20"> 41.20 · Costruzione di edifici</label><label><input type="checkbox" name="ateco" value="43.21"> 43.21 · Impianti elettrici</label><label><input type="checkbox" name="ateco" value="46.73"> 46.73 · Materiali edili</label><p><button type="button" class="btn" id="salva-cat">Salva le categorie</button></p></div>';
          el.querySelector("#salva-cat").addEventListener("click", function () {
            var b = bozza();
            b.ateco = Array.prototype.map.call(el.querySelectorAll('input[name="ateco"]:checked'), function (x) { return x.value; });
            try { sessionStorage.setItem("ac-iscrizione", JSON.stringify(b)); } catch (e) { /* niente */ }
            location.hash = "#/" + ((window.S && S.data && S.data.famiglia) || "azienda") + "/passo/documenti";
          });
          return;
        }
        if (quale === "documenti") {
          el.innerHTML = '<div class="card"><strong>Documenti</strong><p>Visura o un documento della ditta.</p><label>Documento <input id="doc-passo" type="file" accept=".pdf,.jpg,.jpeg,.png"></label><p><button type="button" class="btn" id="salva-doc">Invia il documento</button></p></div>';
          el.querySelector("#salva-doc").addEventListener("click", function () {
            if (!el.querySelector("#doc-passo").files[0]) { el.insertAdjacentHTML("beforeend", "<p>Scegli un file.</p>"); return; }
            el.insertAdjacentHTML("beforeend", "<p>Documento inviato. L'amministrazione lo controlla.</p>");
          });
          return;
        }
        el.innerHTML = '<div class="card"><strong>Telefono</strong><p>Finché il servizio SMS è spento, basta il numero.</p><label>Telefono <input id="tel-passo" type="tel"></label><p><button type="button" class="btn" id="salva-tel">Salva il numero</button></p></div>';
        el.querySelector("#salva-tel").addEventListener("click", function () {
          var b = bozza();
          b.telefono = el.querySelector("#tel-passo").value;
          try { sessionStorage.setItem("ac-iscrizione", JSON.stringify(b)); } catch (e) { /* niente */ }
          el.insertAdjacentHTML("beforeend", "<p>Numero salvato. Pubblicare e la chat si sbloccano.</p>");
        });
      }
    };
    V["iscrizioni-fermi"] = {
      title: "Iscrizioni: dove si fermano",
      sub: "Quante persone arrivano a ogni passo.",
      render: function (el) {
        el.innerHTML = '<div class="card"><strong>Numeri degli ultimi 7 e 30 giorni</strong><p>Con il database si leggono da app_iscrizione_dove. In anteprima non ci sono ancora eventi veri.</p><p>Esegui app-14 nell\'SQL Editor, poi questa pagina mostra i passi per categoria.</p></div>';
        if (window.acDb && acDb.rpc) {
          acDb.rpc("app_iscrizione_dove", { p_giorni: 7 }).then(function (r) {
            if (r.error || !r.data) return;
            el.insertAdjacentHTML("beforeend", "<pre>" + JSON.stringify(r.data, null, 2) + "</pre>");
          }).catch(function () {});
        }
      }
    };
    V["aziende-verifica"] = {
      title: "Aziende da verificare",
      sub: "Partita IVA e documenti.",
      render: function (el) {
        var b = bozza();
        el.innerHTML = '<div class="card"><strong>' + (b.ragione || "Nessuna azienda in questa anteprima") + "</strong><p>Partita IVA: " + (b.piva || "—") + "</p><p>Stato: " + (b.verifica || "da_verificare") + "</p>" +
          '<p><button type="button" class="btn" data-esito="verificata">Verifica</button> <button type="button" class="btn" data-esito="documento">Serve un documento</button> <button type="button" class="btn" data-esito="sospesa">Sospendi</button></p><p id="esito-ver"></p></div>';
        el.querySelectorAll("[data-esito]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var esito = btn.getAttribute("data-esito");
            var x = bozza();
            if (esito === "verificata") x.verifica = "verificata";
            if (esito === "sospesa") x.verifica = "sospesa";
            try { sessionStorage.setItem("ac-iscrizione", JSON.stringify(x)); } catch (e) { /* niente */ }
            el.querySelector("#esito-ver").textContent = esito === "documento"
              ? "Mail «Serve un documento»: in anteprima non parte. Il testo è nella pagina Mail del marchio."
              : esito === "verificata"
                ? "Azienda verificata. In anteprima la mail «La sua azienda è verificata» si vede in Mail del marchio."
                : "Azienda sospesa.";
          });
        });
      }
    };
    V["mail-marchio"] = {
      title: "Mail del marchio",
      sub: "Anteprima delle mail nuove.",
      render: function (el) {
        el.innerHTML = '<div id="anteprima-mail" class="card">Carico le mail…</div>';
        var s = document.createElement("script");
        s.src = "/dashboard/js/mail-modelli-nuove.js?v=3";
        s.onload = function () { disegnaMail(el.querySelector("#anteprima-mail")); };
        s.onerror = function () {
          var s2 = document.createElement("script");
          s2.src = "../../mail/invito/mail-invito.js";
          s2.onload = function () { disegnaMail(el.querySelector("#anteprima-mail")); };
          document.body.appendChild(s2);
        };
        document.body.appendChild(s);
      }
    };
  }

  function disegnaMail(box) {
    var I = window.MailInvito;
    if (!I) { box.textContent = "Il generatore delle mail non è arrivato."; return; }
    var voci = [
      ["Invito fornitore", I.crea("fornitore", { link: "https://anchecasa.it/iscriviti", invitante: "Paola Neri", categoria: "materiali" })],
      ["Iscrizione fornitore", I.iscrizione("fornitore", { link: "https://anchecasa.it", nome: "Forniture Rossi" })],
      ["Manca un passo", I.avviso("manca-passo", { famiglia: "privato", nome: "Mario", passo: "Verifica il telefono", link: "https://areaprivata.anchecasa.it/dashboard/#/privato/passo/telefono" })],
      ["Azienda verificata", I.avviso("verificata", { nome: "Edil Prova", link: "https://areaprivata.anchecasa.it" })],
      ["Serve un documento", I.avviso("documento", { nome: "Edil Prova", documento: "DURC", link: "https://areaprivata.anchecasa.it" })],
      ["Modulo attivo", I.avviso("modulo", { nome: "Edil Prova", modulo: "Sicurezza Cantiere", variante: "attivo", link: "https://areaprivata.anchecasa.it" })],
      ["Prova in scadenza", I.avviso("modulo", { nome: "Edil Prova", modulo: "Sicurezza Cantiere", variante: "scade", link: "https://areaprivata.anchecasa.it" })],
      ["Nuova password", I.avviso("password", { link: "https://areaprivata.anchecasa.it/nuova-password.html" })]
    ];
    box.innerHTML = "";
    voci.forEach(function (v, i) {
      var d = document.createElement("details");
      if (i === 0) d.open = true;
      var s = document.createElement("summary");
      s.textContent = v[0] + " — " + v[1].oggetto;
      var f = document.createElement("iframe");
      f.style.cssText = "width:100%;height:520px;border:1px solid #e4ebf3;background:#fff";
      f.srcdoc = v[1].html;
      d.appendChild(s);
      d.appendChild(f);
      box.appendChild(d);
    });
  }

  function barra(famiglia) {
    var b = bozza();
    var cat = famiglia === "fornitore" ? "fornitore" : famiglia;
    if (cat !== "privato" && cat !== "azienda" && cat !== "fornitore") return "";
    var fatti = telefonoFatto() || b.verifica === "verificata";
    var perc = cat === "privato" ? (b.obiettivi && b.obiettivi.length ? 40 : 20) + (telefonoFatto() ? 60 : 0) : (b.verifica === "verificata" ? 60 : 40);
    var prossimo = cat === "privato" && !telefonoFatto()
      ? "Verifica il telefono: potrai pubblicare e scrivere in chat"
      : cat !== "privato" && b.verifica !== "verificata"
        ? "Partita IVA e documenti: l'azienda diventa Verificata"
        : "Profilo al passo " + (b.passo || 1);
    return '<div class="iu-barra"><strong>Completa il profilo · ' + perc + '%</strong><div class="traccia"><div class="pieno" style="width:' + perc + '%"></div></div><p>' + prossimo + "</p>" +
      (fatti ? "" : '<p><a href="#/' + famiglia + '/passo/telefono">Vai al passo</a></p>') +
      '<p><small>La percentuale vera la calcola il database, quando app-14 è eseguito. Qui è l\'anteprima.</small></p></div>';
  }

  AC.profili = {
    dopo: function (famiglia, page, el) {
      if (!el || famiglia === "admin" || famiglia === "agente") return;
      if (!el.querySelector(".iu-barra")) el.insertAdjacentHTML("afterbegin", barra(famiglia));
    },
    aspetto: aspettoLocale
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", registra);
  else registra();
})();
