# Next Move – Schule oder Lehre?

Web-App fürs Tablet, die Jugendlichen (ca. 14–16 Jahre) in der Schweiz hilft, sich zwischen
**Gymnasium/Kantonsschule** und **Berufslehre** (mit oder ohne BMS) zu entscheiden und passende Lehrberufe zu finden.

## Funktionen

- **8 Etappen** (ca. 15 Min.): Über mich · Schule & Noten · Interessen (32 Swipe-Karten) · Stärken ·
  Was liegt dir weniger? · Hobbys · Dies oder das (Arbeitswelt) · Schule oder Lehre? (11 Fragen)
- **Auswertung**: Weg-Empfehlung (Gymnasium / Lehre mit BMS / Lehre EFZ, Hinweise zu FMS, EBA, BM2) mit Begründung,
  Kompass (Neigung Schule ↔ Praxis, schulische Voraussetzungen), kantonale Aufnahmebedingungen,
  Interessenprofil, Top-Berufsfelder, Top-Berufe mit Match-%, nächste Schritte, Gesprächsfragen, Notizfeld.
  Druck bzw. PDF für das Gespräch mit Eltern oder der Berufsberatung.
- **Berufe entdecken**: alle 247 beruflichen Grundbildungen (EFZ/EBA) aus dem SBFI-Berufsverzeichnis mit
  Kurzbeschreibung, Lehrdauer, Fachrichtungen, BM-Richtung, Suche, Filter, Favoriten und Links.
- **Antworten ändern & neu starten** jederzeit; mehrere Profile pro Tablet.
- **Datenschutz**: alles bleibt lokal im Browser (localStorage), kein Server, kein Login. Export/Import als JSON.
- **Offline-fähig** (PWA) und als App auf den Homescreen installierbar.

## Starten

Kein Build nötig, es ist reines HTML/CSS/JavaScript.

- **Lokal testen:** `python3 -m http.server 8000` im Projektordner, dann <http://localhost:8000> öffnen.
- **Veröffentlichen:** den ganzen Ordner (ohne `tools/`) auf einen beliebigen Webserver mit HTTPS laden,
  z. B. Netlify, GitHub Pages oder den Schulserver.
- **Auf dem iPad:** Seite in Safari öffnen → Teilen → «Zum Home-Bildschirm».

`index.html` lässt sich auch direkt per Doppelklick öffnen. Offline-Modus und Installation funktionieren aber nur über http(s).

## Projektstruktur

```
index.html              Einstieg
css/app.css             Design (inkl. Druck-Layout)
js/app.js               Ansichten, Navigation, Speicherung
js/engine.js            Auswertung: Weg-Empfehlung und Berufs-Matching
js/data/berufe.js       247 Berufe (generiert)
js/data/kantone.js      Aufnahme Gymnasium/BMS je Kanton
js/data/fragen.js       Fragen, Swipe-Karten, Stärken, Hobbys
img/                    Fotos (Unsplash-Lizenz)
tools/                  Generatoren und SBFI-Rohdaten
sw.js                   Service Worker (generiert)
```

## Daten pflegen

- **Berufe:** Anreicherung (Berufsfeld, Niveau, Interessen, Beschreibung) in `tools/build_berufe.py` bearbeiten,
  dann `python3 tools/build_berufe.py` ausführen. Die SBFI-Rohdaten liegen in `tools/sbfi_grundbildungen.json`
  (Stand Oktober 2026).
- **Kantone:** Die Aufnahmebedingungen stehen in `js/data/kantone.js` (Quelle: IDES/EDK-Dossier, Mai 2024, ergänzt).
  Bitte jährlich prüfen.
- **Nach jeder Änderung** `python3 tools/build_assets.py` ausführen. Das aktualisiert die Version des
  Service Workers, damit installierte Apps die neue Version erhalten.

## Quellen

- SBFI-Berufsverzeichnis, berufliche Grundbildungen: <https://www.becc.admin.ch/becc/public/bvz/beruf/grundbildungen>
- IDES/EDK: Übertritt in allgemeinbildende Schulen der Sekundarstufe II (kantonale Angaben)
- berufsberatung.ch (SDBB) für weiterführende Links
- Fotos: Unsplash (Unsplash-Lizenz, frei nutzbar)

Next Move ist eine Orientierungshilfe und ersetzt keine Berufsberatung.
