import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

// On-demand revalidation endpoint. Call from a Supabase webhook (or manually)
// after publishing/editing an article to refresh ISR caches without waiting
// for the 600s page-level revalidate to expire.
//
// Configure REVALIDATE_SECRET and POST with `Authorization: Bearer <secret>`.

// Reject bodies larger than this. Supabase webhook envelopes are a few KB; a
// 64 KB cap is generous while still closing the door on accidental large posts.
const MAX_BODY_BYTES = 64 * 1024;

// Loose shape of the Supabase webhook payload. We don't act on it yet — the
// endpoint always revalidates the full locale matrix — but logging unexpected
// shapes helps detect a misconfigured webhook.
type WebhookPayload = {
  type?: string;
  table?: string;
  record?: Record<string, unknown>;
  old_record?: Record<string, unknown>;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Constant-time compare. Different-length inputs short-circuit to false — the
// length of a valid secret is fixed server-side, so length leakage doesn't
// meaningfully help an attacker guess it.
function secretsEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

async function parseBody(
  req: NextRequest,
): Promise<
  | { kind: "empty" }
  | { kind: "ok"; payload: WebhookPayload }
  | { kind: "error"; reason: "too_large" | "not_json" | "invalid_json" | "wrong_shape" }
> {
  const lengthHeader = req.headers.get("content-length");
  if (lengthHeader && Number(lengthHeader) > MAX_BODY_BYTES) {
    return { kind: "error", reason: "too_large" };
  }
  const raw = await req.text();
  if (raw.length === 0) return { kind: "empty" };
  if (raw.length > MAX_BODY_BYTES) return { kind: "error", reason: "too_large" };
  const ct = (req.headers.get("content-type") ?? "").toLowerCase();
  if (!ct.includes("json")) return { kind: "error", reason: "not_json" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { kind: "error", reason: "invalid_json" };
  }
  if (!isObject(parsed)) return { kind: "error", reason: "wrong_shape" };
  return { kind: "ok", payload: parsed as WebhookPayload };
}

export async function POST(req: NextRequest) {
  const secret = env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!secretsEqual(token, secret)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const body = await parseBody(req);
  if (body.kind === "error") {
    logger.warn("revalidate", `rejected body: ${body.reason}`);
    const status = body.reason === "too_large" ? 413 : 400;
    return NextResponse.json({ ok: false, reason: body.reason }, { status });
  }
  if (body.kind === "ok") {
    logger.info(
      "revalidate",
      `accepted webhook: type=${body.payload.type ?? "?"} table=${body.payload.table ?? "?"}`,
    );
  }

  const failures: { path: string; error: string }[] = [];
  function safeRevalidate(path: string, type?: "page") {
    try {
      if (type) revalidatePath(path, type);
      else revalidatePath(path);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      failures.push({ path, error: detail });
      logger.error("revalidate", "revalidatePath failed", { err, path });
    }
  }

  for (const locale of routing.locales) {
    safeRevalidate(`/${locale}`);
    safeRevalidate(`/${locale}/articles`);
    safeRevalidate(`/${locale}/articles/[slug]`, "page");
    safeRevalidate(`/${locale}/tags/[tag]`, "page");
    safeRevalidate(`/${locale}/rss.xml`);
  }
  safeRevalidate("/sitemap.xml");

  if (failures.length > 0) {
    return NextResponse.json({ ok: false, revalidated: false, failures }, { status: 500 });
  }
  return NextResponse.json({ ok: true, revalidated: true });
}
