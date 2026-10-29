import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { bookBySlug, books } from "@/content/books";
import { site } from "@/content/site";
import { Container, Eyebrow, Section } from "@/components/container";
import { Crumbs } from "@/components/crumbs";
import { Cta } from "@/components/cta";
import { FaqList } from "@/components/faq";
import { BookCard, BookCover, BuyLinks } from "@/components/book-parts";
import { JsonLd } from "@/components/json-ld";
import { Panel } from "@/components/panel";
import { bookSchema, breadcrumbs, faqSchema, graph } from "@/lib/schema";

export function generateStaticParams() {
  return books.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const b = bookBySlug((await params).slug);
  if (!b) return {};
  const og = b.cover ? b.cover.replace(".webp", "@2x.webp") : "/og.png";
  return {
    title: b.metaTitle,
    description: b.metaDescription,
    alternates: { canonical: `/books/${b.slug}/` },
    openGraph: { type: "book", title: b.metaTitle, description: b.metaDescription, url: `${site.url}/books/${b.slug}/`, images: [og] },
  };
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const b = bookBySlug((await params).slug);
  if (!b) notFound();
  const path = `/books/${b.slug}/`;
  const related = b.related.map(bookBySlug).filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <Panel view={b.planet ?? "shelf"} back={b.planet ? `/#planet-${b.planet}` : "/#home"}>
      <JsonLd data={graph(bookSchema(b), breadcrumbs([{ name: "Главная", path: "/" }, { name: "Книги", path: "/books/" }, { name: b.title, path }]), b.faq.length > 0 && faqSchema(b.faq))} />

      <Section className="pt-10">
        <Container>
          <Crumbs items={[{ name: "Главная", path: "/" }, { name: "Книги", path: "/books/" }, { name: b.title }]} />
          <div className="grid gap-10 @2xl:grid-cols-[minmax(0,1fr)_300px] @2xl:gap-14">
            <div>
              <p className="text-sm uppercase tracking-wider text-muted-foreground">{b.genre} · {b.age}</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-balance @md:text-[44px]">{b.h1}</h1>
              {b.awards && <p className="mt-4 inline-block rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground">{b.awards[0]}</p>}
              <p className="mt-5 text-lg leading-relaxed">{b.answer}</p>
              {b.warning && <p className="mt-4 rounded-xl border border-accent/40 bg-card p-4 text-[15px]">{b.warning}</p>}
              <div className="mt-7 scroll-mt-24" id="buy">
                <h2 className="mb-3 text-lg font-semibold">Где купить</h2>
                <BuyLinks b={b} />
              </div>
            </div>
            <div className="order-first max-w-[260px] @2xl:order-none @2xl:max-w-none">
              <BookCover b={b} priority />
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-t bg-card">
        <Container className="max-w-3xl">
          <h2 className="mb-5 text-2xl font-semibold tracking-tight">О книге</h2>
          <div className="space-y-4 text-[17px] leading-relaxed">{b.about.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}</div>
          <h3 className="mt-10 text-lg font-semibold">Аннотация издательства</h3>
          <blockquote className="mt-3 border-l-2 border-accent pl-4 text-muted-foreground">{b.annotation}</blockquote>
        </Container>
      </Section>

      <Section className="border-t">
        <Container className="max-w-3xl">
          <div className="grid gap-10 @md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-2xl font-semibold tracking-tight">Герои</h2>
              <ul className="space-y-3">{b.characters.map((c) => <li key={c.name}><b className="font-semibold">{c.name}</b> — {c.text}</li>)}</ul>
            </div>
            <div>
              <h2 className="mb-4 text-2xl font-semibold tracking-tight">Мир книги</h2>
              {b.planet && (
                <figure className="mb-4">
                  <img src={`/world/${b.planet}.webp`} srcSet={`/world/${b.planet}.webp 720w, /world/${b.planet}@2x.webp 1440w`} sizes="(min-width: 640px) 360px, 100vw" alt={`Планета книги «${b.title}» из 3D-мира на главной`} loading="lazy" width={720} height={450} className="aspect-[16/10] w-full rounded-xl object-cover" />
                  <figcaption className="mt-2 text-sm text-muted-foreground"><a href={`/#planet-${b.planet}`} className="underline underline-offset-4">Облететь планету на главной</a></figcaption>
                </figure>
              )}
              <p>{b.world}</p>
              <h3 className="mt-6 font-semibold">Коротко о книге</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">{b.facts.map((f) => <li key={f}>{f}</li>)}</ul>
            </div>
          </div>
        </Container>
      </Section>

      {b.reviews.length > 0 && (
        <Section className="border-t bg-card">
          <Container className="max-w-3xl">
            <h2 className="mb-6 text-2xl font-semibold tracking-tight">Отзывы</h2>
            <div className="space-y-6">
              {b.reviews.map((r) => (
                <figure key={r.author}>
                  <blockquote className="font-serif text-[18px] italic leading-relaxed">«{r.text}»</blockquote>
                  <figcaption className="mt-2 text-sm text-muted-foreground">
                    — {r.author}{r.role && `, ${r.role}`} · {r.href ? <a href={r.href} target="_blank" rel="noopener" className="underline underline-offset-4">{r.source}</a> : r.source}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <Section className="border-t">
        <Container className="max-w-3xl">
          <h2 className="mb-4 text-2xl font-semibold tracking-tight">Издания</h2>
          <table className="w-full text-left text-[15px]">
            <tbody className="divide-y border-y">
              {b.editions.map((e) => (
                <tr key={e.format + e.year}>
                  <th scope="row" className="py-3 pr-4 font-medium capitalize">{e.format}, {e.year}</th>
                  <td className="py-3 text-muted-foreground">{[b.publisher, b.series && `серия «${b.series}»`, e.pages && `${e.pages} с.`, e.isbn && `ISBN ${e.isbn}`, e.note].filter(Boolean).join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {b.illustrator && <p className="mt-3 text-sm text-muted-foreground">Иллюстрации: {b.illustrator}</p>}
        </Container>
      </Section>

      {b.faq.length > 0 && (
        <Section className="border-t bg-card">
          <Container className="max-w-3xl">
            <h2 className="mb-6 text-2xl font-semibold tracking-tight">Частые вопросы</h2>
            <FaqList items={b.faq} />
          </Container>
        </Section>
      )}

      {related.length > 0 && (
        <Section className="border-t">
          <Container>
            <Eyebrow>Ещё книги</Eyebrow>
            <div className="mt-4 grid grid-cols-2 gap-6 @md:grid-cols-4">{related.map((r) => <BookCard key={r.slug} b={r} />)}</div>
          </Container>
        </Section>
      )}

      <Cta />
    </Panel>
  );
}
