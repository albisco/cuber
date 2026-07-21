// Applies standard cube notation moves (U, U', U2, D, F, B, R, L, ...) to a CubeState.
//
// Implementation: each sticker lives on a "cubelet" at integer coordinates
// (x,y,z) in {-1,0,1}^3, with FACE_AXIS[faceIdx] giving the outward direction
// vector for that face (matches FACE order in types/cube.ts: U=0 D=1 F=2 B=3 R=4 L=5).
// A move rigidly rotates every cubelet in the affected layer: its position vector
// and each of its sticker's face-normal vectors both rotate by +/-90 degrees about
// the move's axis. Converting CubeState <-> per-cubelet form uses the row/col
// formulas documented in CubeViewer.tsx.
//
// Move directions are derived from the standard convention "clockwise viewed
// from outside that face" (e.g. U = clockwise viewed from above), independently
// for each face, then cross-checked against universally-known facts (e.g. a U
// turn sends the front face's top row to the right face's top row).

import type { CubeState, Color } from '../types/cube';
import { FACE_AXIS, stickerIndex, isOutward, type Vec3 } from './cubeGeometry';

type Axis = 'x' | 'y' | 'z';
type Dir = 1 | -1;

function rotateVec(v: Vec3, axis: Axis, dir: Dir): Vec3 {
  const [x, y, z] = v;
  switch (axis) {
    case 'x': return dir === 1 ? [x, -z, y] : [x, z, -y];
    case 'y': return dir === 1 ? [z, y, -x] : [-z, y, x];
    case 'z': return dir === 1 ? [-y, x, z] : [y, -x, z];
  }
}

type CubeletColors = Partial<Record<number, Color>>;

function readCubelets(state: CubeState): Map<string, CubeletColors> {
  const map = new Map<string, CubeletColors>();
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        const colors: CubeletColors = {};
        for (let f = 0; f < 6; f++) {
          if (isOutward(f, x, y, z)) colors[f] = state.faces[f][stickerIndex(f, x, y, z)];
        }
        map.set(`${x},${y},${z}`, colors);
      }
    }
  }
  return map;
}

function writeCubelets(map: Map<string, CubeletColors>): CubeState {
  const faces = Array.from({ length: 6 }, () => Array(9).fill(null)) as unknown as CubeState['faces'];
  for (const [key, colors] of map) {
    const [x, y, z] = key.split(',').map(Number);
    for (const [fStr, color] of Object.entries(colors)) {
      const f = Number(fStr);
      faces[f][stickerIndex(f, x, y, z)] = color as Color;
    }
  }
  return { faces };
}

interface MoveDef {
  axis: Axis;
  layer: number; // fixed coordinate value along `axis` that this move's layer occupies
  dir: Dir;      // rotation direction for the plain (non-prime) move
}

// "Plain" move = clockwise viewed from outside that face. Directions derived
// independently per face from the rotateVec convention above.
const MOVE_DEFS: Record<string, MoveDef> = {
  U: { axis: 'y', layer: 1, dir: 1 },
  D: { axis: 'y', layer: -1, dir: -1 },
  F: { axis: 'z', layer: 1, dir: -1 },
  B: { axis: 'z', layer: -1, dir: 1 },
  R: { axis: 'x', layer: 1, dir: -1 },
  L: { axis: 'x', layer: -1, dir: 1 },
};

export const ALL_MOVES: string[] = Object.keys(MOVE_DEFS).flatMap(l => [l, `${l}'`, `${l}2`]);

function applyQuarterTurn(state: CubeState, letter: string, dir: Dir): CubeState {
  const def = MOVE_DEFS[letter];
  const cubelets = readCubelets(state);
  const updates: [string, CubeletColors][] = [];

  for (const [key, colors] of cubelets) {
    const [x, y, z] = key.split(',').map(Number);
    const axisCoord = def.axis === 'x' ? x : def.axis === 'y' ? y : z;
    if (axisCoord !== def.layer) continue;

    const [nx, ny, nz] = rotateVec([x, y, z], def.axis, dir);
    const newColors: CubeletColors = {};
    for (const [fStr, color] of Object.entries(colors)) {
      const f = Number(fStr);
      const nv = rotateVec(FACE_AXIS[f], def.axis, dir);
      const nf = FACE_AXIS.findIndex(v => v[0] === nv[0] && v[1] === nv[1] && v[2] === nv[2]);
      newColors[nf] = color as Color;
    }
    updates.push([`${nx},${ny},${nz}`, newColors]);
  }

  const next = new Map(cubelets);
  for (const [key, colors] of updates) next.set(key, colors);
  return writeCubelets(next);
}

// Applies a single move token (e.g. "R", "R'", "R2") to a cube state.
export function applyMove(state: CubeState, move: string): CubeState {
  const letter = move[0];
  const def = MOVE_DEFS[letter];
  if (!def) throw new Error(`Unknown move: ${move}`);

  if (move.includes('2')) {
    return applyQuarterTurn(applyQuarterTurn(state, letter, def.dir), letter, def.dir);
  }
  const dir: Dir = move.includes("'") ? (-def.dir as Dir) : def.dir;
  return applyQuarterTurn(state, letter, dir);
}

// Applies a sequence of move tokens in order.
export function applyMoves(state: CubeState, moves: string[]): CubeState {
  return moves.reduce((s, m) => applyMove(s, m), state);
}

// Returns the inverse of a single move token.
export function invertMove(move: string): string {
  if (move.includes('2')) return move;
  if (move.includes("'")) return move[0];
  return `${move}'`;
}

// Returns the inverse of a move sequence (reversed order, each move inverted).
export function invertMoves(moves: string[]): string[] {
  return [...moves].reverse().map(invertMove);
}
