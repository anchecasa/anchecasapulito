(function () {
  // Pagina di arrivo del link "Password dimenticata" (resetPasswordForEmail con redirectTo,
  // vedi js/app.js). Il link di Supabase porta i token nell'hash (#access_token=…&type=recovery):
  // supabase-js li legge da solo alla creazione del client e apre una sessione temporanea,
  // con cui qui si imposta la nuova password. Funziona anche per chi è già entrato e vuole
  // solo cambiare password (stessa sessione in localStorage).

  var attesa = document.getElementById("np-attesa");
  var form = document.getElementById("np-form");
  var errore = document.getElementById("np-errore");
  var esito = document.getElementById("np-esito");

  // Letto subito, prima che supabase-js ripulisca l'indirizzo: se il link è scaduto o già
  // usato, Supabase rimanda qui con error_code nell'hash (o nella query) invece dei token.
  var parametri = new URLSearchParams(location.hash.replace(/^#/, "") + "&" + location.search.replace(/^\?/, ""));
  var codiceErrore = parametri.get("error_code") || parametri.get("error");

  function conTimeout(promessa, ms) {
    return Promise.race([
      promessa,
      new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error("Il server non risponde. Riprova tra poco.")); }, ms);
      })
    ]);
  }

  function mostraEsito(titolo, testo, etichettaLink) {
    attesa.hidden = true;
    form.hidden = true;
    document.getElementById("np-esito-titolo").textContent = titolo;
    document.getElementById("np-esito-testo").textContent = testo;
    document.getElementById("np-esito-link").textContent = etichettaLink;
    esito.hidden = false;
  }

  function linkNonValido() {
    mostraEsito(
      "Link non valido",
      "Il link è scaduto o è già stato usato. Richiedine uno nuovo dal login, con «Password dimenticata».",
      "Torna al login"
    );
  }

  if (!window.acDb) {
    mostraEsito("Servizio non disponibile", "Non riesco a collegarmi. Riprova tra poco.", "Torna al login");
    return;
  }

  if (codiceErrore) {
    console.warn("Link di recupero:", codiceErrore, parametri.get("error_description") || "");
    linkNonValido();
    return;
  }

  // Link della nostra mail (funzione reset-password-marketplace): ?token_hash=…&type=recovery.
  // Il token si conferma qui con verifyOtp, che apre la sessione temporanea per la nuova password.
  var tokenHash = parametri.get("token_hash");
  var passo = tokenHash
    ? conTimeout(window.acDb.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" }), 25000).then(function (res) {
        history.replaceState(null, "", location.pathname);
        return res;
      })
    : conTimeout(window.acDb.auth.getSession(), 25000);

  passo.then(
    function (res) {
      if (res.error || !res.data || !res.data.session) {
        linkNonValido();
        return;
      }
      attesa.hidden = true;
      form.hidden = false;
      form.elements.password.focus();
    },
    function (err) {
      mostraEsito("Servizio non disponibile", err.message, "Torna al login");
    }
  );

  function mostraErrore(msg) {
    errore.textContent = msg;
    errore.hidden = false;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errore.hidden = true;
    var password = form.elements.password.value;
    var conferma = form.elements.conferma.value;
    if (password.length < 8) {
      mostraErrore("La password deve avere almeno 8 caratteri.");
      return;
    }
    if (password !== conferma) {
      mostraErrore("Le due password non coincidono.");
      return;
    }
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;

    conTimeout(window.acDb.auth.updateUser({ password: password }), 25000)
      .then(function (res) {
        if (res.error) {
          console.warn("Nuova password:", res.error.message);
          var m = res.error.message || "";
          throw new Error(
            /different from the old/i.test(m) ? "La nuova password deve essere diversa da quella di prima."
              : /session|expired|jwt/i.test(m) ? "La sessione è scaduta. Richiedi un nuovo link dal login."
              : /password/i.test(m) ? "Questa password non è accettata: scegline una più lunga o più complessa."
              : "Non riesco a salvare la password. Riprova."
          );
        }
        // Si esce subito: si rientra dal login con la password nuova, che passa anche
        // dal controllo di verifica del profilo (js/app.js).
        return window.acDb.auth.signOut().catch(function () {});
      })
      .then(function () {
        mostraEsito("Password aggiornata", "Ora puoi entrare nell'Area riservata con la nuova password.", "Vai al login");
      })
      .catch(function (err) {
        btn.disabled = false;
        mostraErrore(err.message);
      });
  });
})();
