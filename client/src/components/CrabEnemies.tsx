import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  Group,
  Mesh,
  SkinnedMesh,
  BufferGeometry,
  MeshStandardMaterial,
  Vector3,
  Color,
} from 'three';
import { EntityManager } from '../engine/EntityManager';

type CrabBehavior = 'walk' | 'hop' | 'clap';

interface CrabPlacement {
  position: [number, number, number];
  behavior: CrabBehavior;
  speed: number;
  range: number;
  phase: number;
  scale: number;
  tint?: string;
}

const CRAB_PLACEMENTS: CrabPlacement[] = [
  { position: [18, 5.2, 0], behavior: 'walk', speed: 1.8, range: 2.5, phase: 0, scale: 0.6 },
  { position: [26, 7.2, -1], behavior: 'hop', speed: 3.2, range: 0, phase: 0.5, scale: 0.55 },
  { position: [42, 5.2, 1], behavior: 'clap', speed: 4, range: 0, phase: 1.2, scale: 0.65 },
  { position: [54, 5.2, 0], behavior: 'walk', speed: 2.2, range: 3, phase: 0.8, scale: 0.58 },
  { position: [68, 5.2, -0.5], behavior: 'hop', speed: 2.8, range: 0, phase: 2.1, scale: 0.62 },
  { position: [86, 5.2, 0.5], behavior: 'walk', speed: 1.5, range: 2, phase: 1.5, scale: 0.7 },
  { position: [102, 5.2, 0], behavior: 'clap', speed: 3.5, range: 0, phase: 0.3, scale: 0.55 },
  { position: [118, 5.2, -1], behavior: 'hop', speed: 3, range: 0, phase: 1.8, scale: 0.6 },
];

function bakeSkinned(skinned: SkinnedMesh): Mesh {
  return EntityManager.bakeSkinnedMesh(skinned);
}

function CrabInstance({
  placement,
  bakedGeometry,
  baseMaterial,
}: {
  placement: CrabPlacement;
  bakedGeometry: BufferGeometry;
  baseMaterial: MeshStandardMaterial;
}) {
  const groupRef = useRef<Group>(null);

  const material = useMemo(() => {
    const mat = baseMaterial.clone();
    if (placement.tint) {
      mat.color = new Color(placement.tint);
    }
    return mat;
  }, [baseMaterial, placement.tint]);

  useFrame(() => {
    if (!groupRef.current) return;

    const time = performance.now() / 1000;
    const t = time + placement.phase;

    switch (placement.behavior) {
      case 'walk': {
        const offset = Math.sin(t * placement.speed * 0.5) * placement.range;
        groupRef.current.position.x = placement.position[0] + offset;
        groupRef.current.rotation.y = offset > 0 ? 0 : Math.PI;
        groupRef.current.rotation.z = Math.sin(t * placement.speed * 4) * 0.05;
        break;
      }

      case 'hop': {
        const hop = Math.abs(Math.sin(t * placement.speed)) * 0.8;
        groupRef.current.position.y = placement.position[1] + hop;
        const squash = 1 + hop * 0.15;
        const stretch = 1 / Math.sqrt(squash);
        groupRef.current.scale.set(
          stretch * placement.scale,
          squash * placement.scale,
          stretch * placement.scale
        );
        break;
      }

      case 'clap': {
        const pulse = 1 + Math.sin(t * placement.speed) * 0.2;
        groupRef.current.scale.x = pulse * placement.scale;
        groupRef.current.rotation.z =
          Math.sin(t * placement.speed * 0.7) * 0.1;
        break;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={placement.position}
      scale={[placement.scale, placement.scale, placement.scale]}
    >
      <mesh
        geometry={bakedGeometry}
        material={material}
        castShadow
        receiveShadow
      />
    </group>
  );
}

export function CrabEnemies() {
  const { scene } = useGLTF('/models/Crab.glb');

  const { geometry, material } = useMemo(() => {
    let bakedGeo: BufferGeometry | null = null;
    let baseMat: MeshStandardMaterial | null = null;

    scene.traverse((child: any) => {
      if (child.isSkinnedMesh && !bakedGeo) {
        const baked = bakeSkinned(child as SkinnedMesh);
        bakedGeo = baked.geometry;
        baseMat = baked.material as MeshStandardMaterial;
      } else if (child.isMesh && !bakedGeo) {
        bakedGeo = child.geometry.clone();
        baseMat = (child.material as MeshStandardMaterial).clone();
      }
    });

    if (!bakedGeo || !baseMat) {
      throw new Error('Failed to extract crab geometry from model');
    }

    return { geometry: bakedGeo, material: baseMat };
  }, [scene]);

  return (
    <group name="crab-enemies">
      {CRAB_PLACEMENTS.map((placement, index) => (
        <CrabInstance
          key={index}
          placement={placement}
          bakedGeometry={geometry}
          baseMaterial={material}
        />
      ))}
    </group>
  );
}

useGLTF.preload('/models/Crab.glb');
