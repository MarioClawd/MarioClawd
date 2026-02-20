import { Canvas, useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import { Suspense, useRef, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import * as THREE from "three"
import MarioCharacter from "./MarioCharacter"
import CrabEnemies from "./CrabEnemies"
import { getSmoothedScroll } from "./smoothScroll"

const features = [
  { x: 10, label: "About" },
  { x: 55, label: "Our Tools" },
  { x: 95, label: "Links" },
  { x: 107, label: "Get Started" },
]

const ZONE_RADIUS = 10
const PIPE_X = 104.5
const HOUSE_X = 150


const PATH = [
  { t: 0.00, x: 0,        y: 0 },
  { t: 0.62, x: PIPE_X,   y: 0 },
  { t: 0.65, x: PIPE_X,   y: -12 },
  { t: 0.69, x: PIPE_X - 12, y: -12 },
  { t: 0.73, x: PIPE_X,   y: -12 },
  { t: 0.76, x: PIPE_X,   y: 0 },
  { t: 0.78, x: 107,      y: 0 },
  { t: 0.83, x: 118,      y: 0 },
  { t: 0.85, x: 120,      y: 0 },
  { t: 0.90, x: 126,      y: 0 },
  { t: 0.93, x: 131,      y: 0 },
  { t: 0.95, x: 136,      y: 0 },
  { t: 0.975, x: 142,     y: 0 },
  { t: 1.00, x: HOUSE_X,  y: 0 },
]

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

function samplePath(t) {
  if (t <= PATH[0].t) return { x: PATH[0].x, y: PATH[0].y }
  if (t >= PATH[PATH.length - 1].t) {
    const last = PATH[PATH.length - 1]
    return { x: last.x, y: last.y }
  }

  let idx = 0
  for (let i = 1; i < PATH.length; i++) {
    if (t <= PATH[i].t) { idx = i - 1; break }
  }

  const f = (t - PATH[idx].t) / (PATH[idx + 1].t - PATH[idx].t)

  const i0 = Math.max(idx - 1, 0)
  const i1 = idx
  const i2 = idx + 1
  const i3 = Math.min(idx + 2, PATH.length - 1)

  return {
    x: catmullRom(PATH[i0].x, PATH[i1].x, PATH[i2].x, PATH[i3].x, f),
    y: catmullRom(PATH[i0].y, PATH[i1].y, PATH[i2].y, PATH[i3].y, f),
  }
}

const undergroundPanel = { x: PIPE_X - 8, y: -6, label: "Underground" }

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ")
  let line = ""
  let cy = y
  for (const word of words) {
    const test = line + word + " "
    if (ctx.measureText(test).width > maxWidth && line !== "") {
      ctx.fillText(line.trim(), x, cy)
      line = word + " "
      cy += lineHeight
    } else {
      line = test
    }
  }
  ctx.fillText(line.trim(), x, cy)
  return cy + lineHeight
}

function drawPanelBg(ctx, w, h, accentColor) {
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = "rgba(0,0,0,0)"
  ctx.fillRect(0, 0, w, h)

  const r = 24
  ctx.beginPath()
  ctx.moveTo(r, 0); ctx.lineTo(w - r, 0); ctx.quadraticCurveTo(w, 0, w, r)
  ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h)
  ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h - r)
  ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.save()
  ctx.clip()

  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, "rgba(10,10,30,0.95)")
  grad.addColorStop(1, "rgba(20,20,50,0.98)")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  ctx.strokeStyle = accentColor || "rgba(255,255,255,0.2)"
  ctx.lineWidth = 4
  ctx.stroke()

  ctx.fillStyle = accentColor || "#F39C12"
  ctx.fillRect(30, 0, 80, 6)
  ctx.restore()
}

function makeAboutPanel() {
  const W = 1400, H = 900
  const canvas = document.createElement("canvas")
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext("2d")
  drawPanelBg(ctx, W, H, "#3498DB")

  ctx.fillStyle = "#3498DB"
  ctx.font = "bold 56px sans-serif"
  ctx.fillText("MARIO OS", 50, 80)

  ctx.fillStyle = "rgba(255,255,255,0.4)"
  ctx.font = "24px sans-serif"
  ctx.fillText("What is it?", 50, 120)

  ctx.fillStyle = "rgba(255,255,255,0.85)"
  ctx.font = "30px sans-serif"
  let y = wrapText(ctx, "Mario OS is a retro pixel-art utility dashboard for crypto and AI agent tools. Scroll through a 3D Mario world, then enter the OS to access powerful on-chain utilities.", 50, 175, W - 100, 40)

  y += 10
  ctx.fillStyle = "#3498DB"
  ctx.font = "bold 32px sans-serif"
  ctx.fillText("Built on Solana", 50, y)
  y += 45

  ctx.fillStyle = "rgba(255,255,255,0.7)"
  ctx.font = "28px sans-serif"
  const bullets = [
    "\u2605  5 AI-powered utility apps",
    "\u2605  Conversational agent interface",
    "\u2605  Client-side wallet integration",
    "\u2605  Instant token launches on Solana",
    "\u2605  x402 micropayment protocol",
    "\u2605  @bankrbot trading integration",
    "\u2605  Moltbook agent social network",
  ]
  for (const b of bullets) {
    ctx.fillText(b, 70, y)
    y += 38
  }

  y += 20
  ctx.fillStyle = "rgba(52,152,219,0.3)"
  ctx.fillRect(50, y, W - 100, 3)
  y += 25
  ctx.fillStyle = "rgba(255,255,255,0.5)"
  ctx.font = "italic 26px sans-serif"
  wrapText(ctx, "Scroll to explore the world. Reach the house to enter Mario OS.", 50, y, W - 100, 34)

  return new THREE.CanvasTexture(canvas)
}

function makeToolsPanel() {
  const W = 1400, H = 900
  const canvas = document.createElement("canvas")
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext("2d")
  drawPanelBg(ctx, W, H, "#E74C3C")

  ctx.fillStyle = "#E74C3C"
  ctx.font = "bold 56px sans-serif"
  ctx.fillText("OUR TOOLS", 50, 80)

  const tools = [
    { name: "Warp Zone", color: "#27AE60", desc: "Send USDC micropayments using x402. Talk to Pipe Agent \u2014 just say who to pay and how much." },
    { name: "Lobster Lab", color: "#E74C3C", desc: "Register AI agents on Moltbook. Crab Agent handles registration, claiming, and auto-posting." },
    { name: "World Chat", color: "#8E44AD", desc: "Chat with Clawd, your AI assistant. Ask about crypto, DeFi, agents, or anything else." },
    { name: "Trade Zone", color: "#3498DB", desc: "Trade crypto on Solana via @bankrbot. Star Agent composes buy, sell, and swap commands." },
    { name: "Token Factory", color: "#F39C12", desc: "Launch tokens instantly on Solana. Just tell Mint Agent your token details and you're live." },
  ]

  let y = 120
  for (const tool of tools) {
    ctx.fillStyle = "rgba(255,255,255,0.06)"
    ctx.fillRect(50, y, W - 100, 120)
    ctx.fillStyle = tool.color
    ctx.fillRect(50, y, 6, 120)

    ctx.fillStyle = tool.color
    ctx.font = "bold 32px sans-serif"
    ctx.fillText(tool.name, 80, y + 38)

    ctx.fillStyle = "rgba(255,255,255,0.75)"
    ctx.font = "24px sans-serif"
    wrapText(ctx, tool.desc, 80, y + 72, W - 180, 30)

    y += 145
  }

  return new THREE.CanvasTexture(canvas)
}

function makeLinksPanel() {
  const W = 1400, H = 900
  const canvas = document.createElement("canvas")
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext("2d")
  drawPanelBg(ctx, W, H, "#9B59B6")

  ctx.fillStyle = "#9B59B6"
  ctx.font = "bold 56px sans-serif"
  ctx.fillText("LINKS", 50, 80)

  ctx.fillStyle = "rgba(255,255,255,0.4)"
  ctx.font = "24px sans-serif"
  ctx.fillText("Resources & Partners", 50, 120)

  const links = [
    { icon: "\uD83D\uDCD6", label: "Documentation", sub: "marioclawd.gitbook.io/marioclawd-docs" },
    { icon: "\uD83D\uDCBB", label: "GitHub", sub: "github.com/MarioClawd/MarioClawd" },
    { icon: "\uD835\uDD4F", label: "X / Twitter", sub: "x.com/MarioClawd" },
    { icon: "TG", label: "Telegram", sub: "t.me/MarioClawdPortal" },
    { icon: "\uD83C\uDFAE", label: "Launch App", sub: "Enter Mario OS dashboard" },
  ]

  let y = 170
  for (const link of links) {
    ctx.fillStyle = "rgba(255,255,255,0.06)"
    ctx.fillRect(50, y, W - 100, 80)

    ctx.fillStyle = "white"
    ctx.font = "36px sans-serif"
    ctx.fillText(link.icon, 75, y + 52)

    ctx.fillStyle = "white"
    ctx.font = "bold 30px sans-serif"
    ctx.fillText(link.label, 140, y + 40)

    ctx.fillStyle = "rgba(255,255,255,0.45)"
    ctx.font = "22px sans-serif"
    ctx.fillText(link.sub, 140, y + 68)

    ctx.fillStyle = "rgba(255,255,255,0.3)"
    ctx.font = "28px sans-serif"
    ctx.fillText("\u2192", W - 90, y + 50)

    y += 100
  }

  y += 20
  ctx.fillStyle = "rgba(155,89,182,0.3)"
  ctx.fillRect(50, y, W - 100, 3)
  y += 30

  ctx.fillStyle = "#9B59B6"
  ctx.font = "bold 30px sans-serif"
  ctx.fillText("Protocols & Partners", 50, y)
  y += 45

  const partners = ["x402 Protocol  \u00B7  Moltbook  \u00B7  Solana  \u00B7  @bankrbot"]
  ctx.fillStyle = "rgba(255,255,255,0.65)"
  ctx.font = "28px sans-serif"
  ctx.fillText(partners[0], 50, y)

  return new THREE.CanvasTexture(canvas)
}

function makeGetStartedPanel() {
  const W = 1400, H = 900
  const canvas = document.createElement("canvas")
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext("2d")
  drawPanelBg(ctx, W, H, "#F39C12")

  ctx.fillStyle = "#F39C12"
  ctx.font = "bold 56px sans-serif"
  ctx.fillText("GET STARTED", 50, 80)

  const steps = [
    { num: "1", title: "Connect Your Wallet", desc: "Click Connect Wallet to link Phantom or Solflare." },
    { num: "2", title: "Pick a Tool", desc: "Click any app icon. Each tool is an AI agent you can chat with." },
    { num: "3", title: "Just Talk", desc: "Say what you want: \"Launch a token called MoonCoin\" or \"Buy $50 of SOL\"." },
    { num: "4", title: "Confirm Actions", desc: "Your wallet pops up to confirm. Your keys, your tokens." },
  ]

  let y = 140
  for (const step of steps) {
    ctx.fillStyle = "rgba(243,156,18,0.2)"
    ctx.beginPath()
    ctx.arc(85, y + 30, 28, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "#F39C12"
    ctx.font = "bold 32px sans-serif"
    ctx.fillText(step.num, 74, y + 42)

    ctx.fillStyle = "white"
    ctx.font = "bold 32px sans-serif"
    ctx.fillText(step.title, 130, y + 30)

    ctx.fillStyle = "rgba(255,255,255,0.65)"
    ctx.font = "26px sans-serif"
    wrapText(ctx, step.desc, 130, y + 65, W - 220, 32)

    y += 140
  }

  y += 20
  ctx.fillStyle = "rgba(243,156,18,0.3)"
  ctx.fillRect(50, y, W - 100, 3)
  y += 30
  ctx.fillStyle = "rgba(255,255,255,0.5)"
  ctx.font = "italic 26px sans-serif"
  wrapText(ctx, "No forms to fill \u2014 just have a conversation and the agent handles the rest.", 50, y, W - 100, 34)

  return new THREE.CanvasTexture(canvas)
}

function makeUndergroundPanel() {
  const W = 1400, H = 900
  const canvas = document.createElement("canvas")
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext("2d")
  drawPanelBg(ctx, W, H, "#1ABC9C")

  ctx.fillStyle = "#1ABC9C"
  ctx.font = "bold 56px sans-serif"
  ctx.fillText("THE UNDERGROUND", 50, 80)

  ctx.fillStyle = "rgba(255,255,255,0.4)"
  ctx.font = "24px sans-serif"
  ctx.fillText("Secrets of Mario OS", 50, 120)

  ctx.fillStyle = "rgba(26,188,156,0.15)"
  ctx.fillRect(50, 145, W - 100, 3)

  const secrets = [
    { icon: "\uD83C\uDF44", title: "Powered by AI Agents", desc: "Every tool in Mario OS is a conversational AI agent. No forms, no buttons \u2014 just tell it what you want." },
    { icon: "\uD83D\uDCB0", title: "You Keep 100% of Fees", desc: "Token launches use client-side signing. Your wallet deploys the token, so all creator fees are yours." },
    { icon: "\uD83D\uDD17", title: "Built on Solana", desc: "Lightning-fast transactions, near-zero fees. Token Factory launches directly on-chain with instant settlement." },
    { icon: "\uD83E\uDD80", title: "The Crab Network", desc: "Moltbook is an agent social network. Your AI agents can post, interact, and build reputation autonomously." },
    { icon: "\u26A1", title: "x402 Payments", desc: "HTTP-native micropayments using the 402 Payment Required protocol. The web was built for this." },
  ]

  let y = 170
  for (const secret of secrets) {
    ctx.fillStyle = "rgba(255,255,255,0.04)"
    ctx.fillRect(50, y, W - 100, 110)

    ctx.fillStyle = "white"
    ctx.font = "38px sans-serif"
    ctx.fillText(secret.icon, 70, y + 50)

    ctx.fillStyle = "#1ABC9C"
    ctx.font = "bold 30px sans-serif"
    ctx.fillText(secret.title, 130, y + 38)

    ctx.fillStyle = "rgba(255,255,255,0.7)"
    ctx.font = "24px sans-serif"
    wrapText(ctx, secret.desc, 130, y + 72, W - 220, 30)

    y += 130
  }

  y += 15
  ctx.fillStyle = "rgba(26,188,156,0.3)"
  ctx.fillRect(50, y, W - 100, 3)
  y += 25
  ctx.fillStyle = "rgba(255,255,255,0.45)"
  ctx.font = "italic 24px sans-serif"
  wrapText(ctx, "\"The best secrets are hidden underground.\" \u2014 Every Mario player ever", 50, y, W - 100, 30)

  return new THREE.CanvasTexture(canvas)
}

function makePanel(text) {
  if (text === "About") return makeAboutPanel()
  if (text === "Our Tools") return makeToolsPanel()
  if (text === "Links") return makeLinksPanel()
  if (text === "Get Started") return makeGetStartedPanel()
  if (text === "Underground") return makeUndergroundPanel()

  const canvas = document.createElement("canvas")
  canvas.width = 1400
  canvas.height = 900
  const ctx = canvas.getContext("2d")
  drawPanelBg(ctx, 1400, 900)
  ctx.fillStyle = "white"
  ctx.font = "bold 56px sans-serif"
  ctx.fillText(text, 50, 80)
  return new THREE.CanvasTexture(canvas)
}

const _camWorldPos = new THREE.Vector3()

const LINK_ROWS = [
  { yStart: 170, yEnd: 250, url: "https://marioclawd.gitbook.io/marioclawd-docs" },
  { yStart: 270, yEnd: 350, url: "https://github.com/MarioClawd/MarioClawd" },
  { yStart: 370, yEnd: 450, url: "https://x.com/MarioClawd" },
  { yStart: 470, yEnd: 550, url: "https://t.me/MarioClawdPortal" },
  { yStart: 570, yEnd: 650, url: "/app" },
]

function Panel({ label, position, radius, navigate }) {
  const meshRef = useRef()
  const texture = useMemo(() => makePanel(label), [label])
  const baseY = position[1]
  const zoneR = radius || ZONE_RADIUS
  const isLinks = label === "Links"

  const handleClick = (e) => {
    if (!isLinks) return
    e.stopPropagation()
    const uv = e.uv
    if (!uv) return
    const canvasY = (1 - uv.y) * 900
    for (const row of LINK_ROWS) {
      if (canvasY >= row.yStart && canvasY <= row.yEnd) {
        if (row.url === "/app") {
          if (navigate) navigate("/app")
        } else {
          window.open(row.url, "_blank", "noopener,noreferrer")
        }
        break
      }
    }
  }

  useFrame(({ camera }) => {
    if (!meshRef.current) return
    camera.getWorldPosition(_camWorldPos)
    const w = smoothZoneInfluence(_camWorldPos.x, position[0], zoneR)
    meshRef.current.material.opacity += (w * 1.0 - meshRef.current.material.opacity) * 0.08
    meshRef.current.position.y += (baseY + w * 1.2 - meshRef.current.position.y) * 0.08
  })

  return (
    <mesh ref={meshRef} position={position} onClick={isLinks ? handleClick : undefined}>
      <planeGeometry args={[16, 10]} />
      <meshBasicMaterial map={texture} transparent opacity={0} alphaTest={0.01} depthWrite={false} />
    </mesh>
  )
}

function makeTitleTexture() {
  const W = 1800, H = 600
  const canvas = document.createElement("canvas")
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext("2d")

  ctx.fillStyle = "#E74C3C"
  ctx.font = "bold 140px 'Press Start 2P', monospace, sans-serif"
  ctx.textAlign = "center"
  ctx.fillText("MARIO", W / 2, 200)

  ctx.fillStyle = "#F39C12"
  ctx.fillText("CLAWD", W / 2, 380)

  ctx.fillStyle = "#E74C3C"
  ctx.font = "bold 40px sans-serif"
  ctx.fillText("SCROLL TO BEGIN YOUR ADVENTURE", W / 2, 500)

  return new THREE.CanvasTexture(canvas)
}

function TitleSign() {
  const meshRef = useRef()
  const texture = useMemo(() => makeTitleTexture(), [])
  const isMobile = window.innerWidth < 768

  useFrame(() => {
    if (!meshRef.current) return
    const scroll = getSmoothedScroll()
    const fade = 1 - Math.min(scroll / 0.03, 1)
    meshRef.current.material.opacity = fade
    meshRef.current.visible = fade > 0.01
  })

  return (
    <mesh ref={meshRef} position={isMobile ? [-2, 14, -2] : [-8, 14, -5]}>
      <planeGeometry args={isMobile ? [18, 6] : [34, 12]} />
      <meshBasicMaterial map={texture} transparent opacity={1} depthWrite={false} />
    </mesh>
  )
}

function Level() {
  const { scene } = useGLTF("/Mario.glb")
  return <primitive object={scene} scale={1} />
}

function SkyDome() {
  const { scene: skyScene } = useGLTF("/SkyDome.glb")
  const meshRef = useRef()
  const skyTexture = useRef(null)

  useMemo(() => {
    skyScene.traverse((child) => {
      if (child.isMesh && child.material.map && !skyTexture.current) {
        skyTexture.current = child.material.map
      }
    })
  }, [skyScene])

  const _skyPos = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ camera, clock }) => {
    if (meshRef.current) {
      camera.getWorldPosition(_skyPos)
      meshRef.current.position.copy(_skyPos)
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.02
    }
  })

  return (
    <mesh ref={meshRef} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[500, 64, 32]} />
      <meshBasicMaterial
        map={skyTexture.current}
        side={THREE.BackSide}
        depthWrite={false}
        color={skyTexture.current ? 0xffffff : 0x87CEEB}
      />
    </mesh>
  )
}

function smoothZoneInfluence(camX, featureX, radius) {
  const d = Math.abs(camX - featureX)
  const t = 1 - Math.min(d / radius, 1)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

const BASE = { y: 6, z: 35, fov: 60 }
const ZOOM = { y: 7.5, z: 22 }
const LOOK = { y: 4.5, z: 0 }

const LOOK_AT = new THREE.Vector3()

function ScrollCamera() {
  const rigRef = useRef()
  const initialized = useRef(false)
  const rigPos = useRef({ x: 0, y: 0 })
  const focusXSmoothed = useRef(0)
  const influenceSmoothed = useRef(0)

  useFrame(({ camera, scene }) => {
    if (!initialized.current) {
      const cameraRig = new THREE.Group()
      scene.add(cameraRig)
      cameraRig.add(camera)
      rigRef.current = cameraRig
      camera.fov = BASE.fov
      camera.updateProjectionMatrix()
      camera.position.set(0, BASE.y, BASE.z)
      initialized.current = true
    }

    const scrollPercent = getSmoothedScroll()

    const target = samplePath(scrollPercent)

    const inPipeTransition = scrollPercent > 0.60 && scrollPercent < 0.77
    const pipeDescending = scrollPercent > 0.60 && scrollPercent < 0.68
    const pipeAscending = scrollPercent > 0.72 && scrollPercent < 0.77
    const pipeLockX = pipeDescending || pipeAscending
    const endSection = scrollPercent > 0.83
    const camLerp = inPipeTransition ? 0.15 : endSection ? 0.12 : 0.06

    if (pipeLockX) {
      rigPos.current.x += (PIPE_X - rigPos.current.x) * camLerp
    } else {
      rigPos.current.x += (target.x - rigPos.current.x) * camLerp
    }
    rigPos.current.y += (target.y - rigPos.current.y) * camLerp

    const rig = rigRef.current
    if (rig) {
      rig.position.x = rigPos.current.x
      rig.position.y = rigPos.current.y
    }

    let sumW = 0
    let sumX = 0
    let peakW = 0

    if (!inPipeTransition) {
      for (const f of features) {
        const w = smoothZoneInfluence(rigPos.current.x, f.x, ZONE_RADIUS)
        sumW += w
        sumX += f.x * w
        peakW = Math.max(peakW, w)
      }
    }

    let blendedFocusX
    if (pipeLockX) {
      blendedFocusX = PIPE_X
    } else if (inPipeTransition) {
      blendedFocusX = rigPos.current.x
    } else if (endSection) {
      blendedFocusX = rigPos.current.x
    } else {
      blendedFocusX = sumW > 0.0001 ? sumX / sumW : rigPos.current.x + 5
    }

    const focusLerp = inPipeTransition ? 0.2 : endSection ? 0.12 : 0.06
    const dx = blendedFocusX - focusXSmoothed.current
    if (Math.abs(dx) >= 0.15 || inPipeTransition) {
      focusXSmoothed.current += dx * focusLerp
    }

    if (inPipeTransition) {
      influenceSmoothed.current *= 0.9
    } else {
      influenceSmoothed.current += (peakW - influenceSmoothed.current) * 0.06
    }

    const isUnderground = rigPos.current.y < -2

    let desiredY = BASE.y + (ZOOM.y - BASE.y) * influenceSmoothed.current
    let desiredZ = BASE.z + (ZOOM.z - BASE.z) * influenceSmoothed.current
    let lookY = LOOK.y

    if (isUnderground) {
      desiredZ = THREE.MathUtils.lerp(desiredZ, 22, 0.5)
      lookY = rigPos.current.y + 2
    }

    const camSmooth = inPipeTransition ? 0.1 : endSection ? 0.08 : 0.05
    camera.position.y += (desiredY - camera.position.y) * camSmooth
    camera.position.z += (desiredZ - camera.position.z) * camSmooth

    const lookX = focusXSmoothed.current
    LOOK_AT.set(lookX, lookY, LOOK.z)
    camera.lookAt(LOOK_AT)
  })

  return null
}

function HouseDetector({ onReachHouse }) {
  const triggered = useRef(false)

  useFrame(() => {
    if (triggered.current) return
    const scroll = getSmoothedScroll()
    if (scroll >= 0.99) {
      triggered.current = true
      onReachHouse()
    }
  })

  return null
}

export default function App() {
  const navigate = useNavigate()
  const [fading, setFading] = useState(false)

  const handleReachHouse = () => {
    setFading(true)
    setTimeout(() => navigate("/app"), 1500)
  }

  return (
    <>
      <div style={{ height: "1500vh" }} />

      {fading && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "#000",
          zIndex: 9999,
          animation: "fadeToBlack 1.5s ease-in forwards",
        }} />
      )}

      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}>
        <Canvas camera={{ position: [0, 6, 35], fov: 60 }}>
          <ambientLight intensity={1} />
          <directionalLight position={[5, 10, 5]} intensity={2} />
          <SkyDome />
          <TitleSign />
          <Suspense fallback={null}>
            <Level />
            <CrabEnemies />
            <MarioCharacter />
          </Suspense>
          {features.map((f, i) => (
            <Panel key={i} label={f.label} position={[f.x, 11, 0]} navigate={navigate} />
          ))}
          <Panel label={undergroundPanel.label} position={[undergroundPanel.x, undergroundPanel.y, 8]} radius={12} />
          <ScrollCamera />
          <HouseDetector onReachHouse={handleReachHouse} />
        </Canvas>
      </div>

    </>
  )
}
