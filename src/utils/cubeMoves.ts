// Cube move simulator: applies face turns to a CubeState.
//
// Used by the white cross move resolver (BFS over short sequences) and by
// tests. Not used in the live UI flow — moves there are previewed by the 3D
// viewer, not simulated against state.

import type { CubeState, Face } from '../types/cube';
import { FACE } from '../types/cube';

export type Move =
  | 'U' | "U'" | 'U2'
  | 'D' | "D'" | 'D2'
  | 'F' | "F'" | 'F2'
  | 'B' | "B'" | 'B2'
  | 'R' | "R'" | 'R2'
  | 'L' | "L'" | 'L2';

// Clone a CubeState (deep enough — faces are arrays of primitives).
function cloneState(state: CubeState): CubeState {
  return { faces: state.faces.map(f => [...f] as Face) as CubeState['faces'] };
}

// Apply a 4-cycle to an array in-place: a → b → c → d → a (one CW step).
function cycle4<T>(arr: T[], a: number, b: number, c: number, d: number) {
  const t = arr[a];
  arr[a] = arr[d];
  arr[d] = arr[c];
  arr[c] = arr[b];
  arr[b] = t;
}

// Rotate a 9-sticker face 90° clockwise (as viewed from outside that face).
//   0 1 2        6 3 0
//   3 4 5  -->   7 4 1
//   6 7 8        8 5 2
function rotateFaceCW(face: Face) {
  cycle4(face, 0, 2, 8, 6);
  cycle4(face, 1, 5, 7, 3);
}

// Each face turn rotates the face's own 9 stickers and cycles 12 stickers
// in the side ring around it. Below: the side rings, expressed as 4 groups
// of 3 sticker positions, in CW order (matching rotateFaceCW direction).
//
// Verified against the EDGE_SLOTS pairings in cubeGeometry.ts so a U turn
// takes UF → UL → UB → UR → UF, etc.

interface SideRing {
  // Four 3-tuples [face, idx, idx, idx] cycled in CW order.
  rings: Array<[number, number, number, number]>;
}

const SIDE_RINGS: Record<'U' | 'D' | 'F' | 'B' | 'R' | 'L', SideRing> = {
  // U CW (from above): F-top → L-top → B-top → R-top → F-top.
  // F top row = F[0,1,2]; L top row = L[0,1,2]; B top row = B[0,1,2]; R top row = R[0,1,2].
  U: {
    rings: [
      [FACE.F, 0, 1, 2],
      [FACE.L, 0, 1, 2],
      [FACE.B, 0, 1, 2],
      [FACE.R, 0, 1, 2],
    ],
  },

  // D CW (from below): F-bottom → R-bottom → B-bottom → L-bottom → F-bottom.
  D: {
    rings: [
      [FACE.F, 6, 7, 8],
      [FACE.R, 6, 7, 8],
      [FACE.B, 6, 7, 8],
      [FACE.L, 6, 7, 8],
    ],
  },

  // F CW (from front): U-bottom row → R-left col → D-top row (reversed) → L-right col (reversed) → U-bottom.
  // U bottom row = U[6,7,8] (in cube order: front-left, front-mid, front-right).
  // R left col   = R[0,3,6] (R[0]=top-front, R[3]=mid-front, R[6]=bottom-front).
  // D top row    = D[2,1,0] (D viewed from below with FRONT at top: D[0,1,2] is the front row but mirrored;
  //                          to follow the CW order from F's view we read it as 2,1,0).
  // L right col  = L[8,5,2] (L[2]=top-front, L[5]=mid-front, L[8]=bottom-front; reversed for CW order).
  F: {
    rings: [
      [FACE.U, 6, 7, 8],
      [FACE.R, 0, 3, 6],
      [FACE.D, 2, 1, 0],
      [FACE.L, 8, 5, 2],
    ],
  },

  // B CW (from behind): U-top row (reversed) → L-left col → D-bottom row → R-right col (reversed) → U-top.
  // U top row    = U[0,1,2]; from B's view this reads right-to-left so reverse: [2,1,0].
  // L left col   = L[0,3,6] (L[0]=top-back, L[3]=mid-back, L[6]=bottom-back).
  // D bottom row = D[6,7,8] (D[6]=back-left, D[7]=back-mid, D[8]=back-right; from B's view L↔R swap, but we just need a consistent CW cycle).
  // R right col  = R[8,5,2] (R[2]=top-back, R[5]=mid-back, R[8]=bottom-back; reversed).
  B: {
    rings: [
      [FACE.U, 2, 1, 0],
      [FACE.L, 0, 3, 6],
      [FACE.D, 6, 7, 8],
      [FACE.R, 8, 5, 2],
    ],
  },

  // R CW (from right): U-right col → B-left col (reversed) → D-right col (reversed) → F-right col → U-right col.
  // U right col  = U[2,5,8].
  // B left col   = B[6,3,0] (B[0]=top-right-of-cube; B-left from B's view = cube-right; reversed for direction).
  // D right col  = D[8,5,2] (reversed).
  // F right col  = F[2,5,8].
  R: {
    rings: [
      [FACE.U, 2, 5, 8],
      [FACE.B, 6, 3, 0],
      [FACE.D, 8, 5, 2],
      [FACE.F, 2, 5, 8],
    ],
  },

  // L CW (from left): U-left col (reversed) → F-left col → D-left col → B-right col (reversed) → U-left col.
  // U left col  = U[0,3,6]; from L's view reversed: [6,3,0].
  // F left col  = F[0,3,6].
  // D left col  = D[0,3,6].
  // B right col = B[2,5,8]; reversed: [8,5,2].
  L: {
    rings: [
      [FACE.U, 6, 3, 0],
      [FACE.F, 0, 3, 6],
      [FACE.D, 0, 3, 6],
      [FACE.B, 8, 5, 2],
    ],
  },
};

function applySingleCW(state: CubeState, faceName: 'U' | 'D' | 'F' | 'B' | 'R' | 'L') {
  rotateFaceCW(state.faces[FACE[faceName]]);

  const ring = SIDE_RINGS[faceName].rings;
  // Each ring entry has 3 stickers; cycle each of the three positions
  // through the four groups in CW order.
  for (let i = 0; i < 3; i++) {
    const [fa, , ,] = ring[0];
    const [fb, , ,] = ring[1];
    const [fc, , ,] = ring[2];
    const [fd, , ,] = ring[3];
    const ia = ring[0][i + 1];
    const ib = ring[1][i + 1];
    const ic = ring[2][i + 1];
    const id = ring[3][i + 1];
    const t = state.faces[fa][ia];
    state.faces[fa][ia] = state.faces[fd][id];
    state.faces[fd][id] = state.faces[fc][ic];
    state.faces[fc][ic] = state.faces[fb][ib];
    state.faces[fb][ib] = t;
  }
}

// Apply one move (e.g. "R", "U'", "F2") to a cube state, returning a new state.
export function applyMove(state: CubeState, move: Move): CubeState {
  const next = cloneState(state);
  const faceName = move[0] as 'U' | 'D' | 'F' | 'B' | 'R' | 'L';
  const suffix = move.slice(1);
  const turns = suffix === '2' ? 2 : suffix === "'" ? 3 : 1;
  for (let i = 0; i < turns; i++) applySingleCW(next, faceName);
  return next;
}

// Apply a sequence of moves.
export function applyMoves(state: CubeState, moves: Move[]): CubeState {
  return moves.reduce<CubeState>((s, m) => applyMove(s, m), state);
}

export const ALL_MOVES: Move[] = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
  'R', "R'", 'R2',
  'L', "L'", 'L2',
];
