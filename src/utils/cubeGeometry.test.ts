import { describe, it, expect } from 'vitest';
import type { CubeState, Color, Face } from '../types/cube';
import { FACE } from '../types/cube';
import {
  ALL_EDGE_SLOTS,
  EDGE_SLOTS,
  readEdge,
  findEdge,
} from './cubeGeometry';

function face(color: Color): Face {
  return Array(9).fill(color) as Face;
}

// Solved cube. FACE order: U=0(W), D=1(Y), F=2(G), B=3(B), R=4(R), L=5(O)
function solvedState(): CubeState {
  return {
    faces: [
      face('W'), // U
      face('Y'), // D
      face('G'), // F
      face('B'), // B
      face('R'), // R
      face('O'), // L
    ],
  };
}

// Expected centre-colour pair at each slot on a solved cube.
// Derived from the cube: U=W, D=Y, F=G, B=B, R=R, L=O.
const EXPECTED_SOLVED_EDGES: Record<string, [Color, Color]> = {
  UB: ['W', 'B'],
  UF: ['W', 'G'],
  UL: ['W', 'O'],
  UR: ['W', 'R'],
  FL: ['G', 'O'],
  FR: ['G', 'R'],
  BL: ['B', 'O'],
  BR: ['B', 'R'],
  DF: ['Y', 'G'],
  DB: ['Y', 'B'],
  DL: ['Y', 'O'],
  DR: ['Y', 'R'],
};

describe('EDGE_SLOTS table', () => {
  it('has all 12 slots', () => {
    expect(ALL_EDGE_SLOTS).toHaveLength(12);
    expect(Object.keys(EDGE_SLOTS)).toHaveLength(12);
  });

  it('each slot has two sticker positions', () => {
    for (const slot of ALL_EDGE_SLOTS) {
      const [a, b] = EDGE_SLOTS[slot];
      expect(a.face).toBeGreaterThanOrEqual(0);
      expect(a.face).toBeLessThanOrEqual(5);
      expect(a.index).toBeGreaterThanOrEqual(0);
      expect(a.index).toBeLessThanOrEqual(8);
      expect(b.face).toBeGreaterThanOrEqual(0);
      expect(b.face).toBeLessThanOrEqual(5);
      expect(b.index).toBeGreaterThanOrEqual(0);
      expect(b.index).toBeLessThanOrEqual(8);
    }
  });

  it('covers 24 distinct sticker positions (no duplicates across slots)', () => {
    const seen = new Set<string>();
    for (const slot of ALL_EDGE_SLOTS) {
      for (const pos of EDGE_SLOTS[slot]) {
        const key = `${pos.face}:${pos.index}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
    expect(seen.size).toBe(24);
  });

  it('never uses centre stickers (index 4) or corner stickers (0/2/6/8)', () => {
    for (const slot of ALL_EDGE_SLOTS) {
      for (const pos of EDGE_SLOTS[slot]) {
        expect([1, 3, 5, 7]).toContain(pos.index);
      }
    }
  });
});

describe('readEdge on a solved cube', () => {
  const state = solvedState();
  for (const slot of ALL_EDGE_SLOTS) {
    it(`slot ${slot} reads as ${EXPECTED_SOLVED_EDGES[slot].join('/')}`, () => {
      expect(readEdge(state, slot)).toEqual(EXPECTED_SOLVED_EDGES[slot]);
    });
  }
});

describe('findEdge on a solved cube', () => {
  const state = solvedState();

  it('finds white-green at UF, primary orientation (W on U)', () => {
    const loc = findEdge(state, 'W', 'G');
    expect(loc).toEqual({ slot: 'UF', orientation: 'primary' });
  });

  it('finds green-white at UF, secondary orientation (args flipped)', () => {
    const loc = findEdge(state, 'G', 'W');
    expect(loc).toEqual({ slot: 'UF', orientation: 'secondary' });
  });

  it('finds all 4 white edges in the top layer with primary orientation', () => {
    expect(findEdge(state, 'W', 'B')).toEqual({ slot: 'UB', orientation: 'primary' });
    expect(findEdge(state, 'W', 'G')).toEqual({ slot: 'UF', orientation: 'primary' });
    expect(findEdge(state, 'W', 'O')).toEqual({ slot: 'UL', orientation: 'primary' });
    expect(findEdge(state, 'W', 'R')).toEqual({ slot: 'UR', orientation: 'primary' });
  });

  it('returns null for a nonexistent colour pair', () => {
    // White-Yellow edge does not exist (opposite centres never share a cubie).
    expect(findEdge(state, 'W', 'Y')).toBeNull();
  });
});

describe('findEdge on a cube with a flipped edge', () => {
  // Flip the UF edge: put G on U[7] and W on F[1].
  function flippedUF(): CubeState {
    const s = solvedState();
    s.faces[FACE.U][7] = 'G';
    s.faces[FACE.F][1] = 'W';
    return s;
  }

  it('findEdge(W,G) now reports UF secondary (white is on F, not U)', () => {
    const loc = findEdge(flippedUF(), 'W', 'G');
    expect(loc).toEqual({ slot: 'UF', orientation: 'secondary' });
  });
});

describe('findEdge on a cube with a displaced edge', () => {
  // Swap UF ↔ DF: white-green edge now lives in the bottom layer, white down.
  function whiteGreenOnBottom(): CubeState {
    const s = solvedState();
    // UF stickers become the yellow-green pair
    s.faces[FACE.U][7] = 'Y';
    s.faces[FACE.F][1] = 'G';
    // DF stickers become the white-green pair (white on D = primary)
    s.faces[FACE.D][1] = 'W';
    s.faces[FACE.F][7] = 'G';
    return s;
  }

  it('finds W-G at DF primary (white facing down)', () => {
    const loc = findEdge(whiteGreenOnBottom(), 'W', 'G');
    expect(loc).toEqual({ slot: 'DF', orientation: 'primary' });
  });
});
