// netlify/functions/tipps.js
// Diese Funktion läuft auf Netlifys Servern und spricht mit dem Blobs-Speicher.
// Sie kann zwei Dinge: alle Daten laden (GET) und Daten speichern (POST).
//
// Sicherheit auf Familien-Niveau: Jeder Spieler hat ein Geheimwort.
// Speichern darf nur, wer das richtige Geheimwort des jeweiligen Spielers mitschickt.

import { getStore } from "@netlify/blobs";

// Die Geheimwörter werden als Umgebungsvariablen in Netlify gesetzt
// (PAPA_SECRET und ELISA_SECRET) — NICHT hier im Code, damit sie nicht bei GitHub landen.
const SECRETS = {
  Papa: process.env.PAPA_SECRET || "",
  Elisa: process.env.ELISA_SECRET || "",
};

const STORE_NAME = "wm2026";

// Hilfsfunktion: JSON-Antwort mit den richtigen Headern
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (request) => {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  // ── LADEN: alle Tipps + Ergebnisse zurückgeben ──────────────────
  if (request.method === "GET") {
    try {
      const data = (await store.get("state", { type: "json" })) || {
        tips: {},        // tips[spieler] = { groupTips, championTip, topScorer, funTips }
        results: {},     // echte Ergebnisse (nur vom Spielleiter)
      };
      return json(data);
    } catch (e) {
      return json({ tips: {}, results: {} });
    }
  }

  // ── SPEICHERN: Tipps eines Spielers oder Ergebnisse ablegen ─────
  if (request.method === "POST") {
    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Ungültige Daten" }, 400);
    }

    const { player, secret, tips, results, mode } = payload;

    // Geheimwort prüfen
    if (!player || !SECRETS[player] || secret !== SECRETS[player]) {
      return json({ error: "Falsches Geheimwort oder unbekannter Spieler." }, 401);
    }

    // Aktuellen Stand laden, gezielt ergänzen, zurückschreiben
    const current = (await store.get("state", { type: "json" })) || { tips: {}, results: {} };

    if (mode === "results") {
      // Ergebnisse darf nur Papa (der Spielleiter) eintragen
      if (player !== "Papa") {
        return json({ error: "Nur der Spielleiter darf Ergebnisse eintragen." }, 403);
      }
      current.results = results || {};
    } else {
      // Normale Tipps: nur die eigenen überschreiben
      current.tips[player] = tips || {};
    }

    await store.setJSON("state", current);
    return json({ ok: true, state: current });
  }

  return json({ error: "Methode nicht erlaubt" }, 405);
};
