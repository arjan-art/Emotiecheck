# EmotieCheck - Deploy op Render

## Stap 1: Maak een nieuw project aan op Render

1. Ga naar https://dashboard.render.com
2. Log in met je account (arjan@deterugwinning.nl)
3. Klik op de knop **"New +"** (blauw, rechtsboven)
4. Kies **"Blueprint"**

## Stap 2: Upload de code

1. Kies **"Upload an existing repository"**
2. Upload het ZIP-bestand dat je hebt gekregen
3. Render detecteert automatisch het `render.yaml` bestand

**Alternatief - via Git:**
1. Maak een gratis GitHub account aan (via je Gmail)
2. Upload de code naar een nieuwe repository
3. Koppel GitHub aan Render

## Stap 3: Render maakt automatisch aan

Render leest het `render.yaml` bestand en maakt automatisch aan:

- **Web Service** "emotiecheck" (gratis tier)
- **PostgreSQL Database** "emotiecheck-db" (gratis tier, 25GB)

Wacht tot de deployment klaar is (2-3 minuten).

## Stap 4: Database schema aanmaken

Nadat de deployment klaar is:

1. Ga naar je **PostgreSQL database** in het Render dashboard
2. Klik op **"Connect"** en kopieer de **External Database URL**
3. Ga naar je **Web Service** → **Shell** (tabblad)
4. Voer dit commando uit:

```bash
npx drizzle-kit push
```

Hiermee worden alle tabellen aangemaakt (emotions, participants, settings).

## Stap 5: Deelnemers toevoegen

1. Open de app in je browser (URL staat in je Render dashboard)
2. Ga naar **/settings** (achter je URL plakken, bv. `https://emotiecheck-xxx.onrender.com/settings`)
3. Voeg de namen van je deelnemers toe in het "Deelnemers" gedeelte

## Stap 6: WhatsApp instellen (optioneel)

1. In **Instellingen**, vul het telefoonnummer van de zorgmedewerker in
2. Volg de CallMeBot instructies om WhatsApp-berichten te activeren

---

## Troubleshooting

### "Build failed"
- Check de **Logs** tab in Render voor de exacte error
- Meestal: npm install duurt lang op gratis tier, even wachten

### "Database connection refused"
- Zorg dat de DATABASE_URL correct is ingesteld
- Check of `npx drizzle-kit push` is uitgevoerd

### App is traag
- De gratis tier "slaapt" na 15 minuten inactiviteit
- Eerste bezoek na inactiviteit duurt ~30 seconden om op te starten
- Dit is normaal op de gratis tier

### Eigen domeinnaam
- In Render dashboard: **Settings** → **Custom Domain**
- Volg de instructies om je domein te koppelen
