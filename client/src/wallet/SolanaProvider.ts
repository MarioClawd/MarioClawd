import {
  Connection,
  VersionedTransaction,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

interface WalletProvider {
  isPhantom?: boolean;
  isSolflare?: boolean;
  connect(): Promise<{ publicKey: PublicKey }>;
  disconnect(): Promise<void>;
  signTransaction(tx: VersionedTransaction): Promise<VersionedTransaction>;
  on(event: string, callback: (...args: any[]) => void): void;
  off(event: string, callback: (...args: any[]) => void): void;
}

interface ConnectResult {
  address: string;
  balance: string;
  provider: string;
}

interface TransactionResult {
  signature: string;
  confirmed: boolean;
}

const MAINNET_RPC = 'https://api.mainnet-beta.solana.com';

export class SolanaWallet {
  private connection: Connection;
  private provider: WalletProvider | null = null;
  private publicKey: PublicKey | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(rpcUrl: string = MAINNET_RPC) {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  private detectProvider(): WalletProvider | null {
    if (typeof window === 'undefined') return null;

    const win = window as any;

    if (win.solana?.isPhantom) {
      return win.solana;
    }

    if (win.solflare?.isSolflare) {
      return win.solflare;
    }

    return null;
  }

  public async connect(): Promise<ConnectResult> {
    this.provider = this.detectProvider();

    if (!this.provider) {
      throw new Error(
        'No Solana wallet found. Install Phantom or Solflare, or open this page in a new browser tab.'
      );
    }

    try {
      const resp = await this.provider.connect();
      this.publicKey = resp.publicKey;

      this.provider.on('disconnect', this.handleDisconnect);
      this.provider.on('accountChanged', this.handleAccountChanged);

      const balance = await this.getBalance();
      const providerName = this.provider.isPhantom
        ? 'Phantom'
        : 'Solflare';

      return {
        address: this.publicKey.toString(),
        balance: balance.toString(),
        provider: providerName,
      };
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('Connection rejected');
      }
      throw new Error('Failed to connect wallet');
    }
  }

  public async disconnect(): Promise<void> {
    if (this.provider) {
      this.provider.off('disconnect', this.handleDisconnect);
      this.provider.off('accountChanged', this.handleAccountChanged);
      await this.provider.disconnect();
    }

    this.provider = null;
    this.publicKey = null;
    this.emit('disconnect');
  }

  public async getBalance(): Promise<number> {
    if (!this.publicKey) return 0;

    const lamports = await this.connection.getBalance(this.publicKey);
    return lamports / LAMPORTS_PER_SOL;
  }

  public async signAndSendTransaction(
    base64Transaction: string
  ): Promise<TransactionResult> {
    if (!this.provider || !this.publicKey) {
      throw new Error('Wallet not connected');
    }

    const txBytes = Uint8Array.from(
      atob(base64Transaction),
      (c) => c.charCodeAt(0)
    );

    const transaction = VersionedTransaction.deserialize(txBytes);

    let signed: VersionedTransaction;
    try {
      signed = await this.provider.signTransaction(transaction);
    } catch (error: any) {
      if (error.code === 4001 || error.message?.includes('rejected')) {
        throw new Error('Transaction rejected');
      }
      throw error;
    }

    const signature = await this.connection.sendRawTransaction(
      signed.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      }
    );

    const confirmation = await this.connection.confirmTransaction(
      signature,
      'confirmed'
    );

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    return {
      signature,
      confirmed: true,
    };
  }

  public getAddress(): string | null {
    return this.publicKey?.toString() || null;
  }

  public isConnected(): boolean {
    return this.publicKey !== null;
  }

  private handleDisconnect = (): void => {
    this.publicKey = null;
    this.emit('disconnect');
  };

  private handleAccountChanged = (newPublicKey: PublicKey | null): void => {
    if (newPublicKey) {
      this.publicKey = newPublicKey;
      this.emit('accountChanged', newPublicKey.toString());
    } else {
      this.handleDisconnect();
    }
  };

  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  public off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((cb) => cb(...args));
  }
}
