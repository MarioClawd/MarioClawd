import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { getSmoothedScroll } from "./smoothScroll"

const GROUND_Y = 2.0
const UNDERGROUND_Y = -13.0
const CHAR_Z = 4.0
const CHAR_SCALE = 0.35
const STAIR_LIFT = 0.7


const CHAR_PATH = [
  { t: 0.000, x: -3,    y: GROUND_Y },
  { t: 0.015, x: 0,     y: GROUND_Y },
  { t: 0.030, x: 3,     y: GROUND_Y },

  { t: 0.040, x: 4.5,   y: GROUND_Y },
  { t: 0.044, x: 5.5,   y: GROUND_Y + 3.5 },
  { t: 0.048, x: 7,     y: GROUND_Y + 4 },
  { t: 0.052, x: 8.5,   y: GROUND_Y + 3 },
  { t: 0.056, x: 9.5,   y: GROUND_Y },

  { t: 0.060, x: 10,    y: GROUND_Y },
  { t: 0.100, x: 10,    y: GROUND_Y },

  { t: 0.110, x: 12,    y: GROUND_Y },
  { t: 0.130, x: 16,    y: GROUND_Y },
  { t: 0.150, x: 20,    y: GROUND_Y },

  { t: 0.160, x: 23.5,  y: GROUND_Y },
  { t: 0.164, x: 24.5,  y: GROUND_Y + 3 },
  { t: 0.168, x: 25.9,  y: GROUND_Y + 3.5 },
  { t: 0.172, x: 27,    y: GROUND_Y + 2.5 },
  { t: 0.176, x: 28,    y: GROUND_Y },

  { t: 0.200, x: 34,    y: GROUND_Y },
  { t: 0.240, x: 42,    y: GROUND_Y },
  { t: 0.280, x: 50,    y: GROUND_Y },

  { t: 0.310, x: 55,    y: GROUND_Y },
  { t: 0.370, x: 55,    y: GROUND_Y },

  { t: 0.380, x: 58,    y: GROUND_Y },
  { t: 0.400, x: 63,    y: GROUND_Y },
  { t: 0.415, x: 68,    y: GROUND_Y },
  { t: 0.430, x: 73,    y: GROUND_Y },

  { t: 0.435, x: 74.5,  y: GROUND_Y },
  { t: 0.438, x: 75,    y: 3.0 + STAIR_LIFT },
  { t: 0.441, x: 76,    y: 4.0 + STAIR_LIFT },
  { t: 0.444, x: 77,    y: 5.0 + STAIR_LIFT },
  { t: 0.447, x: 78,    y: 6.0 + STAIR_LIFT },

  { t: 0.452, x: 79.5,  y: 6.0 + STAIR_LIFT },

  { t: 0.455, x: 81,    y: 6.0 + STAIR_LIFT },
  { t: 0.458, x: 82,    y: 5.0 + STAIR_LIFT },
  { t: 0.461, x: 83,    y: 4.0 + STAIR_LIFT },
  { t: 0.464, x: 84,    y: 3.0 + STAIR_LIFT },
  { t: 0.467, x: 84.5,  y: GROUND_Y },

  { t: 0.472, x: 85,    y: GROUND_Y },
  { t: 0.475, x: 85.5,  y: GROUND_Y + 3.5 },
  { t: 0.478, x: 86.5,  y: GROUND_Y + 5 },
  { t: 0.481, x: 87.5,  y: GROUND_Y + 4 },
  { t: 0.484, x: 88.5,  y: GROUND_Y + 1 },

  { t: 0.487, x: 89,    y: 3.0 + STAIR_LIFT },
  { t: 0.490, x: 90,    y: 4.0 + STAIR_LIFT },
  { t: 0.493, x: 91,    y: 5.0 + STAIR_LIFT },
  { t: 0.496, x: 92,    y: 6.0 + STAIR_LIFT },
  { t: 0.499, x: 93,    y: 6.0 + STAIR_LIFT },
  { t: 0.502, x: 94,    y: 6.0 + STAIR_LIFT },
  { t: 0.505, x: 96,    y: 6.0 + STAIR_LIFT },
  { t: 0.508, x: 97,    y: 5.0 + STAIR_LIFT },
  { t: 0.511, x: 98,    y: 4.0 + STAIR_LIFT },
  { t: 0.514, x: 99,    y: 3.0 + STAIR_LIFT },
  { t: 0.517, x: 99.5,  y: GROUND_Y },

  { t: 0.520, x: 100,   y: GROUND_Y },

  { t: 0.525, x: 100,   y: GROUND_Y },
  { t: 0.570, x: 100,   y: GROUND_Y },

  { t: 0.585, x: 101,   y: GROUND_Y },
  { t: 0.592, x: 102.5, y: GROUND_Y },

  { t: 0.598, x: 102.5, y: GROUND_Y },
  { t: 0.604, x: 103.0, y: GROUND_Y + 3.0 },
  { t: 0.610, x: 103.5, y: 5.5 },
  { t: 0.616, x: 104.2, y: 5.2 },
  { t: 0.622, x: 104.5, y: 4.8 },

  { t: 0.630, x: 104.5, y: 4.8 },

  { t: 0.636, x: 104.5, y: 3.5 },
  { t: 0.642, x: 104.5, y: 0.0 },
  { t: 0.648, x: 104.5, y: -5.0 },
  { t: 0.652, x: 104.5, y: -10.0 },
  { t: 0.655, x: 104.5, y: UNDERGROUND_Y },

  { t: 0.665, x: 104.5, y: UNDERGROUND_Y },
  { t: 0.675, x: 100,   y: UNDERGROUND_Y },
  { t: 0.685, x: 95,    y: UNDERGROUND_Y },
  { t: 0.695, x: 90,    y: UNDERGROUND_Y },
  { t: 0.705, x: 93,    y: UNDERGROUND_Y },

  { t: 0.715, x: 97,    y: UNDERGROUND_Y },
  { t: 0.720, x: 100,   y: UNDERGROUND_Y },
  { t: 0.725, x: 104.5, y: UNDERGROUND_Y },

  { t: 0.730, x: 104.5, y: UNDERGROUND_Y },
  { t: 0.735, x: 104.5, y: -10.0 },
  { t: 0.740, x: 104.5, y: -5.0 },
  { t: 0.745, x: 104.5, y: 0.0 },
  { t: 0.750, x: 104.5, y: 3.5 },
  { t: 0.755, x: 104.5, y: 4.8 },

  { t: 0.760, x: 104.5, y: 4.8 },
  { t: 0.764, x: 104.5, y: GROUND_Y + 3 },
  { t: 0.768, x: 105,   y: GROUND_Y },

  { t: 0.775, x: 107,   y: GROUND_Y },

  { t: 0.780, x: 107,   y: GROUND_Y },
  { t: 0.790, x: 107,   y: GROUND_Y },

  { t: 0.800, x: 110,   y: GROUND_Y },
  { t: 0.815, x: 114,   y: GROUND_Y },
  { t: 0.830, x: 118,   y: GROUND_Y },
  { t: 0.840, x: 120,   y: GROUND_Y },

  { t: 0.840, x: 120,   y: GROUND_Y },
  { t: 0.844, x: 121,   y: GROUND_Y + 2.0 },
  { t: 0.848, x: 121.8, y: GROUND_Y + 4.0 },
  { t: 0.852, x: 122.5, y: GROUND_Y + 4.2 },
  { t: 0.856, x: 123.2, y: GROUND_Y + 2.5 },
  { t: 0.860, x: 123.5, y: GROUND_Y },

  { t: 0.865, x: 124,   y: 3.0 + STAIR_LIFT },
  { t: 0.870, x: 125,   y: 4.0 + STAIR_LIFT },
  { t: 0.875, x: 126,   y: 5.0 + STAIR_LIFT },
  { t: 0.880, x: 127,   y: 6.0 + STAIR_LIFT },
  { t: 0.885, x: 128,   y: 7.0 + STAIR_LIFT },
  { t: 0.890, x: 129,   y: 8.0 + STAIR_LIFT },
  { t: 0.895, x: 130,   y: 9.0 + STAIR_LIFT },
  { t: 0.900, x: 131,   y: 10.0 + STAIR_LIFT },

  { t: 0.905, x: 131,   y: 10.0 + STAIR_LIFT },

  { t: 0.920, x: 131,   y: 10.0 + STAIR_LIFT },
  { t: 0.935, x: 132,   y: 11.5 },
  { t: 0.940, x: 134,   y: 8.0 },
  { t: 0.945, x: 136,   y: GROUND_Y },

  { t: 0.955, x: 138,   y: GROUND_Y },
  { t: 0.965, x: 140,   y: GROUND_Y },
  { t: 0.975, x: 142,   y: GROUND_Y },
  { t: 0.985, x: 144,   y: GROUND_Y },
  { t: 0.993, x: 146,   y: GROUND_Y },
  { t: 1.000, x: 148,   y: GROUND_Y },
]

function getPathDirection(t) {
  for (let i = 0; i < CHAR_PATH.length - 1; i++) {
    if (t >= CHAR_PATH[i].t && t <= CHAR_PATH[i + 1].t) {
      const dx = CHAR_PATH[i + 1].x - CHAR_PATH[i].x
      if (Math.abs(dx) < 0.01) {
        for (let j = i + 1; j < CHAR_PATH.length; j++) {
          const fdx = CHAR_PATH[j].x - CHAR_PATH[i].x
          if (Math.abs(fdx) > 0.5) return fdx > 0 ? 1 : -1
        }
        return 1
      }
      return dx > 0 ? 1 : -1
    }
  }
  return 1
}

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t
  const t3 = t2 * t
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  )
}

function sampleCharPath(t) {
  if (t <= CHAR_PATH[0].t) return { x: CHAR_PATH[0].x, y: CHAR_PATH[0].y }
  if (t >= CHAR_PATH[CHAR_PATH.length - 1].t) {
    const last = CHAR_PATH[CHAR_PATH.length - 1]
    return { x: last.x, y: last.y }
  }

  let idx = 0
  for (let i = 1; i < CHAR_PATH.length; i++) {
    if (t <= CHAR_PATH[i].t) { idx = i - 1; break }
  }

  const seg0 = CHAR_PATH[idx]
  const seg1 = CHAR_PATH[idx + 1]

  if (Math.abs(seg0.x - seg1.x) < 0.01 && Math.abs(seg0.y - seg1.y) < 0.01) {
    return { x: seg0.x, y: seg0.y }
  }

  const f = (t - seg0.t) / (seg1.t - seg0.t)

  const segDuration = seg1.t - seg0.t
  if (segDuration < 0.005) {
    return {
      x: seg0.x + (seg1.x - seg0.x) * f,
      y: seg0.y + (seg1.y - seg0.y) * f,
    }
  }

  const i0 = Math.max(idx - 1, 0)
  const i1 = idx
  const i2 = idx + 1
  const i3 = Math.min(idx + 2, CHAR_PATH.length - 1)

  return {
    x: catmullRom(CHAR_PATH[i0].x, CHAR_PATH[i1].x, CHAR_PATH[i2].x, CHAR_PATH[i3].x, f),
    y: catmullRom(CHAR_PATH[i0].y, CHAR_PATH[i1].y, CHAR_PATH[i2].y, CHAR_PATH[i3].y, f),
  }
}

function applyLimbSwing(arr, origArr, indices, pivotX, pivotZ, angle) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  for (const i of indices) {
    const ox = origArr[i * 3]
    const oz = origArr[i * 3 + 2]
    const dx = ox - pivotX
    const dz = oz - pivotZ
    arr[i * 3] = pivotX + dx * cos - dz * sin
    arr[i * 3 + 2] = pivotZ + dx * sin + dz * cos
  }
}

export default function MarioCharacter() {
  const { scene } = useGLTF("/mario_obj.glb")
  const groupRef = useRef()
  const innerRef = useRef()
  const prevX = useRef(-3)
  const smoothPos = useRef({ x: -3, y: GROUND_Y })
  const animRef = useRef(null)
  const speedHistory = useRef([])
  const facingAngle = useRef(Math.PI / 2)

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    const animParts = []

    clone.traverse((child) => {
      if (!child.isMesh) return
      child.castShadow = true
      child.receiveShadow = true

      const geo = child.geometry
      if (!geo) return
      const pos = geo.getAttribute('position')
      const box = new THREE.Box3().setFromBufferAttribute(pos)
      const sizeX = box.max.x - box.min.x
      const sizeZ = box.max.z - box.min.z

      const hasLegs = box.min.z < 1.5 && sizeZ > 2.5
      const hasArms = sizeX > 3.5

      if (!hasLegs && !hasArms) return

      child.geometry = geo.clone()
      const clonedPos = child.geometry.getAttribute('position')
      const arr = clonedPos.array
      const vertCount = arr.length / 3

      const leftLeg = []
      const rightLeg = []
      const leftArm = []
      const rightArm = []

      for (let vi = 0; vi < vertCount; vi++) {
        const x = arr[vi * 3]
        const z = arr[vi * 3 + 2]

        if (hasLegs && z < 2.0) {
          if (x < -0.1) leftLeg.push(vi)
          else if (x > 0.1) rightLeg.push(vi)
        }

        if (hasArms && Math.abs(x) > 1.3 && z > 3.0 && z < 5.0) {
          if (x < 0) leftArm.push(vi)
          else rightArm.push(vi)
        }
      }

      if (hasArms && (leftArm.length > 0 || rightArm.length > 0)) {
        for (const idx of [...leftArm, ...rightArm]) {
          const x = arr[idx * 3]
          const z = arr[idx * 3 + 2]
          const shoulderX = x < 0 ? -1.2 : 1.2
          const angle = x < 0 ? 1.4 : -1.4
          const cos = Math.cos(angle)
          const sin = Math.sin(angle)
          const ddx = x - shoulderX
          const dz = z - 4.2
          arr[idx * 3] = shoulderX + ddx * cos - dz * sin
          arr[idx * 3 + 2] = 4.2 + ddx * sin + dz * cos
        }
        clonedPos.needsUpdate = true
      }

      const restPositions = new Float32Array(arr)

      if (leftLeg.length > 0 || rightLeg.length > 0) {
        animParts.push({
          mesh: child,
          restPositions,
          leftLeg, rightLeg,
        })
      }
    })

    animRef.current = animParts
    return clone
  }, [scene])

  useFrame(({ clock }) => {
    if (!groupRef.current) return

    const scrollPercent = getSmoothedScroll()

    const target = sampleCharPath(scrollPercent)

    const atPipe = scrollPercent > 0.598 && scrollPercent < 0.88
    if (atPipe) {
      smoothPos.current.x = target.x
      smoothPos.current.y += (target.y - smoothPos.current.y) * 0.2
    } else {
      const lerpSpeed = 0.08
      smoothPos.current.x += (target.x - smoothPos.current.x) * lerpSpeed
      smoothPos.current.y += (target.y - smoothPos.current.y) * lerpSpeed
    }

    const frameDx = smoothPos.current.x - prevX.current
    const frameSpeed = Math.abs(frameDx)

    speedHistory.current.push(frameSpeed)
    if (speedHistory.current.length > 10) speedHistory.current.shift()
    const avgSpeed = speedHistory.current.reduce((a, b) => a + b, 0) / speedHistory.current.length

    const time = clock.getElapsedTime()

    const pathDir = getPathDirection(scrollPercent)
    let targetAngle
    targetAngle = pathDir > 0 ? Math.PI / 2 : -Math.PI / 2
    facingAngle.current += (targetAngle - facingAngle.current) * 0.1
    groupRef.current.rotation.y = facingAngle.current

    const isOnGround = Math.abs(smoothPos.current.y - GROUND_Y) < 0.5 ||
                       Math.abs(smoothPos.current.y - UNDERGROUND_Y) < 0.5
    const onStairs = smoothPos.current.y > GROUND_Y + 0.5 && smoothPos.current.y < 12
    const isInPipe = smoothPos.current.y < GROUND_Y - 1 && smoothPos.current.y > UNDERGROUND_Y + 1
    const isJumping = !isOnGround && !isInPipe && !onStairs

    const runAmount = Math.min(avgSpeed * 25, 1)
    const runCycle = time * 10

    let bobY = 0
    let leanForward = 0
    let squashY = 1
    let stretchXZ = 1

    if ((isOnGround || onStairs) && runAmount > 0.05) {
      bobY = Math.abs(Math.sin(runCycle)) * 0.15 * runAmount
      leanForward = 0.1 * runAmount
      squashY = 1 + Math.sin(runCycle * 2) * 0.02 * runAmount
      stretchXZ = 1 - Math.sin(runCycle * 2) * 0.01 * runAmount
    } else if (isJumping) {
      squashY = 1.06
      stretchXZ = 0.95
    }

    const descendingInPipe = scrollPercent > 0.638 && scrollPercent < 0.658
    const ascendingInPipe = scrollPercent > 0.732 && scrollPercent < 0.758
    const hiddenInPipe = descendingInPipe || ascendingInPipe
    groupRef.current.visible = !hiddenInPipe

    groupRef.current.position.x = smoothPos.current.x
    groupRef.current.position.y = smoothPos.current.y + bobY
    groupRef.current.position.z = CHAR_Z

    if (innerRef.current) {
      innerRef.current.rotation.z = pathDir > 0 ? -leanForward : leanForward
      innerRef.current.scale.set(stretchXZ, squashY, stretchXZ)
    }

    if (animRef.current) {
      const isMoving = (isOnGround || onStairs) && runAmount > 0.05
      const legAngle = isMoving ? Math.sin(runCycle) * 0.6 * runAmount : 0
      for (const part of animRef.current) {
        const pos = part.mesh.geometry.getAttribute('position')
        const arr = pos.array
        const rest = part.restPositions

        for (let i = 0; i < arr.length; i++) arr[i] = rest[i]

        if (Math.abs(legAngle) > 0.001) {
          applyLimbSwing(arr, rest, part.leftLeg, 0, 2.5, legAngle)
          applyLimbSwing(arr, rest, part.rightLeg, 0, 2.5, -legAngle)
        }

        pos.needsUpdate = true
      }
    }

    prevX.current = smoothPos.current.x
  })

  return (
    <group ref={groupRef} position={[-3, GROUND_Y, CHAR_Z]}>
      <group ref={innerRef}>
        <primitive object={clonedScene} scale={CHAR_SCALE} />
      </group>
    </group>
  )
}
