# ⚽ WM 2026 Tippspiel — Aufbau-Anleitung

Diese App ist eine echte Webseite mit getrennten Logins für **Papa** und **Elisa**.
Eure Tipps liegen in **Netlify Blobs** — also außerhalb des Browsers, auf Netlifys Servern.
Ihr könnt von Handy, Tablet oder Laptop tippen, alles bleibt synchron.

So funktioniert die Sicherheit (Familien-Niveau): Jeder hat ein **Geheimwort**. Nur wer
das richtige Geheimwort kennt, kann die eigenen Tipps speichern. Die Geheimwörter liegen
als Umgebungsvariablen bei Netlify — **nicht** im Code und **nicht** bei GitHub.

---

## Was du brauchst
- Ein GitHub-Konto (hast du)
- Ein Netlify-Konto (gleich kostenlos erstellen)
- 20–30 Minuten beim ersten Mal

---

## Schritt 1 — Dateien zu GitHub hochladen

1. Lege auf GitHub ein **neues Repository** an, z.B. `wm-tippspiel` (privat ist okay).
2. Lade **alle Dateien aus diesem Ordner** hoch (per Web-Upload oder `git push`):
   - `index.html`
   - `netlify.toml`
   - `package.json`
   - `.gitignore`
   - den Ordner `netlify/functions/tipps.js`

   > Den Ordner `node_modules` lädst du **nicht** hoch — den baut Netlify selbst.
   > (Die `.gitignore` sorgt schon dafür.)

---

## Schritt 2 — Netlify-Konto erstellen & Projekt verbinden

1. Geh auf **netlify.com** und registriere dich — am einfachsten **"Sign up with GitHub"**.
2. Klick **"Add new site" → "Import an existing project" → "GitHub"**.
3. Wähle dein `wm-tippspiel`-Repository.
4. Die Build-Einstellungen kannst du so lassen, wie Netlify sie vorschlägt
   (die `netlify.toml` regelt das Wichtige automatisch). Klick **"Deploy"**.
5. Nach ein bis zwei Minuten ist die Seite live. Netlify zeigt dir eine Adresse wie
   `https://zufallsname-123.netlify.app`. Du kannst sie unter
   **Site configuration → Change site name** in etwas Schöneres umbenennen,
   z.B. `papa-elisa-wm.netlify.app`.

---

## Schritt 3 — Die Geheimwörter setzen (wichtig!)

Damit das Login funktioniert, musst du zwei Geheimwörter hinterlegen:

1. In Netlify: **Site configuration → Environment variables → "Add a variable"**.
2. Lege zwei Variablen an:
   - Name: `PAPA_SECRET`  → Wert: *dein* Geheimwort (z.B. `island2026`)
   - Name: `ELISA_SECRET` → Wert: *Elisas* Geheimwort (z.B. `elisa-tor`)
3. Wähle bei beiden, dass sie für **alle Scopes / alle Deploys** gelten.
4. **Wichtig:** Nach dem Setzen einmal neu veröffentlichen, damit die Werte aktiv werden:
   **Deploys → "Trigger deploy" → "Deploy site"**.

> Merkt euch die beiden Geheimwörter gut — damit meldet ihr euch in der App an.
> Du kannst sie jederzeit hier ändern.

---

## Schritt 4 — Loslegen

1. Öffnet die Netlify-Adresse auf euren Geräten.
2. Jeder wählt seinen Namen, gibt sein Geheimwort ein → **Los geht's**.
3. Tippt jedes einzelne Spiel (genaues Ergebnis, z.B. 2:1), dazu die Spezial- und
   lustigen Fragen. Alles speichert automatisch.

   **Punkte pro Spiel:** 4 = exaktes Ergebnis · 3 = richtige Tordifferenz ·
   2 = richtige Tendenz (Sieger/Unentschieden) · 0 = daneben.
   Die Spiele sind nach **Spieltag 1/2/3** und Gruppe sortiert.
4. **Papa** sieht unter **Regeln** zusätzlich den Knopf **"Ergebnisse eintragen"** —
   damit trägst du nach den Spielen die echten Resultate ein, und die Punkte
   werden automatisch berechnet.

---

## Gut zu wissen

- **Wer darf was?** Jeder kann nur seine *eigenen* Tipps ändern. Die Tipps des anderen
  könnt ihr ansehen (Umschalter oben), aber nicht bearbeiten. Ergebnisse trägt nur Papa ein.
- **Kosten:** Alles im kostenlosen Netlify-Tarif. Für ein Familien-Tippspiel weit
  unter allen Grenzen.
- **Faires Spiel:** Macht am besten vor Turnierstart einen Screenshot eurer Tipps —
  dann ist alles dokumentiert.
- **Tipp ändern vor Anpfiff?** Kein Problem, solange das jeweilige Spiel noch nicht
  gewertet ist. Eine automatische Sperre zu Anpfiff ist hier bewusst nicht eingebaut
  (Familien-Ehrensache 😉). Sag Bescheid, wenn du eine Deadline-Sperre möchtest.

Viel Spaß euch beiden! ⚽💛
