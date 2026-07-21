// Small generic breadth-first search over cube states, used by the solver to
// derive short, provably-correct move sequences for local sub-problems
// (e.g. "get this one edge into its slot using only these moves") instead of
// relying on hand-recalled algorithms. Exhaustive BFS guarantees the shortest
// sequence within `maxDepth`, and correctness follows directly from the
// already-verified move engine.

import type { CubeState } from '../types/cube';
import { applyMove } from './moveEngine';

export function bfsSearch(
  start: CubeState,
  isGoal: (state: CubeState) => boolean,
  moves: string[],
  maxDepth: number
): string[] | null {
  if (isGoal(start)) return [];

  interface Node { state: CubeState; path: string[] }
  let frontier: Node[] = [{ state: start, path: [] }];
  const seen = new Set<string>([JSON.stringify(start)]);

  for (let depth = 0; depth < maxDepth; depth++) {
    const next: Node[] = [];
    for (const { state, path } of frontier) {
      for (const move of moves) {
        const nextState = applyMove(state, move);
        const path2 = [...path, move];
        if (isGoal(nextState)) return path2;
        const key = JSON.stringify(nextState);
        if (!seen.has(key)) {
          seen.add(key);
          next.push({ state: nextState, path: path2 });
        }
      }
    }
    frontier = next;
    if (frontier.length === 0) return null;
  }
  return null;
}
