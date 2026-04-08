import { useState } from 'react';
import type { Color, CubeState } from '../types/cube';
import { SCAN_ORDER, FACE, FACE_CENTRES } from '../types/cube';
import CameraScanner from './CameraScanner';
import styles from './CameraFlow.module.css';

interface Props {
  onComplete: (state: CubeState) => void;
  onCancel: () => void;
}

export default function CameraFlow({ onComplete, onCancel }: Props) {
  const [currentFaceIdx, setCurrentFaceIdx] = useState(0);
  const [faces, setFaces] = useState<(Color | null)[][]>(SCAN_ORDER.map(() => Array(9).fill(null)));

  const currentFaceName = SCAN_ORDER[currentFaceIdx];

  const handleCapture = (colors: (Color | null)[]) => {
    const newFaces = [...faces];
    newFaces[currentFaceIdx] = colors;
    setFaces(newFaces);
    
    const nextIdx = currentFaceIdx + 1;
    if (nextIdx < SCAN_ORDER.length) {
      setCurrentFaceIdx(nextIdx);
    } else {
      const cubeState = convertToCubeState(faces);
      onComplete(cubeState);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        {SCAN_ORDER.map((name, i) => (
          <div
            key={name}
            className={`${styles.progressDot} ${i === currentFaceIdx ? styles.progressDotActive : ''} ${faces[i].every(c => c !== null) ? styles.progressDotDone : ''}`}
          >
            {name}
          </div>
        ))}
      </div>

      <CameraScanner
        faceName={currentFaceName}
        onCapture={handleCapture}
        onCancel={onCancel}
      />

      <button className={styles.skipBtn} onClick={onCancel}>
        ← Back to choose method
      </button>
    </div>
  );
}

function convertToCubeState(scanFaces: (Color | null)[][]): CubeState {
  const scanOrder: Array<'U'|'D'|'F'|'B'|'R'|'L'> = ['U', 'D', 'F', 'B', 'R', 'L'];
  
  const result: CubeState['faces'] = [
    ['W','W','W','W','W','W','W','W','W'],
    ['Y','Y','Y','Y','Y','Y','Y','Y','Y'],
    ['G','G','G','G','G','G','G','G','G'],
    ['B','B','B','B','B','B','B','B','B'],
    ['R','R','R','R','R','R','R','R','R'],
    ['O','O','O','O','O','O','O','O','O'],
  ];

  for (let scanIdx = 0; scanIdx < 6; scanIdx++) {
    const faceName = scanOrder[scanIdx];
    const faceIdx = FACE[faceName];
    const colors = scanFaces[scanIdx];
    
    for (let i = 0; i < 9; i++) {
      if (i === 4) {
        result[faceIdx][i] = FACE_CENTRES[faceName];
      } else {
        result[faceIdx][i] = colors[i] ?? FACE_CENTRES[faceName];
      }
    }
  }

  return { faces: result };
}