import * as THREE from "three";
import { ChapterScene } from "./types";
import { createGlowTexture, lerp, smoothstep } from "./glow";

// Chapter 4 — Convergence: a scattered particle cloud draws inward, resolving
// onto the surface of an ordered crystalline structure (a torus knot).
export function createConvergenceScene(accent: THREE.Color): ChapterScene {
  const group = new THREE.Group();

  const count = 4000;
  const scattered = new Float32Array(count * 3);
  const ordered = new Float32Array(count * 3);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  // Sample target positions from a torus-knot geometry's vertices.
  const knot = new THREE.TorusKnotGeometry(2.4, 0.7, 220, 32);
  const knotPos = knot.getAttribute("position") as THREE.BufferAttribute;
  const vCount = knotPos.count;

  const color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const ix = i * 3;
    // Scattered start: random shell.
    const r = 6 + Math.random() * 4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    scattered[ix] = r * Math.sin(phi) * Math.cos(theta);
    scattered[ix + 1] = r * Math.sin(phi) * Math.sin(theta);
    scattered[ix + 2] = r * Math.cos(phi);

    // Ordered target: a vertex on the knot (with slight jitter).
    const v = Math.floor(Math.random() * vCount);
    ordered[ix] = knotPos.getX(v) + (Math.random() - 0.5) * 0.1;
    ordered[ix + 1] = knotPos.getY(v) + (Math.random() - 0.5) * 0.1;
    ordered[ix + 2] = knotPos.getZ(v) + (Math.random() - 0.5) * 0.1;

    positions[ix] = scattered[ix];
    positions[ix + 1] = scattered[ix + 1];
    positions[ix + 2] = scattered[ix + 2];

    color.copy(accent);
    color.offsetHSL((Math.random() - 0.5) * 0.08, 0, (Math.random() - 0.5) * 0.2);
    colors[ix] = color.r;
    colors[ix + 1] = color.g;
    colors[ix + 2] = color.b;
  }
  knot.dispose();

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.1,
    map: createGlowTexture(),
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  group.add(points);

  const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
  let opacity = 1;
  let variation = 0;

  return {
    group,
    update(local, elapsed) {
      // Deep scan accelerates convergence — remediation snaps into place.
      const t = smoothstep(Math.min(1, local + variation * 0.4));
      for (let i = 0; i < count; i++) {
        const ix = i * 3;
        posAttr.array[ix] = lerp(scattered[ix], ordered[ix], t);
        posAttr.array[ix + 1] = lerp(scattered[ix + 1], ordered[ix + 1], t);
        posAttr.array[ix + 2] = lerp(scattered[ix + 2], ordered[ix + 2], t);
      }
      posAttr.needsUpdate = true;
      group.rotation.y = elapsed * (0.2 + variation * 0.5);
      group.rotation.z = elapsed * 0.05;
      mat.size = 0.1 + variation * 0.05;
      mat.opacity = opacity;
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
