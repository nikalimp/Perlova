"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { nav } from "@/content/site";
import { books, planetBooks } from "@/content/books";

// Бургер-меню (spec v0.11, по совету дизайнера): кнопка справа сверху, меню — лист бумаги от руки.
// Заменяет скрытое меню для клавиатуры: доступно и мышью, и с клавиатуры, и экранным читалкам.
const PLANET_NAME: Record<string, string> = { kuv: "Кувшинки", dub: "Дуб, орех и мочало", fan: "Цветные запахи лета", asf: "Асфодель" };

export function BurgerMenu() {
  const close = () => document.getElementById("site-menu")?.hidePopover?.();
  return (
    <>
      <button type="button" className="burger" popoverTarget="site-menu" aria-label="Меню" title="Меню"><Menu aria-hidden /></button>
      <nav popover="auto" id="site-menu" className="pop pop-menu" aria-label="Меню сайта" onClick={(e) => { if ((e.target as HTMLElement).closest("a")) close(); }}>
        <button type="button" popoverTarget="site-menu" popoverTargetAction="hide" className="pop-close" aria-label="Закрыть меню"><X aria-hidden /></button>
        <p className="menu-h">Путешествие</p>
        <ul>
          <li><Link href="/#intro">Начало</Link></li>
          {planetBooks.map((b) => <li key={b.slug}><Link href={`/#planet-${b.planet}`}>{PLANET_NAME[b.planet!] ?? b.title}</Link></li>)}
          <li><Link href="/#home">Дом автора</Link></li>
        </ul>
        <p className="menu-h">Страницы</p>
        <ul>
          {nav.map((n) => <li key={n.href}><Link href={n.href}>{n.label}</Link></li>)}
        </ul>
        <p className="menu-h">Книги</p>
        <ul className="menu-books">
          {books.map((b) => <li key={b.slug}><Link href={`/books/${b.slug}/`}>{b.title}</Link></li>)}
        </ul>
      </nav>
    </>
  );
}
