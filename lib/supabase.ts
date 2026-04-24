import { createClient } from "@supabase/supabase-js";

import { env } from "./env";
import { logger } from "./logger";

// CI and other build-only environments can opt out of hitting Supabase entirely
// by setting SUPABASE_BUILD_STUB=1. Every request returns an empty JSON array,
// which supabase-js unwraps to `{ data: [], error: null }`. Pages that gate on
// `data.length` degrade to an empty state; pages that iterate produce zero
// output. This lets `next build` succeed without real credentials.
const BUILD_STUB = env.SUPABASE_BUILD_STUB;

export type RetryDeps = {
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  maxAttempts?: number;
  random?: () => number;
};

// Equal-jitter backoff: half fixed, half random over [0, base). With `base =
// 500 * 2^(attempt-1)`, sleep lands in `[base/2, base)`. This keeps the
// exponential shape while preventing thundering herds when a flood of clients
// wakes up together after a proxy recovers.
function backoffWithJitter(attempt: number, random: () => number): number {
  const base = 500 * 2 ** (attempt - 1);
  const half = base / 2;
  return Math.floor(half + random() * half);
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  deps: RetryDeps = {},
): Promise<Response> {
  if (BUILD_STUB) {
    return new Response("[]", {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  const fetchImpl = deps.fetchImpl ?? fetch;
  const sleep = deps.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const maxAttempts = deps.maxAttempts ?? 7;
  const random = deps.random ?? Math.random;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetchImpl(input, init);
      const retryable =
        res.status >= 500 || res.status === 429 || res.status === 408 || res.status === 0;
      if (retryable) {
        if (attempt < maxAttempts) {
          const backoff = backoffWithJitter(attempt, random);
          logger.warn(
            "supabase-retry",
            `status=${res.status} attempt=${attempt}/${maxAttempts} backoff=${backoff}ms`,
          );
          await sleep(backoff);
          continue;
        }
        logger.error(
          "supabase-retry",
          `exhausted maxAttempts=${maxAttempts} final-status=${res.status}`,
        );
        return res;
      }
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.toLowerCase().includes("json")) {
        const body = await res.clone().text();
        const looksLikeProxyError =
          body.trimStart().startsWith("<") &&
          /service\s+unavailable|temporarily\s+unavailable|bad\s+gateway|gateway\s+timeout/i.test(
            body,
          );
        if (looksLikeProxyError && attempt < maxAttempts) {
          const backoff = backoffWithJitter(attempt, random);
          logger.warn(
            "supabase-retry",
            `proxy-error attempt=${attempt}/${maxAttempts} backoff=${backoff}ms`,
          );
          await sleep(backoff);
          continue;
        }
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        const backoff = backoffWithJitter(attempt, random);
        logger.warn(
          "supabase-retry",
          `network-error attempt=${attempt}/${maxAttempts} backoff=${backoff}ms`,
          { err },
        );
        await sleep(backoff);
        continue;
      }
      logger.error("supabase-retry", `exhausted maxAttempts=${maxAttempts} network-error`, {
        err,
      });
      throw lastError;
    }
  }
  throw lastError ?? new Error("fetchWithRetry: exhausted retries");
}

export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetchWithRetry(input, init) },
  },
);
