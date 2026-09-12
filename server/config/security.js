import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const CONFIG = {
  port: Number(process.env.PORT) || 5000,
  // Allowed browser origin for Socket.IO CORS. In production the server serves
  // the built app itself, so this stays as '*' / same-origin unless you front
  // the client with a different host.
  origin: process.env.ORIGIN || '*',
  staticDir:
    process.env.STATIC_DIR || path.resolve(__dirname, '..', '..', 'dist'),

  limits: {
    roomIdLength: 6,
    nameMax: 20,
    passwordMin: 4,
    passwordMax: 64,
    messageMax: 2000,
    fileNameMax: 120,
    fileMaxBytes: 800 * 1024,
    fileMaxCount: 40,
    messagesMax: 250,
    usersMaxPerRoom: 20,
  },

  room: {
    // How long an empty room stays alive waiting for a reconnect / late join
    // before being destroyed and forgotten.
    emptyGraceMs: 30_000,
    // How long a disconnected member is kept before being dropped. A quick
    // network blip re-attaches to the same seat instead of creating a clash.
    disconnectGraceMs: 20_000,
    // Absolute cap on how long any room may exist, even if still in use.
    maxLifetimeMs: 24 * 60 * 60 * 1000,
  },

  rateLimit: {
    // Messages per socket: burst of N, full refill every windowMs.
    messageBurst: 15,
    messageWindowMs: 10_000,
    // Failed join attempts per socket before a temporary block.
    joinMaxFails: 8,
    joinLockMs: 60_000,
  },
}