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
  // Обложки издания нет — иллюстрация в стиле мира (рекомендация Д4). Это не обложка книги, и alt говорит об этом честно.
  return (
    <div role="img" aria-label={`Иллюстрация к книге «${b.title}»`} style={{ containerType: "inline-size" }} className={`relative aspect-[3/4] w-full overflow-hidden rounded-md ${b.slug === "day-mne-ruku" ? "text-white" : "text-foreground"} shadow-[0_12px_30px_-12px_oklch(0.312_0.043_318_/_45%)] ${className}`}>
      <CoverArt slug={b.slug} />
      <div className="relative flex flex-col gap-[3cqw] p-[8cqw]">
        <span className="relative uppercase tracking-widest opacity-75" style={{ fontSize: "clamp(8px, 6cqw, 12px)" }}>Евгения Перлова</span>
      <span className="relative font-serif font-semibold leading-[1.1] text-balance [hyphens:auto]" lang="ru" style={{ fontSize: "clamp(11px, 11cqw, 26px)" }}>{b.title}</span>
      </div>
    </div>
  );
}

// Мотивы: «Танцы…» — сцена-остров с огурцом и нотами; «Дай мне руку» — два острова и мостик на рассвете
function CoverArt({ slug }: { slug: string }) {
  if (slug === "day-mne-ruku")
    return (
      <svg aria-hidden viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        <defs>
          <linearGradient id="dmr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3B4A8C" /><stop offset=".55" stopColor="#C98AB0" /><stop offset="1" stopColor="#FFD6A8" /></linearGradient>
        </defs>
        <rect width="300" height="400" fill="url(#dmr-sky)" />
        <circle cx="150" cy="300" r="46" fill="#FFE7B8" opacity=".9" />
        <circle cx="60" cy="60" r="2" fill="#fff" /><circle cx="230" cy="40" r="1.6" fill="#fff" /><circle cx="190" cy="95" r="1.4" fill="#fff" opacity=".8" />
        <ellipse cx="70" cy="300" rx="58" ry="16" fill="#9CCB86" /><path d="M14 300 q56 60 112 0 z" fill="#B98A6A" />
        <ellipse cx="232" cy="285" rx="54" ry="15" fill="#9CCB86" /><path d="M180 285 q52 56 104 0 z" fill="#B98A6A" />
        <path d="M118 296 Q150 312 186 284" stroke="#7A4E3A" strokeWidth="3" fill="none" strokeDasharray="7 5" strokeLinecap="round" />
        <circle cx="96" cy="270" r="9" fill="#F07D24" /><rect x="88" y="278" width="16" height="22" rx="7" fill="#F07D24" />
        <circle cx="208" cy="256" r="9" fill="#2F56A6" /><rect x="200" y="264" width="16" height="22" rx="7" fill="#2F56A6" />
        <path d="M104 284 L124 278" stroke="#F07D24" strokeWidth="5" strokeLinecap="round" /><path d="M200 270 L180 274" stroke="#2F56A6" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg aria-hidden viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
      <defs>
        <linearGradient id="tom-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FBD3E0" /><stop offset="1" stopColor="#FFE9CF" /></linearGradient>
      </defs>
      <rect width="300" height="400" fill="url(#tom-sky)" />
      <path d="M150 120 L90 300 L210 300 Z" fill="#FFF6D6" opacity=".7" />
      <ellipse cx="150" cy="300" rx="110" ry="26" fill="#9CCB86" /><path d="M40 300 q110 90 220 0 z" fill="#B98A6A" />
      <ellipse cx="150" cy="296" rx="62" ry="13" fill="#E9B98A" />
      <g transform="rotate(-24 120 268)"><rect x="96" y="256" width="58" height="22" rx="11" fill="#5DA34A" /><circle cx="110" cy="264" r="2" fill="#3F7A31" /><circle cx="126" cy="270" r="2" fill="#3F7A31" /><circle cx="140" cy="263" r="2" fill="#3F7A31" /></g>
      <circle cx="186" cy="246" r="9" fill="#B53389" /><path d="M186 255 L176 290 L196 290 Z" fill="#B53389" /><path d="M180 262 L164 248 M192 262 L206 246" stroke="#B53389" strokeWidth="4" strokeLinecap="round" />
      <g fill="#B53389" opacity=".75"><circle cx="76" cy="208" r="6" /><rect x="81" y="180" width="2.5" height="28" /><circle cx="226" cy="190" r="6" /><rect x="231" y="162" width="2.5" height="28" /></g>
    </svg>
  );
}

// «Где купить»: внешние ссылки, цель Метрики на клик; книги не в продаже подписаны
export function BuyLinks({ b }: { b: Book }) {
  const none = b.buy.every((s) => !s.available);
  return (
    <>
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
    {none && (
      <p className="mt-3 text-[15px] text-muted-foreground">
        Сейчас книги нет в продаже. Спросите её в библиотеке или <a href="/contacts/" className="underline underline-offset-4">напишите автору</a>.
      </p>
    )}
    </>
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
