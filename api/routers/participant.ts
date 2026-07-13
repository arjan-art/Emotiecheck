import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { participants } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const participantRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(participants)
      .orderBy(desc(participants.createdAt));
  }),

  listActive: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(participants)
      .orderBy(participants.name);
  }),

  create: publicQuery
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [record] = await db
        .insert(participants)
        .values({ name: input.name })
        .returning();
      return record;
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(participants)
        .set({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.active !== undefined && { active: input.active }),
        })
        .where(eq(participants.id, input.id));
      return db.query.participants.findFirst({
        where: eq(participants.id, input.id),
      });
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(participants).where(eq(participants.id, input.id));
      return { success: true };
    }),
});
