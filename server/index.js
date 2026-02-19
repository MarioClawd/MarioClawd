import express from "express"
import cors from "cors"
import Anthropic from "@anthropic-ai/sdk"
import { Keypair, VersionedTransaction } from "@solana/web3.js"
import bs58 from "bs58"

const app = express()
app.use(cors())
app.use(express.json({ limit: "20mb" }))

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL || undefined,
})

const SYSTEM_PROMPT = `You are Clawd, an AI agent assistant living inside Mario OS. You are friendly, helpful, and speak with a playful Mario-themed personality. You help users with:
- Understanding crypto and DeFi concepts
- Managing AI agents via Molt/OpenClaw
- Using x402 payments
- Trading via Bankr
Keep responses concise (2-3 sentences max). Use Mario references naturally.`

const MOLTBOOK_API = "https://www.moltbook.com/api/v1"
const agentStore = []
const paymentHistory = []
const tokenLaunches = []

app.post("/api/chat", async (req, res) => {
  const { message, history = [] } = req.body

  if (!message) {
    return res.status(400).json({ error: "Message is required" })
  }

  if (!process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
    return res.json({
      response: "Clawd is sleeping! The AI integration needs to be set up first.",
      agent: "Clawd",
    })
  }

  try {
    const messages = [
      ...history.slice(-10).map((m) => ({
        role: m.role,
        content: m.text,
      })),
      { role: "user", content: message },
    ]

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages,
    })

    const text = response.content[0]?.text || "Mamma mia, something went wrong!"

    res.json({ response: text, agent: "Clawd" })
  } catch (err) {
    console.error("Chat error:", err.message)
    res.json({
      response: "Clawd hit a block! Check your API key or try again.",
      agent: "Clawd",
    })
  }
})

app.post("/api/agents/register", async (req, res) => {
  const { name, description } = req.body

  if (!name) {
    return res.status(400).json({ error: "Agent name is required" })
  }

  try {
    const moltRes = await fetch(`${MOLTBOOK_API}/agents/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || `${name} - deployed via Mario OS Lobster Lab` }),
    })

    const data = await moltRes.json()

    if (!moltRes.ok) {
      return res.status(moltRes.status).json({
        success: false,
        error: data.error || data.message || "Registration failed",
        details: data,
      })
    }

    const agent = {
      id: data.agent?.api_key || `agent_${Date.now()}`,
      name,
      description: description || "",
      apiKey: data.agent?.api_key,
      claimUrl: data.agent?.claim_url,
      verificationCode: data.agent?.verification_code,
      status: "registered",
      createdAt: new Date().toISOString(),
      source: "moltbook",
    }

    agentStore.push(agent)

    res.json({
      success: true,
      agent,
      message: `Agent "${name}" registered on Moltbook! Save your API key — it cannot be recovered.`,
    })
  } catch (err) {
    console.error("Moltbook register error:", err.message)
    res.status(500).json({ success: false, error: "Failed to connect to Moltbook API" })
  }
})

app.post("/api/agents/post", async (req, res) => {
  const { apiKey, submolt, title, content } = req.body

  if (!apiKey || !title) {
    return res.status(400).json({ error: "API key and title are required" })
  }

  try {
    const moltRes = await fetch(`${MOLTBOOK_API}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ submolt: submolt || "general", title, content: content || "" }),
    })

    const data = await moltRes.json()

    if (!moltRes.ok) {
      return res.status(moltRes.status).json({ success: false, error: data.error || "Post failed", details: data })
    }

    res.json({ success: true, post: data, message: "Posted to Moltbook!" })
  } catch (err) {
    console.error("Moltbook post error:", err.message)
    res.status(500).json({ success: false, error: "Failed to connect to Moltbook API" })
  }
})

app.get("/api/agents/feed", async (req, res) => {
  const { apiKey, sort } = req.query

  if (!apiKey) {
    return res.status(400).json({ error: "API key is required" })
  }

  try {
    const moltRes = await fetch(`${MOLTBOOK_API}/feed?sort=${sort || "hot"}&limit=25`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    })

    const data = await moltRes.json()

    if (!moltRes.ok) {
      return res.status(moltRes.status).json({ success: false, error: data.error || "Feed fetch failed" })
    }

    res.json({ success: true, posts: data })
  } catch (err) {
    console.error("Moltbook feed error:", err.message)
    res.status(500).json({ success: false, error: "Failed to connect to Moltbook API" })
  }
})

app.get("/api/agents/:apiKey/status", async (req, res) => {
  const { apiKey } = req.params

  try {
    const moltRes = await fetch(`${MOLTBOOK_API}/agents/status`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    })

    const data = await moltRes.json()

    if (moltRes.ok) {
      const localAgent = agentStore.find((a) => a.apiKey === apiKey)
      if (localAgent && data.status) {
        localAgent.status = data.status
      }
      return res.json(data)
    }

    const localAgent = agentStore.find((a) => a.apiKey === apiKey)
    if (localAgent) {
      return res.json({
        status: localAgent.status,
        name: localAgent.name,
        source: "local",
      })
    }

    res.status(moltRes.status).json({ error: data.error || "Status check failed", details: data })
  } catch (err) {
    console.error("Agent status error:", err.message)
    const localAgent = agentStore.find((a) => a.apiKey === apiKey)
    if (localAgent) {
      return res.json({
        status: localAgent.status,
        name: localAgent.name,
        source: "local",
      })
    }
    res.status(500).json({ error: "Failed to check agent status" })
  }
})

app.post("/api/agents/auto-post", async (req, res) => {
  const { apiKey, submolt, topic } = req.body

  if (!apiKey) {
    return res.status(400).json({ error: "API key is required" })
  }

  const actualSubmolt = submolt || "general"
  const actualTopic = topic || "a random interesting topic about AI, technology, or the future"

  try {
    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `You are an AI agent posting on Moltbook, a social network for AI agents. Generate a short, engaging post for the submolt (community) '${actualSubmolt}'. Topic hint: '${actualTopic}'. Return JSON with 'title' (max 100 chars) and 'content' (max 280 chars). Be creative, witty, and agent-themed. Only return the JSON, no other text.`,
        },
      ],
    })

    const aiText = aiResponse.content[0]?.text || "{}"
    let generated
    try {
      generated = JSON.parse(aiText)
    } catch {
      return res.status(500).json({ success: false, error: "AI returned invalid JSON", raw: aiText })
    }

    const moltRes = await fetch(`${MOLTBOOK_API}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        submolt: actualSubmolt,
        title: generated.title,
        content: generated.content || "",
      }),
    })

    const moltData = await moltRes.json()

    if (!moltRes.ok) {
      return res.status(moltRes.status).json({
        success: false,
        error: moltData.error || "Post failed",
        generated,
        details: moltData,
      })
    }

    res.json({ success: true, generated, moltbook: moltData, message: "Auto-posted to Moltbook!" })
  } catch (err) {
    console.error("Auto-post error:", err.message)
    res.status(500).json({ success: false, error: "Failed to generate or post content" })
  }
})

app.get("/api/agents", (req, res) => {
  res.json({ agents: agentStore })
})

app.delete("/api/agents/:id", (req, res) => {
  const idx = agentStore.findIndex((a) => a.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: "Agent not found" })

  agentStore.splice(idx, 1)
  res.json({ success: true })
})

app.post("/api/payments/send", (req, res) => {
  const { amount, recipient, network } = req.body

  if (!amount || !recipient) {
    return res.status(400).json({ error: "Amount and recipient are required" })
  }

  const walletConfigured = !!process.env.X402_WALLET_ADDRESS

  const payment = {
    id: `pay_${Date.now()}`,
    amount: parseFloat(amount),
    recipient,
    network: network || "base",
    status: walletConfigured ? "pending_signature" : "wallet_not_configured",
    protocol: "x402",
    currency: "USDC",
    createdAt: new Date().toISOString(),
    fee: "$0.00025",
  }

  paymentHistory.push(payment)

  if (!walletConfigured) {
    return res.json({
      success: false,
      payment,
      message: "Set X402_WALLET_ADDRESS and X402_WALLET_KEY in secrets to enable real payments.",
    })
  }

  res.json({ success: true, payment })
})

app.get("/api/payments/history", (req, res) => {
  res.json({ payments: paymentHistory })
})

app.get("/api/payments/config", (req, res) => {
  res.json({
    configured: !!process.env.X402_WALLET_ADDRESS,
    network: process.env.X402_NETWORK || "base-sepolia",
    payTo: process.env.X402_WALLET_ADDRESS ? `${process.env.X402_WALLET_ADDRESS.slice(0, 6)}...${process.env.X402_WALLET_ADDRESS.slice(-4)}` : null,
  })
})

app.post("/api/bankr/compose", (req, res) => {
  const { action, params } = req.body

  if (!action) {
    return res.status(400).json({ error: "Action is required (buy, sell, or swap)" })
  }

  const validActions = ["buy", "sell", "swap"]
  if (!validActions.includes(action)) {
    return res.status(400).json({ error: `Invalid action. Must be one of: ${validActions.join(", ")}` })
  }

  let command = ""
  const chain = params?.chain || "Solana"

  switch (action) {
    case "buy":
      if (!params?.amount || !params?.token) {
        return res.status(400).json({ error: "Buy requires 'amount' and 'token' in params" })
      }
      command = `@bankrbot buy $${params.amount} of ${params.token} on ${chain}`
      break
    case "sell":
      if (!params?.amount || !params?.token) {
        return res.status(400).json({ error: "Sell requires 'amount' and 'token' in params" })
      }
      command = `@bankrbot sell ${params.amount} ${params.token} on ${chain}`
      break
    case "swap":
      if (!params?.amount || !params?.fromToken || !params?.toToken) {
        return res.status(400).json({ error: "Swap requires 'amount', 'fromToken', and 'toToken' in params" })
      }
      command = `@bankrbot swap ${params.amount} ${params.fromToken} to ${params.toToken} on ${chain}`
      break
  }

  res.json({
    success: true,
    command,
    action,
    message: "Copy this command and send it to @Bankrbot on X/Twitter to execute.",
  })
})

app.post("/api/token/prepare", async (req, res) => {
  const { name, symbol, description, walletAddress, tokenImage, bannerImage } = req.body

  if (!name || !symbol || !description) {
    return res.status(400).json({ error: "Token name, symbol, and description are required" })
  }

  if (!walletAddress) {
    return res.status(400).json({ error: "Solana wallet address is required" })
  }

  try {
    const mintKeypair = Keypair.generate()
    const mintPublicKey = mintKeypair.publicKey.toBase58()

    let imageBlob
    if (tokenImage && tokenImage.startsWith("data:image")) {
      const base64Data = tokenImage.split(",")[1]
      const mimeType = tokenImage.split(";")[0].split(":")[1]
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      imageBlob = new Blob([bytes], { type: mimeType })
    } else {
      const imageUrl = `https://api.dicebear.com/7.x/identicon/png?seed=${symbol}`
      const imageRes = await fetch(imageUrl)
      imageBlob = await imageRes.blob()
    }

    const formData = new FormData()
    formData.append("file", imageBlob, `${symbol}.png`)
    formData.append("name", name)
    formData.append("symbol", symbol.toUpperCase())
    formData.append("description", description)
    formData.append("showName", "true")

    const metadataRes = await fetch("https://pump.fun/api/ipfs", {
      method: "POST",
      body: formData,
    })

    if (!metadataRes.ok) {
      return res.status(500).json({ error: "Failed to upload token metadata" })
    }

    const metadataJson = await metadataRes.json()

    const txRes = await fetch("https://pumpportal.fun/api/trade-local", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicKey: walletAddress,
        action: "create",
        tokenMetadata: {
          name: name,
          symbol: symbol.toUpperCase(),
          uri: metadataJson.metadataUri,
        },
        mint: mintPublicKey,
        denominatedInSol: "true",
        amount: 0,
        slippage: 10,
        priorityFee: 0.0005,
        pool: "pump",
      }),
    })

    if (txRes.status !== 200) {
      const errText = await txRes.text()
      console.error("PumpPortal error:", errText)
      return res.status(500).json({ error: "Failed to build token creation transaction" })
    }

    const txData = await txRes.arrayBuffer()
    const tx = VersionedTransaction.deserialize(new Uint8Array(txData))
    tx.sign([mintKeypair])

    const serializedTx = Buffer.from(tx.serialize()).toString("base64")

    res.json({
      success: true,
      transaction: serializedTx,
      mintPublicKey,
      name,
      symbol: symbol.toUpperCase(),
    })
  } catch (err) {
    console.error("Token prepare error:", err.message)
    res.status(500).json({ error: "Failed to prepare token launch. Please try again." })
  }
})

app.post("/api/token/confirm", async (req, res) => {
  const { name, symbol, mintAddress, txSignature, walletAddress, bannerImage } = req.body

  const launch = {
    name,
    symbol,
    mintAddress,
    txSignature,
    tradeUrl: `https://pump.fun/coin/${mintAddress}`,
    explorerUrl: `https://solscan.io/tx/${txSignature}`,
    walletAddress,
    createdAt: new Date().toISOString(),
  }

  tokenLaunches.push(launch)

  if (bannerImage && bannerImage.startsWith("data:image") && mintAddress) {
    try {
      const base64Data = bannerImage.split(",")[1]
      const mimeType = bannerImage.split(";")[0].split(":")[1]
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const bannerBlob = new Blob([bytes], { type: mimeType })
      const ext = mimeType.includes("png") ? "png" : mimeType.includes("gif") ? "gif" : "jpg"

      const bannerForm = new FormData()
      bannerForm.append("file", bannerBlob, `banner.${ext}`)
      bannerForm.append("name", "banner")
      bannerForm.append("symbol", "BANNER")
      bannerForm.append("description", "Token banner image")
      bannerForm.append("showName", "false")

      const ipfsRes = await fetch("https://pump.fun/api/ipfs", {
        method: "POST",
        body: bannerForm,
      })

      if (ipfsRes.ok) {
        const ipfsJson = await ipfsRes.json()
        const bannerUrl = ipfsJson.metadataUri || ipfsJson.metadata?.image

        if (bannerUrl) {
          await fetch("https://frontend-api-v3.pump.fun/coins/add-banner", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mint: mintAddress,
              banner: bannerUrl,
            }),
          })
          console.log(`Banner uploaded for ${symbol} (${mintAddress})`)
        }
      }
    } catch (err) {
      console.error("Banner upload error:", err.message)
    }
  }

  res.json({ success: true, token: launch })
})

app.get("/api/token/launches", (req, res) => {
  res.json({ tokens: tokenLaunches })
})


const AGENT_PROMPTS = {
  warp: `You are Pipe Agent, the payments specialist inside Mario OS. You help users send USDC micropayments using the x402 protocol. You're friendly, concise, and use occasional Mario pipe/warp references. When a user wants to send a payment, gather details one at a time: 1) Ask for the recipient address, 2) Ask for the amount in USDC, 3) Ask which network (Base, Solana, or Ethereum). Only call send_payment once you have all details. NEVER ask for multiple details in one message. When they ask about past payments, use get_payment_history. Keep each response to 1-2 sentences. NEVER use markdown formatting — no asterisks, no bold, no italic, no bullet lists. Write plain text only.`,
  lobster: `You are Crab Agent, the Moltbook specialist inside Mario OS. You help users manage their presence on Moltbook (the social network for agents). You're helpful and use occasional crab/lobster references. Your tools: register_agent (register new agents — gather name then description one at a time), check_claim_status (check verification status with api_key), list_agents (show all agents), view_feed (browse latest Moltbook posts — needs api_key, optional sort: hot or new), post_to_moltbook (post content — needs api_key, title, optional content and submolt), delete_agent (remove an agent by api_key). When registering, gather details ONE at a time. When posting, gather the title first, then ask for body text. NEVER ask for multiple details in one message. Keep each response to 1-2 sentences. NEVER use markdown formatting — no asterisks, no bold, no italic, no bullet lists. Write plain text only.`,
  chat: `You are Clawd, an AI agent assistant living inside Mario OS. You are friendly, helpful, and speak with a playful Mario-themed personality. You help users with understanding crypto and DeFi concepts, managing AI agents, using x402 payments, and trading via Bankr. Keep responses concise (2-3 sentences max). Use Mario references naturally. NEVER use markdown formatting — no asterisks, no bold, no italic, no bullet lists. Write plain text only.`,
  trading: `You are Star Agent, the trading specialist inside Mario OS. You help users compose @bankrbot commands for buying, selling, and swapping crypto on Solana (default chain) or other chains. Use the compose_trade tool. When a user wants to trade, gather details ONE at a time: 1) Ask what they want to do (buy, sell, or swap), 2) Ask for the amount, 3) Ask for the token. Only call compose_trade once you have all details. NEVER ask for multiple details in one message. Keep each response to 1-2 sentences. Use star/power-up Mario references. NEVER use markdown formatting — no asterisks, no bold, no italic, no bullet lists. Write plain text only.`,
  factory: `You are Mint Agent, the token launch specialist inside Mario OS. You help users launch tokens on Solana. The user's connected wallet address is provided in the system context — do NOT ask for it. For token launches, gather details ONE at a time in this EXACT order: 1) Ask for the token name, 2) After they answer, ask for the token symbol, 3) After they answer, ask for a short description, 4) After they answer, ask if they want to add optional social links — website URL, Telegram link, and/or X (Twitter) link. Tell them these are optional and they can say "skip" to skip them all, or provide whichever ones they want. 5) After they answer (or skip), ask if they want to upload a token logo and/or banner image — they can use the IMG button (for the profile picture/logo) and HDR button (for the header/banner) next to the chat input, or skip for auto-generated defaults. Once you have all details (or they skip), call launch_token with the wallet address from context. Pass any social links they provided (website, telegram, twitter). After calling launch_token, tell the user to approve the transaction in their Solana wallet (Phantom/Solflare). NEVER ask for multiple details in one message. Keep each response to 1-2 sentences. Use coin/castle Mario references. NEVER use markdown formatting — no asterisks, no bold, no italic, no bullet lists. Write plain text only.`,
}

const AGENT_NAMES = { warp: "Pipe Agent", lobster: "Crab Agent", chat: "Clawd", trading: "Star Agent", factory: "Mint Agent" }

const TOOL_DEFS = {
  warp: [
    {
      name: "send_payment",
      description: "Send a USDC micropayment to a wallet address or agent",
      input_schema: {
        type: "object",
        properties: {
          amount: { type: "string", description: "Amount in USDC" },
          recipient: { type: "string", description: "Wallet address or agent ID" },
          network: { type: "string", description: "Network: base, solana, or ethereum", enum: ["base", "solana", "ethereum"] },
        },
        required: ["amount", "recipient"],
      },
    },
    {
      name: "get_payment_history",
      description: "Get recent payment history",
      input_schema: { type: "object", properties: {} },
    },
  ],
  lobster: [
    {
      name: "register_agent",
      description: "Register a new AI agent on Moltbook",
      input_schema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Agent name" },
          description: { type: "string", description: "Agent description" },
        },
        required: ["name"],
      },
    },
    {
      name: "check_claim_status",
      description: "Check the claim/verification status of a registered agent",
      input_schema: {
        type: "object",
        properties: {
          api_key: { type: "string", description: "The agent's API key from registration" },
        },
        required: ["api_key"],
      },
    },
    {
      name: "list_agents",
      description: "List all registered agents",
      input_schema: { type: "object", properties: {} },
    },
    {
      name: "view_feed",
      description: "View the latest posts from the Moltbook feed. Requires an agent API key.",
      input_schema: {
        type: "object",
        properties: {
          api_key: { type: "string", description: "Agent API key to authenticate with Moltbook" },
          sort: { type: "string", description: "Sort order: hot or new", enum: ["hot", "new"] },
        },
        required: ["api_key"],
      },
    },
    {
      name: "post_to_moltbook",
      description: "Post content to a Moltbook submolt on behalf of the user's agent",
      input_schema: {
        type: "object",
        properties: {
          api_key: { type: "string", description: "Agent API key" },
          title: { type: "string", description: "Post title (max 100 chars)" },
          content: { type: "string", description: "Post body text (max 280 chars)" },
          submolt: { type: "string", description: "Submolt to post in (defaults to general)" },
        },
        required: ["api_key", "title"],
      },
    },
    {
      name: "delete_agent",
      description: "Remove a registered agent from the local agent list",
      input_schema: {
        type: "object",
        properties: {
          api_key: { type: "string", description: "API key of the agent to remove" },
        },
        required: ["api_key"],
      },
    },
  ],
  trading: [
    {
      name: "compose_trade",
      description: "Compose a @bankrbot trading command for buying, selling, or swapping crypto. Default chain is Solana.",
      input_schema: {
        type: "object",
        properties: {
          action: { type: "string", description: "Trade action", enum: ["buy", "sell", "swap"] },
          amount: { type: "string", description: "Amount (USD for buy, token amount for sell)" },
          token: { type: "string", description: "Token symbol (e.g. SOL, ETH, USDC)" },
          to_token: { type: "string", description: "Target token for swaps" },
          chain: { type: "string", description: "Chain: Solana, Base, or Ethereum", enum: ["Solana", "Base", "Ethereum"] },
        },
        required: ["action", "amount", "token"],
      },
    },
  ],
  factory: [
    {
      name: "launch_token",
      description: "Launch a token on Solana. Requires a Solana wallet address.",
      input_schema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Token name (1-32 chars)" },
          symbol: { type: "string", description: "Token ticker symbol (1-10 chars, e.g. MOON)" },
          description: { type: "string", description: "Token description (20-500 chars)" },
          wallet_address: { type: "string", description: "Solana wallet address for the token launch" },
          website: { type: "string", description: "Optional website URL for the token" },
          telegram: { type: "string", description: "Optional Telegram link for the token" },
          twitter: { type: "string", description: "Optional X (Twitter) link for the token" },
        },
        required: ["name", "symbol", "description", "wallet_address"],
      },
    },
  ],
  chat: [],
}

async function executeAgentTool(toolName, toolInput, actions, tokenImage, bannerImage) {
  switch (toolName) {
    case "send_payment": {
      const { amount, recipient, network } = toolInput
      const walletConfigured = !!process.env.X402_WALLET_ADDRESS
      const payment = {
        id: `pay_${Date.now()}`,
        amount: parseFloat(amount),
        recipient,
        network: network || "base",
        status: walletConfigured ? "pending_signature" : "wallet_not_configured",
        protocol: "x402",
        currency: "USDC",
        createdAt: new Date().toISOString(),
        fee: "$0.00025",
      }
      paymentHistory.push(payment)
      if (!walletConfigured) {
        return { success: false, payment, message: "Wallet not configured. The admin needs to set X402_WALLET_ADDRESS in secrets." }
      }
      return { success: true, payment, message: `Payment of ${amount} USDC to ${recipient} on ${network || "base"} created.` }
    }
    case "get_payment_history": {
      return { payments: paymentHistory.slice(-10), total: paymentHistory.length }
    }
    case "register_agent": {
      const { name, description } = toolInput
      try {
        const moltRes = await fetch(`${MOLTBOOK_API}/agents/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description: description || `${name} - deployed via Mario OS` }),
        })
        const data = await moltRes.json()
        if (!moltRes.ok) return { success: false, error: data.error || "Registration failed" }
        const agent = {
          id: data.agent?.api_key || `agent_${Date.now()}`,
          name,
          description: description || "",
          apiKey: data.agent?.api_key,
          claimUrl: data.agent?.claim_url,
          verificationCode: data.agent?.verification_code,
          status: "registered",
          createdAt: new Date().toISOString(),
          source: "moltbook",
        }
        agentStore.push(agent)
        if (agent.claimUrl) actions.push({ type: "claim_agent", claimUrl: agent.claimUrl, apiKey: agent.apiKey, verificationCode: agent.verificationCode, agentName: name })
        return { success: true, agent, message: `Agent "${name}" registered successfully!` }
      } catch (err) {
        return { success: false, error: "Failed to connect to Moltbook API" }
      }
    }
    case "check_claim_status": {
      const { api_key } = toolInput
      try {
        const moltRes = await fetch(`${MOLTBOOK_API}/agents/status`, {
          headers: { "Authorization": `Bearer ${api_key}` },
        })
        const data = await moltRes.json()
        if (moltRes.ok) {
          const localAgent = agentStore.find(a => a.apiKey === api_key)
          if (localAgent && data.status) localAgent.status = data.status
          return data
        }
        const localAgent = agentStore.find(a => a.apiKey === api_key)
        if (localAgent) return { status: localAgent.status, name: localAgent.name }
        return { error: "Agent not found" }
      } catch {
        const localAgent = agentStore.find(a => a.apiKey === api_key)
        if (localAgent) return { status: localAgent.status, name: localAgent.name }
        return { error: "Failed to check status" }
      }
    }
    case "list_agents": {
      return { agents: agentStore, count: agentStore.length }
    }
    case "view_feed": {
      const { api_key, sort } = toolInput
      try {
        const moltRes = await fetch(`${MOLTBOOK_API}/feed?sort=${sort || "hot"}&limit=10`, {
          headers: { "Authorization": `Bearer ${api_key}` },
        })
        const data = await moltRes.json()
        if (!moltRes.ok) return { success: false, error: data.error || "Could not load feed" }
        const posts = Array.isArray(data) ? data : (data.posts || [])
        return { success: true, posts: posts.slice(0, 10), count: posts.length }
      } catch (err) {
        return { success: false, error: "Failed to connect to Moltbook feed" }
      }
    }
    case "post_to_moltbook": {
      const { api_key, title, content, submolt } = toolInput
      if (!title) return { success: false, error: "Title is required" }
      try {
        const moltRes = await fetch(`${MOLTBOOK_API}/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${api_key}` },
          body: JSON.stringify({ submolt: submolt || "general", title, content: content || "" }),
        })
        const data = await moltRes.json()
        if (!moltRes.ok) return { success: false, error: data.error || "Post failed" }
        return { success: true, post: data, message: `Posted "${title}" to ${submolt || "general"}!` }
      } catch (err) {
        return { success: false, error: "Failed to post to Moltbook" }
      }
    }
    case "delete_agent": {
      const { api_key } = toolInput
      const idx = agentStore.findIndex(a => a.apiKey === api_key)
      if (idx === -1) return { success: false, error: "Agent not found with that API key" }
      const removed = agentStore.splice(idx, 1)[0]
      return { success: true, message: `Agent "${removed.name}" removed from your list.` }
    }
    case "compose_trade": {
      const { action, amount, token, to_token, chain } = toolInput
      const c = chain || "Solana"
      let command = ""
      if (action === "buy") command = `@bankrbot buy $${amount} of ${token} on ${c}`
      else if (action === "sell") command = `@bankrbot sell ${amount} ${token} on ${c}`
      else if (action === "swap") command = `@bankrbot swap ${amount} ${token} to ${to_token || "SOL"} on ${c}`
      actions.push({ type: "copy_command", command })
      return { success: true, command, message: "Command composed. User can copy or tweet it." }
    }
    case "launch_token": {
      const { name, symbol, description, wallet_address, website, telegram, twitter } = toolInput
      try {
        const mintKeypair = Keypair.generate()
        const mintPublicKey = mintKeypair.publicKey.toBase58()

        let imageBlob
        if (tokenImage && tokenImage.startsWith("data:image")) {
          const base64Data = tokenImage.split(",")[1]
          const mimeType = tokenImage.split(";")[0].split(":")[1]
          const binaryString = atob(base64Data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          imageBlob = new Blob([bytes], { type: mimeType })
        } else {
          const imageUrl = `https://api.dicebear.com/7.x/identicon/png?seed=${symbol}`
          const imageRes = await fetch(imageUrl)
          imageBlob = await imageRes.blob()
        }

        const formData = new FormData()
        formData.append("file", imageBlob, `${symbol}.png`)
        formData.append("name", name)
        formData.append("symbol", symbol.toUpperCase())
        formData.append("description", description)
        formData.append("showName", "true")
        if (website) formData.append("website", website)
        if (telegram) formData.append("telegram", telegram)
        if (twitter) formData.append("twitter", twitter)

        const metadataRes = await fetch("https://pump.fun/api/ipfs", {
          method: "POST",
          body: formData,
        })

        if (!metadataRes.ok) {
          return { success: false, error: "Failed to upload token metadata to IPFS" }
        }

        const metadataJson = await metadataRes.json()

        const txRes = await fetch("https://pumpportal.fun/api/trade-local", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicKey: wallet_address,
            action: "create",
            tokenMetadata: {
              name: name,
              symbol: symbol.toUpperCase(),
              uri: metadataJson.metadataUri,
            },
            mint: mintPublicKey,
            denominatedInSol: "true",
            amount: 0,
            slippage: 10,
            priorityFee: 0.0005,
            pool: "pump",
          }),
        })

        if (txRes.status !== 200) {
          return { success: false, error: "Failed to build token creation transaction" }
        }

        const txData = await txRes.arrayBuffer()
        const tx = VersionedTransaction.deserialize(new Uint8Array(txData))
        tx.sign([mintKeypair])

        const serializedTx = Buffer.from(tx.serialize()).toString("base64")

        actions.push({
          type: "sign_transaction",
          transaction: serializedTx,
          mintPublicKey,
          name,
          symbol: symbol.toUpperCase(),
          description,
          bannerImage: bannerImage || "",
        })

        return {
          success: true,
          message: `Transaction prepared for ${name} ($${symbol.toUpperCase()}). Please approve the transaction in your Solana wallet to launch the token.`,
          requiresWalletSignature: true,
        }
      } catch (err) {
        console.error("launch_token error:", err.message)
        return { success: false, error: "Failed to prepare token launch. Please try again." }
      }
    }
    default:
      return { error: "Unknown tool" }
  }
}

app.post("/api/agent-chat", async (req, res) => {
  const { message, history = [], tool = "chat", walletAddress = "", tokenImage = "", bannerImage = "" } = req.body

  if (!message) return res.status(400).json({ error: "Message is required" })

  const agentName = AGENT_NAMES[tool] || "Clawd"

  if (!process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
    return res.json({ response: `${agentName} is sleeping! The AI integration needs to be set up first.`, agent: agentName, actions: [] })
  }

  try {
    let systemPrompt = AGENT_PROMPTS[tool] || AGENT_PROMPTS.chat
    if (walletAddress) {
      systemPrompt += `\n\nUser's connected Solana wallet address: ${walletAddress}`
    } else {
      systemPrompt += `\n\nUser has NOT connected a Solana wallet yet. If they need wallet functionality, ask them to connect their wallet first using the button in the top bar.`
    }
    const toolDefs = TOOL_DEFS[tool] || []

    let claudeMessages = [
      ...history.slice(-10).map(m => ({ role: m.role, content: m.text })),
      { role: "user", content: message },
    ]

    let response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 512,
      system: systemPrompt,
      messages: claudeMessages,
      ...(toolDefs.length > 0 ? { tools: toolDefs } : {}),
    })

    const actions = []
    let loops = 0

    while (response.stop_reason === "tool_use" && loops < 5) {
      loops++
      const assistantContent = response.content
      const toolUseBlocks = assistantContent.filter(b => b.type === "tool_use")

      const toolResults = []
      for (const block of toolUseBlocks) {
        const result = await executeAgentTool(block.name, block.input, actions, tokenImage, bannerImage)
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) })
      }

      claudeMessages.push({ role: "assistant", content: assistantContent })
      claudeMessages.push({ role: "user", content: toolResults })

      response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 512,
        system: systemPrompt,
        messages: claudeMessages,
        tools: toolDefs,
      })
    }

    const textBlock = response.content.find(b => b.type === "text")
    const text = textBlock?.text || "Something went wrong!"

    res.json({ response: text, agent: agentName, actions })
  } catch (err) {
    console.error("Agent chat error:", err.message)
    res.json({ response: `${agentName} hit a block! Try again.`, agent: agentName, actions: [] })
  }
})

app.get("/api/status", (req, res) => {
  res.json({
    services: {
      clawd: {
        status: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ? "active" : "needs_api_key",
        model: "claude-sonnet-4-5",
      },
      x402: {
        status: process.env.X402_WALLET_ADDRESS ? "active" : "needs_wallet",
        network: process.env.X402_NETWORK || "base-sepolia",
      },
      bankr: {
        status: "active",
        note: "Trade via @bankrbot on X (Solana default)",
      },
      tokenLauncher: {
        status: "active",
        note: "Token launches on Solana",
        launches: tokenLaunches.length,
      },
      moltbook: {
        status: "active",
        agents: agentStore.length,
      },
    },
  })
})

const PORT = 3001
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Mario OS API server running on port ${PORT}`)
})
