import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join('; ')

function buildSecurity() {
  return {
    name: 'build-security',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        `<meta http-equiv="Content-Security-Policy" content="${CSP}" />\n    </head>`
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), buildSecurity()],
  build: {
    sourcemap: false,
    reportCompressedSize: false,
    modulePreload: { polyfill: false },
  },
})
