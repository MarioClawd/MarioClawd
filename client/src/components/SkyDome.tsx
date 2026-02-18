import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, MathUtils, BackSide, Color, ShaderMaterial } from 'three';

const SKY_VERTEX_SHADER = `
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAGMENT_SHADER = `
  uniform vec3 topColor;
  uniform vec3 horizonColor;
  uniform vec3 bottomColor;
  uniform float offset;
  uniform float exponent;
  uniform float time;

  varying vec3 vWorldPosition;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    float h = normalize(vWorldPosition + offset).y;
    float t = max(pow(max(h, 0.0), exponent), 0.0);

    vec3 skyColor = mix(horizonColor, topColor, t);
    if (h < 0.0) {
      skyColor = mix(horizonColor, bottomColor, min(-h * 2.0, 1.0));
    }

    float cloudNoise = noise(vUv * 8.0 + vec2(time * 0.02, 0.0));
    cloudNoise *= noise(vUv * 16.0 + vec2(time * 0.01, time * 0.005));
    cloudNoise = smoothstep(0.4, 0.6, cloudNoise);

    vec3 cloudColor = vec3(1.0, 1.0, 1.0);
    float cloudAlpha = cloudNoise * 0.3 * smoothstep(0.0, 0.3, h);

    skyColor = mix(skyColor, cloudColor, cloudAlpha);

    gl_FragColor = vec4(skyColor, 1.0);
  }
`;

export function SkyDome() {
  const { scene } = useGLTF('/models/SkyDome.glb');
  const meshRef = useRef<Group>(null);

  const skyMaterial = useMemo(() => {
    return new ShaderMaterial({
      uniforms: {
        topColor: { value: new Color('#4a90d9') },
        horizonColor: { value: new Color('#b8d4ff') },
        bottomColor: { value: new Color('#e8d5b7') },
        offset: { value: 10 },
        exponent: { value: 0.6 },
        time: { value: 0 },
      },
      vertexShader: SKY_VERTEX_SHADER,
      fragmentShader: SKY_FRAGMENT_SHADER,
      side: BackSide,
      depthWrite: false,
    });
  }, []);

  const skyModel = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.material = skyMaterial;
        child.renderOrder = -1;
      }
    });
    return clone;
  }, [scene, skyMaterial]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.003;
    }
    skyMaterial.uniforms.time.value = clock.getElapsedTime();
  });

  return (
    <group ref={meshRef}>
      <primitive object={skyModel} scale={[2, 2, 2]} />
    </group>
  );
}

useGLTF.preload('/models/SkyDome.glb');

