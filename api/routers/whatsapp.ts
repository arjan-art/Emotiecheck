import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { settings } from "@db/schema";
import { eq } from "drizzle-orm";
import { sendWhatsAppMessage } from "../lib/whatsapp";

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
      const apiKey = await getSetting("whatsapp_api_key");
      const result = await sendWhatsAppMessage(
        input.phoneNumber,
        "🧪 Dit is een testbericht van EmotieCheck dagbesteding.",
        apiKey ?? undefined,
      );
      return result;
    }),

  getConfig: publicQuery.query(async () => {
    const [phoneNumber, apiKey, enabled] = await Promise.all([
      getSetting("whatsapp_phone"),
      getSetting("whatsapp_api_key"),
      getSetting("whatsapp_enabled"),
    ]);

    return {
      phoneNumber: phoneNumber ?? "",
      apiKey: apiKey ?? "",
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
        await setSetting("whatsapp_phone", input.phoneNumber);
      }
      if (input.apiKey !== undefined) {
        await setSetting("whatsapp_api_key", input.apiKey);
      }
      if (input.enabled !== undefined) {
        await setSetting("whatsapp_enabled", String(input.enabled));
      }

      return { success: true };
    }),
});
