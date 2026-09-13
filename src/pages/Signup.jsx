import { useState } from 'react'
import Aurora from '../components/Aurora'
import DotField from '../components/DotField'
import Reveal from '../components/Reveal'
import SiteFooter from '../components/SiteFooter'
import { getPrefs, getUserName, saveUserName, genGuestName, sanitizeName } from '../store'

export default function Signup({ onDone, onBack }) {
  const prefs = getPrefs()
  const [name, setName] = useState(() => getUserName() || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const existing = getUserName()

  const handleGuest = () => {
    setBusy(true)
    const g = genGuestName()
    saveUserName(g)
    onDone()
  }

  const handleCreate = () => {
    setError('')
    const clean = sanitizeName(name)
    if (!clean) {
      setError('Enter a display name to continue.')
      return
    }
    setBusy(true)
    saveUserName(clean)
    onDone()
  }

  const rollGuest = () => {
    setError('')
    setName(genGuestName())
  }

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-[#05050c] text-white">
      {prefs.aurora && <Aurora />}
      {prefs.dotField && (
        <div className="pointer-events-none fixed inset-0 z-[1]">
          <DotField
            dotRadius={1.5}
            dotSpacing={16}
            bulgeStrength={55}
            glowRadius={180}
            sparkle={prefs.sparkle}
            waveAmplitude={0}
            gradientFrom="rgba(65, 105, 225, 0.40)"
            gradientTo="rgba(124, 58, 237, 0.28)"
            glowColor="#05050c"
          />
        </div>
      )}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Back link */}
          <div className="mb-6">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 hover:gap-2 transition-all duration-300"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              Back to home
            </button>
          </div>

          {/* Header */}
          <Reveal from="scale">
            <div className="text-center mb-8">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <span className="absolute inset-0 rounded-2xl bg-[#7C3AED]/40 blur-2xl animate-[heroGlow_3s_ease-in-out_infinite]" />
                <span className="absolute -inset-1 rounded-[1.15rem] border border-[#7C3AED]/40 animate-[pulseRing_2.8s_ease-out_infinite]" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4169E1]/70 to-[#7C3AED]/70 border border-white/20 backdrop-blur-xl flex items-center justify-center shadow-xl shadow-[#4169E1]/30">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Create your{' '}
                <span className="bg-gradient-to-r from-[#4169E1] via-[#7C3AED] to-[#4169E1] bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradientShift_6s_linear_infinite]">
                  account
                </span>
              </h1>
              <p className="text-sm text-white/50 mt-2">
                Pick a guest identity to start chatting instantly.
              </p>

              {/* Benefit chips */}
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {[
                  { t: 'No email', d: 'zero sign-up' },
                  { t: 'No tracking', d: 'local only' },
                  { t: 'Delete anytime', d: 'in Settings' },
                ].map((b, i) => (
                  <span
                    key={b.t}
                    style={{ animationDelay: `${i * 0.9}s` }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] text-white/60 animate-[floatyPill_5s_ease-in-out_infinite] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7C3AED]/40"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4169E1] to-[#7C3AED]" />
                    <span className="font-medium text-white/80">{b.t}</span>
                    <span className="text-white/35">{b.d}</span>
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Card */}
          <Reveal delay={150}>
            <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/40">
              <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#7C3AED] to-transparent" />

              {/* Error */}
              {error && (
                <div className="mb-5 bg-red-500/10 backdrop-blur-xl border border-red-400/25 text-red-300 text-xs px-4 py-3 rounded-xl flex items-center gap-3 animate-[fadeIn_.2s]">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Existing account callout */}
              {existing && (
                <div className="relative mb-5 bg-emerald-500/10 backdrop-blur-xl border border-emerald-400/25 rounded-2xl p-4 overflow-hidden animate-[fadeIn_.3s]">
                  <span className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-emerald-400/20 blur-2xl" />
                  <p className="text-xs text-emerald-300 font-semibold mb-1 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Welcome back
                  </p>
                  <p className="text-sm text-white">
                    You already have an account as <span className="font-semibold text-[#c4b5fd]">{existing}</span>
                  </p>
                  <button
                    onClick={onDone}
                    className="mt-3 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5"
                  >
                    Continue as {existing}
                  </button>
                </div>
              )}

              {/* Quick guest option */}
              <div className="group rounded-2xl border border-[#7C3AED]/25 bg-gradient-to-br from-[#4169E1]/15 to-[#7C3AED]/15 p-5 transition-all duration-300 hover:border-[#7C3AED]/50 hover:shadow-lg hover:shadow-[#7C3AED]/10">
                <p className="text-[11px] font-semibold text-[#c4b5fd] uppercase tracking-wider mb-1.5">Quick start</p>
                <p className="text-sm text-white/70 mb-4">
                  Get a random guest identity in one click — no email, no sign-up.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={rollGuest}
                    title="New random identity"
                    className="p-2.5 rounded-lg bg-white/[0.08] border border-white/10 hover:bg-white/10 text-white/60 hover:text-white hover:rotate-180 transition-all duration-300 flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16m10-16v16M3 6h18M3 18h18M3 6l4 1M7 18l4-1m3-11l4 1m0 10l4-1" />
                    </svg>
                  </button>
                  <button
                    onClick={handleGuest}
                    disabled={busy}
                    className="relative flex-1 bg-gradient-to-r from-[#4169E1] to-[#7C3AED] hover:from-[#5e83f5] hover:to-[#4169E1] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-all duration-300 shadow-lg shadow-[#4169E1]/30 hover:shadow-[#7C3AED]/50 hover:-translate-y-0.5 overflow-hidden"
                  >
                    <span className="pointer-events-none absolute inset-y-0 w-16 bg-white/20 blur-md animate-[shimmer_2.5s_ease-in-out_infinite]" />
                    Continue as Guest
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-[10px] text-white/35 uppercase tracking-wider">or choose your own name</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              {/* Custom name */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
                  Display Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    placeholder="Enter your name..."
                    maxLength={20}
                    className="peer w-full bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/60 focus:border-[#7C3AED]/50 transition-all duration-300"
                  />
                  <span className="pointer-events-none absolute inset-x-4 bottom-0 h-px scale-x-0 origin-left bg-gradient-to-r from-[#4169E1] to-[#7C3AED] transition-transform duration-500 peer-focus:scale-x-100" />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-white/35">
                    Shown in rooms you create or join.
                  </p>
                  <span className="font-mono text-[10px] text-white/30">{name.length}/20</span>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || busy}
                  className="relative mt-3 w-full bg-gradient-to-r from-[#4169E1] to-[#7C3AED] hover:from-[#5e83f5] hover:to-[#4169E1] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all duration-300 shadow-lg shadow-[#4169E1]/30 hover:shadow-[#7C3AED]/50 hover:-translate-y-0.5 overflow-hidden"
                >
                  <span className="pointer-events-none absolute inset-y-0 w-16 bg-white/20 blur-md animate-[shimmer_2.5s_ease-in-out_infinite]" />
                  Create account
                </button>
              </div>

              {/* Privacy note */}
              <div className="flex items-start gap-2.5 text-xs text-white/40 leading-relaxed rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#c4b5fd]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p>
                  Your name is stored in this browser only and can be deleted from Settings at any time.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <SiteFooter onStart={onDone} />
    </div>
  )
}