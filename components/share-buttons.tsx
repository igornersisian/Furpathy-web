"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  url: string;
  title: string;
};

export function ShareButtons({ url }: Props) {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore clipboard failure */
    }
  }

  const pillClass =
    "inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium text-[color:var(--muted)] transition hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--foreground)]";

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="flex flex-wrap items-center justify-center gap-2"
    >
      <button type="button" onClick={onCopy} className={pillClass} aria-label={t("copyLink")}>
        {copied ? t("copied") : t("copyLink")}
      </button>
    </div>
  );
}
