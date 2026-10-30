// Прелоадер мира: облачко со знаком и мазок кистью, который «прорисовывается».
// Видим только при html.world-loading (скрипт в layout); весь текст страницы — под ним, в HTML.
export function Preloader() {
  return (
    <div className="preloader" aria-hidden="true">
      <div className="preloader-cloud">
        <img src="/brand/sign.svg" alt="" width={64} height={64} />
      </div>
      <p className="preloader-name">Евгения Перлова</p>
      <p className="preloader-text">Раскрываем миры книг…</p>
      <svg className="preloader-stroke" viewBox="0 0 220 24" width="220" height="24">
        <path d="M6 14 C 40 4, 70 22, 110 12 S 180 6, 214 12" pathLength="1" />
      </svg>
    </div>
  );
}
