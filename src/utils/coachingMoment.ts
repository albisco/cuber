// Coaching primitives: StageIntro and CoachingStep.
//
// Decision (2026-04-07): coaching narrative is generated from structured
// primitives + per-stage templates, not hand-written prose. Rewritten the
// same day after user feedback to a leaner shape:
//
//   - StageIntro runs ONCE per stage, before any steps. Includes a visual
//     so the kid can see the goal.
//   - CoachingStep is the per-step primitive. The kid sees a numbered plan
//     ("First step / Second step / ...") then is walked through each.
//   - Pieces are named by their DESTINATION ("the top white front edge"),
//     not by their colours. Pedagogy: kids learn positions, not piece IDs.
//   - Moves are dual-rendered: plain language by default, cube notation on
//     tap. Beginners get "turn the front face twice"; the notation "F2"
//     becomes a vocabulary they grow into.
//   - `breaksWarning` is optional. White cross rarely needs it; F2L will
//     lean on it heavily. Designed in now so it isn't bolted on later.

import type { EdgeSlot } from './cubeGeometry';
import type { WhiteCrossEdgeDiagnosis } from './whiteCrossDiagnosis';

// Once-per-stage preamble: shown before any steps run.
export interface StageIntro {
  goalText: string;        // "Our next goal is to make the white cross."
  visualAsset: string;     // path / id of the animation or image of the target state
  visualAlt: string;       // accessible alt text describing the target state
}

// Per-step coaching primitive. Rendered through the stage template.
export interface CoachingStep {
  stepNumber: number;          // 1, 2, 3, ... — kid sees this as "First step / Second step / ..."
  targetCubie: string;         // named by DESTINATION: "the top white front edge", etc.
  currentState: string;        // "in the bottom row with white facing down"
  movePlain: string;           // "turn the front face twice" — default rendering
  moveNotation: string;        // "F2" — revealed on tap
  progressNote: string;        // why this step gets us closer to the cross
  breaksWarning?: string;      // optional: only present when this move disrupts
                               // something already built. Template adds an extra
                               // sentence only when this is non-empty.
}

// A complete stage plan: the intro plus the ordered steps.
export interface StagePlan {
  intro: StageIntro;
  steps: CoachingStep[];
}

// ---------------------------------------------------------------------------
// White cross stage intro
// ---------------------------------------------------------------------------

export const WHITE_CROSS_INTRO: StageIntro = {
  goalText:
    'Next goal: the white cross. Four white edges around the white centre, with side colours matching their faces.',
  visualAsset: 'white-cross-target',
  visualAlt:
    'A solved white cross on top of the cube: four white edges around the white centre, each side sticker matching its face colour.',
};

// ---------------------------------------------------------------------------
// White cross: diagnosis → CoachingStep
//
// Voice draft (2026-04-07). Move sequences are described in plain language
// for now; the picker will resolve precise notation per target later.
// ---------------------------------------------------------------------------

interface FaceLabel {
  plain: string;     // "front", "back", "left", "right"
  notation: string;  // "F", "B", "L", "R"
}

const FACE_LABEL_BY_TARGET: Record<string, FaceLabel> = {
  UB: { plain: 'back',  notation: 'B' },
  UF: { plain: 'front', notation: 'F' },
  UL: { plain: 'left',  notation: 'L' },
  UR: { plain: 'right', notation: 'R' },
};

function faceLabel(targetSlot: EdgeSlot): FaceLabel {
  const label = FACE_LABEL_BY_TARGET[targetSlot];
  if (!label) throw new Error(`No face label for non-top target: ${targetSlot}`);
  return label;
}

// Map a single white-cross edge diagnosis to a partial CoachingStep.
// Caller assigns stepNumber after picking the order.
export function whiteCrossStepFromDiagnosis(
  diag: WhiteCrossEdgeDiagnosis,
): Omit<CoachingStep, 'stepNumber'> {
  const face = faceLabel(diag.target.slot);
  const cubie = `the top white ${face.plain} edge`;

  switch (diag.case) {
    case 'solved':
      // Caller filters these out before rendering — included for completeness.
      return {
        targetCubie: cubie,
        currentState: 'already in place',
        movePlain: '',
        moveNotation: '',
        progressNote: 'done.',
      };

    case 'bottom-white-down':
      return {
        targetCubie: cubie,
        currentState: 'in the bottom row, white facing down',
        movePlain: `spin the bottom until the edge is under the ${face.plain} side, then turn the ${face.plain} face twice`,
        moveNotation: `D… ${face.notation}2`,
        progressNote: "white's already facing the right way — one flip and it's home.",
      };

    case 'bottom-white-side':
      return {
        targetCubie: cubie,
        currentState: 'in the bottom row, white on a side',
        movePlain: `twist the bottom until the edge is next to the ${face.plain} side, then roll it up so white's on top`,
        moveNotation: '[resolved by picker]',
        progressNote: 'white has to point up for the cross, so we roll it up from the bottom.',
      };

    case 'middle-layer':
      return {
        targetCubie: cubie,
        currentState: `stuck in the middle row (${diag.currentSlot})`,
        movePlain: 'pop it down to the bottom row, then bring it home from there',
        moveNotation: '[resolved by picker]',
        progressNote: "no clean lift from the middle — the bottom row has one.",
      };

    case 'top-correct-slot-flipped':
      return {
        targetCubie: cubie,
        currentState: 'right spot on top, but flipped — white on the side',
        movePlain: `send it down to the bottom, then bring it back up to the ${face.plain} side the right way`,
        moveNotation: '[resolved by picker]',
        progressNote: 'the only way to flip an edge is through the bottom row.',
      };

    case 'top-wrong-slot-up':
      return {
        targetCubie: cubie,
        currentState: `on top, white up, wrong spot (${diag.currentSlot})`,
        movePlain: `drop it down to the bottom, spin under the ${face.plain} side, then turn ${face.plain} twice`,
        moveNotation: '[resolved by picker]',
        progressNote: 'going through the bottom is cleaner than sliding it across the top.',
        breaksWarning: "may bump another white edge — we'll fix it next.",
      };

    case 'top-wrong-slot-flipped':
      return {
        targetCubie: cubie,
        currentState: `on top, wrong spot (${diag.currentSlot}), white on a side`,
        movePlain: `drop it to the bottom, then bring it back up to the ${face.plain} side the right way`,
        moveNotation: '[resolved by picker]',
        progressNote: 'fixes the spot and the flip in one trip.',
        breaksWarning: "may bump another white edge — we'll fix it next.",
      };
  }
}
