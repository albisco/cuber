import { describe, it, expect } from 'vitest';
import type { CubeState, Color, Face } from '../types/cube';
import { FACE } from '../types/cube';
import { pickWhiteCrossPlan } from './whiteCrossPicker';
import { WHITE_CROSS_INTRO } from './coachingMoment';

function face(color: Color): Face {
  return Array(9).fill(color) as Face;
}

function solvedState(): CubeState {
  return {
    faces: [
      face('W'), face('Y'), face('G'),
      face('B'), face('R'), face('O'),
    ],
  };
}

describe('pickWhiteCrossPlan — solved cube', () => {
  it('returns the intro and zero steps', () => {
    const plan = pickWhiteCrossPlan(solvedState());
    expect(plan.intro).toEqual(WHITE_CROSS_INTRO);
    expect(plan.steps).toEqual([]);
  });
});

describe('pickWhiteCrossPlan — single broken edge', () => {
  it('produces one step for a single flipped UF edge', () => {
    const s = solvedState();
    s.faces[FACE.U][7] = 'G';
    s.faces[FACE.F][1] = 'W';
    const plan = pickWhiteCrossPlan(s);
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0].stepNumber).toBe(1);
    expect(plan.steps[0].targetCubie).toBe('the top white front edge');
  });
});

describe('pickWhiteCrossPlan — priority ordering', () => {
  it('orders bottom-white-down before top-wrong-slot-up', () => {
    // Build a cube where:
    //  - white-green edge is at DF, white facing down (bottom-white-down for UF target)
    //  - white-red edge is at UF, white up (top-wrong-slot-up for UR target)
    // Both edges are present, properly placed in their swapped slots.
    const s = solvedState();
    // UF slot: previously W-G. Replace with W-R (white up, red on F).
    s.faces[FACE.U][7] = 'W'; s.faces[FACE.F][1] = 'R';
    // UR slot: previously W-R. Replace with Y-G temporarily (will fix below).
    s.faces[FACE.U][5] = 'Y'; s.faces[FACE.R][1] = 'G';
    // DF slot: previously Y-G. Place W-G here, white down.
    s.faces[FACE.D][1] = 'W'; s.faces[FACE.F][7] = 'G';
    // DR slot: previously Y-R. Place Y-R back (no-op, already correct).
    // (We don't need a perfectly valid full cube for the picker — just enough
    // that diagnoseWhiteCrossEdges can find each white-X edge once.)

    const plan = pickWhiteCrossPlan(s);
    // First step should be the white-green edge (bottom-white-down).
    expect(plan.steps[0].targetCubie).toBe('the top white front edge');
    // The white-red edge (top-wrong-slot-up for UR target) should come after.
    const redStep = plan.steps.find(s => s.targetCubie === 'the top white right edge');
    expect(redStep).toBeDefined();
    expect(redStep!.stepNumber).toBeGreaterThan(plan.steps[0].stepNumber);
  });

  it('numbers steps starting from 1 with no gaps', () => {
    // Break all 4 edges so we get 4 steps.
    const s = solvedState();
    // Flip each U edge with its side neighbour.
    s.faces[FACE.U][1] = 'B'; s.faces[FACE.B][1] = 'W';
    s.faces[FACE.U][3] = 'O'; s.faces[FACE.L][1] = 'W';
    s.faces[FACE.U][5] = 'R'; s.faces[FACE.R][1] = 'W';
    s.faces[FACE.U][7] = 'G'; s.faces[FACE.F][1] = 'W';
    const plan = pickWhiteCrossPlan(s);
    expect(plan.steps).toHaveLength(4);
    expect(plan.steps.map(s => s.stepNumber)).toEqual([1, 2, 3, 4]);
  });
});

describe('pickWhiteCrossPlan — determinism', () => {
  it('produces the same plan on repeated calls', () => {
    const s = solvedState();
    s.faces[FACE.U][7] = 'G'; s.faces[FACE.F][1] = 'W';
    const a = pickWhiteCrossPlan(s);
    const b = pickWhiteCrossPlan(s);
    expect(a).toEqual(b);
  });
});
