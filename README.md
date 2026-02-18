# MarioClawd

**3D Scroll-Based Mario Experience with AI-Powered Crypto Utility Dashboard**

[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r182-black?style=flat-square&logo=threedotjs)](https://threejs.org/)
[![Solana](https://img.shields.io/badge/Solana-Mainnet-9945ff?style=flat-square&logo=solana)](https://solana.com/)

[Live Demo](https://marioclawd.com) ·
[Documentation](docs/) ·
[Architecture](#architecture) ·
[Contributing](CONTRIBUTING.md)

---

## Overview

MarioClawd is a full-stack web application that combines a real-time 3D scroll experience with a retro pixel-art utility dashboard. Users scroll through an interactive Mario-themed level rendered with Three.js, and when Mario reaches the castle, the screen fades to black and boots into **Mario OS** — a desktop environment where every app is a conversational AI agent that handles real blockchain operations.

```
┌──────────────────────────────────────────────────────────────────┐
│                       MarioClawd                                 │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  3D Scroll   │  │  Mario OS   │  │  Agent      │              │
│  │  Engine      │  │  Dashboard  │  │  Framework  │              │
│  │             │  │             │  │             │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│  ┌──────┴────────────────┴────────────────┴──────┐              │
│  │              React + Three.js Frontend        │              │
│  │     Scroll · Camera · Entities · Wallet       │              │
│  └──────────────────────┬────────────────────────┘              │
│                         │                                        │
│  ┌──────────────────────┴────────────────────────┐              │
│  │              Express.js API Backend           │              │
│  │   Agents · Token Launches · Payments · Trade  │              │
│  └───────────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────────┘
```

## Features

| Feature | Description |
|:--------|:------------|
| **3D Scroll World** | Interactive Mario level with Catmull-Rom camera path, 20-second scroll duration, touch support |
| **Mario OS Dashboard** | Retro pixel-art desktop with boot sequence, app windows, taskbar, and animated sky backdrop |
| **Five AI Agents** | Conversational specialists for payments, trading, AI chat, agent management, and token launches |
| **Token Factory** | Launch tokens on Solana via pump.fun with client-side signing — keep 100% of creator fees |
| **Wallet Integration** | Phantom and Solflare support with non-custodial transaction signing |
| **x402 Payments** | HTTP-native USDC micropayments using the 402 Payment Required protocol |
| **Solana Trading** | Compose @bankrbot trading commands for on-chain execution via X/Twitter |
| **Agent Network** | Register and manage autonomous AI agents on Moltbook |

## Quick Start

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- A Solana wallet browser extension ([Phantom](https://phantom.app) or [Solflare](https://solflare.com))

### Installation

```bash
git clone https://github.com/MarioClawd/MarioClawd.git
cd MarioClawd

# Install all dependencies
npm install
cd client && npm install
cd ../server && npm install
cd ..

# Configure environment
cp .env.example .env
# Add your API keys to .env

# Start development
npm run dev
```

The client runs on `http://localhost:5000` and the API server on `http://localhost:3001`.

## Architecture

### 3D Scroll Engine

The scroll engine drives the entire 3D experience. It translates scroll input into smooth camera movement along a predefined spline path through the Mario world.

```typescript
import { ScrollEngine } from './engine/ScrollEngine';
import { CameraPath, WORLD_CAMERA_KEYFRAMES } from './engine/CameraPath';

const engine = new ScrollEngine(controlPoints, {
  maxSpeed: 1 / 20,        // 20-second scroll duration
  smoothingFactor: 0.08,    // Input smoothing
  duration: 20000,          // Total duration in ms
});

engine.on('update', (state) => {
  const camera = cameraPath.evaluate(state.progress);
  // camera.position, camera.quaternion, camera.fov
});

engine.on('complete', () => {
  // Fade to black → Navigate to /app → Boot sequence
});
```

Key components:
- **`ScrollEngine`** — Handles wheel/touch input, speed capping, smooth interpolation
- **`CameraPath`** — Catmull-Rom spline evaluation with FOV and roll interpolation
- **`EntityManager`** — Spatial grid for enemies, collectibles, and world objects with behavior patterns

### Entity System

Entities (crabs, platforms, decorations) use a behavior-driven animation system:

```typescript
const entityManager = new EntityManager(cellSize: 16);

entityManager.register({
  type: 'enemy',
  position: [18, 5.2, 0],
  behavior: { pattern: 'walk', speed: 1.8, range: 2.5 },
}, crabMesh);

// Per-frame update
entityManager.update(deltaTime, scrollProgress);

// Spatial queries
const nearby = entityManager.queryRadius(playerPos, radius: 10);
```

Three behavior patterns for crab enemies:
- **Walk** — Patrol back and forth with wobble animation
- **Hop** — Bounce in place with squash/stretch deformation
- **Clap** — Pulse width with rocking motion (claw snapping)

### Baked Skinned Meshes

For performance, `SkinnedMesh` geometry from GLB models is baked into static meshes at load time. The baked geometry is shared across all instances, with cloned materials for individual tinting:

```typescript
const baked = EntityManager.bakeSkinnedMesh(skinnedMesh);
// baked.geometry — shared across 8 crab instances
// baked.material — cloned per instance for unique colors
```

### Mario OS Dashboard

The dashboard is a React SPA styled as a retro operating system:

```
┌──────────────────────────────────────────┐
│ MARIO OS    ●●●●●    Connect Wallet  ◎ 0 │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  │  Warp  │ │Lobster │ │ World  │       │
│  │  Zone  │ │  Lab   │ │  Chat  │       │
│  └────────┘ └────────┘ └────────┘       │
│  ┌────────┐ ┌────────┐                  │
│  │ Trade  │ │ Token  │                  │
│  │  Zone  │ │Factory │                  │
│  └────────┘ └────────┘                  │
│                                          │
├──────────────────────────────────────────┤
│ ★ START  [🟢][🦀][🧱][⭐][🏰]    12:00 │
└──────────────────────────────────────────┘
```

Each app opens as a draggable window with a chat interface powered by a specialized AI agent.

### Agent Architecture

All five agents share a unified conversation architecture:

```
User message → Claude (tool_use) → Tool execution → Result → Response
                    ↕                     ↕
              System prompt          Up to 5 iterations
              + tool definitions     per conversation turn
```

| Agent | App | Tools | Purpose |
|:------|:----|:------|:--------|
| Pipe Agent | Warp Zone | `send_payment`, `get_payment_history` | x402 USDC payments |
| Crab Agent | Lobster Lab | `register_agent`, `auto_post`, `list_agents` | Moltbook management |
| Clawd | World Chat | *(none — knowledge only)* | Crypto/DeFi Q&A |
| Star Agent | Trade Zone | `compose_trade` | @bankrbot commands |
| Mint Agent | Token Factory | `launch_token` | pump.fun token launches |

### Token Launch Flow

The Token Factory uses client-side signing — your wallet deploys the token, so you keep 100% of creator fees:

```
User provides details → Backend uploads to IPFS → PumpPortal builds tx
→ Server signs mint keypair → User wallet signs as creator → Submit to Solana
→ Token live on pump.fun → Banner uploaded automatically
```

```typescript
// 1. Backend builds partially-signed transaction
const { transaction, mintPublicKey } = await prepareToken({
  name: 'MoonCoin',
  symbol: 'MOON',
  description: 'A community token',
  walletAddress: userWallet,
});

// 2. User's wallet signs and submits
const signed = await wallet.signTransaction(transaction);
const signature = await connection.sendRawTransaction(signed.serialize());
```

## Project Structure

```
MarioClawd/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ScrollWorld.tsx     # 3D scroll experience
│   │   │   ├── MarioCharacter.tsx  # Animated Mario model
│   │   │   ├── CrabEnemies.tsx     # 8 enemy crabs
│   │   │   ├── SkyDome.tsx         # Procedural sky shader
│   │   │   └── Dashboard.tsx       # Mario OS desktop
│   │   ├── engine/            # 3D engine systems
│   │   │   ├── ScrollEngine.ts     # Scroll input → progress
│   │   │   ├── CameraPath.ts       # Spline camera movement
│   │   │   └── EntityManager.ts    # Spatial entity system
│   │   ├── agents/            # Agent chat UI
│   │   │   └── AgentChat.tsx       # Unified chat component
│   │   ├── wallet/            # Solana wallet integration
│   │   │   └── SolanaProvider.ts   # Phantom/Solflare provider
│   │   ├── hooks/             # React hooks
│   │   ├── utils/             # Math utilities
│   │   ├── styles/            # CSS (pixel-art theme)
│   │   └── App.tsx            # Router + entry point
│   ├── public/
│   │   ├── models/            # GLB 3D models
│   │   └── textures/          # Texture assets
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                    # Express.js backend
│   └── src/
│       ├── routes/            # API route handlers
│       ├── services/          # Agent + token services
│       └── middleware/        # Auth, CORS, rate limiting
├── shared/                    # Shared types + constants
│   ├── types/
│   └── constants/
├── docs/                      # GitBook documentation
├── .env.example
├── package.json
├── tsconfig.json
├── CONTRIBUTING.md
├── SECURITY.md
├── CODE_OF_CONDUCT.md
├── CHANGELOG.md
└── LICENSE
```

## Supported Wallets

| Wallet | Detection | Status |
|:-------|:----------|:-------|
| [Phantom](https://phantom.app) | `window.solana` | **Supported** |
| [Solflare](https://solflare.com) | `window.solflare` | **Supported** |

> **Note**: Wallet extensions don't work inside iframes. Open the published URL in a regular browser tab for wallet functionality.

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| **3D Rendering** | Three.js r182 via React Three Fiber |
| **Frontend** | React 19, TypeScript 5.8, Vite 7 |
| **Styling** | CSS with Press Start 2P pixel font |
| **Backend** | Express.js 5, Node.js 18+ |
| **AI** | Claude via tool_use architecture |
| **Blockchain** | Solana (mainnet), @solana/web3.js |
| **Token Launches** | PumpPortal API + pump.fun IPFS |
| **Payments** | x402 protocol (HTTP 402) |
| **Routing** | React Router v7 |

## Environment Variables

| Variable | Required | Description |
|:---------|:---------|:------------|
| `ANTHROPIC_API_KEY` | Yes | Powers all five AI agents |
| `X402_WALLET_ADDRESS` | Optional | x402 payment sender address |
| `X402_WALLET_KEY` | Optional | x402 wallet private key |
| `SOLANA_RPC_URL` | Optional | Custom RPC (defaults to public mainnet) |

## License

This project is licensed under the [MIT License](LICENSE).

## Links

- [Documentation](docs/)
- [Contributing Guide](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Changelog](CHANGELOG.md)
