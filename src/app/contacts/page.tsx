import type { Metadata } from "next";
import { Panel } from "@/components/panel";
import { site } from "@/content/site";
import { about } from "@/content/about";
import { Container, Section } from "@/components/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";
import { graph, personId } from "@/lib/schema";

export const metadata: Metadata = {
  title: { absolute: "Связаться с Евгенией Перловой: встречи, издание, переводы" },
  description:
    "Как связаться с писателем Евгенией Перловой: почта и Telegram для приглашений на встречи в школах и библиотеках, вопросов об издании книг и переводах.",
  alternates: { canonical: "/contacts/" },
};

export default function Contacts() {
  const c = site.contacts;
  const rows = [
    { label: "Почта", value: c.email, href: `mailto:${c.email}`, goal: "contact_email" },
    { label: "Telegram", value: "@evgeniaperolva", href: c.telegram, goal: "contact_tg" },
    { label: "Telegram-канал", value: "@perlovaevgenia — новости и встречи", href: c.channel, goal: "contact_channel" },
    { label: "Город", value: c.city },
  ];
  return (
    <Panel view="home" back="/#home">
    <>
      <JsonLd data={graph({ "@type": "ContactPage", url: `${site.url}/contacts/`, about: { "@id": personId } })} />
      <Section className="pt-12">
        <Container className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-balance @md:text-[44px]">Связаться с Евгенией Перловой</h1>
          <p className="mt-5 text-lg leading-relaxed">
            Пишите на {c.email} или в Telegram @evgeniaperolva — по приглашениям на встречи, вопросам издания книг и переводов. Новости о книгах и встречах — в Telegram-канале @perlovaevgenia.
          </p>
          <dl className="mt-8 divide-y border-y">
            {rows.map((r) => (
              <div key={r.label} className="grid gap-1 py-4 @md:grid-cols-[10rem_1fr]">
                <dt className="text-muted-foreground">{r.label}</dt>
                <dd>{r.href ? <a href={r.href} className="underline underline-offset-4" data-goal={r.goal} {...(r.href.startsWith("http") && { target: "_blank", rel: "noopener" })}>{r.value}</a> : r.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full"><a href={`mailto:${c.email}`} data-goal="contact_email">Написать на почту</a></Button>
            <Button asChild size="lg" variant="outline" className="rounded-full"><a href={c.telegram} target="_blank" rel="noopener" data-goal="contact_tg">Написать в Telegram</a></Button>
          </div>
          <h2 className="mt-14 text-2xl font-semibold tracking-tight">О чём можно написать</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li><b className="font-semibold">Встреча с читателями.</b> {about.invite}</li>
            <li><b className="font-semibold">Издание и рукописи.</b> Вопросы издательств о книгах, переизданиях и новых рукописях.</li>
            <li><b className="font-semibold">Переводы.</b> Евгения Перлова переводит детские книги с английского, немецкого и французского.</li>
            <li><b className="font-semibold">Фестивали и конкурсы.</b> Приглашения на литературные фестивали, в жюри и на семинары.</li>
          </ul>
          <p className="mt-6 text-muted-foreground">
            Если вы хотите купить книгу, ссылки на магазины есть на странице каждой книги в разделе <a href="/books/" className="underline underline-offset-4">«Книги»</a>. Автор не продаёт книги сам и не собирает на сайте персональные данные: на сайте нет форм.
          </p>
        </Container>
      </Section>
    </>
    </Panel>
  );
}
