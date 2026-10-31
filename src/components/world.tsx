"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { books, planetBooks } from "@/content/books";

// 3D-пространство на весь сайт (spec v0.3) — прогрессивное улучшение. Живёт в layout и не пересоздаётся между страницами.
// Не запускается без WebGL и при prefers-reduced-motion: тогда виджеты и панели — обычная страница, весь текст в HTML.
export function World() {
  const ref = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const nav = useRef(router.push);
  nav.current = router.push;
  useEffect(() => {
    const root = document.documentElement;
    // Проценты прелоадера (spec v0.8): у каждого этапа загрузки свой потолок, между этапами шкала плавно ползёт к нему.
    // 0–45 % — код сцены, 45–85 % — сборка мира, 85–100 % — первые кадры.
    let cap = 45, goal = 0, shown = 0, raf = 0;
    const ring = document.getElementById("preloader-ring"), pct = document.getElementById("preloader-pct");
    const loop = () => {
      goal = Math.min(cap, goal + (cap - goal) * 0.02 + 0.05); shown += (goal - shown) * 0.12;
      ring?.style.setProperty("--p", (shown / 100).toFixed(3)); if (pct) pct.textContent = `${Math.round(shown)}%`;
      if (root.classList.contains("world-loading")) raf = requestAnimationFrame(loop);
    };
    if (root.classList.contains("world-loading")) raf = requestAnimationFrame(loop);
    const stage = (c: number) => { cap = Math.max(cap, c); goal = Math.max(goal, c - 12); };
    // прелоадер держится не меньше 1,4 с от начала загрузки и даёт шкале дойти до 100 %
    const done = () => {
      stage(100); goal = 100;
      // на медленном устройстве кадры редкие — шкалу доводим до 100 % сами и даём на неё взглянуть
      setTimeout(() => { shown = 100; ring?.style.setProperty("--p", "1"); if (pct) pct.textContent = "100%"; }, 350);
      setTimeout(() => { root.classList.remove("world-loading"); cancelAnimationFrame(raf); }, Math.max(700, 1400 - performance.now()));
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { done(); return; }
    const probe = document.createElement("canvas");
    if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) { done(); return; }
    let stop: (() => void) | undefined;
    let alive = true;
    const slugs = Object.fromEntries(planetBooks.map((b) => [b.planet, b.slug]));
    import("@/world/main.js").catch(() => { done(); return null; }).then((m) => {
      if (!m) return;
      stage(85);
      const { startWorld } = m;
      if (!alive || !ref.current) return;
      root.classList.add("has-world");
      stop = startWorld(ref.current, { nav: (href: string) => nav.current(href), slugs, covers: books.map((b) => ({ slug: b.slug, cover: b.cover })), onReady: done });
    });
    return () => { alive = false; cancelAnimationFrame(raf); stop?.(); root.classList.remove("has-world"); };
  }, []);
  return <canvas ref={ref} className="world-canvas" aria-hidden="true" />;
}
