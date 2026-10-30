import Link from "next/link";
import { nav } from "@/content/site";
import { books } from "@/content/books";

// Виджетов на экране нет (spec v0.4): навигация — таблички в мире.
// Это меню видно только при переходе с клавиатуры (Tab) и для экранных читалок — без него сайт не пройти без мыши.
export function KeyNav() {
  return (
    <nav aria-label="Меню" className="keynav">
      <ul>
        <li><Link href="/">Главная</Link></li>
        {nav.filter((n) => n.href !== "/").map((n) => <li key={n.href}><Link href={n.href}>{n.label}</Link></li>)}
        {books.map((b) => <li key={b.slug}><Link href={`/books/${b.slug}/`}>{b.title}</Link></li>)}
      </ul>
    </nav>
  );
}
