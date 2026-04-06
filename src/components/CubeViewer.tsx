// 3D animated cube viewer — lazy loaded separately from the main bundle.
// Renders the actual cube state (sticker colors from CubeState).
// Highlights and animates the face for the current move.

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import type { CubeState } from '../types/cube';

// Map Color codes to hex
const C: Record<string, string> = {
  W: '#ffffff',
  Y: '#f5d800',
  G: '#009b48',
  B: '#0046ad',
  R: '#b90000',
  O: '#ff5800',
};

const DARK = '#1a1a1a'; // interior / hidden face

/**
 * For a cubelet at (x,y,z), return the 6 face colors in BoxGeometry order:
 * [+x (R), -x (L), +y (U), -y (D), +z (F), -z (B)]
 *
 * Face index in CubeState: U=0, D=1, F=2, B=3, R=4, L=5
 * Sticker layout per face (viewed from outside, row-major):
 *   0 1 2
 *   3 4 5
 *   6 7 8
 *
 * Mappings (face, row, col → sticker index = row*3 + col):
 *   R (+x): row = (1−y), col = (z+1)
 *   L (−x): row = (1−y), col = (1−z)
 *   U (+y): row = (z+1), col = (x+1)
 *   D (−y): row = (1−z), col = (x+1)
 *   F (+z): row = (1−y), col = (x+1)
 *   B (−z): row = (1−y), col = (1−x)
 */
function cubeletColors(state: CubeState, x: number, y: number, z: number): string[] {
  const { faces } = state;
  const s = (faceIdx: number, row: number, col: number) =>
    C[faces[faceIdx][row * 3 + col]] ?? DARK;

  return [
    x === 1  ? s(4, 1 - y, z + 1) : DARK, // +x R
    x === -1 ? s(5, 1 - y, 1 - z) : DARK, // -x L
    y === 1  ? s(0, z + 1, x + 1) : DARK, // +y U
    y === -1 ? s(1, 1 - z, x + 1) : DARK, // -y D
    z === 1  ? s(2, 1 - y, x + 1) : DARK, // +z F
    z === -1 ? s(3, 1 - y, 1 - x) : DARK, // -z B
  ];
}

// Parse move notation → which face rotates and which direction.
function parseMoveAxis(move: string): { axis: 'x' | 'y' | 'z'; dir: 1 | -1 } {
  const face = move.replace(/[2']/g, '');
  const prime = move.includes("'");
  const map: Record<string, { axis: 'x' | 'y' | 'z'; dir: 1 | -1 }> = {
    R: { axis: 'x', dir: prime ? 1 : -1 },
    L: { axis: 'x', dir: prime ? -1 : 1 },
    U: { axis: 'y', dir: prime ? -1 : 1 },
    D: { axis: 'y', dir: prime ? 1 : -1 },
    F: { axis: 'z', dir: prime ? 1 : -1 },
    B: { axis: 'z', dir: prime ? -1 : 1 },
  };
  return map[face] ?? { axis: 'y', dir: 1 };
}

function StaticCube({ state }: { state: CubeState }) {
  const pieces: React.ReactElement[] = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const colors = cubeletColors(state, x, y, z);
        pieces.push(
          <mesh key={`${x}${y}${z}`} position={[x * 1.05, y * 1.05, z * 1.05]}>
            <boxGeometry args={[0.98, 0.98, 0.98]} />
            {colors.map((color, i) => (
              <meshStandardMaterial key={i} attach={`material-${i}`} color={color} />
            ))}
          </mesh>
        );
      }
    }
  }
  return <>{pieces}</>;
}

function HighlightedFace({ move }: { move: string }) {
  const { axis, dir } = parseMoveAxis(move);
  const position: [number, number, number] =
    axis === 'x' ? [dir * 1.6, 0, 0] :
    axis === 'y' ? [0, dir * 1.6, 0] :
                   [0, 0, dir * 1.6];
  const rotation: [number, number, number] =
    axis === 'x' ? [0, Math.PI / 2, 0] :
    axis === 'y' ? [Math.PI / 2, 0, 0] :
                   [0, 0, 0];

  const { opacity } = useSpring({
    from: { opacity: 0.15 },
    to: { opacity: 0.55 },
    loop: { reverse: true },
    config: { duration: 700 },
  });

  return (
    <animated.mesh position={position} rotation={rotation}>
      <planeGeometry args={[3.3, 3.3]} />
      <animated.meshStandardMaterial
        color="#ffee44"
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </animated.mesh>
  );
}

function RotatingGroup({ move, state }: { move: string; state: CubeState }) {
  const groupRef = useRef<THREE.Group>(null!);
  const { axis, dir } = parseMoveAxis(move);
  const targetAngle = (Math.PI / 2) * dir;
  const progress = useRef(0);
  const done = useRef(false);

  useFrame((_, delta) => {
    if (done.current || !groupRef.current) return;
    const speed = 2.5;
    progress.current = Math.min(progress.current + delta * speed, Math.abs(targetAngle));
    const angle = progress.current * Math.sign(targetAngle);
    groupRef.current.rotation[axis] = angle;
    if (progress.current >= Math.abs(targetAngle)) done.current = true;
  });

  const layerPos = dir;
  const pieces: React.ReactElement[] = [];
  for (let a = -1; a <= 1; a++) {
    for (let b = -1; b <= 1; b++) {
      const [x, y, z] =
        axis === 'x' ? [layerPos, a, b] :
        axis === 'y' ? [a, layerPos, b] :
                       [a, b, layerPos];
      const pos: [number, number, number] = [x * 1.05, y * 1.05, z * 1.05];
      const colors = cubeletColors(state, x, y, z);

      pieces.push(
        <mesh key={`${a}${b}`} position={pos}>
          <boxGeometry args={[0.96, 0.96, 0.96]} />
          {colors.map((color, i) => (
            <meshStandardMaterial key={i} attach={`material-${i}`} color={color} />
          ))}
        </mesh>
      );
    }
  }
  return <group ref={groupRef}>{pieces}</group>;
}

interface Props {
  cubeState: CubeState;
  currentMove: string;
  animating: boolean;
}

export default function CubeViewer({ cubeState, currentMove, animating }: Props) {
  return (
    <div style={{ width: '100%', height: 220 }}>
      <Canvas camera={{ position: [4, 3.5, 4], fov: 40 }} shadows={false}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} />
        <StaticCube state={cubeState} />
        {animating && <RotatingGroup key={currentMove} move={currentMove} state={cubeState} />}
        {!animating && <HighlightedFace move={currentMove} />}
      </Canvas>
    </div>
  );
}
