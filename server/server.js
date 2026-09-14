import fs from 'node:fs'
import path from 'node:path'
import { createServer } from 'node:http'
import express from 'express'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import { CONFIG, SECURITY_HEADERS } from './config/security.js'
import { CSP_DIRECTIVES } from './config/csp.js'
import { RoomManager } from './rooms/roomManager.js'
import { registerRoomSocket } from './sockets/roomSocket.js'
import { startSweeper } from './utils/cleanup.js'
import { createHttpRateLimit } from './utils/httpRateLimit.js'

const app = express()
app.disable('x-powered-by')

// Behind a reverse proxy the real client IP should drive rate limiting.
// Opt in explicitly — never trust a forwarded header by default.
if (CONFIG.trustProxy) app.set('trust proxy', 1)

// Full baseline hardening: same-origin framing/loading, no sniffing, strict
// referrer. CSP is set explicitly (shared with the build-time <meta> tag) and
// HSTS is only advertised in production behind a real TLS terminator.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: CSP_DIRECTIVES,
    },
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginEmbedderPolicy: false, // file sharing uses dataurls, no cross-origin embeds
    hsts: CONFIG.isProd
      ? { maxAge: 15552000, includeSubDomains: true, preload: true }
      : false,
  })
)

for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
  app.use((req, res, next) => {
    res.setHeader(name, value)
    next()
  })
}

const corsOptions = CONFIG.corsOrigins.includes('*')
  ? { origin: '*' }
  : CONFIG.corsOrigins.length > 0
    ? { origin: CONFIG.corsOrigins }
    : { origin: false } // same-origin only — relay also serves the built app

app.use(cors(corsOptions))
app.use(express.json({ limit: '1mb' }))

// Guard the static bundle / API surface against IP-level floods. Socket.IO
// long-polling is exempt because per-socket throttles and the connection cap
// already handle abuse at the transport layer.
app.use(
  createHttpRateLimit({
    max: CONFIG.rateLimit.httpMax,
    windowMs: CONFIG.rateLimit.httpWindowMs,
    trustProxy: CONFIG.trustProxy,
  })
)

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: corsOptions,
  maxHttpBufferSize: CONFIG.limits.fileMaxBytes * 1.5 + 64 * 1024,
})

// Cap how many live sockets a single IP may hold open. Counts are ref-counted
// and pruned on disconnect so an exhausted quota frees up immediately.
const connectionsByIp = new Map()
io.use((socket, next) => {
  const ip = socket.handshake.address || 'unknown'
  const count = connectionsByIp.get(ip) || 0
  if (count >= CONFIG.rateLimit.connectionsPerIp) {
    return next(new Error('Too many connections from this address. Close some tabs and retry.'))
  }
  connectionsByIp.set(ip, count + 1)
  socket.on('disconnect', () => {
    const remaining = (connectionsByIp.get(ip) || 1) - 1
    if (remaining <= 0) connectionsByIp.delete(ip)
    else connectionsByIp.set(ip, remaining)
  })
  next()
})

// Serve the built frontend (npm run build) when present.
const indexFile = path.join(CONFIG.staticDir, 'index.html')
if (fs.existsSync(indexFile)) {
  app.use(express.static(CONFIG.staticDir, { index: 'index.html', maxAge: '1h' }))
  app.get('*splat', (req, res, next) => {
    if (req.method !== 'GET') return next()
    res.sendFile(indexFile)
  })
}

// RAM-only room relay.
const manager = new RoomManager(io)
registerRoomSocket(io, manager)
startSweeper(manager)

httpServer.listen(CONFIG.port, () => {
  console.log(`[ephemeral-relay] listening on :${CONFIG.port} (RAM only, no database)`)
})

process.on('SIGINT', () => httpServer.close(() => process.exit(0)))
process.on('SIGTERM', () => httpServer.close(() => process.exit(0)))