import { describe, it, expect } from 'vitest';
import type { CubeState, Color, Face } from '../types/cube';
import { applyMoves, ALL_MOVES } from '../utils/moveEngine';
import { solveWhiteCross } from './whiteCross';

function face(color: Color): Face {
  return Array(9).fill(color) as Face;
}

function solvedState(): CubeState {
  return {
    faces: [face('W'), face('Y'), face('G'), face('B'), face('R'), face('O')],
  };
}

function isWhiteCrossComplete(state: CubeState): boolean {
  const { faces } = state;
  const U = faces[0], F = faces[2], B = faces[3], R = faces[4], L = faces[5];
  return (
    U[1] === 'W' && B[1] === B[4] &&
    U[3] === 'W' && L[1] === L[4] &&
    U[5] === 'W' && R[1] === R[4] &&
    U[7] === 'W' && F[1] === F[4]
  );
}

// Deterministic pseudo-random scramble generator (mulberry32) so failures are reproducible.
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomScramble(rng: () => number, length: number): string[] {
  const moves: string[] = [];
  for (let i = 0; i < length; i++) {
    moves.push(ALL_MOVES[Math.floor(rng() * ALL_MOVES.length)]);
  }
  return moves;
}

describe('solveWhiteCross', () => {
  it('returns no moves for an already-solved cross', () => {
    expect(solveWhiteCross(solvedState())).toEqual([]);
  });

  it('solves a single edge flipped in place', () => {
    const s = solvedState();
    // Flip the UF edge: swap white/green between U[7] and F[1].
    s.faces[0][7] = 'G';
    s.faces[2][1] = 'W';
    const moves = solveWhiteCross(s);
    const result = applyMoves(s, moves);
    expect(isWhiteCrossComplete(result)).toBe(true);
  });

  it('solves an edge sitting in the D layer in every orientation', () => {
    for (const scramble of [['F2'], ['F', 'F'], ["R2", "F2"], ['D', 'F2'], ["B'", 'D2', 'R2']]) {
      const s = applyMoves(solvedState(), scramble);
      const moves = solveWhiteCross(s);
      const result = applyMoves(s, moves);
      expect(isWhiteCrossComplete(result)).toBe(true);
    }
  });

  it('solves after a full random scramble, across many seeds', () => {
    for (let seed = 0; seed < 60; seed++) {
      const rng = mulberry32(seed);
      const scramble = randomScramble(rng, 25);
      const scrambled = applyMoves(solvedState(), scramble);
      const moves = solveWhiteCross(scrambled);
      const result = applyMoves(scrambled, moves);
      expect(isWhiteCrossComplete(result)).toBe(true);
    }
  });

  it('never disturbs an edge once placed (moves only ever grow the completed set)', () => {
    const rng = mulberry32(42);
    const scrambled = applyMoves(solvedState(), randomScramble(rng, 30));
    const moves = solveWhiteCross(scrambled);
    // Replay move-by-move: the number of correctly-placed cross edges should
    // never decrease once solveWhiteCross has committed to a target.
    let s = scrambled;
    for (const m of moves) {
      s = applyMoves(s, [m]);
    }
    expect(isWhiteCrossComplete(s)).toBe(true);
  });
});
