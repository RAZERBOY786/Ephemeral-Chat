import { io } from 'socket.io-client'

// Set VITE_SERVER_URL to a remote relay (e.g. wss://your-host.example).
// When unset, the client connects to the same origin — in dev that is the
// Vite proxy, in production the Node server that also serves the built app.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || undefined

let socket = null
let status = 'connecting'
const statusListeners = new Set()
const eventHandlers = new Map()

function setStatus(next) {
  status = next
  for (const cb of statusListeners) {
    try {
      cb(status)
    } catch {}
  }
}

/** Lazily create the socket. Safe to call from anywhere. */
export function getSocket() {
  if (socket) return socket

  socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    reconnectionDelayMax: 5000,
  })

  socket.on('connect', () => setStatus('connected'))
  socket.on('reconnect_attempt', () => setStatus('reconnecting'))
  socket.on('reconnect_failed', () => setStatus('offline'))
  socket.on('connect_error', () => setStatus('reconnecting'))
  socket.on('disconnect', (reason) => {
    setStatus(reason === 'io server disconnect' ? 'offline' : 'reconnecting')
  })

  return socket
}

export function initSocket() {
  return getSocket()
}

/** True when a socket was created at least once in this session. */
export function hasSocket() {
  return socket !== null
}

export function connectionStatus() {
  return status
}

export function onConnectionChange(cb) {
  statusListeners.add(cb)
  cb(status)
  return () => statusListeners.delete(cb)
}

/**
 * Socket.IO request/response (ack) helper. Resolves to { ok, ... } or
 * { ok: false, error } and never throws.
 */
export function request(evt, payload, timeoutMs = 8000) {
  const s = getSocket()
  return new Promise((resolve) => {
    if (!s.connected) {
      resolve({ ok: false, error: 'Server unreachable — reconnecting…' })
      return
    }
    let done = false
    const timer = setTimeout(() => {
      if (!done) {
        done = true
        resolve({ ok: false, error: 'Server timed out. Try again.' })
      }
    }, timeoutMs)

    try {
      s.emit(evt, payload, (res) => {
        if (!done) {
          done = true
          clearTimeout(timer)
          resolve(res && typeof res === 'object' ? res : { ok: false, error: 'No response from server.' })
        }
      })
    } catch {
      if (!done) {
        done = true
        clearTimeout(timer)
        resolve({ ok: false, error: 'Connection error.' })
      }
    }
  })
}

/** Fire-and-forget emit (typing, etc.). */
export function send(evt, payload) {
  const s = getSocket()
  if (s.connected) s.emit(evt, payload)
}

/** Subscribe to a server event. Returns an unsubscribe function. */
export function on(evt, cb) {
  const s = getSocket()
  if (!eventHandlers.has(evt)) {
    eventHandlers.set(evt, new Set())
    s.on(evt, (data) => {
      for (const h of eventHandlers.get(evt)) {
        try {
          h(data)
        } catch {}
      }
    })
  }
  eventHandlers.get(evt).add(cb)
  return () => eventHandlers.get(evt)?.delete(cb)
}