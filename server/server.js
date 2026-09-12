import fs from 'node:fs'
import path from 'node:path'
import { createServer } from 'node:http'
import express from 'express'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import { CONFIG } from './config/security.js'
import { RoomManager } from './rooms/roomManager.js'
import { registerRoomSocket } from './sockets/roomSocket.js'
import { startSweeper } from './utils/cleanup.js'

const app = express()
app.disable('x-powered-by')
// The app ships its own Content-Security-Policy meta tag at build time.
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: CONFIG.origin }))
app.use(express.json({ limit: '1mb' }))

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: CONFIG.origin, methods: ['GET', 'POST'] },
  maxHttpBufferSize: CONFIG.limits.fileMaxBytes * 1.5 + 64 * 1024,
})

// Serve the built frontend (npm run build) when present.
const indexFile = path.join(CONFIG.staticDir, 'index.html')
if (fs.existsSync(indexFile)) {
  app.use(express.static(CONFIG.staticDir, { index: 'index.html' }))
  app.use((req, res, next) => {
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