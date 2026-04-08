import { useState, useRef, useCallback, useEffect } from 'react';
import type { Color, CubeState, FaceName } from '../types/cube';
import { SCAN_ORDER, FACE, FACE_CENTRES } from '../types/cube';
import styles from './CameraFlow.module.css';
import css from './CameraScanner.module.css';

const COLOR_HEX: Record<Color | 'blank', string> = {
  W: '#ffffff', Y: '#f5d800', G: '#009b48', B: '#0046ad', R: '#b90000', O: '#ff5800', blank: '#d0d0d0',
};

const COLOR_LABELS: Record<Color, string> = {
  W: 'White', Y: 'Yellow', G: 'Green', B: 'Blue', R: 'Red', O: 'Orange',
};

const COLORS: Color[] = ['W', 'Y', 'G', 'B', 'R', 'O'];

const FACE_NAMES: Record<FaceName, string> = {
  U: 'White — Top', D: 'Yellow — Bottom', F: 'Green — Front', B: 'Blue — Back', R: 'Red — Right', L: 'Orange — Left',
};

const FACE_TIPS: Record<FaceName, string> = {
  U: 'Look DOWN at the white face. Green should be closest to you (bottom of grid).',
  D: 'Flip cube. Look DOWN at the yellow face. Green should be at the top of the grid.',
  F: 'Hold normally — white on top, green facing you.',
  B: 'Spin the cube so blue faces you — white stays on top.',
  R: 'Tilt the cube so red faces you. Green (front) will be on your LEFT, Blue (back) on your RIGHT.',
  L: 'Tilt the cube so orange faces you. Blue (back) will be on your LEFT, Green (front) on your RIGHT.',
};

const GRID_BORDERS: Record<FaceName, { top: FaceName; bottom: FaceName; left: FaceName; right: FaceName }> = {
  U: { top: 'B', bottom: 'F', left: 'L', right: 'R' },
  D: { top: 'F', bottom: 'B', left: 'L', right: 'R' },
  F: { top: 'U', bottom: 'D', left: 'L', right: 'R' },
  B: { top: 'U', bottom: 'D', left: 'R', right: 'L' },
  R: { top: 'U', bottom: 'D', left: 'F', right: 'B' },
  L: { top: 'U', bottom: 'D', left: 'B', right: 'F' },
};

const MIRROR_COLS = new Set<FaceName>(['R', 'L']);

function getDominantColor(imageData: ImageData, x: number, y: number): Color | null {
  const idx = (y * imageData.width + x) * 4;
  const r = imageData.data[idx] / 255;
  const g = imageData.data[idx + 1] / 255;
  const b = imageData.data[idx + 2] / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  if (max - min < 0.15 || l < 0.15 || l > 0.85) return null;
  
  const isWhiteish = r > 0.8 && g > 0.8 && b > 0.8;
  const isYellowish = r > 0.7 && g > 0.6 && b < 0.3;
  const isOrange = r > g && g > b * 1.5;
  const isReddish = r > g + 0.1 && r > b + 0.1 && !isOrange;
  const isGreenish = g > r && g > b;
  const isBlueish = b > r && b > g;
  
  if (isWhiteish && l > 0.7) return 'W';
  if (isYellowish && l > 0.5) return 'Y';
  if (isOrange && l > 0.4) return 'O';
  if (isReddish && l > 0.25) return 'R';
  if (isGreenish && l > 0.2) return 'G';
  if (isBlueish && l > 0.2) return 'B';
  
  return null;
}

interface Props {
  onComplete: (state: CubeState) => void;
  onCancel: () => void;
}

function BorderChip({ face, orientation = 'h' }: { face: FaceName; orientation?: 'h' | 'v' }) {
  const color = FACE_CENTRES[face];
  return (
    <div
      className={`${css.borderChip} ${orientation === 'v' ? css.borderChipV : ''} ${color === 'W' ? css.borderChipWhite : ''}`}
      style={{ backgroundColor: COLOR_HEX[color] }}
      title={COLOR_LABELS[color]}
    >
      {COLOR_LABELS[color][0]}
    </div>
  );
}

export default function CameraFlow({ onComplete, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [currentFaceIdx, setCurrentFaceIdx] = useState(0);
  const [faces, setFaces] = useState<(Color | null)[][]>(SCAN_ORDER.map(() => Array(9).fill(null)));
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [detectedColors, setDetectedColors] = useState<(Color | null)[]>(Array(9).fill(null));
  const [selectedEditIdx, setSelectedEditIdx] = useState<number | null>(null);

  const currentFaceName = SCAN_ORDER[currentFaceIdx];
  const borders = GRID_BORDERS[currentFaceName];
  const mirrorCols = MIRROR_COLS.has(currentFaceName);

  useEffect(() => {
    let mounted = true;
    async function initCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (!mounted) {
          mediaStream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = mediaStream;
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (err) { 
        if (mounted) setError('Could not access camera.'); 
      }
    }
    initCamera();
    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const gridSize = Math.min(vw, vh) * 0.5;
    const startX = (vw - gridSize) / 2;
    const startY = (vh - gridSize) / 2;
    const cellSize = gridSize / 3;
    
    const colors: (Color | null)[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cx = Math.floor(startX + col * cellSize + cellSize / 2);
        const cy = Math.floor(startY + row * cellSize + cellSize / 2);
        colors.push(getDominantColor(imageData, cx, cy));
      }
    }
    colors[4] = FACE_CENTRES[currentFaceName];
    setDetectedColors(colors);
    setShowResult(true);
  }, [currentFaceName]);

  const handleRetake = useCallback(() => {
    setDetectedColors(Array(9).fill(null));
    setShowResult(false);
    setSelectedEditIdx(null);
  }, []);

  const handleStickerClick = (idx: number) => {
    if (idx === 4) return;
    setSelectedEditIdx(idx);
  };

  const handleColorSelect = (color: Color) => {
    if (selectedEditIdx === null) return;
    const newColors = [...detectedColors];
    newColors[selectedEditIdx] = color;
    setDetectedColors(newColors);
    setSelectedEditIdx(null);
  };

  const handleConfirm = () => {
    const newFaces = [...faces];
    newFaces[currentFaceIdx] = detectedColors;
    setFaces(newFaces);
    
    const nextIdx = currentFaceIdx + 1;
    if (nextIdx < SCAN_ORDER.length) {
      setCurrentFaceIdx(nextIdx);
      handleRetake();
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

      <h2 className={styles.title}>Scan {FACE_NAMES[currentFaceName]}</h2>
      <p className={styles.tip}>{FACE_TIPS[currentFaceName]}</p>
      
      {!showResult ? (
        <>
          <div className={styles.videoWrapper}>
            <video ref={videoRef} autoPlay playsInline muted className={styles.video} />
            <div className={styles.gridOverlay}>
              <div className={styles.gridLineH1} /><div className={styles.gridLineH2} />
              <div className={styles.gridLineV1} /><div className={styles.gridLineV2} />
            </div>
            <div className={styles.frameGuide}>
              <div className={styles.frameCornerTL} /><div className={styles.frameCornerTR} />
              <div className={styles.frameCornerBL} /><div className={styles.frameCornerBR} />
            </div>
            <div className={styles.captureBorderTop}><BorderChip face={borders.top} orientation="h" /></div>
            <div className={styles.captureBorderLeft}><BorderChip face={borders.left} orientation="v" /></div>
            <div className={styles.captureBorderRight}><BorderChip face={borders.right} orientation="v" /></div>
            <div className={styles.captureBorderBottom}><BorderChip face={borders.bottom} orientation="h" /></div>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.captureBtn} onClick={captureFrame}>📸 Capture Face</button>
        </>
      ) : (
        <div className={styles.resultView}>
          <p className={styles.resultLabel}>Detected colors — tap to change:</p>
          
          <div className={styles.gridWrapper}>
            <div className={styles.borderRow}>
              <BorderChip face={borders.top} orientation="h" />
            </div>
            <div className={styles.gridMiddle}>
              <div className={styles.borderCol}>
                <BorderChip face={borders.left} orientation="v" />
              </div>
              <div className={styles.resultGrid}>
                {Array.from({ length: 9 }, (_, visualIdx) => {
                  const row = Math.floor(visualIdx / 3);
                  const col = visualIdx % 3;
                  const storageIdx = mirrorCols ? row * 3 + (2 - col) : visualIdx;
                  const color = detectedColors[storageIdx];
                  return (
                    <button
                      key={visualIdx}
                      className={`${styles.resultSticker} ${storageIdx === 4 ? styles.resultCenter : ''} ${selectedEditIdx === storageIdx ? styles.resultStickerSelected : ''}`}
                      style={{ backgroundColor: color ? COLOR_HEX[color] : COLOR_HEX.blank }}
                      onClick={() => handleStickerClick(storageIdx)}
                      disabled={storageIdx === 4}
                    >
                      {color ? COLOR_LABELS[color][0] : '?'}
                    </button>
                  );
                })}
              </div>
              <div className={styles.borderCol}>
                <BorderChip face={borders.right} orientation="v" />
              </div>
            </div>
            <div className={styles.borderRow}>
              <BorderChip face={borders.bottom} orientation="h" />
            </div>
          </div>

          {selectedEditIdx !== null && (
            <div className={styles.colorPicker}>
              {COLORS.map(color => (
                <button
                  key={color}
                  className={styles.colorBtn}
                  style={{ backgroundColor: COLOR_HEX[color] }}
                  onClick={() => handleColorSelect(color)}
                >
                  {COLOR_LABELS[color]}
                </button>
              ))}
              <button className={styles.colorBtnClear} onClick={() => { const newColors = [...detectedColors]; newColors[selectedEditIdx] = null; setDetectedColors(newColors); setSelectedEditIdx(null); }}>
                Clear
              </button>
            </div>
          )}

          <div className={styles.resultActions}>
            <button className={styles.retakeBtn} onClick={handleRetake}>Retake</button>
            <button className={styles.confirmBtn} onClick={handleConfirm}>Confirm</button>
          </div>
        </div>
      )}
      
      <button className={styles.cancelBtn} onClick={onCancel}>← Back to choose method</button>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
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