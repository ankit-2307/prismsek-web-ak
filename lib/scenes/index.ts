import { ChapterSceneFactory } from "./types";
import { createGenesisScene } from "./genesis";
import { createRefractionScene } from "./refraction";
import { createSpectrumScene } from "./spectrum";
import { createConvergenceScene } from "./convergence";
import { createHorizonScene } from "./horizon";

// Ordered to match CHAPTERS in lib/chapters.ts. The SceneManager calls the
// factory for a chapter the first time that chapter is approached.
export const SCENE_FACTORIES: ChapterSceneFactory[] = [
  createGenesisScene,
  createRefractionScene,
  createSpectrumScene,
  createConvergenceScene,
  createHorizonScene,
];

export type { ChapterScene, ChapterSceneFactory } from "./types";
