import * as THREE from "three";
import { ChapterScene } from "./types";
import { smoothstep } from "./glow";

// Chapter 2 — Refraction: a glass-like prism splitting an incoming beam into a
// fan of spectral lines.
export function createRefractionScene(_accent: THREE.Color): ChapterScene {
  const group = new THREE.Group();

  // Central prism — a triangular extrusion built from a cylinder with 3 sides.
  const prismGeo = new THREE.CylinderGeometry(1.6, 1.6, 1.4, 3, 1);
  const prismMat = new THREE.MeshStandardMaterial({
    color: 0xaad4ff,
    metalness: 0.1,
    roughness: 0.05,
    transparent: true,
    opacity: 0.35,
    emissive: 0x111133,
  });
  const prism = new THREE.Mesh(prismGeo, prismMat);
  prism.rotation.x = Math.PI / 2;
  group.add(prism);

  // Edge highlight on the prism.
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(prismGeo),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
  );
  edges.rotation.x = Math.PI / 2;
  group.add(edges);

  // Incoming white beam.
  const beamGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-9, 0, 0),
    new THREE.Vector3(0, 0, 0),
  ]);
  const beamMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
  });
  const beam = new THREE.Line(beamGeo, beamMat);
  group.add(beam);

  // Outgoing spectrum — 7 colored beams fanning out at different angles.
  const spectrumColors = [
    0xff0040, 0xff7a00, 0xffd000, 0x33ff66, 0x00c8ff, 0x4060ff, 0xa040ff,
  ];
  const fans: THREE.Line[] = [];
  const fanMats: THREE.LineBasicMaterial[] = [];
  spectrumColors.forEach((color, i) => {
    const angle = (i - 3) * 0.09;
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
    });
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(10, Math.sin(angle) * 10, 0),
    ]);
    const line = new THREE.Line(geo, mat);
    fans.push(line);
    fanMats.push(mat);
    group.add(line);
  });

  // Lighting for the standard material.
  const key = new THREE.PointLight(0xffffff, 30, 50);
  key.position.set(4, 5, 6);
  group.add(key);
  const ambient = new THREE.AmbientLight(0x404060, 1.2);
  group.add(ambient);

  let opacity = 1;
  let variation = 0;

  return {
    group,
    update(local, elapsed) {
      // Deep scan: prism spins faster and the spectrum flares brighter/wider.
      prism.rotation.z = elapsed * (0.2 + variation * 0.6);
      edges.rotation.z = prism.rotation.z;

      const split = smoothstep(local * 1.3);
      beamMat.opacity = 0.9 * opacity;
      fanMats.forEach((m, i) => {
        const stagger = Math.max(0, split - i * 0.04);
        const flare = 0.6 + 0.4 * Math.sin(elapsed * (2 + variation * 4) + i);
        m.opacity =
          Math.min(1, stagger * 1.5 + variation * 0.6) * flare * opacity;
      });
      prismMat.opacity = (0.35 + variation * 0.25) * opacity;
      group.scale.setScalar(1 + variation * 0.12);
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
      beamGeo.dispose();
      beamMat.dispose();
      fans.forEach((f) => f.geometry.dispose());
      fanMats.forEach((m) => m.dispose());
      (edges.geometry as THREE.BufferGeometry).dispose();
      (edges.material as THREE.Material).dispose();
    },
  };
}
