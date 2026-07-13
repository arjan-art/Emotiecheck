import "dotenv/config";

function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production" && !defaultValue) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? defaultValue ?? "";
}

export const env = {
  appId: getEnv("APP_ID", "emotiecheck-app"),
  appSecret: getEnv("APP_SECRET", "emotiecheck-secret"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: getEnv("DATABASE_URL", "./data/emotiecheck.db"),
};
