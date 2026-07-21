// Piece-based lookup on top of the raw 54-sticker CubeState.
//
// The cube uses a fixed Western color scheme (U=white, D=yellow, F=green,
// B=blue, R=red, L=orange — see ManualInput.tsx's FACE_CENTRES), so every
// corner/edge piece is uniquely identified by the *set* of colors painted on
// it; that identity never changes as the cube is turned, only its position
// and orientation do. These helpers let solver code ask "where is the
// white/green/red corner right now, and which way is it facing?" instead of
// pattern-matching fixed sticker positions.

import type { Color, CubeState } from '../types/cube';
import { FACE } from '../types/cube';
import { stickerIndex, isOutward } from './cubeGeometry';

// Fixed solved-state color per face, indexed to match FACE order (U D F B R L).
export const SOLVED_FACE_COLOR: Color[] = ['W', 'Y', 'G', 'B', 'R', 'O'];

const AXIS_FACE = {
  x: { 1: FACE.R, [-1]: FACE.L },
  y: { 1: FACE.U, [-1]: FACE.D },
  z: { 1: FACE.F, [-1]: FACE.B },
} as const;

export interface Sticker {
  face: number;
  index: number;
}

export interface PieceSlot {
  name: string;          // canonical name, e.g. "UFR" or "UF"
  stickers: Sticker[];   // outward stickers, sorted by face index ascending
  solvedColors: Color[]; // solved-state color for each entry in `stickers`, same order
}

function buildSlot(x: number, y: number, z: number): PieceSlot {
  const faces: number[] = [];
  if (x !== 0) faces.push(AXIS_FACE.x[x as 1 | -1]);
  if (y !== 0) faces.push(AXIS_FACE.y[y as 1 | -1]);
  if (z !== 0) faces.push(AXIS_FACE.z[z as 1 | -1]);
  faces.sort((a, b) => a - b);

  const stickers = faces.map(face => ({ face, index: stickerIndex(face, x, y, z) }));
  const solvedColors = faces.map(face => SOLVED_FACE_COLOR[face]);
  const name = faces.map(f => 'UDFBRL'[f]).join('');
  return { name, stickers, solvedColors };
}

// 8 corner slots (all three coordinates +/-1).
export const CORNERS: PieceSlot[] = (() => {
  const slots: PieceSlot[] = [];
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) {
        slots.push(buildSlot(x, y, z));
      }
    }
  }
  return slots;
})();

// 12 edge slots (exactly one coordinate is 0).
export const EDGES: PieceSlot[] = (() => {
  const slots: PieceSlot[] = [];
  for (const [x, y, z] of [
    [0, 1, 1], [0, 1, -1], [0, -1, 1], [0, -1, -1],
    [1, 0, 1], [1, 0, -1], [-1, 0, 1], [-1, 0, -1],
    [1, 1, 0], [1, -1, 0], [-1, 1, 0], [-1, -1, 0],
  ] as const) {
    slots.push(buildSlot(x, y, z));
  }
  return slots;
})();

export const CORNER_BY_NAME: Record<string, PieceSlot> = Object.fromEntries(CORNERS.map(s => [s.name, s]));
export const EDGE_BY_NAME: Record<string, PieceSlot> = Object.fromEntries(EDGES.map(s => [s.name, s]));

// Reads the current colors at a slot, in the same order as slot.stickers / slot.solvedColors.
export function readSlot(state: CubeState, slot: PieceSlot): Color[] {
  return slot.stickers.map(s => state.faces[s.face][s.index]);
}

// The color currently on this slot's sticker that lies on the given face, or null
// if this slot doesn't touch that face at all.
export function colorOnFace(state: CubeState, slot: PieceSlot, face: number): Color | null {
  const idx = slot.stickers.findIndex(s => s.face === face);
  return idx === -1 ? null : state.faces[slot.stickers[idx].face][slot.stickers[idx].index];
}

export function isSlotSolved(state: CubeState, slot: PieceSlot): boolean {
  return readSlot(state, slot).every((c, i) => c === slot.solvedColors[i]);
}

// Finds which slot currently holds the piece identified by its solved color set,
// and returns the slot plus that piece's current colors (in slot sticker order,
// i.e. useful for reading orientation).
export function findPiece(state: CubeState, slots: PieceSlot[], colors: Color[]): { slot: PieceSlot; colors: Color[] } {
  const target = new Set(colors);
  for (const slot of slots) {
    const current = readSlot(state, slot);
    if (current.length === target.size && current.every(c => target.has(c))) {
      return { slot, colors: current };
    }
  }
  throw new Error(`Piece not found for colors: ${colors.join(',')}`);
}

export function findCorner(state: CubeState, colors: [Color, Color, Color]): { slot: PieceSlot; colors: Color[] } {
  return findPiece(state, CORNERS, colors);
}

export function findEdge(state: CubeState, colors: [Color, Color]): { slot: PieceSlot; colors: Color[] } {
  return findPiece(state, EDGES, colors);
}

// Verifies every sticker index (0-53) is covered by exactly one slot's stickers
// plus the 6 centres — used only by tests, but exported for reuse.
export function allSlots(): PieceSlot[] {
  return [...CORNERS, ...EDGES];
}
