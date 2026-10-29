import Link from "next/link";
import { home } from "@/content/home";
import { about } from "@/content/about";
import { books, planetBooks } from "@/content/books";
import { Container, Section } from "@/components/container";
import { BookCard, BookCover } from "@/components/book-parts";
import { FaqList } from "@/components/faq";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { Button } from "@/components/ui/button";
import { World } from "@/components/world";
import { bookListSchema, faqSchema, graph } from "@/lib/schema";

// Главная — полёт по планетам книг (spec §5). Весь текст — в HTML; 3D-мир (World) — прогрессивное улучшение поверх.
// data-p — точка маршрута камеры для секции (src/world/main.js). Без мира показываются постеры планет (public/world/).
const P = { kuv: "0.16", dub: "0.39", fan: "0.61", asf: "0.88" } as const;
const SMELLS = [["well", "Колодец Леденец"], ["river", "Речка"], ["milk", "Парное молоко"], ["stone", "Древнее море"]];
const DUB = [["oak", "Дуб"], ["nut", "Орех"], ["sponge", "Мочало"]];
const RAIL = [["planet-kuv", "Кувшинки"], ["planet-dub", "Дуб, орех и мочало"], ["planet-fan", "Цветные запахи лета"], ["planet-asf", "Асфодель"], ["shelf", "Все книги"]];

export default function Home() {
  return (
    <div className="world-page">
      <JsonLd data={graph(bookListSchema(books), faqSchema(home.faq))} />
      <World />
      <p className="world-verse" id="verse" role="status" aria-live="polite" />
      <p className="world-bubble" id="bubble" role="status" aria-live="polite" />

      {/* Маршрут по планетам: видим только с 3D-миром; активная точка — из src/world/main.js */}
      <nav className="world-rail" aria-label="Планеты книг">
        <ol>
          {RAIL.map(([id, label]) => (
            <li key={id}><a href={`#${id}`} data-rail={id}><span className="sr-only">{label}</span><i aria-hidden /><b aria-hidden>{label}</b></a></li>
          ))}
        </ol>
      </nav>

      <div className="world-flow">
        <section className="world-sec intro" data-p="0">
          <div className="world-card">
            <p className="world-eyebrow">{home.eyebrow}</p>
            <h1 className="text-[34px] leading-[1.05] sm:text-5xl">{home.h1}</h1>
            <p className="mt-3 text-[16px] leading-relaxed sm:text-[17px]">{home.answer}</p>
            <p className="world-only world-hint mt-3 text-sm text-muted-foreground">{home.hint} <span aria-hidden>↓</span></p>
          </div>
        </section>

        {planetBooks.map((b, i) => {
          const k = b.planet!;
          const t = home.planets[k];
          return (
            <div key={b.slug}>
              <div className="world-spacer" aria-hidden />
              {k === "asf" && (
                <>
                  <section className="world-sec right" data-p="0.72">
                    <div className="world-card">
                      <p className="world-eyebrow">16+</p>
                      <h2 className="text-2xl sm:text-3xl">{home.gate.title}</h2>
                      <p className="mt-3">{home.gate.text}</p>
                      <Button asChild variant="outline" className="mt-4 rounded-full"><a href="#shelf" id="skip16">{home.gate.skip}</a></Button>
                    </div>
                  </section>
                  <div className="world-spacer" aria-hidden />
                </>
              )}
              <section className={`world-sec ${i % 2 ? "right" : ""}`} data-p={P[k]} data-planet={k} id={`planet-${k}`}>
                <div className="world-card planet" style={{ ["--planet" as string]: t.color }}>
                  <img className="world-poster" src={`/world/${k}.webp`} srcSet={`/world/${k}.webp 720w, /world/${k}@2x.webp 1440w`} sizes="(min-width: 640px) 560px, 100vw" alt={`Планета книги «${b.title}»`} loading="lazy" width={720} height={450} />
                  <div className="flex gap-4">
                    <div className="card-cover w-14 shrink-0 sm:w-16"><BookCover b={b} /></div>
                    <div className="min-w-0">
                      {b.awards && <p className="mb-1.5 inline-block rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">Финал премии им. В. П. Крапивина</p>}
                      <p className="world-eyebrow">{b.genre} · {b.age}</p>
                      <h2 className="text-[22px] leading-tight sm:text-3xl">{b.title}</h2>
                    </div>
                  </div>
                  <p className="card-quote mt-3 font-serif italic">«{t.quote}»</p>
                  <p className="card-lead mt-2">{t.lead}</p>

                  {k === "kuv" && (
                    <div className="world-only mt-3">
                      <button type="button" className="world-chip" id="lilyBtn" aria-pressed="false">{t.action}</button>
                      <p className="verse-inline mt-2 font-serif italic" id="verseInline" aria-hidden />
                    </div>
                  )}
                  {k === "dub" && (
                    <div className="world-only mt-3">
                      <p className="mb-2 text-sm">{t.action}</p>
                      <div className="chips">{DUB.map(([id, l]) => <button key={id} type="button" className="world-chip" data-dub={id}>{l}</button>)}</div>
                    </div>
                  )}
                  {k === "fan" && (
                    <div className="world-only mt-3">
                      <p className="mb-2 text-sm">{t.action}</p>
                      <div className="chips">{SMELLS.map(([id, l]) => <button key={id} type="button" className="world-chip" data-smell={id}>{l}</button>)}</div>
                    </div>
                  )}
                  {k === "asf" && (
                    <p className="world-only mt-3"><span className="font-serif text-2xl" id="steps">0</span> / 300 {t.action}</p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild className="rounded-full"><Link href={`/books/${b.slug}/`}>О книге</Link></Button>
                    <Button asChild variant="outline" className="rounded-full"><Link href={`/books/${b.slug}/#buy`}>{t.buy}</Link></Button>
                  </div>
                </div>
              </section>
            </div>
          );
        })}

        <div className="world-spacer" aria-hidden />
        <section className="world-sec" data-p="1" id="shelf">
          <div className="world-card wide">
            <p className="world-eyebrow">Книжная полка</p>
            <h2 className="text-3xl">{home.shelf.title}</h2>
            <p className="mt-2">{home.shelf.text}</p>
            <div className="shelf mt-5 grid grid-cols-3 gap-4 sm:grid-cols-6">{books.map((b) => <BookCard key={b.slug} b={b} />)}</div>
          </div>
        </section>
      </div>

      <div className="relative z-10 bg-background">
        <Section>
          <Container className="max-w-3xl">
            <h2 className="text-3xl tracking-tight">Об авторе</h2>
            <p className="mt-4 text-[17px] leading-relaxed">{home.aboutShort}</p>
            <figure className="mt-6 border-l-2 border-accent pl-4">
              <blockquote className="font-serif text-[19px] italic">«{home.aboutQuote.text}»</blockquote>
              <figcaption className="mt-1 text-sm text-muted-foreground">{home.aboutQuote.source}</figcaption>
            </figure>
            <ul className="mt-6 space-y-2">
              {about.awards.slice(0, 3).map((a) => <li key={a.text} className="flex gap-3"><span className="w-12 shrink-0 tabular-nums text-muted-foreground">{a.year}</span><span>{a.text}</span></li>)}
            </ul>
            <Button asChild variant="outline" className="mt-6 rounded-full"><Link href="/about/">Подробнее об авторе</Link></Button>
          </Container>
        </Section>

        <Section className="border-t bg-card">
          <Container className="max-w-3xl">
            <h2 className="mb-6 text-3xl tracking-tight">Что говорят о книгах</h2>
            <div className="space-y-7">
              {[
                { text: "[…] И главный из них — научиться мечтать так, чтобы все сбывалось. И никогда не упускать самое важное слово: любовь.", who: "Ася Кравченко, детский писатель", book: "Дуб, орех и мочало", src: "отзыв для издания, сокращено" },
                ...books.find((b) => b.slug === "dub-orekh-i-mochalo")!.reviews.slice(1, 2).map((r) => ({ text: r.text, who: `${r.author}${r.role ? `, ${r.role}` : ""}`, book: "Дуб, орех и мочало", src: r.source })),
                ...books.find((b) => b.slug === "tsvetnye-zapakhi-leta")!.reviews.map((r) => ({ text: r.text, who: r.author, book: "Цветные запахи лета и немного фанданго", src: r.source })),
                ...books.find((b) => b.slug === "day-mne-ruku")!.reviews.slice(0, 1).map((r) => ({ text: r.text, who: r.author, book: "Дай мне руку", src: r.source })),
              ].map((r) => (
                <figure key={r.who}>
                  <blockquote className="font-serif text-[18px] italic leading-relaxed">«{r.text}»</blockquote>
                  <figcaption className="mt-2 text-sm text-muted-foreground">— {r.who}, о книге «{r.book}» · {r.src}</figcaption>
                </figure>
              ))}
            </div>
          </Container>
        </Section>

        <Section className="border-t">
          <Container className="max-w-3xl">
            <h2 className="mb-6 text-3xl tracking-tight">Частые вопросы</h2>
            <FaqList items={home.faq} />
          </Container>
        </Section>
        <Cta />
      </div>
    </div>
  );
}
