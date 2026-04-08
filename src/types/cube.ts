// Canonical cube state representation used throughout the app.
// Faces are indexed as: U(0) D(1) F(2) B(3) R(4) L(5)
// Each face has 9 stickers, indexed row-major from top-left.
// Colors: W=white, Y=yellow, G=green, B=blue, R=red, O=orange

export type Color = 'W' | 'Y' | 'G' | 'B' | 'R' | 'O';
export type Face = [Color, Color, Color, Color, Color, Color, Color, Color, Color];

// Face indices
export const FACE = { U: 0, D: 1, F: 2, B: 3, R: 4, L: 5 } as const;
export type FaceName = keyof typeof FACE;

// Face centre colors (fixed, never move)
export const FACE_CENTRES: Record<FaceName, Color> = {
  U: 'W', D: 'Y', F: 'G', B: 'B', R: 'R', L: 'O',
};

// CubeState: 6 faces × 9 stickers = 54 colors
export interface CubeState {
  faces: [Face, Face, Face, Face, Face, Face];
}

// Human-readable face scan order (matches scan flow: opposite pairs)
export const SCAN_ORDER: FaceName[] = ['U', 'D', 'F', 'B', 'R', 'L'];

// Center sticker index is always [4] — centers never move
export const CENTER = 4;

// Stage identifiers
export type Stage = 'white-cross' | 'first-layer' | 'second-layer' | 'yellow-face' | 'final-solve';
export const STAGES: Stage[] = [
  'white-cross',
  'first-layer',
  'second-layer',
  'yellow-face',
  'final-solve',
];

export const STAGE_LABELS: Record<Stage, string> = {
  'white-cross': 'White Cross',
  'first-layer': 'First Layer',
  'second-layer': 'Second Layer',
  'yellow-face': 'Yellow Face',
  'final-solve': 'Solve!',
};

// Algorithm: a sequence of moves with a coaching explanation
export interface Algorithm {
  moves: string[];          // e.g. ['R', 'U', "R'"]
  why: string;              // concept explanation for 9-12 year olds
  caseId: string;           // unique identifier for test lookups
}

// A coaching case: pattern (partial state description) + algorithm
export interface CoachingCase {
  caseId: string;
  stage: Stage;
  description: string;      // human-readable description of the situation
  pattern: CasePattern;     // what to check in the cube state
  algorithm: Algorithm;
}

// Pattern: a list of sticker checks that must all pass
// Each check: { face, index, color } — "face[index] must be color"
// Use null color for wildcard (don't care)
export interface StickerCheck {
  face: number;             // FACE index (0-5)
  index: number;            // sticker index within face (0-8)
  color: Color | null;      // expected color, or null = wildcard
}

export interface CasePattern {
  checks: StickerCheck[];
}

// Validation result from cube state parser
export interface ValidationResult {
  valid: boolean;
  error?: string;           // human-readable error for re-scan prompt
}
