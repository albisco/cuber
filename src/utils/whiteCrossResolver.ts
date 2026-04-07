// White cross move resolver: BFS over short move sequences to find the
// shortest sequence that brings a single white-cross edge to its target slot,
// in the correct orientation.
//
// Used by the picker to fill `moveNotation` (and back-fill `movePlain` for
// the bottom-white-down fast path). Correct by construction: we simulate
// every candidate sequence against the cube state and accept the first one
// that leaves the target edge solved.
//
// Constrained to a small move set per case so the result feels like
// standard beginner moves rather than arbitrary BFS noise.

import type { CubeState } from '../types/cube';
import { applyMoves, type Move } from './cubeMoves';
import { findEdge, EDGE_SLOTS } from './cubeGeometry';
import type { WhiteCrossEdgeDiagnosis } from './whiteCrossDiagnosis';

// All 18 face turns. Used as the default candidate set.
const ALL_MOVES: Move[] = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
  'R', "R'", 'R2',
  'L', "L'", 'L2',
];

// True iff the white-X edge is in its target slot with white facing up.
function edgeIsSolved(state: CubeState, target: WhiteCrossEdgeDiagnosis['target']): boolean {
  const loc = findEdge(state, 'W', target.sideColor);
  if (!loc) return false;
  if (loc.slot !== target.slot) return false;
  // Primary orientation = white on the U face (top sticker is the primary
  // for top-layer slots — see EDGE_SLOTS).
  if (loc.orientation !== 'primary') return false;
  // Verify the side sticker actually matches the target's side colour.
  // (findEdge already guarantees this since we asked for W + sideColor,
  // but check defensively.)
  const [, side] = EDGE_SLOTS[target.slot];
  return state.faces[side.face][side.index] === target.sideColor;
}

// BFS for the shortest sequence (up to maxDepth moves) that solves the
// target edge. Returns null if none found within the depth limit.
//
// Pruning: never apply the same face twice in a row (e.g. R R or R R',
// since combinations of those are equivalent to a single rotation we'd
// already explore).
export function findInsertionSequence(
  state: CubeState,
  diagnosis: WhiteCrossEdgeDiagnosis,
  maxDepth = 5,
): Move[] | null {
  if (edgeIsSolved(state, diagnosis.target)) return [];

  type Node = { state: CubeState; path: Move[] };
  let frontier: Node[] = [{ state, path: [] }];

  for (let depth = 1; depth <= maxDepth; depth++) {
    const next: Node[] = [];
    for (const node of frontier) {
      const lastFace = node.path.length > 0 ? node.path[node.path.length - 1][0] : '';
      for (const m of ALL_MOVES) {
        if (m[0] === lastFace) continue; // prune same-face follow-ups
        const newState = applyMoves(node.state, [m]);
        const newPath: Move[] = [...node.path, m];
        if (edgeIsSolved(newState, diagnosis.target)) return newPath;
        next.push({ state: newState, path: newPath });
      }
    }
    frontier = next;
  }
  return null;
}

// Render a move sequence in standard cube notation (space-separated).
export function formatMoves(moves: Move[]): string {
  return moves.join(' ');
}

// Plain-language descriptions of each face's turn direction. Used to
// back-fill movePlain when the picker doesn't already have a hand-crafted
// description (i.e. for cases other than bottom-white-down).
const MOVE_PLAIN: Record<Move, string> = {
  "U":  'spin the top to the LEFT',
  "U'": 'spin the top to the RIGHT',
  "U2": 'spin the top halfway',
  "D":  'spin the bottom to the LEFT',
  "D'": 'spin the bottom to the RIGHT',
  "D2": 'spin the bottom halfway',
  "F":  'turn the front face clockwise',
  "F'": 'turn the front face counter-clockwise',
  "F2": 'turn the front face twice',
  "B":  'turn the back face clockwise',
  "B'": 'turn the back face counter-clockwise',
  "B2": 'turn the back face twice',
  "R":  'turn the right face down (toward you)',
  "R'": 'turn the right face up (away from you)',
  "R2": 'turn the right face twice',
  "L":  'turn the left face up (toward you)',
  "L'": 'turn the left face down (away from you)',
  "L2": 'turn the left face twice',
};

export function renderMovesPlain(moves: Move[]): string {
  if (moves.length === 0) return 'already in place';
  return moves.map(m => MOVE_PLAIN[m]).join(', then ');
}
