import * as THREE from "three";
import { ChapterScene } from "./types";
import { createGlowTexture, smoothstep } from "./glow";

// Chapter 1 — Genesis: a single glowing point in the void, with a wireframe
// prism (octahedron) slowly forming and rotating around it.
export function createGenesisScene(accent: THREE.Color): ChapterScene {
  const group = new THREE.Group();

  // The source point of light.
  const glowTexture = createGlowTexture();
  const spriteMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    color: new THREE.Color(0xffffff),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.setScalar(2.5);
  group.add(sprite);

  // Wireframe prism forming around the source.
  const prismGeo = new THREE.OctahedronGeometry(2.2, 0);
  const prismMat = new THREE.MeshBasicMaterial({
    color: accent,
    wireframe: true,
    transparent: true,
    opacity: 0.0,
  });
  const prism = new THREE.Mesh(prismGeo, prismMat);
  group.add(prism);

  // A faint sparse star field for depth.
  const starCount = 400;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 40;
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 40;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0x8888aa,
    size: 0.06,
    transparent: true,
    opacity: 0.6,
  });
  const stars = new THREE.Points(starGeo, starMat);
  group.add(stars);

  const baseAccent = accent.clone();
  const white = new THREE.Color(0xffffff);
  let opacity = 1;
  let variation = 0;

  return {
    group,
    update(local, elapsed) {
      const form = smoothstep(local * 1.4);
      // Deep scan: prism brightens toward white and spins faster.
      prismMat.color.copy(baseAccent).lerp(white, variation * 0.8);
      prismMat.opacity = (form * 0.9 + variation * 0.1) * opacity;
      prism.scale.setScalar((0.4 + form * 0.8) * (1 + variation * 0.25));
      prism.rotation.x = elapsed * (0.15 + variation * 0.4);
      prism.rotation.y = elapsed * (0.25 + variation * 0.5);

      const pulse = 2.3 + Math.sin(elapsed * 1.5) * 0.25 + variation * 0.6;
      sprite.scale.setScalar(pulse);
      spriteMaterial.opacity = (0.7 + 0.3 * Math.sin(elapsed * 1.5)) * opacity;

      stars.rotation.y = elapsed * 0.02;
      starMat.opacity = (0.6 + variation * 0.4) * opacity;
    },
    setOpacity(o) {
      opacity = o;
    },
    setVariation(v) {
      variation = v;
    },
    dispose() {
      prismGeo.dispose();
      prismMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      spriteMaterial.dispose();
      glowTexture.dispose();
    },
  };
}
