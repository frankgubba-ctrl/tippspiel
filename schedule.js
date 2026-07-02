// netlify/functions/schedule.js
// Holt den echten WM-2026-Spielplan inkl. Ergebnisse von der öffentlichen,
// gemeinfreien (public domain) openfootball-Datenquelle auf GitHub.
// Liefert Gruppenspiele UND K.-o.-Spiele. Datum/Uhrzeit in isländischer Zeit (UTC+0).

const SRC = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

// Englisch -> Deutsch + Flagge (alle 48 Teilnehmer)
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

// Rundennamen Englisch -> Deutsch
const ROUND = {
  "Round of 32":"Sechzehntelfinale",
  "Round of 16":"Achtelfinale",
  "Quarter-final":"Viertelfinale",
  "Semi-final":"Halbfinale",
  "Match for third place":"Spiel um Platz 3",
  "Final":"Finale",
};

function de(name){ return TEAM[name] ? TEAM[name][0] : name; }
function flag(name){ return TEAM[name] ? TEAM[name][1] : "🏳️"; }
// Platzhalter wie "W73", "L101" oder "Winner Group A" erkennen
function isPlaceholder(name){
  if(!name) return true;
  if(/^[WL]\d/.test(name)) return true;
  if(/winner|runner|loser|place/i.test(name)) return true;
  return !TEAM[name]; // unbekannter Name = noch Platzhalter
}

// "2026-06-11" + "13:00 UTC-6" -> isländische Zeit (UTC+0)
function toIceland(dateStr, timeStr){
  try{
    const m = (timeStr||"").match(/(\d{1,2}):(\d{2})\s*UTC([+-]\d{1,2})/);
    if(!m) return { date: dateStr, time: "" };
    const [_, hh, mm, off] = m;
    const utc = new Date(`${dateStr}T${hh.padStart(2,"0")}:${mm}:00Z`);
    utc.setHours(utc.getHours() - parseInt(off,10));
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
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=600" },
  });
}

export default async () => {
  try{
    const r = await fetch(SRC);
    if(!r.ok) return json({ error: "Quelle nicht erreichbar", matches: [], ko: [] }, 502);
    const data = await r.json();
    const all = data.matches || [];

    // Gruppenspiele
    const matches = all.filter(m => m.group).map(m => {
      const t = toIceland(m.date, m.time);
      const ft = m.score && m.score.ft ? m.score.ft : null;
      const id = `${m.group}__${m.team1}__${m.team2}`.replace(/[^A-Za-z0-9_]/g,"");
      return {
        id, group: m.group.replace("Group ","").trim(),
        date: t.date, time: t.time, ground: m.ground || "",
        home: de(m.team1), homeFlag: flag(m.team1),
        away: de(m.team2), awayFlag: flag(m.team2),
        result: ft ? { h: ft[0], a: ft[1] } : null,
      };
    });

    // K.-o.-Spiele (alles ohne group)
    const ko = all.filter(m => !m.group).map((m, i) => {
      const t = toIceland(m.date, m.time);
      const ft = m.score && m.score.ft ? m.score.ft : null;
      const ph = isPlaceholder(m.team1) || isPlaceholder(m.team2);
      // stabile ID: Runde + Position (nicht Teamnamen, da diese sich von Platzhalter zu echt ändern)
      const id = `KO__${(m.round||"").replace(/[^A-Za-z0-9]/g,"")}__${m.num || i}`;
      return {
        id,
        round: ROUND[m.round] || m.round,
        roundKey: m.round,
        date: t.date, time: t.time, ground: m.ground || "",
        home: ph && isPlaceholder(m.team1) ? "—" : de(m.team1),
        homeFlag: isPlaceholder(m.team1) ? "❓" : flag(m.team1),
        away: ph && isPlaceholder(m.team2) ? "—" : de(m.team2),
        awayFlag: isPlaceholder(m.team2) ? "❓" : flag(m.team2),
        pending: ph,                 // true = Teams stehen noch nicht fest
        result: ft ? { h: ft[0], a: ft[1] } : null,
      };
    });

    return json({ updated: new Date().toISOString(), matches, ko });
  }catch(e){
    return json({ error: String(e), matches: [], ko: [] }, 500);
  }
};
