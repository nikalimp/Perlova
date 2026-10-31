"use client";
import { useEffect, useState } from "react";
import { isMusicOn, onMusic, setMusic } from "@/lib/music";

const useMusic = () => {
  const [on, setOn] = useState(false);
  useEffect(() => { setOn(isMusicOn()); return onMusic(setOn); }, []);
  return on;
};

// Кнопка в первой реплике автора (spec v0.8): «Включить музыку» / «Выключить музыку»
export function MusicButton() {
  const on = useMusic();
  return (
    <button type="button" className="say-music" aria-pressed={on} onClick={() => setMusic(!on)}>
      <span aria-hidden>♪</span> {on ? "Выключить музыку" : "Включить музыку"}
    </button>
  );
}

// Пока музыка играет — маленькая нота в углу, чтобы выключить её на любой планете (WCAG 1.4.2)
export function MusicToggle() {
  const on = useMusic();
  if (!on) return null;
  return (
    <button type="button" className="music-toggle" aria-label="Выключить музыку" title="Выключить музыку" onClick={() => setMusic(false)}>
      <span aria-hidden>♪</span>
    </button>
  );
}
