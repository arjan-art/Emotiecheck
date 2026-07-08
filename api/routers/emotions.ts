import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { emotions } from "@db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { sendEmailNotification } from "../lib/email";
import { getSetting } from "./whatsapp";

export const emotionRouter = createRouter({
  create: publicQuery
    .input(
      z.object({
        emotion: z.enum(["groen", "oranje", "rood"]),
        participantName: z.string().optional(),
        deviceId: z.string().default("tablet-001"),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const [record] = await db
        .insert(emotions)
        .values({
          emotion: input.emotion,
          participantName: input.participantName,
          deviceId: input.deviceId,
        })
        .returning();

      if (!record) {
        throw new Error("Failed to insert emotion record");
      }

      if (input.emotion === "rood") {
        try {
          const emailAddress = await getSetting("email_address");
          const emailApiKey = await getSetting("email_api_key");
          const enabled = await getSetting("email_enabled");

          if (emailAddress && emailApiKey && enabled === "true") {
            await sendEmailNotification(
              emailAddress,
              input.participantName || "Een deelnemer",
              record.createdAt,
              emailApiKey,
            );
          }
        } catch {
          // Silently fail
        }
      }

      return record;
    }),

  listToday: publicQuery.query(async () => {
    const db = getDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysEmotions = await db
      .select()
      .from(emotions)
      .where(gte(emotions.createdAt, today))
      .orderBy(desc(emotions.createdAt));

    const counts = {
      groen: todaysEmotions.filter((e) => e.emotion === "groen").length,
      oranje: todaysEmotions.filter((e) => e.emotion === "oranje").length,
      rood: todaysEmotions.filter((e) => e.emotion === "rood").length,
    };

    return { emotions: todaysEmotions, counts };
  }),

  getStats: publicQuery.query(async () => {
    const db = getDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysEmotions = await db
      .select()
      .from(emotions)
      .where(gte(emotions.createdAt, today));

    const total = todaysEmotions.length;
    const groen = todaysEmotions.filter((e) => e.emotion === "groen").length;
    const oranje = todaysEmotions.filter((e) => e.emotion === "oranje").length;
    const rood = todaysEmotions.filter((e) => e.emotion === "rood").length;

    return {
      total,
      groen,
      oranje,
      rood,
      percentages: {
        groen: total > 0 ? Math.round((groen / total) * 100) : 0,
        oranje: total > 0 ? Math.round((oranje / total) * 100) : 0,
        rood: total > 0 ? Math.round((rood / total) * 100) : 0,
      },
    };
  }),

  markHandled: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      await db
        .update(emotions)
        .set({ handled: true })
        .where(eq(emotions.id, input.id));

      const record = await db.query.emotions.findFirst({
        where: eq(emotions.id, input.id),
      });

      if (!record) {
        throw new Error("Emotion record not found");
      }

      return record;
    }),

  getActiveAlerts: publicQuery.query(async () => {
    const db = getDb();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return db
      .select()
      .from(emotions)
      .where(
        and(
          eq(emotions.emotion, "rood"),
          eq(emotions.handled, false),
          gte(emotions.createdAt, today),
        ),
      )
      .orderBy(desc(emotions.createdAt));
  }),
});
