// Single source of truth for the Content-Security-Policy, shared by the
// production relay (served as an HTTP header) and the Vite build (injected as
// a <meta> tag so the static files are equally strict even served elsewhere).
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  // The app ships no inline scripts; everything is a hashed static asset.
  'script-src': ["'self'"],
  // Tailwind v4 injects an inline style tag, so styles stay 'unsafe-inline'.
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'", 'data:'],
  // Same-origin covers the Socket.IO websocket and long-poll transports.
  'connect-src': ["'self'"],
  'worker-src': ["'self'", 'blob:'],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'object-src': ["'none'"],
}

export function cspPolicyString() {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ')
}