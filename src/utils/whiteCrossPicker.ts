// White cross picker: turns a cube state into an ordered StagePlan.
//
// Diagnoses all 4 white edges, drops the ones that are already solved,
// orders the rest by coaching priority (easiest wins first), assigns step
// numbers, and bundles the result with the stage intro.

import type { CubeState } from '../types/cube';
import type { StagePlan, CoachingStep } from './coachingMoment';
import {
  WHITE_CROSS_INTRO,
  whiteCrossStepFromDiagnosis,
} from './coachingMoment';
import {
  diagnoseWhiteCrossEdges,
  type WhiteCrossEdgeCase,
} from './whiteCrossDiagnosis';
import { findInsertionSequence, formatMoves } from './whiteCrossResolver';

// Coaching priority: easier / safer cases first.
// 1. bottom-white-down       — the easy win, builds confidence
// 2. middle-layer            — unstuck before it can become harder
// 3. bottom-white-side       — standard insert from the bottom
// 4. top-correct-slot-flipped — fix in place, no other edges affected
// 5. top-wrong-slot-up       — top → bottom → home (may bump others)
// 6. top-wrong-slot-flipped  — same path, plus the flip
const PRIORITY: Record<WhiteCrossEdgeCase, number> = {
  'solved': 99,                       // filtered out, but give a high number defensively
  'bottom-white-down': 1,
  'middle-layer': 2,
  'bottom-white-side': 3,
  'top-correct-slot-flipped': 4,
  'top-wrong-slot-up': 5,
  'top-wrong-slot-flipped': 6,
};

// Build the full white cross stage plan for the given cube state.
// Returns intro + ordered, numbered steps. If the cross is already solved,
// returns intro + an empty steps array.
export function pickWhiteCrossPlan(state: CubeState): StagePlan {
  // Tolerate malformed cube states (e.g. partial scans, test fixtures with
  // single-sticker tweaks). The diagnoser throws if a white edge cubie is
  // missing entirely; we treat that as "no plan available" and let the UI
  // prompt a re-scan. white-cross stage + zero steps unambiguously means
  // malformed, since a solved cube would not be in the white-cross stage.
  let diagnoses;
  try {
    diagnoses = diagnoseWhiteCrossEdges(state);
  } catch {
    return { intro: WHITE_CROSS_INTRO, steps: [] };
  }

  // Drop solved edges, sort by priority, then by a stable secondary order
  // (target slot string) so the output is deterministic when priorities tie.
  const remaining = diagnoses
    .filter(d => d.case !== 'solved')
    .sort((a, b) => {
      const pa = PRIORITY[a.case];
      const pb = PRIORITY[b.case];
      if (pa !== pb) return pa - pb;
      return a.target.slot.localeCompare(b.target.slot);
    });

  const steps: CoachingStep[] = remaining.map((diag, i) => {
    const base = whiteCrossStepFromDiagnosis(diag);
    // Resolve real notation by simulating the cube state. The hand-crafted
    // movePlain stays — BFS gives us the exact moves, the template gives us
    // the kid-friendly description.
    const seq = findInsertionSequence(state, diag, 6);
    const moveNotation = seq && seq.length > 0 ? formatMoves(seq) : base.moveNotation;
    return {
      stepNumber: i + 1,
      ...base,
      moveNotation,
    };
  });

  return {
    intro: WHITE_CROSS_INTRO,
    steps,
  };
}
