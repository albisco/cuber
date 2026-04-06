// Coaching cases for all 5 stages of the beginner's method.
//
// Pattern matching: each case lists sticker checks (face, index, color).
// The first case whose pattern matches the current cube state is used.
// Cases are checked in order — more specific cases should come first.
//
// Face indices: U=0, D=1, F=2, B=3, R=4, L=5
// Sticker layout per face (viewed from outside):
//   0 1 2
//   3 4 5
//   6 7 8
// Center sticker is always index 4.
//
// White Cross goal: U face edges (U[1], U[3], U[5], U[7]) are white,
//   and each edge's side sticker matches its center.
//   U[1] top-back edge → B[1] should match B center (B[4])
//   U[3] top-left edge → L[1] should match L center (L[4])
//   U[5] top-right edge → R[1] should match R center (R[4])
//   U[7] top-front edge → F[1] should match F center (F[4])

import type { CoachingCase } from '../types/cube';

export const stages: CoachingCase[] = [
  // ─────────────────────────────────────────────────────────────────
  // STAGE: white-cross
  // Goal: place all 4 white edge pieces on the U face, colours aligned.
  // Strategy: work one edge at a time. Find the white-X edge, move it
  // to the top in the correct orientation.
  // ─────────────────────────────────────────────────────────────────

  // White cross is handled programmatically in coachingEngine.ts (findWhiteCrossAlgorithm).
  // No pattern-match cases needed here — the engine inspects the full cube state directly.

  // ─────────────────────────────────────────────────────────────────
  // STAGE: first-layer (corners)
  // Goal: place all 4 white corner pieces, completing the white face.
  // Each corner has the white sticker plus 2 side colours.
  // ─────────────────────────────────────────────────────────────────

  // Case FL-00: First layer complete.
  {
    caseId: 'FL-00',
    stage: 'first-layer',
    description: 'First layer complete',
    pattern: {
      checks: [
        { face: 0, index: 0, color: 'W' },
        { face: 0, index: 2, color: 'W' },
        { face: 0, index: 6, color: 'W' },
        { face: 0, index: 8, color: 'W' },
      ],
    },
    algorithm: { caseId: 'FL-00', moves: [], why: 'White face complete! Now the second layer.' },
  },

  // Case FL-01: White corner in bottom layer, white sticker facing down.
  {
    caseId: 'FL-01',
    stage: 'first-layer',
    description: 'White corner in bottom layer, white facing down',
    pattern: {
      checks: [
        { face: 1, index: 2, color: 'W' }, // D front-right corner, white on bottom
      ],
    },
    algorithm: {
      caseId: 'FL-01',
      moves: ['R', 'U', "R'", "U'", 'R', 'U', "R'"],
      why: "The white corner is at the bottom, white sticker pointing down. This is a tricky spot — we use a longer sequence to bring it out and place it correctly.",
    },
  },

  // Case FL-02: White corner in bottom layer, white sticker facing front.
  {
    caseId: 'FL-02',
    stage: 'first-layer',
    description: 'White corner in bottom-front-right, white facing front',
    pattern: {
      checks: [
        { face: 2, index: 8, color: 'W' }, // F bottom-right corner = white
      ],
    },
    algorithm: {
      caseId: 'FL-02',
      moves: ['R', 'U', "R'"],
      why: "The white corner is at the bottom-front-right with white facing towards you. One short move puts it into position.",
    },
  },

  // Case FL-03: White corner in bottom layer, white facing right.
  {
    caseId: 'FL-03',
    stage: 'first-layer',
    description: 'White corner in bottom-front-right, white facing right',
    pattern: {
      checks: [
        { face: 4, index: 6, color: 'W' }, // R bottom-left corner = white
      ],
    },
    algorithm: {
      caseId: 'FL-03',
      moves: ["U'", "R'", 'U', 'R'],
      why: "The white corner is at the bottom with white facing right. We swing it up and slot it in from the right side.",
    },
  },

  // Case FL-04: White corner in top layer, in the wrong spot (needs repositioning first).
  {
    caseId: 'FL-04',
    stage: 'first-layer',
    description: 'White corner in top layer but above wrong slot',
    pattern: {
      checks: [
        { face: 0, index: 8, color: 'W' }, // U front-right corner = white, but wrong orientation
      ],
    },
    algorithm: {
      caseId: 'FL-04',
      moves: ['R', 'U', "R'"],
      why: "The corner piece is already in the top layer — great! Now we slide it into the slot below. Watch how it drops neatly into place.",
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // STAGE: second-layer (middle layer edges)
  // Goal: place all 4 middle-layer edges (no yellow stickers).
  // Algorithm: left insert or right insert.
  // ─────────────────────────────────────────────────────────────────

  // Case SL-00: Second layer complete.
  {
    caseId: 'SL-00',
    stage: 'second-layer',
    description: 'Second layer complete',
    pattern: {
      checks: [
        // All middle edges have correct colours (checked at runtime by stageCompletion)
        { face: 2, index: 4, color: null }, // placeholder — real check is functional
      ],
    },
    algorithm: { caseId: 'SL-00', moves: [], why: 'Two layers done! Now the yellow face.' },
  },

  // Case SL-01: Edge in top layer, needs to go right.
  // Front colour matches front centre, top colour matches right centre.
  {
    caseId: 'SL-01',
    stage: 'second-layer',
    description: 'Top-front edge needs to insert to the right',
    pattern: {
      checks: [
        { face: 2, index: 1, color: null }, // F[1] matches F centre
        { face: 0, index: 7, color: null }, // U[7] matches R centre
      ],
    },
    algorithm: {
      caseId: 'SL-01',
      moves: ['U', 'R', "U'", "R'", "U'", "F'", 'U', 'F'],
      why: "This edge belongs to the right. We use the Right Insert: move the top layer to line it up, then guide the piece sideways into the middle layer.",
    },
  },

  // Case SL-02: Edge in top layer, needs to go left.
  {
    caseId: 'SL-02',
    stage: 'second-layer',
    description: 'Top-front edge needs to insert to the left',
    pattern: {
      checks: [
        { face: 2, index: 1, color: null }, // matches L centre via rotation
        { face: 0, index: 7, color: null }, // matches F centre
      ],
    },
    algorithm: {
      caseId: 'SL-02',
      moves: ["U'", "L'", 'U', 'L', 'U', 'F', "U'", "F'"],
      why: "This edge belongs to the left. Left Insert is the mirror of the Right Insert — same idea, opposite direction.",
    },
  },

  // Case SL-03: Edge is in middle layer but flipped (wrong orientation).
  {
    caseId: 'SL-03',
    stage: 'second-layer',
    description: 'Middle edge in place but wrong orientation',
    pattern: {
      checks: [
        { face: 4, index: 3, color: null }, // R middle-left edge has wrong colour
      ],
    },
    algorithm: {
      caseId: 'SL-03',
      moves: ['U', 'R', "U'", "R'", "U'", "F'", 'U', 'F'],
      why: "The edge is already in the middle layer, but it's facing the wrong way. We first pop it out to the top layer, then re-insert it correctly.",
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // STAGE: yellow-face (orient last layer — 2-look OLL simplified)
  // Goal: all yellow stickers face up on the D face (after flip).
  // Using beginner 2-look: first make a cross, then orient corners.
  // ─────────────────────────────────────────────────────────────────

  // Case YF-00: Yellow face complete.
  {
    caseId: 'YF-00',
    stage: 'yellow-face',
    description: 'Yellow face complete',
    pattern: {
      checks: [
        { face: 1, index: 1, color: 'Y' },
        { face: 1, index: 3, color: 'Y' },
        { face: 1, index: 5, color: 'Y' },
        { face: 1, index: 7, color: 'Y' },
        { face: 1, index: 0, color: 'Y' },
        { face: 1, index: 2, color: 'Y' },
        { face: 1, index: 6, color: 'Y' },
        { face: 1, index: 8, color: 'Y' },
      ],
    },
    algorithm: { caseId: 'YF-00', moves: [], why: 'Yellow face done! Last step — finish the solve.' },
  },

  // Case YF-01: No yellow edges on top (dot pattern). Apply F R U R' U' F'.
  {
    caseId: 'YF-01',
    stage: 'yellow-face',
    description: 'Dot — no yellow edges facing up',
    pattern: {
      checks: [
        { face: 1, index: 1, color: null }, // not Y
        { face: 1, index: 3, color: null },
        { face: 1, index: 5, color: null },
        { face: 1, index: 7, color: null },
      ],
    },
    algorithm: {
      caseId: 'YF-01',
      moves: ['F', 'R', 'U', "R'", "U'", "F'"],
      why: "You have the dot — no yellow on top yet. This sequence starts building the yellow cross. You may need to repeat it.",
    },
  },

  // Case YF-02: L-shape (2 adjacent yellow edges). Apply F R U R' U' F'.
  {
    caseId: 'YF-02',
    stage: 'yellow-face',
    description: 'L-shape — 2 adjacent yellow edges facing up',
    pattern: {
      checks: [
        { face: 1, index: 7, color: 'Y' }, // front edge yellow
        { face: 1, index: 3, color: 'Y' }, // left edge yellow
      ],
    },
    algorithm: {
      caseId: 'YF-02',
      moves: ['F', 'R', 'U', "R'", "U'", "F'"],
      why: "Two yellow edges are up, but they're next to each other — an 'L' shape. Hold the cube so the L is at the bottom-left, then apply the cross algorithm.",
    },
  },

  // Case YF-03: Line shape (2 opposite yellow edges). Apply F R U R' U' F'.
  {
    caseId: 'YF-03',
    stage: 'yellow-face',
    description: 'Line — 2 opposite yellow edges facing up',
    pattern: {
      checks: [
        { face: 1, index: 1, color: 'Y' }, // back edge yellow
        { face: 1, index: 7, color: 'Y' }, // front edge yellow
      ],
    },
    algorithm: {
      caseId: 'YF-03',
      moves: ['F', 'R', 'U', "R'", "U'", "F'"],
      why: "Two opposite yellow edges are up — a line. Hold it so the line goes left-right, then apply the cross algorithm.",
    },
  },

  // Case YF-04: Cross done, orient corners using Sune (R U R' U R U2 R').
  {
    caseId: 'YF-04',
    stage: 'yellow-face',
    description: 'Yellow cross done, corners need orienting',
    pattern: {
      checks: [
        { face: 1, index: 1, color: 'Y' },
        { face: 1, index: 3, color: 'Y' },
        { face: 1, index: 5, color: 'Y' },
        { face: 1, index: 7, color: 'Y' },
      ],
    },
    algorithm: {
      caseId: 'YF-04',
      moves: ['R', 'U', "R'", 'U', 'R', 'U', 'U', "R'"],
      why: "The yellow cross is done — great progress! Now we need to flip the corners so all of yellow faces up. Apply this sequence until all corners are yellow on top. You may need it up to 4 times.",
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // STAGE: final-solve (permute last layer — 2-look PLL simplified)
  // Goal: complete the cube by permuting corners then edges.
  // ─────────────────────────────────────────────────────────────────

  // Case FS-00: Solved!
  {
    caseId: 'FS-00',
    stage: 'final-solve',
    description: 'Cube is solved!',
    pattern: {
      checks: [
        { face: 2, index: 4, color: null }, // All centres match (runtime check)
      ],
    },
    algorithm: { caseId: 'FS-00', moves: [], why: "YOU SOLVED IT! Amazing work — you understand WHY every move works, not just HOW to follow patterns. That's the real skill." },
  },

  // Case FS-01: Headlights — 2 corners in correct position, permute corners.
  {
    caseId: 'FS-01',
    stage: 'final-solve',
    description: 'Headlights visible — permute corners',
    pattern: {
      checks: [
        { face: 4, index: 0, color: null }, // R[0] same as R[2] = headlights
      ],
    },
    algorithm: {
      caseId: 'FS-01',
      moves: ['R', 'U', "R'", 'U', 'R', 'U', 'U', "R'", 'U'],
      why: "Look for two matching corner stickers on the same side — called headlights. Position them at the back, then apply this sequence to cycle the other corners into place.",
    },
  },

  // Case FS-02: No headlights — apply corner permutation then re-check.
  {
    caseId: 'FS-02',
    stage: 'final-solve',
    description: 'No headlights — cycle corners first',
    pattern: {
      checks: [],
    },
    algorithm: {
      caseId: 'FS-02',
      moves: ['R', 'U', "R'", 'U', 'R', 'U', 'U', "R'"],
      why: "No matching corners yet — apply this sequence once to create headlights, then look for them and apply it again from the headlights position.",
    },
  },

  // Case FS-03: Corners correct, cycle edges (U-perm).
  {
    caseId: 'FS-03',
    stage: 'final-solve',
    description: 'Corners done — cycle the last layer edges',
    pattern: {
      checks: [
        { face: 2, index: 0, color: null }, // corner matches but edge doesn't
      ],
    },
    algorithm: {
      caseId: 'FS-03',
      moves: ['R', 'U', "R'", 'U', "R'", 'F', 'R', 'R', "U'", "R'", "U'", 'R', 'U', "R'", "F'"],
      why: "All the corners are in the right place — now we just need to cycle the edges. This is the last algorithm. Apply it and you're done!",
    },
  },
];

export default stages;
