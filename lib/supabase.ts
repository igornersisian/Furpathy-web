import { createClient } from "@supabase/supabase-js";

import { env } from "./env";

async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const maxAttempts = 7;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const backoff = 500 * 2 ** (attempt - 1);
    try {
      const res = await fetch(input, init);
      const retryable =
        res.status >= 500 ||
        res.status === 429 ||
        res.status === 408 ||
        res.status === 0;
      if (retryable) {
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
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
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
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
    global: { fetch: fetchWithRetry },
  },
);
