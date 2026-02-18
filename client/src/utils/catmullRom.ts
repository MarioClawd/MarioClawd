import { Vector3 } from 'three';

export function catmullRomPoint(
  p0: Vector3,
  p1: Vector3,
  p2: Vector3,
  p3: Vector3,
  t: number,
  alpha: number = 0.5
): Vector3 {
  const t2 = t * t;
  const t3 = t2 * t;

  const result = new Vector3();

  result.x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

  result.y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

  result.z =
    0.5 *
    (2 * p1.z +
      (-p0.z + p2.z) * t +
      (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
      (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3);

  return result;
}

export function catmullRomTangent(
  p0: Vector3,
  p1: Vector3,
  p2: Vector3,
  p3: Vector3,
  t: number
): Vector3 {
  const t2 = t * t;

  const result = new Vector3();

  result.x =
    0.5 *
    ((-p0.x + p2.x) +
      (4 * p0.x - 10 * p1.x + 8 * p2.x - 2 * p3.x) * t +
      (-3 * p0.x + 9 * p1.x - 9 * p2.x + 3 * p3.x) * t2);

  result.y =
    0.5 *
    ((-p0.y + p2.y) +
      (4 * p0.y - 10 * p1.y + 8 * p2.y - 2 * p3.y) * t +
      (-3 * p0.y + 9 * p1.y - 9 * p2.y + 3 * p3.y) * t2);

  result.z =
    0.5 *
    ((-p0.z + p2.z) +
      (4 * p0.z - 10 * p1.z + 8 * p2.z - 2 * p3.z) * t +
      (-3 * p0.z + 9 * p1.z - 9 * p2.z + 3 * p3.z) * t2);

  return result.normalize();
}

export function evaluateSpline(
  points: Vector3[],
  t: number
): { position: Vector3; tangent: Vector3 } {
  const segments = points.length - 1;
  const scaledT = t * segments;
  const index = Math.floor(scaledT);
  const localT = scaledT - index;

  const i = Math.min(index, segments - 1);

  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[Math.min(i + 1, points.length - 1)];
  const p3 = points[Math.min(i + 2, points.length - 1)];

  return {
    position: catmullRomPoint(p0, p1, p2, p3, localT),
    tangent: catmullRomTangent(p0, p1, p2, p3, localT),
  };
}

export function generateArcLengthTable(
  points: Vector3[],
  segments: number = 200
): { t: number; length: number }[] {
  const table: { t: number; length: number }[] = [{ t: 0, length: 0 }];
  let totalLength = 0;
  let prevPoint = evaluateSpline(points, 0).position;

  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const point = evaluateSpline(points, t).position;
    totalLength += point.distanceTo(prevPoint);
    table.push({ t, length: totalLength });
    prevPoint = point;
  }

  return table;
}
