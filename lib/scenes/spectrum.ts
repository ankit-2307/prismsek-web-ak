import * as THREE from "three";
import { ChapterScene } from "./types";
import { createGlowTexture, lerp } from "./glow";

// Chapter 3 — Spectrum: a large particle field that scatters outward into a
// living cloud of color as the chapter progresses.
export function createSpectrumScene(accent: THREE.Color): ChapterScene {
  const group = new THREE.Group();

  const count = 4000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const targets = new Float32Array(count * 3); // expanded positions

  const color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    // Start clustered near the center.
    const r0 = Math.random() * 0.6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r0 * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r0 * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r0 * Math.cos(phi);

    // Expanded target on a larger sphere shell.
    const r1 = 4 + Math.random() * 5;
    targets[i * 3] = r1 * Math.sin(phi) * Math.cos(theta);
    targets[i * 3 + 1] = r1 * Math.sin(phi) * Math.sin(theta);
    targets[i * 3 + 2] = r1 * Math.cos(phi);

    // Rainbow hue across the field, tinted toward the chapter accent.
    color.setHSL((i / count) * 0.8 + 0.3, 0.7, 0.6);
    color.lerp(accent, 0.25);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.12,
    map: createGlowTexture(),
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 1,
  });

  const points = new THREE.Points(geo, mat);
  group.add(points);

  const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
  const colAttr = geo.getAttribute("color") as THREE.BufferAttribute;

  // Mark ~1 in 6 points as "hidden sensitive data" — revealed in red during a
  // long-press deep scan. This is the DLP metaphor made literal.
  const baseColors = colors.slice();
  const threat = new THREE.Color(0xff2d55);
  const isThreat = new Array(count)
    .fill(false)
    .map((_, i) => i % 6 === 0);

  let opacity = 1;
  let variation = 0;
  let lastVariation = -1;

  const applyThreatColors = (v: number) => {
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      if (isThreat[i]) {
        colAttr.array[ix] = lerp(baseColors[ix], threat.r, v);
        colAttr.array[ix + 1] = lerp(baseColors[ix + 1], threat.g, v);
        colAttr.array[ix + 2] = lerp(baseColors[ix + 2], threat.b, v);
      }
    }
    colAttr.needsUpdate = true;
  };

  return {
    group,
    update(local, elapsed) {
      const t = local; // 0 clustered -> 1 expanded
      for (let i = 0; i < count; i++) {
        const ix = i * 3;
        posAttr.array[ix] = lerp(positions[ix], targets[ix], t);
        posAttr.array[ix + 1] = lerp(positions[ix + 1], targets[ix + 1], t);
        posAttr.array[ix + 2] = lerp(positions[ix + 2], targets[ix + 2], t);
      }
      posAttr.needsUpdate = true;
      points.rotation.y = elapsed * (0.08 + variation * 0.2);
      points.rotation.x = Math.sin(elapsed * 0.1) * 0.2;
      mat.size = 0.12 + variation * 0.06;
      mat.opacity = opacity;

      if (variation !== lastVariation) {
        applyThreatColors(variation);
        lastVariation = variation;
      }
    },
    setOpacity(o) {
      opacity = o;
    },
    setVariation(v) {
      variation = v;
    },
    dispose() {
      geo.dispose();
      mat.map?.dispose();
      mat.dispose();
    },
  };
}
