// Постеры планет и OG-картинка главной — кадры из 3D-мира (рекомендации В7, В8, Д9).
// Запуск: npm run build && npx serve out -l 3011, затем node scripts/posters.mjs [http://localhost:3011]
// Результат: public/world/<планета>.webp (720) и @2x (1440), public/og.png (1200×630).
import { createRequire } from "node:module";
// playwright — глобальный (в зависимости сайта не входит)
const { chromium } = createRequire(import.meta.url)("playwright");
import fs from "node:fs";

const BASE = process.argv[2] || "http://localhost:3011";
const SHOTS = [["kuv", "0.16"], ["dub", "0.39"], ["fan", "0.61"], ["asf", "0.88"]];
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });

async function open(w, h) {
  const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p.goto(BASE + "/");
  await p.waitForFunction(() => document.documentElement.classList.contains("has-world"), null, { timeout: 30000 });
  await p.addStyleTag({ content: "header,.world-flow,.world-rail,.world-verse,.world-bubble,#cookie-banner{visibility:hidden!important} .world-page>div:last-child{display:none}" });
  return p;
}
async function at(p, ps) {
  await p.evaluate((ps) => { const s = document.querySelector(`[data-p="${ps}"]`); scrollTo(0, Math.max(0, s.offsetTop + s.offsetHeight - innerHeight)); }, ps);
  await p.waitForTimeout(500);
  await p.evaluate(() => window.__snap && window.__snap());
  await p.waitForTimeout(4000);
}
// PNG → WebP средствами браузера, без лишних зависимостей
async function toWebp(p, png, w, out) {
  const b64 = png.toString("base64");
  const data = await p.evaluate(async ({ b64, w }) => {
    const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
    const c = document.createElement("canvas"); c.width = w; c.height = Math.round((img.height * w) / img.width);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/webp", 0.82).split(",")[1];
  }, { b64, w });
  fs.writeFileSync(out, Buffer.from(data, "base64"));
}

fs.mkdirSync("public/world", { recursive: true });
const p = await open(1440, 900);
for (const [k, ps] of SHOTS) {
  await at(p, ps);
  const png = await p.screenshot();
  await toWebp(p, png, 1440, `public/world/${k}@2x.webp`);
  await toWebp(p, png, 720, `public/world/${k}.webp`);
  console.log("постер", k);
}
await p.close();

// OG главной: обзор архипелага + подпись
const og = await open(1200, 630);
await at(og, "0");
await og.evaluate(() => {
  const d = document.createElement("div");
  d.innerHTML =
    '<div style="font:600 64px/1.05 \'Lora Variable\',Georgia,serif;color:#3A2A3F">Миры книг<br>Евгении Перловой</div>' +
    '<div style="margin-top:14px;font:400 24px \'Golos Text Variable\',sans-serif;color:#6D5A6E">Стихи, повести и роман · perlova.nikalimp.ru</div>';
  Object.assign(d.style, { position: "fixed", left: "56px", bottom: "56px", zIndex: 99, background: "rgba(255,250,244,.88)", padding: "28px 34px", borderRadius: "24px" });
  document.body.appendChild(d);
});
await og.waitForTimeout(500);
await og.screenshot({ path: "public/og.png" });
console.log("og");
await browser.close();
