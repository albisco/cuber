import type { CubeState, Stage, ValidationResult } from '../types/cube';
import { FACE } from '../types/cube';

// Returns a plain-English description of which white cross edge is failing, or null if complete.
export function diagnoseWhiteCross(state: CubeState): string | null {
  const { faces } = state;
  const U = faces[FACE.U];
  const F = faces[FACE.F];
  const B = faces[FACE.B];
  const R = faces[FACE.R];
  const L = faces[FACE.L];

  if (U[1] !== 'W') return 'The back edge on your white face isn\'t white — check the middle sticker on the back edge of the top face.';
  if (U[3] !== 'W') return 'The left edge on your white face isn\'t white — check the middle sticker on the left edge of the top face.';
  if (U[5] !== 'W') return 'The right edge on your white face isn\'t white — check the middle sticker on the right edge of the top face.';
  if (U[7] !== 'W') return 'The front edge on your white face isn\'t white — check the middle sticker on the front edge of the top face.';

  if (B[1] !== B[4]) return 'The back white edge is in place but the side sticker doesn\'t match the back center. It needs to line up with the back centre colour.';
  if (L[1] !== L[4]) return 'The left white edge is in place but the side sticker doesn\'t match the left center. It needs to line up with the left centre colour.';
  if (R[1] !== R[4]) return 'The right white edge is in place but the side sticker doesn\'t match the right center. It needs to line up with the right centre colour.';
  if (F[1] !== F[4]) return 'The front white edge is in place but the side sticker doesn\'t match the front center. It needs to line up with the front centre colour.';

  return null;
}

// Returns true if the white cross is complete:
// all 4 U-face edges are white, and each edge's side sticker matches its centre.
export function isWhiteCrossComplete(state: CubeState): boolean {
  const { faces } = state;
  const U = faces[FACE.U];
  const F = faces[FACE.F];
  const B = faces[FACE.B];
  const R = faces[FACE.R];
  const L = faces[FACE.L];

  return (
    U[1] === 'W' && B[1] === B[4] && // top-back edge
    U[3] === 'W' && L[1] === L[4] && // top-left edge
    U[5] === 'W' && R[1] === R[4] && // top-right edge
    U[7] === 'W' && F[1] === F[4]    // top-front edge
  );
}

// Returns true if the first layer (white face + corners) is complete.
export function isFirstLayerComplete(state: CubeState): boolean {
  if (!isWhiteCrossComplete(state)) return false;
  const { faces } = state;
  const U = faces[FACE.U];
  const F = faces[FACE.F];
  const B = faces[FACE.B];
  const R = faces[FACE.R];
  const L = faces[FACE.L];

  return (
    // All 4 U corners are white
    U[0] === 'W' && U[2] === 'W' && U[6] === 'W' && U[8] === 'W' &&
    // Corner side stickers match their centres
    F[0] === F[4] && F[2] === F[4] &&
    B[0] === B[4] && B[2] === B[4] &&
    R[0] === R[4] && R[2] === R[4] &&
    L[0] === L[4] && L[2] === L[4]
  );
}

// Returns true if the second layer (middle edges) is complete.
export function isSecondLayerComplete(state: CubeState): boolean {
  if (!isFirstLayerComplete(state)) return false;
  const { faces } = state;
  const F = faces[FACE.F];
  const B = faces[FACE.B];
  const R = faces[FACE.R];
  const L = faces[FACE.L];

  return (
    // Middle-row edge stickers match their face centres
    F[3] === F[4] && F[5] === F[4] &&
    B[3] === B[4] && B[5] === B[4] &&
    R[3] === R[4] && R[5] === R[4] &&
    L[3] === L[4] && L[5] === L[4]
  );
}

// Returns true if the yellow face (last layer orientation) is complete:
// all 9 stickers on the D face are yellow.
export function isYellowFaceComplete(state: CubeState): boolean {
  if (!isSecondLayerComplete(state)) return false;
  const D = state.faces[FACE.D];
  return D.every(sticker => sticker === 'Y');
}

// Returns true if the cube is fully solved.
export function isSolved(state: CubeState): boolean {
  return state.faces.every(face => face.every(s => s === face[4]));
}

// Returns the current stage the kid is working on.
// Detects regression (prior stage undone) by checking in order.
export function getCurrentStage(state: CubeState): Stage {
  if (!isWhiteCrossComplete(state)) return 'white-cross';
  if (!isFirstLayerComplete(state)) return 'first-layer';
  if (!isSecondLayerComplete(state)) return 'second-layer';
  if (!isYellowFaceComplete(state)) return 'yellow-face';
  if (!isSolved(state)) return 'final-solve';
  return 'final-solve'; // solved
}

// Returns which stages are complete (for the progress checklist).
export function getCompletedStages(state: CubeState): Stage[] {
  const completed: Stage[] = [];
  if (isWhiteCrossComplete(state)) completed.push('white-cross');
  if (isFirstLayerComplete(state)) completed.push('first-layer');
  if (isSecondLayerComplete(state)) completed.push('second-layer');
  if (isYellowFaceComplete(state)) completed.push('yellow-face');
  if (isSolved(state)) completed.push('final-solve');
  return completed;
}

// Validates that a cube state is geometrically legal.
// Checks: exactly 9 of each colour, and basic parity.
export function validateCubeState(state: CubeState): ValidationResult {
  const counts: Record<string, number> = {};
  for (const face of state.faces) {
    for (const sticker of face) {
      counts[sticker] = (counts[sticker] ?? 0) + 1;
    }
  }

  const expected = ['W', 'Y', 'G', 'B', 'R', 'O'];
  for (const color of expected) {
    if ((counts[color] ?? 0) !== 9) {
      return {
        valid: false,
        error: `Something looks off — we're seeing ${counts[color] ?? 0} ${color === 'W' ? 'white' : color === 'Y' ? 'yellow' : color === 'G' ? 'green' : color === 'B' ? 'blue' : color === 'R' ? 'red' : 'orange'} stickers instead of 9. Let's re-scan that face.`,
      };
    }
  }

  // Basic parity: check centres haven't been mixed up
  // (Centre sticker index 4 defines the face colour)
  const centres = state.faces.map(f => f[4]);
  const uniqueCentres = new Set(centres);
  if (uniqueCentres.size !== 6) {
    return {
      valid: false,
      error: "The cube centres don't look right. Let's re-scan — make sure the same face is pointing at the camera each time.",
    };
  }

  return { valid: true };
}
