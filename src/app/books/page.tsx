import type { Metadata } from "next";
import { books } from "@/content/books";
import { home } from "@/content/home";
import { Container, Section } from "@/components/container";
import { BookCard } from "@/components/book-parts";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { bookListSchema, graph } from "@/lib/schema";

export const metadata: Metadata = {
  title: { absolute: "Книги Евгении Перловой: для детей, подростков и взрослых" },
  description:
    "Все книги Евгении Перловой: стихи «Кувшинки», повести о Ясе, роман «Асфодель», повести для подростков. Возраст, издательство и где купить каждую книгу.",
  alternates: { canonical: "/books/" },
};

const groups = [
  { title: "Для малышей", slugs: ["kuvshinki"], text: "Стихи, которые читают вслух перед сном: короткие, звонкие и смешные." },
  { title: "Для младших школьников", slugs: ["dub-orekh-i-mochalo", "tsvetnye-zapakhi-leta"], text: "Две повести о Ясе: в первой ей семь лет и она идёт в первый класс, во второй — почти девять, и она проводит лето в деревне." },
  { title: "Для подростков", slugs: ["tantsy-ogurtsy-i-bolshie-mechty", "day-mne-ruku"], text: "Дилогия о Есении: травля, предательство, танцы и мечта — и человек, который протягивает руку." },
  { title: "Для взрослых читателей", slugs: ["asfodel"], text: "Роман 16+ о брате и сестре в двух реальностях — магический реализм и психологическая проза." },
];

export default function Books() {
  return (
    <>
      <JsonLd data={graph(bookListSchema(books))} />
      <Section className="pt-12">
        <Container>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Книги Евгении Перловой</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">{home.shelf.text}</p>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Книги разделены по возрасту читателя. На странице каждой книги — о чём она, кто её герои, отзывы, издания с ISBN и ссылки на магазины, где её можно купить, прочитать или послушать. Две повести о школьнице Ясе связаны одной героиней, а «Дай мне руку» продолжает историю Есении из «Танцев, огурцов и больших мечт». Если вы выбираете книгу в подарок, начните с возраста ребёнка: для малышей — стихи, для младших школьников — повести о Ясе, для подростков — дилогия о Есении. Роман «Асфодель» — для читателей от 16 лет.
          </p>
          <div className="mt-12 space-y-14">
            {groups.map((g) => (
              <section key={g.title}>
                <h2 className="text-2xl font-semibold tracking-tight">{g.title}</h2>
                <p className="mt-2 max-w-2xl text-muted-foreground">{g.text}</p>
                <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                  {g.slugs.map((s) => <BookCard key={s} b={books.find((b) => b.slug === s)!} />)}
                </div>
              </section>
            ))}
          </div>
        </Container>
      </Section>
      <Cta />
    </>
  );
}
