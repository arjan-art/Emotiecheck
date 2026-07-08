import { getDb } from "../api/queries/connection";
import { emotions, settings } from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Insert sample emotions for today
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const sampleEmotions = [
    { emotion: "groen" as const, createdAt: new Date(today.getTime() + 8 * 60 * 60 * 1000 + 15 * 60 * 1000), deviceId: "tablet-001", handled: false },
    { emotion: "groen" as const, createdAt: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 30 * 60 * 1000), deviceId: "tablet-001", handled: false },
    { emotion: "oranje" as const, createdAt: new Date(today.getTime() + 10 * 60 * 60 * 1000 + 45 * 60 * 1000), deviceId: "tablet-001", handled: false },
    { emotion: "groen" as const, createdAt: new Date(today.getTime() + 11 * 60 * 60 * 1000 + 0 * 60 * 1000), deviceId: "tablet-001", handled: false },
    { emotion: "rood" as const, createdAt: new Date(today.getTime() + 12 * 60 * 60 * 1000 + 20 * 60 * 1000), deviceId: "tablet-001", handled: true },
    { emotion: "groen" as const, createdAt: new Date(today.getTime() + 13 * 60 * 60 * 1000 + 10 * 60 * 1000), deviceId: "tablet-001", handled: false },
    { emotion: "oranje" as const, createdAt: new Date(today.getTime() + 14 * 60 * 60 * 1000 + 30 * 60 * 1000), deviceId: "tablet-001", handled: false },
    { emotion: "groen" as const, createdAt: new Date(today.getTime() + 15 * 60 * 60 * 1000 + 0 * 60 * 1000), deviceId: "tablet-001", handled: false },
  ];

  for (const e of sampleEmotions) {
    await db.insert(emotions).values(e);
  }

  // Insert default settings
  await db.insert(settings).values([
    { key: "whatsapp_enabled", value: "false" },
    { key: "whatsapp_phone", value: "" },
    { key: "whatsapp_api_key", value: "" },
  ]).onConflictDoUpdate({
    target: settings.key,
    set: { value: "false" },
  });

  console.log("Done.");
  process.exit(0); // close database connection
}

seed();
