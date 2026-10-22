// Next Move – Auswertungslogik (Weg-Empfehlung und Berufs-Matching).
// Bewusst transparent gehalten: Jede Empfehlung liefert Gründe mit, damit Jugendliche,
// Eltern und Berufsberatung nachvollziehen können, wie sie zustande kommt.
(function () {
  const DIMS = Object.keys(window.NM_DIMS);
  const KARTEN_WERT = { ja: 2, vielleicht: 0.4, nein: -1.5 };

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

  function kanton(p) {
    return window.NM_KANTONE.find((k) => k.code === p.kanton) || null;
  }

  function notenschnitt(p) {
    const n = p.noten || {};
    const werte = ["de", "ma", "fr", "en", "nt"].map((k) => n[k]).filter((v) => typeof v === "number");
    const a = avg(werte);
    return a === null ? null : Math.round(a * 100) / 100;
  }

  // Interessenprofil −1 … +1 je Dimension aus Swipe-Karten und Hobbys
  function interessen(p) {
    const raw = {}, max = {};
    DIMS.forEach((d) => { raw[d] = 0; max[d] = 0; });
    window.NM_KARTEN.forEach((k) => {
      const a = (p.karten || {})[k.id];
      Object.entries(k.i).forEach(([d, w]) => {
        max[d] += 2 * w;
        if (a) raw[d] += KARTEN_WERT[a] * w;
      });
    });
    const res = {};
    DIMS.forEach((d) => { res[d] = max[d] ? raw[d] / max[d] : 0; });
    (p.hobbys || []).forEach((id) => {
      const h = window.NM_HOBBYS.find((x) => x.id === id);
      if (h) Object.entries(h.i).forEach(([d, w]) => { res[d] += 0.12 * w; });
    });
    DIMS.forEach((d) => { res[d] = clamp(res[d], -0.8, 1); });
    return res;
  }

  function topInteressen(p, n = 3) {
    const i = interessen(p);
    return DIMS.map((d) => ({ d, v: i[d] })).filter((x) => x.v > 0.15).sort((a, b) => b.v - a.v).slice(0, n);
  }

  // Schulisches Niveau des Jugendlichen auf der Skala der Berufe (1 = EBA … 3 = anspruchsvoll)
  function level(p) {
    const base = [3, 2, 1, 3][p.niveau ?? 1];
    const s = notenschnitt(p);
    let l = base;
    if (s !== null) {
      if (s >= 5.2) l += 0.5;
      else if (s < 4.3) l -= 0.5;
    }
    return clamp(l, 1, 3.5);
  }

  const STAERKE_FUER_DIM = {
    hand: "handgeschick", tech: "technik", fahrzeug: "technik", labor: "logik", kreativ: "kreativ",
    menschen: "empathie", gesund: "empathie", verkauf: "kontakt", buero: "organisation",
    digital: "digital", sport: "fitness"
  };
  const SCHREIBTISCH = ["buero", "informatik", "planung", "medien"];

  // Matching eines Berufs: liefert Prozent (5–99) und die wichtigsten Gründe
  function match(p, b, cache) {
    const I = (cache && cache.I) || interessen(p);
    const L = (cache && cache.L) || level(p);
    const t = b.t || {};
    const gruende = [];
    let wsum = 0, base = 0;
    Object.entries(b.i).forEach(([d, w]) => { wsum += w; base += w * I[d]; });
    base = wsum ? base / wsum : 0;
    let score = base;
    Object.entries(b.i).filter(([, w]) => w >= 2).forEach(([d]) => {
      if (I[d] > 0.35) gruende.push({ plus: true, text: `Du interessierst dich für ${window.NM_DIMS[d].label}` });
    });

    // Stärken
    const st = p.staerken || {};
    const needs = new Set(Object.entries(b.i).filter(([, w]) => w >= 2).map(([d]) => STAERKE_FUER_DIM[d]).filter(Boolean));
    if (t.g === 2) needs.add("sorgfalt");
    if (t.c === 2) needs.add("kontakt");
    if (t.k === 2) needs.add("fitness");
    if (b.niveau === 3) needs.add("logik");
    const sv = [...needs].filter((n) => st[n]).map((n) => (st[n] - 3) / 2);
    if (sv.length) {
      const sAdj = avg(sv);
      score += sAdj * 0.14;
      const top = [...needs].filter((n) => st[n] >= 4).map((n) => window.NM_STAERKEN.find((x) => x.id === n).label);
      if (top.length) gruende.push({ plus: true, text: `Passt zu deinen Stärken: ${top.slice(0, 2).join(", ")}` });
    }

    // Arbeitswelt-Präferenzen (−2 … +2)
    const pr = p.praef || {};
    if (typeof pr.ort === "number") score += (pr.ort / 2) * (((t.d || 0) - 0.7) / 1.3) * 0.09;
    if (typeof pr.tempo === "number") score += (pr.tempo / 2) * (((t.k || 0) - 0.8) / 1.2) * 0.06;
    if (typeof pr.fokus === "number") {
      const menschen = ((t.c || 0) + (b.i.menschen || 0) + (b.i.gesund || 0)) / 3 - 0.6;
      score += (pr.fokus / 2) * menschen * 0.09;
    }
    if (typeof pr.kopf === "number") score += (pr.kopf / 2) * ((b.niveau - 2) * 0.6 + (SCHREIBTISCH.includes(b.feld) ? 0.4 : -0.3)) * 0.07;
    if (pr.ort >= 1 && t.d === 2) gruende.push({ plus: true, text: "Viel draussen – wie du es magst" });
    if (pr.ort <= -1 && t.d === 2) gruende.push({ plus: false, text: "Viel Arbeit draussen" });

    // Was liegt dir weniger?
    const sw = new Set(p.schwaechen || []);
    const minus = (cond, v, text) => { if (cond) { score -= v; gruende.push({ plus: false, text }); } };
    minus(sw.has("stillsitzen") && !t.k && SCHREIBTISCH.includes(b.feld), 0.1, "Viel sitzen am Arbeitsplatz");
    minus(sw.has("koerperlich") && t.k === 2, 0.15, "Körperlich anstrengend");
    minus(sw.has("schmutz") && t.s, 0.1, "Hier wird man auch mal schmutzig");
    minus(sw.has("blut") && b.feld === "gesundheit" && (b.i.gesund || 0) >= 3, 0.2, "Kontakt mit Blut und Krankheiten");
    minus(sw.has("fremde") && t.c === 2, 0.12, "Viel Kontakt mit Kundschaft");
    minus(sw.has("mathe") && b.niveau === 3 && ((b.i.tech || 0) + (b.i.labor || 0) + (b.i.buero || 0) >= 2), 0.1, "Braucht gute Mathe-Kenntnisse");
    minus(sw.has("zeiten") && t.z === 2, 0.14, "Arbeit auch abends oder am Wochenende");
    minus(sw.has("wetter") && t.d === 2, 0.14, "Draussen bei jedem Wetter");
    minus(sw.has("genau") && t.g === 2, 0.1, "Verlangt sehr genaues Arbeiten");
    minus(sw.has("hoehe") && t.h, 0.18, "Arbeit in der Höhe");
    minus(sw.has("lernen") && b.niveau === 3, 0.06, "Schulisch anspruchsvoll");
    if (sw.has("zeiten") && t.z === 1) score -= 0.04;
    if (sw.has("koerperlich") && t.k === 1) score -= 0.03;

    // Schulisches Niveau
    const diff = b.niveau - L;
    if (diff >= 1.5) { score -= 0.2; gruende.push({ plus: false, text: "Schulisch sehr anspruchsvoll für dein aktuelles Niveau" }); }
    else if (diff >= 0.75) { score -= 0.07; gruende.push({ plus: false, text: "Schulisch anspruchsvoll – mit Einsatz machbar" }); }
    if (b.niveau === 1) score += L >= 2.5 ? -0.12 : L >= 2 ? -0.06 : 0.04;
    if (b.niveau === 3 && L >= 3) gruende.push({ plus: true, text: "Fordert dich schulisch – passt zu deinem Niveau" });

    const pct = Math.round(clamp(38 + score * 52, 5, 98));
    return { pct, gruende: gruende.slice(0, 5) };
  }

  function rangliste(p) {
    const cache = { I: interessen(p), L: level(p) };
    return window.NM_BERUFE
      .map((b) => ({ b, ...match(p, b, cache) }))
      .sort((a, b) => b.pct - a.pct);
  }

  function topFelder(liste, n = 3) {
    const felder = {};
    liste.slice(0, 30).forEach((x, idx) => {
      felder[x.b.feld] = (felder[x.b.feld] || 0) + x.pct * (1 - idx / 40);
    });
    return Object.entries(felder).sort((a, b) => b[1] - a[1]).slice(0, n).map(([f]) => f);
  }

  // Weg-Empfehlung: Gymnasium, Lehre mit BMS oder Lehre
  const WEG_GRUND = {
    w1: ["Du lernst gern und willst Dinge theoretisch verstehen.", "Theorie um der Theorie willen reizt dich weniger."],
    w2: ["Du möchtest später an einer Uni oder ETH studieren.", "Ein Uni-Studium steht für dich (noch) nicht im Vordergrund."],
    w3: ["Du willst lieber praktisch arbeiten als den ganzen Tag im Schulzimmer sitzen.", "Schule und Schulzimmer machen dir nichts aus."],
    w4: ["Du möchtest bald eigenes Geld verdienen.", "Eigenes Geld verdienen eilt dir nicht."],
    w5: ["Du hast schon ein Berufsfeld, das dich richtig reizt.", "Du bist noch offen, welcher Beruf dich reizt."],
    w6: ["Du kannst dich gut selbst zum Lernen motivieren.", "Selbständig viel Stoff lernen fällt dir eher schwer."],
    w7: ["Fremdsprachen liegen dir.", "Fremdsprachen sind nicht deine Lieblingsfächer."],
    w8: ["Du willst dir möglichst viele Wege offenhalten.", ""],
    w9: ["Du freust dich auf Verantwortung im Betrieb.", ""],
    w10: ["Du lernst auch in der Freizeit regelmässig für die Schule.", "In der Freizeit willst du nicht noch viel für die Schule lernen."],
    w11: ["Dein Traumberuf braucht ein Studium.", ""]
  };

  function weg(p) {
    const fr = window.NM_WEGFRAGEN;
    const a = p.weg || {};
    let G = 0, Lp = 0, B = 0, Gmax = 0, Lmax = 0, Bmax = 0;
    fr.forEach((q) => {
      Gmax += Math.abs(q.g) * 2; Lmax += Math.abs(q.l) * 2; Bmax += Math.abs(q.b) * 2;
      if (!a[q.id]) return;
      const c = a[q.id] - 3;
      G += q.g * c; Lp += q.l * c; B += q.b * c;
    });
    const pr = p.praef || {};
    let neigung = G / Gmax - Lp / Lmax + (typeof pr.kopf === "number" ? pr.kopf * 0.08 : 0);
    if ((p.hobbys || []).includes("lesen")) neigung += 0.05;
    const schulePct = Math.round(clamp(50 + neigung * 32, 5, 95));

    const k = kanton(p);
    const richtwert = k ? k.richtwert : 4.9;
    const s = notenschnitt(p);
    const niv = p.niveau ?? 1;
    const nivBonus = [30, 10, 0, 35][niv];
    let gymReady = s === null ? 40 : clamp((s - (richtwert - 0.7)) / 1.0, 0, 1) * 65 + nivBonus;
    if (p.lehrer === "gym") gymReady += 10;
    if (p.lehrer === "lehre") gymReady -= 10;
    gymReady = Math.round(clamp(gymReady, 3, 98));
    let bmsReady = s === null ? 45 : clamp((s - 4.0) / 1.1, 0, 1) * 65 + [30, 22, 5, 30][niv];
    bmsReady += (B / Bmax) * 15;
    bmsReady = Math.round(clamp(bmsReady, 3, 98));

    let empfehlung, alternative = null;
    if (schulePct >= 58) {
      if (gymReady >= 60) { empfehlung = "gym"; alternative = "bms"; }
      else if (gymReady >= 40) { empfehlung = "bms"; alternative = "gym"; }
      else { empfehlung = bmsReady >= 55 ? "bms" : "lehre"; alternative = "bm2"; }
    } else if (schulePct >= 42) {
      if (gymReady >= 70) { empfehlung = "bms"; alternative = "gym"; }
      else if (bmsReady >= 55) { empfehlung = "bms"; alternative = "lehre"; }
      else { empfehlung = "lehre"; alternative = "bm2"; }
    } else {
      if (bmsReady >= 65 && B >= 0) { empfehlung = "bms"; alternative = "lehre"; }
      else { empfehlung = "lehre"; alternative = "bm2"; }
    }
    const eba = niv === 2 && s !== null && s < 4.3;

    // Gründe sammeln (stärkste Antworten in Richtung der Empfehlung)
    const richtung = empfehlung === "gym" ? "g" : "l";
    const gruende = fr
      .filter((q) => a[q.id] && a[q.id] !== 3)
      .map((q) => {
        const c = a[q.id] - 3;
        const w = richtung === "g" ? q.g : q.l;
        const txt = WEG_GRUND[q.id][c > 0 ? 0 : 1];
        return { st: w * c, txt };
      })
      .filter((x) => x.st > 0 && x.txt)
      .sort((x, y) => y.st - x.st)
      .slice(0, 4)
      .map((x) => x.txt);
    if (s !== null && k) {
      if (s >= richtwert && niv === 0) gruende.push(`Dein Notenschnitt (${s.toFixed(2)}) erreicht den Richtwert für das Gymnasium im Kanton ${k.name} (${richtwert.toFixed(2)}).`);
      else if (empfehlung !== "gym" && s < richtwert) gruende.push(`Für das Gymnasium im Kanton ${k.name} liegt der Richtwert bei etwa ${richtwert.toFixed(2)} – dein Schnitt ist aktuell ${s.toFixed(2)}.`);
    }

    // Fachmittelschule als Hinweis für soziale, gesundheitliche oder pädagogische Interessen
    const ti = topInteressen(p, 3).map((x) => x.d);
    const fms = schulePct >= 45 && gymReady >= 30 && (ti.includes("menschen") || ti.includes("gesund"));

    return { empfehlung, alternative, eba, schulePct, gymReady, bmsReady, notenschnitt: s, richtwert, gruende, fms, kanton: k };
  }

  // Fortschritt: welche Schritte sind erledigt?
  function vollstaendigkeit(p) {
    const d = p.done || {};
    const alle = ["ueber", "schule", "interessen", "staerken", "schwaechen", "hobbys", "arbeitswelt", "weg"];
    const erledigt = alle.filter((x) => d[x]).length;
    return { pct: Math.round((erledigt / alle.length) * 100), erledigt, total: alle.length, kern: ["ueber", "schule", "interessen", "weg"].every((x) => d[x]) };
  }

  window.NM_ENGINE = { interessen, topInteressen, notenschnitt, level, match, rangliste, topFelder, weg, vollstaendigkeit, kanton };
})();
