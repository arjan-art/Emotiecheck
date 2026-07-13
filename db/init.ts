import { PGlite } from "@electric-sql/pglite";

const DB_PATH = process.env.DATABASE_URL?.replace("postgresql://", "") || "./data/emotiecheck.db";

async function init() {
  console.log("Initializing database at:", DB_PATH);
  const client = new PGlite(DB_PATH);

  // Create emotions table
  await client.query(`
    CREATE TABLE IF NOT EXISTS emotions (
      id SERIAL PRIMARY KEY,
      emotion VARCHAR(10) NOT NULL,
      participant_name VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      device_id VARCHAR(50) DEFAULT 'tablet-001',
      handled BOOLEAN DEFAULT FALSE
    )
  `);

  // Create participants table
  await client.query(`
    CREATE TABLE IF NOT EXISTS participants (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);

  // Create settings table
  await client.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(50) NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);

  // Insert default participants
  const defaultParticipants = [
    "Anna", "Bram", "Clara", "Daan", "Eva", "Finn", "Gijs", "Hanna",
    "Ibrahim", "Julia", "Kees", "Lara", "Milan", "Nora", "Oscar", "Puck"
  ];

  for (const name of defaultParticipants) {
    await client.query(
      `INSERT INTO participants (name) VALUES ($1) ON CONFLICT DO NOTHING`,
      [name]
    );
  }

  // Insert default settings
  await client.query(`
    INSERT INTO settings (key, value) VALUES
      ('whatsapp_enabled', 'false'),
      ('whatsapp_phone', ''),
      ('whatsapp_api_key', '')
    ON CONFLICT (key) DO NOTHING
  `);

  // Insert sample emotions for today
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const samples = [
    { emotion: "groen", time: 8 * 60 + 15, name: "Anna" },
    { emotion: "groen", time: 9 * 60 + 30, name: "Bram" },
    { emotion: "oranje", time: 10 * 60 + 45, name: "Clara" },
    { emotion: "groen", time: 11 * 60 + 0, name: "Daan" },
    { emotion: "rood", time: 12 * 60 + 20, name: "Eva" },
    { emotion: "groen", time: 13 * 60 + 10, name: "Finn" },
    { emotion: "oranje", time: 14 * 60 + 30, name: "Gijs" },
    { emotion: "groen", time: 15 * 60 + 0, name: "Hanna" },
  ];

  for (const s of samples) {
    const createdAt = new Date(today.getTime() + s.time * 60 * 1000);
    await client.query(
      `INSERT INTO emotions (emotion, participant_name, created_at, handled) VALUES ($1, $2, $3, $4)`,
      [s.emotion, s.name, createdAt.toISOString(), s.emotion === "rood" ? false : false]
    );
  }

  console.log("Database initialized successfully!");
  await client.close();
}

init().catch(console.error);
