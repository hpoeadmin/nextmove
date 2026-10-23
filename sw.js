// Automatisch erzeugt mit tools/build_assets.py – macht Next Move offline nutzbar.
const CACHE = "nextmove-37bc00a12d";
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css",
  "js/app.js",
  "js/engine.js",
  "js/data/berufe.js",
  "js/data/fragen.js",
  "js/data/kantone.js",
  "img/bau-baustelle.jpg",
  "img/bau-team.jpg",
  "img/beratung-gespraech.jpg",
  "img/berge-morgen.jpg",
  "img/bms-lernen.jpg",
  "img/buero-arbeit.jpg",
  "img/buero-team.jpg",
  "img/elektro-installation.jpg",
  "img/elektronik-platine.jpg",
  "img/fahrzeug-motor.jpg",
  "img/fahrzeug-service.jpg",
  "img/feinwerk-werkstatt.jpg",
  "img/fotografie.jpg",
  "img/garten-blumen.jpg",
  "img/gastro-koch.jpg",
  "img/gastro-kochen.jpg",
  "img/gebaeudetechnik-rohre.jpg",
  "img/gestaltung-design.jpg",
  "img/gestaltung-digital.jpg",
  "img/gestaltung-farbe.jpg",
  "img/gesundheit-dental.jpg",
  "img/gesundheit-fachfrau.jpg",
  "img/gesundheit-stethoskop.jpg",
  "img/gruppe-zusammen.jpg",
  "img/gymi-bibliothek.jpg",
  "img/gymi-klasse.jpg",
  "img/gymi-studierende.jpg",
  "img/hero-freunde.jpg",
  "img/holz-handwerk.jpg",
  "img/hotel.jpg",
  "img/informatik-coding.jpg",
  "img/informatik-team.jpg",
  "img/kultur-buehne.jpg",
  "img/labor-glas.jpg",
  "img/lehre-technik.jpg",
  "img/logistik-lager.jpg",
  "img/metall-funken.jpg",
  "img/metall-schweissen.jpg",
  "img/musik-instrumente.jpg",
  "img/nahrung-brot.jpg",
  "img/natur-feld.jpg",
  "img/natur-setzlinge.jpg",
  "img/natur-wald.jpg",
  "img/planung-zeichnen.jpg",
  "img/reinigung-recycling.jpg",
  "img/sanitaer.jpg",
  "img/schoenheit-haare.jpg",
  "img/schweiz-alpen.jpg",
  "img/soziales-betreuung.jpg",
  "img/soziales-kinder.jpg",
  "img/sport-fitness.jpg",
  "img/team-lachen.jpg",
  "img/textil-laden.jpg",
  "img/textil-mode.jpg",
  "img/tiere-hund.jpg",
  "img/tiere-pferd.jpg",
  "img/verkauf-laden.jpg",
  "img/verkehr-bahn.jpg",
  "img/verkehr-bus.jpg",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512-maskable.png",
  "icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Seiten, Code und Daten: zuerst online holen (immer die neuste Version), offline aus dem Cache.
// Bilder und Icons ändern sich kaum: zuerst aus dem Cache.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  const statisch = /\.(jpg|jpeg|png|webp|svg)$/i.test(url.pathname);
  if (statisch) {
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request)));
    return;
  }
  e.respondWith(
    fetch(e.request, { cache: "no-cache" })
      .then((res) => {
        if (res.ok) { const kopie = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, kopie)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
