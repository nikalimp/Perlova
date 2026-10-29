// JSON-LD по стандарту AI-Ready сайта, §5. Один @graph на страницу, сущности связаны через @id.
// Сайт автора: главная сущность — Person; книги — Book с изданиями, без Offer и цен.
import { site } from "@/content/site";
import { about } from "@/content/about";
import type { Book, Faq } from "@/content/books";

export const websiteId = `${site.url}/#website`;
export const personId = `${site.url}/#person`;
export const orgId = personId; // совместимость со стартером: «издатель сайта» — автор

export const personSchema: Record<string, unknown> = {
  "@type": "Person",
  "@id": personId,
  name: site.person.name,
  jobTitle: site.person.jobTitle,
  description: site.person.description,
  url: `${site.url}/about/`,
  image: `${site.url}/brand/sign.svg`,
  email: `mailto:${site.contacts.email}`,
  address: { "@type": "PostalAddress", addressLocality: site.contacts.city, addressCountry: "RU" },
  knowsLanguage: ["ru", "en", "de", "fr"],
  award: about.awards.map((a) => `${a.text} (${a.year})`),
  sameAs: site.sameAs,
};
export const orgSchema = personSchema;

export const websiteSchema = { "@type": "WebSite", "@id": websiteId, url: site.url, name: site.name, inLanguage: "ru-RU", publisher: { "@id": personId }, about: { "@id": personId } };

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${site.url}${it.path}` })),
  };
}

export function faqSchema(faq: Faq[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

const FORMAT: Record<string, string> = { печатная: "https://schema.org/Hardcover", электронная: "https://schema.org/EBook", аудио: "https://schema.org/AudiobookFormat" };

export function bookSchema(b: Book) {
  const url = `${site.url}/books/${b.slug}/`;
  return {
    "@type": "Book",
    "@id": `${url}#book`,
    name: b.title,
    url,
    author: { "@id": personId },
    description: b.answer,
    genre: b.genre,
    inLanguage: "ru",
    typicalAgeRange: b.ageRange,
    ...(b.cover && { image: `${site.url}${b.cover}` }),
    ...(b.illustrator && { illustrator: { "@type": "Person", name: b.illustrator } }),
    ...(b.awards && { award: b.awards }),
    sameAs: b.buy.map((s) => s.href),
    workExample: b.editions.map((e) => ({
      "@type": "Book",
      bookFormat: FORMAT[e.format],
      datePublished: String(e.year),
      ...(e.isbn && { isbn: e.isbn }),
      ...(e.pages && { numberOfPages: e.pages }),
      publisher: { "@type": "Organization", name: b.publisher },
    })),
    // Отзывы — только видимые на странице, без рейтингов (стандарт §5)
    ...(b.reviews.length > 0 && {
      review: b.reviews.map((r) => ({ "@type": "Review", reviewBody: r.text, author: { "@type": "Person", name: r.author } })),
    }),
  };
}

export function bookListSchema(list: Book[]) {
  return {
    "@type": "ItemList",
    name: "Книги Евгении Перловой",
    itemListElement: list.map((b, i) => ({ "@type": "ListItem", position: i + 1, url: `${site.url}/books/${b.slug}/`, name: b.title })),
  };
}

export function articleSchema(p: { slug: string; title: string; description: string; date: string; updated?: string }) {
  return {
    "@type": "BlogPosting",
    headline: p.title,
    description: p.description,
    url: `${site.url}/blog/${p.slug}/`,
    datePublished: p.date,
    dateModified: p.updated ?? p.date,
    inLanguage: "ru-RU",
    author: { "@id": personId },
    publisher: { "@id": personId },
    mainEntityOfPage: `${site.url}/blog/${p.slug}/`,
  };
}

export function graph(...nodes: (Record<string, unknown> | null | false | undefined)[]) {
  return { "@context": "https://schema.org", "@graph": nodes.filter(Boolean) };
}

// Услуги стартера — выключены флагом site.features.services; функция оставлена для совместимости
export function serviceSchema(s: { slug: string; title: string; h1: string; answer: string }) {
  return { "@type": "Service", name: s.title, serviceType: s.h1, description: s.answer, url: `${site.url}/services/${s.slug}/`, provider: { "@id": personId } };
}
