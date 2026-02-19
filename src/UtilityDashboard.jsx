import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { VersionedTransaction, Connection } from "@solana/web3.js"
import { createPhantom, Position } from "@phantom/wallet-sdk"
import "./dashboard.css"

const API = (path) => path

const APPS = [
  {
    id: "warp",
    name: "Warp Zone",
    icon: "pipe",
    tagline: "x402 Micropayments",
    color: "#27AE60",
    description: "Send micro-payments for AI tasks, model routing, or private transactions. Powered by x402 protocol — instant USDC settlement with near-zero fees.",
    features: [
      { label: "Min Payment", value: "$0.001" },
      { label: "Settlement", value: "Instant" },
      { label: "Networks", value: "Base, Solana, ETH" },
      { label: "Fee", value: "$0.00025" },
    ],
  },
  {
    id: "lobster",
    name: "Lobster Lab",
    icon: "qblock",
    tagline: "Moltbook Agent Hub",
    color: "#E74C3C",
    description: "Register AI agents on Moltbook — the social network for agents. Create agents, post content, and join communities (submolts).",
    features: [
      { label: "Platform", value: "Moltbook" },
      { label: "Agents", value: "2.5M+" },
      { label: "Communities", value: "17K+ submolts" },
      { label: "Features", value: "Post, Vote, DM" },
    ],
  },
  {
    id: "chat",
    name: "World Chat",
    icon: "brick",
    tagline: "Clawd AI Chat",
    color: "#8E44AD",
    description: "Chat with Clawd, your AI agent assistant. Ask about crypto, DeFi, agent management, or anything else.",
    features: [
      { label: "Engine", value: "Clawd AI" },
      { label: "Context", value: "Conversation" },
      { label: "Response", value: "<2s" },
      { label: "Personality", value: "Mario-themed" },
    ],
  },
  {
    id: "trading",
    name: "Trade Zone",
    icon: "star",
    tagline: "SOL Trading",
    color: "#3498DB",
    description: "Trade crypto on Solana via @Bankrbot. Compose buy, sell, and swap commands — tweet them to execute instantly on-chain.",
    features: [
      { label: "Chain", value: "Solana" },
      { label: "Trading", value: "@Bankrbot on X" },
      { label: "Actions", value: "Buy, Sell, Swap" },
      { label: "Speed", value: "Instant" },
    ],
  },
  {
    id: "factory",
    name: "Token Factory",
    icon: "castle",
    tagline: "Token Launch",
    color: "#F39C12",
    description: "Launch your own token on Solana instantly. Tell Mint Agent your token details and go live.",
    features: [
      { label: "Chain", value: "Solana" },
      { label: "Platform", value: "On-chain" },
      { label: "Cost", value: "Free" },
      { label: "Speed", value: "Instant" },
    ],
  },
]

function TaskbarIcon({ app, isActive, onClick, comingSoon }) {
  return (
    <button
      className={`taskbar-icon ${isActive ? "active" : ""}${comingSoon ? " taskbar-coming-soon" : ""}`}
      onClick={onClick}
      title={comingSoon ? `${app.name} - Coming Soon` : app.name}
    >
      <div className={`icon-block icon-${app.icon}`}>
        {app.icon === "pipe" && <PipeIcon />}
        {app.icon === "qblock" && <QBlockIcon />}
        {app.icon === "brick" && <BrickIcon />}
        {app.icon === "star" && <StarIcon />}
        {app.icon === "castle" && <CastleIcon />}
      </div>
      <span className="icon-label">{app.name}</span>
    </button>
  )
}

function StarIcon() {
  return (
    <svg viewBox="0 0 32 32" className="pixel-icon">
      <polygon points="16,2 20,12 30,12 22,19 25,30 16,23 7,30 10,19 2,12 12,12" fill="#3498DB" />
      <polygon points="16,5 19,12 26,12 21,17 23,26 16,21 9,26 11,17 6,12 13,12" fill="#5DADE2" />
    </svg>
  )
}

function PipeIcon() {
  return (
    <svg viewBox="0 0 32 32" className="pixel-icon">
      <rect x="4" y="6" width="24" height="6" fill="#27AE60" />
      <rect x="4" y="6" width="24" height="2" fill="#2ECC71" />
      <rect x="6" y="12" width="20" height="16" fill="#27AE60" />
      <rect x="6" y="12" width="2" height="16" fill="#2ECC71" />
      <rect x="24" y="12" width="2" height="16" fill="#1E8449" />
    </svg>
  )
}

function QBlockIcon() {
  return (
    <svg viewBox="0 0 32 32" className="pixel-icon">
      <rect x="2" y="2" width="28" height="28" fill="#F39C12" rx="2" />
      <rect x="2" y="2" width="28" height="4" fill="#F5B041" rx="2" />
      <rect x="4" y="28" width="24" height="2" fill="#D68910" />
      <text x="16" y="23" textAnchor="middle" fill="#fff" fontSize="16" fontFamily="monospace" fontWeight="bold">?</text>
    </svg>
  )
}

function BrickIcon() {
  return (
    <svg viewBox="0 0 32 32" className="pixel-icon">
      <rect x="2" y="2" width="28" height="28" fill="#8E44AD" rx="1" />
      <rect x="2" y="2" width="13" height="9" fill="#9B59B6" stroke="#7D3C98" strokeWidth="1" />
      <rect x="17" y="2" width="13" height="9" fill="#9B59B6" stroke="#7D3C98" strokeWidth="1" />
      <rect x="2" y="12" width="9" height="9" fill="#9B59B6" stroke="#7D3C98" strokeWidth="1" />
      <rect x="12" y="12" width="9" height="9" fill="#9B59B6" stroke="#7D3C98" strokeWidth="1" />
      <rect x="22" y="12" width="8" height="9" fill="#9B59B6" stroke="#7D3C98" strokeWidth="1" />
      <rect x="2" y="22" width="13" height="8" fill="#9B59B6" stroke="#7D3C98" strokeWidth="1" />
      <rect x="17" y="22" width="13" height="8" fill="#9B59B6" stroke="#7D3C98" strokeWidth="1" />
    </svg>
  )
}

function CastleIcon() {
  return (
    <svg viewBox="0 0 32 32" className="pixel-icon">
      <rect x="6" y="14" width="20" height="16" fill="#F39C12" />
      <rect x="4" y="6" width="6" height="24" fill="#E67E22" />
      <rect x="22" y="6" width="6" height="24" fill="#E67E22" />
      <rect x="12" y="8" width="8" height="8" fill="#E67E22" />
      <rect x="4" y="4" width="2" height="4" fill="#D35400" />
      <rect x="8" y="4" width="2" height="4" fill="#D35400" />
      <rect x="22" y="4" width="2" height="4" fill="#D35400" />
      <rect x="26" y="4" width="2" height="4" fill="#D35400" />
      <rect x="14" y="6" width="2" height="4" fill="#D35400" />
      <rect x="18" y="6" width="2" height="4" fill="#D35400" />
      <rect x="13" y="22" width="6" height="8" fill="#5D4037" rx="3" />
    </svg>
  )
}

const AGENT_CONFIG = {
  warp: {
    name: "Pipe Agent",
    placeholder: "Ask Pipe Agent to send payments, check history...",
    welcome: "I'm Pipe Agent, your x402 payments specialist. I can send USDC micropayments, check your payment history, and explain how the x402 protocol works. Try: \"Send 5 USDC to 0x123...\" or \"Show my payment history\"",
  },
  lobster: {
    name: "Crab Agent",
    placeholder: "Register, post, browse feed, manage agents...",
    welcome: "I'm Crab Agent, your Moltbook specialist. I can register agents, browse the feed, post to submolts, check claim status, and manage your agent list. Try: \"Register an agent called CoolBot\" or \"Show me the feed\"",
  },
  chat: {
    name: "Clawd",
    placeholder: "Ask Clawd anything...",
    welcome: "Chat with Clawd, your Mario OS AI assistant. Try: \"What is x402?\" or \"How do I deploy an agent?\"",
  },
  trading: {
    name: "Star Agent",
    placeholder: "Ask Star Agent to buy, sell, or swap...",
    welcome: "I'm Star Agent, your Solana trading specialist. I compose @bankrbot commands for buying, selling, and swapping crypto. Try: \"Buy $50 of SOL\" or \"Swap 100 USDC to SOL\"",
  },
  factory: {
    name: "Mint Agent",
    placeholder: "Ask Mint Agent to launch a token...",
    welcome: "I'm Mint Agent, your token launch specialist. I help you launch tokens on Solana instantly. Just tell me your token details and we'll go live. Try: \"Launch a token called MoonCoin\"",
  },
}

function AgentChat({ toolId, color, walletConnected, walletAddress, connectWallet, messages, setMessages, onSignTransaction }) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null)
  const [tokenImage, setTokenImage] = useState(null)
  const [tokenImagePreview, setTokenImagePreview] = useState(null)
  const [bannerImage, setBannerImage] = useState(null)
  const [bannerImagePreview, setBannerImagePreview] = useState(null)
  const imageInputRef = useRef(null)
  const bannerInputRef = useRef(null)
  const config = AGENT_CONFIG[toolId]

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  const openTwitter = (text) => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank")
  }

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (type === "banner") {
        setBannerImage(reader.result)
        setBannerImagePreview(URL.createObjectURL(file))
      } else {
        setTokenImage(reader.result)
        setTokenImagePreview(URL.createObjectURL(file))
      }
    }
    reader.readAsDataURL(file)
  }

  const sendMessage = async (overrideText) => {
    const msgText = overrideText || input
    if (!msgText.trim() || loading) return

    const userMsg = { role: "user", text: msgText, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    if (!overrideText) setInput("")
    setLoading(true)

    try {
      const res = await fetch(API("/api/agent-chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msgText,
          history: messages.map(m => ({ role: m.role, text: m.text })),
          tool: toolId,
          walletAddress: walletAddress || "",
          tokenImage: tokenImage || "",
          bannerImage: bannerImage || "",
        }),
      })
      const data = await res.json()

      const assistantMsg = { role: "assistant", text: data.response, agent: data.agent, time: new Date() }
      if (data.actions?.length > 0) assistantMsg.actions = data.actions
      setMessages(prev => [...prev, assistantMsg])

      const hasLaunchAction = (data.actions || []).some(a => a.type === "sign_transaction" || a.type === "token_launched")
      if (hasLaunchAction) {
        setTokenImage(null)
        setTokenImagePreview(null)
        setBannerImage(null)
        setBannerImagePreview(null)
      }

      for (const action of (data.actions || [])) {
        if (action.type === "sign_transaction" && onSignTransaction) {
          onSignTransaction(action, setMessages)
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Connection lost! Try again.", agent: "System", time: new Date() }])
    }
    setLoading(false)
  }

  const quickActions = toolId === "lobster" ? [
    { label: "Register Agent", msg: "I want to register a new agent" },
    { label: "Browse Feed", msg: "Show me the latest Moltbook feed" },
    { label: "Post to Moltbook", msg: "I want to post something to Moltbook" },
    { label: "My Agents", msg: "List my agents" },
  ] : null

  return (
    <div className="app-content chat-app">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>{config.welcome}</p>
            {quickActions && (
              <div className="quick-actions">
                {quickActions.map((qa, i) => (
                  <button key={i} className="quick-action-btn" style={{ borderColor: color, color: color }} onClick={() => { setInput(qa.msg); setTimeout(() => sendMessage(qa.msg), 50) }}>
                    {qa.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            {msg.role === "assistant" && <span className="bubble-agent">{msg.agent}</span>}
            <p style={{ whiteSpace: "pre-wrap" }}>{msg.text}</p>
            {msg.txLink && (
              <a href={msg.txLink} target="_blank" rel="noopener noreferrer" className="action-btn primary" style={{ background: "#2ECC71", display: "inline-block", fontSize: "7px", textDecoration: "none", marginTop: "6px" }}>
                View on Explorer
              </a>
            )}
            {msg.actions?.map((action, j) => (
              <div key={j} className="chat-action-buttons">
                {action.type === "copy_command" && (
                  <>
                    <div className="command-preview" style={{ marginTop: "8px" }}>
                      <div className="command-text">{action.command}</div>
                    </div>
                    <div className="command-actions" style={{ marginTop: "6px" }}>
                      <button className="action-btn" style={{ fontSize: "7px" }} onClick={() => copyToClipboard(action.command)}>Copy</button>
                      <button className="action-btn primary" style={{ background: "#1DA1F2", fontSize: "7px" }} onClick={() => openTwitter(action.command)}>Tweet to @bankrbot</button>
                    </div>
                  </>
                )}
                {action.type === "claim_agent" && (
                  <div style={{ marginTop: "8px" }}>
                    <div className="command-preview" style={{ marginTop: "4px", marginBottom: "6px" }}>
                      <div className="command-text" style={{ fontSize: "7px" }}>
                        {action.agentName}
                      </div>
                    </div>
                    <div className="command-actions" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button className="action-btn primary" style={{ background: "#1DA1F2", fontSize: "7px" }} onClick={() => { const tweet = `Claiming my agent on @moltbook ${action.verificationCode}`; window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, "_blank") }}>
                        Tweet to Claim
                      </button>
                      <button className="action-btn" style={{ fontSize: "7px" }} onClick={() => { navigator.clipboard.writeText(action.apiKey) }}>
                        Copy API Key
                      </button>
                      <button className="action-btn" style={{ fontSize: "7px" }} onClick={() => { navigator.clipboard.writeText(action.verificationCode) }}>
                        Copy Verify Code
                      </button>
                      <a href={action.claimUrl} target="_blank" rel="noopener noreferrer" className="action-btn" style={{ fontSize: "7px", textDecoration: "none" }}>
                        Claim Page
                      </a>
                    </div>
                  </div>
                )}
                {action.type === "sign_transaction" && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ fontSize: "7px", color: "#F39C12", marginBottom: "6px" }}>Token ready to launch — approve in your wallet</div>
                    <button className="action-btn primary" style={{ background: "#27AE60", fontSize: "8px", padding: "6px 12px" }} onClick={() => onSignTransaction && onSignTransaction(action, setMessages)}>
                      Approve in Wallet
                    </button>
                  </div>
                )}
                {action.type === "token_launched" && action.token && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ fontSize: "7px", color: "#2ECC71", marginBottom: "6px" }}>Token launched on Solana!</div>
                    <div className="command-preview" style={{ marginTop: "4px" }}>
                      <div className="command-text" style={{ fontSize: "7px" }}>
                        CA: {action.token.mintAddress}
                      </div>
                    </div>
                    <div className="command-actions" style={{ marginTop: "6px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {action.token.tradeUrl && (
                        <a href={action.token.tradeUrl} target="_blank" rel="noopener noreferrer" className="action-btn primary" style={{ background: "#27AE60", fontSize: "7px", textDecoration: "none" }}>
                          Trade
                        </a>
                      )}
                      {action.token.explorerUrl && (
                        <a href={action.token.explorerUrl} target="_blank" rel="noopener noreferrer" className="action-btn" style={{ fontSize: "7px", textDecoration: "none" }}>
                          View on Solscan
                        </a>
                      )}
                      <button className="action-btn" style={{ fontSize: "7px" }} onClick={() => { navigator.clipboard.writeText(action.token.mintAddress) }}>
                        Copy CA
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        {loading && <div className="chat-bubble assistant"><p className="typing">{config.name} is thinking...</p></div>}
        <div ref={chatEndRef} />
      </div>
      {toolId === "factory" && (tokenImagePreview || bannerImagePreview) && (
        <div style={{ padding: "6px 8px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {tokenImagePreview && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(46,204,113,0.15)", padding: "3px 6px", borderRadius: "4px", border: "1px solid rgba(46,204,113,0.3)" }}>
              <img src={tokenImagePreview} alt="Logo" style={{ width: "32px", height: "32px", borderRadius: "4px", objectFit: "cover" }} />
              <span style={{ fontSize: "7px", color: "#2ECC71" }}>Logo attached</span>
              <button style={{ fontSize: "7px", background: "none", border: "none", color: "#E74C3C", cursor: "pointer" }} onClick={() => { setTokenImage(null); setTokenImagePreview(null) }}>x</button>
            </div>
          )}
          {bannerImagePreview && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(46,204,113,0.15)", padding: "3px 6px", borderRadius: "4px", border: "1px solid rgba(46,204,113,0.3)" }}>
              <img src={bannerImagePreview} alt="Banner" style={{ width: "48px", height: "28px", borderRadius: "4px", objectFit: "cover" }} />
              <span style={{ fontSize: "7px", color: "#2ECC71" }}>Banner attached</span>
              <button style={{ fontSize: "7px", background: "none", border: "none", color: "#E74C3C", cursor: "pointer" }} onClick={() => { setBannerImage(null); setBannerImagePreview(null) }}>x</button>
            </div>
          )}
        </div>
      )}
      <div className="chat-input-row">
        <input
          type="text"
          className="pixel-input chat-input"
          placeholder={config.placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />
        {toolId === "factory" && (
          <>
            <input type="file" accept="image/*" ref={imageInputRef} style={{ display: "none" }} onChange={(e) => handleImageUpload(e, "logo")} />
            <input type="file" accept="image/*" ref={bannerInputRef} style={{ display: "none" }} onChange={(e) => handleImageUpload(e, "banner")} />
            <button className="action-btn" style={{ fontSize: "7px", padding: "4px 6px" }} onClick={() => imageInputRef.current?.click()} title="Upload token logo">
              IMG
            </button>
            <button className="action-btn" style={{ fontSize: "7px", padding: "4px 6px" }} onClick={() => bannerInputRef.current?.click()} title="Upload banner image">
              HDR
            </button>
          </>
        )}
        <button className="action-btn primary send-btn" style={{ background: color }} onClick={() => sendMessage()} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  )
}


function AppWindow({ app, onClose, walletConnected, walletAddress, connectWallet, messages, setMessages, onSignTransaction }) {
  return (
    <div className="app-window" style={{ "--app-color": app.color }}>
      <div className="window-titlebar">
        <div className="titlebar-left">
          <div className="window-dot red" onClick={onClose} />
          <div className="window-dot yellow" />
          <div className="window-dot green" />
        </div>
        <span className="window-title">{app.name} — {app.tagline}</span>
        <div className="titlebar-right" />
      </div>

      <div className="window-body">
        <AgentChat toolId={app.id} color={app.color} walletConnected={walletConnected} walletAddress={walletAddress} connectWallet={connectWallet} messages={messages} setMessages={setMessages} onSignTransaction={onSignTransaction} />
      </div>
    </div>
  )
}

function FloatingPlatform({ x, y, width, children }) {
  return (
    <div className="floating-platform" style={{ left: `${x}%`, top: `${y}%`, width: `${width}px` }}>
      {children}
    </div>
  )
}

export default function UtilityDashboard() {
  const navigate = useNavigate()
  const [activeApp, setActiveApp] = useState(null)
  const [chatStates, setChatStates] = useState({
    warp: [],
    lobster: [],
    chat: [],
    trading: [],
    factory: [],
  })
  const setChatMessages = (toolId) => (updater) => {
    setChatStates(prev => ({
      ...prev,
      [toolId]: typeof updater === "function" ? updater(prev[toolId]) : updater,
    }))
  }
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [walletBalance, setWalletBalance] = useState("")
  const [walletError, setWalletError] = useState("")
  const [booting, setBooting] = useState(true)
  const [bootText, setBootText] = useState("")
  const [serviceStatus, setServiceStatus] = useState(null)

  const solConnection = useRef(new Connection("https://api.mainnet-beta.solana.com", "confirmed"))
  const phantomRef = useRef(null)

  useEffect(() => {
    const isInIframe = window.self !== window.top
    const hasExtension = window.phantom?.solana || window.solana?.isPhantom || window.solflare?.isSolflare
    if (!hasExtension) {
      try {
        const ph = createPhantom({
          position: Position.bottomRight,
          hideLauncherBeforeOnboarded: false,
          zIndex: 10000,
        })
        phantomRef.current = ph
      } catch (e) {
        console.log("Phantom embedded init error:", e)
      }
    }
  }, [])

  const getSolanaProvider = useCallback(() => {
    if (window.phantom?.solana) return window.phantom.solana
    if (window.solana?.isPhantom) return window.solana
    if (window.solflare?.isSolflare) return window.solflare
    return null
  }, [])

  const waitForProvider = useCallback(async (maxWait = 3000) => {
    const start = Date.now()
    while (Date.now() - start < maxWait) {
      const p = getSolanaProvider()
      if (p) return p
      await new Promise(r => setTimeout(r, 200))
    }
    return null
  }, [getSolanaProvider])

  const connectWallet = async () => {
    setWalletError("")
    if (walletConnected) {
      const provider = getSolanaProvider()
      if (provider) try { await provider.disconnect() } catch {}
      setWalletConnected(false)
      setWalletAddress("")
      setWalletBalance("")
      return
    }
    let provider = getSolanaProvider()
    if (!provider) {
      setWalletError("Looking for wallet...")
      if (phantomRef.current) {
        try { phantomRef.current.show() } catch {}
      }
      provider = await waitForProvider(4000)
    }
    if (!provider) {
      const isInIframe = window.self !== window.top
      if (isInIframe) {
        setWalletError("Open this page in a new browser tab to connect your wallet, or install the Phantom browser extension.")
      } else {
        setWalletError("No Solana wallet found. Please install Phantom (phantom.app) or Solflare.")
      }
      setTimeout(() => setWalletError(""), 8000)
      return
    }
    try {
      const resp = await provider.connect()
      const pubkey = resp.publicKey.toString()
      setWalletAddress(pubkey)
      setWalletConnected(true)
      setWalletError("")
      try {
        const bal = await solConnection.current.getBalance(resp.publicKey)
        setWalletBalance((bal / 1e9).toFixed(4))
      } catch {}
      provider.on("disconnect", () => {
        setWalletConnected(false)
        setWalletAddress("")
        setWalletBalance("")
      })
    } catch (err) {
      setWalletError(err.code === 4001 ? "Connection rejected by user" : "Failed to connect wallet. Try refreshing the page.")
      setTimeout(() => setWalletError(""), 5000)
    }
  }

  const handleSignTransaction = async (action, setMsgs) => {
    const provider = getSolanaProvider()
    if (!provider || !walletConnected) {
      setMsgs(prev => [...prev, { role: "assistant", text: "Please connect your Solana wallet first to sign the transaction.", agent: "Mint Agent", time: new Date() }])
      return
    }
    try {
      setMsgs(prev => [...prev, { role: "assistant", text: "Waiting for wallet approval...", agent: "Mint Agent", time: new Date() }])
      const txBytes = Uint8Array.from(atob(action.transaction), c => c.charCodeAt(0))
      const tx = VersionedTransaction.deserialize(txBytes)
      const signed = await provider.signTransaction(tx)
      const signature = await solConnection.current.sendRawTransaction(signed.serialize(), { skipPreflight: false, preflightCommitment: "confirmed" })
      await solConnection.current.confirmTransaction(signature, "confirmed")

      const tradeUrl = `https://pump.fun/coin/${action.mintPublicKey}`
      const explorerUrl = `https://solscan.io/tx/${signature}`

      fetch(API("/api/token/confirm"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: action.name, symbol: action.symbol, mintAddress: action.mintPublicKey, txSignature: signature, walletAddress, bannerImage: action.bannerImage || "" }),
      }).catch(() => {})

      setMsgs(prev => [...prev, {
        role: "assistant",
        text: `${action.name} ($${action.symbol}) launched successfully on Solana!`,
        agent: "Mint Agent",
        time: new Date(),
        actions: [{
          type: "token_launched",
          token: { name: action.name, symbol: action.symbol, mintAddress: action.mintPublicKey, tradeUrl, explorerUrl },
        }],
      }])
    } catch (err) {
      const errMsg = err.message?.includes("reject") ? "Transaction rejected." : `Launch failed: ${err.message || "Unknown error"}`
      setMsgs(prev => [...prev, { role: "assistant", text: errMsg, agent: "Mint Agent", time: new Date() }])
    }
  }

  useEffect(() => {
    fetch(API("/api/status")).then(r => r.json()).then(setServiceStatus).catch(() => {})
  }, [])

  useEffect(() => {
    const lines = [
      "MARIO OS v1.0",
      "Loading world data...",
      "Initializing pipe network...",
      "Connecting agent grid...",
      "x402 protocol ready.",
      "Welcome, Player 1.",
    ]
    let lineIdx = 0
    let charIdx = 0
    let current = ""

    const interval = setInterval(() => {
      if (lineIdx >= lines.length) {
        setTimeout(() => setBooting(false), 600)
        clearInterval(interval)
        return
      }

      if (charIdx < lines[lineIdx].length) {
        current += lines[lineIdx][charIdx]
        setBootText(current)
        charIdx++
      } else {
        current += "\n"
        setBootText(current)
        lineIdx++
        charIdx = 0
      }
    }, 35)

    return () => clearInterval(interval)
  }, [])

  if (booting) {
    return (
      <div className="boot-screen">
        <pre className="boot-text">{bootText}<span className="cursor-blink">_</span></pre>
      </div>
    )
  }

  const openApp = APPS.find((a) => a.id === activeApp && a.id === "lobster")

  return (
    <div className="mario-os">
      <div className="os-sky" />

      <div className="cloud cloud-1" />
      <div className="cloud cloud-2" />
      <div className="cloud cloud-3" />

      <FloatingPlatform x={8} y={15} width={180}>
        <div className="platform-label">It's-a me!</div>
      </FloatingPlatform>
      <FloatingPlatform x={35} y={25} width={160}>
        <div className="platform-label">Let's-a go!</div>
      </FloatingPlatform>
      <FloatingPlatform x={65} y={18} width={140}>
        <div className="platform-label">Mamma mia!</div>
      </FloatingPlatform>
      <FloatingPlatform x={85} y={30} width={120}>
        <div className="platform-label">Wahoo!</div>
      </FloatingPlatform>

      <div className="os-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/")} title="Back to Mario World">
            {"\u{1F30D}"} World
          </button>
          <span className="os-logo">{"\u{1F344}"}</span>
          <span className="os-title">MARIO OS</span>
        </div>
        <div className="header-right">
          {serviceStatus && (
            <div className="service-dots">
              {Object.entries(serviceStatus.services || {}).map(([k, v]) => (
                <span key={k} className={`svc-dot ${v.status === "active" ? "on" : "off"}`} title={`${k}: ${v.status}`} />
              ))}
            </div>
          )}
          <button
            className={`wallet-btn ${walletConnected ? "connected" : ""}`}
            onClick={connectWallet}
            title={walletConnected ? `${walletAddress}\nClick to disconnect` : "Connect Phantom or Solflare wallet"}
          >
            {walletConnected
              ? `\u{1F7E2} ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
              : "\u{1F50C} Connect Wallet"
            }
          </button>
          {walletError && <span className="wallet-error">{walletError}</span>}
          <div className="coin-counter">
            <span className="coin-sprite">{"\u{1FA99}"}</span>
            <span>{walletConnected ? `${walletBalance} SOL` : "---"}</span>
          </div>
        </div>
      </div>

      <div className="os-desktop">
        {openApp && (
          <AppWindow app={openApp} onClose={() => setActiveApp(null)} walletConnected={walletConnected} walletAddress={walletAddress} connectWallet={connectWallet} messages={chatStates[openApp.id]} setMessages={setChatMessages(openApp.id)} onSignTransaction={handleSignTransaction} />
        )}

        {!openApp && (
          <div className="desktop-welcome">
            <h2>Select an app from the taskbar below</h2>
            <p>Click a pipe, block, or castle to get started</p>
            <div className="welcome-icons">
              {APPS.map((app) => {
                const isLive = app.id === "lobster"
                return (
                <div
                  key={app.id}
                  className={`welcome-card${!isLive ? ' coming-soon' : ''}`}
                  onClick={() => isLive && setActiveApp(app.id)}
                  style={{ borderColor: app.color }}
                >
                  {!isLive && <div className="coming-soon-badge">COMING SOON</div>}
                  <div className={`icon-block icon-${app.icon} large`}>
                    {app.icon === "pipe" && <PipeIcon />}
                    {app.icon === "qblock" && <QBlockIcon />}
                    {app.icon === "brick" && <BrickIcon />}
                    {app.icon === "star" && <StarIcon />}
                    {app.icon === "castle" && <CastleIcon />}
                  </div>
                  <h3>{app.name}</h3>
                  <p>{app.tagline}</p>
                </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="taskbar">
        <div className="taskbar-start">
          <button className="start-btn">
            <span>{"\u{2B50}"}</span> START
          </button>
        </div>
        <div className="taskbar-apps">
          {APPS.map((app) => {
            const isLive = app.id === "lobster"
            return (
            <TaskbarIcon
              key={app.id}
              app={app}
              isActive={activeApp === app.id}
              onClick={() => isLive ? setActiveApp(activeApp === app.id ? null : app.id) : null}
              comingSoon={!isLive}
            />
            )
          })}
        </div>
        <div className="taskbar-tray">
          <span className="tray-time">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </div>
  )
}
