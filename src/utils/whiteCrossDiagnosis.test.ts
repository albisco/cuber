import { describe, it, expect } from 'vitest';
import type { CubeState, Color, Face } from '../types/cube';
import { FACE } from '../types/cube';
import {
  diagnoseWhiteCrossEdges,
  isCrossSolved,
} from './whiteCrossDiagnosis';

function face(color: Color): Face {
  return Array(9).fill(color) as Face;
}

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

// Helper to grab a diagnosis by target slot.
function byTarget(diags: ReturnType<typeof diagnoseWhiteCrossEdges>, slot: string) {
  const d = diags.find(d => d.target.slot === slot);
  if (!d) throw new Error(`no diagnosis for target ${slot}`);
  return d;
}

describe('diagnoseWhiteCrossEdges — solved cube', () => {
  it('all 4 edges report solved', () => {
    const diags = diagnoseWhiteCrossEdges(solvedState());
    expect(diags).toHaveLength(4);
    expect(diags.every(d => d.case === 'solved')).toBe(true);
    expect(isCrossSolved(diags)).toBe(true);
  });

  it('returns diagnoses in fixed order UB, UF, UL, UR', () => {
    const diags = diagnoseWhiteCrossEdges(solvedState());
    expect(diags.map(d => d.target.slot)).toEqual(['UB', 'UF', 'UL', 'UR']);
  });
});

describe('top-correct-slot-flipped (case 7)', () => {
  it('UF edge in place but white on F instead of U', () => {
    const s = solvedState();
    // Swap the two stickers of the UF edge
    s.faces[FACE.U][7] = 'G';
    s.faces[FACE.F][1] = 'W';
    const diags = diagnoseWhiteCrossEdges(s);
    expect(byTarget(diags, 'UF').case).toBe('top-correct-slot-flipped');
    expect(byTarget(diags, 'UF').currentSlot).toBe('UF');
    expect(isCrossSolved(diags)).toBe(false);
  });
});

describe('top-wrong-slot-up (case 2)', () => {
  it('white-green edge sitting at UR with white on U', () => {
    const s = solvedState();
    // Put white-green at UR (primary: W on U[5], G on R[1])
    // and move the displaced white-red to UF (primary: W on U[7], R on F[1]).
    s.faces[FACE.U][5] = 'W'; s.faces[FACE.R][1] = 'G';
    s.faces[FACE.U][7] = 'W'; s.faces[FACE.F][1] = 'R';
    const diags = diagnoseWhiteCrossEdges(s);
    const ufEdge = byTarget(diags, 'UF');
    expect(ufEdge.case).toBe('top-wrong-slot-up');
    expect(ufEdge.currentSlot).toBe('UR');
    // white-red is displaced to UF, also top-wrong-slot-up
    const urEdge = byTarget(diags, 'UR');
    expect(urEdge.case).toBe('top-wrong-slot-up');
    expect(urEdge.currentSlot).toBe('UF');
  });
});

describe('top-wrong-slot-flipped (case 3)', () => {
  it('white-green edge at UR with white on the R face', () => {
    const s = solvedState();
    // UR slot: swap so W is on R[1], G is on U[5]
    s.faces[FACE.U][5] = 'G'; s.faces[FACE.R][1] = 'W';
    // Where did white-red go? Put it at UF also flipped for symmetry.
    s.faces[FACE.U][7] = 'R'; s.faces[FACE.F][1] = 'W';
    const diags = diagnoseWhiteCrossEdges(s);
    const ufEdge = byTarget(diags, 'UF');
    expect(ufEdge.case).toBe('top-wrong-slot-flipped');
    expect(ufEdge.currentSlot).toBe('UR');
  });
});

describe('bottom-white-down (case 4)', () => {
  it('white-green edge at DF with white facing down', () => {
    const s = solvedState();
    // Swap UF ↔ DF. DF primary: W on D[1], G on F[7].
    s.faces[FACE.U][7] = 'Y'; s.faces[FACE.F][1] = 'G';
    s.faces[FACE.D][1] = 'W'; s.faces[FACE.F][7] = 'G';
    const diags = diagnoseWhiteCrossEdges(s);
    const ufEdge = byTarget(diags, 'UF');
    expect(ufEdge.case).toBe('bottom-white-down');
    expect(ufEdge.currentSlot).toBe('DF');
  });
});

describe('bottom-white-side (case 5)', () => {
  it('white-green edge at DF with white on the F face', () => {
    const s = solvedState();
    // DF flipped: G on D[1], W on F[7].
    s.faces[FACE.U][7] = 'Y'; s.faces[FACE.F][1] = 'G';
    s.faces[FACE.D][1] = 'G'; s.faces[FACE.F][7] = 'W';
    const diags = diagnoseWhiteCrossEdges(s);
    const ufEdge = byTarget(diags, 'UF');
    expect(ufEdge.case).toBe('bottom-white-side');
    expect(ufEdge.currentSlot).toBe('DF');
  });
});

describe('middle-layer (case 6)', () => {
  it('white-green edge stuck in the FR slot', () => {
    const s = solvedState();
    // Move UF to FR. FR primary is F[5], secondary R[3].
    // Put white on F[5], green on R[3].
    s.faces[FACE.U][7] = 'G'; s.faces[FACE.F][1] = 'R'; // UF now carries G-R, hmm that duplicates
    // Simpler: just overwrite FR stickers to W-G and UF to whatever is not white-green.
    // (We're not checking validity here, only that classification handles the slot.)
    const s2 = solvedState();
    s2.faces[FACE.F][5] = 'W'; s2.faces[FACE.R][3] = 'G';
    s2.faces[FACE.U][7] = 'Y'; s2.faces[FACE.F][1] = 'Y'; // displace original UF
    const diags = diagnoseWhiteCrossEdges(s2);
    const ufEdge = byTarget(diags, 'UF');
    expect(ufEdge.case).toBe('middle-layer');
    expect(ufEdge.currentSlot).toBe('FR');
  });
});

describe('malformed state', () => {
  it('throws when a white edge cubie is missing', () => {
    const s = solvedState();
    // Wipe the UF edge colours so the white-green edge no longer exists anywhere.
    s.faces[FACE.U][7] = 'Y'; s.faces[FACE.F][1] = 'Y';
    expect(() => diagnoseWhiteCrossEdges(s)).toThrow(/white-green/);
  });
});
