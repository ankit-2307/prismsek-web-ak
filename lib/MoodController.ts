import * as THREE from "three";
import { CHAPTERS, CHAPTER_COUNT } from "./chapters";

/**
 * Shifts the entire UI mood by writing CSS custom properties (--bg, --fg,
 * --accent) on the document root. Colors are linearly interpolated between
 * adjacent chapters so the mood transitions smoothly as the playhead moves.
 */
export class MoodController {
  private root: HTMLElement;
  private bgFrom = new THREE.Color();
  private bgTo = new THREE.Color();
  private fgFrom = new THREE.Color();
  private fgTo = new THREE.Color();
  private accFrom = new THREE.Color();
  private accTo = new THREE.Color();
  private out = new THREE.Color();

  constructor(root: HTMLElement = document.documentElement) {
    this.root = root;
  }

  /** @param chapterFloat playhead in chapter units. */
  apply(chapterFloat: number) {
    const clamped = Math.max(0, Math.min(CHAPTER_COUNT - 1, chapterFloat));
    const a = Math.floor(clamped);
    const b = Math.min(a + 1, CHAPTER_COUNT - 1);
    const t = clamped - a;

    const ca = CHAPTERS[a];
    const cb = CHAPTERS[b];

    this.bgFrom.set(ca.bg);
    this.bgTo.set(cb.bg);
    this.fgFrom.set(ca.fg);
    this.fgTo.set(cb.fg);
    this.accFrom.set(ca.accent);
    this.accTo.set(cb.accent);

    this.setVar("--bg", this.out.copy(this.bgFrom).lerp(this.bgTo, t));
    this.setVar("--fg", this.out.copy(this.fgFrom).lerp(this.fgTo, t));
    this.setVar("--accent", this.out.copy(this.accFrom).lerp(this.accTo, t));
  }

  private setVar(name: string, color: THREE.Color) {
    this.root.style.setProperty(name, `#${color.getHexString()}`);
  }
}
