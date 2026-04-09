"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col items-start gap-6 px-5 py-20 md:py-28">
      <h1 className="font-display text-4xl font-semibold md:text-5xl">{t("title")}</h1>
      <p className="text-lg leading-relaxed text-[color:var(--muted)]">{t("description")}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-2 rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
      >
        {t("retry")}
      </button>
    </div>
  );
}
