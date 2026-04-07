# Cuber

A kids' Rubik's cube coaching PWA. Camera-first input, concept-first pedagogy. Built for 9–12 year-olds learning to solve their first cube.

## What it does

You scan (or tap-enter) the state of your cube, and Cuber walks you through the next move with plain-English instructions, a 3D viewer, and the why behind each step. It coaches stages — white cross, first layer, second layer, yellow face, final solve — not raw algorithms.

It's not a solver. Cuber uses pattern matching + per-stage lookup so the explanations are tailored to where the kid actually is, not generated from a search tree they can't follow.

## Stack

- React + TypeScript + Vite
- Zustand (persisted to localStorage)
- Three.js for the 3D cube viewer (lazy-loaded)
- Vitest for unit tests

## Develop

```bash
bun install
bun run dev          # vite dev server on :5173
npx vitest run       # tests
bun run build        # production build
```

## Layout

- `src/components/` — screens (CubeEntry, CoachScreen, WhiteCrossPlan, CubeViewer)
- `src/utils/` — coaching engine, stage completion, white cross diagnosis + picker, cube geometry
- `src/data/stages.ts` — pattern-match cases for legacy stages
- `src/types/cube.ts` — CubeState, Stage, Algorithm types

White cross uses a deterministic locate-and-classify engine (`whiteCrossDiagnosis.ts` + `whiteCrossPicker.ts`) that builds a templated `StagePlan`. Other stages still use the older pattern-match path until they're migrated.
