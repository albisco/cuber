// Manual cube state input.
// Kid taps each sticker on a 2D grid and picks the color.
// All non-centre stickers start blank (grey) — must be explicitly filled.

import { useState, useCallback } from 'react';
import type { Color, CubeState, FaceName } from '../types/cube';
import { FACE, SCAN_ORDER } from '../types/cube';
import { validateCubeState } from '../utils/stageCompletion';
import styles from './ManualInput.module.css';

type InputColor = Color | null;

const COLORS: Color[] = ['W', 'Y', 'G', 'B', 'R', 'O'];

const COLOR_LABELS: Record<Color, string> = {
  W: 'White', Y: 'Yellow', G: 'Green', B: 'Blue', R: 'Red', O: 'Orange',
};

const COLOR_HEX: Record<Color | 'blank', string> = {
  W: '#ffffff',
  Y: '#f5d800',
  G: '#009b48',
  B: '#0046ad',
  R: '#b90000',
  O: '#ff5800',
  blank: '#d0d0d0',
};

const FACE_CENTRES: Record<FaceName, Color> = {
  U: 'W', D: 'Y', F: 'G', B: 'B', R: 'R', L: 'O',
};

const FACE_NAMES: Record<FaceName, string> = {
  U: 'White — Top',
  D: 'Yellow — Bottom',
  F: 'Green — Front',
  B: 'Blue — Back',
  R: 'Red — Right',
  L: 'Orange — Left',
};

// How to hold the cube to look at this face head-on
const FACE_TIPS: Record<FaceName, string> = {
  U: 'Look DOWN at the white face. Green should be closest to you (bottom of grid).',
  D: 'Flip cube. Look DOWN at the yellow face. Green should be at the top of the grid.',
  F: 'Hold normally — white on top, green facing you.',
  B: 'Spin the cube so blue faces you — white stays on top.',
  R: 'Tilt the cube so red faces you. Green (front) will be on your LEFT, Blue (back) on your RIGHT.',
  L: 'Tilt the cube so orange faces you. Blue (back) will be on your LEFT, Green (front) on your RIGHT.',
};

// Which face borders each side of the grid (top, right, bottom, left)
// Derived from the cubelet coordinate mapping:
//   U: row=(z+1) col=(x+1)  → top=B(z=-1), bottom=F(z=1), left=L(x=-1), right=R(x=1)
//   D: row=(1-z) col=(x+1)  → top=F(z=1),  bottom=B(z=-1), left=L, right=R
//   F: row=(1-y) col=(x+1)  → top=U(y=1),  bottom=D(y=-1), left=L(x=-1), right=R(x=1)
//   B: row=(1-y) col=(1-x)  → top=U,       bottom=D, left=R(x=1→col0), right=L(x=-1→col2)
//   R: row=(1-y) col=(z+1)  → top=U,       bottom=D, left=B(z=-1), right=F(z=1)
//   L: row=(1-y) col=(1-z)  → top=U,       bottom=D, left=F(z=1), right=B(z=-1)
// Border labels reflect what you PHYSICALLY SEE when holding the cube correctly.
// R and L faces are mirror-flipped vs the mathematical coordinate: when you tilt to
// see the Red face, Green (front) is on your left and Blue (back) is on your right.
const GRID_BORDERS: Record<FaceName, { top: FaceName; bottom: FaceName; left: FaceName; right: FaceName }> = {
  U: { top: 'B', bottom: 'F', left: 'L', right: 'R' },
  D: { top: 'F', bottom: 'B', left: 'L', right: 'R' },
  F: { top: 'U', bottom: 'D', left: 'L', right: 'R' },
  B: { top: 'U', bottom: 'D', left: 'R', right: 'L' },
  R: { top: 'U', bottom: 'D', left: 'F', right: 'B' }, // physical: Green left, Blue right
  L: { top: 'U', bottom: 'D', left: 'B', right: 'F' }, // physical: Blue left, Green right
};

// R and L faces need column order flipped in the display so the grid matches
// the physical view (left=front for R, left=back for L).
const MIRROR_COLS = new Set<FaceName>(['R', 'L']);

type InputFace = [InputColor, InputColor, InputColor, InputColor, InputColor, InputColor, InputColor, InputColor, InputColor];

function makeBlankFace(centre: Color): InputFace {
  return [null, null, null, null, centre, null, null, null, null];
}

function makeInitialFaces(): InputFace[] {
  return SCAN_ORDER.map(name => makeBlankFace(FACE_CENTRES[name]));
}

// Small colored chip showing an adjacent face label
function BorderChip({ face, orientation }: { face: FaceName; orientation: 'h' | 'v' }) {
  const color = FACE_CENTRES[face];
  return (
    <div
      className={`${styles.borderChip} ${orientation === 'v' ? styles.borderChipV : ''} ${color === 'W' ? styles.borderChipWhite : ''}`}
      style={{ backgroundColor: COLOR_HEX[color] }}
      title={COLOR_LABELS[color]}
    >
      {COLOR_LABELS[color][0]}
    </div>
  );
}

interface Props {
  initialState?: CubeState;
  onConfirm: (state: CubeState) => void;
  onCancel: () => void;
}

export default function ManualInput({ initialState, onConfirm, onCancel }: Props) {
  const [faces, setFaces] = useState<InputFace[]>(() =>
    initialState
      ? initialState.faces.map(f => [...f] as InputFace)
      : makeInitialFaces()
  );
  const [selectedColor, setSelectedColor] = useState<Color>('W');
  const [currentFaceIdx, setCurrentFaceIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const currentFaceName = SCAN_ORDER[currentFaceIdx];
  const currentFaceId = FACE[currentFaceName];
  const borders = GRID_BORDERS[currentFaceName];
  const mirrorCols = MIRROR_COLS.has(currentFaceName);

  const paintSticker = useCallback((stickerIdx: number) => {
    if (stickerIdx === 4) return;
    setFaces(prev => {
      const next = prev.map(f => [...f]) as InputFace[];
      next[currentFaceId][stickerIdx] = selectedColor;
      return next;
    });
    setError(null);
  }, [currentFaceId, selectedColor]);

  const blankCount = faces.reduce((total, face) =>
    total + face.filter((c, i) => i !== 4 && c === null).length, 0);

  const handleConfirm = () => {
    if (blankCount > 0) {
      setError(`${blankCount} sticker${blankCount === 1 ? '' : 's'} still need a colour. Tap the grey ones.`);
      return;
    }
    const state: CubeState = {
      faces: faces.map(f => f as [Color,Color,Color,Color,Color,Color,Color,Color,Color]) as CubeState['faces'],
    };
    const result = validateCubeState(state);
    if (!result.valid) {
      setError(result.error ?? 'Something looks off. Check all faces again.');
      return;
    }
    setError(null);
    onConfirm(state);
  };

  const resetFace = () => {
    setFaces(prev => {
      const next = [...prev] as InputFace[];
      next[currentFaceId] = makeBlankFace(FACE_CENTRES[currentFaceName]);
      return next;
    });
    setError(null);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Set up your cube</h2>
      <p className={styles.subtitle}>
        Tap a sticker, then tap its colour below.
      </p>

      {/* Face tabs */}
      <div className={styles.faceNav}>
        {SCAN_ORDER.map((faceName, i) => {
          const faceId = FACE[faceName];
          const filled = faces[faceId].filter((c, si) => si !== 4 && c !== null).length;
          const complete = filled === 8;
          return (
            <button
              key={faceName}
              className={`${styles.faceBtn} ${i === currentFaceIdx ? styles.faceBtnActive : ''} ${complete ? styles.faceBtnDone : ''}`}
              onClick={() => setCurrentFaceIdx(i)}
            >
              <span
                className={styles.faceBtnDot}
                style={{ backgroundColor: COLOR_HEX[FACE_CENTRES[faceName]] }}
              />
              {complete ? '✓' : faceName}
            </button>
          );
        })}
      </div>

      <div className={styles.faceInfo}>
        <span className={styles.faceName}>{FACE_NAMES[currentFaceName]}</span>
        <button className={styles.resetBtn} onClick={resetFace}>Clear</button>
      </div>

      <p className={styles.faceTip}>{FACE_TIPS[currentFaceName]}</p>

      {/* Grid with border reference chips */}
      <div className={styles.gridWrapper}>
        {/* Top border */}
        <div className={styles.borderRow}>
          <BorderChip face={borders.top} orientation="h" />
        </div>

        <div className={styles.gridMiddle}>
          {/* Left border */}
          <BorderChip face={borders.left} orientation="v" />

          {/* 3×3 sticker grid — columns are flipped for R and L to match physical view */}
          <div className={styles.grid}>
            {Array.from({ length: 9 }, (_, visualIdx) => {
              const row = Math.floor(visualIdx / 3);
              const col = visualIdx % 3;
              const storageIdx = mirrorCols ? row * 3 + (2 - col) : visualIdx;
              const color = faces[currentFaceId][storageIdx];
              return (
                <button
                  key={visualIdx}
                  className={`${styles.sticker} ${storageIdx === 4 ? styles.centre : ''} ${color === null ? styles.stickerBlank : ''} ${color === 'W' ? styles.stickerWhite : ''}`}
                  style={{ backgroundColor: color ? COLOR_HEX[color] : COLOR_HEX.blank }}
                  onClick={() => paintSticker(storageIdx)}
                  aria-label={`Sticker: ${color ? COLOR_LABELS[color] : 'blank'}`}
                />
              );
            })}
          </div>

          {/* Right border */}
          <BorderChip face={borders.right} orientation="v" />
        </div>

        {/* Bottom border */}
        <div className={styles.borderRow}>
          <BorderChip face={borders.bottom} orientation="h" />
        </div>
      </div>

      {/* Colour picker */}
      <div className={styles.colorPicker}>
        {COLORS.map(color => (
          <button
            key={color}
            className={`${styles.colorBtn} ${color === selectedColor ? styles.colorBtnActive : ''} ${color === 'W' ? styles.colorBtnWhite : ''}`}
            style={{ backgroundColor: COLOR_HEX[color] }}
            onClick={() => setSelectedColor(color)}
            aria-label={`${COLOR_LABELS[color]}${color === selectedColor ? ' (selected)' : ''}`}
          >
            {color === selectedColor && <span className={styles.colorTick}>✓</span>}
          </button>
        ))}
      </div>
      <p className={styles.selectedLabel}>
        Selected: <strong>{COLOR_LABELS[selectedColor]}</strong>
      </p>

      {blankCount > 0 && !error && (
        <p className={styles.blankCount}>{blankCount} sticker{blankCount !== 1 ? 's' : ''} left to fill</p>
      )}
      {error && <p className={styles.error}>{error}</p>}

      {/* Mini net — tappable */}
      <div className={styles.netPreview}>
        {SCAN_ORDER.map((faceName) => {
          const faceId = FACE[faceName];
          return (
            <button
              key={faceName}
              className={`${styles.miniface} ${SCAN_ORDER.indexOf(faceName) === currentFaceIdx ? styles.minifaceActive : ''}`}
              onClick={() => setCurrentFaceIdx(SCAN_ORDER.indexOf(faceName))}
            >
              <span className={styles.miniFaceLabel}>{faceName}</span>
              <div className={styles.miniGrid}>
                {faces[faceId].map((c, si) => (
                  <div
                    key={si}
                    className={`${styles.miniSticker} ${c === 'W' ? styles.miniStickerWhite : ''}`}
                    style={{ backgroundColor: c ? COLOR_HEX[c] : COLOR_HEX.blank }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className={styles.actions}>
        <button className={styles.btnSecondary} onClick={onCancel}>Back</button>
        <button className={styles.btnPrimary} onClick={handleConfirm} disabled={blankCount > 0}>
          {blankCount > 0 ? `${blankCount} left…` : 'Find my next move →'}
        </button>
      </div>
    </div>
  );
}
