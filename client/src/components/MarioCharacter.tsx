import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  Group,
  Vector3,
  MathUtils,
  Euler,
  AnimationMixer,
  LoopRepeat,
} from 'three';
import type { ScrollEngine } from '../engine/ScrollEngine';

interface MarioCharacterProps {
  scrollEngine: ScrollEngine | null;
}

interface CharacterState {
  isGrounded: boolean;
  isJumping: boolean;
  velocity: Vector3;
  facingAngle: number;
  animState: 'idle' | 'run' | 'jump' | 'fall';
}

const CHARACTER_CONFIG = {
  heightOffset: 0.5,
  groundY: 0,
  jumpHeight: 3.5,
  jumpDuration: 0.6,
  gravity: -28,
  runTiltMax: 0.12,
  turnSpeed: 8,
  bobAmplitude: 0.08,
  bobFrequency: 12,
  squashOnLand: 0.15,
  stretchOnJump: 0.12,
  shadowScale: 1.2,
};

const MARIO_PATH_POINTS: [number, number, number][] = [
  [0, 0, 0],
  [8, 0, -2],
  [16, 0, 0],
  [24, 2, -1],
  [32, 4, 0],
  [40, 4, 1],
  [48, 4, 0],
  [52, 0, -4],
  [56, -4, -8],
  [64, -4, -10],
  [72, -4, -8],
  [80, 0, -4],
  [88, 0, 0],
  [96, 2, 1],
  [104, 4, 0],
  [112, 4, -1],
  [120, 2, 0],
  [128, 0, 0],
  [136, 0, 1],
  [144, 0, 0],
];

export function MarioCharacter({ scrollEngine }: MarioCharacterProps) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF('/models/Mario.glb');
  const mixerRef = useRef<AnimationMixer | null>(null);

  const state = useRef<CharacterState>({
    isGrounded: true,
    isJumping: false,
    velocity: new Vector3(),
    facingAngle: 0,
    animState: 'idle',
  });

  const prevPos = useRef(new Vector3());
  const smoothPos = useRef(new Vector3());
  const landTime = useRef(0);

  const marioModel = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    if (animations.length > 0) {
      mixerRef.current = new AnimationMixer(clone);
      const action = mixerRef.current.clipAction(animations[0]);
      action.setLoop(LoopRepeat, Infinity);
      action.play();
    }

    return clone;
  }, [scene, animations]);

  useFrame((_, delta) => {
    if (!scrollEngine || !groupRef.current) return;

    const progress = scrollEngine.getProgress();
    const scrollState = scrollEngine.getState();

    const pathIndex = progress * (MARIO_PATH_POINTS.length - 1);
    const i = Math.floor(pathIndex);
    const alpha = pathIndex - i;

    const p0 = MARIO_PATH_POINTS[Math.max(0, i - 1)];
    const p1 = MARIO_PATH_POINTS[Math.min(i, MARIO_PATH_POINTS.length - 1)];
    const p2 = MARIO_PATH_POINTS[Math.min(i + 1, MARIO_PATH_POINTS.length - 1)];
    const p3 = MARIO_PATH_POINTS[Math.min(i + 2, MARIO_PATH_POINTS.length - 1)];

    const targetPos = catmullRomInterp(p0, p1, p2, p3, alpha);
    targetPos[1] += CHARACTER_CONFIG.heightOffset;

    smoothPos.current.lerp(
      new Vector3(...targetPos),
      0.08
    );

    groupRef.current.position.copy(smoothPos.current);

    const moveDir = smoothPos.current.clone().sub(prevPos.current);
    if (moveDir.length() > 0.01) {
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      state.current.facingAngle = MathUtils.lerp(
        state.current.facingAngle,
        targetAngle,
        CHARACTER_CONFIG.turnSpeed * delta
      );
    }

    groupRef.current.rotation.y = state.current.facingAngle;

    const speed = Math.abs(scrollState.velocity);
    const tilt = MathUtils.clamp(
      speed * 2,
      0,
      CHARACTER_CONFIG.runTiltMax
    );
    groupRef.current.rotation.x = tilt;

    if (speed > 0.01) {
      const bob =
        Math.sin(performance.now() / 1000 * CHARACTER_CONFIG.bobFrequency) *
        CHARACTER_CONFIG.bobAmplitude *
        speed * 5;
      groupRef.current.position.y += bob;
    }

    const timeSinceLand = performance.now() / 1000 - landTime.current;
    if (timeSinceLand < 0.2) {
      const squash = 1 - CHARACTER_CONFIG.squashOnLand *
        (1 - timeSinceLand / 0.2);
      groupRef.current.scale.set(
        1 / Math.sqrt(squash),
        squash,
        1 / Math.sqrt(squash)
      );
    } else {
      groupRef.current.scale.lerp(new Vector3(1, 1, 1), 0.1);
    }

    prevPos.current.copy(smoothPos.current);

    if (mixerRef.current) {
      const timeScale = speed > 0.01 ? MathUtils.clamp(speed * 10, 0.5, 2) : 0;
      mixerRef.current.timeScale = timeScale;
      mixerRef.current.update(delta);
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={marioModel} scale={[0.5, 0.5, 0.5]} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        receiveShadow
      >
        <circleGeometry args={[CHARACTER_CONFIG.shadowScale, 32]} />
        <meshBasicMaterial
          color="black"
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function catmullRomInterp(
  p0: number[],
  p1: number[],
  p2: number[],
  p3: number[],
  t: number
): [number, number, number] {
  const t2 = t * t;
  const t3 = t2 * t;

  return [0, 1, 2].map((axis) => {
    const v0 = p0[axis], v1 = p1[axis], v2 = p2[axis], v3 = p3[axis];
    return 0.5 * (
      (2 * v1) +
      (-v0 + v2) * t +
      (2 * v0 - 5 * v1 + 4 * v2 - v3) * t2 +
      (-v0 + 3 * v1 - 3 * v2 + v3) * t3
    );
  }) as [number, number, number];
}

useGLTF.preload('/models/Mario.glb');
