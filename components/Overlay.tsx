"use client";

import { CHAPTERS, CHAPTER_COUNT } from "@/lib/chapters";

interface OverlayProps {
  activeIndex: number;
  loaded: Set<number>;
  muted: boolean;
  audioStarted: boolean;
  scanning: boolean;
  onToggleMute: () => void;
}

export default function Overlay({
  activeIndex,
  loaded,
  muted,
  audioStarted,
  scanning,
  onToggleMute,
}: OverlayProps) {
  const chapter = CHAPTERS[activeIndex] ?? CHAPTERS[0];
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === CHAPTER_COUNT - 1;

  return (
    <div className="overlay">
      <nav className="nav">
        <div className="wordmark">
          <span className="dot" />
          PrismSek
          <span className="tag">AI-Native DLP</span>
        </div>
        <button className="mute-btn" onClick={onToggleMute}>
          {muted || !audioStarted ? "Sound Off" : "Sound On"}
        </button>
      </nav>

      {/* key forces a remount so the rise animation replays per chapter */}
      <div className="chapter-copy enter" key={activeIndex}>
        <div className="chapter-eyebrow">
          0{activeIndex + 1} · {chapter.kicker}
        </div>
        <h1 className="chapter-title">{chapter.title}</h1>
        <p className="chapter-subtitle">{chapter.subtitle}</p>

        {chapter.features && (
          <ul className="feature-list">
            {chapter.features.map((f) => (
              <li key={f}>
                <span className="check" /> {f}
              </li>
            ))}
          </ul>
        )}

        {chapter.chips && (
          <div className="chips">
            {chapter.chipsLabel && (
              <span className="chips-label">{chapter.chipsLabel}</span>
            )}
            <div className="chip-row">
              {chapter.chips.map((c) => (
                <span className="chip" key={c}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {chapter.stats && (
          <div className="stats">
            {chapter.stats.map((s) => (
              <div className="stat" key={s.label}>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {isLast && (
          <div className="cta">
            <a className="primary" href="#" onClick={(e) => e.preventDefault()}>
              Request a Demo
            </a>
            <a className="ghost" href="#" onClick={(e) => e.preventDefault()}>
              See How It Works
            </a>
          </div>
        )}
      </div>

      {isFirst && (
        <div className="scroll-hint">
          <span>Scroll to refract</span>
          <span className="line" />
        </div>
      )}

      <div className="dots">
        {CHAPTERS.map((c, i) => (
          <div
            key={c.id}
            className={[
              "dot",
              loaded.has(i) ? "loaded" : "",
              i === activeIndex ? "active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            title={`Chapter ${i + 1}: ${c.name}`}
          />
        ))}
      </div>

      {/* Deep-scan affordance + live status */}
      <div className={`scan-hint${scanning ? " active" : ""}`}>
        {scanning ? (
          <>
            <span className="scan-pip" /> Deep scan active — revealing hidden
            sensitive data
          </>
        ) : (
          <>Press &amp; hold to deep-scan</>
        )}
      </div>

      {!audioStarted && (
        <div className="audio-hint">Interact to enable sound</div>
      )}
    </div>
  );
}
