/**
 * Centralized environment variable validation.
 * Imported for side effects at app entry points (e.g. lib/supabase.ts).
 *
 * In production, missing required vars throw immediately so broken deploys
 * fail loudly instead of silently serving empty data.
 * In development, we warn once to keep the feedback loop tight.
 */

type RequiredEnv = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
};

const required: (keyof RequiredEnv)[] = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

function readEnv(): RequiredEnv {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    const message = `[env] Missing required environment variables: ${missing.join(", ")}`;

    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }

    console.warn(`${message} — continuing in ${process.env.NODE_ENV ?? "development"} mode`);
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };
}

export const env = readEnv();
