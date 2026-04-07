import { describe, it, expect } from 'vitest';
import type { CubeState, Color, Face } from '../types/cube';
import { FACE } from '../types/cube';
import { applyMoves, type Move } from './cubeMoves';
import { findInsertionSequence } from './whiteCrossResolver';
import { diagnoseWhiteCrossEdges } from './whiteCrossDiagnosis';

function face(c: Color): Face {
  return [c, c, c, c, c, c, c, c, c];
}

function solved(): CubeState {
  return {
    faces: [face('W'), face('Y'), face('G'), face('B'), face('R'), face('O')],
  };
}

// For each scramble, the resolver should produce a sequence that — when
// applied — leaves the target white edge solved (white on top, side colour
// matching the centre).
describe('findInsertionSequence — solves UF target across scrambles', () => {
  // Each scramble is a single move from solved (so we know exactly which case
  // it produces and we don't need to worry about other edges interacting).
  const scrambles: Move[] = [
    'F', "F'", 'F2',
    'U', "U'", 'U2',
    'R', 'R2',
    'L', 'L2',
    'D', "D'",
  ];

  for (const m of scrambles) {
    it(`solves UF after ${m}`, () => {
      const state = applyMoves(solved(), [m]);
      const diag = diagnoseWhiteCrossEdges(state).find(d => d.target.slot === 'UF')!;
      const seq = findInsertionSequence(state, diag, 6);
      expect(seq).not.toBeNull();
      const after = applyMoves(state, seq!);
      // White-green edge should be at UF, white on top, green on F.
      expect(after.faces[FACE.U][7]).toBe('W');
      expect(after.faces[FACE.F][1]).toBe('G');
    });
  }
});

describe('findInsertionSequence — handles each target slot', () => {
  for (const targetSlot of ['UB', 'UF', 'UL', 'UR'] as const) {
    it(`solves ${targetSlot} after a scrambling F R U`, () => {
      const state = applyMoves(solved(), ['F', 'R', 'U']);
      const diag = diagnoseWhiteCrossEdges(state).find(d => d.target.slot === targetSlot)!;
      const seq = findInsertionSequence(state, diag, 6);
      expect(seq).not.toBeNull();
      const after = applyMoves(state, seq!);
      const sideColor = diag.target.sideColor;
      // Check the white sticker is on top in the correct slot, and the
      // matching side colour is on the adjacent face.
      const slotIdx: Record<typeof targetSlot, [number, number, number, number]> = {
        UB: [FACE.U, 1, FACE.B, 1],
        UF: [FACE.U, 7, FACE.F, 1],
        UL: [FACE.U, 3, FACE.L, 1],
        UR: [FACE.U, 5, FACE.R, 1],
      };
      const [uf, ui, sf, si] = slotIdx[targetSlot];
      expect(after.faces[uf][ui]).toBe('W');
      expect(after.faces[sf][si]).toBe(sideColor);
    });
  }
});

describe('findInsertionSequence — already solved', () => {
  it('returns an empty sequence', () => {
    const state = solved();
    const diag = diagnoseWhiteCrossEdges(state).find(d => d.target.slot === 'UF')!;
    expect(findInsertionSequence(state, diag, 5)).toEqual([]);
  });
});
