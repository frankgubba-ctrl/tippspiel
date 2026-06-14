// netlify/functions/schedule.js
// Holt den echten WM-2026-Spielplan inkl. Ergebnisse von der öffentlichen,
// gemeinfreien (public domain) openfootball-Datenquelle auf GitHub.
// Läuft serverseitig, damit es im Browser kein CORS-Problem gibt.
//
// Wir geben nur die 72 Gruppenspiele zurück, übersetzt ins Deutsche,
// mit Datum/Uhrzeit in isländischer Zeit (UTC+0, ganzjährig).

const SRC = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

// Englisch -> Deutsch + Flagge
const TEAM = {
"Mexico":["Mexiko","🇲🇽"],"South Africa":["Südafrika","🇿🇦"],"South Korea":["Südkorea","🇰🇷"],
"Czech Republic":["Tschechien","🇨🇿"],"Canada":["Kanada","🇨🇦"],"Switzerland":["Schweiz","🇨🇭"],
"Qatar":["Katar","🇶🇦"],"Bosnia & Herzegovina":["Bosnien-Herz.","🇧🇦"],"Brazil":["Brasilien","🇧🇷"],
"Morocco":["Marokko","🇲🇦"],"Scotland":["Schottland","🏴󠁧󠁢󠁳󠁣󠁴󠁿"],"Haiti":["Haiti","🇭🇹"],
"USA":["USA","🇺🇸"],"Australia":["Australien","🇦🇺"],"Turkey":["Türkei","🇹🇷"],"Paraguay":["Paraguay","🇵🇾"],
"Germany":["Deutschland","🇩🇪"],"Ecuador":["Ecuador","🇪🇨"],"Ivory Coast":["Elfenbeinküste","🇨🇮"],
"Curaçao":["Curaçao","🇨🇼"],"Netherlands":["Niederlande","🇳🇱"],"Japan":["Japan","🇯🇵"],
"Sweden":["Schweden","🇸🇪"],"Tunisia":["Tunesien","🇹🇳"],"Belgium":["Belgien","🇧🇪"],"Iran":["Iran","🇮🇷"],
"Egypt":["Ägypten","🇪🇬"],"New Zealand":["Neuseeland","🇳🇿"],"Spain":["Spanien","🇪🇸"],
"Uruguay":["Uruguay","🇺🇾"],"Saudi Arabia":["Saudi-Arabien","🇸🇦"],"Cape Verde":["Kap Verde","🇨🇻"],
"France":["Frankreich","🇫🇷"],"Senegal":["Senegal","🇸🇳"],"Norway":["Norwegen","🇳🇴"],"Iraq":["Irak","🇮🇶"],
"Argentina":["Argentinien","🇦🇷"],"Austria":["Österreich","🇦🇹"],"Algeria":["Algerien","🇩🇿"],
"Jordan":["Jordanien","🇯🇴"],"Portugal":["Portugal","🇵🇹"],"Colombia":["Kolumbien","🇨🇴"],
"Uzbekistan":["Usbekistan","🇺🇿"],"DR Congo":["DR Kongo","🇨🇩"],"England":["England","🏴󠁧󠁢󠁥󠁮󠁧󠁿"],
"Croatia":["Kroatien","🇭🇷"],"Ghana":["Ghana","🇬🇭"],"Panama":["Panama","🇵🇦"],
};

function de(name){ return TEAM[name] ? TEAM[name][0] : name; }
function flag(name){ return TEAM[name] ? TEAM[name][1] : "🏳️"; }

// "2026-06-11" + "13:00 UTC-6"  ->  isländische Zeit (UTC+0)
function toIceland(dateStr, timeStr){
  try{
    const m = timeStr.match(/(\d{1,2}):(\d{2})\s*UTC([+-]\d{1,2})/);
    if(!m) return { date: dateStr, time: "" };
    const [_, hh, mm, off] = m;
    // UTC-Zeitpunkt bauen: lokale Anstoßzeit minus Offset
    const utc = new Date(`${dateStr}T${hh.padStart(2,"0")}:${mm}:00Z`);
    utc.setHours(utc.getHours() - parseInt(off,10)); // von Lokal zu UTC
    // Island = UTC+0, also ist utc bereits isländische Zeit
    const wd = ["So","Mo","Di","Mi","Do","Fr","Sa"][utc.getUTCDay()];
    const d = String(utc.getUTCDate()).padStart(2,"0");
    const mo = String(utc.getUTCMonth()+1).padStart(2,"0");
    const h = String(utc.getUTCHours()).padStart(2,"0");
    const mi = String(utc.getUTCMinutes()).padStart(2,"0");
    return { date:`${wd} ${d}.${mo}.`, time:`${h}:${mi}` };
  }catch(e){ return { date: dateStr, time: "" }; }
}

function json(body, status=200){
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      // 10 Minuten cachen, damit wir die Quelle nicht überlasten
      "Cache-Control": "public, max-age=600",
    },
  });
}

export default async () => {
  try{
    const r = await fetch(SRC);
    if(!r.ok) return json({ error: "Quelle nicht erreichbar", matches: [] }, 502);
    const data = await r.json();

    const matches = (data.matches || [])
      .filter(m => m.group)  // nur Gruppenspiele
      .map(m => {
        const t = toIceland(m.date, m.time);
        const ft = m.score && m.score.ft ? m.score.ft : null;
        // stabile ID: Gruppe + beide (englische) Teamnamen
        const id = `${m.group}__${m.team1}__${m.team2}`.replace(/[^A-Za-z0-9_]/g,"");
        return {
          id,
          group: m.group.replace("Group ","").trim(),  // "A".."L"
          round: m.round,                               // "Matchday 1".."17"
          date: t.date,
          time: t.time,
          ground: m.ground || "",
          home: de(m.team1), homeFlag: flag(m.team1),
          away: de(m.team2), awayFlag: flag(m.team2),
          result: ft ? { h: ft[0], a: ft[1] } : null,   // echtes Ergebnis (oder null)
        };
      });

    return json({ updated: new Date().toISOString(), matches });
  }catch(e){
    return json({ error: String(e), matches: [] }, 500);
  }
};
