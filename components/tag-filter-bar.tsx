import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getPopularTags } from "@/lib/tags";
import type { Locale } from "@/i18n/routing";

export async function TagFilterBar({
  locale,
  activeTagSlug,
  extraTag,
  limit = 6,
}: {
  locale: Locale;
  activeTagSlug?: string;
  /** When viewing /tags/<slug> for a tag not in the nav list, show it too. */
  extraTag?: { label: string; slug: string };
  limit?: number;
}) {
  const tList = await getTranslations("list");
  const popular = await getPopularTags(locale, limit);

  const items: Array<{ label: string; href: string; active: boolean }> = [
    {
      label: tList("all"),
      href: `/${locale}/articles`,
      active: !activeTagSlug,
    },
    ...popular.map(({ label, slug }) => ({
      label,
      href: `/${locale}/tags/${slug}`,
      active: activeTagSlug === slug,
    })),
  ];

  if (extraTag && !popular.some((p) => p.slug === extraTag.slug)) {
    items.push({
      label: extraTag.label,
      href: `/${locale}/tags/${extraTag.slug}`,
      active: activeTagSlug === extraTag.slug,
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="filter-pill"
          data-active={item.active ? "true" : undefined}
          aria-current={item.active ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
