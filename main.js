// main.js
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const btnAmbient = $("#btnAmbient");
  const btnRedact = $("#btnRedact");
  const ambientState = $("#ambientState");
  const redactState = $("#redactState");
  const stamp = $("#stamp");
  const year = $("#year");

  const btnScramble = $("#btnScramble");
  const btnCopy = $("#btnCopy");
  const copyHint = $("#copyHint");

  // --- Date stamp
  const now = new Date();
  stamp.textContent = now.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
  year.textContent = String(now.getFullYear());

  // --- Persisted settings
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : JSON.parse(v);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }
  };

  const state = {
    ambient: store.get("prop_ambient", true),
    redacted: store.get("prop_redacted", false),
  };

  function apply() {
    document.body.classList.toggle("no-ambient", !state.ambient);
    document.body.classList.toggle("redacted", state.redacted);

    btnAmbient.setAttribute("aria-pressed", String(state.ambient));
    btnRedact.setAttribute("aria-pressed", String(state.redacted));

    ambientState.textContent = state.ambient ? "ON" : "OFF";
    redactState.textContent = state.redacted ? "ON" : "OFF";

    store.set("prop_ambient", state.ambient);
    store.set("prop_redacted", state.redacted);
  }

  btnAmbient?.addEventListener("click", () => {
    state.ambient = !state.ambient;
    apply();
  });

  btnRedact?.addEventListener("click", () => {
    state.redacted = !state.redacted;
    apply();
  });

  // --- Scramble effect (simple “bande abîmée”)
  const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@!?/\\|<>[]{}=+-_";
  function scrambleText(el, durationMs = 900) {
    const original = el.textContent;
    const start = performance.now();

    function frame(t) {
      const p = Math.min(1, (t - start) / durationMs);
      const keep = Math.floor(original.length * p);

      let out = "";
      for (let i = 0; i < original.length; i++) {
        const ch = original[i];
        if (i < keep || ch === "\n") out += ch;
        else out += SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
      }
      el.textContent = out;

      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = original;
    }
    requestAnimationFrame(frame);
  }

  btnScramble?.addEventListener("click", () => {
    $$(".incantation .inc-text").forEach(pre => scrambleText(pre, 950));
  });

  // --- Copy currently “visible” fragment (first one)
  btnCopy?.addEventListener("click", async () => {
    const first = $(".incantation .inc-text");
    if (!first) return;

    try {
      await navigator.clipboard.writeText(first.textContent);
      copyHint.textContent = "Fragment copié dans le presse-papiers.";
      setTimeout(() => (copyHint.textContent = ""), 1600);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = first.textContent;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        copyHint.textContent = "Fragment copié (mode compatibilité).";
        setTimeout(() => (copyHint.textContent = ""), 1600);
      } finally {
        document.body.removeChild(ta);
      }
    }
  });

  apply();
})();
