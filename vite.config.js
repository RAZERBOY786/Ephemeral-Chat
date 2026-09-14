import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { cspPolicyString } from './server/config/csp.js'

function buildSecurity() {
  return {
    name: 'build-security',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        `<meta http-equiv="Content-Security-Policy" content="${cspPolicyString()}" />\n    </head>`
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), buildSecurity()],
  server: {
    // Dev-only hardening. The real Content-Security-Policy header is served by
    // the production relay (helmet) and injected as a <meta> at build time.
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    },
    proxy: {
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
  build: {
    sourcemap: false,
    reportCompressedSize: false,
    modulePreload: { polyfill: false },
  },
})