import Link from "next/link";
import { Menu, Send, X } from "lucide-react";
import { nav, site } from "@/content/site";
import { books } from "@/content/books";

// Парящие виджеты вместо шапки и подвала (spec v0.3). Меню на телефоне — нативный popover, без JavaScript.
export function TopBar() {
  const [first, ...rest] = site.name.split(" ");
  return (
    <header className="topbar">
      <Link href="/" className="widget pill brand" aria-label={`${site.name} — на главную`}>
        <img src="/brand/sign.svg" alt="" width={30} height={30} className="size-[30px]" />
        <span className="font-serif text-[18px] font-semibold leading-none tracking-tight">{first} <i className="font-medium">{rest.join(" ")}</i></span>
      </Link>
      <nav aria-label="Основное меню" className="widget pill menu-desktop">
        {nav.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
        <a href={site.contacts.telegram} target="_blank" rel="noopener" data-goal="contact_tg" className="tg"><Send className="size-4" aria-hidden />Telegram</a>
      </nav>
      <button type="button" popoverTarget="site-menu" className="widget pill menu-button" aria-label="Открыть меню"><Menu className="size-5" aria-hidden /></button>
      <div popover="auto" id="site-menu" className="pop pop-menu">
        <button type="button" popoverTarget="site-menu" popoverTargetAction="hide" className="pop-close" aria-label="Закрыть меню"><X className="size-5" aria-hidden /></button>
        <nav aria-label="Меню">
          <ul className="space-y-1 text-[17px]">
            {nav.map((n) => <li key={n.href}><a href={n.href} className="block py-2">{n.label}</a></li>)}
          </ul>
          <p className="mt-5 mb-1 text-sm text-muted-foreground">Книги</p>
          <ul className="space-y-1 text-[15px]">
            {books.map((b) => <li key={b.slug}><a href={`/books/${b.slug}/`} className="block py-1.5">{b.title}</a></li>)}
          </ul>
          <a href={site.contacts.telegram} target="_blank" rel="noopener" data-goal="contact_tg" className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-primary-foreground"><Send className="size-4" aria-hidden />Написать в Telegram</a>
          <p className="mt-5 text-xs text-muted-foreground"><a href="/privacy-policy/" className="underline underline-offset-4">Политика обработки персональных данных</a></p>
        </nav>
      </div>
    </header>
  );
}

export function FootWidget() {
  return (
    <footer className="foot widget">
      <span>© {new Date().getFullYear()} {site.name} · обложки © издательства и художники</span>
      <Link href="/privacy-policy/">Политика ПДн</Link>
    </footer>
  );
}
