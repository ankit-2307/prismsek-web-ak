import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { ChapterScene } from "./types";
import { createGlowTexture } from "./glow";

// Chapter 5 — Horizon: the resolved PrismSek crystal.
//
// The crystal is a Draco-compressed glTF (public/models/crystal.glb, generated
// by scripts/make-crystal.mjs). Because the SceneManager only builds this scene
// when the playhead approaches chapter 5, the model is fetched + Draco-decoded
// lazily — progressive loading. A procedural crystal stands in until the asset
// arrives, and remains as a fallback if the load fails.
export function createHorizonScene(accent: THREE.Color): ChapterScene {
  const group = new THREE.Group();

  // Pivot that we rotate — children get swapped (procedural -> Draco) underneath.
  const pivot = new THREE.Group();
  group.add(pivot);

  const mat = new THREE.MeshStandardMaterial({
    color: accent,
    metalness: 0.3,
    roughness: 0.15,
    emissive: accent.clone().multiplyScalar(0.25),
    flatShading: true,
    transparent: true,
    opacity: 1,
  });

  // Procedural placeholder crystal.
  const placeholderGeo = new THREE.IcosahedronGeometry(2.2, 0);
  const placeholder = new THREE.Mesh(placeholderGeo, mat);
  pivot.add(placeholder);

  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(placeholderGeo),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })
  );
  pivot.add(wire);

  // Soft halo behind the crystal.
  const haloMat = new THREE.SpriteMaterial({
    map: createGlowTexture(),
    color: accent,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.7,
  });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.setScalar(12);
  halo.position.z = -2;
  group.add(halo);

  // Lighting.
  const key = new THREE.PointLight(0xffffff, 40, 60);
  key.position.set(5, 6, 8);
  group.add(key);
  const rim = new THREE.PointLight(accent.getHex(), 25, 60);
  rim.position.set(-6, -3, 4);
  group.add(rim);
  group.add(new THREE.AmbientLight(0x222233, 1.5));

  // --- Progressive Draco load ---
  let disposed = false;
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  gltfLoader.load(
    "/models/crystal.glb",
    (gltf) => {
      if (disposed) return;
      let loadedMesh: THREE.Mesh | null = null;
      gltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) loadedMesh = child as THREE.Mesh;
      });
      if (!loadedMesh) return;

      const mesh = loadedMesh as THREE.Mesh;
      mesh.material = mat; // share the branded material
      mesh.geometry.computeVertexNormals();
      mesh.scale.setScalar(2.2);

      // Swap the placeholder for the real Draco crystal.
      pivot.remove(placeholder, wire);
      placeholderGeo.dispose();
      (wire.geometry as THREE.BufferGeometry).dispose();
      (wire.material as THREE.Material).dispose();

      const meshWire = new THREE.LineSegments(
        new THREE.WireframeGeometry(mesh.geometry),
        new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.18,
        })
      );
      meshWire.scale.setScalar(2.2);
      pivot.add(mesh, meshWire);
    },
    undefined,
    (err) => {
      // Keep the procedural placeholder on failure.
      console.warn("Draco crystal failed to load; using procedural fallback.", err);
    }
  );

  const baseEmissive = accent.clone().multiplyScalar(0.25);
  const white = new THREE.Color(0xffffff);
  let opacity = 1;
  let variation = 0;

  return {
    group,
    update(_local, elapsed) {
      pivot.rotation.y = elapsed * (0.25 + variation * 0.5);
      pivot.rotation.x = Math.sin(elapsed * 0.2) * 0.3;
      // Deep scan: the crystal flares and the halo swells.
      mat.emissive.copy(baseEmissive).lerp(white, variation * 0.5);
      const pulse = 12 + Math.sin(elapsed * 1.2) * 0.8 + variation * 3;
      halo.scale.setScalar(pulse);
      mat.opacity = opacity;
      haloMat.opacity = (0.7 + variation * 0.3) * opacity;
    },
    setOpacity(o) {
      opacity = o;
    },
    setVariation(v) {
      variation = v;
    },
    dispose() {
      disposed = true;
      dracoLoader.dispose();
      mat.dispose();
      pivot.traverse((child) => {
        const m = child as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      haloMat.map?.dispose();
      haloMat.dispose();
    },
  };
}
