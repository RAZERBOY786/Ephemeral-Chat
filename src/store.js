import { request, send, on, getSocket, hasSocket } from './services/socket.js'

const ACTIVITY_KEY = 'e-chat:activity'
const USER_KEY = 'e-chat:user-name'
const ACCOUNT_KEY = 'e-chat:account'
const PREFS_KEY = 'e-chat:prefs'
const MAX_FILE_SIZE = 800 * 1024

// ─── Client-server architecture ─────────────────────────────────────
// Rooms, messages, files and passwords live ONLY on the relay server,
// in RAM. The server has no database and never persists anything — when it
// restarts, every room is gone. This module keeps a lightweight mirror of
// the rooms you are currently inside so the UI can render instantly, and
// every action talks to the relay over Socket.IO. The only things stored
// locally (localStorage) are non-chat preferences and your display name.

let rooms = {}
let myNames = {}
const listeners = new Set()
/** roomId -> last message ts this tab has rendered as read. */
let readTs = {}
/** roomId -> most recent {name, reason, unread, at} leave broadcast. */
let lastLeave = {}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() {
  for (const fn of listeners) {
    try {
      fn()
    } catch {}
  }
}

// ─── Socket bootstrap ──────────────────────────────────────────────
// Deliberately lazy: the marketing (Home) page never opens a socket.
let booted = false

export function initChatStore() {
  ensureStoreSocket()
  return getSocket()
}

function ensureStoreSocket() {
  if (booted) return
  booted = true

  on('room:update', ({ id, room, leave }) => {
    if (leave) lastLeave[id] = leave
    if (room) {
      rooms[id] = room
    } else {
      delete rooms[id]
      delete myNames[id]
    }
    notify()
  })

  getSocket().on('connect', () => {
    // Re-attach to every room we were inside when the connection dropped.
    const entries = Object.entries(myNames)
    if (entries.length) rejoinAllRooms(entries)
  })

  // Best-effort "tab closing" ping so other members get an instant leave
  // alert instead of waiting for the disconnect grace period to lapse.
  const bye = () => {
    if (!hasSocket()) return
    send('session:close')
  }
  window.addEventListener('pagehide', bye)
  window.addEventListener('beforeunload', bye)
}

async function rejoinAllRooms(entries) {
  for (const [id, name] of entries) {
    const res = await request('room:rejoin', { roomId: id, name })
    if (res.ok && res.room) rooms[id] = res.room
    else {
      delete rooms[id]
      delete myNames[id]
    }
  }
  notify()
}

// ─── Helpers ─────────────────────────────────────────────────────

export function genGuestName() {
  return `Guest-${1000 + Math.floor(Math.random() * 9000)}`
}

function copyRoom(r) {
  if (!r) return null
  return {
    id: r.id,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    users: Array.isArray(r.users) ? [...r.users] : [],
    messages: Array.isArray(r.messages) ? [...r.messages] : [],
    files: Array.isArray(r.files) ? [...r.files] : [],
    fileCount: r.fileCount || 0,
    typing: r.typing ? { ...r.typing } : {},
  }
}

// ─── Guest account identity (local, non-chat) ────────────────────

export function sanitizeName(name) {
  return String(name || '')
    // eslint-disable-next-line no-control-regex -- intentionally strips control chars
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .trim()
    .slice(0, 20)
}

export function isGuestName(name) {
  return String(name || '').startsWith('Guest-')
}

function readAccountMeta() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_KEY)) || {}
  } catch {
    return {}
  }
}

export function getAccountCreated() {
  return readAccountMeta().createdAt || 0
}

export function getUserName() {
  try {
    return sanitizeName(localStorage.getItem(USER_KEY))
  } catch {
    return ''
  }
}

export function saveUserName(name) {
  const clean = sanitizeName(name)
  try {
    localStorage.setItem(USER_KEY, clean)
    const meta = readAccountMeta()
    if (!meta.createdAt) {
      meta.createdAt = Date.now()
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(meta))
    }
  } catch {}
  notify()
}

export function deleteAccount() {
  try {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(ACCOUNT_KEY)
  } catch {}
  notify()
}

// ─── Room API (relay in RAM, mirror here in memory only) ─────────

export async function createRoom(password, creatorName) {
  ensureStoreSocket()
  const res = await request('room:create', { password, name: creatorName })
  if (!res.ok) return { ok: false, error: res.error }
  rooms[res.id] = res.room
  myNames[res.id] = res.name
  readTs[res.id] = res.room.messages.at(-1)?.ts || Date.now()
  recordActivity('room_created', `${res.name} created room ${res.id}`, res.id, { actor: res.name })
  return { ok: true, name: res.name, id: res.id }
}

export async function joinRoom(id, password, userName) {
  ensureStoreSocket()
  const res = await request('room:join', { roomId: id, password, name: userName })
  if (!res.ok) return { ok: false, error: res.error }
  rooms[res.id] = res.room
  myNames[res.id] = res.name
  readTs[res.id] = res.room.messages.at(-1)?.ts || Date.now()
  recordActivity('room_joined', `${res.name} joined room ${res.id}`, res.id, { actor: res.name })
  return { ok: true, name: res.name, roomId: res.id }
}

export async function leaveRoom(id, userName) {
  await request('room:leave', { roomId: id, name: userName })
  delete rooms[id]
  delete myNames[id]
  delete readTs[id]
  delete lastLeave[id]
  recordActivity('room_left', `${userName} left room ${id}`, id, { actor: userName })
}

export async function destroyRoom(id, actor = '') {
  await request('room:destroy', { roomId: id, actor: actor || getUserName() })
  delete rooms[id]
  delete myNames[id]
  delete readTs[id]
  delete lastLeave[id]
  recordActivity('room_destroyed', `Room ${id} was destroyed`, id, { actor })
}

export async function postMessage(id, sender, text) {
  const res = await request('message:send', { roomId: id, text })
  if (res.ok) rooms[id] = res.room
  return res
}

export async function deleteMessage(roomId, messageId, _deleter) {
  const res = await request('message:delete', { roomId, messageId })
  if (res.ok) rooms[roomId] = res.room
  return res
}

export async function addFile(roomId, sender, file) {
  if (!file || !file.dataUrl) return { ok: false, error: 'Invalid file.' }
  if (file.size > MAX_FILE_SIZE) return { ok: false, error: 'File is too large (max 800 KB).' }
  const res = await request('file:add', { roomId, file })
  if (res.ok) rooms[roomId] = res.room
  return res
}

export async function deleteFile(roomId, fileRef, _deleter) {
  const res = await request('file:delete', { roomId, fileRef })
  if (res.ok) rooms[roomId] = res.room
  return res
}

// Live typing indicator — transient, never stored anywhere.
export function setTyping(roomId, sender, typing) {
  ensureStoreSocket()
  send('typing', { roomId, name: sender, typing })
}

// Tell the relay how far this tab has read so a later leave event can report
// "X left before reading N messages". Read receipts are RAM-only, like all
// chat data, and never leave the socket payload.
export function markRead(roomId) {
  const r = rooms[roomId]
  if (!r) return
  const latest = r.messages[r.messages.length - 1]
  if (!latest) return
  const ts = Number(latest.ts)
  if (!ts || (readTs[roomId] || 0) >= ts) return
  readTs[roomId] = ts
  send('message:read', { roomId, ts })
}

/** Most recent leave event the relay broadcast for a room (or null). */
export function getLastLeave(roomId) {
  return lastLeave[roomId] || null
}

export function getRoom(id) {
  return copyRoom(rooms[id])
}

export function getRoomsDetailed() {
  return Object.values(rooms).map((r) => ({
    id: r.id,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    users: [...r.users],
    fileCount: r.fileCount || 0,
  }))
}

// ─── Activity log (non-chat event feed, local only) ──────────────

function readActivity() {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function recordActivity(type, text, roomId, meta = {}) {
  const list = readActivity()
  list.unshift({
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    text,
    roomId: roomId || null,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    ts: Date.now(),
    actor: meta.actor || '',
    file: meta.file || '',
  })
  if (list.length > 60) list.length = 60
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(list))
  } catch {}
  notify()
}

// ─── Danger zone / backup ────────────────────────────────────────

export async function clearRooms() {
  for (const [id, name] of Object.entries(myNames)) {
    await request('room:leave', { roomId: id, name })
  }
  rooms = {}
  myNames = {}
  readTs = {}
  lastLeave = {}
  notify()
}

export async function clearAllData() {
  await clearRooms()
  try {
    localStorage.removeItem(ACTIVITY_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(ACCOUNT_KEY)
    localStorage.removeItem(PREFS_KEY)
  } catch {}
  notify()
}

// ─── Preferences (local only) ────────────────────────────────────

const DEFAULT_PREFS = { dotField: true, aurora: true, sparkle: false, sound: true }

export function getPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {}
}

// ─── Backup / restore ────────────────────────────────────────────
// Rooms cannot be restored — they live on the relay in RAM and are gone once
// the last member leaves. Export simply snapshots the room state and local
// settings; import restores only the local (non-chat) parts.

export function exportData() {
  return {
    rooms: Object.fromEntries(
      Object.entries(rooms).map(([id, r]) => [id, { ...r, typing: undefined }])
    ),
    activity: readActivity(),
    userName: getUserName(),
    prefs: getPrefs(),
    exportedAt: new Date().toISOString(),
  }
}

export function importData(raw) {
  let data
  try {
    data = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }
  if (!data || typeof data !== 'object') return { ok: false, error: 'That file is not a valid backup.' }

  try {
    if (Array.isArray(data.activity)) localStorage.setItem(ACTIVITY_KEY, JSON.stringify(data.activity))
    if (data.userName != null) localStorage.setItem(USER_KEY, String(data.userName))
    if (data.prefs && typeof data.prefs === 'object') localStorage.setItem(PREFS_KEY, JSON.stringify(data.prefs))
  } catch {}
  notify()
  return { ok: true }
}