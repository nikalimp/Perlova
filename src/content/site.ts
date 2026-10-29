// Единый источник правды об авторе. Заполнен по specs/00-brief.md, specs/02-spec.md и specs/source/research.md.

export type OrgType = "Person";

export const site = {
  url: "https://perlova.nikalimp.ru",
  name: "Евгения Перлова",
  legalName: "Евгения Перлова",
  orgType: "Person" as OrgType,
  title: "Евгения Перлова — детский писатель, поэт и переводчик",
  description:
    "Книги Евгении Перловой: стихи для малышей, повести о школьнице Ясе и роман 16+. Финал премии им. Крапивина. Где купить книги и как связаться с автором.",
  tagline: "Писатель, поэт и переводчик из Екатеринбурга. Книги для детей, подростков и взрослых.",
  lang: "ru",
  locale: "ru_RU",
  areaServed: ["RU"],

  contacts: {
    phone: "", // телефон на сайте не показываем (decisions.md)
    phoneDisplay: "",
    email: "ifigenia@list.ru",
    telegram: "https://t.me/evgeniaperolva",
    channel: "https://t.me/perlovaevgenia",
    city: "Екатеринбург",
  },

  // Главное целевое действие на страницах книг — «Где купить»; общее — написать автору
  cta: { label: "Написать автору", href: "/contacts/" },

  legal: {
    privacyEmail: "ifigenia@list.ru",
    operator: "Евгения Перлова", // имя оператора в политике ПДн (решение Ника, по умолчанию — публичное имя)
  },

  // Профили автора на внешних площадках (Schema.org sameAs)
  sameAs: [
    "https://www.labirint.ru/authors/138065/",
    "https://www.litres.ru/author/evgeniya-perlova-33895207/",
    "https://www.litres.ru/author/evgeniya-perlova-32626054/",
    "https://books.yandex.ru/authors/evgeniya-perlova-U7SU9DZr",
    "https://prodetlit.ru/index.php/Перлова_Евгения_Михайловна",
    "https://author.today/u/ifigenia",
    "https://t.me/perlovaevgenia",
  ],
  socials: [
    { label: "Telegram-канал", href: "https://t.me/perlovaevgenia" },
    { label: "Лабиринт", href: "https://www.labirint.ru/authors/138065/" },
    { label: "Литрес", href: "https://www.litres.ru/author/evgeniya-perlova-33895207/" },
    { label: "Яндекс Книги", href: "https://books.yandex.ru/authors/evgeniya-perlova-U7SU9DZr" },
  ],
  metaNote: "",

  person: {
    name: "Евгения Перлова",
    jobTitle: "Писатель, поэт, переводчик",
    description:
      "Детский писатель, поэт и переводчик из Екатеринбурга. Автор стихов для малышей «Кувшинки», повестей «Дуб, орех и мочало» и «Цветные запахи лета и немного фанданго», романа «Асфодель, цветок забвения».",
  },

  metrikaId: 0, // счётчик подключается после запуска на боевом домене (решение Ника 2026-10-29)
  darkTheme: false,

  // Функции включаются и выключаются флагами, а не удалением кода (стандарт §1.9)
  features: {
    blog: false, // контент-завода нет
    services: false, // услуг нет — сайт автора
    forms: false, // форм нет, ПДн не собираем
    legalRequisites: false, // реквизитов нет — личный сайт, ничего не продаём (spec §9)
    metrikaPending: true, // Метрика — после запуска (spec §9); npm run check предупреждает, но не блокирует
  },
};

export const nav = [
  { href: "/books/", label: "Книги" },
  { href: "/about/", label: "Об авторе" },
  { href: "/contacts/", label: "Контакты" },
];
