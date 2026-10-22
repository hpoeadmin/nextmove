#!/usr/bin/env python3
"""Erzeugt die App-Icons (icons/) und den Service Worker (sw.js) mit der Liste aller Dateien.

Aufruf (nach Änderungen an Bildern oder Code, damit Offline-Nutzer die neue Version erhalten):
    python3 tools/build_assets.py
Benötigt Pillow (pip install pillow) für die Icons.
"""
import hashlib, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def icons():
    from PIL import Image, ImageDraw
    os.makedirs(os.path.join(ROOT, "icons"), exist_ok=True)

    def make(size, pad, rounded):
        s = size * 4
        img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
        grad = Image.new("RGBA", (s, s))
        px = grad.load()
        a, b, c = (91, 61, 245), (166, 61, 240), (255, 106, 85)
        for y in range(s):
            for x in range(s):
                t = (x + y) / (2 * s)
                p, q, u = (a, b, t / 0.52) if t < 0.52 else (b, c, (t - 0.52) / 0.48)
                px[x, y] = tuple(int(p[i] + (q[i] - p[i]) * u) for i in range(3)) + (255,)
        mask = Image.new("L", (s, s), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * rounded), fill=255)
        img.paste(grad, (0, 0), mask)
        d = ImageDraw.Draw(img)
        w = int(s * 0.085)
        m = s * pad
        cx, cy = s / 2, s / 2
        # Pfeil «Next Move»
        d.line([(m + s * 0.04, cy), (s - m - s * 0.02, cy)], fill="white", width=w)
        d.line([(cx + s * 0.02, m + s * 0.06), (s - m, cy), (cx + s * 0.02, s - m - s * 0.06)], fill="white", width=w, joint="curve")
        for (x, y) in [(m + s * 0.04, cy), (cx + s * 0.02, m + s * 0.06), (cx + s * 0.02, s - m - s * 0.06), (s - m, cy)]:
            d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill="white")
        return img.resize((size, size), Image.LANCZOS)

    make(192, 0.26, 0.22).save(os.path.join(ROOT, "icons", "icon-192.png"))
    make(512, 0.26, 0.22).save(os.path.join(ROOT, "icons", "icon-512.png"))
    make(512, 0.32, 0).save(os.path.join(ROOT, "icons", "icon-512-maskable.png"))
    make(180, 0.26, 0).convert("RGB").save(os.path.join(ROOT, "icons", "apple-touch-icon.png"))


def service_worker():
    files = ["./", "index.html", "manifest.webmanifest"]
    for folder in ["css", "js", "img", "icons"]:
        for dirpath, _, names in os.walk(os.path.join(ROOT, folder)):
            for n in sorted(names):
                if n.startswith("."):
                    continue
                files.append(os.path.relpath(os.path.join(dirpath, n), ROOT).replace(os.sep, "/"))
    h = hashlib.sha1()
    for f in files[1:]:
        with open(os.path.join(ROOT, f), "rb") as fh:
            h.update(fh.read())
    version = h.hexdigest()[:10]
    sw = f"""// Automatisch erzeugt mit tools/build_assets.py – macht Next Move offline nutzbar.
const CACHE = "nextmove-{version}";
const FILES = {json.dumps(files, indent=2)};

self.addEventListener("install", (e) => {{
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
}});

self.addEventListener("activate", (e) => {{
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
}});

self.addEventListener("fetch", (e) => {{
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, {{ ignoreSearch: true }}).then((r) => r || fetch(e.request)));
}});
"""
    with open(os.path.join(ROOT, "sw.js"), "w", encoding="utf-8") as f:
        f.write(sw)
    print(f"sw.js: {len(files)} Dateien, Version {version}")


if __name__ == "__main__":
    icons()
    service_worker()
