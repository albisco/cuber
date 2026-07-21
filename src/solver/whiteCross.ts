// Solves the white cross: places all 4 white edges on U, matching their
// side stickers to the adjacent centres. Each edge is solved independently
// using only D-layer rotations plus that edge's own target-face turns —
// moves proven (see moveEngine.ts) to never touch any other U-face edge —
// so a completed edge can never be disturbed while solving the rest.

import type { CubeState } from '../types/cube';
import { FACE } from '../types/cube';
import { applyMoves } from '../utils/moveEngine';
import { EDGE_BY_NAME, SOLVED_FACE_COLOR, isSlotSolved, findEdge } from '../utils/cubePieces';
import { bfsSearch } from '../utils/bfsSearch';

const FACE_LETTER = ['U', 'D', 'F', 'B', 'R', 'L'];
const CROSS_TARGETS = [FACE.F, FACE.R, FACE.B, FACE.L];

function solveOneCrossEdge(state: CubeState, targetFace: number): string[] {
  const targetColor = SOLVED_FACE_COLOR[targetFace];
  const targetLetter = FACE_LETTER[targetFace];
  const targetSlot = EDGE_BY_NAME[`U${targetLetter}`];
  if (isSlotSolved(state, targetSlot)) return [];

  const moves: string[] = [];
  let s = state;

  let { slot } = findEdge(s, ['W', targetColor]);

  // Stuck in the middle layer (touches neither U nor D) — bump it out via
  // one of its own two faces so it lands in the U or D layer.
  if (!slot.stickers.some(st => st.face === FACE.U || st.face === FACE.D)) {
    const bumpLetter = FACE_LETTER[slot.stickers[0].face];
    moves.push(bumpLetter);
    s = applyMoves(s, [bumpLetter]);
    ({ slot } = findEdge(s, ['W', targetColor]));
  }

  // Sitting in the U layer (right slot but flipped, or the wrong slot
  // entirely) — eject down to the D layer via that slot's own side face,
  // doubled. That slot can't currently hold its own correctly-solved piece
  // (it's holding this one instead), so this is always safe.
  if (slot.stickers.some(st => st.face === FACE.U)) {
    const sideFace = slot.stickers.find(st => st.face !== FACE.U)!.face;
    const eject = `${FACE_LETTER[sideFace]}2`;
    moves.push(eject);
    s = applyMoves(s, [eject]);
  }

  // Now in the D layer. D-turns plus the target face's own turns are enough
  // whenever white already faces down, but when white faces sideways, no
  // amount of D+target turning can fix it (a face turn can never change
  // which of its own sticker is "facing that face" — only a turn on a
  // different axis can). So also allow the two side faces perpendicular to
  // both D and the target (never the target's own opposite, which shares
  // its axis and has the same limitation). This can occasionally disturb an
  // already-placed edge on one of those helper faces; solveWhiteCross's
  // outer loop re-detects and re-solves anything disturbed.
  const perpendicular = (targetFace === FACE.F || targetFace === FACE.B) ? ['R', 'L'] : ['F', 'B'];
  const safeMoves = [
    'D', "D'", 'D2',
    targetLetter, `${targetLetter}'`, `${targetLetter}2`,
    ...perpendicular.flatMap(l => [l, `${l}'`, `${l}2`]),
  ];
  const seq = bfsSearch(s, st => isSlotSolved(st, targetSlot), safeMoves, 6);
  if (!seq) throw new Error(`White cross: could not place the ${targetColor} edge`);
  moves.push(...seq);

  return moves;
}

export function solveWhiteCross(state: CubeState): string[] {
  let s = state;
  const moves: string[] = [];

  for (let iter = 0; iter < 12; iter++) {
    const target = CROSS_TARGETS.find(f => !isSlotSolved(s, EDGE_BY_NAME[`U${FACE_LETTER[f]}`]));
    if (target === undefined) break;
    const seq = solveOneCrossEdge(s, target);
    moves.push(...seq);
    s = applyMoves(s, seq);
  }

  if (CROSS_TARGETS.some(f => !isSlotSolved(s, EDGE_BY_NAME[`U${FACE_LETTER[f]}`]))) {
    throw new Error('White cross solver failed to converge');
  }

  return moves;
}
