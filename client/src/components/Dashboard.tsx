import { useState, useEffect, useCallback, useRef } from 'react';
import { AgentChat, AgentConfig } from '../agents/AgentChat';
import { SolanaWallet } from '../wallet/SolanaProvider';
import '../styles/dashboard.css';

interface AppWindow {
  id: string;
  agent: AgentConfig;
  minimized: boolean;
  position: { x: number; y: number };
}

interface ServiceStatus {
  clawd: { status: string };
  x402: { status: string };
  bankr: { status: string };
  tokenLauncher: { status: string; launches: number };
  moltbook: { status: string; agents: number };
}

const AGENT_CONFIGS: AgentConfig[] = [
  {
    id: 'warp',
    name: 'Warp Zone',
    agent: 'Pipe Agent',
    icon: 'pipe',
    color: '#2ecc40',
    tool: 'warp',
    welcome: 'Pipe Agent ready! Where should we warp your USDC today?',
    placeholder: 'e.g. Send 5 USDC to 0x1234...',
  },
  {
    id: 'lobster',
    name: 'Lobster Lab',
    agent: 'Crab Agent',
    icon: 'question-block',
    color: '#ff6b35',
    tool: 'lobster',
    welcome: 'Crab Agent here! Ready to manage your Moltbook agents.',
    placeholder: 'e.g. Register an agent called NewsBot',
  },
  {
    id: 'chat',
    name: 'World Chat',
    agent: 'Clawd',
    icon: 'brick',
    color: '#9b59b6',
    tool: 'chat',
    welcome: 'Clawd at your service! Ask me anything about crypto & DeFi.',
    placeholder: 'e.g. What is an AMM?',
  },
  {
    id: 'trading',
    name: 'Trade Zone',
    agent: 'Star Agent',
    icon: 'star',
    color: '#3498db',
    tool: 'trading',
    welcome: 'Star Agent powered up! Ready to compose your trades.',
    placeholder: 'e.g. Buy $50 of SOL',
  },
  {
    id: 'factory',
    name: 'Token Factory',
    agent: 'Mint Agent',
    icon: 'castle',
    color: '#f1c40f',
    tool: 'factory',
    welcome: 'Mint Agent here! Let\'s launch your token on pump.fun.',
    placeholder: 'e.g. Launch a token called MoonCoin',
  },
];

function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const bootLines = [
    'MARIO OS v1.0',
    'Loading world data...',
    'Initializing pipe network...',
    'Connecting agent grid...',
    'x402 protocol ready.',
    'Welcome, Player 1.',
  ];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < bootLines.length) {
        setLines((prev) => [...prev, bootLines[index]]);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 600);
      }
    }, 350);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="boot-screen">
      <div className="boot-terminal">
        {lines.map((line, i) => (
          <div key={i} className="boot-line">
            <span className="boot-cursor">&gt;</span> {line}
          </div>
        ))}
        <div className="boot-cursor-blink">_</div>
      </div>
    </div>
  );
}

function StatusDots({ status }: { status: ServiceStatus | null }) {
  if (!status) return null;

  const services = [
    { key: 'clawd', label: 'AI' },
    { key: 'x402', label: 'Pay' },
    { key: 'bankr', label: 'Trade' },
    { key: 'tokenLauncher', label: 'Mint' },
    { key: 'moltbook', label: 'Molt' },
  ];

  return (
    <div className="status-dots">
      {services.map((svc) => {
        const s = (status as any)[svc.key];
        const active = s?.status === 'active';
        return (
          <div
            key={svc.key}
            className={`status-dot ${active ? 'active' : 'inactive'}`}
            title={`${svc.label}: ${s?.status || 'unknown'}`}
          />
        );
      })}
    </div>
  );
}

function Taskbar({
  apps,
  onAppClick,
  activeApp,
}: {
  apps: AgentConfig[];
  onAppClick: (id: string) => void;
  activeApp: string | null;
}) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="taskbar">
      <button className="start-button">
        <span className="start-icon">★</span> START
      </button>
      <div className="taskbar-apps">
        {apps.map((app) => (
          <button
            key={app.id}
            className={`taskbar-icon ${activeApp === app.id ? 'active' : ''}`}
            onClick={() => onAppClick(app.id)}
            title={app.name}
          >
            <span className={`icon-${app.icon}`} />
          </button>
        ))}
      </div>
      <div className="taskbar-clock">{time}</div>
    </div>
  );
}

export function Dashboard() {
  const [booted, setBooted] = useState(false);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [windows, setWindows] = useState<AppWindow[]>([]);
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [wallet, setWallet] = useState<{
    connected: boolean;
    address: string;
    balance: string;
  }>({ connected: false, address: '', balance: '' });

  const solanaWallet = useRef(new SolanaWallet());

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((data) => setStatus(data.services))
      .catch(() => {});
  }, []);

  const openApp = useCallback((id: string) => {
    setActiveApp(id);
    setWindows((prev) => {
      if (prev.find((w) => w.id === id)) return prev;
      const config = AGENT_CONFIGS.find((a) => a.id === id)!;
      return [
        ...prev,
        {
          id,
          agent: config,
          minimized: false,
          position: { x: 100 + prev.length * 30, y: 80 + prev.length * 30 },
        },
      ];
    });
  }, []);

  const closeApp = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveApp((prev) => (prev === id ? null : prev));
  }, []);

  const connectWallet = async () => {
    try {
      const result = await solanaWallet.current.connect();
      setWallet({
        connected: true,
        address: result.address,
        balance: result.balance,
      });
    } catch {
      setWallet({ connected: false, address: '', balance: '' });
    }
  };

  if (!booted) {
    return <BootSequence onComplete={() => setBooted(true)} />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-topbar">
        <span className="topbar-title">MARIO OS</span>
        <StatusDots status={status} />
        <div className="topbar-right">
          <button
            className="wallet-button"
            onClick={connectWallet}
          >
            {wallet.connected
              ? `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}`
              : 'Connect Wallet'}
          </button>
          {wallet.connected && (
            <span className="coin-display">
              ◎ {parseFloat(wallet.balance).toFixed(2)}
            </span>
          )}
        </div>
      </div>

      <div className="dashboard-content">
        <div className="sky-backdrop" />
        <div className="app-cards">
          {AGENT_CONFIGS.map((config) => (
            <div
              key={config.id}
              className={`app-card app-card-${config.id}`}
              onClick={() => openApp(config.id)}
              style={{ borderColor: config.color }}
            >
              <div className={`app-card-icon icon-${config.icon}`} />
              <div className="app-card-name">{config.name}</div>
              <div className="app-card-agent">{config.agent}</div>
            </div>
          ))}
        </div>

        {windows.map((win) => (
          <div
            key={win.id}
            className={`app-window ${activeApp === win.id ? 'focused' : ''}`}
            style={{
              left: win.position.x,
              top: win.position.y,
            }}
            onClick={() => setActiveApp(win.id)}
          >
            <div
              className="window-titlebar"
              style={{ backgroundColor: win.agent.color }}
            >
              <div className="window-dots">
                <span
                  className="dot red"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeApp(win.id);
                  }}
                />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <span className="window-title">{win.agent.name}</span>
            </div>
            <div className="window-body">
              <AgentChat
                config={win.agent}
                walletAddress={wallet.address}
                walletConnected={wallet.connected}
                solanaWallet={solanaWallet.current}
              />
            </div>
          </div>
        ))}
      </div>

      <Taskbar
        apps={AGENT_CONFIGS}
        onAppClick={openApp}
        activeApp={activeApp}
      />
    </div>
  );
}

