/**
 * Centralized environment variable access and validation.
 * Imported for side effects at app entry points (e.g. lib/supabase.ts).
 *
 * In production, missing REQUIRED vars throw immediately so broken deploys
 * fail loudly instead of silently serving empty data. OPTIONAL vars with
 * production-sensitive semantics (e.g. REVALIDATE_SECRET) get a warn log.
 * In development, everything downgrades to a warn so the feedback loop stays tight.
 */

import { z } from "zod";
import { logger } from "./logger";

const DEFAULT_SITE_URL = "https://furpathy.com";

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().default(DEFAULT_SITE_URL),
  REVALIDATE_SECRET: z.string().min(1).optional(),
  SUPABASE_BUILD_STUB: z
    .enum(["0", "1"])
    .optional()
    .transform((v) => v === "1"),
});

export type Env = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  REVALIDATE_SECRET: string | undefined;
  SITE_URL: string;
  SUPABASE_BUILD_STUB: boolean;
};

function readEnv(): Env {
  const isProd = process.env.NODE_ENV === "production";
  const mode = process.env.NODE_ENV ?? "development";

  const parsed = EnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
    SUPABASE_BUILD_STUB: process.env.SUPABASE_BUILD_STUB,
  });

  if (!parsed.success) {
    const flat = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    const message = `[env] Invalid environment: ${flat}`;
    if (isProd) throw new Error(message);
    logger.warn("env", `${message} — continuing in ${mode} mode with defaults`);
    // In dev/test we fall through to placeholders so tooling keeps working.
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      REVALIDATE_SECRET: process.env.REVALIDATE_SECRET || undefined,
      SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
      SUPABASE_BUILD_STUB: process.env.SUPABASE_BUILD_STUB === "1",
    };
  }

  const data = parsed.data;

  if (isProd && !data.REVALIDATE_SECRET) {
    logger.warn(
      "env",
      "Missing recommended production env var: REVALIDATE_SECRET (revalidation webhook will refuse all requests)",
    );
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: data.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    REVALIDATE_SECRET: data.REVALIDATE_SECRET,
    SITE_URL: data.NEXT_PUBLIC_SITE_URL,
    SUPABASE_BUILD_STUB: data.SUPABASE_BUILD_STUB ?? false,
  };
}

export const env = readEnv();
