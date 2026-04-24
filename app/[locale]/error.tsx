"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { logger } from "@/lib/logger";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    logger.error("locale-error", error.digest ?? "render failed", { err: error });
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col items-start gap-5 px-5 py-20 md:py-28">
      <p className="mono-label-wide">§ Error</p>
      <h1 className="font-display text-[40px] leading-[1.04] font-medium tracking-[-0.015em] md:text-[56px]">
        {t("title")}
      </h1>
      <p className="max-w-[520px] text-[18px] leading-relaxed text-[color:var(--muted)]">
        {t("description")}
      </p>
      <button type="button" onClick={() => reset()} className="pill-accent">
        {t("retry")}
      </button>
    </div>
  );
}
