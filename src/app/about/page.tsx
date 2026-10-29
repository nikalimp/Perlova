import type { Metadata } from "next";
import { about } from "@/content/about";
import { books } from "@/content/books";
import { site } from "@/content/site";
import { Container, Section } from "@/components/container";
import { BookCard } from "@/components/book-parts";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { graph, personId } from "@/lib/schema";

export const metadata: Metadata = {
  title: { absolute: about.metaTitle },
  description: about.metaDescription,
  alternates: { canonical: "/about/" },
};

export default function About() {
  return (
    <>
      <JsonLd data={graph({ "@type": "ProfilePage", url: `${site.url}/about/`, mainEntity: { "@id": personId } })} />
      <Section className="pt-12">
        <Container className="grid gap-10 md:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[44px]">{about.h1}</h1>
            <p className="mt-5 text-lg leading-relaxed">{about.answer}</p>
            <div className="mt-6 space-y-4 text-[17px] leading-relaxed">{about.bio.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}</div>
          </div>
          {/* Фото автора на сайте нет — знак-жемчужина в стиле айдентики (decisions.md) */}
          <div className="order-first flex justify-center md:order-none md:items-start">
            <img src="/brand/sign.svg" alt="" width={200} height={200} className="size-40 md:size-52" />
          </div>
        </Container>
      </Section>

      <Section className="border-t bg-card">
        <Container className="max-w-3xl">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">Награды и премии</h2>
          <table className="w-full text-left text-[15px]">
            <tbody className="divide-y border-y">
              {about.awards.map((a) => (
                <tr key={a.text}><th scope="row" className="w-20 py-3 pr-4 align-top font-medium tabular-nums">{a.year}</th><td className="py-3">{a.text}</td></tr>
              ))}
            </tbody>
          </table>
        </Container>
      </Section>

      <Section className="border-t">
        <Container>
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">Книги</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">{books.map((b) => <BookCard key={b.slug} b={b} />)}</div>
          <h3 className="mt-10 text-lg font-semibold">Другие книги и публикации</h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">{about.otherBooks.map((x) => <li key={x}>{x}</li>)}</ul>
          <h3 className="mt-8 text-lg font-semibold">Переводы</h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">{about.translations.map((x) => <li key={x}>{x}</li>)}</ul>
        </Container>
      </Section>

      <Section className="border-t bg-card">
        <Container className="max-w-3xl">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight">Встречи с читателями</h2>
          <p className="mb-6 text-muted-foreground">{about.invite}</p>
          <ul className="divide-y border-y">
            {about.meetings.map((m) => (
              <li key={m.text} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]"><span className="text-sm text-muted-foreground">{m.date}</span><span>{m.text}</span></li>
            ))}
          </ul>
        </Container>
      </Section>
      <Cta title="Пригласить Евгению Перлову на встречу" />
    </>
  );
}
