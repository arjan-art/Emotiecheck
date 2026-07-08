#!/bin/bash
# EmotieCheck - Snelstart script
echo "==================================="
echo "  EmotieCheck Dagbesteding"
echo "==================================="
echo ""

# Check of node geinstalleerd is
if ! command -v node &> /dev/null; then
    echo "Node.js is niet geinstalleerd."
    echo "Download: https://nodejs.org (versie 20 of hoger)"
    exit 1
fi

echo "Node.js versie: $(node --version)"
echo ""

# Database aanmaken
mkdir -p data

# Afhankelijkheden installeren (alleen als node_modules ontbreekt)
if [ ! -d "node_modules" ]; then
    echo "Afhankelijkheden installeren..."
    npm install
fi

# Database initialiseren
echo "Database initialiseren..."
node -e "
const { PGlite } = require('@electric-sql/pglite');
const path = require('path');

async function init() {
  const client = new PGlite('./data/emotiecheck.db');
  
  await client.query(\`
    CREATE TABLE IF NOT EXISTS emotions (
      id SERIAL PRIMARY KEY,
      emotion VARCHAR(10) NOT NULL,
      participant_name VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      device_id VARCHAR(50) DEFAULT 'tablet-001',
      handled BOOLEAN DEFAULT FALSE
    )
  \`);

  await client.query(\`
    CREATE TABLE IF NOT EXISTS participants (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  \`);

  await client.query(\`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(50) NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  \`);

  const countResult = await client.query('SELECT COUNT(*) FROM participants');
  const count = parseInt(countResult.rows[0].count);

  if (count === 0) {
    console.log('Standaard deelnemers toevoegen...');
    const names = ['Anna','Bram','Clara','Daan','Eva','Finn','Gijs','Hanna','Ibrahim','Julia','Kees','Lara','Milan','Nora','Oscar','Puck'];
    for (const name of names) {
      await client.query('INSERT INTO participants (name) VALUES (\$1)', [name]);
    }
    await client.query(\`INSERT INTO settings (key, value) VALUES ('whatsapp_enabled', 'false'), ('whatsapp_phone', ''), ('whatsapp_api_key', '') ON CONFLICT (key) DO NOTHING\`);
  }

  await client.close();
  console.log('Database klaar!');
}
init().catch(console.error);
"

# App builden
echo "App builden..."
npm run build

# Server starten
echo ""
echo "==================================="
echo "  Server starten..."
echo "  Open http://localhost:3000"
echo "  Dashboard: http://localhost:3000/dashboard"
echo "  Instellingen: http://localhost:3000/settings"
echo "==================================="
echo ""

NODE_ENV=production node dist/boot.js
