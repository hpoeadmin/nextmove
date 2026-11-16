# Next Move – Schule oder Lehre?

Web-App fürs Tablet, die Jugendlichen (ca. 14–16 Jahre) in der Schweiz hilft, sich zwischen
**Gymnasium/Kantonsschule** und **Berufslehre** (mit oder ohne BMS) zu entscheiden und passende Lehrberufe zu finden.

## Funktionen

- **8 Etappen** (ca. 15 Min.): Über mich · Schule & Noten · Interessen (32 Swipe-Karten) · Stärken ·
  Was liegt dir weniger? · Hobbys · Dies oder das (Arbeitswelt) · Schule oder Lehre? (14 Fragen)
- **Auswertung**: Weg-Empfehlung (Gymnasium / Lehre mit BMS / Lehre EFZ, Hinweise zu FMS, EBA, BM2) mit Begründung,
  «Gedanken zu deinem Weg» (Typ, Eindeutigkeit, Für und Wider, Denkanstösse),
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

## Version und Ausgabe

Next Move hat eine **Versionsnummer** und eine **Ausgabe** (z. B. «Next Move 1.1 · Ausgabe 2026/27»). Beides steht in `js/app.js`:

- `VERSION`: kleinere Anpassungen erhöhen die Zahl nach dem Punkt (1.1, 1.2 …), grössere Änderungen die Zahl davor (2.0, 2.1 …).
- `NEUERUNGEN`: Bei jeder neuen Version oben einen Eintrag ergänzen. Er erscheint auf der Infoseite unter «Was ist neu».
- `AUSGABE`: das Schuljahr, für das die Daten gelten (siehe unten).

Version und Ausgabe erscheinen auf der Startseite, in der Fusszeile, auf der Infoseite und auf jedem Ausdruck bzw. PDF.
Nach einem Update zeigt die App einmal einen Hinweis auf die neue Version. Jede veröffentlichte Version in git markieren:
`git tag v1.1`.

## Daten pflegen

**Jährliche Aktualisierung (empfohlen im März/April):** Berufe und Kantone prüfen, dann in `js/app.js`
`AUSGABE` (z. B. `"2027/28"`) und `DATENSTAND` anpassen. Die Ausgabe erscheint auf der Startseite, in der
Fusszeile, auf der Infoseite und auf jedem Ausdruck bzw. PDF.

- **Berufe:** Anreicherung (Berufsfeld, Niveau, Interessen, Beschreibung) in `tools/build_berufe.py` bearbeiten,
  dann `python3 tools/build_berufe.py` ausführen. Die SBFI-Rohdaten liegen in `tools/sbfi_grundbildungen.json`
  (Stand Oktober 2026).
- **Kantone:** Die Aufnahmebedingungen stehen in `js/data/kantone.js` (Quelle: IDES/EDK-Dossier, Mai 2024, ergänzt).
  Bitte jährlich prüfen.
- **Nach jeder Änderung** `python3 tools/build_assets.py` ausführen. Das aktualisiert die Version des
  Service Workers, damit installierte Apps die neue Version erhalten.

## Lizenzen (Testversion / Vollversion)

Ohne Lizenz läuft Next Move als **Testversion**: Alle Etappen sind spielbar. Die Auswertung zeigt die
Weg-Empfehlung und die Top 3 Berufe. Kompass, Kantonsinfos, Interessen, Berufsfelder, alle weiteren Berufe,
nächste Schritte und Gesprächsfragen sind verschwommen. Drucken/PDF, Favoriten, Export/Import und Match-%
im Berufe-Explorer sind gesperrt, und es gibt nur 1 Profil pro Gerät.

Mit einem **Lizenzcode** ist alles freigeschaltet. Stufen: Eltern (bis 3 Profile), Klasse und Schule (unbegrenzt viele Profile).
**Jede Lizenz gilt für ein Schuljahr bis 31. Juli.** Stichtag 1. April: Wird sie von August bis März ausgestellt,
gilt sie bis Ende des laufenden Schuljahrs, ab April bis Ende des nächsten. Das Werkzeug setzt das Datum automatisch. Die Codes sind signiert (ECDSA P-256) und
werden offline im Browser geprüft. Es gibt keinen Server, und es werden keine Daten übermittelt.

```
node tools/lizenz.mjs neu --stufe schule --name "Schule Musterdorf" --url https://deine-adresse.ch/
node tools/lizenz.mjs neu --stufe eltern --name "Familie Muster"
node tools/lizenz.mjs neu --stufe klasse --name "Sek Musterdorf, Klasse 2b"
node tools/lizenz.mjs pruefen NM1-…
node tools/lizenz.mjs liste
```

Das Werkzeug gibt den Code und (mit `--url`, wird gemerkt) einen **Freischalt-Link** `…/#/lizenz?c=NM1-…` aus.
Der Link öffnet die App und schaltet sie sofort frei. Alternativ fügt man den Code im Dialog «🔑 Lizenz eingeben» ein.

- Der **private Schlüssel** liegt in `~/.nextmove/lizenz-privat.jwk`, ausserhalb des Projekts. **Gut sichern**
  und nie weitergeben. Ohne ihn können keine Codes mehr erzeugt werden. Ein neuer Schlüssel macht alle
  ausgestellten Lizenzen ungültig.
- Alle ausgestellten Lizenzen werden in `~/.nextmove/lizenzen.csv` notiert (z. B. für die Rechnungsstellung).
- Kontakt für Bestellungen: `KONTAKT` in `js/lizenz.js` eintragen (erscheint im Freischalt-Dialog).
- Die Lizenz gilt pro Gerät bzw. Browser. Eine Schule gibt denselben Code für alle Tablets weiter.

## Quellen

- SBFI-Berufsverzeichnis, berufliche Grundbildungen: <https://www.becc.admin.ch/becc/public/bvz/beruf/grundbildungen>
- IDES/EDK: Übertritt in allgemeinbildende Schulen der Sekundarstufe II (kantonale Angaben)
- berufsberatung.ch (SDBB) für weiterführende Links
- Fotos: Unsplash (Unsplash-Lizenz, frei nutzbar)

Next Move ist eine Orientierungshilfe und ersetzt keine Berufsberatung.
