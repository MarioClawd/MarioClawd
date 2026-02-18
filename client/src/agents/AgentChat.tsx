import { useState, useRef, useEffect, useCallback } from 'react';
import { SolanaWallet } from '../wallet/SolanaProvider';

export interface AgentConfig {
  id: string;
  name: string;
  agent: string;
  icon: string;
  color: string;
  tool: string;
  welcome: string;
  placeholder: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  actions?: AgentAction[];
}

interface AgentAction {
  type: 'sign_transaction' | 'copy_command' | 'token_launched';
  transaction?: string;
  mintPublicKey?: string;
  command?: string;
  token?: {
    name: string;
    symbol: string;
    mintAddress: string;
    tradeUrl: string;
    explorerUrl: string;
  };
  [key: string]: any;
}

interface AgentChatProps {
  config: AgentConfig;
  walletAddress: string;
  walletConnected: boolean;
  solanaWallet: SolanaWallet;
}

export function AgentChat({
  config,
  walletAddress,
  walletConnected,
  solanaWallet,
}: AgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: config.welcome,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenImage, setTokenImage] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.text,
          history,
          tool: config.tool,
          walletAddress,
          tokenImage,
          bannerImage,
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        text: data.response || 'Something went wrong.',
        timestamp: Date.now(),
        actions: data.actions || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.actions) {
        for (const action of data.actions) {
          if (action.type === 'sign_transaction') {
            await handleSignTransaction(action);
          }
        }
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          text: 'Connection lost! Try again.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, config, walletAddress, tokenImage, bannerImage]);

  const handleSignTransaction = async (action: AgentAction) => {
    if (!walletConnected || !action.transaction) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          text: 'Please connect your Solana wallet first.',
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    try {
      const result = await solanaWallet.signAndSendTransaction(
        action.transaction
      );

      const confirmResponse = await fetch('/api/token/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: action.name,
          symbol: action.symbol,
          mintAddress: action.mintPublicKey,
          txSignature: result.signature,
          walletAddress,
          bannerImage,
        }),
      });

      const confirmData = await confirmResponse.json();

      if (confirmData.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `Token launched! 🎉 ${action.name} ($${action.symbol}) is live on pump.fun!`,
            timestamp: Date.now(),
            actions: [
              {
                type: 'token_launched',
                token: confirmData.token,
              },
            ],
          },
        ]);
        setTokenImage(null);
        setBannerImage(null);
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          text: error.message === 'Transaction rejected'
            ? 'Transaction rejected.'
            : `Launch failed: ${error.message}`,
          timestamp: Date.now(),
        },
      ]);
    }
  };

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (type === 'logo') {
        setTokenImage(base64);
      } else {
        setBannerImage(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const renderAction = (action: AgentAction) => {
    switch (action.type) {
      case 'copy_command':
        return (
          <div className="action-buttons">
            <button
              className="action-btn"
              onClick={() => navigator.clipboard.writeText(action.command || '')}
            >
              Copy
            </button>
            <a
              className="action-btn"
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(action.command || '')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Tweet
            </a>
          </div>
        );

      case 'token_launched':
        return (
          <div className="token-launched">
            <a href={action.token?.tradeUrl} target="_blank" rel="noopener">
              Trade on pump.fun
            </a>
            <a href={action.token?.explorerUrl} target="_blank" rel="noopener">
              View on Solscan
            </a>
            <button
              className="action-btn"
              onClick={() =>
                navigator.clipboard.writeText(action.token?.mintAddress || '')
              }
            >
              Copy Address
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="agent-chat">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-message ${msg.role}`}
            style={
              msg.role === 'assistant'
                ? { borderLeftColor: config.color }
                : undefined
            }
          >
            {msg.role === 'assistant' && (
              <span className="agent-label">{config.agent}</span>
            )}
            <p>{msg.text}</p>
            {msg.actions?.map((action, j) => (
              <div key={j}>{renderAction(action)}</div>
            ))}
          </div>
        ))}
        {loading && (
          <div className="chat-message assistant typing">
            <span className="typing-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {(tokenImage || bannerImage) && (
        <div className="image-previews">
          {tokenImage && (
            <div className="image-preview">
              <span>Logo</span>
              <button onClick={() => setTokenImage(null)}>×</button>
            </div>
          )}
          {bannerImage && (
            <div className="image-preview">
              <span>Banner</span>
              <button onClick={() => setBannerImage(null)}>×</button>
            </div>
          )}
        </div>
      )}

      <div className="chat-input-area">
        {config.tool === 'factory' && (
          <>
            <button
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload token logo"
            >
              IMG
            </button>
            <button
              className="upload-btn"
              onClick={() => bannerInputRef.current?.click()}
              title="Upload banner image"
            >
              HDR
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleImageUpload(e, 'logo')}
            />
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleImageUpload(e, 'banner')}
            />
          </>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={config.placeholder}
          disabled={loading}
        />
        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          ▶
        </button>
      </div>
    </div>
  );
}

