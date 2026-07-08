import { PGlite } from "@electric-sql/pglite";

const DB_PATH = process.env.DATABASE_URL?.replace("postgresql://", "") || "./data/emotiecheck.db";

export async function runMigrations() {
  console.log("[DB] Running migrations...");

  const client = new PGlite(DB_PATH);

  // Create tables
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

  await client.query(`
    CREATE TABLE IF NOT EXISTS participants (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(50) NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);

  // Check if participants exist
  const countResult = await client.query("SELECT COUNT(*) FROM participants");
  const count = parseInt(countResult.rows[0].count as string, 10);

  if (count === 0) {
    console.log("[DB] Seeding default data...");

    // Seed participants
    const names = [
      "Anna", "Bram", "Clara", "Daan", "Eva", "Finn", "Gijs", "Hanna",
      "Ibrahim", "Julia", "Kees", "Lara", "Milan", "Nora", "Oscar", "Puck"
    ];
    for (const name of names) {
      await client.query("INSERT INTO participants (name) VALUES ($1)", [name]);
    }

    // Seed settings
    await client.query(`
      INSERT INTO settings (key, value) VALUES
        ('whatsapp_enabled', 'false'),
        ('whatsapp_phone', ''),
        ('whatsapp_api_key', '')
      ON CONFLICT (key) DO NOTHING
    `);

    // Seed sample emotions
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const samples = [
      { e: "groen", t: 8 * 60 + 15, n: "Anna" },
      { e: "groen", t: 9 * 60 + 30, n: "Bram" },
      { e: "oranje", t: 10 * 60 + 45, n: "Clara" },
      { e: "groen", t: 11 * 60 + 0, n: "Daan" },
      { e: "rood", t: 12 * 60 + 20, n: "Eva" },
      { e: "groen", t: 13 * 60 + 10, n: "Finn" },
      { e: "oranje", t: 14 * 60 + 30, n: "Gijs" },
      { e: "groen", t: 15 * 60 + 0, n: "Hanna" },
    ];
    for (const s of samples) {
      const ts = new Date(today.getTime() + s.t * 60 * 1000).toISOString();
      await client.query(
        "INSERT INTO emotions (emotion, participant_name, created_at, handled) VALUES ($1, $2, $3, $4)",
        [s.e, s.n, ts, false]
      );
    }
  }

  await client.close();
  console.log("[DB] Migrations complete.");
}
