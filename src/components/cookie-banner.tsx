// Уведомление о cookies и метрических программах (152-ФЗ). Без JavaScript-библиотек:
// скрывается кнопкой через localStorage; если хранилище недоступно — просто остаётся видимым.
const script = `(function(){try{if(localStorage.getItem('cookie-ok')){document.getElementById('cookie-banner').hidden=true}}catch(e){}})()`;
const accept = `try{localStorage.setItem('cookie-ok','1')}catch(e){};document.getElementById('cookie-banner').hidden=true`;

import { site } from "@/content/site";

// Баннер — только когда подключена Метрика: без неё сайт cookies не ставит (рекомендация В2)
export function CookieBanner() {
  if (!site.metrikaId) return null;
  return (
    <>
      <div id="cookie-banner" role="region" aria-label="Уведомление о cookies" className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl items-center gap-3 rounded-full border bg-background py-2 pl-4 pr-2 text-[13px] shadow-lg sm:text-sm">
        <p className="flex-1 text-muted-foreground">
          Сайт использует cookies и Яндекс Метрику — <a href="/privacy-policy/" className="underline underline-offset-4 hover:text-foreground">подробнее</a>.
        </p>
        <button type="button" data-accept className="h-9 shrink-0 rounded-full bg-primary px-4 font-medium text-primary-foreground">Понятно</button>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `${script};document.querySelector('#cookie-banner [data-accept]').addEventListener('click',function(){${accept}})` }} />
    </>
  );
}
