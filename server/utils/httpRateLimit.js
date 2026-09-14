// In-memory sliding-window rate limiter for plain HTTP traffic (static assets,
// bundle download). Socket traffic is throttled separately at the socket layer,
// so /socket.io requests are skipped here to avoid interfering with reconnect
// storms that are already handled by per-socket buckets.
export function createHttpRateLimit({ max, windowMs, trustProxy = false }) {
  const hits = new Map()

  // Opportunistically shed expired entries; keep the process alive purely for
  // this timer via unref().
  const pruner = setInterval(() => {
    const now = Date.now()
    for (const [key, rec] of hits) {
      if (now > rec.resetAt) hits.delete(key)
    }
  }, Math.max(1000, Math.floor(windowMs / 4)))
  pruner.unref?.()

  return function httpRateLimit(req, res, next) {
    if (String(req.url).startsWith('/socket.io')) return next()
    if (req.method === 'OPTIONS') return next()

    const ip = (trustProxy ? req.ip : req.socket.remoteAddress) || 'unknown'
    const now = Date.now()
    const rec = hits.get(ip)
    if (!rec || now >= rec.resetAt) {
      hits.set(ip, { n: 1, resetAt: now + windowMs })
      return next()
    }
    rec.n += 1
    if (rec.n > max) {
      const retryAfter = Math.max(1, Math.ceil((rec.resetAt - now) / 1000))
      res.setHeader('Retry-After', String(retryAfter))
      return res.status(429).json({ error: 'Too many requests. Please slow down and try again.' })
    }
    return next()
  }
}