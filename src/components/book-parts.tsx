import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Book } from "@/content/books";

// Обложка: файл из public/books; у книг без файла — типографская обложка в цветах сайта
export function BookCover({ b, className = "", priority = false }: { b: Book; className?: string; priority?: boolean }) {
  if (b.cover) {
    const x2 = b.cover.replace(".webp", "@2x.webp");
    return (
      <img
        src={b.cover}
        srcSet={`${b.cover} 720w, ${x2} 1440w`}
        sizes="(min-width: 768px) 320px, 60vw"
        alt={`Обложка книги «${b.title}»`}
        loading={priority ? "eager" : "lazy"}
        className={`aspect-[3/4] w-full rounded-md object-cover shadow-[0_12px_30px_-12px_oklch(0.312_0.043_318_/_45%)] ${className}`}
      />
    );
  }
  return (
    <div role="img" aria-label={`Обложка книги «${b.title}»`} className={`flex aspect-[3/4] w-full flex-col justify-between rounded-md bg-night p-5 text-night-foreground shadow-[0_12px_30px_-12px_oklch(0.312_0.043_318_/_45%)] ${className}`}>
      <span className="text-xs uppercase tracking-widest text-night-muted">Евгения Перлова</span>
      <span className="font-serif text-2xl font-semibold leading-tight">{b.title}</span>
      <span className="text-xs text-night-muted">{b.publisher}</span>
    </div>
  );
}

// «Где купить»: внешние ссылки, цель Метрики на клик; книги не в продаже подписаны
export function BuyLinks({ b }: { b: Book }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {b.buy.map((s) => (
        <li key={s.href}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener"
            data-goal={`buy_${b.slug}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[15px] font-medium transition-colors hover:border-primary hover:text-primary ${s.available ? "bg-card" : "bg-transparent text-muted-foreground"}`}
          >
            {s.name}
            {!s.available && <span className="text-xs">· нет в продаже</span>}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function BookCard({ b }: { b: Book }) {
  return (
    <Link href={`/books/${b.slug}/`} className="group block">
      <BookCover b={b} className="transition-opacity group-hover:opacity-90" />
      <p className="mt-3 text-sm text-muted-foreground">{b.genre} · {b.age.split(" · ")[0]}</p>
      <h3 className="mt-1 font-serif text-lg font-semibold leading-snug group-hover:text-primary">{b.title}</h3>
    </Link>
  );
}
