import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Comma-separated allow-list of cross-origin browser hosts that may talk to the
// relay over CORS (e.g. "http://localhost:5173,https://app.example.com").
// An empty value means same-origin only — the relay serves the built app
// itself, so nothing cross-origin is needed unless you host the client apart.
function parseOrigins(raw) {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

const corsOrigins = parseOrigins(process.env.ORIGIN || process.env.CORS_ORIGINS)

export const CONFIG = {
  port: Number(process.env.PORT) || 5000,

  isProd: process.env.NODE_ENV === 'production',

  // Set TRUST_PROXY=true only when the relay sits behind a reverse proxy
  // (nginx/caddy/Fly/Render) so rate limiting keys on the real client IP.
  trustProxy: process.env.TRUST_PROXY === 'true',

  // Allowed browser origins for Socket.IO / HTTP CORS. Same-origin (the relay
  // serving the built app) is the secure default; cross-origin Vite dev
  // clients or hosted frontends must be listed explicitly via ORIGIN.
  corsOrigins,

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
    // Room creations per socket (guards against room-enumeration spam).
    createMax: 5,
    createWindowMs: 60_000,
    // HTTP requests per IP (static assets + bundle). Socket.IO traffic is
    // throttled separately at the socket layer.
    httpMax: 300,
    httpWindowMs: 60_000,
    // Hard ceiling on how many concurrent sockets one IP may hold.
    connectionsPerIp: 30,
    // Rooms a single socket may hold a seat in at once.
    roomsPerSocket: 12,
  },
}

// Strict-lockdown header applied to every HTTP response. Socket.IO only needs
// same-origin connectivity (the transports are matched by connect-src 'self').
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
}