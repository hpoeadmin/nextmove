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
    // Ergänzende Fragen: nur leichter Einfluss, sie dienen vor allem der Begründung
    neigung += { freude: 0.06, muede: -0.06 }[p.schulgefuehl] || 0;
    neigung += { studium: 0.06, beruf: -0.06 }[p.mit20] || 0;
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

  // Gedanken zum Weg: Typ-Beschreibung, Klarheit, Für und Wider, Denkanstösse.
  // Alles aus den vorhandenen Antworten abgeleitet, damit die Empfehlung nachvollziehbar wird.
  const TYPEN = {
    gymTyp: {
      titel: "Kopf und Noten passen zusammen",
      text: (x) => `Du lernst gern, willst Dinge verstehen und hast die schulischen Voraussetzungen dafür${x.schnitt}. Das Gymnasium passt gut zu dir: Es ist anspruchsvoll, bietet viele Fächer und führt mit der Matura an jede Uni und ETH. Wichtig ist, dass du die vier Jahre wirklich willst – nicht nur, weil es möglich ist. Ein Berufswunsch, den du schon kennst, kann dir zeigen, ob es sich lohnt.`
    },
    gymWunsch: {
      titel: "Du willst weiter zur Schule – die Noten sind noch knapp",
      text: (x) => `Schule und Theorie reizen dich, und du möchtest gern weiterlernen. Für das Gymnasium reichen deine Noten${x.schnitt} aber noch nicht sicher. Das heisst nicht, dass es unmöglich ist: Kläre, wie die Aufnahme ${x.kanton} funktioniert und ob sich eine gezielte Vorbereitung lohnt. Ein starker Plan B ist eine Lehre mit Berufsmatur – damit lernst du ebenfalls viel und kannst später an die Fachhochschule oder via Passerelle an die Uni.`
    },
    beides: {
      titel: "Beide Wege stehen dir offen",
      text: (x) => `Praxis und Schule reizen dich ungefähr gleich, und deine Noten${x.schnitt} lassen beides zu. Eine Lehre mit Berufsmatur verbindet beides: Du arbeitest im Betrieb und gehst gleichzeitig vertieft zur Schule. Entscheidend ist oft die Frage, ob dich schon ein Beruf richtig reizt. Wenn ja, spricht viel für die Lehre mit BMS. Wenn nicht, kann das Gymnasium dir mehr Zeit geben.`
    },
    mitteKnapp: {
      titel: "Praxis mit offener Tür zur Weiterbildung",
      text: (x) => `Du kannst dir Schule und Praxis beide vorstellen. Deine Noten${x.schnitt} sprechen eher für eine Berufslehre. Das ist ein starker Start: Du lernst im echten Arbeitsalltag, verdienst eigenes Geld – und kannst die Berufsmatur auch während oder nach der Lehre machen. Viele, die in der Oberstufe noch nicht so motiviert waren, blühen in der Lehre richtig auf.`
    },
    praxisPotenzial: {
      titel: "Praktiker mit Schulpotenzial",
      text: (x) => `Du hast gute Noten${x.schnitt} und würdest das Gymnasium wohl schaffen – aber dein Herz schlägt für die Praxis. Das ist kein Widerspruch. Eine Lehre mit Berufsmatur fordert dich schulisch und lässt dich gleichzeitig im Beruf arbeiten. Wähle einen anspruchsvollen Beruf, damit es dir nicht langweilig wird. Der Weg an die Fachhochschule und via Passerelle an die Uni bleibt offen.`
    },
    praxisTyp: {
      titel: "Klarer Praxis-Typ",
      text: (x) => `Du willst anpacken, etwas Sichtbares schaffen und im echten Arbeitsalltag lernen. Eine Berufslehre passt sehr gut zu dir. Deine Noten${x.schnitt} sind dafür eine gute Grundlage – entscheidend ist jetzt, den Beruf zu finden, der zu dir passt. Schnuppern ist der beste Weg dazu. Und denk daran: Nach der Lehre stehen dir viele Weiterbildungen offen.`
    }
  };
  const PRO_EXTRA = {
    freude: "Du freust dich auf weitere Jahre Schule.",
    muede: "Vier weitere Jahre Schule fühlen sich für dich eher anstrengend an.",
    druckGut: "Prüfungen spornen dich eher an.",
    druckSchwer: "Prüfungsdruck setzt dir ziemlich zu.",
    mitStudium: "Mit 20 siehst du dich an einer Uni oder ETH.",
    mitFh: "Mit 20 siehst du dich im Beruf – mit Weiterbildung.",
    mitBeruf: "Mit 20 siehst du dich im Beruf mit eigenem Lohn.",
    kopf: "Du arbeitest lieber mit dem Kopf.",
    hand: "Du arbeitest lieber mit den Händen."
  };

  function gedanken(p, w = weg(p)) {
    const a = p.weg || {};
    const s = w.notenschnitt, k = w.kanton;
    const wunsch = w.schulePct >= 58 ? "schule" : w.schulePct >= 42 ? "mitte" : "praxis";
    const gut = w.gymReady >= 60;
    const typId = { schule: gut ? "gymTyp" : "gymWunsch", mitte: gut ? "beides" : "mitteKnapp", praxis: gut ? "praxisPotenzial" : "praxisTyp" }[wunsch];
    const x = {
      schnitt: s !== null ? ` (Schnitt ${s.toFixed(2)})` : "",
      kanton: k ? "im Kanton " + k.name : "in deinem Kanton"
    };
    const typ = { id: typId, titel: TYPEN[typId].titel, text: TYPEN[typId].text(x) };

    // Für und Wider: jede Antwort wird beiden Wegen zugeordnet
    const pro = { gym: [], lehre: [] }, contra = { gym: [], lehre: [] };
    const add = (weg, st, txt) => { if (!txt || !st) return; (st > 0 ? pro : contra)[weg].push({ st: Math.abs(st), txt }); };
    window.NM_WEGFRAGEN.forEach((q) => {
      const v = a[q.id];
      if (!v || v === 3) return;
      const c = v - 3, txt = WEG_GRUND[q.id][c > 0 ? 0 : 1];
      add("gym", q.g * c, txt);
      add("lehre", Math.max(q.l, 0) * c, txt); // Lernfreude spricht nicht gegen die Lehre (BMS)
    });
    if (a.w2 >= 4 || a.w11 >= 4) add("lehre", -3, "Du willst an die Uni – über die Lehre geht das nur mit Berufsmatur und Passerelle (rund ein Jahr länger).");
    if (s !== null && k) {
      if (s >= w.richtwert) add("gym", 4, `Dein Notenschnitt (${s.toFixed(2)}) erreicht den Richtwert im Kanton ${k.name} (${w.richtwert.toFixed(2)}).`);
      else if (s < w.richtwert - 0.2) add("gym", -4, `Dein Notenschnitt (${s.toFixed(2)}) liegt unter dem Richtwert im Kanton ${k.name} (etwa ${w.richtwert.toFixed(2)}).`);
    }
    if (p.schulgefuehl === "freude") add("gym", 3, PRO_EXTRA.freude);
    if (p.schulgefuehl === "muede") { add("gym", -3, PRO_EXTRA.muede); add("lehre", 2, PRO_EXTRA.muede); }
    if (p.druck === "gut") add("gym", 2, PRO_EXTRA.druckGut);
    if (p.druck === "schwer") add("gym", -2, PRO_EXTRA.druckSchwer);
    if (p.mit20 === "studium") add("gym", 4, PRO_EXTRA.mitStudium);
    if (p.mit20 === "fh") add("lehre", 3, PRO_EXTRA.mitFh);
    if (p.mit20 === "beruf") { add("lehre", 4, PRO_EXTRA.mitBeruf); add("gym", -3, PRO_EXTRA.mitBeruf); }
    const kopf = (p.praef || {}).kopf;
    if (kopf >= 1) add("gym", kopf, PRO_EXTRA.kopf);
    if (kopf <= -1) add("lehre", -kopf, PRO_EXTRA.hand);
    const top = (arr) => arr.sort((m, n) => n.st - m.st).slice(0, 4).map((m) => m.txt);
    ["gym", "lehre"].forEach((g) => { pro[g] = top(pro[g]); contra[g] = top(contra[g]); });

    // Denkanstösse: Spannungen und Widersprüche in den Antworten
    const d = [];
    const hoch = (id) => a[id] >= 4, tief = (id) => a[id] && a[id] <= 2;
    const motiv = p.motiv || [];
    const gymWeg = w.empfehlung === "gym";
    if (hoch("w2") && (tief("w10") || tief("w6"))) d.push({ w: true, t: "Du willst studieren, lernst aber nicht so gern selbständig. Im Gymnasium ist genau das der Schlüssel. Was würde dir helfen, dranzubleiben?" });
    if (hoch("w4") && hoch("w11")) d.push({ w: true, t: "Du möchtest bald Geld verdienen, dein Traumberuf braucht aber ein Studium. Über Lehre, Berufsmatur und Fachhochschule erreichst du viele Studienberufe – und verdienst unterwegs schon Geld. Kläre, ob das auch für deinen Traumberuf geht." });
    if (hoch("w11") && !gymWeg) d.push({ t: "Dein Traumberuf braucht ein Studium. Auch ohne Gymnasium gibt es Wege dorthin: Lehre mit Berufsmatur → Fachhochschule, oder via Passerelle an die Uni. Finde heraus, welcher Weg zu deinem Traumberuf führt." });
    if (hoch("w5") && gymWeg) d.push({ t: "Du hast schon ein Berufsfeld, das dich reizt. Prüfe, ob es dafür eine Lehre gibt – und ob du dein Ziel wirklich nur übers Gymnasium erreichst." });
    if (typId === "gymWunsch") d.push({ t: "Dein Wunsch nach Schule ist gross. Frag nach: Wie funktioniert die Aufnahmeprüfung? Lohnt sich ein Vorbereitungskurs? Und was ist dein Plan B, falls es nicht klappt?" });
    if (typId === "praxisPotenzial") d.push({ t: "Mit deinen Noten kannst du hoch hinaus – auch in der Lehre. Schau dir anspruchsvolle Berufe an und frag beim Schnuppern nach der Berufsmatur." });
    if (hoch("w1") && hoch("w3")) d.push({ t: "Du willst Theorie verstehen und gleichzeitig praktisch arbeiten. Die Lehre mit Berufsmatur verbindet genau das." });
    if (hoch("w8") && w.empfehlung === "lehre") d.push({ t: "Du willst dir viele Wege offenhalten. Mit der Berufsmatur – während oder nach der Lehre – stehen dir Fachhochschule und Uni offen." });
    if (tief("w7") && gymWeg) d.push({ t: "Fremdsprachen sind nicht deine Lieblingsfächer. Im Gymnasium hast du bis zur Matura eine zweite Landessprache und Englisch. Bist du bereit, dranzubleiben?" });
    const fremd = window.NM_MOTIVE.filter((m) => m.fremd && motiv.includes(m.id));
    const eigen = window.NM_MOTIVE.some((m) => m.eigen && motiv.includes(m.id));
    if (fremd.length && !eigen) {
      const gr = fremd.map((m) => m.fremd);
      d.push({ w: true, t: `Du denkst ans Gymnasium vor allem, weil ${gr.length > 1 ? gr.slice(0, -1).join(", ") + " und " + gr[gr.length - 1] : gr[0]}. Das sind verständliche Gründe – aber überleg dir auch: Was willst du selbst in vier Jahren machen?` });
    }
    if (motiv.includes("aufschieben")) d.push({ t: "Du weisst noch nicht, was du werden willst – das ist mit 14 oder 15 völlig normal. Das Gymnasium kann dir Zeit geben, aber auch eine Lehre ist kein Entscheid fürs ganze Leben. Schnuppern hilft am meisten, klarer zu sehen." });
    if (p.druck === "schwer" && gymWeg) d.push({ t: "Prüfungsdruck setzt dir zu, und im Gymnasium gibt es viele Prüfungen. Überleg, was dir hilft, damit umzugehen – und sprich mit deiner Lehrperson darüber." });
    if (p.schulgefuehl === "muede" && wunsch === "schule") d.push({ w: true, t: "Deine Antworten zeigen Richtung Schule, aber vier weitere Jahre fühlen sich anstrengend an. Was davon stimmt für dich mehr?" });
    if (p.schulgefuehl === "freude" && wunsch === "praxis") d.push({ w: true, t: "Du freust dich eigentlich auf weitere Schuljahre, deine übrigen Antworten zeigen aber Richtung Praxis. Vielleicht ist die Lehre mit Berufsmatur ein guter Mittelweg?" });
    if ((p.mit20 === "beruf" && gymWeg) || (p.mit20 === "studium" && wunsch === "praxis")) {
      d.push({ w: true, t: `Mit 20 siehst du dich ${p.mit20 === "beruf" ? "im Beruf mit eigenem Lohn" : "an der Uni"} – das passt nicht ganz zu deinen übrigen Antworten. Welches Bild fühlt sich richtiger an?` });
    }
    if (p.eltern === "gym" && !gymWeg) d.push({ t: "Deine Eltern wünschen sich eher das Gymnasium, deine Antworten zeigen eher Richtung Lehre. Redet darüber, was euch jeweils wichtig ist." });
    if (p.eltern === "lehre" && gymWeg) d.push({ t: "Deine Eltern wünschen sich eher eine Lehre, deine Antworten zeigen Richtung Gymnasium. Redet darüber, was euch jeweils wichtig ist." });

    // Wie eindeutig ist das Ergebnis?
    const beantwortet = window.NM_WEGFRAGEN.filter((q) => a[q.id]).length;
    const abstand = Math.abs(w.schulePct - 50);
    let stufe = abstand >= 20 ? 3 : abstand >= 8 ? 2 : 1;
    const widersprueche = d.filter((z) => z.w).length;
    if (widersprueche >= 2) stufe = Math.max(1, stufe - 1);
    const klarheit = beantwortet < window.NM_WEGFRAGEN.length
      ? { stufe: 0, label: "Noch unvollständig", text: "Du hast noch nicht alle Fragen beantwortet. Mit allen Antworten wird das Bild genauer." }
      : [null,
        { stufe: 1, label: "Knapp", text: "Deine Antworten sind ziemlich ausgeglichen. Hier lohnt sich ein Gespräch mit Eltern und Berufsberatung besonders – und Schnuppern in beiden Welten." },
        { stufe: 2, label: "Deutliche Tendenz", text: "Deine Antworten zeigen in eine Richtung, aber nicht ganz eindeutig. Prüfe die Denkanstösse unten." },
        { stufe: 3, label: "Klares Bild", text: "Deine Antworten zeigen klar in eine Richtung." + (widersprueche ? " Ein paar Punkte lohnt es sich trotzdem zu überdenken." : "") }
      ][stufe];

    return {
      typ, klarheit, pro, contra,
      denkanstoesse: d.slice(0, 5).map((z) => z.t),
      ergaenzt: !!p.mit20
    };
  }

  // Fortschritt: welche Schritte sind erledigt?
  function vollstaendigkeit(p) {
    const d = p.done || {};
    const alle = ["ueber", "schule", "interessen", "staerken", "schwaechen", "hobbys", "arbeitswelt", "weg"];
    const erledigt = alle.filter((x) => d[x]).length;
    return { pct: Math.round((erledigt / alle.length) * 100), erledigt, total: alle.length, kern: ["ueber", "schule", "interessen", "weg"].every((x) => d[x]) };
  }

  window.NM_ENGINE = { interessen, topInteressen, notenschnitt, level, match, rangliste, topFelder, weg, gedanken, vollstaendigkeit, kanton };
})();
