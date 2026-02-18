# Security Policy

## Wallet Security

MarioClawd is designed to be fully non-custodial:

- **No private key access**: The application never accesses, stores, or transmits wallet private keys
- **Client-side signing**: All transaction signing happens in the browser via wallet extensions (Phantom/Solflare)
- **Provider API only**: Wallet interaction uses the standard provider API — connect, signTransaction, disconnect
- **Session-based**: Wallet connections are not persisted between sessions

## Token Launch Security

- **Partial signing model**: The server signs only the mint keypair; the user's wallet signs as creator/payer
- **Mint keypair lifecycle**: Generated per-launch, used once for signing, then discarded
- **Transaction transparency**: Users can inspect exactly what they're signing in their wallet before approval
- **No fund custody**: SOL for fees comes directly from the user's wallet at signing time

## API Security

- **Server-side secrets**: All API keys are stored as environment variables, never exposed to the client
- **Proxy isolation**: The frontend communicates with the backend exclusively through Vite's proxy
- **No client exposure**: AI service credentials never reach the browser
- **CORS configuration**: Cross-origin access is controlled via middleware

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email security concerns to the maintainers
3. Include a detailed description and steps to reproduce
4. Allow reasonable time for a fix before disclosure

## Scope

The following are in scope for security reports:

- Private key or secret exposure
- Transaction manipulation or injection
- Authentication bypass
- Cross-site scripting (XSS) in the dashboard
- Server-side request forgery (SSRF)

## Out of Scope

- Token price movements or market risks
- Third-party service outages (pump.fun, PumpPortal, Solana RPC)
- Social engineering attacks
- Issues requiring physical access to a user's device

