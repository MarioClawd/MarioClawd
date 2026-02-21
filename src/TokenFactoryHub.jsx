import { useState, useEffect, useRef } from "react"

const API = (path) => path

const WEEKLY_EVENT = {
  title: "MARIO CLAWD",
  subtitle: "Weekly Launch Event 2026",
  description: "Launch your token this week. Top creator gets featured on the homepage + retweet from @marioclawdd",
  endsIn: "3d 14h",
  prize: "Featured Spot + RT",
  entries: 0,
  season: "Season 1",
  week: "Week 1",
}

const STAT_LABELS = [
  { key: "totalLaunches", label: "TOKENS LAUNCHED", icon: "\u{1F680}" },
  { key: "totalCreators", label: "CREATORS", icon: "\u{1F451}" },
  { key: "launchesToday", label: "LAUNCHED TODAY", icon: "\u{1F525}" },
  { key: "totalVolume", label: "TOTAL VOLUME", icon: "\u{1FA99}" },
]

function timeSince(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function truncateAddr(addr) {
  if (!addr) return "Anon"
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
}

export default function TokenFactoryHub({ onOpenMintAgent, walletAddress }) {
  const [activeTab, setActiveTab] = useState("discover")
  const [launches, setLaunches] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [stats, setStats] = useState({ totalLaunches: 0, totalCreators: 0, launchesToday: 0, totalVolume: "0 SOL" })
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef(null)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [launchRes, statsRes] = await Promise.all([
        fetch(API("/api/token/launches")).then(r => r.json()).catch(() => ({ launches: [] })),
        fetch(API("/api/token/stats")).then(r => r.json()).catch(() => ({})),
      ])
      const launchList = Array.isArray(launchRes) ? launchRes : launchRes.launches || []
      setLaunches(launchList)
      setStats(statsRes.stats || { totalLaunches: launchList.length, totalCreators: new Set(launchList.map(l => l.walletAddress)).size, launchesToday: launchList.filter(l => new Date(l.timestamp) > new Date(Date.now() - 86400000)).length, totalVolume: `${launchList.length * 0.02} SOL` })
      setLeaderboard(statsRes.leaderboard || buildLeaderboard(launchList))
      setFeatured(statsRes.featured || launchList.slice(0, 3))
    } catch {}
    setLoading(false)
  }

  const buildLeaderboard = (list) => {
    const creators = {}
    list.forEach(l => {
      const addr = l.walletAddress || "Anon"
      if (!creators[addr]) creators[addr] = { address: addr, launches: 0, tokens: [] }
      creators[addr].launches++
      creators[addr].tokens.push(l.symbol || l.name)
    })
    return Object.values(creators).sort((a, b) => b.launches - a.launches).slice(0, 10)
  }

  return (
    <div className="tf-hub">
      <div className="tf-hero">
        <div className="tf-hero-bg">
          <div className="tf-hero-particles">
            {[...Array(12)].map((_, i) => <div key={i} className={`tf-particle tf-p-${i}`} />)}
          </div>
        </div>
        <div className="tf-hero-content">
          <div className="tf-hero-badge">{WEEKLY_EVENT.season} {"\u2022"} {WEEKLY_EVENT.week}</div>
          <h1 className="tf-hero-title">{WEEKLY_EVENT.title}</h1>
          <p className="tf-hero-subtitle">{WEEKLY_EVENT.subtitle}</p>
          <p className="tf-hero-desc">{WEEKLY_EVENT.description}</p>
          <div className="tf-hero-meta">
            <div className="tf-hero-stat">
              <span className="tf-hero-stat-icon">{"\u{23F3}"}</span>
              <span>{WEEKLY_EVENT.endsIn}</span>
            </div>
            <div className="tf-hero-stat">
              <span className="tf-hero-stat-icon">{"\u{1F3C6}"}</span>
              <span>{WEEKLY_EVENT.prize}</span>
            </div>
            <div className="tf-hero-stat">
              <span className="tf-hero-stat-icon">{"\u{1F680}"}</span>
              <span>{stats.totalLaunches} Entries</span>
            </div>
          </div>
          <button className="tf-launch-btn" onClick={onOpenMintAgent}>
            <span className="tf-launch-btn-icon">{"\u{1F3ED}"}</span>
            LAUNCH A TOKEN
          </button>
        </div>
      </div>

      <div className="tf-stats-bar">
        {STAT_LABELS.map(s => (
          <div key={s.key} className="tf-stat-card">
            <span className="tf-stat-icon">{s.icon}</span>
            <div className="tf-stat-info">
              <span className="tf-stat-value">{stats[s.key] || 0}</span>
              <span className="tf-stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="tf-nav">
        {[
          { id: "discover", label: "Discovery Board", icon: "\u{1F30D}" },
          { id: "leaderboard", label: "Leaderboard", icon: "\u{1F451}" },
          { id: "highlights", label: "Weekly Highlights", icon: "\u{2B50}" },
        ].map(tab => (
          <button
            key={tab.id}
            className={`tf-nav-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      <div className="tf-content" ref={scrollRef}>
        {activeTab === "discover" && (
          <div className="tf-discover">
            {launches.length === 0 ? (
              <div className="tf-empty">
                <div className="tf-empty-icon">{"\u{1F3ED}"}</div>
                <h3>No tokens launched yet</h3>
                <p>Be the first creator. Launch a token and claim the top spot on the leaderboard.</p>
                <button className="tf-launch-btn small" onClick={onOpenMintAgent}>
                  LAUNCH FIRST TOKEN
                </button>
              </div>
            ) : (
              <div className="tf-token-grid">
                {launches.map((token, i) => (
                  <div key={i} className="tf-token-card">
                    <div className="tf-token-rank">#{i + 1}</div>
                    <div className="tf-token-header">
                      <div className="tf-token-avatar">
                        {token.name ? token.name[0].toUpperCase() : "?"}
                      </div>
                      <div className="tf-token-title">
                        <span className="tf-token-name">{token.name || "Unknown"}</span>
                        <span className="tf-token-symbol">${token.symbol || "???"}</span>
                      </div>
                    </div>
                    <div className="tf-token-meta">
                      <span className="tf-token-creator">{"\u{1F464}"} {truncateAddr(token.walletAddress)}</span>
                      <span className="tf-token-time">{"\u{1F552}"} {timeSince(token.timestamp)}</span>
                    </div>
                    {token.description && <p className="tf-token-desc">{token.description}</p>}
                    <div className="tf-token-actions">
                      {token.mintAddress && (
                        <>
                          <a href={`https://pump.fun/coin/${token.mintAddress}`} target="_blank" rel="noopener noreferrer" className="tf-token-btn trade">Trade</a>
                          <a href={`https://solscan.io/token/${token.mintAddress}`} target="_blank" rel="noopener noreferrer" className="tf-token-btn explore">Solscan</a>
                          <button className="tf-token-btn copy" onClick={() => navigator.clipboard.writeText(token.mintAddress)}>Copy CA</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="tf-leaderboard">
            <div className="tf-lb-header">
              <h3>{"\u{1F451}"} Creator Leaderboard</h3>
              <p>Top creators ranked by total token launches</p>
            </div>
            {leaderboard.length === 0 ? (
              <div className="tf-empty">
                <div className="tf-empty-icon">{"\u{1F3C6}"}</div>
                <h3>Leaderboard is empty</h3>
                <p>Launch the first token to claim the #1 spot.</p>
                <button className="tf-launch-btn small" onClick={onOpenMintAgent}>
                  CLAIM #1 SPOT
                </button>
              </div>
            ) : (
              <div className="tf-lb-list">
                {leaderboard.map((creator, i) => (
                  <div key={i} className={`tf-lb-row ${i < 3 ? `tf-lb-top-${i + 1}` : ""}`}>
                    <div className="tf-lb-rank">
                      {i === 0 ? "\u{1F947}" : i === 1 ? "\u{1F948}" : i === 2 ? "\u{1F949}" : `#${i + 1}`}
                    </div>
                    <div className="tf-lb-avatar">
                      {creator.address ? creator.address.slice(0, 2).toUpperCase() : "??"}
                    </div>
                    <div className="tf-lb-info">
                      <span className="tf-lb-addr">{truncateAddr(creator.address)}</span>
                      <span className="tf-lb-tokens">{creator.tokens.map(t => `$${t}`).join(", ")}</span>
                    </div>
                    <div className="tf-lb-score">
                      <span className="tf-lb-count">{creator.launches}</span>
                      <span className="tf-lb-label">launches</span>
                    </div>
                    {i < 3 && <div className="tf-lb-crown">{["\u{1F525}", "\u{26A1}", "\u{2B50}"][i]}</div>}
                  </div>
                ))}
              </div>
            )}
            <div className="tf-lb-cta">
              <p>Launch tokens to climb the ranks</p>
              <button className="tf-launch-btn small" onClick={onOpenMintAgent}>LAUNCH TOKEN</button>
            </div>
          </div>
        )}

        {activeTab === "highlights" && (
          <div className="tf-highlights">
            <div className="tf-hl-header">
              <h3>{"\u{2B50}"} Weekly Highlights</h3>
              <p>Featured launches and top performers this week</p>
            </div>
            {featured.length === 0 ? (
              <div className="tf-empty">
                <div className="tf-empty-icon">{"\u{2B50}"}</div>
                <h3>No highlights yet</h3>
                <p>The first tokens launched this week will be featured here.</p>
                <button className="tf-launch-btn small" onClick={onOpenMintAgent}>
                  GET FEATURED
                </button>
              </div>
            ) : (
              <div className="tf-hl-grid">
                {featured.map((token, i) => (
                  <div key={i} className={`tf-hl-card ${i === 0 ? "tf-hl-featured" : ""}`}>
                    {i === 0 && <div className="tf-hl-badge">{"\u{2B50}"} FEATURED</div>}
                    <div className="tf-hl-avatar-lg">
                      {token.name ? token.name[0].toUpperCase() : "?"}
                    </div>
                    <h4 className="tf-hl-name">{token.name || "Unknown"}</h4>
                    <span className="tf-hl-symbol">${token.symbol || "???"}</span>
                    <p className="tf-hl-desc">{token.description || "A new token on Solana"}</p>
                    <div className="tf-hl-creator">
                      <span>Created by</span>
                      <span className="tf-hl-addr">{truncateAddr(token.walletAddress)}</span>
                    </div>
                    <div className="tf-hl-actions">
                      {token.mintAddress && (
                        <>
                          <a href={`https://pump.fun/coin/${token.mintAddress}`} target="_blank" rel="noopener noreferrer" className="tf-token-btn trade">Trade</a>
                          <button className="tf-token-btn copy" onClick={() => navigator.clipboard.writeText(token.mintAddress)}>Copy CA</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="tf-hl-cta">
              <div className="tf-hl-cta-box">
                <h4>Want to get featured?</h4>
                <p>Launch a token this week for a chance to be highlighted. Top creators get a retweet from @marioclawdd and a permanent featured spot.</p>
                <button className="tf-launch-btn small" onClick={onOpenMintAgent}>LAUNCH NOW</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="tf-footer">
        <div className="tf-footer-left">
          <span>{"\u{1F3ED}"} Token Factory</span>
          <span className="tf-footer-sep">|</span>
          <span>Powered by PumpPortal</span>
        </div>
        <div className="tf-footer-right">
          <span>100% creator fees</span>
          <span className="tf-footer-sep">|</span>
          <span>Your wallet, your launch</span>
        </div>
      </div>
    </div>
  )
}
