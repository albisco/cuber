// Shared low-level geometry: mapping between cubelet coordinates (x,y,z in
// {-1,0,1}) and the 54-sticker CubeState representation. See moveEngine.ts
// for the derivation of the row/col formulas (they mirror CubeViewer.tsx's
// documented cubelet <-> face mapping).

export type Vec3 = readonly [number, number, number];

// Outward normal per face, indexed to match FACE = { U:0, D:1, F:2, B:3, R:4, L:5 }.
export const FACE_AXIS: Vec3[] = [
  [0, 1, 0],   // U
  [0, -1, 0],  // D
  [0, 0, 1],   // F
  [0, 0, -1],  // B
  [1, 0, 0],   // R
  [-1, 0, 0],  // L
];

export function stickerIndex(faceIdx: number, x: number, y: number, z: number): number {
  switch (faceIdx) {
    case 0: return (z + 1) * 3 + (x + 1); // U
    case 1: return (1 - z) * 3 + (x + 1); // D
    case 2: return (1 - y) * 3 + (x + 1); // F
    case 3: return (1 - y) * 3 + (1 - x); // B
    case 4: return (1 - y) * 3 + (z + 1); // R
    case 5: return (1 - y) * 3 + (1 - z); // L
    default: throw new Error(`Invalid face index: ${faceIdx}`);
  }
}

export function isOutward(faceIdx: number, x: number, y: number, z: number): boolean {
  const [ax, ay, az] = FACE_AXIS[faceIdx];
  if (ax !== 0) return x === ax;
  if (ay !== 0) return y === ay;
  return z === az;
}
