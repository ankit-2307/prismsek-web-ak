import { CHAPTERS } from "./chapters";

/**
 * Procedural ambient audio with the Web Audio API — no sound files.
 *
 * One oscillator + lowpass filter per chapter, all summed into a master gain.
 * As the playhead moves, chapter gains crossfade so the tone "sound-tracks" the
 * scroll. The AudioContext starts suspended (browser autoplay policy) and is
 * resumed on the first user gesture via `start()`.
 */
interface Voice {
  osc: OscillatorNode;
  sub: OscillatorNode;
  gain: GainNode;
  filter: BiquadFilterNode;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private voices: Voice[] = [];
  private started = false;
  private muted = false;

  /**
   * Create the context + voices and resume playback. MUST be called from inside
   * a user-gesture handler (click / pointerdown / touchstart / keydown) — Safari
   * and iOS will not start audio otherwise.
   *
   * Returns a promise that resolves to whether the context is actually running.
   * Safe to call repeatedly: subsequent calls just attempt resume().
   */
  async start(): Promise<boolean> {
    if (this.started) {
      await this.resumeWithUnlock();
      return this.isRunning();
    }
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return false; // Web Audio unsupported — site stays silent.

    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);

    CHAPTERS.forEach((chapter) => {
      const osc = this.ctx!.createOscillator();
      osc.type = "sine";
      osc.frequency.value = chapter.freq;

      // A detuned sub a fifth below for warmth.
      const sub = this.ctx!.createOscillator();
      sub.type = "triangle";
      sub.frequency.value = chapter.freq * 0.5;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;
      filter.Q.value = 0.7;

      const gain = this.ctx!.createGain();
      gain.gain.value = 0; // silent until selected

      osc.connect(filter);
      sub.connect(filter);
      filter.connect(gain);
      gain.connect(this.master!);

      osc.start(0);
      sub.start(0);

      this.voices.push({ osc, sub, gain, filter });
    });

    this.started = true;
    await this.resumeWithUnlock();
    return this.isRunning();
  }

  /**
   * Resume the context and nudge Safari/iOS awake. Safari often leaves the
   * context "suspended" (or "interrupted" on iOS) until a silent buffer is
   * played inside the gesture, so we play one and then resume.
   */
  private async resumeWithUnlock() {
    if (!this.ctx) return;
    try {
      // Play a one-sample silent buffer — the canonical iOS/Safari unlock.
      const buffer = this.ctx.createBuffer(1, 1, 22050);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);
    } catch {
      /* ignore — best effort */
    }
    try {
      await this.ctx.resume();
    } catch {
      /* ignore */
    }
  }

  isRunning() {
    return this.ctx?.state === "running";
  }

  /**
   * Crossfade voices toward the active chapter.
   * @param chapterFloat playhead in chapter units.
   */
  setPlayhead(chapterFloat: number) {
    if (!this.ctx || !this.started) return;
    const now = this.ctx.currentTime;
    this.voices.forEach((voice, i) => {
      // Triangular weighting: full volume at i, zero a chapter away.
      const distance = Math.abs(chapterFloat - i);
      const weight = Math.max(0, 1 - distance);
      voice.gain.gain.setTargetAtTime(weight * 0.25, now, 0.3);
      // Open the filter a little as a chapter becomes active for brightness.
      voice.filter.frequency.setTargetAtTime(600 + weight * 1200, now, 0.4);
    });
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(
        this.muted ? 0 : 0.5,
        this.ctx.currentTime,
        0.1
      );
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  isStarted() {
    return this.started;
  }

  dispose() {
    this.voices.forEach((v) => {
      try {
        v.osc.stop();
        v.sub.stop();
      } catch {
        /* already stopped */
      }
    });
    this.voices = [];
    this.ctx?.close();
    this.ctx = null;
    this.started = false;
  }
}
