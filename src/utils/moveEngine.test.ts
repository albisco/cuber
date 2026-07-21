import { describe, it, expect } from 'vitest';
import type { CubeState, Color, Face } from '../types/cube';
import { FACE } from '../types/cube';
import { applyMove, applyMoves, invertMove, invertMoves, ALL_MOVES } from './moveEngine';

function face(color: Color): Face {
  return Array(9).fill(color) as Face;
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

const LETTERS = ['U', 'D', 'F', 'B', 'R', 'L'];

describe('applyMove — group properties', () => {
  it('applying a plain move 4 times returns to the original state', () => {
    for (const letter of LETTERS) {
      let s = solvedState();
      for (let i = 0; i < 4; i++) s = applyMove(s, letter);
      expect(s).toEqual(solvedState());
    }
  });

  it('a move followed by its prime returns to the original state', () => {
    for (const letter of LETTERS) {
      const s = applyMove(applyMove(solvedState(), letter), `${letter}'`);
      expect(s).toEqual(solvedState());
    }
  });

  it('a "2" move equals applying the plain move twice', () => {
    for (const letter of LETTERS) {
      const viaDouble = applyMove(solvedState(), `${letter}2`);
      const viaTwice = applyMove(applyMove(solvedState(), letter), letter);
      expect(viaDouble).toEqual(viaTwice);
    }
  });

  it('the sexy move (R U R\' U\') has order 6', () => {
    let s = solvedState();
    for (let i = 0; i < 6; i++) s = applyMoves(s, ['R', 'U', "R'", "U'"]);
    expect(s).toEqual(solvedState());
  });

  it('invertMoves undoes a scramble', () => {
    const scramble = ['R', "U'", 'F2', 'L', "B'", 'D2', 'R', 'U'];
    const scrambled = applyMoves(solvedState(), scramble);
    const restored = applyMoves(scrambled, invertMoves(scramble));
    expect(restored).toEqual(solvedState());
  });

  it('invertMove is self-consistent', () => {
    expect(invertMove('R')).toBe("R'");
    expect(invertMove("R'")).toBe('R');
    expect(invertMove('R2')).toBe('R2');
  });

  it('exposes exactly 18 moves', () => {
    expect(ALL_MOVES.length).toBe(18);
  });
});

describe('applyMove — grounded against well-known cube facts', () => {
  it('U (clockwise from top) cycles the side faces\' top rows F -> R -> B -> L -> F', () => {
    const after = applyMove(solvedState(), 'U');
    expect(after.faces[FACE.U]).toEqual(face('W')); // U itself unaffected (uniform)
    expect(after.faces[FACE.D]).toEqual(face('Y')); // D untouched
    expect(after.faces[FACE.R].slice(0, 3)).toEqual(['G', 'G', 'G']); // R shows old F
    expect(after.faces[FACE.B].slice(0, 3)).toEqual(['R', 'R', 'R']); // B shows old R
    expect(after.faces[FACE.L].slice(0, 3)).toEqual(['B', 'B', 'B']); // L shows old B
    expect(after.faces[FACE.F].slice(0, 3)).toEqual(['O', 'O', 'O']); // F shows old L
  });

  it('R (clockwise from the right) cycles F -> U -> B -> D -> F on the R-adjacent columns', () => {
    const after = applyMove(solvedState(), 'R');
    expect(after.faces[FACE.R]).toEqual(face('R')); // R itself unaffected
    expect(after.faces[FACE.L]).toEqual(face('O')); // L untouched
    // F's right column now shows old D (yellow)
    expect([after.faces[FACE.F][2], after.faces[FACE.F][5], after.faces[FACE.F][8]]).toEqual(['Y', 'Y', 'Y']);
    // U's right column now shows old F (green)
    expect([after.faces[FACE.U][2], after.faces[FACE.U][5], after.faces[FACE.U][8]]).toEqual(['G', 'G', 'G']);
    // B's left column (mirrored indexing) now shows old U (white)
    expect([after.faces[FACE.B][0], after.faces[FACE.B][3], after.faces[FACE.B][6]]).toEqual(['W', 'W', 'W']);
    // D's right column now shows old B (blue)
    expect([after.faces[FACE.D][2], after.faces[FACE.D][5], after.faces[FACE.D][8]]).toEqual(['B', 'B', 'B']);
  });

  it('F (clockwise from the front) cycles content U -> R -> D -> L -> U on the F-adjacent rows/cols', () => {
    const after = applyMove(solvedState(), 'F');
    expect(after.faces[FACE.F]).toEqual(face('G')); // F itself unaffected
    expect(after.faces[FACE.B]).toEqual(face('B')); // B untouched
    // R's F-adjacent column now shows old U (white) — U's content flowed to R
    expect([after.faces[FACE.R][2], after.faces[FACE.R][5], after.faces[FACE.R][8]]).toEqual(['W', 'W', 'W']);
    // D's top row now shows old R (red) — R's content flowed to D
    expect(after.faces[FACE.D].slice(0, 3)).toEqual(['R', 'R', 'R']);
    // L's F-adjacent column now shows old D (yellow) — D's content flowed to L
    expect([after.faces[FACE.L][0], after.faces[FACE.L][3], after.faces[FACE.L][6]]).toEqual(['Y', 'Y', 'Y']);
    // U's bottom row now shows old L (orange) — L's content flowed to U
    expect(after.faces[FACE.U].slice(6, 9)).toEqual(['O', 'O', 'O']);
  });
});
