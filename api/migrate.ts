import { PGlite } from "@electric-sql/pglite";

const DB_PATH = ":memory:";

export async function runMigrations() {
  console.log("[DB] Running migrations...");
  const client = new PGlite(DB_PATH);

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

  const countResult = await client.query("SELECT COUNT(*) FROM participants");
  const count = parseInt(countResult.rows[0].count as string, 10);

  if (count === 0) {
    console.log("[DB] Seeding default data...");
    const names = ["Anna","Bram","Clara","Daan","Eva","Finn","Gijs","Hanna","Ibrahim","Julia","Kees","Lara","Milan","Nora","Oscar","Puck"];
    for (const name of names) {
      await client.query("INSERT INTO participants (name) VALUES ($1)", [name]);
    }
    await client.query(`
      INSERT INTO settings (key, value) VALUES
        ('whatsapp_enabled', 'false'),
        ('whatsapp_phone', ''),
        ('whatsapp_api_key', '')
      ON CONFLICT (key) DO NOTHING
    `);
  }

  await client.close();
  console.log("[DB] Migrations complete.");
}
