import { CONFIG } from '../config/security.js'
import { genRoomId } from '../utils/roomId.js'
import {
  sanitizeName,
  validationError,
  messageError,
  fileError,
  joinError,
} from '../utils/validation.js'

const { limits, room: roomCfg, rateLimit } = CONFIG

function stamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function rand4() {
  return Math.random().toString(36).slice(2, 6)
}

/**
 * In-memory room relay.
 *
 * Everything lives in a plain Map. Nothing is written to disk, to a database
 * or to any file. When the process exits — or the RAM is cleared — every room,
 * member, message, file and typing state is gone. The server is a relay only.
 */
export class RoomManager {
  constructor(io) {
    this.io = io
    /** @type {Map<string, object>} roomId -> room */
    this.rooms = new Map()
    /** @type {Map<string, NodeJS.Timeout>} `${roomId}:${name}` -> grace timer */
    this.removalTimers = new Map()
    /** @type {Map<string, {n:number, resetAt:number}>} */
    this.msgBuckets = new Map()
    /** @type {Map<string, {fails:number, unlockAt:number}>} */
    this.joinGuards = new Map()
  }

  // ── Snapshots (password never leaves the server) ───────────────

  snapshot(room) {
    if (!room) return null
    return {
      id: room.id,
      createdBy: room.createdBy,
      createdAt: room.createdAt,
      users: room.members.map((m) => m.name),
      messages: room.members.length ? room.messages : [],
      files: room.members.length ? room.files : [],
      fileCount: room.fileCount,
      typing: room.typing,
    }
  }

  broadcast(roomId, room, leave) {
    const data = { id: roomId, room: this.snapshot(room) }
    if (leave) data.leave = leave
    this.io.to(roomId).emit('room:update', data)
  }

  // ── Room lifecycle ─────────────────────────────────────────────

  createRoom(socketId, data = {}) {
    const baseErr = validationError(data)
    if (baseErr) return { ok: false, error: baseErr }
    if (typeof data.password !== 'string') return { ok: false, error: 'Room password must be at least 4 characters.' }
    if (data.password.length < limits.passwordMin) return { ok: false, error: 'Room password must be at least 4 characters.' }
    if (data.password.length > limits.passwordMax) return { ok: false, error: 'Room password is too long.' }

    const name = sanitizeName(data.name) || `Guest-${1000 + Math.floor(Math.random() * 9000)}`
    let id = genRoomId()
    while (this.rooms.has(id)) id = genRoomId()

    const room = {
      id,
      password: String(data.password),
      createdBy: name,
      createdAt: Date.now(),
      members: [{ name, socketId, online: true, readTs: Date.now() }],
      messages: [
        { id: `sys-${Date.now()}-${rand4()}`, text: `${name} created the room`, type: 'system', time: stamp(), ts: Date.now() },
      ],
      files: [],
      fileCount: 0,
      typing: {},
    }
    this.rooms.set(id, room)
    return { ok: true, id, name, room: this.snapshot(room) }
  }

  joinRoom(socketId, data = {}) {
    const baseErr = validationError(data)
    if (baseErr) return { ok: false, error: baseErr }
    const jErr = joinError(data.roomId, data.password)
    if (jErr) return { ok: false, error: jErr }

    const guard = this.joinGuards.get(socketId)
    if (guard && guard.unlockAt > Date.now()) {
      return { ok: false, error: 'Too many attempts. Try again in a moment.' }
    }

    const id = String(data.roomId).toUpperCase()
    const room = this.rooms.get(id)
    if (!room) {
      this.recordJoinFail(socketId)
      return { ok: false, error: 'Room not found. Check the ID and try again.' }
    }
    if (room.password !== String(data.password)) {
      this.recordJoinFail(socketId)
      return { ok: false, error: 'Incorrect password.' }
    }

    this.joinGuards.delete(socketId)
    const member = this.addMember(room, sanitizeName(data.name), socketId)
    if (!member) return { ok: false, error: 'This room is full.' }

    room.messages.push({
      id: `sys-${Date.now()}-${rand4()}`,
      text: `${member.name} joined the room`,
      type: 'system',
      time: stamp(),
      ts: Date.now(),
    })
    this.capHistory(room)

    return { ok: true, id, name: member.name, room: this.snapshot(room) }
  }

  rejoinRoom(socketId, data = {}) {
    const roomId = String(data.roomId || '').toUpperCase()
    const name = sanitizeName(data.name)
    const room = this.rooms.get(roomId)
    if (!room || !name) return { ok: false }

    const member = room.members.find((m) => m.name === name)
    if (!member) return { ok: false }

    this.cancelRemoval(room.id, member.name)
    member.socketId = socketId
    member.online = true
    return { ok: true, id: room.id, room: this.snapshot(room) }
  }

  leaveRoom(socketId, data = {}) {
    const roomId = String(data.roomId || '').toUpperCase()
    const room = this.rooms.get(roomId)
    if (!room) return { ok: false, error: 'Room not found.' }

    const member = room.members.find((m) => m.socketId === socketId)
    if (member) {
      this.cancelRemoval(room.id, member.name)
      this.removeMember(room, member, true, 'left')
    }
    return { ok: true }
  }

  /**
   * A tab is closing (best-effort pagehide signal). Remove the member from
   * every room immediately so the others get an instant leave alert instead of
   * waiting out the disconnect grace period.
   */
  closeSession(socketId) {
    for (const room of this.rooms.values()) {
      const member = room.members.find((m) => m.socketId === socketId)
      if (!member) continue
      this.cancelRemoval(room.id, member.name)
      this.removeMember(room, member, true, 'tab-closed')
    }
  }

  destroyRoom(socketId, data = {}) {
    const roomId = String(data.roomId || '').toUpperCase()
    const room = this.rooms.get(roomId)
    if (!room) return { ok: false, error: 'Room not found.' }

    this.rooms.delete(roomId)
    for (const m of room.members) this.cancelRemoval(room.id, m.name)
    this.broadcast(roomId, null)
    return { ok: true }
  }

  // ── Messaging ──────────────────────────────────────────────────

  postMessage(socketId, data = {}) {
    const mErr = messageError(data.text)
    if (mErr) return { ok: false, error: mErr }
    const room = this.rooms.get(String(data.roomId || '').toUpperCase())
    if (!room || !this.isMember(room, socketId)) return { ok: false, error: 'You are not in this room.' }
    if (!this.consumeMessage(socketId)) return { ok: false, error: 'Slow down — you are sending too fast.' }

    const sender = this.memberName(room, socketId)
    room.messages.push({
      id: `msg-${Date.now()}-${rand4()}`,
      sender,
      text: data.text.trim(),
      type: 'message',
      time: stamp(),
      ts: Date.now(),
    })
    this.capHistory(room)
    return { ok: true, id: room.id, room: this.snapshot(room) }
  }

  deleteMessage(socketId, data = {}) {
    const room = this.rooms.get(String(data.roomId || '').toUpperCase())
    if (!room || !this.isMember(room, socketId)) return { ok: false, error: 'Room not found.' }
    const deleter = this.memberName(room, socketId)

    const idx = room.messages.findIndex((m) => m.id === data.messageId && m.type === 'message')
    if (idx === -1) return { ok: false, error: 'Message not found.' }
    if (room.messages[idx].sender !== deleter) return { ok: false, error: 'You can only delete your own messages.' }

    room.messages[idx] = {
      id: `sys-${Date.now()}-${rand4()}`,
      text: `${deleter} deleted their message`,
      type: 'system',
      time: stamp(),
      ts: Date.now(),
    }
    return { ok: true, id: room.id, room: this.snapshot(room) }
  }

  addFile(socketId, data = {}) {
    const room = this.rooms.get(String(data.roomId || '').toUpperCase())
    if (!room || !this.isMember(room, socketId)) return { ok: false, error: 'Room not found.' }
    const err = fileError(data.file)
    if (err) return { ok: false, error: err }
    if (!this.consumeMessage(socketId)) return { ok: false, error: 'Slow down.' }

    const sender = this.memberName(room, socketId)
    const f = data.file
    const newFile = {
      id: `file-${Date.now()}-${rand4()}`,
      name: String(f.name).trim(),
      size: Number(f.size) || 0,
      type: String(f.type || ''),
      dataUrl: String(f.dataUrl),
      sender,
      time: stamp(),
      ts: Date.now(),
    }
    room.files = room.files || []
    room.files.push(newFile)
    if (room.files.length > limits.fileMaxCount) room.files.shift()
    room.messages.push({
      id: `sys-${Date.now()}-${rand4()}`,
      text: `${sender} shared "${newFile.name}"`,
      type: 'system',
      fileRef: newFile.id,
      time: stamp(),
      ts: Date.now(),
    })
    this.capHistory(room)
    room.fileCount = room.files.length
    return { ok: true, room: this.snapshot(room) }
  }

  deleteFile(socketId, data = {}) {
    const room = this.rooms.get(String(data.roomId || '').toUpperCase())
    if (!room || !this.isMember(room, socketId)) return { ok: false, error: 'Room not found.' }
    const deleter = this.memberName(room, socketId)

    const file = (room.files || []).find((f) => f.id === data.fileRef)
    if (!file) return { ok: false, error: 'File not found.' }
    if (file.sender !== deleter) return { ok: false, error: 'You can only delete your own files.' }

    room.files = room.files.filter((f) => f.id !== data.fileRef)
    room.fileCount = room.files.length
    const idx = room.messages.findIndex((m) => m.fileRef === data.fileRef)
    if (idx !== -1) {
      room.messages[idx] = {
        id: `sys-${Date.now()}-${rand4()}`,
        text: `${deleter} deleted ${String(file.type).startsWith('image/') ? 'a photo' : 'a file'}`,
        type: 'system',
        time: stamp(),
        ts: Date.now(),
      }
    }
    return { ok: true, id: room.id, room: this.snapshot(room) }
  }

  setTyping(socketId, data = {}) {
    const room = this.rooms.get(String(data.roomId || '').toUpperCase())
    if (!room || !this.isMember(room, socketId)) return
    const sender = this.memberName(room, socketId)
    if (data.typing) room.typing[sender] = Date.now()
    else delete room.typing[sender]
    this.broadcast(room.id, room)
  }

  // ── Connection / presence ──────────────────────────────────────

  /**
   * Called when a socket drops. The member is kept for a short grace period so
   * a quick network blip can re-attach to the same seat on reconnect.
   */
  handleDisconnect(socketId) {
    for (const room of this.rooms.values()) {
      const member = room.members.find((m) => m.socketId === socketId)
      if (!member) continue
      member.online = false
      this.scheduleRemoval(room, member)
    }
  }

  addMember(room, rawName, socketId) {
    const clean = sanitizeName(rawName) || `Guest-${1000 + Math.floor(Math.random() * 9000)}`

    // Reconnect of a still-graceful member → take the same seat.
    const graceful = room.members.find((m) => m.name === clean && !m.online)
    if (graceful) {
      this.cancelRemoval(room.id, clean)
      graceful.socketId = socketId
      graceful.online = true
      return graceful
    }

    // Name already taken by an online member → append a counter.
    let finalName = clean
    let n = 2
    const taken = new Set(room.members.map((m) => m.name))
    while (taken.has(finalName)) {
      finalName = `${clean.slice(0, 14)}-${n}`
      n++
    }

    let member
    if (room.members.length >= limits.usersMaxPerRoom) {
      // Room is at capacity — evict the oldest offline member if one exists.
      const oldestOffline = room.members.find((m) => !m.online)
      if (!oldestOffline) {
        return null
      }
      this.cancelRemoval(room.id, oldestOffline.name)
      this.removeMember(room, oldestOffline, true, 'evicted')
    }
    member = { name: finalName, socketId, online: true, readTs: room.messages.at(-1)?.ts || Date.now() }
    room.members.push(member)
    return member
  }

  scheduleRemoval(room, member) {
    this.cancelRemoval(room.id, member.name)
    const timer = setTimeout(() => {
      this.removalTimers.delete(`${room.id}:${member.name}`)
      const current = this.rooms.get(room.id)
      const m = current?.members.find((x) => x.name === member.name)
      if (current && m && !m.online) {
        this.removeMember(current, m, true, 'dropped')
      }
    }, roomCfg.disconnectGraceMs)
    this.removalTimers.set(`${room.id}:${member.name}`, timer)
  }

  cancelRemoval(roomId, name) {
    const key = `${roomId}:${name}`
    const t = this.removalTimers.get(key)
    if (t) {
      clearTimeout(t)
      this.removalTimers.delete(key)
    }
  }

  removeMember(room, member, notify, reason = 'left') {
    const leave = {
      name: member.name,
      reason,
      unread: this.unreadFor(room, member),
      at: Date.now(),
    }
    room.members = room.members.filter((m) => m.name !== member.name)
    delete room.typing[member.name]

    if (room.members.length === 0) {
      this.rooms.delete(room.id)
      this.broadcast(room.id, null)
      return
    }

    room.messages.push({
      id: `sys-${Date.now()}-${rand4()}`,
      text: `${member.name} left the room`,
      type: 'system',
      time: stamp(),
      ts: Date.now(),
    })
    this.capHistory(room)
    if (notify) this.broadcast(room.id, room, leave)
  }

  // Read receipt: members tell the relay how far they've read so a later
  // leave event can say "X left before reading N messages".
  markRead(socketId, data = {}) {
    const roomId = String(data.roomId || '').toUpperCase()
    const room = this.rooms.get(roomId)
    if (!room) return { ok: false }
    const member = room.members.find((m) => m.socketId === socketId)
    if (!member) return { ok: false }
    const ts = Number(data.ts)
    if (Number.isFinite(ts) && ts > 0 && ts > (member.readTs || 0)) {
      member.readTs = ts
    }
    return { ok: true }
  }

  // Messages sent by other members after this member's last-read position.
  unreadFor(room, member) {
    return room.messages.filter(
      (m) => m.type === 'message' && Number(m.ts) > (member.readTs || 0) && m.sender !== member.name
    ).length
  }

  // ── Helpers ────────────────────────────────────────────────────

  isMember(room, socketId) {
    return !!room.members.find((m) => m.socketId === socketId)
  }

  memberName(room, socketId) {
    return room.members.find((m) => m.socketId === socketId)?.name || ''
  }

  capHistory(room) {
    if (room.messages.length > limits.messagesMax) {
      room.messages.splice(0, room.messages.length - limits.messagesMax)
    }
  }

  recordJoinFail(socketId) {
    const g = this.joinGuards.get(socketId) || { fails: 0, unlockAt: 0 }
    g.fails += 1
    if (g.fails >= rateLimit.joinMaxFails) {
      g.fails = 0
      g.unlockAt = Date.now() + rateLimit.joinLockMs
    }
    this.joinGuards.set(socketId, g)
  }

  consumeMessage(socketId) {
    const now = Date.now()
    const b = this.msgBuckets.get(socketId)
    if (!b || now >= b.resetAt) {
      this.msgBuckets.set(socketId, { n: 1, resetAt: now + rateLimit.messageWindowMs })
      return true
    }
    if (b.n < rateLimit.messageBurst) {
      b.n += 1
      return true
    }
    return false
  }

  /**
   * Periodic cleanup: expire rooms that outlived their maximum lifetime and
   * drop stale typing entries. Any fully empty room (safety) is destroyed.
   */
  sweepExpired() {
    const now = Date.now()
    for (const room of this.rooms.values()) {
      if (now - room.createdAt > roomCfg.maxLifetimeMs) {
        this.rooms.delete(room.id)
        for (const m of [...room.members]) this.cancelRemoval(room.id, m.name)
        this.broadcast(room.id, null)
        continue
      }
      for (const name of Object.keys(room.typing)) {
        if (now - room.typing[name] > 12_000) delete room.typing[name]
      }
      if (room.members.length === 0) {
        this.rooms.delete(room.id)
        this.broadcast(room.id, null)
      }
    }
  }
}