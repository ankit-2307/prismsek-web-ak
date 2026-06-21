// Generates an on-theme, Draco-compressed crystal model for PrismSek.
//
// Pipeline: build a high-poly faceted gem with Three.js geometry math (no DOM
// needed — BufferGeometry is just typed arrays) -> author a glTF with
// gltf-transform -> weld vertices -> Draco-compress -> write public/models.
//
// Run with: npm run gen:model
// Logs the uncompressed vs Draco-compressed size so the reduction is visible.

import { writeFileSync } from "node:fs";
import * as THREE from "three";
import { Document, NodeIO } from "@gltf-transform/core";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
import { weld, draco } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";

// High subdivision -> lots of triangles, so Draco has something to compress.
const geo = new THREE.IcosahedronGeometry(1, 6);
geo.computeVertexNormals();

const position = new Float32Array(geo.getAttribute("position").array);
const normal = new Float32Array(geo.getAttribute("normal").array);
const triangles = position.length / 9;
console.log(`Source mesh: ${triangles.toLocaleString()} triangles`);

const doc = new Document();
const buffer = doc.createBuffer();

const posAccessor = doc
  .createAccessor()
  .setType("VEC3")
  .setArray(position)
  .setBuffer(buffer);
const normAccessor = doc
  .createAccessor()
  .setType("VEC3")
  .setArray(normal)
  .setBuffer(buffer);

const prim = doc
  .createPrimitive()
  .setAttribute("POSITION", posAccessor)
  .setAttribute("NORMAL", normAccessor);

const mesh = doc.createMesh("PrismSekCrystal").addPrimitive(prim);
const node = doc.createNode("crystal").setMesh(mesh);
doc.createScene().addChild(node);

// Register Draco encoder/decoder for writing.
const io = new NodeIO()
  .registerExtensions([KHRDracoMeshCompression])
  .registerDependencies({
    "draco3d.encoder": await draco3d.createEncoderModule(),
    "draco3d.decoder": await draco3d.createDecoderModule(),
  });

// Measure uncompressed size first (writing does not mutate the document).
const plainIO = new NodeIO();
const plainBytes = await plainIO.writeBinary(doc);
const uncompressed = plainBytes.byteLength;

// Weld (creates indices + dedupes) then Draco-compress.
await doc.transform(weld(), draco());

const glb = await io.writeBinary(doc);
writeFileSync("public/models/crystal.glb", glb);

const compressed = glb.byteLength;
const reduction = Math.round((1 - compressed / uncompressed) * 100);
console.log(
  `Uncompressed glb: ${(uncompressed / 1024).toFixed(1)} KB\n` +
    `Draco glb:        ${(compressed / 1024).toFixed(1)} KB\n` +
    `Reduction:        ${reduction}%\n` +
    `Wrote public/models/crystal.glb`
);
