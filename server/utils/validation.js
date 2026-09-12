import { CONFIG } from '../config/security.js'
import { isValidRoomId } from './roomId.js'

const { limits } = CONFIG

export function sanitizeName(raw) {
  return String(raw || '')
    // eslint-disable-next-line no-control-regex -- intentionally strips control chars
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .trim()
    .slice(0, limits.nameMax)
}

export function validationError(data = {}) {
  if (!data || typeof data !== 'object') return 'Bad request.'

  const name = sanitizeName(data.name)
  if (!name) return 'Enter your display name to continue.'

  // Room creation / join password rules
  if (typeof data.password === 'string') {
    const plen = data.password.length
    if (plen < limits.passwordMin) return 'Room password must be at least 4 characters.'
    if (plen > limits.passwordMax) return 'Room password is too long.'
  }

  return null
}

export function messageError(text) {
  if (typeof text !== 'string') return 'Empty message.'
  const t = text.trim()
  if (!t) return 'Empty message.'
  if (t.length > limits.messageMax) return 'Message is too long.'
  return null
}

export function fileError(file = {}) {
  if (!file || typeof file !== 'object') return 'Invalid file.'
  if (!file.dataUrl || typeof file.dataUrl !== 'string') return 'Invalid file data.'
  if (file.dataUrl.length > limits.fileMaxBytes * 1.4) {
    return `File is too large (max ${Math.round(limits.fileMaxBytes / 1024)} KB).`
  }
  if (typeof file.name !== 'string' || !file.name.trim()) return 'Unnamed file.'
  if (file.name.trim().length > limits.fileNameMax) return 'File name is too long.'
  return null
}

export function joinError(roomId, password) {
  if (!isValidRoomId(String(roomId || ''))) {
    return 'Select a room or enter a valid room ID.'
  }
  if (typeof password !== 'string' || !password) {
    return 'Enter the room password.'
  }
  return null
}