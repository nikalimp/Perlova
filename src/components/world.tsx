"use client";
import { useEffect, useRef } from "react";

// 3D-мир планет (Three.js) — прогрессивное улучшение главной. Не запускается без WebGL и при prefers-reduced-motion:
// тогда страница — обычные секции с обложками, весь текст в HTML. Код сцены грузится отдельным чанком после первого экрана.
export function World() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const root = document.documentElement;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const probe = document.createElement("canvas");
    if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) return;
    let stop: (() => void) | undefined;
    let alive = true;
    import("@/world/main.js").then(({ startWorld }) => {
      if (!alive || !ref.current) return;
      root.classList.add("has-world");
      stop = startWorld(ref.current);
    });
    return () => { alive = false; stop?.(); root.classList.remove("has-world"); };
  }, []);
  return <canvas ref={ref} className="world-canvas" aria-hidden="true" />;
}
