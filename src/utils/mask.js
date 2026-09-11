export function maskId(id) {
  if (!id) return ''
  return id.length <= 3 ? id : `${id.slice(0, 3)}•••`
}