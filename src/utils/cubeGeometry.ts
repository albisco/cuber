// Cube geometry primitives: edge slot layout and cubie lookup.
//
// This file is the AUTHORITATIVE definition of how sticker indices on each
// face map to physical cube positions. All other code (coaching, stage
// detection, scan parser) should rely on the tables here rather than
// rediscovering the layout.
//
// Convention — each face is viewed from OUTSIDE the cube, indexed row-major:
//
//   U (top):    viewed from above, with BACK at the top of the view.
//               U[0]=back-left,  U[1]=back-middle,  U[2]=back-right,
//               U[3]=mid-left,   U[4]=centre,       U[5]=mid-right,
//               U[6]=front-left, U[7]=front-middle, U[8]=front-right.
//
//   D (bottom): viewed from below, with FRONT at the top of the view.
//               D[0]=front-left, D[1]=front-middle, D[2]=front-right,
//               D[3]=mid-left,   D[4]=centre,       D[5]=mid-right,
//               D[6]=back-left,  D[7]=back-middle,  D[8]=back-right.
//
//   F (front): viewed head-on, U at top. Left-right matches the cube.
//   B (back):  viewed head-on from BEHIND, U at top. Left-right is MIRRORED
//              vs. a front view — so B[0] is the cube's top-back-RIGHT corner.
//   R (right): viewed from the right, U at top, F on the viewer's left.
//   L (left):  viewed from the left,  U at top, B on the viewer's left.
//
// This is consistent with the pairings already used in stageCompletion.ts:
//   U[1]↔B[1], U[3]↔L[1], U[5]↔R[1], U[7]↔F[1].

import type { CubeState, Color } from '../types/cube';
import { FACE } from '../types/cube';

// Identifier for each of the 12 edge slots on the cube.
// Naming: two-letter code for the two faces the slot touches.
export type EdgeSlot =
  | 'UB' | 'UF' | 'UL' | 'UR'   // top layer
  | 'FL' | 'FR' | 'BL' | 'BR'   // middle layer
  | 'DF' | 'DB' | 'DL' | 'DR';  // bottom layer

// A sticker position: which face, which index within the face.
export interface StickerPos {
  face: number;   // FACE.U / FACE.D / ...
  index: number;  // 0..8
}

// Every edge slot has exactly two sticker positions.
// Order matters: [primary, secondary]. The primary is the one used for
// "orientation" — we say an edge is "oriented A-on-primary" when colour A
// is on the primary sticker.
//
// Primary convention: for top/bottom layer edges the primary is on U or D
// (the layer face). For middle layer edges the primary is on F or B.
export const EDGE_SLOTS: Record<EdgeSlot, [StickerPos, StickerPos]> = {
  // Top layer
  UB: [{ face: FACE.U, index: 1 }, { face: FACE.B, index: 1 }],
  UF: [{ face: FACE.U, index: 7 }, { face: FACE.F, index: 1 }],
  UL: [{ face: FACE.U, index: 3 }, { face: FACE.L, index: 1 }],
  UR: [{ face: FACE.U, index: 5 }, { face: FACE.R, index: 1 }],

  // Middle layer
  FL: [{ face: FACE.F, index: 3 }, { face: FACE.L, index: 5 }],
  FR: [{ face: FACE.F, index: 5 }, { face: FACE.R, index: 3 }],
  BL: [{ face: FACE.B, index: 5 }, { face: FACE.L, index: 3 }],
  BR: [{ face: FACE.B, index: 3 }, { face: FACE.R, index: 5 }],

  // Bottom layer
  DF: [{ face: FACE.D, index: 1 }, { face: FACE.F, index: 7 }],
  DB: [{ face: FACE.D, index: 7 }, { face: FACE.B, index: 7 }],
  DL: [{ face: FACE.D, index: 3 }, { face: FACE.L, index: 7 }],
  DR: [{ face: FACE.D, index: 5 }, { face: FACE.R, index: 7 }],
};

export const ALL_EDGE_SLOTS: EdgeSlot[] = [
  'UB', 'UF', 'UL', 'UR',
  'FL', 'FR', 'BL', 'BR',
  'DF', 'DB', 'DL', 'DR',
];

// 8 corner slots, each touching 3 faces. Verified against the face-view
// conventions documented at the top of this file.
export type CornerSlot =
  | 'UFL' | 'UFR' | 'UBL' | 'UBR'
  | 'DFL' | 'DFR' | 'DBL' | 'DBR';

export const CORNER_SLOTS: Record<CornerSlot, [StickerPos, StickerPos, StickerPos]> = {
  UFL: [{ face: FACE.U, index: 6 }, { face: FACE.F, index: 0 }, { face: FACE.L, index: 2 }],
  UFR: [{ face: FACE.U, index: 8 }, { face: FACE.F, index: 2 }, { face: FACE.R, index: 0 }],
  UBL: [{ face: FACE.U, index: 0 }, { face: FACE.B, index: 2 }, { face: FACE.L, index: 0 }],
  UBR: [{ face: FACE.U, index: 2 }, { face: FACE.B, index: 0 }, { face: FACE.R, index: 2 }],
  DFL: [{ face: FACE.D, index: 0 }, { face: FACE.F, index: 6 }, { face: FACE.L, index: 8 }],
  DFR: [{ face: FACE.D, index: 2 }, { face: FACE.F, index: 8 }, { face: FACE.R, index: 6 }],
  DBL: [{ face: FACE.D, index: 6 }, { face: FACE.B, index: 8 }, { face: FACE.L, index: 6 }],
  DBR: [{ face: FACE.D, index: 8 }, { face: FACE.B, index: 6 }, { face: FACE.R, index: 8 }],
};

export const ALL_CORNER_SLOTS: CornerSlot[] = [
  'UFL', 'UFR', 'UBL', 'UBR',
  'DFL', 'DFR', 'DBL', 'DBR',
];

export function readCorner(state: CubeState, slot: CornerSlot): [Color, Color, Color] {
  const [a, b, c] = CORNER_SLOTS[slot];
  return [
    state.faces[a.face][a.index],
    state.faces[b.face][b.index],
    state.faces[c.face][c.index],
  ];
}

// Read the two sticker colours at an edge slot.
export function readEdge(state: CubeState, slot: EdgeSlot): [Color, Color] {
  const [a, b] = EDGE_SLOTS[slot];
  return [state.faces[a.face][a.index], state.faces[b.face][b.index]];
}

// Result of locating an edge cubie on the cube.
// `orientation` tells you which of the two requested colours is on the
// slot's PRIMARY sticker:
//   'primary'   — the first colour passed to findEdge is on the primary.
//   'secondary' — the first colour is on the secondary (i.e. the edge is flipped
//                 relative to the caller's expectation).
export interface EdgeLocation {
  slot: EdgeSlot;
  orientation: 'primary' | 'secondary';
}

// Find the single edge cubie with the given two colours.
// Returns null if no such edge exists (malformed cube state).
export function findEdge(
  state: CubeState,
  colorA: Color,
  colorB: Color,
): EdgeLocation | null {
  for (const slot of ALL_EDGE_SLOTS) {
    const [s0, s1] = readEdge(state, slot);
    if (s0 === colorA && s1 === colorB) return { slot, orientation: 'primary' };
    if (s0 === colorB && s1 === colorA) return { slot, orientation: 'secondary' };
  }
  return null;
}
