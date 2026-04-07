import type { CubeState, Stage, Algorithm } from '../types/cube';
import { stages } from '../data/stages';
import { getCurrentStage, isSolved } from './stageCompletion';
import type { StagePlan } from './coachingMoment';
import { pickWhiteCrossPlan } from './whiteCrossPicker';

// Check a single StickerCheck against the cube state.
// A null color is a wildcard (always passes).
function checkSticker(
  state: CubeState,
  faceIdx: number,
  stickerIdx: number,
  expectedColor: string | null
): boolean {
  if (expectedColor === null) return true;
  return state.faces[faceIdx][stickerIdx] === expectedColor;
}

// Returns the coaching algorithm for the current cube state and stage.
// Returns null if the stage is complete (no algorithm needed).
// Returns a fallback algorithm if no case matches (should not happen with a complete case table).
export function findAlgorithm(state: CubeState, stage: Stage): Algorithm | null {
  if (isSolved(state)) return null;

  const stageCases = stages.filter(c => c.stage === stage);

  for (const coaching of stageCases) {
    const { checks } = coaching.pattern;

    // Empty pattern = catch-all fallback (matches anything)
    if (checks.length === 0) {
      return coaching.algorithm;
    }

    const matches = checks.every(check =>
      checkSticker(state, check.face, check.index, check.color)
    );

    if (matches) {
      // Special case: completion cases (moves = []) signal stage done
      if (coaching.algorithm.moves.length === 0) return null;
      return coaching.algorithm;
    }
  }

  // No case matched — return a safe fallback so the user isn't stuck
  return {
    caseId: 'FALLBACK',
    moves: ['U'],
    why: "Hmm, we're not quite sure where we are on the cube right now. Try rotating the top layer and scanning again — sometimes the cube needs to be in a known position to get the next hint.",
  };
}

// Returns the algorithm for the current stage based on the cube state.
// Also detects stage regression (e.g., kid accidentally undid prior work).
//
// White cross uses the new templated StagePlan engine; other stages still
// use the pattern-match Algorithm path until they're migrated.
export interface CoachingResult {
  stage: Stage;
  algorithm: Algorithm | null;     // populated for non-white-cross stages
  stagePlan: StagePlan | null;     // populated for white-cross stage
  stageComplete: boolean;
  regression: boolean;             // true if a previously-completed stage was undone
  previousStage?: Stage;           // what stage was expected
}

export function getCoachingResult(
  state: CubeState,
  expectedStage: Stage
): CoachingResult {
  const currentStage = getCurrentStage(state);

  // Detect regression: current stage is earlier than expected
  const stageOrder: Stage[] = [
    'white-cross',
    'first-layer',
    'second-layer',
    'yellow-face',
    'final-solve',
  ];
  const currentIdx = stageOrder.indexOf(currentStage);
  const expectedIdx = stageOrder.indexOf(expectedStage);
  const regression = currentIdx < expectedIdx;

  // White cross goes through the templated StagePlan engine.
  if (currentStage === 'white-cross') {
    const stagePlan = pickWhiteCrossPlan(state);
    return {
      stage: currentStage,
      algorithm: null,
      stagePlan,
      stageComplete: stagePlan.steps.length === 0,
      regression,
      previousStage: regression ? expectedStage : undefined,
    };
  }

  // All other stages still use the pattern-match Algorithm path.
  const algorithm = findAlgorithm(state, currentStage);
  return {
    stage: currentStage,
    algorithm,
    stagePlan: null,
    stageComplete: algorithm === null,
    regression,
    previousStage: regression ? expectedStage : undefined,
  };
}
