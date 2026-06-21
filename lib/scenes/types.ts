import * as THREE from "three";

/**
 * A chapter scene is a self-contained visual unit.
 * - `group` is added to the shared THREE.Scene by the SceneManager.
 * - `update` is called every frame the chapter is active, with the chapter-local
 *   progress (0..1) and the global elapsed time in seconds.
 * - `dispose` frees GPU resources when the scene is torn down.
 */
export interface ChapterScene {
  group: THREE.Group;
  update(local: number, elapsed: number): void;
  setOpacity(opacity: number): void;
  /**
   * Drives the long-press "deep scan" environment variation, 0 (idle) .. 1
   * (full scan). Each scene interprets this in a way that fits the DLP story —
   * e.g. revealing hidden sensitive-data points, intensifying the refraction.
   */
  setVariation(intensity: number): void;
  dispose(): void;
}

export type ChapterSceneFactory = (accent: THREE.Color) => ChapterScene;
