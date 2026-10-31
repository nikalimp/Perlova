"use client";
import { useEffect, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { isMusicOn, onMusic, setMusic, wasMusicStarted } from "@/lib/music";

const useMusic = () => {
  const [on, setOn] = useState(false);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    setOn(isMusicOn()); setStarted(wasMusicStarted());
    return onMusic((v) => { setOn(v); setStarted(wasMusicStarted()); });
  }, []);
  return { on, started };
};

// Круглая кнопка ▶ по центру первой реплики (spec v0.10)
export function MusicButton() {
  const { on } = useMusic();
  const label = on ? "Поставить музыку на паузу" : "Включить музыку";
  return (
    <button type="button" className="say-play" aria-pressed={on} aria-label={label} title={label} onClick={() => setMusic(!on)}>
      {on ? <Pause aria-hidden /> : <Play aria-hidden />}
    </button>
  );
}

// Слева внизу — звук вкл/выкл; появляется, когда музыку включили хотя бы раз (WCAG 1.4.2)
export function MusicToggle() {
  const { on, started } = useMusic();
  if (!started) return null;
  const label = on ? "Выключить звук" : "Включить звук";
  return (
    <button type="button" className="music-toggle" aria-pressed={!on} aria-label={label} title={label} onClick={() => setMusic(!on)}>
      {on ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
    </button>
  );
}
