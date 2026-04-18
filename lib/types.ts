import type { Locale } from "@/i18n/routing";

export type ArticleRow = {
  id: string;
  slug: string;
  title: string | null;
  meta_description: string | null;
  tags: string[] | null;
  content_en: string | null;

  title_es: string | null;
  slug_es: string | null;
  meta_description_es: string | null;
  tags_es: string[] | null;
  content_es: string | null;

  title_de: string | null;
  slug_de: string | null;
  meta_description_de: string | null;
  tags_de: string[] | null;
  content_de: string | null;

  title_pt: string | null;
  slug_pt: string | null;
  meta_description_pt: string | null;
  tags_pt: string[] | null;
  content_pt: string | null;

  image_url: string | null;
  status: string;
  medium_url: string | null;
  created_at: string;
  published_at: string | null;
};

export type Article = {
  id: string;
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  content: string;
  image: string | null;
  publishedAt: string | null;
  createdAt: string;
  mediumUrl: string | null;
  readingTimeMin: number;
};

export type ArticleCard = Omit<Article, "content">;
