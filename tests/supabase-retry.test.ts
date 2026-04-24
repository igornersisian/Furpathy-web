import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWithRetry } from "@/lib/supabase";
import { logger } from "@/lib/logger";

function jsonResponse(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function htmlResponse(status: number, body: string): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html" },
  });
}

function noopSleep(): Promise<void> {
  return Promise.resolve();
}

// Deterministic random so jitter assertions can be precise.
function fixedRandom(value: number): () => number {
  return () => value;
}

describe("fetchWithRetry", () => {
  // Silence retry logs in tests that intentionally force retries.
  beforeEach(() => {
    vi.spyOn(logger, "warn").mockImplementation(() => {});
    vi.spyOn(logger, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the first 2xx JSON response without retrying", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    const res = await fetchWithRetry("https://x/y", undefined, {
      fetchImpl,
      sleep: noopSleep,
    });
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("retries on 5xx until success", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(502))
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const res = await fetchWithRetry("https://x/y", undefined, {
      fetchImpl,
      sleep: noopSleep,
    });
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("retries on 429 (rate limit) and 408 (timeout)", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(429))
      .mockResolvedValueOnce(jsonResponse(408))
      .mockResolvedValueOnce(jsonResponse(200));
    const res = await fetchWithRetry("https://x/y", undefined, {
      fetchImpl,
      sleep: noopSleep,
    });
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("retries on HTML proxy error masquerading as 200", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(htmlResponse(200, "<html><body>Service Unavailable</body></html>"))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const res = await fetchWithRetry("https://x/y", undefined, {
      fetchImpl,
      sleep: noopSleep,
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("json");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not retry on a normal 4xx (e.g. 404)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(404, { error: "nope" }));
    const res = await fetchWithRetry("https://x/y", undefined, {
      fetchImpl,
      sleep: noopSleep,
    });
    expect(res.status).toBe(404);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("returns the last 5xx after exhausting attempts", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(503));
    const res = await fetchWithRetry("https://x/y", undefined, {
      fetchImpl,
      sleep: noopSleep,
      maxAttempts: 3,
    });
    expect(res.status).toBe(503);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("retries then re-throws the last network error", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("ENOTFOUND"));
    await expect(
      fetchWithRetry("https://x/y", undefined, {
        fetchImpl,
        sleep: noopSleep,
        maxAttempts: 3,
      }),
    ).rejects.toThrow("ENOTFOUND");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("succeeds after a transient network error", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("ECONNRESET"))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const res = await fetchWithRetry("https://x/y", undefined, {
      fetchImpl,
      sleep: noopSleep,
    });
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not retry on HTML 200 that isn't a proxy error", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(htmlResponse(200, "<html><body>ok</body></html>"));
    const res = await fetchWithRetry("https://x/y", undefined, {
      fetchImpl,
      sleep: noopSleep,
    });
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("applies jitter inside [base/2, base) per attempt", async () => {
    // base at attempt n = 500 * 2^(n-1); equal-jitter → [base/2, base)
    // With random() = 0.5, sleep = floor(base/2 + 0.5 * base/2) = floor(0.75 * base).
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(200));
    const sleepCalls: number[] = [];
    const sleep = (ms: number) => {
      sleepCalls.push(ms);
      return Promise.resolve();
    };
    await fetchWithRetry("https://x/y", undefined, {
      fetchImpl,
      sleep,
      random: fixedRandom(0.5),
    });
    // attempt 1 base=500 → floor(250 + 125) = 375
    // attempt 2 base=1000 → floor(500 + 250) = 750
    expect(sleepCalls).toEqual([375, 750]);
  });

  it("jitter stays within [base/2, base) across random values", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(200));
    const sleepCalls: number[] = [];
    const sleep = (ms: number) => {
      sleepCalls.push(ms);
      return Promise.resolve();
    };
    // random → 0.999..., still inside base/2 + half < base
    await fetchWithRetry("https://x/y", undefined, {
      fetchImpl,
      sleep,
      random: fixedRandom(0.9999),
    });
    expect(sleepCalls.length).toBe(1);
    const base = 500;
    expect(sleepCalls[0]).toBeGreaterThanOrEqual(base / 2);
    expect(sleepCalls[0]).toBeLessThan(base);
  });

  it("logs a warning on each retry and an error when attempts exhaust", async () => {
    const warnSpy = vi.spyOn(logger, "warn");
    const errorSpy = vi.spyOn(logger, "error");
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(503));
    await fetchWithRetry("https://x/y", undefined, {
      fetchImpl,
      sleep: noopSleep,
      maxAttempts: 3,
    });
    // two retries before giving up on attempt 3 → two warns, one error
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toBe("supabase-retry");
    expect(errorSpy.mock.calls[0][0]).toBe("supabase-retry");
  });
});
