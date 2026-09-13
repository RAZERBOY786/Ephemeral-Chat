import { useRef } from 'react'

export default function SpotlightCard({ children, className = '' }) {
  const ref = useRef(null)

  const handleMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl transition duration-300 hover:border-white/25 hover:bg-white/[0.08] hover:shadow-2xl hover:shadow-[#7C3AED]/25 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(240px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(124,58,237,0.18), transparent 70%)',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/0 to-transparent transition-all duration-500 group-hover:via-[#7C3AED]/70" />
      {children}
    </div>
  )
}