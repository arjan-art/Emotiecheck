import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { settings } from "@db/schema";
import { eq } from "drizzle-orm";
import { sendTestEmail } from "../lib/email";

// Helper to get a setting value by key
export async function getSetting(
  key: string,
): Promise<string | null> {
  const db = getDb();
  const record = await db.query.settings.findFirst({
    where: eq(settings.key, key),
  });
  return record?.value ?? null;
}

// Helper to set a setting value
async function setSetting(key: string, value: string): Promise<void> {
  const db = getDb();
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    });
}

export const whatsappRouter = createRouter({
  sendTest: publicQuery
    .input(z.object({ phoneNumber: z.string() }))
    .mutation(async ({ input }) => {
      const emailApiKey = await getSetting("email_api_key");
      if (!emailApiKey) {
        return { success: false, message: "Geen email API key geconfigureerd." };
      }
      const result = await sendTestEmail(input.phoneNumber, emailApiKey);
      return result;
    }),

  getConfig: publicQuery.query(async () => {
    const [emailAddress, emailApiKey, enabled] = await Promise.all([
      getSetting("email_address"),
      getSetting("email_api_key"),
      getSetting("email_enabled"),
    ]);

    return {
      phoneNumber: emailAddress ?? "",
      apiKey: emailApiKey ?? "",
      enabled: enabled === "true",
    };
  }),

  updateConfig: publicQuery
    .input(
      z.object({
        phoneNumber: z.string().optional(),
        apiKey: z.string().optional(),
        enabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.phoneNumber !== undefined) {
        await setSetting("email_address", input.phoneNumber);
      }
      if (input.apiKey !== undefined) {
        await setSetting("email_api_key", input.apiKey);
      }
      if (input.enabled !== undefined) {
        await setSetting("email_enabled", String(input.enabled));
      }

      return { success: true };
    }),
});
