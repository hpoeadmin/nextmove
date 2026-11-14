// Next Move – Lizenz
// Lizenzcodes sind signiert (ECDSA P-256) und werden offline im Browser geprüft:
// kein Server, keine Übermittlung von Daten. Codes erzeugen: node tools/lizenz.mjs neu …
(function () {
  const KEY = "nextmove.lizenz";
  // Öffentlicher Schlüssel – wird von «node tools/lizenz.mjs schluessel» eingesetzt
  // LIZENZ-SCHLUESSEL-START
  const PUBLIC_JWK = {"kty":"EC","crv":"P-256","x":"TXdJLmPU72G16QyKpRrNbflusv6VCkJ2psIeqORz8lI","y":"8HrJqV1AozlMZJdjR_wzfi5Xiw_tVi2kLYjHhZyHt8w"};
  // LIZENZ-SCHLUESSEL-ENDE

  // Kontakt für Lizenzbestellungen (z. B. E-Mail-Adresse). Leer = kein Bestell-Link.
  const KONTAKT = "hanspeter.oeschger@gmx.ch";

  const STUFEN = {
    E: { label: "Elternlizenz", profile: 3 },
    K: { label: "Klassenlizenz", profile: Infinity },
    S: { label: "Schullizenz", profile: Infinity }
  };
  const TEST_PROFILE = 1;

  let aktiv = null;   // { stufe, name, bis, id, code }
  let hinweis = null; // z. B. «Lizenz abgelaufen»

  const heute = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const datum = (iso) => {
    const [y, m, d] = String(iso).split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" });
  };
  function b64(s) {
    const t = s.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(t + "===".slice((t.length + 3) % 4));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  }

  async function pruefe(code) {
    code = String(code || "").replace(/\s+/g, "");
    const m = /^NM1-([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(code);
    if (!m) return { ok: false, grund: "Das ist kein gültiger Lizenzcode. Bitte prüfe, ob er vollständig kopiert wurde (er beginnt mit «NM1-»)." };
    if (!PUBLIC_JWK) return { ok: false, grund: "In dieser Version sind noch keine Lizenzen eingerichtet." };
    if (!window.crypto || !crypto.subtle) {
      return { ok: false, grund: "Der Code kann hier nicht geprüft werden. Öffne Next Move über eine https-Adresse." };
    }
    let info;
    try {
      const key = await crypto.subtle.importKey("jwk", PUBLIC_JWK, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
      const echt = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, b64(m[2]), new TextEncoder().encode(m[1]));
      if (!echt) return { ok: false, grund: "Dieser Lizenzcode ist ungültig. Bitte prüfe, ob er vollständig kopiert wurde." };
      const d = JSON.parse(new TextDecoder().decode(b64(m[1])));
      if (!STUFEN[d.s]) return { ok: false, grund: "Diese Lizenzart kennt diese Version von Next Move nicht." };
      info = { stufe: d.s, name: d.n || "", bis: d.b || null, id: d.i || "", code };
    } catch (e) {
      return { ok: false, grund: "Dieser Lizenzcode ist ungültig. Bitte prüfe, ob er vollständig kopiert wurde." };
    }
    if (info.bis && info.bis < heute()) {
      return { ok: false, abgelaufen: true, info, grund: `Diese Lizenz ist am ${datum(info.bis)} abgelaufen.` };
    }
    return { ok: true, info };
  }

  async function init() {
    let code = null;
    try { code = localStorage.getItem(KEY); } catch (e) { /* kein Speicher */ }
    if (!code) return;
    const r = await pruefe(code);
    if (r.ok) aktiv = r.info;
    else hinweis = r.grund;
  }

  async function aktiviere(code) {
    const r = await pruefe(code);
    if (r.ok) {
      aktiv = r.info;
      hinweis = null;
      try { localStorage.setItem(KEY, r.info.code); } catch (e) { /* kein Speicher */ }
    }
    return r;
  }

  function entfernen() {
    aktiv = null;
    hinweis = null;
    try { localStorage.removeItem(KEY); } catch (e) { /* kein Speicher */ }
  }

  // Volle Version: gültige, nicht abgelaufene Lizenz (Ablauf auch während der Nutzung prüfen)
  const voll = () => !!aktiv && (!aktiv.bis || aktiv.bis >= heute());

  window.NM_LIZENZ = {
    init, aktiviere, entfernen, voll, datum,
    info: () => aktiv,
    hinweis: () => hinweis,
    label: () => (aktiv ? STUFEN[aktiv.stufe].label : "Testversion"),
    maxProfile: () => (voll() ? STUFEN[aktiv.stufe].profile : TEST_PROFILE),
    KONTAKT
  };
})();
