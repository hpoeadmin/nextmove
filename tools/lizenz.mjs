#!/usr/bin/env node
// Next Move – Lizenzcodes erzeugen und prüfen (Node.js, keine Zusatzpakete nötig)
//
//   node tools/lizenz.mjs schluessel
//       Einmalig: Schlüsselpaar erzeugen. Der private Schlüssel kommt nach ~/.nextmove/
//       (NIE ins Projekt, NIE weitergeben, aber sichern!). Der öffentliche Schlüssel
//       wird in js/lizenz.js eingesetzt.
//
//   node tools/lizenz.mjs neu --stufe schule --name "Schule Musterdorf" [--url https://…]
//       Lizenzcode erzeugen. Stufen: eltern | klasse | schule.
//       Jede Lizenz gilt bis Ende Schuljahr (31. Juli). Stichtag 1. April: ausgestellt
//       August–März → bis 31. Juli des laufenden Schuljahrs, April–Juli → bis 31. Juli des nächsten.
//       --url merkt sich die Adresse der App und gibt zusätzlich einen Freischalt-Link aus.
//
//   node tools/lizenz.mjs pruefen NM1-…      Code prüfen und anzeigen
//   node tools/lizenz.mjs liste              Alle ausgestellten Lizenzen anzeigen
//
// Ablageort ändern: Umgebungsvariable NM_LIZENZ_DIR.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { subtle } = globalThis.crypto;
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIR = process.env.NM_LIZENZ_DIR || path.join(os.homedir(), ".nextmove");
const PRIV = path.join(DIR, "lizenz-privat.jwk");
const CONF = path.join(DIR, "config.json");
const LOG = path.join(DIR, "lizenzen.csv");
const APPJS = path.join(ROOT, "js", "lizenz.js");
const STUFEN = { eltern: "E", klasse: "K", schule: "S" };
const LABEL = { E: "Elternlizenz", K: "Klassenlizenz", S: "Schullizenz" };
const ALG = { name: "ECDSA", namedCurve: "P-256" };
const SIG = { name: "ECDSA", hash: "SHA-256" };

const stop = (msg) => { console.error("Fehler: " + msg); process.exit(1); };
const b64 = (buf) => Buffer.from(buf).toString("base64url");

function args(list) {
  const o = { _: [] };
  for (let i = 0; i < list.length; i++) {
    if (list[i].startsWith("--")) o[list[i].slice(2)] = list[i + 1] && !list[i + 1].startsWith("--") ? list[++i] : true;
    else o._.push(list[i]);
  }
  return o;
}
function config() { try { return JSON.parse(fs.readFileSync(CONF, "utf8")); } catch { return {}; } }
function privatSchluessel() {
  if (!fs.existsSync(PRIV)) stop(`Kein privater Schlüssel in ${PRIV}. Zuerst: node tools/lizenz.mjs schluessel`);
  return JSON.parse(fs.readFileSync(PRIV, "utf8"));
}
function oeffentlich(jwk) { const { kty, crv, x, y } = jwk; return { kty, crv, x, y }; }
// Jede Lizenz gilt bis 31. Juli (Ende Schuljahr). Stichtag 1. April:
// ausgestellt August bis März → bis Ende des laufenden Schuljahrs,
// ausgestellt April bis Juli → bis Ende des nächsten Schuljahrs.
function ablauf(d = new Date()) {
  const jahr = d.getMonth() <= 2 ? d.getFullYear() : d.getFullYear() + 1; // Januar–März: dieses Jahr
  return `${jahr}-07-31`;
}
function csv(v) { return /[",\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v); }

async function schluessel() {
  if (fs.existsSync(PRIV)) {
    stop(`Es gibt bereits einen Schlüssel (${PRIV}).\nEin neuer Schlüssel macht ALLE ausgestellten Lizenzen ungültig. Wenn das gewollt ist, die Datei zuerst selbst verschieben.`);
  }
  const paar = await subtle.generateKey(ALG, true, ["sign", "verify"]);
  const priv = await subtle.exportKey("jwk", paar.privateKey);
  fs.mkdirSync(DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(PRIV, JSON.stringify(priv), { mode: 0o600 });
  setzeOeffentlich(oeffentlich(priv));
  console.log(`Privater Schlüssel gespeichert: ${PRIV}`);
  console.log("→ Bitte sichern (z. B. Passwort-Manager). Ohne diese Datei können keine Codes mehr erzeugt werden.");
  console.log(`Öffentlicher Schlüssel eingesetzt in: ${path.relative(ROOT, APPJS)}`);
  console.log("→ Danach python3 tools/build_assets.py ausführen und die App neu veröffentlichen.");
}

function setzeOeffentlich(pub) {
  const src = fs.readFileSync(APPJS, "utf8");
  const re = /(\/\/ LIZENZ-SCHLUESSEL-START\n)[\s\S]*?(\n\s*\/\/ LIZENZ-SCHLUESSEL-ENDE)/;
  if (!re.test(src)) stop("Markierungen LIZENZ-SCHLUESSEL in js/lizenz.js nicht gefunden.");
  fs.writeFileSync(APPJS, src.replace(re, `$1  const PUBLIC_JWK = ${JSON.stringify(pub)};$2`));
}

async function neu(o) {
  const s = STUFEN[String(o.stufe || "").toLowerCase()];
  if (!s) stop("--stufe eltern | klasse | schule angeben.");
  const name = typeof o.name === "string" ? o.name.trim() : "";
  if (!name) stop('--name angeben, z. B. --name "Schule Musterdorf" oder --name "Familie Muster".');
  if (o.bis !== undefined) stop("Das Ablaufdatum wird automatisch gesetzt (31. Juli, Stichtag 1. April). --bis gibt es nicht mehr.");
  const bis = ablauf();

  const conf = config();
  if (typeof o.url === "string") { conf.url = o.url.replace(/[#?].*$/, ""); fs.writeFileSync(CONF, JSON.stringify(conf, null, 2)); }

  const id = Buffer.from(globalThis.crypto.getRandomValues(new Uint8Array(4))).toString("hex");
  const daten = { s, n: name, i: id, b: bis };
  const teil = b64(new TextEncoder().encode(JSON.stringify(daten)));
  const key = await subtle.importKey("jwk", privatSchluessel(), ALG, false, ["sign"]);
  const sig = await subtle.sign(SIG, key, new TextEncoder().encode(teil));
  const code = `NM1-${teil}.${b64(sig)}`;

  if (!fs.existsSync(LOG)) fs.writeFileSync(LOG, "ausgestellt,nr,stufe,name,gueltig_bis,code\n");
  fs.appendFileSync(LOG, [new Date().toISOString().slice(0, 10), id, LABEL[s], name, bis, code].map(csv).join(",") + "\n");

  console.log(`${LABEL[s]} für «${name}» · Nr. ${id} · gültig bis ${bis}\n`);
  console.log("Code:\n" + code + "\n");
  if (conf.url) console.log("Freischalt-Link (antippen genügt):\n" + `${conf.url}#/lizenz?c=${code}` + "\n");
  console.log(`Notiert in ${LOG}`);
}

async function pruefen(code) {
  const m = /^NM1-([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(String(code || "").replace(/\s+/g, ""));
  if (!m) stop("Das ist kein Lizenzcode (NM1-…).");
  const key = await subtle.importKey("jwk", oeffentlich(privatSchluessel()), ALG, false, ["verify"]);
  const ok = await subtle.verify(SIG, key, Buffer.from(m[2], "base64url"), new TextEncoder().encode(m[1]));
  if (!ok) stop("Signatur ungültig – dieser Code stammt nicht von deinem Schlüssel oder ist beschädigt.");
  const d = JSON.parse(Buffer.from(m[1], "base64url").toString("utf8"));
  const heute = new Date().toISOString().slice(0, 10);
  console.log(`Gültig signiert: ${LABEL[d.s] || d.s} für «${d.n}» · Nr. ${d.i} · ${d.b ? (d.b < heute ? "ABGELAUFEN am " : "gültig bis ") + d.b : "unbefristet"}`);
}

function liste() {
  if (!fs.existsSync(LOG)) return console.log("Noch keine Lizenzen ausgestellt.");
  const zeilen = fs.readFileSync(LOG, "utf8").trim().split("\n").slice(1);
  for (const z of zeilen) console.log(z.split(",").slice(0, 5).join("  ·  "));
  console.log(`\n${zeilen.length} Lizenz(en) · Datei: ${LOG}`);
}

const o = args(process.argv.slice(2));
const befehl = o._[0];
if (befehl === "schluessel") await schluessel();
else if (befehl === "neu") await neu(o);
else if (befehl === "pruefen") await pruefen(o._[1]);
else if (befehl === "liste") liste();
else console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("\nimport ")[0].replace(/^#!.*\n/, "").replace(/^\/\/ ?/gm, ""));
