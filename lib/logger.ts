// Thin wrapper around console. Gives us a single place to later plug in
// structured logging without touching every call site. Prod alerts ship to
// Telegram via a sibling bot project that tails stdout, so keep the prefix
// predictable and pass structured context as a single object.

type Level = "info" | "warn" | "error";

export type LogContext = {
  locale?: string;
  path?: string;
  url?: string;
  err?: unknown;
  [key: string]: unknown;
};

function serializeError(e: unknown): unknown {
  if (e instanceof Error) {
    return { name: e.name, message: e.message, stack: e.stack };
  }
  return e;
}

function emit(level: Level, scope: string, message: string, ctx?: LogContext): void {
  const prefix = `[${scope}]`;
  const method = level === "info" ? console.log : level === "warn" ? console.warn : console.error;
  if (!ctx) {
    method(prefix, message);
    return;
  }
  // Spread a shallow copy so we can replace err with a serialized form without
  // mutating the caller's object. Error instances lose fields through
  // console JSON formatting, so unwrap them explicitly.
  const serialized: Record<string, unknown> = { ...ctx };
  if ("err" in serialized) serialized.err = serializeError(serialized.err);
  method(prefix, message, serialized);
}

export const logger = {
  info: (scope: string, message: string, ctx?: LogContext) => emit("info", scope, message, ctx),
  warn: (scope: string, message: string, ctx?: LogContext) => emit("warn", scope, message, ctx),
  error: (scope: string, message: string, ctx?: LogContext) => emit("error", scope, message, ctx),
};
