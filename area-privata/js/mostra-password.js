(function () {
  // Pulsante «Mostra / Nascondi» su ogni campo password dei moduli .login-form
  // (login e nuova-password). Stile in css/kit.css (.pw-wrap, .pw-occhio).
  document.querySelectorAll(".login-form input[type='password']").forEach(function (campo) {
    var wrap = document.createElement("div");
    wrap.className = "pw-wrap";
    campo.parentNode.insertBefore(wrap, campo);
    wrap.appendChild(campo);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pw-occhio";
    btn.textContent = "Mostra";
    btn.setAttribute("aria-label", "Mostra la password");
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", function () {
      var visibile = campo.type === "password";
      campo.type = visibile ? "text" : "password";
      btn.textContent = visibile ? "Nascondi" : "Mostra";
      btn.setAttribute("aria-label", visibile ? "Nascondi la password" : "Mostra la password");
      btn.setAttribute("aria-pressed", visibile ? "true" : "false");
      campo.focus();
    });
    wrap.appendChild(btn);
  });
})();
