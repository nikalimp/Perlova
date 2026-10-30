"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { planetBooks } from "@/content/books";

// 3D-пространство на весь сайт (spec v0.3) — прогрессивное улучшение. Живёт в layout и не пересоздаётся между страницами.
// Не запускается без WebGL и при prefers-reduced-motion: тогда виджеты и панели — обычная страница, весь текст в HTML.
export function World() {
  const ref = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const nav = useRef(router.push);
  nav.current = router.push;
  useEffect(() => {
    const root = document.documentElement;
    // прелоадер держится не меньше 1,4 с от начала загрузки — появление мира плавное, без вспышки
    const done = () => setTimeout(() => root.classList.remove("world-loading"), Math.max(0, 1400 - performance.now()));
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { done(); return; }
    const probe = document.createElement("canvas");
    if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) { done(); return; }
    let stop: (() => void) | undefined;
    let alive = true;
    const slugs = Object.fromEntries(planetBooks.map((b) => [b.planet, b.slug]));
    import("@/world/main.js").catch(() => { done(); return null; }).then((m) => {
      if (!m) return;
      const { startWorld } = m;
      if (!alive || !ref.current) return;
      root.classList.add("has-world");
      stop = startWorld(ref.current, { nav: (href: string) => nav.current(href), slugs, onReady: done });
    });
    return () => { alive = false; stop?.(); root.classList.remove("has-world"); };
  }, []);
  return <canvas ref={ref} className="world-canvas" aria-hidden="true" />;
}
