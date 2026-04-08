// White cross diagnosis: classify each of the 4 target edges into one of
// seven cases, without any coaching narrative. Narrative + move selection
// happens in the coaching picker (next file).
//
// This is the core of the white-cross stage's "locate and classify" engine,
// replacing the pattern-match lookup used for later stages.

import type { CubeState, Color } from '../types/cube';
import type { EdgeSlot } from './cubeGeometry';
import { findEdge } from './cubeGeometry';

// The 7 cases. See TODOS / sub-case discussion for pedagogical meaning.
export type WhiteCrossEdgeCase =
  | 'solved'                    // in target slot, white up, side matches centre
  | 'top-correct-slot-flipped'  // in target slot but white is on the side (case 7)
  | 'top-wrong-slot-up'         // on U layer, white up, wrong slot (case 2)
  | 'top-wrong-slot-flipped'    // on U layer, white on side, wrong slot (case 3)
  | 'bottom-white-down'         // on D layer, white facing down (case 4, easiest)
  | 'bottom-white-side'         // on D layer, white on a side face (case 5)
  | 'middle-layer';             // stuck in a middle-layer slot (case 6)

// The 4 target slots for the white cross, each paired with the side colour
// that must end up matching that face's centre.
export interface WhiteCrossTarget {
  slot: EdgeSlot;       // 'UB' | 'UF' | 'UL' | 'UR'
  sideColor: Color;     // the non-white colour on this edge
  sideName: string;     // human-readable, for coaching text
}

export const WHITE_CROSS_TARGETS: WhiteCrossTarget[] = [
  { slot: 'UB', sideColor: 'B', sideName: 'blue' },
  { slot: 'UF', sideColor: 'G', sideName: 'green' },
  { slot: 'UL', sideColor: 'O', sideName: 'orange' },
  { slot: 'UR', sideColor: 'R', sideName: 'red' },
];

export interface WhiteCrossEdgeDiagnosis {
  target: WhiteCrossTarget;     // where this edge needs to end up
  currentSlot: EdgeSlot;        // where it is right now
  case: WhiteCrossEdgeCase;
}

const TOP_SLOTS: ReadonlySet<EdgeSlot> = new Set(['UB', 'UF', 'UL', 'UR']);
const BOTTOM_SLOTS: ReadonlySet<EdgeSlot> = new Set(['DB', 'DF', 'DL', 'DR']);

// Classify a single white-X edge given where findEdge located it.
function classify(
  currentSlot: EdgeSlot,
  orientation: 'primary' | 'secondary',
  target: WhiteCrossTarget,
): WhiteCrossEdgeCase {
  if (currentSlot === target.slot) {
    return orientation === 'primary' ? 'solved' : 'top-correct-slot-flipped';
  }
  if (TOP_SLOTS.has(currentSlot)) {
    return orientation === 'primary' ? 'top-wrong-slot-up' : 'top-wrong-slot-flipped';
  }
  if (BOTTOM_SLOTS.has(currentSlot)) {
    return orientation === 'primary' ? 'bottom-white-down' : 'bottom-white-side';
  }
  return 'middle-layer';
}

// Diagnose all 4 white cross edges. Returns one entry per target slot,
// in the fixed order UB, UF, UL, UR.
//
// Throws if the cube state is malformed (a white edge cubie is missing).
// Callers should validate state with validateCubeState() first.
export function diagnoseWhiteCrossEdges(state: CubeState): WhiteCrossEdgeDiagnosis[] {
  return WHITE_CROSS_TARGETS.map(target => {
    const loc = findEdge(state, 'W', target.sideColor);
    if (!loc) {
      throw new Error(
        `Malformed cube: white-${target.sideName} edge not found. ` +
        `Validate state before diagnosing.`,
      );
    }
    return {
      target,
      currentSlot: loc.slot,
      case: classify(loc.slot, loc.orientation, target),
    };
  });
}

// Convenience: is the white cross fully solved?
// Equivalent to isWhiteCrossComplete() in stageCompletion.ts but derived
// from the diagnosis — useful as a sanity check and in the coaching picker.
export function isCrossSolved(diagnoses: WhiteCrossEdgeDiagnosis[]): boolean {
  return diagnoses.every(d => d.case === 'solved');
}
