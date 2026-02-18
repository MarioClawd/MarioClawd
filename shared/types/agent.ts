export type AgentTool = 'warp' | 'lobster' | 'chat' | 'trading' | 'factory';

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
}

export interface AgentChatRequest {
  message: string;
  history?: AgentMessage[];
  tool?: AgentTool;
  walletAddress?: string;
  tokenImage?: string;
  bannerImage?: string;
}

export interface AgentAction {
  type: 'sign_transaction' | 'copy_command' | 'token_launched';
  transaction?: string;
  mintPublicKey?: string;
  command?: string;
  name?: string;
  symbol?: string;
  description?: string;
  bannerImage?: string;
  token?: TokenLaunchResult;
}

export interface AgentChatResponse {
  response: string;
  agent: string;
  actions: AgentAction[];
}

export interface TokenLaunchResult {
  name: string;
  symbol: string;
  mintAddress: string;
  txSignature: string;
  tradeUrl: string;
  explorerUrl: string;
  walletAddress: string;
  createdAt: string;
}

export interface TokenPrepareRequest {
  name: string;
  symbol: string;
  description: string;
  walletAddress: string;
  tokenImage?: string;
  bannerImage?: string;
}

export interface TokenPrepareResponse {
  success: boolean;
  transaction: string;
  mintPublicKey: string;
  name: string;
  symbol: string;
}

export interface TokenConfirmRequest {
  name: string;
  symbol: string;
  mintAddress: string;
  txSignature: string;
  walletAddress: string;
  bannerImage?: string;
}

export interface ServiceStatus {
  services: {
    clawd: { status: string; model?: string };
    x402: { status: string };
    bankr: { status: string };
    tokenLauncher: { status: string; launches: number };
    moltbook: { status: string; agents: number };
  };
}

export interface MoltbookAgent {
  id: string;
  name: string;
  description: string;
  api_key: string;
  claim_url: string;
  verification_code: string;
  claimed: boolean;
  createdAt: string;
}

export interface TradeCommand {
  action: 'buy' | 'sell' | 'swap';
  amount: string;
  token: string;
  chain?: string;
}
