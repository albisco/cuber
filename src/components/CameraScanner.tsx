import { useState, useRef, useCallback, useEffect } from 'react';
import type { Color, FaceName } from '../types/cube';
import { FACE_CENTRES } from '../types/cube';
import styles from './CameraScanner.module.css';

const COLOR_HEX: Record<Color | 'blank', string> = {
  W: '#ffffff', Y: '#f5d800', G: '#009b48', B: '#0046ad', R: '#b90000', O: '#ff5800', blank: '#d0d0d0',
};

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
  onCapture: (colors: (Color | null)[]) => void;
  onCancel: () => void;
  faceName: FaceName;
}

export default function CameraScanner({ onCapture, onCancel, faceName }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedColors, setDetectedColors] = useState<(Color | null)[]>(Array(9).fill(null));
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    async function initCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (err) { setError('Could not access camera.'); }
    }
    initCamera();
    return () => { stream?.getTracks().forEach(track => track.stop()); };
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
    colors[4] = FACE_CENTRES[faceName];
    setDetectedColors(colors);
    setShowResult(true);
  }, [faceName]);

  const handleConfirm = () => onCapture(detectedColors);
  const handleRetake = () => { setDetectedColors(Array(9).fill(null)); setShowResult(false); };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Scan {FACE_NAMES[faceName]}</h2>
      <p className={styles.tip}>{FACE_TIPS[faceName]}</p>
      
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
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.captureBtn} onClick={captureFrame}>📸 Capture Face</button>
        </>
      ) : (
        <div className={styles.resultView}>
          <p className={styles.resultLabel}>Detected colors:</p>
          <div className={styles.resultGrid}>
            {detectedColors.map((color, idx) => (
              <div key={idx} className={`${styles.resultSticker} ${idx === 4 ? styles.resultCenter : ''}`}
                style={{ backgroundColor: color ? COLOR_HEX[color] : COLOR_HEX.blank }}>
                {color || '?'}
              </div>
            ))}
          </div>
          <div className={styles.resultActions}>
            <button className={styles.retakeBtn} onClick={handleRetake}>Retake</button>
            <button className={styles.confirmBtn} onClick={handleConfirm}>Confirm</button>
          </div>
        </div>
      )}
      <button className={styles.cancelBtn} onClick={onCancel}>← Back</button>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}