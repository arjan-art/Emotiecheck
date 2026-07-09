import { getDb } from "../api/queries/connection";
import { emotions, participants, settings } from "./schema";

async function seed() {
  const db = getDb();

  // Insert default participants
  const names = [
    "Anna", "Bram", "Clara", "Daan", "Eva", "Finn", "Gijs", "Hanna",
    "Ibrahim", "Julia", "Kees", "Lara", "Milan", "Nora", "Oscar", "Puck"
  ];

  for (const name of names) {
    await db.insert(participants).values({ name }).onConflictDoNothing();
  }

  // Insert default settings
  await db.insert(settings).values([
    { key: "email_enabled", value: "false" },
    { key: "email_address", value: "" },
    { key: "email_api_key", value: "" },
  ]).onConflictDoUpdate({
    target: settings.key,
    set: { value: "false" },
  });

  // Insert sample emotions for today
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
    await db.insert(emotions).values({
      emotion: s.e,
      participantName: s.n,
      createdAt: new Date(ts),
    }).onConflictDoNothing();
  }

  console.log("Seed complete!");
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
