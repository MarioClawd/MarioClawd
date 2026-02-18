import { useRef, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment, Stars } from '@react-three/drei';
import { Vector3, Group, MathUtils } from 'three';

import { ScrollEngine } from '../engine/ScrollEngine';
import { CameraPath, WORLD_CAMERA_KEYFRAMES } from '../engine/CameraPath';
import { MarioCharacter } from './MarioCharacter';
import { CrabEnemies } from './CrabEnemies';
import { SkyDome } from './SkyDome';

interface ScrollWorldProps {
  onComplete: () => void;
  onProgress?: (progress: number) => void;
}

function WorldModel() {
  const { scene } = useGLTF('/models/Mario.glb');

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
          child.material.envMapIntensity = 0.4;
        }
      }
    });
    return clone;
  }, [scene]);

  return <primitive object={clonedScene} />;
}

function ScrollCamera({
  engine,
  cameraPath,
}: {
  engine: ScrollEngine;
  cameraPath: CameraPath;
}) {
  const { camera } = useThree();
  const targetPos = useRef(new Vector3());
  const currentFov = useRef(55);

  useFrame(() => {
    const progress = engine.getProgress();
    const state = cameraPath.evaluate(progress);

    targetPos.current.lerp(state.position, 0.06);
    camera.position.copy(targetPos.current);
    camera.quaternion.slerp(state.quaternion, 0.04);

    if ('fov' in camera) {
      currentFov.current = MathUtils.lerp(currentFov.current, state.fov, 0.03);
      (camera as any).fov = currentFov.current;
      (camera as any).updateProjectionMatrix();
    }
  });

  return null;
}

function WorldLighting() {
  return (
    <>
      <ambientLight intensity={0.35} color="#b8d4ff" />
      <directionalLight
        position={[50, 80, 30]}
        intensity={1.2}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-bias={-0.001}
      />
      <directionalLight
        position={[-30, 40, -20]}
        intensity={0.3}
        color="#6eb5ff"
      />
      <hemisphereLight
        args={['#87ceeb', '#5a3d2b', 0.4]}
      />
    </>
  );
}

function FadeOverlay({ progress }: { progress: number }) {
  const opacity = progress > 0.97
    ? MathUtils.mapLinear(progress, 0.97, 1.0, 0, 1)
    : 0;

  if (opacity <= 0) return null;

  return (
    <mesh position={[0, 0, -0.1]} renderOrder={999}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial
        color="black"
        transparent
        opacity={opacity}
        depthTest={false}
      />
    </mesh>
  );
}

export function ScrollWorld({ onComplete, onProgress }: ScrollWorldProps) {
  const engineRef = useRef<ScrollEngine | null>(null);
  const cameraPathRef = useRef<CameraPath | null>(null);
  const completedRef = useRef(false);
  const progressRef = useRef(0);

  useEffect(() => {
    const controlPoints = WORLD_CAMERA_KEYFRAMES.map(
      (kf) => new Vector3(...kf.position)
    );

    engineRef.current = new ScrollEngine(controlPoints, {
      maxSpeed: 1 / 20,
      smoothingFactor: 0.08,
      duration: 20000,
    });

    cameraPathRef.current = new CameraPath(WORLD_CAMERA_KEYFRAMES);

    engineRef.current.on('update', (state: any) => {
      progressRef.current = state.progress;
      onProgress?.(state.progress);
    });

    engineRef.current.on('complete', () => {
      if (!completedRef.current) {
        completedRef.current = true;
        setTimeout(onComplete, 1500);
      }
    });

    engineRef.current.start();

    return () => {
      engineRef.current?.dispose();
    };
  }, [onComplete, onProgress]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0 }}>
      <Canvas
        shadows
        camera={{ position: [0, 8, 25], fov: 55, near: 0.1, far: 1000 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
        }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#87ceeb']} />
        <fog attach="fog" args={['#87ceeb', 80, 250]} />

        <WorldLighting />

        {engineRef.current && cameraPathRef.current && (
          <ScrollCamera
            engine={engineRef.current}
            cameraPath={cameraPathRef.current}
          />
        )}

        <Suspense fallback={null}>
          <WorldModel />
          <SkyDome />
          <MarioCharacter scrollEngine={engineRef.current} />
          <CrabEnemies />
        </Suspense>

        <Stars
          radius={200}
          depth={60}
          count={1000}
          factor={2}
          fade
          speed={0.3}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/Mario.glb');
