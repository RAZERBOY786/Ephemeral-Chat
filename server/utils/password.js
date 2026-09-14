import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

// Room passwords are hashed with scrypt (salted) before they are held in RAM.
// Even a hostile peer with raw access to the process memory / a core dump
// cannot recover the plaintext password to reuse it in other rooms.
const KEYLEN = 64

export function hashPassword(password) {
  const salt = randomBytes(16)
  const hash = scryptSync(String(password), salt, KEYLEN)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

export function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex) return false
  let salt
  let expected
  try {
    salt = Buffer.from(saltHex, 'hex')
    expected = Buffer.from(hashHex, 'hex')
  } catch {
    return false
  }
  if (expected.length !== KEYLEN) return false
  const actual = scryptSync(String(password), salt, KEYLEN)
  return timingSafeEqual(expected, actual)
}