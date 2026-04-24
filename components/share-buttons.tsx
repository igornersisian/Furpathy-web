"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { logger } from "@/lib/logger";

// How long the "Copied!" confirmation stays visible after a successful copy.
const COPY_FEEDBACK_MS = 2000;

type Props = {
  url: string;
};

export function ShareButtons({ url }: Props) {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    } catch (err) {
      // Leave `copied` false so the button label stays as "Copy link" —
      // don't lie to the user about success.
      logger.warn("share-buttons", "clipboard write failed", { err, url });
    }
  }

  return (
    <div role="group" aria-label={t("label")} className="flex flex-wrap gap-2">
      <button type="button" onClick={onCopy} className="filter-pill" aria-label={t("copyLink")}>
        {copied ? t("copied") : t("copyLink")}
      </button>
    </div>
  );
}
