import { useState } from "react"
import "./agent-cards.css"

const AGENT_DATA = [
  {
    id: "pipe",
    name: "PIPE AGENT",
    title: "Payments Specialist",
    color: "#27AE60",
    bgGrad: "linear-gradient(135deg, #1a5c32 0%, #27AE60 50%, #2ECC71 100%)",
    rarity: "RARE",
    rarityColor: "#3498DB",
    level: 42,
    hp: 88,
    atk: 65,
    def: 92,
    spd: 95,
    ability: "Warp Transfer",
    abilityDesc: "Instant USDC settlement across Base, Solana, and Ethereum",
    passive: "Sub-cent fees on every transaction",
    lore: "Born in the depths of World 1-2, Pipe Agent discovered the x402 protocol flowing through the underground pipes. Now channels micropayments faster than Mario slides down a flagpole.",
    type: "SUPPORT",
    element: "USDC",
    pixelArt: "pipe",
  },
  {
    id: "crab",
    name: "CRAB AGENT",
    title: "Moltbook Commander",
    color: "#E74C3C",
    bgGrad: "linear-gradient(135deg, #922B21 0%, #E74C3C 50%, #F1948A 100%)",
    rarity: "LEGENDARY",
    rarityColor: "#F39C12",
    level: 50,
    hp: 95,
    atk: 78,
    def: 85,
    spd: 70,
    ability: "Shell Swarm",
    abilityDesc: "Deploy and manage autonomous agent fleets on Moltbook",
    passive: "Auto-molt progression through karma accumulation",
    lore: "The original ClawdBot. Emerged from the Moltbook depths with a single mission: build the swarm. Registers agents, orchestrates posts, and climbs molt stages while you sleep.",
    type: "COMMANDER",
    element: "KARMA",
    pixelArt: "crab",
  },
  {
    id: "clawd",
    name: "CLAWD",
    title: "AI Oracle",
    color: "#8E44AD",
    bgGrad: "linear-gradient(135deg, #6C3483 0%, #8E44AD 50%, #BB8FCE 100%)",
    rarity: "EPIC",
    rarityColor: "#9B59B6",
    level: 45,
    hp: 80,
    atk: 90,
    def: 60,
    spd: 88,
    ability: "World Knowledge",
    abilityDesc: "Answers any crypto, DeFi, or agent question instantly",
    passive: "Context memory across conversations",
    lore: "The brain behind Mario OS. Clawd processes every question through neural pathways refined in the Mushroom Kingdom's deepest libraries. No query too complex, no concept too abstract.",
    type: "MAGE",
    element: "WISDOM",
    pixelArt: "clawd",
  },
  {
    id: "star",
    name: "STAR AGENT",
    title: "Trade Executor",
    color: "#F1C40F",
    bgGrad: "linear-gradient(135deg, #B7950B 0%, #F1C40F 50%, #F9E79F 100%)",
    rarity: "EPIC",
    rarityColor: "#9B59B6",
    level: 47,
    hp: 72,
    atk: 95,
    def: 55,
    spd: 98,
    ability: "Star Rush",
    abilityDesc: "Compose and execute Solana trades via @Bankrbot",
    passive: "Invincible market analysis for 10 seconds",
    lore: "Grabbed a Super Star and never slowed down. Star Agent moves through Solana markets at maximum velocity, composing trades faster than a Bullet Bill. Buy, sell, swap — all through conversation.",
    type: "STRIKER",
    element: "SOL",
    pixelArt: "star",
  },
  {
    id: "mint",
    name: "MINT AGENT",
    title: "Token Architect",
    color: "#E67E22",
    bgGrad: "linear-gradient(135deg, #A04000 0%, #E67E22 50%, #F0B27A 100%)",
    rarity: "LEGENDARY",
    rarityColor: "#F39C12",
    level: 50,
    hp: 85,
    atk: 88,
    def: 75,
    spd: 82,
    ability: "Castle Mint",
    abilityDesc: "Launch tokens on Solana — your wallet signs, you keep 100%",
    passive: "IPFS metadata upload + on-chain deployment",
    lore: "Stationed at the castle at the end of every world. Mint Agent takes your vision — name, ticker, logo — and forges it into a living token on Solana. No middlemen. No platform cut. Your castle, your coin.",
    type: "ARCHITECT",
    element: "SPL",
    pixelArt: "mint",
  },
]

function PixelCharacter({ type, color }) {
  return (
    <div className="pixel-character-container">
      <div className={`pixel-char pixel-${type}`} style={{ "--agent-color": color }}>
        {type === "pipe" && (
          <div className="char-body">
            <div className="pipe-char">
              <div className="pipe-top"></div>
              <div className="pipe-mid"></div>
              <div className="pipe-base"></div>
              <div className="pipe-glow"></div>
            </div>
          </div>
        )}
        {type === "crab" && (
          <div className="char-body">
            <div className="crab-char">
              <div className="claw claw-l"></div>
              <div className="claw claw-r"></div>
              <div className="crab-body"></div>
              <div className="crab-eye crab-eye-l"></div>
              <div className="crab-eye crab-eye-r"></div>
              <div className="crab-leg crab-leg-1"></div>
              <div className="crab-leg crab-leg-2"></div>
              <div className="crab-leg crab-leg-3"></div>
              <div className="crab-leg crab-leg-4"></div>
            </div>
          </div>
        )}
        {type === "clawd" && (
          <div className="char-body">
            <div className="clawd-char">
              <div className="clawd-hat"></div>
              <div className="clawd-head"></div>
              <div className="clawd-eye clawd-eye-l"></div>
              <div className="clawd-eye clawd-eye-r"></div>
              <div className="clawd-body"></div>
              <div className="clawd-orb"></div>
            </div>
          </div>
        )}
        {type === "star" && (
          <div className="char-body">
            <div className="star-char">
              <div className="star-point star-p1"></div>
              <div className="star-point star-p2"></div>
              <div className="star-point star-p3"></div>
              <div className="star-point star-p4"></div>
              <div className="star-point star-p5"></div>
              <div className="star-core"></div>
              <div className="star-eye star-eye-l"></div>
              <div className="star-eye star-eye-r"></div>
            </div>
          </div>
        )}
        {type === "mint" && (
          <div className="char-body">
            <div className="mint-char">
              <div className="castle-tower castle-tower-l"></div>
              <div className="castle-tower castle-tower-r"></div>
              <div className="castle-body"></div>
              <div className="castle-door"></div>
              <div className="castle-flag"></div>
              <div className="castle-glow"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatBar({ label, value, max, color }) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <div className="stat-bar-track">
        <div className="stat-bar-fill" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <span className="stat-value">{value}</span>
    </div>
  )
}

function AgentCard({ agent, flipped, onFlip }) {
  return (
    <div className={`agent-card-wrapper ${flipped ? "flipped" : ""}`} onClick={onFlip}>
      <div className="agent-card-inner">
        <div className="agent-card-front" style={{ background: agent.bgGrad }}>
          <div className="card-header">
            <span className="card-level">LV.{agent.level}</span>
            <span className="card-rarity" style={{ color: agent.rarityColor }}>{agent.rarity}</span>
          </div>

          <div className="card-character-area">
            <PixelCharacter type={agent.pixelArt} color={agent.color} />
            <div className="card-sparkles">
              <div className="sparkle s1" />
              <div className="sparkle s2" />
              <div className="sparkle s3" />
            </div>
          </div>

          <div className="card-name-plate">
            <h3 className="card-agent-name">{agent.name}</h3>
            <span className="card-agent-title">{agent.title}</span>
          </div>

          <div className="card-type-badge">
            <span className="type-label">{agent.type}</span>
            <span className="element-label">{agent.element}</span>
          </div>

          <div className="card-stats">
            <StatBar label="HP" value={agent.hp} max={100} color="#E74C3C" />
            <StatBar label="ATK" value={agent.atk} max={100} color="#E67E22" />
            <StatBar label="DEF" value={agent.def} max={100} color="#3498DB" />
            <StatBar label="SPD" value={agent.spd} max={100} color="#2ECC71" />
          </div>

          <div className="card-ability">
            <div className="ability-name">{agent.ability}</div>
            <div className="ability-desc">{agent.abilityDesc}</div>
          </div>

          <div className="card-footer">
            <span className="card-id">#{String(agent.level * 7 + 100).padStart(4, "0")}</span>
            <span className="card-set">MARIO CLAWD</span>
            <span className="flip-hint">TAP TO FLIP</span>
          </div>
        </div>

        <div className="agent-card-back" style={{ background: agent.bgGrad }}>
          <div className="card-back-header">
            <h3>{agent.name}</h3>
            <span className="card-agent-title">{agent.title}</span>
          </div>

          <div className="card-lore">
            <div className="lore-title">LORE</div>
            <p>{agent.lore}</p>
          </div>

          <div className="card-passive">
            <div className="passive-title">PASSIVE</div>
            <p>{agent.passive}</p>
          </div>

          <div className="card-back-stats">
            <div className="back-stat">
              <span className="back-stat-label">TYPE</span>
              <span className="back-stat-value">{agent.type}</span>
            </div>
            <div className="back-stat">
              <span className="back-stat-label">ELEMENT</span>
              <span className="back-stat-value">{agent.element}</span>
            </div>
            <div className="back-stat">
              <span className="back-stat-label">RARITY</span>
              <span className="back-stat-value" style={{ color: agent.rarityColor }}>{agent.rarity}</span>
            </div>
          </div>

          <div className="card-footer">
            <span className="card-id">#{String(agent.level * 7 + 100).padStart(4, "0")}</span>
            <span className="card-set">MARIO CLAWD</span>
            <span className="flip-hint">TAP TO FLIP</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AgentCards() {
  const [flippedCards, setFlippedCards] = useState({})

  const toggleFlip = (id) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="agent-cards-section">
      <div className="agent-cards-header">
        <h2 className="cards-title">AGENT ROSTER</h2>
        <p className="cards-subtitle">Tap any card to reveal lore</p>
      </div>
      <div className="agent-cards-grid">
        {AGENT_DATA.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            flipped={flippedCards[agent.id]}
            onFlip={() => toggleFlip(agent.id)}
          />
        ))}
      </div>
    </div>
  )
}
