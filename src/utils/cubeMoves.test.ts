import { describe, it, expect } from 'vitest';
import type { CubeState, Color, Face } from '../types/cube';
import { applyMove, applyMoves, ALL_MOVES, type Move } from './cubeMoves';
import { findEdge } from './cubeGeometry';

function face(c: Color): Face {
  return [c, c, c, c, c, c, c, c, c];
}

function solved(): CubeState {
  return {
    faces: [face('W'), face('Y'), face('G'), face('B'), face('R'), face('O')],
  };
}

// Build a unique-sticker cube so we can detect any incorrect permutation.
function unique(): CubeState {
  const colors: Color[] = ['W', 'Y', 'G', 'B', 'R', 'O'];
  return {
    faces: colors.map(c => face(c)) as CubeState['faces'],
  };
}

describe('cubeMoves — sanity', () => {
  it('move applied 4× returns to original', () => {
    for (const m of ['U', 'D', 'F', 'B', 'R', 'L'] as Move[]) {
      const s = solved();
      const r = applyMoves(s, [m, m, m, m]);
      expect(r).toEqual(s);
    }
  });

  it("M then M' is identity", () => {
    for (const m of ['U', 'D', 'F', 'B', 'R', 'L'] as Move[]) {
      const inv = (m + "'") as Move;
      const r = applyMoves(unique(), [m, inv]);
      expect(r).toEqual(unique());
    }
  });

  it('M2 then M2 is identity', () => {
    for (const m of ['U2', 'D2', 'F2', 'B2', 'R2', 'L2'] as Move[]) {
      const r = applyMoves(unique(), [m, m]);
      expect(r).toEqual(unique());
    }
  });

  it('all 18 moves preserve the centre stickers', () => {
    for (const m of ALL_MOVES) {
      const r = applyMove(solved(), m);
      for (let f = 0; f < 6; f++) {
        expect(r.faces[f][4]).toBe(solved().faces[f][4]);
      }
    }
  });
});

describe('cubeMoves — known cycles', () => {
  it('U cycles top edges UF → UL → UB → UR → UF', () => {
    // Place a marker at UF and follow it.
    const s = solved();
    s.faces[0][7] = 'Y'; // U[7] = top sticker of UF, normally W
    let r = applyMove(s, 'U');
    expect(r.faces[0][3]).toBe('Y'); // now at UL (U[3])
    r = applyMove(r, 'U');
    expect(r.faces[0][1]).toBe('Y'); // now at UB
    r = applyMove(r, 'U');
    expect(r.faces[0][5]).toBe('Y'); // now at UR
    r = applyMove(r, 'U');
    expect(r.faces[0][7]).toBe('Y'); // back to UF
  });

  it('F2 swaps DF and UF edges', () => {
    const s = solved();
    s.faces[1][1] = 'Y'; // mark D[1] (DF primary)
    s.faces[2][7] = 'O'; // mark F[7] (DF secondary)
    const r = applyMove(s, 'F2');
    expect(r.faces[0][7]).toBe('Y'); // U[7] = UF primary
    expect(r.faces[2][1]).toBe('O'); // F[1] = UF secondary
  });
});

describe('cubeMoves — edge tracking with findEdge', () => {
  it('R takes UR edge (W,R) into BR slot', () => {
    const s = solved();
    // In a solved cube the W-R edge lives at UR.
    expect(findEdge(s, 'W', 'R')!.slot).toBe('UR');
    const r = applyMove(s, 'R');
    // After R the W-R edge is now at BR.
    expect(findEdge(r, 'W', 'R')!.slot).toBe('BR');
  });
});
