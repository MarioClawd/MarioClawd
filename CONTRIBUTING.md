# Contributing to MarioClawd

We welcome contributions to MarioClawd! Whether it's new agent capabilities, 3D world improvements, or bug fixes, your help makes the project better.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/MarioClawd.git`
3. Install dependencies: `npm install && cd client && npm install && cd ../server && npm install`
4. Copy environment variables: `cp .env.example .env`
5. Start development: `npm run dev`

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Commit with a descriptive message
5. Push and open a Pull Request

## Code Style

- TypeScript for all new code
- React functional components with hooks
- Follow existing naming conventions
- Keep components focused and composable

## Areas for Contribution

### 3D World (`client/src/engine/`)
- New level sections and terrain
- Camera path improvements
- Entity behaviors and animations
- Performance optimizations

### AI Agents (`client/src/agents/`, `server/src/services/`)
- New agent types and capabilities
- Improved conversation flows
- Tool function implementations

### Dashboard (`client/src/components/Dashboard.tsx`)
- UI/UX improvements
- New app windows
- Accessibility enhancements

### Wallet Integration (`client/src/wallet/`)
- Additional wallet support
- Multi-chain capabilities
- Transaction monitoring

## Pull Request Guidelines

- Describe what your PR does and why
- Include screenshots for visual changes
- Keep PRs focused — one feature per PR
- Ensure no secrets or API keys are committed

## Reporting Issues

Use GitHub Issues to report bugs or request features. Include:
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Browser and wallet version (if relevant)

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.
