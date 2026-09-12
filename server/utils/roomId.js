const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function genRoomId(length = 6) {
  let id = ''
  for (let i = 0; i < length; i++) {
    id += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return id
}

// Room IDs are uppercase alphanumeric (no I, O, 0, 1 to avoid confusion).
export function isValidRoomId(id) {
  return typeof id === 'string' && /^[A-Z2-9]{6}$/.test(id)
}