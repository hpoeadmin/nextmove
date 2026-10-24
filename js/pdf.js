// Next Move – PDF der Auswertung direkt im Browser erzeugen.
// Wird gebraucht, wo window.print() nicht funktioniert (installierte App auf iPad/iPhone).
// Jeder Abschnitt wird einzeln gerendert; Seitenumbrüche fallen nie mitten in eine Karte.
(function () {
  const LIBS = ["js/vendor/html2canvas.min.js", "js/vendor/jspdf.umd.min.js"];
  // Elemente, die nie über einen Seitenumbruch geteilt werden
  const GANZ = ".card, .jcard, .field-card, .result-hero, .lane, .ib, .meter, li, p, h2, h3, .node, .match, .pill";
  const A4 = { w: 210, h: 297, rand: 12 };
  const BREITE_PX = 760; // Layoutbreite beim Rendern, ergibt ein ruhiges A4-Bild

  function ladeScript(src) {
    return new Promise((ok, fehler) => {
      if (document.querySelector(`script[src="${src}"]`)) return ok();
      const s = document.createElement("script");
      s.src = src;
      s.onload = ok;
      s.onerror = () => fehler(new Error("Konnte " + src + " nicht laden"));
      document.head.appendChild(s);
    });
  }

  // Grösste Schnitthöhe <= max, die kein unteilbares Element durchschneidet
  function sichererSchnitt(bereiche, min, max) {
    const kandidaten = [max, ...bereiche.map((b) => b.unten)].filter((y) => y > min && y <= max).sort((a, b) => b - a);
    for (const y of kandidaten) {
      if (!bereiche.some((b) => b.oben < y - 0.5 && b.unten > y + 0.5)) return y;
    }
    return max;
  }

  async function erstellePdf(root, titel) {
    for (const src of LIBS) await ladeScript(src);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
    const innenB = A4.w - 2 * A4.rand;
    const unten = A4.h - A4.rand;

    const alteBreite = root.style.width;
    root.classList.add("pdf-mode");
    root.style.width = BREITE_PX + "px";
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    try {
      const rootBox = root.getBoundingClientRect();
      const pxProMm = rootBox.width / innenB;
      const seitePx = (unten - A4.rand) * pxProMm;
      const bloecke = [...root.children].filter((el) => el.offsetHeight > 0 && getComputedStyle(el).display !== "none");
      let y = A4.rand;

      for (let i = 0; i < bloecke.length; i++) {
        const el = bloecke[i];
        const box = el.getBoundingClientRect();
        const hoehe = box.height;
        const x = A4.rand + (box.left - rootBox.left) / pxProMm;
        const breite = box.width / pxProMm;

        // Überschrift nicht allein am Seitenende stehen lassen
        let mitNaechstem = 0;
        // (ein Folgeblock, der auf eine Seite passt, wandert als Ganzes – also ganz mitrechnen)
        if (el.classList.contains("section-title") && bloecke[i + 1]) {
          const h = bloecke[i + 1].offsetHeight;
          mitNaechstem = h <= seitePx ? h : seitePx * 0.25;
        }
        const passt = y + (hoehe + mitNaechstem) / pxProMm <= unten;
        if (y > A4.rand && !passt && hoehe + mitNaechstem <= seitePx) { pdf.addPage(); y = A4.rand; }

        const canvas = await window.html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
        const sk = canvas.width / box.width;
        const bereiche = [...el.querySelectorAll(GANZ)].map((k) => {
          const r = k.getBoundingClientRect();
          return { oben: r.top - box.top, unten: r.bottom - box.top };
        }).filter((b) => b.unten - b.oben < seitePx * 0.9);

        let ab = 0;
        while (ab < hoehe - 1) {
          const platz = (unten - y) * pxProMm;
          let bis = Math.min(hoehe, ab + platz);
          if (bis < hoehe) bis = sichererSchnitt(bereiche, ab, bis);
          if (bis - ab < 24 && y > A4.rand) { pdf.addPage(); y = A4.rand; continue; }
          if (bis - ab < 1) bis = Math.min(hoehe, ab + platz);

          const stueck = document.createElement("canvas");
          stueck.width = canvas.width;
          stueck.height = Math.max(1, Math.round((bis - ab) * sk));
          const ctx = stueck.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, stueck.width, stueck.height);
          ctx.drawImage(canvas, 0, Math.round(ab * sk), canvas.width, stueck.height, 0, 0, canvas.width, stueck.height);
          pdf.addImage(stueck.toDataURL("image/jpeg", 0.88), "JPEG", x, y, breite, (bis - ab) / pxProMm);

          y += (bis - ab) / pxProMm;
          ab = bis;
          if (ab < hoehe - 1) { pdf.addPage(); y = A4.rand; }
        }
        y += 3;
      }

      const n = pdf.getNumberOfPages();
      pdf.setFontSize(8);
      pdf.setTextColor(140, 137, 166);
      for (let s = 1; s <= n; s++) {
        pdf.setPage(s);
        pdf.text(`${titel} · Seite ${s} von ${n}`, A4.w / 2, A4.h - 5, { align: "center" });
      }
      return pdf.output("blob");
    } finally {
      root.classList.remove("pdf-mode");
      root.style.width = alteBreite;
    }
  }

  window.NM_PDF = { erstelle: erstellePdf };
})();
