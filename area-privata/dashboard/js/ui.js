(function () {
  const AC = (window.AC = window.AC || {});

  /* ---------- template con escape automatico ---------- */
  class Raw {
    constructor(s) {
      this.s = s;
    }
  }
  const raw = (s) => new Raw(String(s));
  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ESC[c]);
  function part(v) {
    if (v instanceof Raw) return v.s;
    if (Array.isArray(v)) return v.map(part).join("");
    if (v === null || v === undefined || v === false) return "";
    return esc(v);
  }
  // html`...${x}...` escapa ogni valore, tranne quelli marcati con raw() o annidati da html``
  function html(strings, ...vals) {
    let out = strings[0];
    for (let i = 0; i < vals.length; i++) out += part(vals[i]) + strings[i + 1];
    return new Raw(out);
  }

  /* ---------- formati ---------- */
  const fmt = {
    euro: (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €",
    pct: (n) => Math.round(Number(n) || 0) + "%",
    date: (s) => AC.date.fmt(s)
  };

  /* ---------- icone ---------- */
  const PATHS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    chart: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
    home: '<path d="M4 10l8-6 8 6v10H4z"/><path d="M9 20v-6h6v6"/>',
    team: '<circle cx="9" cy="8" r="3"/><path d="M3 19c0-3 3-5 6-5"/><circle cx="16" cy="8" r="3"/><path d="M14 14c3 0 6 2 6 5"/>',
    doc: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 10h8M8 14h5"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>',
    shield: '<path d="M12 3l8 4v6c0 4-3 7-8 9-5-2-8-5-8-9V7z"/>',
    calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 11h16"/>',
    folder: '<path d="M7 7h10v14H7z"/><path d="M9 7V5h6v2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.5 6.5l1.5 1.5M16 16l1.5 1.5M17.5 6.5 16 8M8 16l-1.5 1.5"/>',
    exit: '<path d="M9 7H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4"/><path d="M16 3h5v5M10 14 21 3"/>',
    building: '<path d="M4 20V10l8-6 8 6v10H4z"/>',
    wallet: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>',
    bars: '<path d="M4 19V9M10 19V5M16 19v-7"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    pulse: '<path d="M4 19h16M6 16l4-8 4 5 3-4 3 7"/>',
    plus: '<path d="M12 3v18M5 10h14"/>',
    user: '<circle cx="12" cy="8" r="3"/><path d="M5 20c1-4 3.5-6 7-6s6 2 7 6"/>',
    send: '<path d="M4 12l16-8-6 16-2-6-8-2z"/>',
    chat: '<path d="M5 6h14v10H8l-3 3z"/>',
    star: '<path d="M12 3l2.4 6.5H21l-5.2 4 2 6.5L12 16.5 6.2 20l2-6.5L3 9.5h6.6z"/>',
    circle: '<circle cx="12" cy="12" r="8"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    pause: '<path d="M9 6v12M15 6v12"/>'
  };
  function icon(name, size, color) {
    const s = size || 16;
    return raw(
      '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="' +
        (color || "currentColor") + '" stroke-width="1.8" aria-hidden="true" focusable="false">' +
        (PATHS[name] || "") + "</svg>"
    );
  }

  /* ---------- toast ---------- */
  let toastTimer = null;
  function toast(msg, kind) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.className = "toast show" + (kind === "error" ? " error" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), kind === "error" ? 5200 : 3200);
  }

  /* ---------- livelli modali (pila) ---------- */
  const layers = [];
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled])';

  function openLayer(node, opts) {
    const overlay = document.createElement("div");
    overlay.className = "modal open";
    overlay.appendChild(node);
    document.getElementById("modal-root").appendChild(overlay);
    const layer = { overlay, prev: document.activeElement, onClose: opts && opts.onClose };
    layers.push(layer);
    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) closeLayer(layer);
    });
    const first = node.querySelector("[data-autofocus]") || node.querySelector(FOCUSABLE);
    if (first) first.focus();
    return layer;
  }
  function closeLayer(layer) {
    const i = layers.indexOf(layer);
    if (i < 0) return;
    layers.splice(i, 1);
    layer.overlay.remove();
    if (layer.prev && document.contains(layer.prev) && typeof layer.prev.focus === "function") layer.prev.focus();
    if (layer.onClose) layer.onClose();
  }
  document.addEventListener("keydown", (e) => {
    const top = layers[layers.length - 1];
    if (!top) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeLayer(top);
      return;
    }
    if (e.key === "Tab") {
      const items = Array.from(top.overlay.querySelectorAll(FOCUSABLE)).filter((x) => x.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  function confirmBox(o) {
    return new Promise((resolve) => {
      const node = document.createElement("div");
      node.className = "sheet";
      node.setAttribute("role", "alertdialog");
      node.setAttribute("aria-modal", "true");
      node.setAttribute("aria-labelledby", "dlg-title");
      node.innerHTML = html`
        <h3 id="dlg-title">${o.title || "Conferma"}</h3>
        <p>${o.message}</p>
        <div class="actions">
          <button type="button" class="btn-ghost" data-x="no">Annulla</button>
          <button type="button" class="${o.danger ? "btn-danger" : "btn-in"}" data-x="yes" data-autofocus>${o.okLabel || "Conferma"}</button>
        </div>`.s;
      let done = false;
      const finish = (v) => {
        if (done) return;
        done = true;
        resolve(v);
      };
      const layer = openLayer(node, { onClose: () => finish(false) });
      node.querySelector('[data-x="yes"]').addEventListener("click", () => {
        finish(true);
        closeLayer(layer);
      });
      node.querySelector('[data-x="no"]').addEventListener("click", () => closeLayer(layer));
    });
  }

  /* ---------- form modale con validazione ---------- */
  function fieldHtml(f, v) {
    const id = "f-" + f.name;
    const req = f.required ? raw(" required") : "";
    const attrs = raw(
      (f.min !== undefined ? ' min="' + esc(f.min) + '"' : "") +
        (f.max !== undefined ? ' max="' + esc(f.max) + '"' : "") +
        (f.step !== undefined ? ' step="' + esc(f.step) + '"' : "") +
        (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "")
    );
    const val = v === undefined || v === null ? "" : v;
    let ctl;
    if (f.type === "select") {
      ctl = html`<select id="${id}" name="${f.name}"${req}>${f.options.map(
        (o) => html`<option value="${o[0]}"${String(o[0]) === String(val) ? raw(" selected") : ""}>${o[1]}</option>`
      )}</select>`;
    } else if (f.type === "textarea") {
      ctl = html`<textarea id="${id}" name="${f.name}" rows="${f.rows || 3}"${req}${f.placeholder ? raw(' placeholder="' + esc(f.placeholder) + '"') : ""}>${val}</textarea>`;
    } else if (f.type === "checkbox") {
      ctl = html`<span class="check"><input id="${id}" name="${f.name}" type="checkbox"${v ? raw(" checked") : ""}> <span>${f.checkLabel || ""}</span></span>`;
    } else {
      ctl = html`<input id="${id}" name="${f.name}" type="${f.type || "text"}" value="${val}"${req}${attrs}>`;
    }
    return html`<div class="field${f.full ? " full" : ""}">
      <label for="${id}">${f.label}${f.required ? " *" : ""}</label>
      ${ctl}
      <span class="err" id="err-${f.name}"></span>
    </div>`;
  }

  // o: { title, intro, fields, values, submitLabel, validate(values), onSubmit(values), onDelete(), deleteMessage }
  function form(o) {
    const values = o.values || {};
    const node = document.createElement("form");
    node.className = "sheet form-sheet";
    node.noValidate = true;
    node.setAttribute("role", "dialog");
    node.setAttribute("aria-modal", "true");
    node.setAttribute("aria-labelledby", "dlg-title");
    node.innerHTML = html`
      <h3 id="dlg-title">${o.title}</h3>
      ${o.intro ? html`<p>${o.intro}</p>` : ""}
      <div class="fields">${o.fields.map((f) => fieldHtml(f, values[f.name]))}</div>
      <p class="form-error" role="alert" hidden></p>
      <div class="actions">
        ${o.onDelete ? html`<button type="button" class="btn-danger" data-x="delete">Elimina</button>` : ""}
        <span class="spacer"></span>
        <button type="button" class="btn-ghost" data-x="cancel">Annulla</button>
        <button type="submit" class="btn-in">${o.submitLabel || "Salva"}</button>
      </div>`.s;

    const formError = node.querySelector(".form-error");
    const showFormError = (msg) => {
      formError.textContent = msg;
      formError.hidden = !msg;
    };
    const layer = openLayer(node);

    node.querySelector('[data-x="cancel"]').addEventListener("click", () => closeLayer(layer));

    const delBtn = node.querySelector('[data-x="delete"]');
    if (delBtn) {
      delBtn.addEventListener("click", async () => {
        const ok = await confirmBox({
          title: "Eliminare?",
          message: o.deleteMessage || "L'elemento verrà eliminato definitivamente.",
          okLabel: "Elimina",
          danger: true
        });
        if (!ok) return;
        const res = o.onDelete();
        if (res && res.error) showFormError(res.error);
        else closeLayer(layer);
      });
    }

    node.addEventListener("submit", (e) => {
      e.preventDefault();
      showFormError("");
      const out = {};
      const errors = {};
      o.fields.forEach((f) => {
        const el = node.elements[f.name];
        let v = f.type === "checkbox" ? el.checked : el.value.trim();
        if (f.type === "number") {
          if (v === "") v = null;
          else {
            v = Number(v);
            if (!Number.isFinite(v)) errors[f.name] = "Valore non valido";
          }
        }
        if (f.required && (v === "" || v === null)) errors[f.name] = "Campo obbligatorio";
        else if (f.type === "number" && v !== null && Number.isFinite(v)) {
          if (f.min !== undefined && v < f.min) errors[f.name] = "Minimo " + f.min;
          else if (f.max !== undefined && v > f.max) errors[f.name] = "Massimo " + f.max;
          else if (f.integer && !Number.isInteger(v)) errors[f.name] = "Deve essere un numero intero";
        }
        out[f.name] = v;
      });
      if (!Object.keys(errors).length && o.validate) Object.assign(errors, o.validate(out) || {});
      o.fields.forEach((f) => {
        const el = node.elements[f.name];
        const span = node.querySelector("#err-" + f.name);
        span.textContent = errors[f.name] || "";
        if (errors[f.name]) el.setAttribute("aria-invalid", "true");
        else el.removeAttribute("aria-invalid");
      });
      const bad = o.fields.find((f) => errors[f.name]);
      if (bad) {
        node.elements[bad.name].focus();
        return;
      }
      const res = o.onSubmit(out);
      if (res && res.error) {
        showFormError(res.error);
        return;
      }
      closeLayer(layer);
    });
    return layer;
  }

  /* ---------- CSV e download ---------- */
  function csvCell(v) {
    if (typeof v === "number") return String(v);
    let s = v === null || v === undefined ? "" : String(v);
    // evita che Excel interpreti il testo come formula
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function downloadCsv(filename, headers, rows) {
    const body = [headers].concat(rows).map((r) => r.map(csvCell).join(";")).join("\r\n");
    download(filename, "﻿" + body, "text/csv;charset=utf-8");
  }

  AC.ui = { Raw, raw, esc, html, fmt, icon, toast, confirm: confirmBox, form, download, downloadCsv };
})();
