(function () {
  var clock = document.getElementById("clock");
  if (clock) {
    var tick = function () {
      var d = new Date();
      var h = String(d.getHours()).padStart(2, "0");
      var m = String(d.getMinutes()).padStart(2, "0");
      clock.textContent = h + " : " + m;
    };
    tick();
    setInterval(tick, 15000);
  }

  var form = document.getElementById("login-form");
  if (form && window.acDb) {
    var loginError = document.getElementById("login-error");
    var loginBtn = form.querySelector('button[type="submit"]');

    // tipo "info": riquadro arancio invece che rosso (iscrizione in attesa, non è un errore).
    function mostraErroreLogin(msg, tipo) {
      if (!loginError) return;
      loginError.textContent = msg;
      loginError.classList.toggle("info", tipo === "info");
      loginError.hidden = false;
    }

    // Il progetto Supabase condiviso ogni tanto non risponde (vedi NOTE-SCHEMA.md,
    // connessione flaky): senza un limite di tempo il pulsante resta bloccato in eterno
    // senza nessun errore, e sembra che il login "non funzioni".
    function conTimeout(promessa, ms, msgTimeout) {
      return Promise.race([
        promessa,
        new Promise(function (_, reject) {
          setTimeout(function () { reject(new Error(msgTimeout)); }, ms);
        })
      ]);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (loginError) loginError.hidden = true;
      if (loginBtn) loginBtn.disabled = true;

      var email = form.elements.email.value.trim();
      var password = form.elements.password.value;
      var msgServerLento = "Il server non risponde. Riprova tra poco.";

      conTimeout(window.acDb.auth.signInWithPassword({ email: email, password: password }), 25000, msgServerLento)
        .then(function (res) {
          if (res.error) {
            // Il messaggio originale resta in console: il testo mostrato è tradotto e più generico.
            console.warn("Login Supabase:", res.error.message);
            var msg = res.error.message === "Invalid login credentials"
              ? "Email o password non corretti."
              : res.error.message === "Email not confirmed"
                ? "Devi prima confermare la tua mail: apri il link che ti abbiamo mandato."
                : "Accesso non riuscito. Riprova.";
            throw new Error(msg);
          }
          var userId = res.data.user.id;
          return conTimeout(window.acDb.from("admins").select("id").eq("id", userId).maybeSingle(), 25000, msgServerLento)
            .then(function (adminRes) {
              if (adminRes.error) throw new Error("Accesso non riuscito. Riprova.");
              if (adminRes.data) {
                window.location.href = "dashboard/#/admin/iscritti";
                return;
              }
              return conTimeout(window.acDb.from("profiles").select("famiglia, verifica").eq("id", userId).maybeSingle(), 25000, msgServerLento)
                .then(function (profRes) {
                  if (profRes.error) throw new Error("Accesso non riuscito. Riprova.");
                  // Chi si iscrive dal sito ha subito account e profilo (trigger
                  // handle_new_user_marketplace), ma con verifica "attesa": entra solo
                  // quando l'amministrazione lo segna "verificato". Altrimenti si esce.
                  var prof = profRes.data;
                  if (!prof || prof.verifica !== "verificato") {
                    var rifiutato = prof && prof.verifica === "rifiutato";
                    var errVerifica = new Error(rifiutato
                      ? "La tua iscrizione non è stata approvata. Per informazioni contatta l'assistenza."
                      : "La tua iscrizione è in attesa di verifica. Ti contatteremo appena è approvata.");
                    if (!rifiutato) errVerifica.tipo = "info";
                    return window.acDb.auth.signOut().then(function () { throw errVerifica; }, function () { throw errVerifica; });
                  }
                  // Privato, Azienda e Agente arrivano su "La mia bacheca" (23.09.2026), non più sul Profilo.
                  window.location.href = "dashboard/#/" + prof.famiglia + "/bacheca";
                });
            });
        })
        .catch(function (err) {
          if (loginBtn) loginBtn.disabled = false;
          mostraErroreLogin(err && err.message ? err.message : "Accesso non riuscito. Riprova.", err && err.tipo);
        });
    });
  }

  var recuperoModal = document.getElementById("recupero");
  var forgotLink = document.querySelector('a.forgot[href="#recupero"]');
  if (recuperoModal && forgotLink) {
    forgotLink.addEventListener("click", function (e) {
      e.preventDefault();
      recuperoModal.classList.add("open");
    });
    recuperoModal.querySelectorAll('.actions a').forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        recuperoModal.classList.remove("open");
      });
    });
    var recuperoBtn = document.getElementById("recupero-invia");
    if (recuperoBtn && window.acDb) {
      recuperoBtn.addEventListener("click", function () {
        var emailEl = document.getElementById("recupero-email");
        var esitoEl = document.getElementById("recupero-esito");
        var email = emailEl ? emailEl.value.trim() : "";
        if (!email) return;
        recuperoBtn.disabled = true;
        // La mail parte dalla nostra funzione Edge (non dall'hook di Auth, il cui link dava
        // «Verify requires a token»): il link porta a nuova-password.html?token_hash=…
        Promise.race([
          window.acDb.functions.invoke("reset-password-marketplace", { body: { email: email } }),
          new Promise(function (resolve) {
            setTimeout(function () { resolve({ error: { message: "timeout" } }); }, 25000);
          })
        ]).then(function (res) {
          recuperoBtn.disabled = false;
          if (!esitoEl) return;
          esitoEl.hidden = false;
          if (res && res.error) {
            console.warn("Recupero password:", res.error.message);
            esitoEl.textContent = /rate limit|seconds/i.test(res.error.message)
              ? "Hai già chiesto un link da poco. Aspetta qualche minuto e riprova."
              : "Non riesco a inviare il link adesso. Riprova tra poco.";
            return;
          }
          esitoEl.textContent = "Se l'indirizzo è registrato, riceverai un'email con il link.";
        });
      });
    }
  }

  var all = document.getElementById("check-all");
  if (all) {
    all.addEventListener("change", function () {
      document.querySelectorAll("#tabella tbody input[type=checkbox]").forEach(function (box) {
        box.checked = all.checked;
      });
    });
  }

  var modal = document.getElementById("modal-new");
  var openBtn = document.getElementById("btn-new");
  var closeBtn = document.getElementById("chiudi-new");
  var confirmBtn = document.getElementById("conferma-new");
  if (openBtn && modal) {
    openBtn.addEventListener("click", function () { modal.classList.add("open"); });
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener("click", function () { modal.classList.remove("open"); });
  }
  if (confirmBtn) {
    confirmBtn.addEventListener("click", function () {
      var tbody = document.querySelector("#tabella tbody");
      if (tbody) {
        var tr = document.createElement("tr");
        var n = 160 + tbody.children.length;
        tr.innerHTML =
          "<td><input type=checkbox></td>" +
          "<td><span class=dot></span></td>" +
          "<td>AC-" + n + "</td>" +
          "<td>17.09.2026 17:20</td>" +
          "<td>18.09.2026</td>" +
          "<td>Milano</td>" +
          "<td>17:20</td>" +
          "<td>500 000 €</td>" +
          "<td>50%</td>" +
          "<td>Pratica</td>" +
          "<td><span class=\"tag new\">New</span></td>" +
          "<td>Apri</td>";
        tbody.appendChild(tr);
      }
      if (modal) modal.classList.remove("open");
    });
  }
})();
