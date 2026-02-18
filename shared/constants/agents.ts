export const AGENT_NAMES: Record<string, string> = {
  warp: 'Pipe Agent',
  lobster: 'Crab Agent',
  chat: 'Clawd',
  trading: 'Star Agent',
  factory: 'Mint Agent',
};

export const AGENT_COLORS: Record<string, string> = {
  warp: '#2ecc40',
  lobster: '#ff6b35',
  chat: '#9b59b6',
  trading: '#3498db',
  factory: '#f1c40f',
};

export const AGENT_ICONS: Record<string, string> = {
  warp: 'pipe',
  lobster: 'question-block',
  chat: 'brick',
  trading: 'star',
  factory: 'castle',
};

export const SUPPORTED_CHAINS = [
  { id: 'solana', name: 'Solana', token: 'SOL', rpc: 'https://api.mainnet-beta.solana.com' },
] as const;

export const TOKEN_LAUNCH_CONFIG = {
  slippage: 10,
  priorityFee: 0.0005,
  pool: 'pump',
  maxNameLength: 32,
  maxSymbolLength: 10,
  maxDescriptionLength: 500,
  minDescriptionLength: 20,
  maxImageSize: 5 * 1024 * 1024,
} as const;

export const SCROLL_CONFIG = {
  maxSpeed: 1 / 20,
  smoothingFactor: 0.08,
  duration: 20000,
  completeThreshold: 0.99,
  fadeStartThreshold: 0.97,
  transitionDelay: 1500,
} as const;

export const CRAB_BEHAVIORS = ['walk', 'hop', 'clap'] as const;
export type CrabBehavior = typeof CRAB_BEHAVIORS[number];
