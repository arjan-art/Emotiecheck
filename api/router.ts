import { createRouter, publicQuery } from "./middleware";
import { emotionRouter } from "./routers/emotion";
import { whatsappRouter } from "./routers/whatsapp";
import { participantRouter } from "./routers/participant";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  emotion: emotionRouter,
  whatsapp: whatsappRouter,
  participant: participantRouter,
});

export type AppRouter = typeof appRouter;
