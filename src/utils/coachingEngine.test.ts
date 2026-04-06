import { describe, it, expect } from 'vitest';
import type { CubeState, Color, Face } from '../types/cube';
import { findAlgorithm, getCoachingResult } from './coachingEngine';

function face(color: Color, overrides: Partial<Record<number, Color>> = {}): Face {
  const f = Array(9).fill(color) as Face;
  for (const [i, c] of Object.entries(overrides)) f[Number(i)] = c as Color;
  return f;
}

function solvedState(): CubeState {
  return {
    faces: [
      face('W'), // U=0
      face('Y'), // D=1
      face('G'), // F=2
      face('B'), // B=3
      face('R'), // R=4
      face('O'), // L=5
    ],
  };
}

describe('findAlgorithm', () => {
  it('returns null on a fully solved cube', () => {
    const result = findAlgorithm(solvedState(), 'white-cross');
    expect(result).toBeNull();
  });

  it('returns null when white cross is complete (WC-00 completes stage)', () => {
    // WC-00 case: U edges are white and side stickers match centres.
    // Solved cube has cross complete.
    const result = findAlgorithm(solvedState(), 'white-cross');
    expect(result).toBeNull();
  });

  it('returns an algorithm when the cube is incomplete', () => {
    const s = solvedState();
    s.faces[0][1] = 'G'; // Break U top-back edge
    const result = findAlgorithm(s, 'white-cross');
    expect(result).not.toBeNull();
    expect(result?.moves.length).toBeGreaterThan(0);
  });

  it('returns a FALLBACK algorithm for truly unmatched states', () => {
    // The FALLBACK case (empty pattern) always matches as last resort
    const s = solvedState();
    // Scramble the top face to something unusual
    s.faces[0] = face('G', { 4: 'W' });
    const result = findAlgorithm(s, 'white-cross');
    // Should return something — either a real case or the fallback
    expect(result).not.toBeNull();
  });
});

describe('getCoachingResult', () => {
  it('marks stage complete on solved cube', () => {
    const result = getCoachingResult(solvedState(), 'final-solve');
    expect(result.stageComplete).toBe(true);
  });

  it('detects regression when a prior stage gets undone', () => {
    const s = solvedState();
    // Break the white cross so currentStage = 'white-cross'
    s.faces[0][1] = 'Y';
    // But expectedStage is 'second-layer' (kid was there)
    const result = getCoachingResult(s, 'second-layer');
    expect(result.regression).toBe(true);
    expect(result.stage).toBe('white-cross');
    expect(result.previousStage).toBe('second-layer');
  });

  it('no regression when stage matches expected', () => {
    const s = solvedState();
    s.faces[0][1] = 'Y'; // white cross broken
    const result = getCoachingResult(s, 'white-cross');
    expect(result.regression).toBe(false);
  });

  it('no regression when stage is ahead (kid is ahead of expected)', () => {
    // Expected = white-cross, but cube actually has it solved
    const result = getCoachingResult(solvedState(), 'white-cross');
    // stage = final-solve (current), expected = white-cross, index(final-solve) > index(white-cross)
    expect(result.regression).toBe(false);
  });
});
