// Прелоадер мира (spec v0.8): круглая шкала и проценты в середине, под ней имя автора от руки.
// Проценты считает World (src/components/world.tsx) по этапам загрузки: код сцены → сцена собрана → первые кадры.
// Видим только при html.world-loading (скрипт в layout); весь текст страницы — под ним, в HTML.
export function Preloader() {
  return (
    <div className="preloader" aria-hidden="true">
      <div className="preloader-ring" id="preloader-ring">
        <svg viewBox="0 0 120 120" width="140" height="140">
          <circle className="track" cx="60" cy="60" r="52" />
          <circle className="bar" cx="60" cy="60" r="52" pathLength="100" />
        </svg>
        <span id="preloader-pct">0%</span>
      </div>
      <p className="preloader-name">Евгения Перлова</p>
      <p className="preloader-text">Раскрываем миры книг…</p>
    </div>
  );
}
