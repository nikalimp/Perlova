import Link from "next/link";
import { Menu, Send, X } from "lucide-react";
import { nav, site } from "@/content/site";
import { Container } from "./container";
import { Button } from "./ui/button";
import { Logo } from "./logo";

// Мобильное меню на <details>: открывается без JavaScript, ссылки — обычные <a>.
function MobileMenu() {
  return (
    <details className="group/m md:hidden">
      <summary aria-label="Открыть меню" className="inline-flex size-11 cursor-pointer list-none items-center justify-center rounded-full hover:bg-secondary [&::-webkit-details-marker]:hidden">
        <Menu className="size-5 group-open/m:hidden" />
        <X className="hidden size-5 group-open/m:block" />
      </summary>
      <div className="absolute inset-x-0 top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b bg-background px-4 pb-6 pt-2 shadow-lg">
        <ul className="border-b py-3">
          {nav.map((n) => (
            <li key={n.href}><a href={n.href} className="block py-2.5 text-[16px]">{n.label}</a></li>
          ))}
        </ul>
        <Button asChild size="lg" className="mt-5 w-full rounded-full"><a href={site.contacts.telegram} target="_blank" rel="noopener">Написать в Telegram</a></Button>
      </div>
    </details>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <Container className="grid h-16 grid-cols-[1fr_auto] items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
        <Logo className="justify-self-start" />
        <nav aria-label="Основное меню" className="hidden items-center justify-center gap-7 text-[15px] text-muted-foreground md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-foreground">{n.label}</Link>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-1">
          <Button asChild size="sm" variant="outline" className="hidden rounded-full sm:inline-flex">
            <a href={site.contacts.telegram} target="_blank" rel="noopener" data-goal="contact_tg"><Send className="size-4" />Telegram</a>
          </Button>
          <MobileMenu />
        </div>
      </Container>
    </header>
  );
}
