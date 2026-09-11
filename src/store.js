const LEGACY_ROOMS_KEY = 'e-chat:rooms'
const ACTIVITY_KEY = 'e-chat:activity'
const USER_KEY = 'e-chat:user-name'
const ACCOUNT_KEY = 'e-chat:account'
const PREFS_KEY = 'e-chat:prefs'
const CHANNEL_NAME = 'e-chat:sync'
const MAX_FILE_SIZE = 800 * 1024

// ─── Zero persistence: chat data is NEVER stored ─────────────────
// Messages, files, rooms and passwords exist only in browser memory.
// Nothing chat-related is ever written to localStorage — it all lives
// in RAM and vanishes when every tab closes. Cross-tab sync happens
// entirely over the BroadcastChannel (structured clone), never disk.
// Any chat data written by older versions is wiped on startup.

let rooms = {}

try {
  localStorage.removeItem(LEGACY_ROOMS_KEY)
} catch {}

let channel = null
try {
  channel = new BroadcastChannel(CHANNEL_NAME)
} catch {}

function adoptRooms(next) {
  rooms = next && typeof next === 'object' ? next : {}
  notify()
}

function emit() {
  notify()
  try {
    channel?.postMessage({ type: 'rooms', rooms })
  } catch {}
}

if (channel) {
  channel.addEventListener('message', (e) => {
    const msg = e.data
    if (!msg) return
    if (msg.type === 'rooms') {
      adoptRooms(msg.rooms)
    } else if (msg.type === 'sync-request') {
      try {
        channel.postMessage({ type: 'rooms', rooms })
      } catch {}
    }
  })
}

// Ask any open tab for the current room state right away
try {
  channel?.postMessage({ type: 'sync-request' })
} catch {}

// localStorage only holds non-chat data (activity, settings, name)
window.addEventListener('storage', () => notify())

// Heartbeat: keeps tabs in sync and lets late-opening tabs catch up
setInterval(() => {
  notify()
  if (rooms && Object.keys(rooms).length > 0) {
    try {
      channel?.postMessage({ type: 'rooms', rooms })
    } catch {}
  }
}, 1000)

// ─── PubSub for same-tab reactivity ──────────────────────────────

const listeners = new Set()

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() {
  listeners.forEach((fn) => {
    try { fn() } catch {}
  })
}

// ─── Helpers ─────────────────────────────────────────────────────

function genId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = ''
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

function stamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function genGuestName() {
  return `Guest-${1000 + Math.floor(Math.random() * 9000)}`
}

// ─── Guest account identity ──────────────────────────────────────
// The account is local and non-chat: a display name plus a tiny
// "created at" marker. Chat data is NEVER part of the account.

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

export function getRoomNameTaken(id, name) {
  const room = rooms[id]
  if (!room) return false
  return room.users.includes(sanitizeName(name))
}

// ─── Room API (in-memory only) ───────────────────────────────────

export function createRoom(password, creatorName) {
  let id = genId()
  while (rooms[id]) id = genId()
  const clean = sanitizeName(creatorName) || genGuestName()

  rooms[id] = {
    id,
    password,
    createdBy: clean,
    users: [clean],
    files: [],
    typing: {},
    messages: [
      { id: `sys-${Date.now()}`, text: `${clean} created the room`, type: 'system', time: stamp(), ts: Date.now() },
    ],
    createdAt: Date.now(),
    fileCount: 0,
  }

  writeRooms()
  recordActivity('room_created', `${clean} created room ${id}`, id, { actor: clean })
  return { ok: true, name: clean, id }
}

export function joinRoom(id, password, userName) {
  const room = rooms[id]
  if (!room) return { ok: false, error: 'Room not found. Check the ID and try again.' }
  if (room.password !== password) return { ok: false, error: 'Incorrect password.' }

  const clean = sanitizeName(userName) || genGuestName()

  // If the name is already taken in this room, auto-append a counter
  // so the same person can join from multiple tabs without a dead end.
  let finalName = clean
  let n = 2
  while (room.users.includes(finalName)) {
    finalName = `${clean.slice(0, 14)}-${n}`
    n++
  }

  room.users.push(finalName)
  room.messages.push({
    id: `sys-${Date.now()}`,
    text: `${finalName} joined the room`,
    type: 'system',
    time: stamp(),
    ts: Date.now(),
  })

  writeRooms()
  recordActivity('room_joined', `${finalName} joined room ${id}`, id, { actor: finalName })
  return { ok: true, name: finalName }
}

export function destroyRoom(id, actor = '') {
  const room = rooms[id]
  if (!room) return

  delete rooms[id]
  writeRooms()
  recordActivity('room_destroyed', `Room ${id} was destroyed`, id, { actor })
}

export function leaveRoom(id, userName) {
  const room = rooms[id]
  if (!room) return

  room.users = room.users.filter((u) => u !== userName)
  room.messages.push({
    id: `sys-${Date.now()}`,
    text: `${userName} left the room`,
    type: 'system',
    time: stamp(),
    ts: Date.now(),
  })

  if (room.users.length === 0) {
    delete rooms[id]
  }

  writeRooms()
  recordActivity('room_left', `${userName} left room ${id}`, id, { actor: userName })
}

export function postMessage(id, sender, text) {
  const room = rooms[id]
  if (!room) return

  room.messages.push({
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender,
    text: text.trim(),
    type: 'message',
    time: stamp(),
    ts: Date.now(),
  })

  writeRooms()
}

// Live typing indicator: transient, never written to storage. Entries carry a
// timestamp so receiving tabs can auto-expire them after a moment. Broadcast
// via the normal rooms sync so every open tab sees other members type.
export function setTyping(roomId, sender, typing) {
  const room = rooms[roomId]
  if (!room) return

  room.typing = room.typing || {}
  if (typing) room.typing[sender] = Date.now()
  else delete room.typing[sender]

  emit()
}

// Chat-app-style message deletion: replaces the message in place with a
// "deleted" tombstone so everyone in the room sees it disappear. Only the
// original sender can delete their own message.
export function deleteMessage(roomId, messageId, deleter) {
  const room = rooms[roomId]
  if (!room) return { ok: false, error: 'Room not found.' }

  const idx = room.messages.findIndex((m) => m.id === messageId && m.type === 'message')
  if (idx === -1) return { ok: false, error: 'Message not found.' }
  if (room.messages[idx].sender !== deleter) return { ok: false, error: 'You can only delete your own messages.' }

  room.messages[idx] = {
    id: `sys-del-${Date.now()}`,
    text: `${deleter} deleted their message`,
    type: 'system',
    time: stamp(),
    ts: Date.now(),
  }

  writeRooms()
  return { ok: true }
}

export function getRoom(id) {
  const r = rooms[id]
  if (!r) return null

  return {
    id: r.id,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    users: Array.isArray(r.users) ? [...r.users] : [],
    fileCount: r.fileCount || 0,
    messages: Array.isArray(r.messages) ? [...r.messages] : [],
    files: Array.isArray(r.files) ? [...r.files] : [],
    typing: r.typing ? { ...r.typing } : {},
  }
}

export function getPublicRooms() {
  return Object.values(rooms).map((r) => ({
    id: r.id,
    userCount: r.users.length,
    createdBy: r.createdBy,
  }))
}

export function roomExists(id) {
  return !!rooms[id]
}

function writeRooms() {
  emit()
}

// ─── Activity log (non-chat event feed) ──────────────────────────

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
    time: stamp(),
    ts: Date.now(),
    actor: meta.actor || '',
    file: meta.file || '',
  })
  if (list.length > 60) list.length = 60
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(list))
  } catch {}
  emit()
}

export function getActivity() {
  return readActivity()
}

// ─── User name ───────────────────────────────────────────────────

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

// ─── Files (in-memory only, same as messages) ────────────────────

export function addFile(roomId, sender, file) {
  const room = rooms[roomId]
  if (!room) return { ok: false, error: 'Room not found.' }
  if (!file || !file.dataUrl) return { ok: false, error: 'Invalid file.' }
  if (file.size > MAX_FILE_SIZE) return { ok: false, error: 'File is too large (max 800 KB).' }

  room.files = room.files || []
  const newFile = {
    id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: file.name || 'unnamed',
    size: file.size || 0,
    type: file.type || '',
    dataUrl: file.dataUrl,
    sender,
    time: stamp(),
    ts: Date.now(),
  }
  room.files.push(newFile)
  room.messages.push({
    id: `sys-${Date.now()}`,
    text: `${sender} shared "${file.name}"`,
    type: 'system',
    fileRef: newFile.id,
    time: stamp(),
    ts: Date.now(),
  })
  room.fileCount = room.files.length

  writeRooms()
  recordActivity('file_shared', `${sender} shared "${file.name}" in room ${roomId}`, roomId, { actor: sender, file: file.name })
  return { ok: true }
}

// Delete a shared file/photo: removes it from the room and replaces the share
// message with a tombstone. Only the sender can delete their own file.
export function deleteFile(roomId, fileRef, deleter) {
  const room = rooms[roomId]
  if (!room) return { ok: false, error: 'Room not found.' }

  const file = (room.files || []).find((f) => f.id === fileRef)
  if (!file) return { ok: false, error: 'File not found.' }
  if (file.sender !== deleter) return { ok: false, error: 'You can only delete your own files.' }

  room.files = room.files.filter((f) => f.id !== fileRef)
  const idx = room.messages.findIndex((m) => m.fileRef === fileRef)
  if (idx !== -1) {
    room.messages[idx] = {
      id: `sys-del-${Date.now()}`,
      text: `${deleter} deleted ${String(file.type).startsWith('image/') ? 'a photo' : 'a file'}`,
      type: 'system',
      time: stamp(),
      ts: Date.now(),
    }
  }
  room.fileCount = room.files.length

  writeRooms()
  return { ok: true }
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

export function getFiles() {
  return Object.values(rooms).flatMap((r) =>
    r.files.map((f) => ({ ...f, roomId: r.id, roomCreator: r.createdBy }))
  )
}

// ─── Danger zone ─────────────────────────────────────────────────

export function clearAllData() {
  rooms = {}
  try {
    localStorage.removeItem(ACTIVITY_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(ACCOUNT_KEY)
    localStorage.removeItem(PREFS_KEY)
    localStorage.removeItem(LEGACY_ROOMS_KEY)
  } catch {}
  notify()
  emit()
}

export function clearRooms() {
  rooms = {}
  try {
    localStorage.removeItem(LEGACY_ROOMS_KEY)
  } catch {}
  emit()
}

export function clearActivity() {
  try {
    localStorage.removeItem(ACTIVITY_KEY)
  } catch {}
  emit()
}

export function getStorageBytes() {
  let total = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || ''
      const v = localStorage.getItem(k) || ''
      total += k.length + v.length * 2
    }
  } catch {}
  return total
}

// ─── Preferences ─────────────────────────────────────────────────

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

export function exportData() {
  return {
    rooms,
    activity: readActivity(),
    userName: getUserName(),
    prefs: getPrefs(),
    exportedAt: new Date().toISOString(),
  }
}

function normalizeRooms(next) {
  const out = {}
  for (const id of Object.keys(next)) {
    const r = next[id]
    if (!r || typeof r !== 'object') continue
    out[id] = {
      id: r.id || id,
      password: typeof r.password === 'string' ? r.password : '',
      createdBy: r.createdBy || 'Unknown',
      createdAt: typeof r.createdAt === 'number' ? r.createdAt : Date.now(),
      users: Array.isArray(r.users) ? [...r.users] : [],
      messages: Array.isArray(r.messages) ? [...r.messages] : [],
      files: Array.isArray(r.files) ? [...r.files] : [],
      fileCount: Array.isArray(r.files) ? r.files.length : 0,
      typing: r.typing && typeof r.typing === 'object' ? { ...r.typing } : {},
    }
  }
  return out
}

export function importData(raw) {
  let data
  try {
    data = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }
  if (!data || typeof data !== 'object') return { ok: false, error: 'That file is not a valid backup.' }

  const next = data.rooms && typeof data.rooms === 'object' ? data.rooms : {}
  rooms = normalizeRooms(next)
  try {
    if (Array.isArray(data.activity)) localStorage.setItem(ACTIVITY_KEY, JSON.stringify(data.activity))
    if (data.userName != null) localStorage.setItem(USER_KEY, String(data.userName))
    if (data.prefs && typeof data.prefs === 'object') localStorage.setItem(PREFS_KEY, JSON.stringify(data.prefs))
  } catch {}
  emit()
  return { ok: true }
}