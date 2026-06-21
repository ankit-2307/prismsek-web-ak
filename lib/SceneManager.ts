import * as THREE from "three";
import { CHAPTERS, CHAPTER_COUNT } from "./chapters";
import { SCENE_FACTORIES, ChapterScene } from "./scenes";

/**
 * Owns a single WebGLRenderer + camera and the 5 chapter scenes.
 *
 * Progressive loading: a chapter's scene objects are only built the first time
 * the playhead comes within PRELOAD_RANGE of it. Once built they stay resident.
 *
 * The active chapter (and the one being transitioned to) are rendered with
 * crossfaded opacity; all others are hidden.
 */
const PRELOAD_RANGE = 0.6; // in chapter units (1.0 == one full chapter)

export class SceneManager {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private instances: (ChapterScene | null)[];
  private accents: THREE.Color[];
  private clock = new THREE.Clock();
  private loaded = new Set<number>();

  /** Called when a chapter is lazily initialized — used for "loading" UI/telemetry. */
  onChapterLoaded?: (index: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 9);

    this.scene = new THREE.Scene();
    this.instances = new Array(CHAPTER_COUNT).fill(null);
    this.accents = CHAPTERS.map((c) => new THREE.Color(c.accent));
  }

  private ensureLoaded(index: number) {
    if (index < 0 || index >= CHAPTER_COUNT) return;
    if (this.instances[index]) return;
    const instance = SCENE_FACTORIES[index](this.accents[index]);
    instance.group.visible = false;
    this.scene.add(instance.group);
    this.instances[index] = instance;
    this.loaded.add(index);
    this.onChapterLoaded?.(index);
  }

  /**
   * @param chapterFloat global playhead in chapter units, 0 .. CHAPTER_COUNT-1
   *   (e.g. 1.5 == halfway through chapter 2).
   * @param variation long-press "deep scan" intensity (0..1), applied to the
   *   active chapter scene.
   */
  update(chapterFloat: number, variation = 0) {
    const clamped = Math.max(0, Math.min(CHAPTER_COUNT - 1, chapterFloat));
    const active = Math.floor(clamped);
    const local = clamped - active;
    const elapsed = this.clock.getElapsedTime();

    // Progressively load the active chapter and any neighbour within range.
    this.ensureLoaded(active);
    if (local > 1 - PRELOAD_RANGE) this.ensureLoaded(active + 1);
    if (local < PRELOAD_RANGE) this.ensureLoaded(active - 1);

    // Update + crossfade. The active chapter fades out over its last 20% while
    // the next chapter fades in, giving a smooth film-reel transition.
    const FADE = 0.2;
    for (let i = 0; i < CHAPTER_COUNT; i++) {
      const inst = this.instances[i];
      if (!inst) continue;

      let opacity = 0;
      let localProgress = 0;
      if (i === active) {
        localProgress = local;
        opacity = local > 1 - FADE ? (1 - local) / FADE : 1;
      } else if (i === active + 1) {
        localProgress = 0;
        opacity = local > 1 - FADE ? (local - (1 - FADE)) / FADE : 0;
      }

      const visible = opacity > 0.001;
      inst.group.visible = visible;
      if (visible) {
        inst.setOpacity(opacity);
        // Variation applies to the active chapter only.
        inst.setVariation(i === active ? variation : 0);
        inst.update(localProgress, elapsed);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  loadedChapters(): number[] {
    return [...this.loaded].sort((a, b) => a - b);
  }

  dispose() {
    for (const inst of this.instances) {
      if (inst) {
        this.scene.remove(inst.group);
        inst.dispose();
      }
    }
    this.renderer.dispose();
  }
}
