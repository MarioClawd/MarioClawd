# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-02-18

### Added
- 3D scroll-based Mario level with Catmull-Rom camera path interpolation
- Mario OS dashboard with five AI-powered agent apps
- Pipe Agent (Warp Zone) — x402 USDC micropayments
- Crab Agent (Lobster Lab) — Moltbook agent management
- Clawd (World Chat) — General AI assistant
- Star Agent (Trade Zone) — Solana trading via @bankrbot
- Mint Agent (Token Factory) — Token launches on pump.fun
- Client-side wallet signing for token launches
- Phantom and Solflare wallet support
- Token logo (IMG) and banner (HDR) image uploads
- Automatic banner upload to pump.fun after token creation
- Boot sequence animation with typewriter effect
- 8 animated crab enemies with walk, hop, and clap behaviors
- Baked skinned mesh optimization for crab instances
- Custom sky dome with procedural cloud shader
- Smooth scroll engine with speed capping and touch support
- Responsive pixel-art dashboard with macOS-style windows
- Service status indicators in the top bar
- React Router navigation between 3D world and dashboard

### Technical
- React 19 with TypeScript
- Three.js via React Three Fiber
- Vite 7 build system with code splitting
- Express.js backend with Claude tool_use architecture
- PumpPortal integration for transaction building
- pump.fun IPFS integration for metadata storage
- Spatial grid entity management system
- Arc-length parameterized camera splines
