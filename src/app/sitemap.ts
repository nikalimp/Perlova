import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { books } from "@/content/books";

export const dynamic = "force-static";

// Новая страница = новая строка здесь. Только индексируемые страницы; lastmod — только реальная дата изменения.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${site.url}/`, priority: 1 },
    { url: `${site.url}/books/`, priority: 0.9 },
    ...books.map((b) => ({ url: `${site.url}/books/${b.slug}/`, priority: 0.8 })),
    { url: `${site.url}/about/`, priority: 0.7 },
    { url: `${site.url}/contacts/`, priority: 0.6 },
  ];
}
