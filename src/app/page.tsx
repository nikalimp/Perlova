import Link from "next/link";
import { home, say } from "@/content/home";
import { about } from "@/content/about";
import { books, planetBooks, type Planet } from "@/content/books";
import { FaqList } from "@/components/faq";
import { MusicButton } from "@/components/music";
import { JsonLd } from "@/components/json-ld";
import { bookListSchema, faqSchema, graph } from "@/lib/schema";
import { site } from "@/content/site";

// Главная — полёт по пространству (spec v0.3). Секций как блоков страницы нет: всё содержание — таблички в мире и попапы.
// .world-sec[data-p] задают только длину скролла и точки маршрута камеры (src/world/main.js).
// [data-anchor] — табличка, которую мир держит над своим 3D-объектом (src/world/heroes.js, home.js).
// Без 3D-мира (нет WebGL, «уменьшить движение») те же элементы — обычная страница с постерами планет.
const P: Record<Planet, string> = { kuv: "0.16", dub: "0.39", fan: "0.61", asf: "0.88" };
// Какие герои книги стоят в мире: [индекс в books.characters, якорь фигурки]
const HEROES: Record<Planet, [number, string][]> = {
  kuv: [[0, "kuv.hero.0"], [2, "kuv.hero.1"], [1, "kuv.hero.2"]],
  dub: [[0, "dub.hero.0"], [1, "dub.hero.1"], [2, "dub.hero.2"], [3, "dub.hero.3"]],
  fan: [[0, "fan.hero.0"], [1, "fan.hero.1"], [2, "fan.hero.2"], [3, "fan.hero.3"]],
  asf: [[0, "asf.hero.0"], [1, "asf.hero.1"], [2, "asf.hero.2"]],
};
const shortName = (n: string) => n.replace(/\s*\(.*\)/, "");
// Подсказки у сюрпризов (spec v0.7): ярлык над предметом, нажатие — то же, что клик по предмету в 3D (src/world/main.js, onClick)
const ACTS: Partial<Record<Planet, { id: string; label: string; attr: Record<string, string> }[]>> = {
  kuv: [{ id: "lily", label: "Кувшинка", attr: { id: "lilyBtn", "aria-pressed": "false" } }],
  dub: [{ id: "oak", label: "Дуб", attr: { "data-dub": "oak" } }, { id: "nut", label: "Орех", attr: { "data-dub": "nut" } }, { id: "sponge", label: "Мочало", attr: { "data-dub": "sponge" } }],
  fan: [
    { id: "well", label: "Колодец", attr: { "data-smell": "well" } }, { id: "river", label: "Речка", attr: { "data-smell": "river" } },
    { id: "milk", label: "Парное молоко", attr: { "data-smell": "milk" } }, { id: "stone", label: "Камень", attr: { "data-smell": "stone" } },
    { id: "fan", label: "Пантонный веер", attr: { "data-smell": "fan" } },
  ],
};

const reviews = [
  { text: "[…] И главный из них — научиться мечтать так, чтобы все сбывалось. И никогда не упускать самое важное слово: любовь.", who: "Ася Кравченко, детский писатель", book: "Дуб, орех и мочало", src: "отзыв для издания, сокращено" },
  ...books.find((b) => b.slug === "dub-orekh-i-mochalo")!.reviews.slice(1, 2).map((r) => ({ text: r.text, who: `${r.author}${r.role ? `, ${r.role}` : ""}`, book: "Дуб, орех и мочало", src: r.source })),
  ...books.find((b) => b.slug === "tsvetnye-zapakhi-leta")!.reviews.map((r) => ({ text: r.text, who: r.author, book: "Цветные запахи лета и немного фанданго", src: r.source })),
  ...books.find((b) => b.slug === "day-mne-ruku")!.reviews.slice(0, 1).map((r) => ({ text: r.text, who: r.author, book: "Дай мне руку", src: r.source })),
];

export default function Home() {
  return (
    <div className="world-page">
      <JsonLd data={graph(bookListSchema(books), faqSchema(home.faq))} />
      <p className="world-verse" id="verse" role="status" aria-live="polite" />
      <p className="world-bubble" id="bubble" role="status" aria-live="polite" />


      <div className="world-flow">
        <section className="world-sec intro" data-p="0" id="intro">
          <div className="say say-intro" data-anchor="author" data-say="intro" data-near="90">
            <h1 className="say-title">{say.intro.h1}</h1>
            <p>{say.intro.answer}</p>
            <p className="mt-2">{say.intro.invite}</p>
            <p className="world-only mt-2">{say.intro.music}</p>
            <div className="world-only say-play-row"><MusicButton /></div>
          </div>
          {/* подсказка «листайте» (spec v0.11, дизайнер): видна только на первом экране, пока не начали листать */}
          <div className="scroll-hint world-only" aria-hidden="true"><span className="scroll-hint-mouse" /><span>Листайте вниз</span></div>
        </section>

        {planetBooks.map((b) => {
          const k = b.planet!;
          const t = home.planets[k];
          return (
            <div key={b.slug}>
              <div className="world-spacer" aria-hidden />
              {k === "asf" && (
                <>
                  {/* точка маршрута камеры перед «Асфоделью»; предупреждения 16+ в полёте нет (решение Ника 2026-10-31) */}
                  <section className="world-sec gate" data-p="0.72" aria-hidden />
                  <div className="world-spacer" aria-hidden />
                </>
              )}
              <section className="world-sec planet" data-p={P[k]} data-planet={k} id={`planet-${k}`} aria-label={`Планета книги «${b.title}»`} style={{ ["--planet" as string]: t.color }}>
                <img className="world-poster" src={`/world/${k}.webp`} srcSet={`/world/${k}.webp 720w, /world/${k}@2x.webp 1440w`} sizes="(min-width: 640px) 560px, 100vw" alt={`Планета книги «${b.title}»`} loading="lazy" width={720} height={450} />

                <div className="say" data-anchor="author" data-say={k} data-near="90"><p>{say[k]}</p></div>


                {/* Имена героев над фигурками → попап героя */}
                <ul className="hero-tags" aria-label={`Герои книги «${b.title}»`}>
                  {HEROES[k].map(([i, a]) => {
                    const c = b.characters[i];
                    return (
                      <li key={a}>
                        <button type="button" className="tag" data-anchor={a} data-near="20" popoverTarget={`hero-${a}`}>{shortName(c.name)}</button>
                        <div popover="auto" id={`hero-${a}`} className="pop pop-hero" style={{ ["--planet" as string]: t.color }}>
                          <p className="world-eyebrow">Герой книги «{b.title}»</p>
                          <h3 className="text-2xl">{c.name}</h3>
                          <p className="mt-2 text-[17px] leading-relaxed">{c.name.split(" (")[0]} — {c.text}</p>
                          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                            <Link href={`/books/${b.slug}/`} className="hand-link">О книге</Link>
                            <button type="button" popoverTarget={`hero-${a}`} popoverTargetAction="hide" className="hand-link">Закрыть</button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  {(ACTS[k] ?? []).map((x) => (
                    <li key={x.id} className="world-only">
                      <button type="button" className="tag tag-act" data-anchor={`${k}.act.${x.id}`} data-near="22" {...x.attr}>{x.label}</button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          );
        })}

        <div className="world-spacer" aria-hidden />
        <section className="world-sec home" data-p="1" id="home" aria-labelledby="home-title">
          <img className="world-poster" src="/world/home.webp" srcSet="/world/home.webp 720w, /world/home@2x.webp 1440w" sizes="(min-width: 640px) 560px, 100vw" alt="Остров «Дом автора»: стол с лампой, полка с книгами, почтовый ящик" loading="lazy" width={720} height={450} />
          <h2 id="home-title" className="sr-only">Дом автора</h2>
          <div className="say" data-anchor="author" data-say="home" data-near="90"><p>{say.home}</p></div>
          <ul className="home-signs">
            <li><Link href="/books/" className="tag" data-anchor="home.books" data-near="30">Все книги</Link></li>
            <li><Link href="/about/" className="tag" data-anchor="home.about" data-near="30">Об авторе</Link></li>
            <li><button type="button" popoverTarget="reviews" className="tag" data-anchor="home.reviews" data-near="30">Отзывы</button></li>
            <li><button type="button" popoverTarget="faq" className="tag" data-anchor="home.faq" data-near="30">Вопросы</button></li>
            <li><Link href="/contacts/" className="tag" data-anchor="home.contacts" data-near="30">Написать автору</Link></li>
          </ul>

          {/* копирайт и тег разработчика — табличка на краю острова (решение Ника 2026-10-30, текст — 2026-10-31) */}
          <p className="credit" data-anchor="home.credit" data-near="26">© {new Date().getFullYear()} Евгения Перлова · Разработка сайта <a href="https://nikalimp.ru" target="_blank" rel="noopener">nikalimp.ru</a></p>

          <div popover="auto" id="reviews" className="pop pop-wide">
            <button type="button" popoverTarget="reviews" popoverTargetAction="hide" className="pop-close" aria-label="Закрыть">×</button>
            <h2 className="mb-5 text-3xl tracking-tight">Что говорят о книгах</h2>
            <div className="space-y-7">
              {reviews.map((r) => (
                <figure key={r.who}>
                  <blockquote className="font-serif text-[18px] italic leading-relaxed">«{r.text}»</blockquote>
                  <figcaption className="mt-2 text-sm text-muted-foreground">— {r.who}, о книге «{r.book}» · {r.src}</figcaption>
                </figure>
              ))}
            </div>
            <figure className="mt-8 border-l-2 border-accent pl-4">
              <blockquote className="font-serif text-[18px] italic">«{home.aboutQuote.text}»</blockquote>
              <figcaption className="mt-1 text-sm text-muted-foreground">{home.aboutQuote.source}</figcaption>
            </figure>
          </div>

          <div popover="auto" id="faq" className="pop pop-wide">
            <button type="button" popoverTarget="faq" popoverTargetAction="hide" className="pop-close" aria-label="Закрыть">×</button>
            <h2 className="mb-5 text-3xl tracking-tight">Частые вопросы</h2>
            <FaqList items={home.faq} />
            <ul className="mt-6 space-y-2 text-[15px]">
              {about.awards.slice(0, 3).map((a) => <li key={a.text} className="flex gap-3"><span className="w-12 shrink-0 tabular-nums text-muted-foreground">{a.year}</span><span>{a.text}</span></li>)}
            </ul>
            <p className="mt-6 text-[15px]">Написать автору: <a href={`mailto:${site.contacts.email}`} className="underline underline-offset-4" data-goal="contact_email">{site.contacts.email}</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
