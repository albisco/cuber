import { describe, it, expect } from 'vitest';
import type { CubeState, Color, Face } from '../types/cube';
import {
  isWhiteCrossComplete,
  isFirstLayerComplete,
  isYellowFaceComplete,
  isSolved,
  getCurrentStage,
  validateCubeState,
} from './stageCompletion';

// Build a face filled with one color, optionally overriding specific stickers.
function face(color: Color, overrides: Partial<Record<number, Color>> = {}): Face {
  const f = Array(9).fill(color) as Face;
  for (const [i, c] of Object.entries(overrides)) f[Number(i)] = c as Color;
  return f;
}

// Solved cube: each face all one color.
// FACE order: U=0(W), D=1(Y), F=2(G), B=3(B), R=4(R), L=5(O)
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

describe('isSolved', () => {
  it('returns true for a solved cube', () => {
    expect(isSolved(solvedState())).toBe(true);
  });

  it('returns false when one sticker is wrong', () => {
    const s = solvedState();
    s.faces[0][0] = 'Y';
    expect(isSolved(s)).toBe(false);
  });
});

describe('isWhiteCrossComplete', () => {
  it('is true on solved cube', () => {
    expect(isWhiteCrossComplete(solvedState())).toBe(true);
  });

  it('is false when a U edge is not white', () => {
    const s = solvedState();
    s.faces[0][1] = 'Y'; // U top edge not white
    expect(isWhiteCrossComplete(s)).toBe(false);
  });

  it('is false when a side edge does not match centre', () => {
    const s = solvedState();
    // U[7]=W but F[1] should be F[4]=G; set it to R
    s.faces[2][1] = 'R';
    expect(isWhiteCrossComplete(s)).toBe(false);
  });
});

describe('isFirstLayerComplete', () => {
  it('is true on solved cube', () => {
    expect(isFirstLayerComplete(solvedState())).toBe(true);
  });

  it('is false when a U corner is not white', () => {
    const s = solvedState();
    s.faces[0][0] = 'R';
    expect(isFirstLayerComplete(s)).toBe(false);
  });
});

describe('isYellowFaceComplete', () => {
  it('is true on solved cube', () => {
    expect(isYellowFaceComplete(solvedState())).toBe(true);
  });

  it('is false when a D sticker is not yellow', () => {
    const s = solvedState();
    s.faces[1][0] = 'R';
    expect(isYellowFaceComplete(s)).toBe(false);
  });
});

describe('getCurrentStage', () => {
  it('returns final-solve on solved cube', () => {
    expect(getCurrentStage(solvedState())).toBe('final-solve');
  });

  it('returns white-cross on a blank cube', () => {
    const s: CubeState = { faces: [
      face('W'), face('Y'), face('G'), face('B'), face('R'), face('O'),
    ]};
    // break the cross
    s.faces[0][1] = 'R';
    expect(getCurrentStage(s)).toBe('white-cross');
  });
});

describe('validateCubeState', () => {
  it('accepts a solved cube', () => {
    expect(validateCubeState(solvedState()).valid).toBe(true);
  });

  it('rejects when a color count is wrong', () => {
    const s = solvedState();
    s.faces[0][0] = 'Y'; // one extra Y, one fewer W
    const result = validateCubeState(s);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/white/i);
  });

  it('rejects when colour counts are unbalanced (extra swap leaves 10Y/8W)', () => {
    const s = solvedState();
    // Change two U-face stickers to Y — now 7W and 11Y
    s.faces[0][0] = 'Y';
    s.faces[0][2] = 'Y';
    const result = validateCubeState(s);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/white/i);
  });
});
