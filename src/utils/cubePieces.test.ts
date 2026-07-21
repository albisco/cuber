import { describe, it, expect } from 'vitest';
import type { CubeState, Color, Face } from '../types/cube';
import {
  CORNERS, EDGES, CORNER_BY_NAME, EDGE_BY_NAME,
  readSlot, colorOnFace, isSlotSolved, findCorner, findEdge, allSlots,
} from './cubePieces';
import { applyMoves } from './moveEngine';
import { FACE } from '../types/cube';

function face(color: Color): Face {
  return Array(9).fill(color) as Face;
}

function solvedState(): CubeState {
  return {
    faces: [
      face('W'), face('Y'), face('G'), face('B'), face('R'), face('O'),
    ],
  };
}

describe('cube piece slots', () => {
  it('has 8 corners and 12 edges', () => {
    expect(CORNERS.length).toBe(8);
    expect(EDGES.length).toBe(12);
  });

  it('every corner has 3 distinct-colored stickers, every edge has 2', () => {
    for (const c of CORNERS) expect(new Set(c.solvedColors).size).toBe(3);
    for (const e of EDGES) expect(new Set(e.solvedColors).size).toBe(2);
  });

  it('every corner and edge slot maps to a distinct set of sticker facelets, covering all 54 with the 6 centres', () => {
    const seen = new Set<string>();
    for (const slot of allSlots()) {
      for (const s of slot.stickers) {
        const key = `${s.face}:${s.index}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
    // 8 corners * 3 + 12 edges * 2 = 48, plus 6 centres = 54
    expect(seen.size).toBe(48);
  });

  it('all slot names are unique and reachable by name', () => {
    const cornerNames = new Set(CORNERS.map(c => c.name));
    const edgeNames = new Set(EDGES.map(e => e.name));
    expect(cornerNames.size).toBe(8);
    expect(edgeNames.size).toBe(12);
    for (const name of cornerNames) expect(CORNER_BY_NAME[name]).toBeDefined();
    for (const name of edgeNames) expect(EDGE_BY_NAME[name]).toBeDefined();
  });

  it('on a solved cube, every slot reads its solved colors and isSlotSolved is true', () => {
    const s = solvedState();
    for (const slot of allSlots()) {
      expect(readSlot(s, slot)).toEqual(slot.solvedColors);
      expect(isSlotSolved(s, slot)).toBe(true);
    }
  });

  it('colorOnFace returns null for a face the slot does not touch', () => {
    const s = solvedState();
    const ufr = CORNER_BY_NAME['UFR'];
    expect(colorOnFace(s, ufr, FACE.D)).toBeNull();
    expect(colorOnFace(s, ufr, FACE.U)).toBe('W');
    expect(colorOnFace(s, ufr, FACE.F)).toBe('G');
    expect(colorOnFace(s, ufr, FACE.R)).toBe('R');
  });

  it('findCorner locates the white-green-red corner after scrambling, and its colors stay a fixed set', () => {
    const scrambled = applyMoves(solvedState(), ['R', 'U', "R'", "F'", 'U2', 'L']);
    const { slot, colors } = findCorner(scrambled, ['W', 'G', 'R']);
    expect(new Set(colors)).toEqual(new Set(['W', 'G', 'R']));
    // Reading directly at the found slot must match what findCorner returned.
    expect(readSlot(scrambled, slot)).toEqual(colors);
  });

  it('findEdge locates the white-green edge after scrambling', () => {
    const scrambled = applyMoves(solvedState(), ["U'", 'R2', 'F', "D'", 'B']);
    const { slot, colors } = findEdge(scrambled, ['W', 'G']);
    expect(new Set(colors)).toEqual(new Set(['W', 'G']));
    expect(readSlot(scrambled, slot)).toEqual(colors);
  });

  it('every unique corner and edge color combination appears exactly once on a solved cube', () => {
    const s = solvedState();
    const cornerSets = CORNERS.map(c => JSON.stringify([...readSlot(s, c)].sort()));
    const edgeSets = EDGES.map(e => JSON.stringify([...readSlot(s, e)].sort()));
    expect(new Set(cornerSets).size).toBe(8);
    expect(new Set(edgeSets).size).toBe(12);
  });
});
