import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

// Use file-based database for persistence, or :memory: for ephemeral
const DB_PATH = process.env.DATABASE_URL?.replace("postgresql://", "") || "./data/emotiecheck.db";

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    const client = new PGlite(DB_PATH);
    instance = drizzle(client, { schema: fullSchema });
  }
  return instance;
}
