"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CHAPTERS, CHAPTER_COUNT } from "@/lib/chapters";
import { SceneManager } from "@/lib/SceneManager";
import { AudioEngine } from "@/lib/AudioEngine";
import { MoodController } from "@/lib/MoodController";
import Overlay from "./Overlay";

const LONG_PRESS_MS = 420;

export default function Experience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState<Set<number>>(new Set([0]));
  const [muted, setMuted] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [scanning, setScanning] = useState(false);

  const audioRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const track = trackRef.current;
    if (!canvas || !track) return;

    // --- Three.js (with graceful WebGL fallback) ---
    let sceneManager: SceneManager;
    try {
      sceneManager = new SceneManager(canvas);
    } catch (err) {
      console.warn("WebGL unavailable, showing fallback:", err);
      setWebglFailed(true);
      return;
    }

    sceneManager.onChapterLoaded = (index) => {
      setLoaded((prev) => {
        const next = new Set(prev);
        next.add(index);
        return next;
      });
    };

    const audio = new AudioEngine();
    audioRef.current = audio;
    const mood = new MoodController();

    let chapterFloat = 0;
    let lastIndex = -1;

    // Long-press deep scan: target is 1 while pressing, 0 otherwise; the render
    // loop eases `variation` toward it for a smooth ramp.
    let variation = 0;
    let variationTarget = 0;

    const setPlayhead = (cf: number) => {
      chapterFloat = cf;
      mood.apply(cf);
      audio.setPlayhead(cf);
      const idx = Math.max(0, Math.min(CHAPTER_COUNT - 1, Math.round(cf)));
      if (idx !== lastIndex) {
        lastIndex = idx;
        setActiveIndex(idx);
      }
    };
    setPlayhead(0);

    // --- GSAP ScrollTrigger: scroll position becomes the film reel ---
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        setPlayhead(self.progress * (CHAPTER_COUNT - 1));
      },
    });

    // --- Render loop ---
    let raf = 0;
    const render = () => {
      variation += (variationTarget - variation) * 0.09;
      sceneManager.update(chapterFloat, variation);
      raf = requestAnimationFrame(render);
    };
    render();

    // --- Audio: unlock on first qualifying user gesture (Safari-safe) ---
    // Only activation gestures unlock audio; `wheel`/scroll does NOT count in
    // Safari, so we keep listeners until the context is actually running.
    const unlockEvents: (keyof WindowEventMap)[] = [
      "pointerdown",
      "touchstart",
      "keydown",
    ];
    const tryUnlock = async () => {
      const running = await audio.start();
      audio.setPlayhead(chapterFloat);
      if (running) {
        setAudioStarted(true);
        setMuted(audio.isMuted());
        unlockEvents.forEach((ev) => window.removeEventListener(ev, tryUnlock));
      }
    };
    unlockEvents.forEach((ev) =>
      window.addEventListener(ev, tryUnlock, { passive: true })
    );

    // --- Long press → deep-scan environment variation (Pointer Events) ---
    let pressTimer: ReturnType<typeof setTimeout> | null = null;

    const isInteractive = (target: EventTarget | null) =>
      target instanceof Element && !!target.closest("button, a");

    const onPointerDown = (e: PointerEvent) => {
      if (isInteractive(e.target)) return; // don't hijack buttons/links
      if (pressTimer) clearTimeout(pressTimer);
      pressTimer = setTimeout(() => {
        variationTarget = 1;
        setScanning(true);
      }, LONG_PRESS_MS);
    };
    const endPress = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      variationTarget = 0;
      setScanning(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", endPress);
    window.addEventListener("pointercancel", endPress);
    window.addEventListener("pointerleave", endPress);

    // --- Resize ---
    const onResize = () => {
      sceneManager.resize();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      unlockEvents.forEach((ev) => window.removeEventListener(ev, tryUnlock));
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", endPress);
      window.removeEventListener("pointercancel", endPress);
      window.removeEventListener("pointerleave", endPress);
      window.removeEventListener("resize", onResize);
      if (pressTimer) clearTimeout(pressTimer);
      st.kill();
      audio.dispose();
      sceneManager.dispose();
    };
  }, []);

  const handleToggleMute = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.isStarted() || !audio.isRunning()) {
      await audio.start();
      audio.setPlayhead(0);
    }
    setAudioStarted(audio.isRunning());
    setMuted(audio.toggleMute());
  };

  return (
    <>
      {webglFailed ? (
        <div className="scene-fallback" />
      ) : (
        <canvas ref={canvasRef} className="scene-canvas" />
      )}

      {/* Deep-scan overlay effect (long press) */}
      <div className={`scan-overlay${scanning ? " active" : ""}`} aria-hidden />

      <Overlay
        activeIndex={activeIndex}
        loaded={loaded}
        muted={muted}
        audioStarted={audioStarted}
        scanning={scanning}
        onToggleMute={handleToggleMute}
      />

      <div ref={trackRef} className="scroll-track">
        {CHAPTERS.map((c) => (
          <section key={c.id} className="chapter-spacer" aria-label={c.name} />
        ))}
      </div>
    </>
  );
}
