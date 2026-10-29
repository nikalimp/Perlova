# 04 · План — Евгения Перлова

> Как утверждённые `02-spec.md` v0.2 и `03-design.md` ложатся на код стартера.
> Статус: **утверждён Ником 2026-10-29**

## 1. Основа
- Стартер: `.starter/` NikitOS (Next.js 16, статический экспорт, Tailwind 4, shadcn/ui).
- Репозиторий: github.com/nikalimp/Perlova; на Mac — `~/Desktop/Евгения Перлова/site/` (синхронизация `.sync`). Работа агента — ветки `claude/*` и PR.
- Хостинг: REG.RU Ника. Выкладка: GitHub Actions (deploy-kit) — FTP (у REG.RU порт 22 для GitHub закрыт); до pre-flight — `manual-zip`.
- Адрес: perlova.nikalimp.ru — он же боевой (тестового нет: нового трафика нет, решение ускоренного режима).

### Pre-flight хостинга
Пока не зелёное — FTP-секреты не заводим, дату запуска не называем.
| Проверка | Результат | Дата |
|---|---|---|
| Поддомен perlova.nikalimp.ru: A-запись или папка поддомена в панели REG.RU | ❓ Ник | |
| FTP-доступ к папке поддомена (`FTP_HOST`, `FTP_USER`, `FTP_PASS`, `FTP_DIR`) | ❓ Ник | |
| HTTPS: сертификат на поддомен, редирект http → https | ❓ | |
| `.htaccess`: 404 и `trailingSlash` | ❓ | |
| Видео и тяжёлые файлы — не нужны (сцены — код), отдача JS со сжатием gzip/br | ❓ | |
| Пробная выкладка из Actions по FTP | ❓ | |

- Исключения из стандарта: spec §9.

## 2. Контент-модель в коде
| Данные | Файл | Что меняется относительно стартера |
|---|---|---|
| Автор, контакты, sameAs, Метрика, флаги | `src/content/site.ts` | `orgType` → Person-сайт: `person` — Евгения Перлова; `legal` — пусто; флаги `features.blog=false`, `features.services=false`, `features.legalRequisites=false`, `features.forms=false`; `darkTheme=false`; `contacts.email`, `telegram` |
| Книги | `src/content/books.ts` (новый) | 6 записей по spec §5: `editions[]`, `buy[]`, `reviews[]`, `faq[]`, `planet` |
| Главная | `src/content/home.ts` | прямой ответ, тексты карточек планет, FAQ главной |
| Об авторе | `src/content/about.ts` (новый) | биография, награды, встречи 2024–2026, переводы, публикации |
| Мир планет | `src/world/*` (из `specs/prototypes/world-src/`) | код сцен; тексты — не здесь, а в `books.ts` и `home.ts` |

## 3. Маршруты
| URL из spec | Файл | Шаблон / новый | Schema |
|---|---|---|---|
| `/` | `src/app/page.tsx` | переписать: секции-карточки + `<World/>` | WebSite, Person, ItemList(Book), FAQPage |
| `/books/` | `src/app/books/page.tsx` | новый (из `services/page.tsx`) | ItemList |
| `/books/[slug]/` | `src/app/books/[slug]/page.tsx` | новый (из `services/[slug]`) | Book + bookEdition, FAQPage, BreadcrumbList, Review (видимые) |
| `/about/` | `src/app/about/page.tsx` | стартер, переписать | ProfilePage, Person |
| `/contacts/` | `src/app/contacts/page.tsx` | стартер, без формы | ContactPage |
| `/privacy-policy/`, `/consent/` | стартер | правка: оператор, Метрика, без форм | — |
| `/services/*`, `/blog/*` | стартер | выключены флагами, не в sitemap и llms | — |

## 4. Компоненты
| Компонент | Откуда | Зачем |
|---|---|---|
| `World` (client) | `src/world/` + `next/dynamic`, `ssr:false` | WebGL-сцена; грузится после первого экрана; без WebGL и при `prefers-reduced-motion` — статичные постеры планет |
| `PlanetCard` | новый, shadcn Button/Badge | карточка книги поверх сцены: возраст, название, ответ, метки, «О книге», «Где купить», кнопки интерактива |
| `Gate16` | новый | порог 16+ с «Пропустить» |
| `BookShelf` | новый | полка 6 обложек (WebP 720 px из папки материалов) |
| `BuyLinks` | новый | «Где купить»: магазин, ссылка `rel="noopener"`, цель Метрики, «нет в продаже» |
| `Logo` | новый | знак `public/brand/sign*.svg` + словесный знак текстом |
| Постеры планет | генерируются скриптом из сцены (Playwright, 1440/720 WebP) — `scripts/posters.mjs` | фолбэк без WebGL, OG-картинки книг |

## 5. Интеграции
| Что | Как | Секреты / доступы |
|---|---|---|
| Метрика | `site.metrikaId`; цели `buy_<slug>_<shop>`, `contact_email`, `contact_tg` | ❓ номер счётчика от Ника |
| Форма | нет | — |
| Деплой | `.github/workflows/deploy.yml` (deploy-kit, `ftp`) | `FTP_HOST`, `FTP_USER`, `FTP_PASS`, `FTP_DIR` — Ник через `web:wizard` |
| Three.js | npm `three@0.170`, импорт модулей точечно | — |
| Шрифты | `@fontsource-variable/lora`, `@fontsource-variable/golos-text` | — |

## 6. Порядок работ
1. Каркас: `site.ts`, флаги, токены и шрифты, знак, шапка и футер, правка `check.mjs` под флаг реквизитов.
2. Контент-модель книг и автора, страницы `/books/`, `/books/[slug]/`, `/about/`, `/contacts/`.
3. Главная: карточки поверх сцены, перенос `src/world/`, ленивая загрузка, фолбэк, постеры.
4. Разметка, llms.txt, sitemap; тексты — Главред и Типограф в каждой задаче.
5. Адаптив, доступность, производительность (Lighthouse, бюджет JS).
6. Pre-flight, выкладка, запуск.

## 7. Риски
| Риск | Что делаем |
|---|---|
| Тяжёлая главная на слабом телефоне | бюджет JS сцены ≤ 250 КБ gzip; тени и `pixelRatio` ниже на мобильных; планеты строятся по мере полёта; Lighthouse ≥ 85 — критерий |
| Нет WebGL / reduced motion | постеры планет и весь текст в HTML |
| Нет номера Метрики к запуску | запуск без Метрики не делаем — `npm run check` блокирует |
| Непроверенные ссылки «Купить» | Ник проверяет на живом сайте (decisions) |
