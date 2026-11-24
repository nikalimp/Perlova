"use client";

// Уведомление о cookies и метрических программах (152-ФЗ).
// Клиентский компонент: скрывается через React state и localStorage, не зависит от CSS [hidden]
// и не теряет обработчик клика после гидратации или мягкой навигации.
import { useEffect, useState } from "react";
import { site } from "@/content/site";

const STORAGE_KEY = "cookie-ok";

// Баннер — только когда подключена Метрика: без неё сайт cookies не ставит (рекомендация В2)
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!site.metrikaId) return;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!site.metrikaId || !visible) return null;

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setVisible(false);
  };

  return (
    <div
      id="cookie-banner"
      role="region"
      aria-label="Уведомление о cookies"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl items-center gap-3 rounded-full border bg-background py-2 pl-4 pr-2 text-[13px] shadow-lg sm:text-sm"
    >
      <p className="flex-1 text-muted-foreground">
        Сайт использует cookies и Яндекс Метрику — <a href="/privacy-policy/" className="underline underline-offset-4 hover:text-foreground">подробнее</a>.
      </p>
      <button
        type="button"
        data-accept
        onClick={accept}
        className="h-9 shrink-0 cursor-pointer rounded-full bg-primary px-4 font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Понятно
      </button>
    </div>
  );
}
