import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const emotions = pgTable("emotions", {
  id: serial("id").primaryKey(),
  emotion: varchar("emotion", { length: 10 }).notNull(), // 'groen', 'oranje', 'rood'
  participantName: varchar("participant_name", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  deviceId: varchar("device_id", { length: 50 }).default("tablet-001"),
  handled: boolean("handled").default(false), // for red alerts
});

export type Emotion = typeof emotions.$inferSelect;
export type InsertEmotion = typeof emotions.$inferInsert;

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = typeof participants.$inferInsert;

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 50 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;
