import {
  CatmullRomCurve3,
  Vector3,
  Quaternion,
  Matrix4,
  Euler,
} from 'three';

interface CameraKeyframe {
  position: [number, number, number];
  lookAt?: [number, number, number];
  fov?: number;
  roll?: number;
}

interface CameraState {
  position: Vector3;
  quaternion: Quaternion;
  fov: number;
}

export class CameraPath {
  private positionCurve: CatmullRomCurve3;
  private lookAtCurve: CatmullRomCurve3 | null = null;
  private keyframes: CameraKeyframe[];
  private fovValues: number[];
  private rollValues: number[];

  private tempMatrix = new Matrix4();
  private tempUp = new Vector3(0, 1, 0);

  constructor(keyframes: CameraKeyframe[]) {
    this.keyframes = keyframes;

    const positions = keyframes.map(
      (kf) => new Vector3(...kf.position)
    );
    this.positionCurve = new CatmullRomCurve3(positions, false, 'catmullrom', 0.3);

    const lookAts = keyframes.filter((kf) => kf.lookAt);
    if (lookAts.length >= 2) {
      this.lookAtCurve = new CatmullRomCurve3(
        lookAts.map((kf) => new Vector3(...kf.lookAt!)),
        false,
        'catmullrom',
        0.3
      );
    }

    this.fovValues = keyframes.map((kf) => kf.fov ?? 60);
    this.rollValues = keyframes.map((kf) => kf.roll ?? 0);
  }

  public evaluate(t: number): CameraState {
    const clampedT = Math.max(0, Math.min(1, t));
    const position = this.positionCurve.getPointAt(clampedT);

    let quaternion: Quaternion;

    if (this.lookAtCurve) {
      const lookAtTarget = this.lookAtCurve.getPointAt(clampedT);
      quaternion = this.computeLookAtQuaternion(position, lookAtTarget);
    } else {
      const tangent = this.positionCurve.getTangentAt(clampedT);
      const lookAtPoint = position.clone().add(tangent.multiplyScalar(10));
      quaternion = this.computeLookAtQuaternion(position, lookAtPoint);
    }

    const roll = this.interpolateValues(this.rollValues, clampedT);
    if (Math.abs(roll) > 0.001) {
      const rollQuat = new Quaternion().setFromEuler(
        new Euler(0, 0, roll * Math.PI / 180)
      );
      quaternion.multiply(rollQuat);
    }

    const fov = this.interpolateValues(this.fovValues, clampedT);

    return { position, quaternion, fov };
  }

  private computeLookAtQuaternion(
    eye: Vector3,
    target: Vector3
  ): Quaternion {
    this.tempMatrix.lookAt(eye, target, this.tempUp);
    return new Quaternion().setFromRotationMatrix(this.tempMatrix);
  }

  private interpolateValues(values: number[], t: number): number {
    if (values.length === 0) return 0;
    if (values.length === 1) return values[0];

    const scaledT = t * (values.length - 1);
    const index = Math.floor(scaledT);
    const alpha = scaledT - index;

    const a = values[Math.min(index, values.length - 1)];
    const b = values[Math.min(index + 1, values.length - 1)];

    return a + (b - a) * this.smoothstep(alpha);
  }

  private smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  public getLength(): number {
    return this.positionCurve.getLength();
  }

  public getPointAt(t: number): Vector3 {
    return this.positionCurve.getPointAt(Math.max(0, Math.min(1, t)));
  }

  public getNearestPoint(
    worldPos: Vector3,
    segments: number = 100
  ): { t: number; point: Vector3; distance: number } {
    let minDist = Infinity;
    let nearestT = 0;
    let nearestPoint = new Vector3();

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = this.positionCurve.getPointAt(t);
      const dist = point.distanceTo(worldPos);
      if (dist < minDist) {
        minDist = dist;
        nearestT = t;
        nearestPoint = point;
      }
    }

    return { t: nearestT, point: nearestPoint, distance: minDist };
  }
}

export const WORLD_CAMERA_KEYFRAMES: CameraKeyframe[] = [
  { position: [0, 8, 25], lookAt: [0, 3, 0], fov: 55 },
  { position: [15, 10, 18], lookAt: [20, 5, 0], fov: 58 },
  { position: [35, 12, 15], lookAt: [45, 6, 0], fov: 55 },
  { position: [55, 8, 20], lookAt: [60, 4, -5], fov: 52 },
  { position: [70, 15, 12], lookAt: [80, 3, 0], fov: 60 },
  { position: [85, 5, -8], lookAt: [90, 2, -15], fov: 48 },
  { position: [100, 3, -12], lookAt: [110, 2, -15], fov: 45 },
  { position: [115, 8, -5], lookAt: [120, 5, 0], fov: 55 },
  { position: [130, 12, 15], lookAt: [135, 8, 5], fov: 58 },
  { position: [145, 10, 10], lookAt: [150, 6, 0], fov: 55 },
];
