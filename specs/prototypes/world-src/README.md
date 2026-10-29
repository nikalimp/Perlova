# Исходник прототипа «Мир книг» (Three.js)

Модули: `core.js` (материалы «глина», остров, деревья, облака), `kuvshinki.js`, `dub.js`, `fandango.js`, `asfodel.js`, `main.js` (камера по скроллу, день → ночь, клики, подписи).
Сборка прототипа в один файл:
```bash
npm i three@0.170.0 esbuild@0.24.0
npx esbuild main.js --bundle --minify --format=iife --outfile=bundle.js
# вставить bundle.js вместо /*BUNDLE*/ в page.html → ../world-3d.html
```
На этапе 6 модули переезжают в `src/world/` сайта как клиентский компонент главной; текст карточек остаётся в HTML.
