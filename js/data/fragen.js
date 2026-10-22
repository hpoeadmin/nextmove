// Fragenkatalog von Next Move.
// Interessen-Dimensionen (i) werden mit den Berufsprofilen in berufe.js abgeglichen.

window.NM_DIMS = {
  hand:     { label: "Handwerk & Bauen", emoji: "🔨" },
  tech:     { label: "Technik & Elektronik", emoji: "⚙️" },
  fahrzeug: { label: "Fahrzeuge & Verkehr", emoji: "🚗" },
  natur:    { label: "Natur & Umwelt", emoji: "🌿" },
  tiere:    { label: "Tiere", emoji: "🐾" },
  essen:    { label: "Essen & Genuss", emoji: "🍳" },
  menschen: { label: "Menschen & Soziales", emoji: "🤝" },
  gesund:   { label: "Gesundheit & Körper", emoji: "🩺" },
  kreativ:  { label: "Gestalten & Kreativität", emoji: "🎨" },
  digital:  { label: "Computer & Digitales", emoji: "💻" },
  buero:    { label: "Organisation & Wirtschaft", emoji: "📊" },
  verkauf:  { label: "Verkauf & Beratung", emoji: "🛍️" },
  labor:    { label: "Forschen & Experimentieren", emoji: "🔬" },
  sport:    { label: "Sport & Bewegung", emoji: "🏃" }
};

// Swipe-Karten: «Würdest du das gern tun?»
window.NM_KARTEN = [
  { id: "k1",  text: "Einen Motor zerlegen und verstehen, wie er funktioniert", img: "fahrzeug-motor", i: { fahrzeug: 2, tech: 2 } },
  { id: "k2",  text: "Aus Holz etwas Eigenes bauen", img: "holz-handwerk", i: { hand: 3, kreativ: 1 } },
  { id: "k3",  text: "Mit Kindern spielen und ihnen etwas beibringen", img: "soziales-kinder", i: { menschen: 3 } },
  { id: "k4",  text: "Kranke oder ältere Menschen pflegen und begleiten", img: "soziales-betreuung", i: { gesund: 2, menschen: 2 } },
  { id: "k5",  text: "Eine App, eine Website oder ein Game programmieren", img: "informatik-coding", i: { digital: 3 } },
  { id: "k6",  text: "Ein Logo, Plakat oder Social-Media-Design gestalten", img: "gestaltung-design", i: { kreativ: 3, digital: 1 } },
  { id: "k7",  text: "Für Gäste ein feines Menü kochen", img: "gastro-kochen", i: { essen: 3 } },
  { id: "k8",  text: "Im Wald arbeiten und Bäume pflegen", img: "natur-wald", i: { natur: 3, sport: 1 } },
  { id: "k9",  text: "Tiere füttern, pflegen und versorgen", img: "tiere-pferd", i: { tiere: 3 } },
  { id: "k10", text: "Pflanzen ziehen und Gärten gestalten", img: "natur-setzlinge", i: { natur: 2, kreativ: 1 } },
  { id: "k11", text: "Im Labor Experimente durchführen und Proben analysieren", img: "labor-glas", i: { labor: 3 } },
  { id: "k12", text: "Elektronik löten und kaputte Geräte reparieren", img: "elektronik-platine", i: { tech: 3 } },
  { id: "k13", text: "Strom, Licht und Smart-Home in einem Haus installieren", img: "elektro-installation", i: { tech: 2, hand: 2 } },
  { id: "k14", text: "Kundinnen und Kunden beraten und das Passende verkaufen", img: "verkauf-laden", i: { verkauf: 3, menschen: 1 } },
  { id: "k15", text: "Ein Budget planen und den Überblick über Zahlen behalten", img: "buero-arbeit", i: { buero: 3 } },
  { id: "k16", text: "Im Team einen Anlass organisieren", img: "buero-team", i: { buero: 2, verkauf: 1, menschen: 1 } },
  { id: "k17", text: "Haare schneiden, schminken und Leute stylen", img: "schoenheit-haare", i: { kreativ: 2, menschen: 1, gesund: 1 } },
  { id: "k18", text: "Andere im Training anleiten und motivieren", img: "sport-fitness", i: { sport: 3, gesund: 1, menschen: 1 } },
  { id: "k19", text: "Kleider entwerfen und nähen", img: "textil-mode", i: { kreativ: 2, hand: 2 } },
  { id: "k20", text: "Fotos und Videos machen und bearbeiten", img: "fotografie", i: { kreativ: 2, digital: 2 } },
  { id: "k21", text: "Auf der Baustelle mit anpacken und sehen, was entsteht", img: "bau-baustelle", i: { hand: 3, sport: 1 } },
  { id: "k22", text: "Metall schweissen, schleifen und formen", img: "metall-schweissen", i: { tech: 2, hand: 2 } },
  { id: "k23", text: "Pläne und 3D-Modelle am Computer zeichnen", img: "planung-zeichnen", i: { tech: 2, digital: 2, kreativ: 1 } },
  { id: "k24", text: "Waren, Lager und Lieferungen organisieren", img: "logistik-lager", i: { buero: 1, fahrzeug: 1, tech: 1 } },
  { id: "k25", text: "Einen Zug, ein Schiff oder einen Lastwagen steuern", img: "verkehr-bahn", i: { fahrzeug: 3 } },
  { id: "k26", text: "Brot backen oder Torten verzieren", img: "nahrung-brot", i: { essen: 3, kreativ: 1 } },
  { id: "k27", text: "Auf der Bühne stehen oder Licht und Ton für Konzerte machen", img: "kultur-buehne", i: { kreativ: 2, tech: 1, sport: 1 } },
  { id: "k28", text: "Uhren oder Schmuck millimetergenau bearbeiten", img: "feinwerk-werkstatt", i: { hand: 2, tech: 1, kreativ: 1 } },
  { id: "k29", text: "Im Spital oder in einer Praxis mithelfen", img: "gesundheit-stethoskop", i: { gesund: 3, menschen: 1 } },
  { id: "k30", text: "Heizungen, Wasser und Solaranlagen zum Laufen bringen", img: "gebaeudetechnik-rohre", i: { tech: 2, hand: 2, natur: 1 } },
  { id: "k31", text: "Anderen bei Computer- und Handyproblemen helfen", img: "informatik-team", i: { digital: 2, menschen: 1 } },
  { id: "k32", text: "Mich für Recycling und eine saubere Umwelt einsetzen", img: "reinigung-recycling", i: { natur: 2, tech: 1 } }
];

// Stärken: Selbsteinschätzung 1–5
window.NM_STAERKEN = [
  { id: "handgeschick", label: "Geschickte Hände", emoji: "✋", hint: "Basteln, Werken, feine Arbeiten gelingen dir." },
  { id: "technik", label: "Technisches Verständnis", emoji: "⚙️", hint: "Du verstehst schnell, wie Dinge funktionieren." },
  { id: "logik", label: "Mathe & Logik", emoji: "🧮", hint: "Rechnen, Rätsel und logisches Denken liegen dir." },
  { id: "sprache", label: "Sprachen & Ausdruck", emoji: "💬", hint: "Du schreibst und redest gern – auch in Fremdsprachen." },
  { id: "kreativ", label: "Kreativität", emoji: "🎨", hint: "Du hast Ideen und gestaltest gern." },
  { id: "kontakt", label: "Auf Leute zugehen", emoji: "👋", hint: "Du redest gern mit neuen Menschen." },
  { id: "empathie", label: "Einfühlungsvermögen", emoji: "💛", hint: "Du merkst, wie es anderen geht, und hilfst gern." },
  { id: "sorgfalt", label: "Sorgfalt & Genauigkeit", emoji: "🎯", hint: "Du arbeitest exakt und gibst dir Mühe mit Details." },
  { id: "fitness", label: "Kraft & Ausdauer", emoji: "💪", hint: "Körperliche Arbeit macht dir nichts aus." },
  { id: "organisation", label: "Organisation", emoji: "🗂️", hint: "Du planst gut und behältst den Überblick." },
  { id: "digital", label: "Digitale Skills", emoji: "📱", hint: "Mit Computer, Apps und Programmen bist du fit." }
];

// Was liegt dir weniger? (Mehrfachauswahl) – wirkt als Abzug bei passenden Berufen
window.NM_SCHWAECHEN = [
  { id: "stillsitzen", label: "Lange stillsitzen", emoji: "🪑" },
  { id: "koerperlich", label: "Körperlich streng arbeiten", emoji: "🏋️" },
  { id: "schmutz", label: "Schmutzige Hände", emoji: "🧤" },
  { id: "blut", label: "Blut und Krankheiten", emoji: "🩸" },
  { id: "fremde", label: "Viel mit Fremden reden", emoji: "🗣️" },
  { id: "mathe", label: "Mathe", emoji: "➗" },
  { id: "sprachen", label: "Fremdsprachen", emoji: "🌍" },
  { id: "zeiten", label: "Abends oder am Wochenende arbeiten", emoji: "🌙" },
  { id: "wetter", label: "Bei Kälte und Regen draussen sein", emoji: "🌧️" },
  { id: "genau", label: "Millimetergenau arbeiten", emoji: "🔍" },
  { id: "hoehe", label: "Höhe (Dächer, Gerüste)", emoji: "🪜" },
  { id: "lernen", label: "Viel auswendig lernen", emoji: "📚" }
];

// Hobbys: Mehrfachauswahl, leichter Einfluss auf die Interessen
window.NM_HOBBYS = [
  { id: "gamen", label: "Gamen", emoji: "🎮", i: { digital: 1 } },
  { id: "sport", label: "Sport im Verein", emoji: "⚽", i: { sport: 2 } },
  { id: "musik", label: "Musik machen", emoji: "🎸", i: { kreativ: 1 } },
  { id: "zeichnen", label: "Zeichnen & Malen", emoji: "✏️", i: { kreativ: 2 } },
  { id: "kochen", label: "Kochen & Backen", emoji: "🧁", i: { essen: 2 } },
  { id: "tiere", label: "Tiere & Reiten", emoji: "🐴", i: { tiere: 2 } },
  { id: "werken", label: "Basteln & Werken", emoji: "🛠️", i: { hand: 2 } },
  { id: "schrauben", label: "Töff, Velo & Autos", emoji: "🏍️", i: { fahrzeug: 2, tech: 1 } },
  { id: "mode", label: "Mode & Styling", emoji: "👟", i: { kreativ: 1, verkauf: 1 } },
  { id: "fotos", label: "Fotos & Videos", emoji: "📸", i: { kreativ: 1, digital: 1 } },
  { id: "lesen", label: "Lesen & Schreiben", emoji: "📖", i: {} },
  { id: "coden", label: "Programmieren", emoji: "👩‍💻", i: { digital: 2 } },
  { id: "natur", label: "Natur & Wandern", emoji: "🥾", i: { natur: 2 } },
  { id: "kinder", label: "Babysitten & Jugendarbeit", emoji: "🧸", i: { menschen: 2 } },
  { id: "buehne", label: "Theater & Tanz", emoji: "💃", i: { kreativ: 1, sport: 1 } },
  { id: "science", label: "Experimente & Science", emoji: "🧪", i: { labor: 2 } },
  { id: "lego", label: "Lego & Modellbau", emoji: "🧱", i: { tech: 1, hand: 1 } },
  { id: "garten", label: "Garten & Pflanzen", emoji: "🌱", i: { natur: 2 } },
  { id: "helfen", label: "Samariter & Feuerwehr", emoji: "🚒", i: { gesund: 1, menschen: 1 } },
  { id: "winter", label: "Ski & Snowboard", emoji: "🏂", i: { sport: 1, natur: 1 } },
  { id: "content", label: "Social Media & Content", emoji: "🎬", i: { digital: 1, kreativ: 1, verkauf: 1 } },
  { id: "raetsel", label: "Rätsel & Schach", emoji: "♟️", i: { labor: 1 } },
  { id: "handel", label: "Sachen verkaufen & handeln", emoji: "💸", i: { verkauf: 2 } },
  { id: "elektronik", label: "Elektronik & Technik", emoji: "🔌", i: { tech: 2 } }
];

// Arbeitswelt «Dies oder das»: Wert −2 (links) … +2 (rechts)
window.NM_PRAEFERENZEN = [
  { id: "ort", links: { label: "Drinnen", emoji: "🏢" }, rechts: { label: "Draussen", emoji: "🌤️" } },
  { id: "tempo", links: { label: "Ruhig & konzentriert", emoji: "🧘" }, rechts: { label: "Action & Bewegung", emoji: "⚡" } },
  { id: "fokus", links: { label: "Mit Dingen & Technik", emoji: "🔩" }, rechts: { label: "Mit Menschen", emoji: "🧑‍🤝‍🧑" } },
  { id: "kopf", links: { label: "Mit den Händen", emoji: "🙌" }, rechts: { label: "Mit dem Kopf", emoji: "🧠" } }
];

// Weg-Fragen: Antwort 1–5; Gewichte für Gymnasium (g), Lehre (l) und BMS (b)
window.NM_WEGFRAGEN = [
  { id: "w1", text: "Ich lerne gern und will Dinge auch theoretisch verstehen.", g: 2, l: -1, b: 1 },
  { id: "w2", text: "Ich möchte später an einer Universität oder der ETH studieren.", g: 3, l: -1, b: 1 },
  { id: "w3", text: "Ich will lieber praktisch arbeiten als den ganzen Tag im Schulzimmer sitzen.", g: -2, l: 3, b: 0 },
  { id: "w4", text: "Ich möchte bald mein eigenes Geld verdienen.", g: -1, l: 2, b: 0 },
  { id: "w5", text: "Es gibt schon ein Berufsfeld, das mich richtig reizt.", g: 0, l: 2, b: 1 },
  { id: "w6", text: "Ich kann mich gut selbst zum Lernen motivieren – auch bei viel Stoff.", g: 2, l: 0, b: 2 },
  { id: "w7", text: "Fremdsprachen wie Französisch und Englisch liegen mir.", g: 2, l: 0, b: 1 },
  { id: "w8", text: "Ich will mir möglichst viele Wege offenhalten.", g: 1, l: 0, b: 2 },
  { id: "w9", text: "Ich freue mich darauf, im Betrieb mit Erwachsenen Verantwortung zu übernehmen.", g: -1, l: 2, b: 1 },
  { id: "w10", text: "Für die Schule lerne ich auch in der Freizeit regelmässig.", g: 2, l: -1, b: 1 },
  { id: "w11", text: "Mein Traumberuf braucht ein Studium (z. B. Ärztin, Anwalt, Lehrerin, Ingenieur).", g: 2, l: -1, b: 1 }
];

window.NM_LIKERT = [
  { v: 1, label: "Gar nicht", emoji: "😣" },
  { v: 2, label: "Eher nicht", emoji: "🙁" },
  { v: 3, label: "Teils, teils", emoji: "😐" },
  { v: 4, label: "Eher ja", emoji: "🙂" },
  { v: 5, label: "Voll!", emoji: "🤩" }
];
