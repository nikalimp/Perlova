// llms.txt и llms-full.txt (https://llmstxt.org) — генерируются из того же контента, что и страницы.
import { site } from "@/content/site";
import { books } from "@/content/books";
import { home } from "@/content/home";
import { about } from "@/content/about";

const plain = (s: string) => s.replace(/ /g, " ").replace(/⁠/g, "");
const c = site.contacts;
const ed = (b: (typeof books)[number]) => b.editions.map((e) => `${e.format}, ${e.year}${e.isbn ? `, ISBN ${e.isbn}` : ""}`).join("; ");

export function llmsTxt() {
  return plain(`# ${site.name}

> ${home.answer}

## Книги
${books.map((b) => `- [${b.title}](${site.url}/books/${b.slug}/): ${b.genre}, ${b.age}. ${b.publisher}, ${ed(b)}.`).join("\n")}

## Об авторе
- [Об авторе](${site.url}/about/): ${site.tagline}
- [Контакты](${site.url}/contacts/): встречи с читателями, издание, переводы
- Подробная версия для LLM: ${site.url}/llms-full.txt

## Контакты
- Почта: ${c.email}
- Telegram: ${c.telegram}
- Telegram-канал: ${c.channel}
- Город: ${c.city}
- Сайт: ${site.url}
`);
}

export function llmsFullTxt() {
  const blocks = books.map(
    (b) =>
      `## ${b.title}\nURL: ${site.url}/books/${b.slug}/\nЖанр: ${b.genre}. Возраст: ${b.age}. Издательство: ${b.publisher}${b.series ? `, серия «${b.series}»` : ""}. Издания: ${ed(b)}.${b.illustrator ? ` Иллюстрации: ${b.illustrator}.` : ""}\n\n${b.answer}\n\nАннотация: ${b.annotation}\n\n${b.about.join("\n\n")}${b.awards ? `\n\nНаграды:\n${b.awards.map((a) => `- ${a}`).join("\n")}` : ""}\n\nГде купить:\n${b.buy.map((s) => `- ${s.name}: ${s.href}${s.available ? "" : " (нет в продаже)"}`).join("\n")}\n\nВопросы:\n${b.faq.map((f) => `- ${f.q} ${f.a}`).join("\n")}`,
  );
  return plain(
    `${llmsTxt()}\n---\n\n# Частые вопросы\n\n${home.faq.map((f) => `- ${f.q} ${f.a}`).join("\n")}\n\n---\n\n# Книги\n\n${blocks.join("\n\n")}\n\n---\n\n# Об авторе\n\n${about.answer}\n\n${about.bio.join("\n\n")}\n\nНаграды:\n${about.awards.map((a) => `- ${a.year}: ${a.text}`).join("\n")}\n\nПереводы:\n${about.translations.map((t) => `- ${t}`).join("\n")}\n\nВстречи с читателями:\n${about.meetings.map((m) => `- ${m.date}: ${m.text}`).join("\n")}\n`,
  );
}
