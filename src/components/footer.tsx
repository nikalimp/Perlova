import Link from "next/link";
import { nav, site } from "@/content/site";
import { books } from "@/content/books";
import { Container } from "./container";
import { Logo } from "./logo";

export function Footer() {
  const c = site.contacts;
  return (
    <footer className="border-t py-12 text-sm">
      <Container className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-muted-foreground">{site.tagline}</p>
        </div>
        <div>
          <p className="mb-2 font-medium"><Link href="/books/" className="hover:underline">Книги</Link></p>
          <ul className="space-y-1.5 text-muted-foreground">
            {books.map((b) => (
              <li key={b.slug}><Link href={`/books/${b.slug}/`} className="hover:text-foreground">{b.title}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 font-medium">Разделы и профили</p>
          <ul className="space-y-1.5 text-muted-foreground">
            {nav.slice(1).map((n) => (
              <li key={n.href}><Link href={n.href} className="hover:text-foreground">{n.label}</Link></li>
            ))}
            {site.socials.map((s) => (
              <li key={s.href}><a href={s.href} target="_blank" rel="noopener me" className="hover:text-foreground">{s.label}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 font-medium">Написать автору</p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li><a href={`mailto:${c.email}`} className="hover:text-foreground" data-goal="contact_email">{c.email}</a></li>
            <li><a href={c.telegram} target="_blank" rel="noopener" className="hover:text-foreground" data-goal="contact_tg">Telegram @evgeniaperolva</a></li>
            <li>{c.city}</li>
          </ul>
        </div>
      </Container>
      <Container className="mt-10 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:justify-between">
        <span>© {new Date().getFullYear()} {site.name}. Обложки — © издательства и художники книг.</span>
        <Link href="/privacy-policy/" className="hover:text-foreground">Политика обработки персональных данных</Link>
      </Container>
    </footer>
  );
}
