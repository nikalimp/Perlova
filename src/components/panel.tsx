import Link from "next/link";
import { X } from "lucide-react";

// Попап страницы в пространстве (spec v0.3): адрес = место в мире.
// view — куда летит камера (src/world/main.js, VIEWS); back — куда вернуться в мире при закрытии.
// Без 3D-мира панель — обычная страница: весь текст в HTML.
export type WorldView = "overview" | "kuv" | "dub" | "fan" | "asf" | "home" | "desk" | "shelf";

export function Panel({ view, back = "/", backLabel = "Закрыть и вернуться в мир", children }: { view: WorldView; back?: string; backLabel?: string; children: React.ReactNode }) {
  return (
    <>
      <div data-world-view={view} hidden />
      <article data-world-panel className="panel">
        <Link href={back} className="panel-close" aria-label={backLabel}><X className="size-5" aria-hidden /></Link>
        <div className="panel-body">{children}</div>
      </article>
    </>
  );
}
