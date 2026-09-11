import { useState } from 'react'
import Aurora from '../components/Aurora'
import DotField from '../components/DotField'
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
        <div className="w-full max-w-md animate-[fadeUp_.4s_ease]">
          {/* Back link */}
          <button
            onClick={onBack}
            className="text-xs text-white/40 hover:text-white/70 transition mb-6 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back to home
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#4169E1]/70 to-[#7C3AED]/70 border border-white/20 backdrop-blur-xl flex items-center justify-center shadow-xl shadow-[#4169E1]/30 mb-5">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-sm text-white/50 mt-2">
              Pick a guest identity to start chatting instantly.
            </p>
          </div>

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
            <div className="mb-5 bg-emerald-500/10 backdrop-blur-xl border border-emerald-400/25 rounded-xl p-4 animate-[fadeIn_.2s]">
              <p className="text-xs text-emerald-300 font-semibold mb-1">Welcome back</p>
              <p className="text-sm text-white">
                You already have an account as <span className="font-semibold text-[#c4b5fd]">{existing}</span>
              </p>
              <button
                onClick={onDone}
                className="mt-3 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold py-2 rounded-lg text-sm transition shadow-lg shadow-emerald-500/25"
              >
                Continue as {existing}
              </button>
            </div>
          )}

          {/* Quick guest option */}
          <div className="mb-5 bg-gradient-to-r from-[#4169E1]/15 to-[#7C3AED]/15 backdrop-blur-2xl border border-white/10 rounded-2xl p-5">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Quick start</p>
            <p className="text-sm text-white mb-4">
              Get a random guest identity in one click — no email, no sign-up.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={rollGuest}
                title="New random identity"
                className="p-2 rounded-lg bg-white/[0.06] border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16m10-16v16M3 6h18M3 18h18M3 6l4 1M7 18l4-1m3-11l4 1m0 10l4-1" />
                </svg>
              </button>
              <button
                onClick={handleGuest}
                disabled={busy}
                className="flex-1 bg-gradient-to-r from-[#4169E1] to-[#7C3AED] hover:from-[#5e83f5] hover:to-[#4169E1] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow-lg shadow-[#4169E1]/30"
              >
                Continue as Guest
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-[10px] text-white/35 uppercase tracking-wider">or choose your own name</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          {/* Custom name */}
          <div className="mb-8">
            <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
              Display Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Enter your name..."
                maxLength={20}
                className="flex-1 min-w-0 bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/60 transition"
              />
              <button
                onClick={handleCreate}
                disabled={!name.trim() || busy}
                className="bg-gradient-to-r from-[#4169E1] to-[#7C3AED] hover:from-[#5e83f5] hover:to-[#4169E1] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg text-sm transition shadow-lg shadow-[#4169E1]/30"
              >
                Create account
              </button>
            </div>
            <p className="text-[10px] text-white/35 mt-2">
              Your name is shown in rooms you create or join.
            </p>
          </div>

          {/* Privacy note */}
          <div className="flex items-start gap-2.5 text-xs text-white/40 leading-relaxed">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#c4b5fd]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p>
              Your name is stored in this browser only and can be deleted from Settings at any time.
            </p>
          </div>
        </div>
      </div>

      <SiteFooter onStart={onDone} />
    </div>
  )
}