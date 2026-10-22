// Next Move – App (Ansichten, Navigation, Speicherung)
(function () {
  const E = window.NM_ENGINE;
  const KEY = "nextmove.v1";
  const AVATARE = ["🦊", "🐼", "🐯", "🦁", "🐸", "🐙", "🦄", "🐲", "🐵", "🐨", "🐧", "🦉", "🐬", "🐝", "🦋", "🌟", "🚀", "⚡", "🔥", "🌈", "🎧", "🛹", "⚽", "🎨"];
  const LINKS = {
    berufe: "https://www.berufsberatung.ch/de/start-suche/berufe-efz-eba",
    lehrstellen: "https://www.berufsberatung.ch/de/start-suche/lehrstellen",
    schnuppern: "https://www.berufsberatung.ch/de/start-suche/schnupperadressen",
    schnupperInfo: "https://www.berufsberatung.ch/de/lehre-und-schule/alles-ueber-die-schnupperlehre",
    bewerbung: "https://www.berufsberatung.ch/de/lehre-und-schule/lehrstellenbewerbung",
    biz: "https://www.berufsberatung.ch/de/die-berufs-studien-und-laufbahnberatung-der-schweiz",
    mittelschulen: "https://www.berufsberatung.ch/de/lehre-und-schule/mittelschulen-und-maturitaeten",
    sieben: "https://www.berufsberatung.ch/de/lehre-und-schule/in-7-schritten-zur-berufswahl",
    sbfi: (id) => `https://www.becc.admin.ch/becc/public/bvz/beruf/show/${id}`
  };
  const BM = {
    T: "Technik, Architektur, Life Sciences",
    N: "Natur, Landschaft und Lebensmittel",
    W: "Wirtschaft und Dienstleistungen",
    G: "Gestaltung und Kunst",
    GS: "Gesundheit und Soziales"
  };
  const NOTEN = [
    { id: "de", label: "Deutsch" },
    { id: "ma", label: "Mathematik" },
    { id: "fr", label: "Französisch" },
    { id: "en", label: "Englisch" },
    { id: "nt", label: "Natur & Technik" }
  ];
  const STUDIUM = {
    hand: "Architektur, Bauingenieurwesen",
    tech: "Elektrotechnik, Maschinenbau, Physik (ETH/FH)",
    fahrzeug: "Maschineningenieurwesen, Verkehrssysteme",
    natur: "Umweltwissenschaften, Geografie, Agrarwissenschaften",
    tiere: "Veterinärmedizin, Biologie",
    essen: "Lebensmittelwissenschaften, Hotelfachschule",
    menschen: "Psychologie, Soziale Arbeit, Lehrperson (PH)",
    gesund: "Medizin, Pflege, Physiotherapie, Pharmazie",
    kreativ: "Design, Kunst, Architektur, Medien",
    digital: "Informatik, Data Science, Interaction Design",
    buero: "Wirtschaft, Recht, Betriebsökonomie",
    verkauf: "Kommunikation, Marketing, Betriebswirtschaft",
    labor: "Chemie, Biologie, Biochemie, Medizin",
    sport: "Sportwissenschaften, Physiotherapie"
  };

  // ---------- Speicher ----------
  let storageOk = true;
  let state = { profiles: [], activeId: null };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = JSON.parse(raw);
  } catch (e) {
    storageOk = false;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { storageOk = false; }
  }
  function profile() { return state.profiles.find((p) => p.id === state.activeId) || null; }
  function update(fn) {
    const p = profile();
    if (!p) return;
    fn(p);
    p.updatedAt = Date.now();
    save();
  }
  function neuesProfil() {
    const leer = state.profiles.find((x) => !x.name);
    if (leer) { state.activeId = leer.id; save(); return leer; }
    const p = {
      id: "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      createdAt: Date.now(), updatedAt: Date.now(),
      name: "", avatar: AVATARE[Math.floor(Math.random() * AVATARE.length)],
      noten: { de: 4.5, ma: 4.5, fr: 4.5, en: 4.5, nt: 4.5 },
      karten: {}, staerken: {}, schwaechen: [], hobbys: [], praef: {}, weg: {}, favoriten: [], done: {}, notizen: ""
    };
    state.profiles.push(p);
    state.activeId = p.id;
    save();
    return p;
  }

  // ---------- Helfer ----------
  const app = document.getElementById("app");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const img = (name) => `img/${name}.jpg`;
  const bg = (name) => `style="background-image:url('${img(name)}')"`;
  const go = (hash) => { if (location.hash === hash) render(); else location.hash = hash; };
  const feld = (id) => window.NM_FELDER[id];
  const beruf = (id) => window.NM_BERUFE.find((b) => b.id === id);
  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }
  function matchCls(pct) { return pct >= 75 ? "" : pct >= 55 ? "mid" : "low"; }
  function niveauLabels(p) {
    const k = E.kanton(p);
    return (k && k.niveaus) || window.NM_NIVEAUS_DEFAULT;
  }
  function wegLabel(code) {
    return {
      gym: "Gymnasium / Kantonsschule",
      bms: "Berufslehre mit Berufsmaturität (BMS)",
      lehre: "Berufslehre EFZ",
      bm2: "Berufslehre – Berufsmaturität später (BM2)"
    }[code];
  }

  // ---------- Schritte ----------
  const STEPS = [
    { id: "ueber", title: "Über mich", emoji: "👋", img: "hero-freunde", desc: "Name, Kanton, Schule", dauer: "1 Min.", screens: ["name", "basis", "klasse"] },
    { id: "schule", title: "Schule & Noten", emoji: "📒", img: "gymi-klasse", desc: "Deine Noten und Einschätzungen", dauer: "2 Min.", screens: ["noten", "lehrer"] },
    { id: "interessen", title: "Was reizt dich?", emoji: "💡", img: "lehre-technik", desc: "32 Karten – swipe dich durch!", dauer: "4 Min.", screens: ["swipe"] },
    { id: "staerken", title: "Deine Stärken", emoji: "💪", img: "team-lachen", desc: "Was kannst du richtig gut?", dauer: "2 Min.", screens: ["staerken1", "staerken2"] },
    { id: "schwaechen", title: "Was liegt dir weniger?", emoji: "🙃", img: "bms-lernen", desc: "Ehrlich sein lohnt sich", dauer: "1 Min.", screens: ["schwaechen"] },
    { id: "hobbys", title: "Hobbys & Freizeit", emoji: "🎸", img: "musik-instrumente", desc: "Was machst du gern?", dauer: "1 Min.", screens: ["hobbys"] },
    { id: "arbeitswelt", title: "Dies oder das?", emoji: "⚖️", img: "bau-team", desc: "Deine Wunsch-Arbeitswelt", dauer: "1 Min.", screens: window.NM_PRAEFERENZEN.map((x) => "praef:" + x.id) },
    { id: "weg", title: "Schule oder Lehre?", emoji: "🧭", img: "berge-morgen", desc: "11 Fragen zu deinem Weg", dauer: "3 Min.", screens: window.NM_WEGFRAGEN.map((x) => "weg:" + x.id) }
  ];
  const LOB = [
    "Stark! 💥", "Super gemacht! 🙌", "Weiter so! 🚀", "Mega! ⭐", "Du bist on fire! 🔥", "Nice! 😎", "Wow, top! 🏆", "Läuft bei dir! 🎉"
  ];

  function nextStep(p) {
    return STEPS.find((s) => !(p.done || {})[s.id]) || null;
  }

  // ---------- Start ----------
  function viewStart() {
    const profs = state.profiles.filter((p) => p.name);
    return `
    <section class="start" ${bg("hero-freunde")}>
      <div class="wrap">
        <div class="brandline"><div class="logo-mark">➜</div><b style="font-size:22px">Next Move</b></div>
        <h1>Dein nächster Schritt.</h1>
        <p class="tag">Gymnasium oder Berufslehre? Finde heraus, was zu dir passt – mit Fragen zu deinen Interessen, Stärken und Träumen. Und entdecke über 240 Lehrberufe der Schweiz.</p>
        <button class="btn big grad" data-action="neu">Los geht's ✨</button>
        ${profs.length ? `<div style="margin-top:26px;font-weight:700;opacity:.9">Weitermachen als …</div>
        <div class="profiles">${profs.map((p) => {
          const v = E.vollstaendigkeit(p);
          return `<button class="profile-chip" data-action="waehle" data-id="${p.id}"><span class="av">${p.avatar}</span><span>${esc(p.name)}<small>${v.pct}% geschafft</small></span></button>`;
        }).join("")}</div>` : ""}
        <div class="privacy">🔒 Deine Antworten bleiben nur auf diesem Gerät gespeichert.</div>
        <div style="margin-top:10px"><a class="link small" href="#/info">Infos für Eltern, Lehrpersonen & Berufsberatung</a></div>
        ${storageOk ? "" : `<div class="banner">Achtung: Dieser Browser erlaubt kein Speichern (z. B. privater Modus). Deine Antworten gehen beim Schliessen verloren.</div>`}
      </div>
    </section>`;
  }

  // ---------- Topbar ----------
  function topbar(p) {
    return `<header class="topbar"><div class="wrap">
      <a class="logo" href="#/home"><span class="logo-mark">➜</span><span class="word">Next Move</span></a>
      <span class="spacer"></span>
      <a class="btn soft sm" href="#/berufe">🔎 Berufe</a>
      ${p ? `<button class="avatar-pill" data-action="profilmenu"><span class="av">${p.avatar}</span>${esc(p.name || "Ich")}</button>` : ""}
    </div></header>`;
  }

  // ---------- Home ----------
  function viewHome(p) {
    const v = E.vollstaendigkeit(p);
    const nxt = nextStep(p);
    const circ = 2 * Math.PI * 54;
    const hello = v.pct === 0 ? `Schön, dass du da bist! Acht kurze Etappen – dann weisst du mehr über deinen Weg.`
      : v.pct < 100 ? `Du hast schon ${v.erledigt} von ${v.total} Etappen geschafft. ${v.kern ? "Deine Auswertung ist bereit!" : "Bleib dran!"}`
      : `Alle Etappen geschafft – deine Auswertung wartet auf dich! 🎉`;
    return `${topbar(p)}
    <main class="wrap">
      <section class="hello">
        <div>
          <h1>Hey ${esc(p.name)} ${p.avatar}</h1>
          <p>${hello}</p>
          <div class="row">
            ${nxt ? `<button class="btn white big" data-action="schritt" data-id="${nxt.id}">${nxt.emoji} ${v.pct === 0 ? "Starten" : "Weiter"}: ${nxt.title}</button>` : ""}
            ${v.kern ? `<a class="btn ${nxt ? "ghost" : "white big"}" style="${nxt ? "color:#fff;border-color:rgba(255,255,255,.5)" : ""}" href="#/auswertung">🏁 Meine Auswertung</a>` : ""}
          </div>
        </div>
        <div class="ring">
          <svg width="100%" height="100%" viewBox="0 0 132 132"><circle cx="66" cy="66" r="54" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="14"/>
          <circle cx="66" cy="66" r="54" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - v.pct / 100)}"/></svg>
          <div class="lbl"><div>${v.pct}%<small>geschafft</small></div></div>
        </div>
      </section>

      <div class="section-title"><h2>Deine Etappen</h2><span class="muted">Tippe auf eine Etappe, um sie zu starten oder zu ändern.</span></div>
      <div class="tiles">
        ${STEPS.map((s, i) => {
          const done = (p.done || {})[s.id];
          return `<button class="tile ${nxt && nxt.id === s.id ? "next" : ""}" ${bg(s.img)} data-action="schritt" data-id="${s.id}">
            <span class="num">${s.emoji}</span>
            <span class="status ${done ? "done" : ""}">${done ? "✓ Erledigt" : s.dauer}</span>
            <div class="in"><h3>${i + 1}. ${s.title}</h3><p>${s.desc}</p></div>
          </button>`;
        }).join("")}
      </div>

      <div class="section-title"><h2>Entdecken</h2></div>
      <div class="cards2">
        <button class="cta-card" data-action="nav" data-href="#/berufe"><span class="ico">🔎</span><span><h3>Berufe entdecken</h3><p>${window.NM_BERUFE.length} Lehrberufe aus dem SBFI-Berufsverzeichnis – mit Kurzbeschrieb.</p></span></button>
        <button class="cta-card" data-action="nav" data-href="#/berufe?fav=1"><span class="ico">❤️</span><span><h3>Meine Favoriten</h3><p>${(p.favoriten || []).length ? (p.favoriten || []).length + " Berufe gemerkt" : "Merke dir Berufe mit dem Herz."}</p></span></button>
        <button class="cta-card" data-action="nav" data-href="#/auswertung" ${v.kern ? "" : "disabled style='opacity:.6'"}><span class="ico">🏁</span><span><h3>Auswertung</h3><p>${v.kern ? "Dein Weg, deine Top-Berufe und nächste Schritte." : "Wird nach den Etappen 1, 2, 3 und 8 freigeschaltet."}</p></span></button>
      </div>
      <footer class="foot">Next Move · Orientierungshilfe für die Berufs- und Schulwahl in der Schweiz · <a href="#/info">Infos & Quellen</a></footer>
    </main>`;
  }

  // ---------- Wizard ----------
  let wiz = { step: null, idx: 0 };
  function viewWizard(p, stepId, idx) {
    const s = STEPS.find((x) => x.id === stepId);
    if (!s) return viewHome(p);
    idx = Math.max(0, Math.min(idx, s.screens.length - 1));
    wiz = { step: s, idx };
    p.pos = p.pos || {};
    if (p.pos[s.id] !== idx) { p.pos[s.id] = idx; save(); }
    const scr = SCREENS[s.screens[idx].split(":")[0]];
    const arg = s.screens[idx].split(":")[1];
    const total = s.screens.length;
    const prog = s.id === "interessen"
      ? Object.keys(p.karten || {}).length / window.NM_KARTEN.length
      : (idx + (scr.valid(p, arg) ? 1 : 0)) / total;
    return `<div class="wizard">
      <div class="wiz-top"><div class="wrap">
        <button class="iconbtn" data-action="nav" data-href="#/home" aria-label="Zur Übersicht">✕</button>
        <div class="wiz-title">${s.emoji} ${s.title}<small>${total > 1 ? `Frage ${idx + 1} von ${total}` : "Etappe " + (STEPS.indexOf(s) + 1) + " von " + STEPS.length}</small></div>
        <div class="bar"><i style="width:${Math.round(prog * 100)}%"></i></div>
      </div></div>
      <div class="wiz-body"><div class="wrap" id="screen">${scr.html(p, arg)}</div></div>
      ${scr.noFoot ? "" : `<div class="wiz-foot"><div class="wrap">
        <button class="btn ghost" data-action="zurueck">‹ Zurück</button>
        <button class="btn big" data-action="weiter" id="weiterBtn" ${scr.valid(p, arg) ? "" : "disabled"}>${idx === total - 1 ? "Fertig ✓" : "Weiter ›"}</button>
      </div></div>`}
    </div>`;
  }
  function refreshWeiter() {
    const p = profile();
    const b = document.getElementById("weiterBtn");
    if (!b || !wiz.step) return;
    const [name, arg] = wiz.step.screens[wiz.idx].split(":");
    b.disabled = !SCREENS[name].valid(p, arg);
  }
  function weiter() {
    const s = wiz.step;
    if (wiz.idx < s.screens.length - 1) go(`#/schritt/${s.id}/${wiz.idx + 1}`);
    else abschliessen(s);
  }
  function abschliessen(s) {
    const p = profile();
    const warKern = E.vollstaendigkeit(p).kern;
    update((p) => { p.done = p.done || {}; p.done[s.id] = true; });
    const v = E.vollstaendigkeit(p);
    const nxt = nextStep(p);
    render();
    confetti();
    const neuKern = v.kern && !warKern;
    showOverlay(`<div class="celebrate">
      <div class="badge">${s.emoji}</div>
      <h2>${LOB[Math.floor(Math.random() * LOB.length)]}</h2>
      <p class="muted">Etappe «${s.title}» geschafft – du bist jetzt bei <b>${v.pct}%</b>.</p>
      ${neuKern ? `<p><b>Deine Auswertung ist freigeschaltet!</b> ${nxt ? "Mit den restlichen Etappen wird sie noch genauer." : ""}</p>` : ""}
      <div class="btns">
        ${neuKern || !nxt ? `<button class="btn grad big" data-action="nav" data-href="#/auswertung">🏁 Zur Auswertung</button>` : ""}
        ${nxt ? `<button class="btn ${neuKern ? "soft" : "big"}" data-action="schritt" data-id="${nxt.id}">${nxt.emoji} Weiter: ${nxt.title}</button>` : ""}
        <button class="btn ghost" data-action="nav" data-href="#/home">Zur Übersicht</button>
      </div></div>`);
  }

  // Einzelne Fragebildschirme
  const SCREENS = {
    name: {
      html: (p) => `<div class="q-emoji">👋</div><div class="q-title">Wie heisst du?</div>
        <div class="q-sub">Dein Vorname oder Spitzname reicht.</div>
        <input class="input" id="nameInput" maxlength="30" autocomplete="off" placeholder="Dein Name" value="${esc(p.name)}">
        <div class="q-sub" style="margin:28px 0 12px">Wähle dein Avatar:</div>
        <div class="choice-grid avatars">${AVATARE.map((a) => `<button class="choice avatar ${p.avatar === a ? "on" : ""}" data-action="set" data-k="avatar" data-v="${a}">${a}</button>`).join("")}</div>`,
      valid: (p) => !!(p.name && p.name.trim())
    },
    basis: {
      html: (p) => `<div class="q-emoji">📍</div><div class="q-title">Wie alt bist du – und wo wohnst du?</div>
        <div class="chips" style="margin-bottom:26px">${[13, 14, 15, 16, 17].map((a) => `<button class="chip ${p.alter === a ? "on" : ""}" data-action="set" data-k="alter" data-v="${a}" data-num="1">${a === 17 ? "17+" : a} Jahre</button>`).join("")}</div>
        <div class="q-sub" style="margin-bottom:12px">Dein Kanton:</div>
        <div class="choice-grid">${window.NM_KANTONE.map((k) => `<button class="choice ${p.kanton === k.code ? "on" : ""}" data-action="set" data-k="kanton" data-v="${k.code}"><span class="code">${k.code}</span>${k.name}</button>`).join("")}</div>`,
      valid: (p) => !!(p.alter && p.kanton)
    },
    klasse: {
      html: (p) => {
        const nv = niveauLabels(p);
        return `<div class="q-emoji">🏫</div><div class="q-title">In welcher Klasse bist du?</div>
        <div class="choice-grid wide" style="margin-bottom:26px">${[
          [7, "1. Oberstufe", "7. Schuljahr (9H)"], [8, "2. Oberstufe", "8. Schuljahr (10H)"], [9, "3. Oberstufe", "9. Schuljahr (11H)"], [10, "Nach der Oberstufe", "10. Schuljahr, Brückenangebot …"]
        ].map(([v, l, s]) => `<button class="choice ${p.schuljahr === v ? "on" : ""}" data-action="set" data-k="schuljahr" data-v="${v}" data-num="1"><span>${l}<small>${s}</small></span></button>`).join("")}</div>
        <div class="q-sub" style="margin-bottom:12px">Auf welchem Niveau bist du (in den meisten Fächern)?</div>
        <div class="choice-grid wide">${[
          [0, "🚀", nv[0], "Höchste Anforderungen"], [1, "⭐", nv[1], "Mittlere Anforderungen"], [2, "🌱", nv[2], "Grundansprüche"], [3, "🎓", "Untergymnasium / Progymnasium", "Ich bin schon im Gymi-Zug"]
        ].map(([v, e, l, s]) => `<button class="choice ${p.niveau === v ? "on" : ""}" data-action="set" data-k="niveau" data-v="${v}" data-num="1"><span class="e">${e}</span><span>${esc(l)}<small>${s}</small></span></button>`).join("")}</div>`;
      },
      valid: (p) => !!p.schuljahr && typeof p.niveau === "number"
    },
    noten: {
      html: (p) => {
        const n = p.noten || {};
        const s = E.notenschnitt(p);
        return `<div class="q-emoji">📒</div><div class="q-title">Deine aktuellen Noten</div>
        <div class="q-sub">Schätze deine Zeugnisnoten. Es geht nur um eine grobe Einschätzung – niemand bewertet dich hier.</div>
        <div class="card">${NOTEN.map((f) => {
          const on = typeof n[f.id] === "number";
          return `<div class="grade-row ${on ? "" : "off"}">
            <label>${f.label}<br><button class="toggle" data-action="notetoggle" data-id="${f.id}">${on ? "Habe ich nicht" : "+ Note eintragen"}</button></label>
            ${on ? `<input type="range" min="1" max="6" step="0.5" value="${n[f.id]}" data-input="note" data-id="${f.id}">` : `<span class="muted small">–</span>`}
            <span class="grade-val" id="gv-${f.id}">${on ? n[f.id].toFixed(1) : "–"}</span>
          </div>`;
        }).join("")}
        <div class="avg-box"><span style="font-size:34px">🧮</span><span>Dein Schnitt<br><b id="avgVal">${s === null ? "–" : s.toFixed(2)}</b></span></div></div>`;
      },
      valid: (p) => E.notenschnitt(p) !== null
    },
    lehrer: {
      html: (p) => `<div class="q-emoji">🗣️</div><div class="q-title">Was meinen die anderen?</div>
        <div class="q-sub">Was sagt deine Klassenlehrperson zu deinem Weg nach der Oberstufe?</div>
        <div class="choice-grid wide" style="margin-bottom:28px">${[
          ["gym", "🎓", "Gymnasium wäre möglich"], ["lehre", "🛠️", "Eher eine Berufslehre"], ["offen", "🤷", "Wir haben noch nicht darüber gesprochen"]
        ].map(([v, e, l]) => `<button class="choice ${p.lehrer === v ? "on" : ""}" data-action="set" data-k="lehrer" data-v="${v}"><span class="e">${e}</span>${l}</button>`).join("")}</div>
        <div class="q-sub" style="margin-bottom:12px">Und was wünschen sich deine Eltern? <span class="small">(fliesst nicht in die Auswertung ein – gut fürs Gespräch)</span></div>
        <div class="choice-grid wide">${[
          ["gym", "🎓", "Eher Gymnasium"], ["lehre", "🛠️", "Eher Berufslehre"], ["frei", "💬", "Ich soll selbst entscheiden"], ["offen", "🤷", "Weiss ich nicht"]
        ].map(([v, e, l]) => `<button class="choice ${p.eltern === v ? "on" : ""}" data-action="set" data-k="eltern" data-v="${v}"><span class="e">${e}</span>${l}</button>`).join("")}</div>`,
      valid: (p) => !!p.lehrer
    },
    swipe: {
      noFoot: true,
      html: (p) => {
        const offen = window.NM_KARTEN.filter((k) => !(p.karten || {})[k.id]);
        const n = window.NM_KARTEN.length - offen.length;
        if (!offen.length) {
          return `<div class="center"><div class="q-emoji">🎉</div><div class="q-title">Alle Karten geschafft!</div>
            <p class="q-sub">Du kannst nochmals von vorne beginnen oder weitergehen.</p>
            <div class="row" style="justify-content:center"><button class="btn ghost" data-action="kartenreset">↺ Nochmals swipen</button><button class="btn big" data-action="weiter">Fertig ✓</button></div></div>`;
        }
        const [a, b] = offen;
        return `<div class="center q-title" style="font-size:clamp(22px,3vw,30px)">Würdest du das gern machen?</div>
          <div class="counter">${n + 1} / ${window.NM_KARTEN.length}</div>
          <div class="deck" id="deck">
            ${b ? `<div class="swipe-card under" ${bg(b.img)}><div class="txt">${esc(b.text)}</div></div>` : ""}
            <div class="swipe-card" id="topCard" data-id="${a.id}" ${bg(a.img)}>
              <span class="stamp yes">JA!</span><span class="stamp no">NEE</span><span class="stamp maybe">VIELLEICHT</span>
              <div class="txt">${esc(a.text)}</div>
            </div>
          </div>
          <div class="swipe-actions">
            <button class="swipe-btn" data-action="karte" data-v="nein" aria-label="Nein">👎</button>
            <button class="swipe-btn maybe" data-action="karte" data-v="vielleicht" aria-label="Vielleicht">🤷</button>
            <button class="swipe-btn" data-action="karte" data-v="ja" aria-label="Ja">👍</button>
          </div>
          <div class="swipe-hint">Wische nach rechts für «Ja», nach links für «Nein». ${n > 0 ? `<button class="toggle" data-action="kartezurueck">↶ Rückgängig</button>` : ""}</div>`;
      },
      valid: (p) => Object.keys(p.karten || {}).length >= window.NM_KARTEN.length
    },
    staerken1: { html: (p) => staerkenHtml(p, 0, 6), valid: (p) => staerkenValid(p, 0, 6) },
    staerken2: { html: (p) => staerkenHtml(p, 6, 11), valid: (p) => staerkenValid(p, 6, 11) },
    schwaechen: {
      html: (p) => `<div class="q-emoji">🙃</div><div class="q-title">Was liegt dir weniger?</div>
        <div class="q-sub">Jede und jeder hat Dinge, die nicht so Spass machen. Wähle alles, was für dich zutrifft – oder nichts.</div>
        <div class="chips">${window.NM_SCHWAECHEN.map((s) => `<button class="chip ${(p.schwaechen || []).includes(s.id) ? "on" : ""}" data-action="toggle" data-k="schwaechen" data-v="${s.id}">${s.emoji} ${s.label}</button>`).join("")}</div>`,
      valid: () => true
    },
    hobbys: {
      html: (p) => `<div class="q-emoji">🎸</div><div class="q-title">Was machst du in deiner Freizeit?</div>
        <div class="q-sub">Wähle alles, was du gern machst.</div>
        <div class="chips">${window.NM_HOBBYS.map((h) => `<button class="chip ${(p.hobbys || []).includes(h.id) ? "on" : ""}" data-action="toggle" data-k="hobbys" data-v="${h.id}">${h.emoji} ${h.label}</button>`).join("")}</div>
        <div class="q-sub" style="margin:26px 0 10px">Sonst noch etwas? <span class="small">(freiwillig)</span></div>
        <textarea class="input" data-input="text" data-k="hobbyText" placeholder="z. B. Pfadi, Unihockey, Musik produzieren …">${esc(p.hobbyText || "")}</textarea>`,
      valid: (p) => (p.hobbys || []).length > 0 || !!(p.hobbyText || "").trim()
    },
    praef: {
      html: (p, id) => {
        const q = window.NM_PRAEFERENZEN.find((x) => x.id === id);
        const v = (p.praef || {})[id];
        const opts = [[-2, "Klar " + q.links.label], [-1, "Eher " + q.links.label], [0, "Beides"], [1, "Eher " + q.rechts.label], [2, "Klar " + q.rechts.label]];
        return `<div class="center q-title">Was passt eher zu dir?</div><div class="q-sub center">Tippe auf die Skala.</div>
        <div class="versus">
          <div class="vs-side ${v < 0 ? "lean" : ""}"><span class="e">${q.links.emoji}</span><b>${q.links.label}</b></div>
          <div class="vs-mid">oder</div>
          <div class="vs-side ${v > 0 ? "lean" : ""}"><span class="e">${q.rechts.emoji}</span><b>${q.rechts.label}</b></div>
        </div>
        <div class="vs-scale">${opts.map(([o, l]) => `<button class="vs-dot ${v === o ? "on" : ""}" data-action="praef" data-id="${id}" data-v="${o}">${l}</button>`).join("")}</div>`;
      },
      valid: (p, id) => typeof (p.praef || {})[id] === "number"
    },
    weg: {
      html: (p, id) => {
        const i = window.NM_WEGFRAGEN.findIndex((x) => x.id === id);
        const q = window.NM_WEGFRAGEN[i];
        const v = (p.weg || {})[id];
        return `<div class="q-card"><div class="q-num">Frage ${i + 1} von ${window.NM_WEGFRAGEN.length}</div><div class="q-title">${esc(q.text)}</div></div>
        <div class="likert">${window.NM_LIKERT.map((l) => `<button class="lk ${v === l.v ? "on" : ""}" data-action="weg" data-id="${id}" data-v="${l.v}"><span class="e">${l.emoji}</span>${l.label}</button>`).join("")}</div>`;
      },
      valid: (p, id) => !!(p.weg || {})[id]
    }
  };
  function staerkenHtml(p, a, b) {
    const st = p.staerken || {};
    return `<div class="q-emoji">💪</div><div class="q-title">Wie gut kannst du das?</div>
      <div class="q-sub">1 = noch nicht so · 5 = richtig gut</div>
      ${window.NM_STAERKEN.slice(a, b).map((s) => `<div class="rate-row">
        <div class="lbl"><span class="e">${s.emoji}</span><span><b>${s.label}</b><small>${s.hint}</small></span></div>
        <div class="dots">${[1, 2, 3, 4, 5].map((n) => `<button class="dot ${st[s.id] === n ? "on" : st[s.id] > n ? "fill" : ""}" data-action="staerke" data-id="${s.id}" data-v="${n}">${n}</button>`).join("")}</div>
      </div>`).join("")}`;
  }
  function staerkenValid(p, a, b) {
    const st = p.staerken || {};
    return window.NM_STAERKEN.slice(a, b).every((s) => st[s.id]);
  }

  // Swipe-Gesten
  function initSwipe() {
    const card = document.getElementById("topCard");
    if (!card) return;
    let sx = 0, sy = 0, dx = 0, dy = 0, active = false;
    const stamps = { yes: card.querySelector(".stamp.yes"), no: card.querySelector(".stamp.no"), maybe: card.querySelector(".stamp.maybe") };
    card.addEventListener("pointerdown", (e) => {
      active = true; sx = e.clientX; sy = e.clientY; dx = dy = 0;
      card.classList.add("dragging"); card.setPointerCapture(e.pointerId);
    });
    card.addEventListener("pointermove", (e) => {
      if (!active) return;
      dx = e.clientX - sx; dy = e.clientY - sy;
      card.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx / 18}deg)`;
      stamps.yes.style.opacity = Math.max(0, Math.min(1, dx / 100));
      stamps.no.style.opacity = Math.max(0, Math.min(1, -dx / 100));
      stamps.maybe.style.opacity = Math.max(0, Math.min(1, -dy / 100 - Math.abs(dx) / 200));
    });
    const end = () => {
      if (!active) return;
      active = false; card.classList.remove("dragging");
      if (dx > 110) karteAntwort("ja");
      else if (dx < -110) karteAntwort("nein");
      else if (dy < -110) karteAntwort("vielleicht");
      else { card.style.transform = ""; Object.values(stamps).forEach((s) => (s.style.opacity = 0)); }
    };
    card.addEventListener("pointerup", end);
    card.addEventListener("pointercancel", end);
  }
  let kartenStapel = [];
  function karteAntwort(v) {
    const card = document.getElementById("topCard");
    if (!card || card.dataset.leaving) return;
    card.dataset.leaving = "1";
    const id = card.dataset.id;
    const fly = v === "ja" ? "translate(140%, -10%) rotate(24deg)" : v === "nein" ? "translate(-140%, -10%) rotate(-24deg)" : "translate(0, -130%)";
    card.style.transform = fly;
    card.style.opacity = "0";
    const stamp = card.querySelector(v === "ja" ? ".stamp.yes" : v === "nein" ? ".stamp.no" : ".stamp.maybe");
    if (stamp) stamp.style.opacity = 1;
    kartenStapel.push(id);
    update((p) => { p.karten = p.karten || {}; p.karten[id] = v; });
    setTimeout(() => {
      const p = profile();
      const n = Object.keys(p.karten).length;
      if (n >= window.NM_KARTEN.length) abschliessen(wiz.step);
      else {
        if (n % 8 === 0) toast(LOB[(n / 8) % LOB.length] + ` Noch ${window.NM_KARTEN.length - n} Karten`);
        render();
      }
    }, 260);
  }

  // ---------- Auswertung ----------
  function topBerufe(liste, n = 12, maxProFeld = 3) {
    const cnt = {}, res = [];
    for (const x of liste) {
      if ((cnt[x.b.feld] || 0) >= maxProFeld) continue;
      cnt[x.b.feld] = (cnt[x.b.feld] || 0) + 1;
      res.push(x);
      if (res.length >= n) break;
    }
    return res;
  }

  function viewAuswertung(p) {
    const v = E.vollstaendigkeit(p);
    if (!v.kern) {
      return `${topbar(p)}<main class="wrap"><div class="empty"><div class="e">🔒</div><h2>Noch nicht ganz …</h2>
        <p>Für deine Auswertung brauchst du die Etappen <b>Über mich</b>, <b>Schule & Noten</b>, <b>Was reizt dich?</b> und <b>Schule oder Lehre?</b>.</p>
        <a class="btn big" href="#/home">Zu den Etappen</a></div></main>`;
    }
    const w = E.weg(p);
    const liste = E.rangliste(p);
    const top = topBerufe(liste);
    const felder = E.topFelder(liste);
    const I = E.interessen(p);
    const dimsSorted = Object.keys(window.NM_DIMS).map((d) => ({ d, v: I[d] })).sort((a, b) => b.v - a.v);
    const k = w.kanton;
    const heroImg = { gym: "gymi-studierende", bms: "bms-lernen", lehre: "lehre-technik", bm2: "lehre-technik" }[w.empfehlung];
    const titel = {
      gym: "Gymnasium / Kantonsschule",
      bms: "Berufslehre mit Berufsmatur (BMS)",
      lehre: w.eba ? "Berufslehre (EFZ oder EBA)" : "Berufslehre EFZ"
    }[w.empfehlung];
    const untertitel = {
      gym: "Du lernst gern, denkst gern theoretisch und hast die schulischen Voraussetzungen. Das Gymnasium führt dich zur Matura – und damit an jede Uni und ETH.",
      bms: "Du willst praktisch arbeiten und trotzdem viel lernen. Mit der Berufsmatur machst du eine Lehre und hast danach den Weg an die Fachhochschule (und via Passerelle an die Uni) offen.",
      lehre: "Du willst anpacken, Neues im echten Arbeitsalltag lernen und eigenes Geld verdienen. Eine Berufslehre ist ein starker Start – und alle Wege bleiben offen."
    }[w.empfehlung];
    const alt = {
      gym: { t: "Gymnasium", d: "Auch das Gymnasium kommt für dich in Frage – vor allem, wenn du später an die Uni willst. Informiere dich über das Aufnahmeverfahren in deinem Kanton." },
      bms: { t: "Lehre mit BMS", d: "Eine Lehre mit Berufsmatur (BM1) verbindet Praxis und Schule. Danach steht dir die Fachhochschule offen – und via Passerelle sogar die Uni." },
      lehre: { t: "Berufslehre EFZ", d: "Eine Lehre ohne BMS gibt dir mehr Zeit im Betrieb. Die Berufsmatur kannst du auch nach der Lehre machen (BM2)." },
      bm2: { t: "Berufsmatur später (BM2)", d: "Nach der Lehre kannst du die Berufsmatur in 1 Jahr (Vollzeit) oder 2 Jahren (berufsbegleitend) nachholen – viele machen das!" }
    }[w.alternative];
    const favs = (p.favoriten || []).map(beruf).filter(Boolean);
    const datum = new Date().toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" });
    const staerkenTop = window.NM_STAERKEN.filter((s) => (p.staerken || {})[s.id] >= 4);
    const schw = window.NM_SCHWAECHEN.filter((s) => (p.schwaechen || []).includes(s.id));
    const hob = window.NM_HOBBYS.filter((h) => (p.hobbys || []).includes(h.id));
    const studium = dimsSorted.slice(0, 3).filter((x) => x.v > 0.15).map((x) => STUDIUM[x.d]);

    return `${topbar(p)}
    <main class="wrap" id="auswertung">
      <div class="print-head"><b>➜ Next Move – Auswertung von ${esc(p.name)}</b><span>${datum}${k ? " · Kanton " + k.name : ""}</span></div>
      ${v.pct < 100 ? `<div class="banner no-print">Tipp: Du hast ${v.total - v.erledigt} Etappe(n) noch nicht gemacht. Mit allen Antworten wird deine Auswertung genauer. <a href="#/home">Zu den Etappen</a></div>` : ""}

      <section class="result-hero" ${bg(heroImg)}><div class="in">
        <div class="kicker">${p.avatar} Dein Next Move</div>
        <h1>${titel}</h1>
        <p>${untertitel}</p>
      </div></section>

      <div class="section-title"><h2>🧭 Dein Kompass</h2></div>
      <div class="cards2">
        <div class="card">
          <h3>Wohin zieht es dich?</h3>
          <div class="meter"><div class="lbls"><span>🛠️ Praxis & Beruf</span><span>📚 Schule & Theorie</span></div>
            <div class="track split"><span class="marker" style="left:${w.schulePct}%"></span></div></div>
          <p class="muted small">${w.schulePct >= 58 ? "Du tendierst klar zu Schule und Theorie." : w.schulePct >= 42 ? "Du bist ziemlich ausgeglichen – Praxis und Schule reizen dich beide." : "Du tendierst klar zu Praxis und Arbeitswelt."}</p>
          <h3 style="margin-top:18px">Schulische Voraussetzungen</h3>
          <div class="meter"><div class="lbls"><span>🎓 Gymnasium</span><span>${w.gymReady}%</span></div><div class="track"><div class="fill" style="width:${w.gymReady}%"></div></div></div>
          <div class="meter"><div class="lbls"><span>📘 Berufsmatur (BMS)</span><span>${w.bmsReady}%</span></div><div class="track"><div class="fill" style="width:${w.bmsReady}%"></div></div></div>
          <p class="muted small">Schätzung aus deinen Noten (Schnitt ${w.notenschnitt !== null ? w.notenschnitt.toFixed(2) : "–"}), deinem Niveau${p.lehrer === "gym" || p.lehrer === "lehre" ? " und der Einschätzung deiner Lehrperson" : ""}.</p>
        </div>
        <div class="card">
          <h3>💬 Warum dieser Weg?</h3>
          <ul class="reasons">${w.gruende.map((g) => `<li><span class="e">✅</span><span>${esc(g)}</span></li>`).join("") || `<li>Deine Antworten sind sehr ausgeglichen – sprich mit deinen Eltern und der Berufsberatung darüber.</li>`}</ul>
          ${alt ? `<div class="card tint" style="margin-top:16px"><h3>🔀 Auch möglich: ${alt.t}</h3><p class="small" style="margin:0">${alt.d}</p></div>` : ""}
          ${w.fms ? `<div class="card tint" style="margin-top:12px"><h3>💡 Tipp: Fachmittelschule (FMS)</h3><p class="small" style="margin:0">Dich interessieren Menschen und Gesundheit. Die FMS bereitet auf Berufe in Gesundheit, Sozialem und Pädagogik vor (Fachmatur → Fachhochschule / PH).</p></div>` : ""}
          ${w.eba ? `<div class="card tint" style="margin-top:12px"><h3>🌱 Gut zu wissen: EBA</h3><p class="small" style="margin:0">Eine 2-jährige Lehre mit Berufsattest (EBA) ist ein guter Einstieg. Danach kannst du oft verkürzt ins EFZ wechseln.</p></div>` : ""}
        </div>
      </div>

      <div class="section-title"><h2>🪜 Kein Abschluss ohne Anschluss</h2></div>
      <div class="card">
        <p class="muted">Im Schweizer Bildungssystem bleiben alle Wege offen. So geht es weiter:</p>
        <div class="ladder">
          <div class="lane ${w.empfehlung === "gym" ? "on" : ""}"><span class="node">🎓 Gymnasium (4 J.)</span><span class="arr">→</span><span class="node">Gymnasiale Matura</span><span class="arr">→</span><span class="node">Universität / ETH / PH</span></div>
          <div class="lane ${w.empfehlung === "bms" ? "on" : ""}"><span class="node">🛠️ Lehre EFZ + BMS</span><span class="arr">→</span><span class="node">Berufsmatur</span><span class="arr">→</span><span class="node">Fachhochschule</span><span class="arr">→</span><span class="node">Passerelle → Uni</span></div>
          <div class="lane ${w.empfehlung === "lehre" ? "on" : ""}"><span class="node">🔧 Lehre EFZ (3–4 J.)</span><span class="arr">→</span><span class="node">BM2 oder Berufsprüfung</span><span class="arr">→</span><span class="node">Höhere Fachschule / FH</span></div>
          ${w.eba ? `<div class="lane on"><span class="node">🌱 Lehre EBA (2 J.)</span><span class="arr">→</span><span class="node">Lehre EFZ (verkürzt)</span><span class="arr">→</span><span class="node">Weiterbildung</span></div>` : ""}
        </div>
      </div>

      ${k ? `<div class="section-title"><h2>📍 Gymnasium & BMS im Kanton ${k.name}</h2></div>
      <div class="card">
        <p><b>${esc(k.kurz)}</b></p>
        ${k.details.length ? `<ul>${k.details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>` : ""}
        <p><b>BMS (Berufsmatur während der Lehre):</b> ${esc(k.bms || "Je nach Kanton prüfungsfrei mit guten Noten der Oberstufe oder über eine Aufnahmeprüfung an der Berufsmaturitätsschule. Frag bei deiner BMS bzw. beim Lehrbetrieb nach.")}</p>
        <p class="small muted">Stand gemäss kantonalen Angaben (IDES/EDK). Regeln und Termine ändern sich – prüfe die aktuellen Infos: <a href="${k.link}" target="_blank" rel="noopener">${k.link.replace("https://", "")}</a></p>
      </div>` : ""}

      <div class="section-title"><h2>💡 Deine Interessen</h2></div>
      <div class="cards2">
        <div class="card ibars">${dimsSorted.slice(0, 7).map((x) => `<div class="ib"><span class="e">${window.NM_DIMS[x.d].emoji}</span><span>${window.NM_DIMS[x.d].label}</span><span class="t"><i style="width:${Math.max(3, Math.round((x.v + 0.8) / 1.8 * 100))}%"></i></span><b>${Math.max(0, Math.round((x.v + 0.8) / 1.8 * 100))}</b></div>`).join("")}</div>
        <div class="card">
          ${staerkenTop.length ? `<h3>💪 Deine Stärken</h3><div class="chips" style="margin-bottom:16px">${staerkenTop.map((s) => `<span class="chip sm on">${s.emoji} ${s.label}</span>`).join("")}</div>` : ""}
          ${hob.length || p.hobbyText ? `<h3>🎸 Hobbys</h3><div class="chips" style="margin-bottom:16px">${hob.map((h) => `<span class="chip sm">${h.emoji} ${h.label}</span>`).join("")}${p.hobbyText ? `<span class="chip sm">✍️ ${esc(p.hobbyText)}</span>` : ""}</div>` : ""}
          ${schw.length ? `<h3>🙃 Liegt dir weniger</h3><div class="chips">${schw.map((s) => `<span class="chip sm">${s.emoji} ${s.label}</span>`).join("")}</div>` : ""}
          ${w.empfehlung === "gym" && studium.length ? `<h3 style="margin-top:16px">🎓 Studienrichtungen, die zu dir passen könnten</h3><ul class="small">${studium.map((s) => `<li>${s}</li>`).join("")}</ul>` : ""}
        </div>
      </div>

      <div class="section-title"><h2>🏆 Deine Top-Berufsfelder</h2></div>
      <div class="field-cards">${felder.map((f, i) => `<button class="field-card" ${bg(feld(f).img)} data-action="nav" data-href="#/berufe?feld=${f}">
        <span class="rank">#${i + 1}</span><div class="in"><h3 style="margin:0">${feld(f).emoji} ${feld(f).label}</h3><span class="small">${window.NM_BERUFE.filter((b) => b.feld === f).length} Berufe ansehen ›</span></div></button>`).join("")}</div>

      <div class="section-title"><h2>✨ Berufe, die zu dir passen</h2><span class="muted">${w.empfehlung === "gym" ? "Auch mit Gymnasium spannend – z. B. zum Schnuppern." : "Tippe für Details und Links."}</span></div>
      <div class="grid-cards">${top.map((x) => jobCard(x.b, x.pct, p)).join("")}</div>

      ${favs.length ? `<div class="section-title"><h2>❤️ Meine Favoriten</h2></div>
      <div class="grid-cards">${favs.map((b) => { const m = liste.find((x) => x.b.id === b.id); return jobCard(b, m && m.pct, p); }).join("")}</div>` : ""}

      <div class="section-title"><h2>🚀 Deine nächsten Schritte</h2></div>
      <div class="card"><ol class="timeline">${naechsteSchritte(p, w, top).map((s) => `<li><b>${s.t}</b><span class="muted">${s.d}</span></li>`).join("")}</ol></div>

      <div class="section-title"><h2>🗨️ Fürs Gespräch mit Eltern & Berufsberatung</h2></div>
      <div class="cards2">
        <div class="card"><ul class="qlist">${gespraechsfragen(p, w).map((q) => `<li>${q}</li>`).join("")}</ul></div>
        <div class="card"><h3>📝 Meine Gedanken & Fragen</h3>
          <textarea class="input" data-input="text" data-k="notizen" placeholder="Was überrascht dich? Was möchtest du noch klären?">${esc(p.notizen || "")}</textarea></div>
      </div>

      <p class="disclaimer" style="margin-top:24px">ℹ️ Next Move ist eine Orientierungshilfe, kein Test mit «richtig» oder «falsch». Die Auswertung zeigt Tendenzen aus deinen Antworten. Entscheide gemeinsam mit deinen Eltern, deiner Lehrperson und der Berufsberatung (BIZ) – und probiere Berufe beim Schnuppern aus. Berufsdaten: SBFI-Berufsverzeichnis.</p>

      <div class="toolbar">
        <button class="btn grad big" data-action="drucken">🖨️ Drucken / als PDF sichern</button>
        <a class="btn soft" href="#/home">✏️ Antworten ändern</a>
        <button class="btn ghost" data-action="neustart">↺ Nochmals neu starten</button>
      </div>
    </main>`;
  }

  function naechsteSchritte(p, w, top) {
    const sj = p.schuljahr || 8;
    const k = w.kanton;
    const topNamen = top.slice(0, 3).map((x) => x.b.name).join(", ");
    const s = [{ t: "Auswertung besprechen", d: "Zeig diese Auswertung deinen Eltern und deiner Lehrperson. Was sehen sie? Was überrascht dich?" }];
    s.push({ t: "Beratung im BIZ", d: `Vereinbare einen Termin bei der Berufsberatung deines Kantons – kostenlos. <a href="${LINKS.biz}" target="_blank" rel="noopener">Adressen ›</a>` });
    if (w.empfehlung === "gym") {
      s.push({ t: `Aufnahmeverfahren${k ? " im Kanton " + k.name : ""} klären`, d: `${k ? esc(k.kurz) + " " : ""}Achte auf Anmeldefristen – oft schon im Winter. <a href="${k ? k.link : LINKS.mittelschulen}" target="_blank" rel="noopener">Infos ›</a>` });
      s.push({ t: "Infoabend & Schnuppertag an der Kanti", d: "Besuche einen Informationsanlass oder Schnuppertag an der Kantonsschule." });
      s.push({ t: "Plan B schnuppern", d: `Schnuppere trotzdem in einem Beruf, z. B. ${esc(topNamen)} – so lernst du die Arbeitswelt kennen. <a href="${LINKS.schnuppern}" target="_blank" rel="noopener">Schnupperadressen ›</a>` });
    } else {
      s.push({ t: "Schnuppern, schnuppern, schnuppern", d: `Probiere deine Top-Berufe aus: ${esc(topNamen)}. <a href="${LINKS.schnuppern}" target="_blank" rel="noopener">Schnupperadressen finden ›</a>` });
      if (w.empfehlung === "bms") s.push({ t: "BMS-Aufnahme klären", d: `${k && k.bms ? esc(k.bms) : "Informiere dich über die Aufnahme an die Berufsmaturitätsschule (prüfungsfrei mit Noten oder Aufnahmeprüfung)."} Sprich das auch beim Lehrbetrieb an.` });
      s.push({ t: sj <= 8 ? "Bewerbungsdossier vorbereiten" : "Jetzt bewerben", d: `Lebenslauf, Motivationsschreiben, Zeugnisse und Schnupperberichte. ${sj <= 8 ? "Die meisten Lehrstellen werden ab dem Sommer vor dem letzten Schuljahr vergeben." : "Viele Lehrstellen sind ab August ausgeschrieben – starte früh!"} <a href="${LINKS.bewerbung}" target="_blank" rel="noopener">Tipps ›</a>` });
      s.push({ t: "Lehrstellen suchen", d: `Auf dem Lehrstellennachweis LENA findest du offene Lehrstellen in deiner Region. <a href="${LINKS.lehrstellen}" target="_blank" rel="noopener">Zur Lehrstellensuche ›</a>` });
    }
    s.push({ t: "Next Move nochmals machen", d: "Nach dem Schnuppern siehst du vieles klarer. Passe deine Antworten an und vergleiche." });
    return s;
  }

  function gespraechsfragen(p, w) {
    const q = [
      "Welche meiner Top-Berufe überraschen mich – und warum?",
      "Was hat mir beim Schnuppern (oder in Projekten) am meisten Spass gemacht?",
      "Wo seht ihr (Eltern, Lehrperson) meine grössten Stärken?",
      w.empfehlung === "gym" ? "Bin ich bereit, vier weitere Jahre intensiv zur Schule zu gehen?" : "Möchte ich die Berufsmatur während oder nach der Lehre machen?",
      "Welcher Weg hält mir für später möglichst viele Türen offen?"
    ];
    if (p.eltern && p.lehrer && p.eltern !== p.lehrer && p.eltern !== "frei" && p.eltern !== "offen" && p.lehrer !== "offen") {
      q.push("Meine Eltern und meine Lehrperson sehen meinen Weg unterschiedlich – was sind ihre Gründe?");
    }
    if (w.fms) q.push("Wäre die Fachmittelschule (FMS) eine Option für mich?");
    return q;
  }

  // ---------- Berufe-Explorer ----------
  let filter = { q: "", feld: null, abschluss: null, fav: false, sort: null };
  function jobCard(b, pct, p) {
    const f = feld(b.feld);
    const fav = p && (p.favoriten || []).includes(b.id);
    return `<button class="jcard" data-action="beruf" data-id="${b.id}">
      <div class="img" ${bg(b.img)}>
        ${typeof pct === "number" ? `<span class="match ${matchCls(pct)}">${pct}% Match</span>` : ""}
        ${fav ? `<span class="heart">❤️</span>` : ""}
        <span class="femoji">${f.emoji}</span>
      </div>
      <div class="body"><h3>${esc(b.name)} ${b.abschluss}</h3><p>${esc(b.text)}</p>
        <div class="meta"><span class="pill ${b.abschluss.toLowerCase()}">${b.abschluss} · ${b.dauer} J.</span>${b.bm ? `<span class="pill bm">BM möglich</span>` : ""}</div></div>
    </button>`;
  }

  function viewBerufe(p, params) {
    if (params.has("feld")) filter.feld = params.get("feld");
    if (params.has("fav")) filter.fav = true;
    const hatProfil = p && (p.done || {}).interessen;
    if (filter.sort === null) filter.sort = hatProfil ? "match" : "az";
    return `${topbar(p)}
    <main class="wrap">
      <div class="section-title" style="margin-top:22px"><h2>🔎 Berufe entdecken</h2><span class="muted">${window.NM_BERUFE.length} berufliche Grundbildungen (EFZ & EBA) aus dem SBFI-Berufsverzeichnis</span></div>
      <div class="searchbar">
        <div class="search"><span class="e">🔎</span><input class="input" id="suche" placeholder="Beruf suchen, z. B. Informatik, Koch, Tiere …" value="${esc(filter.q)}" autocomplete="off"></div>
        <div class="hscroll">
          ${p ? `<button class="chip sm ${filter.fav ? "on" : ""}" data-action="filter" data-k="fav">❤️ Favoriten</button>` : ""}
          <button class="chip sm ${filter.abschluss === "EFZ" ? "on" : ""}" data-action="filter" data-k="abschluss" data-v="EFZ">EFZ (3–4 J.)</button>
          <button class="chip sm ${filter.abschluss === "EBA" ? "on" : ""}" data-action="filter" data-k="abschluss" data-v="EBA">EBA (2 J.)</button>
          ${hatProfil ? `<button class="chip sm ${filter.sort === "match" ? "on" : ""}" data-action="filter" data-k="sort" data-v="match">✨ Passt am besten</button><button class="chip sm ${filter.sort === "az" ? "on" : ""}" data-action="filter" data-k="sort" data-v="az">A–Z</button>` : ""}
        </div>
        <div class="hscroll">
          <button class="chip sm ${!filter.feld ? "on" : ""}" data-action="filter" data-k="feld" data-v="">Alle Felder</button>
          ${Object.entries(window.NM_FELDER).map(([id, f]) => `<button class="chip sm ${filter.feld === id ? "on" : ""}" data-action="filter" data-k="feld" data-v="${id}">${f.emoji} ${f.label}</button>`).join("")}
        </div>
      </div>
      <div id="berufListe">${berufListe(p)}</div>
    </main>`;
  }
  function berufListe(p) {
    const hatProfil = p && (p.done || {}).interessen;
    const matches = hatProfil ? Object.fromEntries(E.rangliste(p).map((x) => [x.b.id, x.pct])) : {};
    const roh = filter.q.trim().toLowerCase();
    const q = roh.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Berufsnamen: Teilwort-Suche (Polymechaniker); Beschreibungen: nur Wortanfänge
    const re = q ? new RegExp("(^|[\\s\\-/(«])" + q) : null;
    const imNamen = (b) => [b.name, b.m, b.w].join(" ").toLowerCase().includes(roh);
    let liste = window.NM_BERUFE.filter((b) =>
      (!filter.feld || b.feld === filter.feld) &&
      (!filter.abschluss || b.abschluss === filter.abschluss) &&
      (!filter.fav || (p && (p.favoriten || []).includes(b.id))) &&
      (!re || imNamen(b) || re.test([b.text, feld(b.feld).label, ...(b.fr || [])].join(" ").toLowerCase()))
    );
    if (filter.sort === "match" && hatProfil) liste = liste.slice().sort((a, b) => matches[b.id] - matches[a.id]);
    if (re) liste = liste.filter(imNamen).concat(liste.filter((b) => !imNamen(b)));
    if (!liste.length) return `<div class="empty"><div class="e">🤔</div><h3>Nichts gefunden</h3><p>Versuche ein anderes Stichwort oder entferne Filter.</p></div>`;
    return `<p class="muted small">${liste.length} Berufe</p><div class="grid-cards">${liste.map((b) => jobCard(b, matches[b.id], p)).join("")}</div>`;
  }

  function zeigeBeruf(id) {
    const b = beruf(id);
    if (!b) return;
    const p = profile();
    const f = feld(b.feld);
    const m = p && (p.done || {}).interessen ? E.match(p, b) : null;
    const fav = p && (p.favoriten || []).includes(b.id);
    const namen = b.m === b.w ? b.m : `${b.w} / ${b.m}`;
    showOverlay(`<div class="sheet" role="dialog" aria-label="${esc(b.name)}">
      <div class="sheet-hero" ${bg(b.img)}>
        ${p ? `<button class="iconbtn sheet-fav" data-action="fav" data-id="${b.id}" aria-label="Favorit">${fav ? "❤️" : "🤍"}</button>` : ""}
        <button class="iconbtn sheet-close" data-action="schliessen" aria-label="Schliessen">✕</button>
        <div class="in"><span class="pill light">${f.emoji} ${f.label}</span><h2>${esc(b.name)} ${b.abschluss}</h2></div>
      </div>
      <div class="sheet-body">
        ${m ? `<div class="row" style="margin-bottom:12px"><span class="match ${matchCls(m.pct)}">${m.pct}% Match</span></div>` : ""}
        <p style="font-size:19px">${esc(b.text)}</p>
        ${m && m.gruende.length ? `<ul class="reasons">${m.gruende.map((g) => `<li><span class="e">${g.plus ? "👍" : "⚠️"}</span><span>${esc(g.text)}</span></li>`).join("")}</ul>` : ""}
        <div class="facts">
          <div class="fact"><small>Abschluss</small><b>${b.abschluss === "EFZ" ? "Eidg. Fähigkeitszeugnis (EFZ)" : "Eidg. Berufsattest (EBA)"}</b></div>
          <div class="fact"><small>Lehrdauer</small><b>${b.dauer} Jahre</b></div>
          <div class="fact"><small>Schulische Anforderungen</small><b>${["", "Grundlegend", "Mittel", "Hoch"][b.niveau]}</b></div>
          <div class="fact"><small>Berufsmatur</small><b>${b.bm ? "Ja – Richtung " + BM[b.bm] : "Nach EBA: Weiter zum EFZ"}</b></div>
        </div>
        ${b.fr && b.fr.length ? `<p><b>Fachrichtungen:</b> ${b.fr.map(esc).join(", ")}</p>` : ""}
        <p class="small muted">Offizielle Bezeichnung: ${esc(namen)} ${b.abschluss} · Berufsnummer ${b.id}</p>
        <div class="links">
          <a class="linkbtn" href="${LINKS.sbfi(b.id)}" target="_blank" rel="noopener"><span class="e">🏛️</span><span>SBFI-Berufsverzeichnis<small>Offizielle Angaben, Bildungsplan, Verordnung</small></span></a>
          <a class="linkbtn" href="${LINKS.berufe}" target="_blank" rel="noopener"><span class="e">📘</span><span>Mehr auf berufsberatung.ch<small>Berufsbeschreibung, Videos, Anforderungen – nach «${esc(b.m)}» suchen</small></span></a>
          <a class="linkbtn" href="${LINKS.schnuppern}" target="_blank" rel="noopener"><span class="e">👀</span><span>Schnupperlehre finden<small>Schnupperadressen in deiner Region</small></span></a>
          <a class="linkbtn" href="${LINKS.lehrstellen}" target="_blank" rel="noopener"><span class="e">📋</span><span>Offene Lehrstellen<small>Lehrstellennachweis LENA</small></span></a>
        </div>
      </div></div>`);
  }

  // ---------- Info ----------
  function viewInfo(p) {
    return `${topbar(p)}<main class="wrap info" style="max-width:860px">
      <h1 style="margin-top:26px">Infos für Eltern, Lehrpersonen & Berufsberatung</h1>
      <div class="card"><h3>Was ist Next Move?</h3>
        <p>Next Move hilft Jugendlichen (ca. 14–16 Jahre), sich bewusst mit der Frage «Gymnasium oder Berufslehre?» auseinanderzusetzen. In acht kurzen Etappen beantworten sie Fragen zu Interessen, Stärken, Schwächen, Hobbys, Arbeitswelt und Schulweg. Am Schluss erhalten sie eine Auswertung mit Weg-Empfehlung (Gymnasium, Lehre mit BMS, Lehre), passenden Berufsfeldern, Top-Berufen und nächsten Schritten – zum Ausdrucken und Besprechen.</p>
        <p>Next Move ersetzt keine Berufsberatung. Es ist ein Gesprächsanstoss.</p></div>
      <div class="card"><h3>🔒 Datenschutz</h3>
        <p>Alle Antworten werden ausschliesslich lokal im Browser dieses Geräts gespeichert (localStorage). Es gibt kein Konto, keinen Server und keine Weitergabe von Daten. Wer das Gerät teilt, kann Profile über das Profilmenü löschen. Profile können als Datei exportiert und auf einem anderen Gerät importiert werden.</p>
        <div class="row"><button class="btn soft sm" data-action="export">⬇️ Profile exportieren</button><button class="btn soft sm" data-action="import">⬆️ Profile importieren</button><input type="file" id="importFile" accept="application/json" class="hidden"></div></div>
      <div class="card"><h3>Wie entsteht die Auswertung?</h3>
        <ul>
          <li><b>Weg-Empfehlung:</b> 11 Fragen zu Lernfreude, Studienwunsch, Praxisnähe und Motivation ergeben die Neigung «Schule ↔ Praxis». Zusammen mit Notenschnitt, Leistungsniveau, kantonalem Richtwert und Einschätzung der Lehrperson entsteht die Empfehlung Gymnasium, Lehre mit BMS oder Lehre (inkl. Hinweisen auf FMS und EBA).</li>
          <li><b>Berufs-Matching:</b> Jeder der ${window.NM_BERUFE.length} Berufe hat ein Interessenprofil, Merkmale (draussen, körperlich, Kundenkontakt, Genauigkeit, Arbeitszeiten, Höhe) und ein schulisches Anforderungsniveau. Diese werden mit Swipe-Antworten, Hobbys, Stärken, Präferenzen und «Was liegt dir weniger?» abgeglichen. Zu jedem Match werden die Gründe angezeigt.</li>
        </ul></div>
      <div class="card"><h3>Quellen</h3>
        <ul>
          <li>Berufe, Lehrdauer, Fachrichtungen: <a href="https://www.becc.admin.ch/becc/public/bvz/beruf/grundbildungen" target="_blank" rel="noopener">SBFI-Berufsverzeichnis, berufliche Grundbildungen</a> (Stand Oktober 2026). Kurzbeschreibungen und Interessenprofile: redaktionell für Next Move erstellt.</li>
          <li>Aufnahmeverfahren Gymnasium: IDES/EDK-Dossier «Übertritt in allgemeinbildende Schulen der Sekundarstufe II» (kantonale Angaben, Mai 2024), ergänzt um bekannte Änderungen. Bitte aktuelle Angaben beim Kanton prüfen.</li>
          <li>Weiterführende Infos: <a href="${LINKS.sieben}" target="_blank" rel="noopener">berufsberatung.ch – In 7 Schritten zur Berufswahl</a>, <a href="${LINKS.mittelschulen}" target="_blank" rel="noopener">Mittelschulen und Maturitäten</a>.</li>
          <li>Fotos: Unsplash (Unsplash-Lizenz).</li>
        </ul></div>
      <footer class="foot"><a href="${p ? "#/home" : "#/start"}">‹ Zurück</a></footer>
    </main>`;
  }

  // ---------- Overlay, Konfetti ----------
  function showOverlay(html) {
    closeOverlay();
    const o = document.createElement("div");
    o.className = "overlay";
    o.id = "overlay";
    o.innerHTML = html;
    o.addEventListener("click", (e) => { if (e.target === o) closeOverlay(); });
    document.body.appendChild(o);
  }
  function closeOverlay() {
    const o = document.getElementById("overlay");
    if (o) o.remove();
  }
  function confetti() {
    const c = document.createElement("canvas");
    c.id = "confetti";
    c.width = innerWidth; c.height = innerHeight;
    document.body.appendChild(c);
    const ctx = c.getContext("2d");
    const farben = ["#5b3df5", "#ff6a55", "#ffb020", "#0fb98a", "#2aa7ff", "#ff4fa3"];
    const teile = Array.from({ length: 140 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 200, y: innerHeight / 2.5,
      vx: (Math.random() - 0.5) * 16, vy: Math.random() * -16 - 4, r: Math.random() * 6 + 4,
      c: farben[Math.floor(Math.random() * farben.length)], a: Math.random() * Math.PI, va: (Math.random() - 0.5) * 0.3
    }));
    let t = 0;
    (function frame() {
      ctx.clearRect(0, 0, c.width, c.height);
      teile.forEach((s) => {
        s.vy += 0.45; s.x += s.vx; s.y += s.vy; s.a += s.va;
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a); ctx.fillStyle = s.c; ctx.fillRect(-s.r / 2, -s.r / 4, s.r, s.r / 2); ctx.restore();
      });
      if (++t < 110) requestAnimationFrame(frame); else c.remove();
    })();
  }

  function profilMenu() {
    const p = profile();
    showOverlay(`<div class="celebrate" style="text-align:left">
      <div class="badge">${p.avatar}</div>
      <h2 class="center">${esc(p.name)}</h2>
      <div class="btns">
        <button class="btn soft" data-action="schritt" data-id="ueber">✏️ Name & Angaben ändern</button>
        <button class="btn soft" data-action="wechseln">👥 Profil wechseln / neues Profil</button>
        <button class="btn soft" data-action="nav" data-href="#/info">ℹ️ Infos & Datenschutz</button>
        <button class="btn danger" data-action="loeschen">🗑️ Mein Profil löschen</button>
        <button class="btn ghost" data-action="schliessen">Schliessen</button>
      </div></div>`);
  }

  // ---------- Router ----------
  let lastRoute = "";
  function render() {
    closeOverlay();
    const [path, query] = (location.hash.replace(/^#/, "") || "/").split("?");
    const parts = path.split("/").filter(Boolean);
    const params = new URLSearchParams(query || "");
    const p = profile();
    const route = parts.join("/");
    const sameRoute = route === lastRoute;
    if (parts[0] === "berufe" && !sameRoute) filter = { q: "", feld: null, abschluss: null, fav: false, sort: null };
    lastRoute = route;
    let html;
    if (parts[0] === "info") html = viewInfo(p);
    else if (parts[0] === "berufe") html = viewBerufe(p, params);
    else if (!p || !p.name && parts[0] !== "schritt") html = viewStart();
    else if (parts[0] === "schritt") html = viewWizard(p, parts[1], parseInt(parts[2] || "0", 10));
    else if (parts[0] === "auswertung") html = viewAuswertung(p);
    else if (parts[0] === "start") html = viewStart();
    else html = viewHome(p);
    app.innerHTML = html;
    if (!sameRoute || parts[0] === "schritt") window.scrollTo(0, 0);
    if (parts[0] === "schritt") {
      initSwipe();
      const ni = document.getElementById("nameInput");
      if (ni && !ni.value) ni.focus();
    }
  }

  // ---------- Aktionen ----------
  const ACTIONS = {
    neu() { neuesProfil(); go("#/schritt/ueber/0"); },
    waehle(el) { state.activeId = el.dataset.id; save(); go("#/home"); },
    nav(el) { go(el.dataset.href); },
    schritt(el) {
      const p = profile();
      const s = STEPS.find((x) => x.id === el.dataset.id);
      // Erledigte Etappen beginnen von vorne, offene dort, wo man aufgehört hat
      const idx = (p.done || {})[s.id] ? 0 : (p.pos || {})[s.id] || 0;
      go(`#/schritt/${s.id}/${idx}`);
    },
    weiter() { weiter(); },
    zurueck() { if (wiz.idx > 0) go(`#/schritt/${wiz.step.id}/${wiz.idx - 1}`); else go("#/home"); },
    set(el) {
      const k = el.dataset.k;
      const v = el.dataset.num ? Number(el.dataset.v) : el.dataset.v;
      update((p) => { p[k] = v; });
      if (k === "kanton" || k === "avatar" || k === "alter" || k === "schuljahr" || k === "niveau" || k === "lehrer" || k === "eltern") {
        el.parentElement.querySelectorAll(".choice, .chip").forEach((c) => c.classList.toggle("on", c === el));
        refreshWeiter();
      }
    },
    toggle(el) {
      const k = el.dataset.k, v = el.dataset.v;
      update((p) => {
        p[k] = p[k] || [];
        p[k] = p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v];
      });
      el.classList.toggle("on");
      refreshWeiter();
    },
    notetoggle(el) {
      update((p) => { const n = p.noten; n[el.dataset.id] = typeof n[el.dataset.id] === "number" ? null : 4.5; });
      render();
    },
    staerke(el) {
      update((p) => { p.staerken = p.staerken || {}; p.staerken[el.dataset.id] = Number(el.dataset.v); });
      const v = Number(el.dataset.v);
      el.parentElement.querySelectorAll(".dot").forEach((d, i) => { d.className = "dot " + (i + 1 === v ? "on" : i + 1 < v ? "fill" : ""); });
      refreshWeiter();
    },
    praef(el) {
      update((p) => { p.praef = p.praef || {}; p.praef[el.dataset.id] = Number(el.dataset.v); });
      render();
      setTimeout(weiter, 380);
    },
    weg(el) {
      update((p) => { p.weg = p.weg || {}; p.weg[el.dataset.id] = Number(el.dataset.v); });
      document.querySelectorAll(".lk").forEach((b) => b.classList.toggle("on", b === el));
      refreshWeiter();
      setTimeout(weiter, 380);
    },
    karte(el) { karteAntwort(el.dataset.v); },
    kartezurueck() {
      const p = profile();
      const last = kartenStapel.pop() || Object.keys(p.karten || {}).pop();
      if (last) update((p) => { delete p.karten[last]; });
      render();
    },
    kartenreset() { update((p) => { p.karten = {}; }); kartenStapel = []; render(); },
    beruf(el) { zeigeBeruf(el.dataset.id); },
    fav(el) {
      const id = el.dataset.id;
      let an;
      update((p) => {
        p.favoriten = p.favoriten || [];
        an = !p.favoriten.includes(id);
        p.favoriten = an ? [...p.favoriten, id] : p.favoriten.filter((x) => x !== id);
      });
      el.textContent = an ? "❤️" : "🤍";
      toast(an ? "Zu deinen Favoriten hinzugefügt ❤️" : "Aus Favoriten entfernt");
      const liste = document.getElementById("berufListe");
      if (liste) liste.innerHTML = berufListe(profile());
    },
    schliessen() { closeOverlay(); },
    filter(el) {
      const k = el.dataset.k, v = el.dataset.v;
      if (k === "fav") filter.fav = !filter.fav;
      else if (k === "feld") filter.feld = v || null;
      else if (k === "abschluss") filter.abschluss = filter.abschluss === v ? null : v;
      else if (k === "sort") filter.sort = v;
      history.replaceState(null, "", "#/berufe");
      render();
    },
    profilmenu() { profilMenu(); },
    wechseln() { state.activeId = null; save(); go("#/start"); },
    loeschen() {
      const p = profile();
      if (!confirm(`Profil «${p.name}» mit allen Antworten wirklich löschen?`)) return;
      state.profiles = state.profiles.filter((x) => x.id !== p.id);
      state.activeId = null;
      save();
      go("#/start");
    },
    neustart() {
      if (!confirm("Alle Antworten löschen und nochmals neu starten? Name, Kanton und Favoriten bleiben erhalten.")) return;
      update((p) => {
        Object.assign(p, { karten: {}, staerken: {}, schwaechen: [], hobbys: [], hobbyText: "", praef: {}, weg: {}, lehrer: null, eltern: null, done: { ueber: true } });
      });
      kartenStapel = [];
      go("#/schritt/schule/0");
    },
    drucken() { window.print(); },
    export() {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `nextmove-profile-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },
    import() { document.getElementById("importFile").click(); }
  };

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el || el.disabled) return;
    const fn = ACTIONS[el.dataset.action];
    if (fn) { e.preventDefault(); fn(el); }
  });
  document.addEventListener("input", (e) => {
    const el = e.target;
    if (el.id === "nameInput") { update((p) => { p.name = el.value; }); refreshWeiter(); }
    else if (el.dataset.input === "note") {
      const v = Number(el.value);
      update((p) => { p.noten[el.dataset.id] = v; });
      document.getElementById("gv-" + el.dataset.id).textContent = v.toFixed(1);
      const s = E.notenschnitt(profile());
      document.getElementById("avgVal").textContent = s === null ? "–" : s.toFixed(2);
    } else if (el.dataset.input === "text") { update((p) => { p[el.dataset.k] = el.value; }); refreshWeiter(); }
    else if (el.id === "suche") {
      filter.q = el.value;
      document.getElementById("berufListe").innerHTML = berufListe(profile());
    }
  });
  document.addEventListener("change", (e) => {
    if (e.target.id !== "importFile" || !e.target.files[0]) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        const neu = (data.profiles || []).filter((x) => x.id && !state.profiles.some((p) => p.id === x.id));
        state.profiles.push(...neu);
        save();
        toast(`${neu.length} Profil(e) importiert`);
      } catch (err) {
        toast("Diese Datei konnte nicht gelesen werden.");
      }
    };
    r.readAsText(e.target.files[0]);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOverlay();
    if (e.key === "Enter" && e.target.id === "nameInput") { const b = document.getElementById("weiterBtn"); if (b && !b.disabled) weiter(); }
    if (location.hash.startsWith("#/schritt/interessen") && !document.getElementById("overlay")) {
      if (e.key === "ArrowRight") karteAntwort("ja");
      if (e.key === "ArrowLeft") karteAntwort("nein");
      if (e.key === "ArrowUp") karteAntwort("vielleicht");
    }
  });
  window.addEventListener("hashchange", render);
  render();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
