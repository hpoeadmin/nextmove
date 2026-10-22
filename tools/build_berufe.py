#!/usr/bin/env python3
"""Erzeugt js/data/berufe.js aus dem SBFI-Berufsverzeichnis (sbfi_grundbildungen.json)
und der redaktionellen Anreicherung unten (Berufsfeld, Interessen, Niveau, Beschreibung).

Aufruf:  python3 tools/build_berufe.py

Tag-Syntax in der Anreicherung:
  Interessen (0-3):  hand tech fahrzeug natur tiere essen menschen gesund kreativ digital buero verkauf labor sport
  Merkmale:          d=draussen(0-2) k=körperlich(0-2) s=schmutzig(0/1) c=Kundenkontakt(0-2)
                     g=Genauigkeit(0-2) z=unregelmässige Zeiten(0-2) h=Höhe(0/1)
  bm:X  Berufsmaturität-Richtung (T, N, W, G, GS)    img:name  Bild überschreiben
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

DIMS = "hand tech fahrzeug natur tiere essen menschen gesund kreativ digital buero verkauf labor sport".split()
TRAITS = "d k s c g z h".split()

# Berufsfeld: label, emoji, bild, Standard-Tags, BM-Richtung
FELDER = {
    "natur":      ("Natur & Landwirtschaft", "🌾", "natur-feld", "natur3 hand1 d2 k2 s1", "N"),
    "garten":     ("Garten & Floristik", "🌷", "garten-blumen", "natur3 kreativ1 hand1 d1 k1 s1", "N"),
    "tiere":      ("Tiere", "🐾", "tiere-hund", "tiere3 natur1 d1 k1 s1", "N"),
    "nahrung":    ("Lebensmittel", "🥐", "nahrung-brot", "essen3 hand1 k1 g1 z1", "N"),
    "gastro":     ("Gastronomie & Hotellerie", "🍽️", "gastro-koch", "essen2 menschen1 verkauf1 k1 c2 z2", "W"),
    "schoen":     ("Schönheit & Sport", "💇", "schoenheit-haare", "kreativ2 menschen2 gesund1 c2 g1", "GS"),
    "textil":     ("Textil & Mode", "🧵", "textil-mode", "kreativ2 hand2 g2", "G"),
    "gestaltung": ("Kunsthandwerk & Gestaltung", "🎨", "gestaltung-farbe", "kreativ3 hand2 g2", "G"),
    "medien":     ("Medien, Druck & Foto", "📸", "gestaltung-design", "kreativ2 digital2 g1", "G"),
    "bau":        ("Bau & Gebäudehülle", "🏗️", "bau-baustelle", "hand3 tech1 sport1 d2 k2 s1", "T"),
    "gebaeude":   ("Gebäudetechnik & Energie", "🔧", "gebaeudetechnik-rohre", "tech2 hand2 natur1 d1 k1 s1", "T"),
    "holz":       ("Holz & Innenausbau", "🪵", "holz-handwerk", "hand3 kreativ1 tech1 k1 g1", "T"),
    "fahrzeug":   ("Fahrzeuge", "🚗", "fahrzeug-motor", "fahrzeug3 tech2 hand1 k1 s1", "T"),
    "elektro":    ("Elektro & Automation", "⚡", "elektronik-platine", "tech3 digital1 hand1 g2", "T"),
    "metall":     ("Metall & Maschinen", "⚙️", "metall-schweissen", "tech2 hand2 k1 s1 g2", "T"),
    "feinwerk":   ("Uhren, Schmuck & Mikrotechnik", "⌚", "feinwerk-werkstatt", "hand2 tech2 kreativ1 g2", "T"),
    "labor":      ("Chemie & Labor", "🧪", "labor-glas", "labor3 tech1 g2", "T"),
    "material":   ("Produktion & Materialien", "🏭", "metall-funken", "tech2 hand1 k1 g1 z1", "T"),
    "planung":    ("Planung & Konstruktion", "📐", "planung-zeichnen", "tech2 digital2 kreativ1 g2", "T"),
    "verkauf":    ("Verkauf & Beratung", "🛍️", "verkauf-laden", "verkauf3 menschen1 c2 z1", "W"),
    "buero":      ("Wirtschaft & Verwaltung", "📊", "buero-team", "buero3 digital1 verkauf1 c1", "W"),
    "logistik":   ("Verkehr & Logistik", "🚆", "logistik-lager", "fahrzeug2 tech1 buero1 k1 z1", "W"),
    "informatik": ("Informatik", "💻", "informatik-coding", "digital3 tech1 g1", "T"),
    "gesundheit": ("Gesundheit", "🩺", "gesundheit-fachfrau", "gesund3 menschen2 c2 g1 z1", "GS"),
    "soziales":   ("Betreuung & Soziales", "🤝", "soziales-kinder", "menschen3 gesund1 c2 z1", "GS"),
    "kultur":     ("Kultur & Bühne", "🎭", "kultur-buehne", "kreativ3 sport1 z2", "G"),
    "unterhalt":  ("Unterhalt & Umwelt", "♻️", "reinigung-recycling", "hand1 tech1 natur1 k1 s1", "T"),
}

# nr | feld | niveau (1=EBA/einfach, 2=mittel, 3=anspruchsvoll) | tags | Beschreibung
ANREICHERUNG = r"""
52004|bau|2|h1|Du machst Flachdächer, Terrassen und Fundamente wasserdicht – mit Bahnen, Flüssigkunststoff und viel Know-how.
52010|bau|1|h1|Du hilfst mit, Flachdächer, Terrassen und Bauteile gegen Wasser abzudichten.
15019|natur|1|tiere1 fahrzeug1|Du packst auf dem Bauernhof oder in Spezialkulturen mit an – bei Tieren, Pflanzen und Maschinen.
44704|material|2|tech3|Du steuerst und überwachst grosse Produktionsanlagen, z. B. für Lebensmittel, Pharma oder Verpackungen.
44703|metall|2||Du baust aus Blech und Rohren Tanks, Behälter und Anlagen – vom Plan bis zur Montage beim Kunden.
40105|material|2|labor2 hand2 g2|Du formst Glas über der Flamme zu Laborgeräten und präzisen Spezialteilen.
54603|gestaltung|2|tech1 digital1|Du baust massstabgetreue Modelle von Gebäuden und Landschaften – von Hand, mit Laser und 3D-Drucker.
86913|soziales|1|gesund2|Du unterstützt Menschen in Heimen und Spitälern im Alltag – beim Essen, bei der Körperpflege und in der Freizeit.
85506|gesundheit|3|verkauf2 tech1 gesund2 menschen1 g2 z0|Du misst Augen aus, berätst bei Brillen und Kontaktlinsen und passt Brillen in der Werkstatt an.
47422|elektro|3|digital2|Du baust, programmierst und wartest automatisierte Anlagen und Roboter.
46427|elektro|2|hand2|Du verdrahtest Schaltschränke und montierst Steuerungen für Maschinen und Anlagen.
46318|fahrzeug|1||Du machst Service an Autos, wechselst Reifen und Öl und hilfst bei Reparaturen.
46324|fahrzeug|2||Du machst Service, Wartung und Reparaturen an Personenwagen oder Nutzfahrzeugen.
46321|fahrzeug|3|digital1 tech3|Du findest Fehler in Elektronik, Motor und Assistenzsystemen moderner Autos – auch an E-Autos.
21107|nahrung|1|z2|Du stellst Brot, Kleingebäck und süsse Spezialitäten her.
21104|nahrung|2|kreativ2 z2|Du backst Brot, kreierst Torten, Pralinés und Patisserie – oft schon frühmorgens.
43906|fahrzeug|2|d1 k2|Du wartest und reparierst Bagger, Krane und andere grosse Baumaschinen.
51005|bau|2|tech2|Du schneidest und bohrst mit Spezialmaschinen präzise Öffnungen in Beton und Mauerwerk.
27121|textil|2||Du entwirfst, schneidest zu und nähst Kleider, Mode oder Theaterkostüme.
27122|textil|1||Du nähst und änderst Kleidungsstücke nach Vorgaben.
39905|bau|2|d1|Du stellst im Werk Betonelemente wie Treppen, Platten oder Fassadenteile her.
35317|medien|2|tech2 hand1 digital0|Du verarbeitest gedruckte Bogen an modernen Maschinen zu Büchern, Broschüren und Katalogen.
54215|gestaltung|2|tech1|Du baust, reparierst und stimmst Blasinstrumente wie Trompeten, Flöten und Saxofone.
51706|holz|2|k2|Du verlegst Parkett, Teppiche und andere Bodenbeläge in Wohnungen und Gebäuden.
30405|holz|2|tech1|Du baust und reparierst Boote aus Holz und Kunststoff.
30404|fahrzeug|2|d1 natur1|Du wartest Boote und Bootsmotoren und machst sie bereit für die Saison.
21419|nahrung|2|tech2 labor1|Du stellst Bier, Säfte und andere Getränke her und überwachst die Produktion.
70513|verkauf|2|kreativ1 buero1|Du berätst Leserinnen und Leser, bestellst Bücher und gestaltest den Laden.
43102|metall|2||Du baust, reparierst und pflegst Sport- und Jagdwaffen.
90904|kultur|3|sport3 kreativ3 k2|Du trainierst klassischen oder zeitgenössischen Tanz oder Musical – für eine Karriere auf der Bühne. (Eignungsabklärung nötig)
45307|fahrzeug|2|kreativ1 g2|Du lackierst Fahrzeuge, mischst Farbtöne und sorgst für perfekte Oberflächen.
45308|fahrzeug|2|hand2|Du reparierst Karosserieschäden und ersetzt beschädigte Teile an Fahrzeugen.
45306|fahrzeug|2|hand2|Du richtest Blechschäden aus und bringst Karosserien wieder in Form.
37006|labor|1|tech2 z1|Du hilfst in der Produktion bei der Herstellung von Chemikalien und Medikamenten.
37007|labor|2|tech2 z1|Du steuerst Anlagen, in denen Medikamente, Farben oder Chemikalien entstehen.
82015|schoen|1||Du wäschst, schneidest und pflegst Haare und unterstützt das Team im Salon.
82016|schoen|2||Du schneidest, färbst und stylst Haare und berätst deine Kundschaft.
52005|bau|2|h1|Du deckst Steildächer mit Ziegeln, Schiefer oder Solarmodulen – mit Aussicht.
52011|bau|1|h1|Du hilfst beim Decken und Reparieren von Steildächern.
86916|gesundheit|2|buero1 z0|Du assistierst in der Zahnarztpraxis, betreust Patientinnen und Patienten und organisierst den Praxisalltag.
71800|verkauf|1||Du bedienst Kundinnen und Kunden, füllst Regale auf und arbeitest an der Kasse.
71900|verkauf|2||Du berätst Kundschaft, präsentierst Produkte und kennst dein Sortiment – vom Sportgeschäft bis zur Elektronik.
70604|gesundheit|3|verkauf2 labor1 natur1|Du berätst zu Gesundheit, Schönheit und Naturheilmitteln und stellst eigene Produkte her.
35318|medien|2|tech2 digital0|Du veredelst und verarbeitest Drucksachen – schneiden, falzen, binden.
50009|feinwerk|2|kreativ2|Du setzt Edelsteine millimetergenau in Schmuck und Uhren.
47423|elektro|2|hand2 d1 k1|Du installierst Strom, Licht, Netzwerk und Smart-Home-Technik in Gebäuden.
46506|elektro|3|digital2 labor1|Du entwickelst, baust und testest elektronische Schaltungen und Geräte.
64506|planung|3|tech3|Du planst am Computer die elektrischen Installationen für Gebäude.
52505|unterhalt|1|d2 k2|Du reinigst und kontrollierst Abwasserleitungen.
52504|unterhalt|2|tech2 d2|Du prüfst, reinigst und sanierst Kanalisationen – mit Kamera und Robotertechnik.
69201|informatik|3|buero2 bm:W|Du verbindest Wirtschaft und IT: Du analysierst Daten und digitalisierst Abläufe in Firmen.
70611|gesundheit|2|verkauf2 z0|Du berätst Kundinnen und Kunden in der Apotheke und gibst Medikamente ab.
95515|logistik|2|tech1 fahrzeug3 d2 z2|Du stellst Züge zusammen, fährst Rangierloks und sorgst für einen sicheren Bahnbetrieb.
94308|soziales|2||Du begleitest Kinder, Menschen im Alter oder mit Beeinträchtigung im Alltag.
80202|unterhalt|2|hand2 tech2|Du sorgst dafür, dass Schulhäuser, Gebäude und Anlagen funktionieren – als Profi für Haustechnik und Umgebung.
85701|schoen|2|sport3 gesund2 kreativ0|Du leitest Trainings im Fitnesscenter, planst Programme und motivierst Kundinnen und Kunden.
86918|gesundheit|2||Du pflegst Patientinnen und Patienten in Spital, Heim oder Spitex und übernimmst medizinische Aufgaben.
78404|gastro|2|menschen1 essen1|Du sorgst in Hotels, Spitälern oder Heimen für Sauberkeit, frische Wäsche und das Wohl der Gäste.
70508|buero|2|digital2 verkauf0|Du ordnest, digitalisierst und vermittelst Informationen in Bibliotheken, Archiven und Mediatheken.
76502|verkauf|2|buero1 digital1|Du berätst Kundinnen und Kunden am Telefon, im Chat und per Mail und löst ihre Anliegen.
51418|bau|2||Du baust Unterlagsböden und belastbare Industrieböden.
51424|bau|1||Du hilfst beim Einbau von Unterlags- und Industrieböden.
88611|informatik|3||Du entwickelst Apps und Software oder betreust Server, Netzwerke und Cloud-Systeme.
47118|medien|3|digital3 kreativ3|Du gestaltest Websites, Apps, Animationen und digitale Erlebnisse.
52204|gebaeude|2||Du isolierst Leitungen und Anlagen gegen Wärme, Kälte und Lärm.
47808|gebaeude|1||Du hilfst beim Montieren von Kälte- und Klimaanlagen.
47806|gebaeude|2||Du installierst und wartest Kälte- und Klimaanlagen sowie Wärmepumpen.
47807|planung|3||Du planst und berechnest Kälte-, Klima- und Wärmepumpenanlagen.
80004|unterhalt|2|d1 h1|Du reinigst und kontrollierst Heizungen und Kamine und misst Abgase – für Sicherheit und Umwelt.
75105|logistik|2|fahrzeug3 natur1 d2 z2|Du steuerst Passagierschiffe auf Schweizer Seen und Flüssen.
68104|buero|1||Du erledigst administrative Aufgaben im Büro: Post, Ablage, Telefon und einfache Buchungen.
68800|buero|2||Du organisierst, kommunizierst und arbeitest im Team – in fast jeder Branche: Bank, Versicherung, Verwaltung, Reisen …
39506|gestaltung|2||Du formst Geschirr und Objekte aus Ton an der Töpferscheibe und glasierst sie.
54216|gestaltung|2|tech1|Du baust, reparierst und stimmst Klaviere und Flügel.
79009|gastro|2|essen3 kreativ1|Du kochst kreative Menüs in Restaurant, Hotel, Spital oder Kantine.
64209|planung|3|tech3|Du entwickelst und konstruierst Maschinenteile und Geräte im 3D-CAD.
54402|gestaltung|2|natur1|Du flechtest Körbe, Möbel und Objekte aus Weiden und anderen Naturmaterialien.
82113|schoen|2|gesund2|Du pflegst die Haut, machst Make-up und Behandlungen und berätst zu Pflegeprodukten.
79025|gastro|1|essen3|Du bereitest in der Küche Zutaten und einfache Gerichte vor.
31703|holz|2||Du baust Holzfässer für Wein und Spirituosen.
38329|material|1||Du bedienst Maschinen, die Kunststoffteile herstellen.
38328|material|2||Du stellst an modernen Maschinen Kunststoffteile her – vom Zahnbürstengriff bis zum Autoteil.
65400|labor|3||Du machst Experimente und Analysen in Biologie oder Chemie – Forschung zum Anfassen.
45305|fahrzeug|1|kreativ0|Du bereitest Fahrzeuge zum Lackieren vor und hilfst beim Lackieren.
43905|fahrzeug|2|natur1 d1|Du reparierst Traktoren und Landmaschinen.
15012|natur|2|tiere2 fahrzeug1|Du pflegst Tiere, Felder und Maschinen und produzierst Lebensmittel.
21417|nahrung|1||Du hilfst bei der Herstellung von Lebensmitteln in einem Produktionsbetrieb.
21418|nahrung|2|tech2 labor1|Du stellst Lebensmittel industriell her und kontrollierst die Qualität.
95516|logistik|1||Du nimmst Waren an, lagerst sie ein und bereitest Lieferungen vor.
95512|logistik|2||Du sorgst dafür, dass Pakete und Güter rechtzeitig ankommen – im Lager oder in der Verteilung.
47907|gebaeude|2||Du baust Lüftungsanlagen in der Werkstatt und montierst sie auf der Baustelle.
47607|gebaeude|1||Du hilfst beim Montieren von Lüftungsanlagen.
53002|bau|2|kreativ2 d1|Du gestaltest Räume und Fassaden mit Farbe und Technik.
53003|bau|1|kreativ1 d1|Du hilfst beim Streichen und Gestalten von Räumen und Fassaden.
51009|bau|1||Du hilfst beim Mauern, Betonieren und Bauen.
51008|bau|2||Du baust Mauern, Fundamente und ganze Häuser.
45907|metall|1||Du stellst einfache Metallteile her und hilfst bei der Montage von Maschinen.
88606|medien|3|digital3 buero1 bm:W|Du verbindest Informatik, Multimedia, Marketing und Administration.
34200|medien|2|tech2 digital1|Du bedienst Druckmaschinen und sorgst für perfekte Druckprodukte.
86915|gesundheit|3|buero1 labor1 z0|Du nimmst Blut, machst Röntgenbilder und Laboranalysen und organisierst die Arztpraxis.
87101|gesundheit|2|tech2 menschen0 c0|Du reinigst, prüfst und sterilisierst Operationsinstrumente im Spital.
43816|metall|2|kreativ1|Du schmiedest und schleifst Messer und Werkzeuge.
44508|metall|2|d1|Du baust Treppen, Geländer, Fassaden und Stahlkonstruktionen.
64404|planung|3||Du planst und zeichnest Metall- und Stahlkonstruktionen wie Fassaden und Treppen.
44509|metall|1||Du hilfst beim Bauen von Metallkonstruktionen wie Geländern und Toren.
48308|feinwerk|2||Du stellst an CNC-Maschinen winzige Präzisionsteile her, z. B. für Uhren oder Medizintechnik.
48309|planung|3|hand1|Du zeichnest und konstruierst kleinste Bauteile für Uhren und Mikrotechnik.
21607|nahrung|1||Du hilfst bei der Herstellung von Käse, Joghurt und anderen Milchprodukten.
21606|nahrung|2|tech1|Du stellst Käse, Joghurt und Milchprodukte her.
47424|elektro|2|hand2 d1 k1|Du montierst elektrische Installationen auf Baustellen.
52014|bau|1|tech1 h1|Du montierst Storen, Rollläden und Markisen.
43907|fahrzeug|2|natur1|Du reparierst Rasenmäher, Motorsägen und andere Motorgeräte.
46205|fahrzeug|2||Du wartest und reparierst Motorräder und Roller.
21005|nahrung|2|tech2|Du verarbeitest Getreide zu Mehl und Tiernahrung und steuerst die Mühlenanlagen.
47007|elektro|2|digital2 verkauf1 c1|Du installierst und reparierst Unterhaltungselektronik, Netzwerke und Multimedia-Systeme.
75104|logistik|2|fahrzeug2 menschen1 d2 z2 c2|Du arbeitest an Bord von Passagierschiffen – vom Anlegen bis zum Gästeservice.
47421|elektro|2|d2 k2 h1|Du baust und unterhältst Strom- und Bahnnetze – oft draussen und in luftiger Höhe.
42003|material|2|labor1|Du beschichtest Metallteile, damit sie schützen, glänzen und länger halten.
42004|material|1||Du hilfst beim Beschichten und Veredeln von Oberflächen.
49707|feinwerk|2||Du veredelst Oberflächen von Uhren und Schmuck – polieren, satinieren, glänzen.
16004|natur|2||Du pflegst Obstbäume und Beerenkulturen und erntest und lagerst Früchte.
51205|bau|2|kreativ1|Du baust Kachelöfen, Cheminées und Speicheröfen.
54217|gestaltung|2|tech1|Du baust und restaurierst Orgeln – ein Handwerk aus Holz, Metall und Klang.
36105|gesundheit|2|hand3 menschen1 c1 g2|Du fertigst und änderst Schuhe und Einlagen für Menschen mit Fussproblemen.
54006|gesundheit|2|hand2 tech2|Du fertigst Prothesen, Orthesen und Hilfsmittel, die Menschen mobil machen.
33004|material|2|z2|Du steuerst die Anlagen, auf denen Papier und Karton entstehen.
18122|tiere|2|sport2 d2 k2|Du pflegst, fütterst und bewegst Pferde und kümmerst dich um den Stall.
18123|tiere|1|sport1 d2 k2|Du pflegst und fütterst Pferde und hältst den Stall sauber.
51419|bau|2|kreativ1|Du verlegst Pflästerungen und Natursteinbeläge auf Plätzen und Wegen.
65328|labor|3|tech2|Du misst, testest und experimentierst mit Physik – Optik, Elektronik, Materialien.
51105|bau|2|kreativ1 d0|Du verlegst Platten und Mosaike in Bädern, Küchen und auf Terrassen.
51106|bau|1|d0|Du hilfst beim Verlegen von Platten in Bädern und Küchen.
82118|gesundheit|2|menschen1|Du pflegst und behandelst Füsse, z. B. bei Hühneraugen oder eingewachsenen Nägeln.
50305|feinwerk|1||Du polierst Uhrengehäuse und Schmuckstücke auf Hochglanz.
90507|gestaltung|2|verkauf1 hand1|Du gestaltest Schaufenster, Messestände und Ausstellungen.
34711|medien|3|kreativ3|Du gestaltest Layouts für gedruckte und digitale Medien.
45708|metall|3|digital1|Du stellst an CNC-Maschinen Präzisionsteile her und baust Maschinen und Anlagen.
78405|gastro|1|essen1|Du hilfst in Hotels und Heimen bei Reinigung, Wäsche und Service.
80105|unterhalt|1||Du reinigst Gebäude, Büros und Anlagen mit Maschinen und Spezialmitteln.
35319|medien|1|tech1|Du hilfst bei der Herstellung von Druckprodukten.
45717|metall|2||Du stellst Bauteile her und montierst Maschinen und Geräte.
48310|feinwerk|2|labor1|Du prüfst und misst kleinste Bauteile, damit die Qualität stimmt.
28420|textil|2|hand2|Du polsterst Möbel, nähst Vorhänge und verlegst Bodenbeläge.
95006|unterhalt|2|natur2|Du sortierst und verwertest Wertstoffe und Abfälle – für eine saubere Umwelt.
46320|fahrzeug|1||Du montierst und wechselst Reifen und machst kleine Services.
79024|gastro|1|menschen1|Du servierst Speisen und Getränke und hilfst im Restaurant mit.
78705|gastro|2|menschen2 verkauf2|Du betreust Gäste, servierst und berätst zu Speisen und Getränken.
47706|gebaeude|2||Du installierst Wasserleitungen, Bäder und Küchen.
47608|gebaeude|1||Du hilfst beim Installieren von Wasserleitungen und Sanitäranlagen.
30513|holz|2||Du baust Möbel, Küchen, Fenster oder Ski aus Holz – von Hand und mit CNC-Maschinen.
30506|holz|1||Du hilfst beim Herstellen von Möbeln und Bauteilen aus Holz.
36104|textil|2|hand3|Du fertigst und reparierst Schuhe von Hand.
56505|logistik|1|tech2 natur1 d2 h1|Du bedienst und kontrollierst Seilbahnen und Skilifte.
56504|elektro|2|d2 sport1 natur1 h1|Du wartest Seilbahnen und Skilifte – Technik mit Bergpanorama.
50008|feinwerk|2|kreativ2|Du formst Besteck, Schalen und Objekte aus Silber und anderen Metallen.
52009|bau|2|tech2 natur1 h1|Du montierst Solaranlagen auf Dächern und Fassaden.
52015|bau|1|tech1 natur1 h1|Du hilfst beim Montieren von Solaranlagen.
45405|gebaeude|2|d2 h1|Du baust Dachrinnen, Blechdächer und Fassadenteile aus Metall.
47609|gebaeude|1|d2 h1|Du hilfst bei Spenglerarbeiten an Dächern und Fassaden.
39207|gestaltung|2|hand3 k2 d1|Du bearbeitest Naturstein für Bauten, Skulpturen und Grabmale.
51425|bau|1||Du verlegst Pflaster- und Randsteine.
51420|bau|2||Du baust Strassen, Plätze und Velowege.
51426|bau|1||Du hilfst beim Bau von Strassen und Plätzen.
73304|logistik|2|fahrzeug3 d1|Du fährst Lastwagen und transportierst Güter – den Führerausweis machst du in der Lehre.
73305|logistik|1|fahrzeug2|Du belädst Lastwagen, sicherst Ladungen und begleitest Transporte.
79010|gastro|2|buero1|Du sorgst in Restaurantketten für reibungslose Abläufe, Qualität und zufriedene Gäste.
79012|gastro|1||Du bereitest Speisen zu und bedienst Gäste in der Systemgastronomie.
26309|textil|1|tech1|Du bedienst Textilmaschinen und hilfst bei der Herstellung von Stoffen.
26311|textil|2|tech2|Du stellst Garne, Stoffe und technische Textilien an modernen Anlagen her.
53107|kultur|2|kreativ3 hand2|Du malst Kulissen und Bühnenbilder für Theater und Oper.
86917|tiere|2|gesund2 buero1 z0|Du assistierst in der Tierarztpraxis – bei Behandlungen, im Labor und am Empfang.
18110|tiere|2||Du pflegst Tiere im Zoo, Tierheim oder in der Forschung.
49208|feinwerk|1||Du montierst Uhrenteile und hilfst in der Uhrenproduktion.
49005|feinwerk|2||Du baust, reparierst und revidierst mechanische Uhren.
49207|feinwerk|2||Du montierst Uhrwerke und prüfst sie in der Produktion.
80203|unterhalt|1||Du hilfst beim Unterhalt von Gebäuden und Aussenanlagen.
66500|kultur|2|tech2 hand1|Du sorgst für Licht, Ton und Bühnentechnik an Konzerten, Messen und Events.
31604|gestaltung|2||Du vergoldest Rahmen und Objekte und rahmst Bilder ein.
33315|medien|2|tech2|Du bedruckst Verpackungen an grossen Druckmaschinen.
33316|material|2||Du stellst Verpackungen aus Karton, Kunststoff oder Folie her.
22604|natur|2|essen2|Du pflegst Reben, erntest Trauben und machst daraus Wein.
28502|textil|2||Du gestaltest Vorhänge, Kissen und Wohntextilien und berätst bei der Einrichtung.
54104|gesundheit|2|hand3 kreativ1 menschen0 c0 g2 z0|Du fertigst Zahnkronen, Brücken und Prothesen – Präzisionsarbeit mit Hand und Computer.
64013|planung|3|kreativ1|Du zeichnest Pläne für Gebäude, Brücken, Innenräume oder Landschaften.
30303|holz|2|d2 k2 h1|Du baust Dachstühle und ganze Holzhäuser.
54218|gestaltung|2||Du fertigst Orgelpfeifen aus Zinn.
46108|fahrzeug|1|sport1|Du hilfst beim Reparieren und Warten von Velos und Mofas.
36504|textil|2||Du fertigst Sättel, Taschen, Lederwaren oder Fahrzeugpolster.
74115|logistik|2|verkauf2 menschen1 buero1 z2|Du sorgst im öffentlichen Verkehr für Verkauf, Kundendienst und reibungslose Abläufe.
80104|unterhalt|2||Du reinigst und pflegst Gebäude und Anlagen professionell und planst Einsätze.
52008|bau|2|tech2 h1|Du montierst und reparierst Storen, Rollläden und Sonnenschutz-Anlagen.
80607|unterhalt|2|natur0|Du reinigst und pflegst Textilien und Kleidung in der Textilreinigung.
46107|fahrzeug|2|sport1|Du baust, reparierst und berätst rund um Velos und E-Bikes.
44903|fahrzeug|2|hand2|Du baust und reparierst Fahrzeugaufbauten und Anhänger aus Metall.
52006|bau|2|h1|Du baust moderne Fassaden aus Metall, Glas oder Holz.
52012|bau|1|h1|Du hilfst beim Montieren von Fassaden.
40312|feinwerk|2|labor1|Du stellst Linsen und optische Präzisionsteile her.
21812|nahrung|1||Du hilfst bei der Verarbeitung von Fleisch und beim Verkauf.
21808|nahrung|2|verkauf1|Du verarbeitest Fleisch zu Spezialitäten und berätst Kundinnen und Kunden.
17207|garten|1|kreativ2 verkauf1 d0|Du bindest Sträusse und hilfst im Blumengeschäft.
17206|garten|2|kreativ3 verkauf1 d0|Du gestaltest Sträusse, Kränze und Dekorationen und berätst die Kundschaft.
30905|material|2|tech2|Du baust Formen und Modelle für die Herstellung von Bauteilen.
30906|material|1||Du hilfst beim Bau von Formen und Modellen.
19103|natur|1|sport2 d2 k2|Du hilfst im Wald bei der Holzernte und Waldpflege.
19104|natur|2|sport2 d2 k2|Du pflegst den Wald, fällst Bäume und schützt vor Naturgefahren.
90602|medien|2|kreativ3|Du fotografierst Menschen, Produkte und Ereignisse und bearbeitest die Bilder.
35214|medien|2|verkauf2|Du berätst im Fotofachgeschäft, fotografierst und produzierst Fotoprodukte.
17022|garten|1||Du hilfst bei Pflanzenproduktion oder Gartenbau.
17019|garten|2||Du gestaltest Gärten und Grünanlagen oder ziehst Pflanzen in der Gärtnerei.
88607|informatik|3|tech2|Du vernetzt Gebäude: Smart Home, Gebäudeautomation und Kommunikationstechnik.
64619|planung|3|natur1|Du planst Heizungsanlagen und Wärmepumpen für Gebäude.
64620|planung|3|natur1|Du planst Lüftungs- und Klimaanlagen für Gebäude.
64621|planung|3|natur1|Du planst Wasser- und Sanitäranlagen für Gebäude.
54213|gestaltung|2|hand3|Du baust und reparierst Geigen, Bratschen und Celli.
17025|natur|2|essen1|Du baust Gemüse an – im Feld und im Gewächshaus.
64105|planung|3|digital2 natur1 d1|Du vermisst Gelände und Gebäude und erstellst Karten und Geodaten.
52007|bau|2|sport2 h1|Du stellst Gerüste für Baustellen auf – Teamarbeit in der Höhe.
52013|bau|1|sport1 h1|Du hilfst beim Auf- und Abbau von Gerüsten.
53109|medien|2|kreativ2 hand2|Du gestaltest und montierst Beschriftungen, Schilder und Fahrzeugfolien.
25805|textil|2|tech1|Du entwirfst und webst Stoffe auf Handwebstuhl und Maschine.
52002|bau|2|kreativ1 d0|Du verputzt Wände und baust Trennwände und Decken im Innenausbau.
52003|bau|1|d0|Du hilfst beim Verputzen und im Trockenbau.
40404|bau|2|hand2|Du baust Fenster, Glasfassaden, Duschen und Glasdächer ein.
40405|bau|1||Du hilfst beim Zuschneiden und Montieren von Glas.
39605|gestaltung|2||Du gestaltest und restaurierst Glasfenster und Glasbilder.
51416|bau|2|z1|Du baust und unterhältst Bahngleise.
51422|bau|1|z1|Du hilfst beim Bau und Unterhalt von Bahngleisen.
50007|feinwerk|2|kreativ3|Du entwirfst und fertigst Schmuck aus Gold, Silber und Edelsteinen.
90306|medien|3|kreativ3|Du gestaltest Logos, Plakate, Bücher und Webauftritte.
44305|feinwerk|2|kreativ2|Du gravierst Schriften und Muster in Metall, Glas oder Schmuck.
51417|bau|2|tech1|Du sicherst Baugruben und erstellst Fundamente mit grossen Spezialmaschinen.
51423|bau|1||Du hilfst bei Spezialtiefbau-Arbeiten.
41208|metall|2||Du stellst Gussformen her und giesst flüssiges Metall zu Bauteilen.
41211|metall|2|tech2|Du stellst Modelle und Formen her und überwachst den Metallguss.
47605|gebaeude|2||Du installierst Heizungen, Wärmepumpen und Solarthermie in Gebäuden.
47606|gebaeude|1||Du hilfst beim Installieren von Heizungsanlagen.
30206|holz|1||Du bearbeitest Holz mit Maschinen und hilfst in der Produktion.
90003|gestaltung|2|hand3|Du schnitzt Figuren, Reliefs und Objekte aus Holz.
30203|holz|2|kreativ2|Du drechselst und fertigst Holzgegenstände wie Schalen, Spielzeug oder Fässer.
30004|holz|2|tech2|Du verarbeitest Rundholz zu Brettern und Holzwerkstoffen in der Sägerei.
85505|gesundheit|3|tech2 verkauf1 z0|Du testest das Gehör, passt Hörgeräte an und berätst Menschen mit Hörproblemen.
79200|gastro|2|buero2 verkauf2 menschen2 essen0|Du empfängst Gäste an der Hotelrezeption, organisierst Reservationen und gibst Tipps.
43703|tiere|2|hand2 tech1 k2|Du beschlägst Pferdehufe und schmiedest Hufeisen.
88616|informatik|2|menschen1|Du richtest Computer und Geräte ein und hilfst Anwenderinnen und Anwendern im Support.
39508|material|2|kreativ1|Du stellst Keramikteile industriell her, z. B. Lavabos und technische Keramik.
53304|material|2||Du lackierst Bauteile und Produkte in der Industrie.
28404|textil|2|hand2|Du polsterst Sitze und Möbel in der Industrie.
"""

NAMEN = {
    "86915": "Medizinische/r Praxisassistent/in",
    "86917": "Tiermedizinische/r Praxisassistent/in",
    "75104": "Nautische/r Fachfrau/-mann",
    "79025": "Küchenangestellte/r",
    "79024": "Restaurantangestellte/r",
    "30303": "Zimmermann/Zimmerin",
    "79009": "Koch/Köchin",
    "82015": "Coiffeur/Coiffeuse",
    "82016": "Coiffeur/Coiffeuse",
    "50305": "Polisseur/Polisseuse",
}


def clean(name):
    name = re.sub(r"\s*\((Berufsfeld|ab Lehrbeginn)[^)]*\)", "", name)
    return re.sub(r"\s+", " ", name).strip()


def split_abschluss(name):
    m = re.match(r"(.*?)\s+(EFZ|EBA)$", name)
    return (m.group(1), m.group(2)) if m else (name, "")


def neutral(nr, m, w):
    if nr in NAMEN:
        return NAMEN[nr]
    if m == w:
        return m
    mws, wws = m.split(" "), w.split(" ")
    if len(mws) == len(wws):
        parts = []
        for mw, ww in zip(mws, wws):
            if mw == ww:
                parts.append(mw)
            elif re.sub(r"in(?=\b|-)", "", ww) == mw:
                parts.append(mw + "/in")
            elif ww.endswith("frau") and mw.endswith("mann") and ww[:-4] == mw[:-4]:
                parts.append(ww + "/-mann")
            elif mw.endswith("e") and ww == mw[:-1] + "in":  # Technologe / Technologin
                parts.append(mw + "/-" + ww[len(mw) - 4:])
            elif mw.endswith("er") and ww == mw[:-2] + "in":  # Pflästerer / Pflästerin
                parts.append(mw + "/in")
            else:
                break
        else:
            return " ".join(parts)
    return w + " / " + m


def parse_tags(s, dims, traits, meta):
    for t in s.split():
        if t.startswith("bm:"):
            meta["bm"] = t[3:]
        elif t.startswith("img:"):
            meta["img"] = t[4:]
        else:
            k, v = re.match(r"([a-z]+)(\d)", t).groups()
            (dims if k in DIMS else traits)[k] = int(v)


def main():
    src = json.load(open(os.path.join(HERE, "sbfi_grundbildungen.json"), encoding="utf-8"))
    extra = {}
    for line in ANREICHERUNG.strip().splitlines():
        nr, feld, niv, tags, desc = line.split("|", 4)
        extra[nr] = (feld, int(niv), tags, desc.strip())

    out, missing = [], []
    for r in src:
        nr = r["nr"]
        if nr not in extra:
            missing.append(r["m"])
            continue
        feld, niv, tags, desc = extra[nr]
        label, emoji, img, deftags, bm = FELDER[feld]
        dims, traits, meta = {}, {t: 0 for t in TRAITS}, {"bm": bm, "img": img}
        parse_tags(deftags, dims, traits, meta)
        parse_tags(tags, dims, traits, meta)
        dims = {k: v for k, v in dims.items() if v > 0}
        mb, ab = split_abschluss(clean(r["m"]))
        wb, _ = split_abschluss(clean(r["w"]))
        if ab == "EBA":
            niv = 1
        out.append({
            "id": nr,
            "name": neutral(nr, mb, wb),
            "m": mb, "w": wb,
            "abschluss": ab,
            "dauer": r["dauer"],
            "feld": feld,
            "niveau": niv,
            "i": dims,
            "t": {k: v for k, v in traits.items() if v},
            "bm": None if ab == "EBA" else meta["bm"],
            "img": meta["img"],
            "fr": r["fr"],
            "text": desc,
        })
    unused = set(extra) - {r["nr"] for r in src}
    if missing or unused:
        raise SystemExit(f"Fehlende Anreicherung: {missing}\nNicht verwendet: {sorted(unused)}")

    out.sort(key=lambda b: b["name"].lower())
    felder = {k: {"label": v[0], "emoji": v[1], "img": v[2]} for k, v in FELDER.items()}
    js = ("// Automatisch erzeugt mit tools/build_berufe.py – nicht von Hand bearbeiten.\n"
          "// Quelle: SBFI Berufsverzeichnis, berufliche Grundbildungen (EFZ/EBA)\n"
          "window.NM_FELDER = " + json.dumps(felder, ensure_ascii=False) + ";\n"
          "window.NM_BERUFE = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
    with open(os.path.join(ROOT, "js", "data", "berufe.js"), "w", encoding="utf-8") as f:
        f.write(js)
    efz = sum(1 for b in out if b["abschluss"] == "EFZ")
    print(f"{len(out)} Berufe geschrieben ({efz} EFZ, {len(out) - efz} EBA)")


if __name__ == "__main__":
    main()
