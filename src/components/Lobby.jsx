import { useState, useEffect } from 'react'
import { createRoom, joinRoom, getUserName, saveUserName, genGuestName, deleteAccount, sanitizeName } from '../store'
import Reveal from './Reveal'
import Shell from './Shell'

export default function Lobby({ preselectRoom, onEnterRoom, active, onNavigate, onOpenSettings }) {
  const [name, setName] = useState(() => getUserName() || '')
  const [password, setPassword] = useState('')
  const [roomId, setRoomId] = useState(preselectRoom || '')
  const [roomPassword, setRoomPassword] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!error && !success) return
    const t = setTimeout(() => { setError(''); setSuccess('') }, 4500)
    return () => clearTimeout(t)
  }, [error, success])

  const clear = () => { setError(''); setSuccess('') }
  const validated = (raw) => {
    const clean = sanitizeName(raw)
    if (!clean) return { error: 'Enter your display name to continue.' }
    return { clean }
  }

  const handleCreate = async () => {
    clear()
    const v = validated(name)
    if (v.error) return setError(v.error)
    if (password.length < 4) return setError('Room password must be at least 4 characters.')

    setBusy(true)
    try {
      const result = await createRoom(password, v.clean)
      if (!result.ok) return setError(result.error || 'Could not create the room.')
      setSuccess(`Room ${result.id} created! Share this ID and your password.`)
      setPassword('')
      saveUserName(result.name)
      setName(result.name)
      onEnterRoom(result.id, result.name)
    } catch {
      setError('Could not create the room. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = async () => {
    clear()
    const v = validated(name)
    if (v.error) return setError(v.error)
    if (roomId.trim().length < 3) return setError('Select a room or enter a valid room ID.')
    if (!roomPassword) return setError('Enter the room password.')

    setBusy(true)
    try {
      const result = await joinRoom(roomId.trim().toUpperCase(), roomPassword, v.clean)
      if (!result.ok) return setError(result.error)
      saveUserName(result.name)
      setName(result.name)
      if (result.name !== v.clean) setSuccess(`Joined as ${result.name} — that name was already in the room.`)
      onEnterRoom(result.roomId || roomId.trim().toUpperCase(), result.name)
    } catch {
      setError('Could not join the room. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleGuest = () => {
    clear()
    const g = genGuestName()
    setName(g)
    saveUserName(g)
    setSuccess(`Guest account ready: ${g} — create or join a room to start.`)
  }

  const rollGuest = () => {
    clear()
    setName(genGuestName())
  }

  const handleRemoveGuest = () => {
    clear()
    deleteAccount()
    setName('')
    setRoomPassword('')
    setPassword('')
  }

  const isCreateValid = name.trim() && password.length >= 4
  const isJoinValid = name.trim() && roomId.trim().length >= 3 && roomPassword

  // Left pane: privacy panel (rooms are hidden by default)
  const left = (
    <aside className="hidden lg:flex w-[300px] xl:w-[340px] bg-white/[0.04] backdrop-blur-2xl border-r border-white/10 flex flex-col flex-shrink-0">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h1 className="text-xl font-semibold text-white">Home</h1>
        <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-emerald-300">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <p className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#c4b5fd]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 1.657 3.582 3 8 3s8-1.343 8-3V7M4 7c0 1.657 3.582 3 8 3s8-1.343 8-3M4 7c0-1.657 3.582-3 8-3s8 1.343 8 3" />
            </svg>
            Hidden rooms
          </p>
          <p className="text-xs text-white/50 leading-relaxed">
            Rooms never appear on this screen. Only people with the exact
            6-character ID and its password can join.
          </p>
        </div>

        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <p className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Never stored
          </p>
          <p className="text-xs text-white/50 leading-relaxed">
            No message, file or room is ever written to storage. Chat data
            lives purely in memory and is gone the moment every tab closes.
          </p>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-[10px] text-white/30 leading-relaxed">
          Privacy by default — share the ID and password only with your people.
        </p>
      </div>
    </aside>
  )

  return (
    <Shell userName={name} active={active} onNavigate={onNavigate} onOpenSettings={onOpenSettings} left={left}>
      <div className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="w-full max-w-3xl mx-auto">
          {/* Welcome header */}
          <Reveal>
            <div className="flex items-center gap-4 mb-8">
              <div className="relative">
                <span className="absolute inset-0 rounded-2xl bg-[#7C3AED]/35 blur-xl animate-[heroGlow_3s_ease-in-out_infinite]" />
                <span className="absolute -inset-1 rounded-[1.1rem] border border-[#7C3AED]/35 animate-[pulseRing_2.8s_ease-out_infinite]" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4169E1]/70 to-[#7C3AED]/70 border border-white/20 backdrop-blur-xl flex items-center justify-center shadow-xl shadow-[#4169E1]/30">
                  <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.85L3 20l1.3-3.6C3.44 14.97 3 13.55 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  <span className="bg-gradient-to-r from-[#4169E1] via-[#7C3AED] to-[#4169E1] bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradientShift_6s_linear_infinite]">
                    Ephemeral Chat
                  </span>
                </h1>
                <p className="text-sm text-white/50">
                  Private, temporary rooms. Everything is deleted on disconnect.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Alerts */}
          {error && (
            <div className="mb-5 bg-red-500/10 backdrop-blur-xl border border-red-400/25 text-red-300 text-sm px-4 py-3 rounded-xl flex items-center gap-3 animate-[fadeIn_.2s]">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs">{error}</span>
            </div>
          )}
          {success && !busy && (
            <div className="mb-5 bg-emerald-500/10 backdrop-blur-xl border border-emerald-400/25 text-emerald-300 text-sm px-4 py-3 rounded-xl flex items-center gap-3 animate-[fadeIn_.2s]">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs">{success}</span>
            </div>
          )}

          {/* Guest account quick-start */}
          <Reveal delay={100}>
            <div className="group mb-6 bg-gradient-to-r from-[#4169E1]/15 to-[#7C3AED]/15 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between transition-all duration-300 hover:border-[#7C3AED]/40 hover:shadow-xl hover:shadow-[#7C3AED]/10 hover:-translate-y-0.5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                    <svg className="w-5 h-5 text-[#c4b5fd]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="absolute -inset-1.5 -z-10 rounded-xl bg-[#7C3AED]/0 blur-md transition-all duration-300 group-hover:bg-[#7C3AED]/40" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Continue as Guest</p>
                  <p className="text-[11px] text-white/45">No sign-up — get a random identity and start instantly.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {name.startsWith('Guest-') && (
                  <button
                    onClick={handleRemoveGuest}
                    title="Delete this guest account"
                    className="p-2 rounded-lg bg-red-500/10 border border-red-400/20 hover:bg-red-500/20 text-red-300 transition flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={rollGuest}
                  title="New guest identity"
                  className="p-2 rounded-lg bg-white/[0.06] border border-white/10 hover:bg-white/10 text-white/60 hover:text-white hover:rotate-180 transition-all duration-300 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16m10-16v16M3 6h18M3 18h18M3 6l4 1M7 18l4-1m3-11l4 1m0 10l4-1" />
                  </svg>
                </button>
                <button
                  onClick={handleGuest}
                  className="bg-gradient-to-r from-[#4169E1] to-[#7C3AED] hover:from-[#5e83f5] hover:to-[#4169E1] text-white font-semibold px-5 py-2 rounded-lg text-sm transition-all duration-300 shadow-lg shadow-[#4169E1]/30 hover:-translate-y-0.5 whitespace-nowrap"
                >
                  Use guest account
                </button>
              </div>
            </div>
          </Reveal>

          {/* Display name */}
          <Reveal delay={200}>
            <div className="mb-6">
              <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
                Your Display Name
              </label>
              <div className="relative w-full sm:w-80 group/input">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); clear() }}
                  placeholder="Enter your name..."
                  maxLength={20}
                  className="w-full bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/60 focus:border-[#7C3AED]/50 transition-all duration-300"
                />
                {name.startsWith('Guest-') && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#c4b5fd] bg-white/[0.08] border border-white/10 px-2 py-0.5 rounded-full pointer-events-none">
                    GUEST
                  </span>
                )}
              </div>
            </div>
          </Reveal>

          {/* Action cards */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* Create card */}
            <Reveal delay={300}>
              <div className="group h-full bg-white/[0.06] backdrop-blur-2xl rounded-2xl border border-white/10 p-6 hover:border-[#7C3AED]/40 hover:bg-white/[0.08] hover:shadow-xl hover:shadow-[#7C3AED]/10 transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4169E1]/60 to-[#7C3AED]/60 border border-white/15 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="absolute -inset-1.5 -z-10 rounded-xl bg-[#7C3AED]/0 blur-md transition-all duration-300 group-hover:bg-[#7C3AED]/30" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Start a new room</h2>
                    <p className="text-[11px] text-white/40">You get a 6-char ID + password to share</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clear() }}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    placeholder="Set a room password"
                    className="flex-1 min-w-0 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/60 transition"
                  />
                  <button
                    onClick={handleCreate}
                    disabled={!isCreateValid || busy}
                    className="bg-gradient-to-r from-[#4169E1] to-[#7C3AED] hover:from-[#5e83f5] hover:to-[#4169E1] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg text-sm transition-all duration-300 shadow-lg shadow-[#4169E1]/30 hover:-translate-y-0.5 whitespace-nowrap w-full sm:w-auto"
                  >
                    Create
                  </button>
                </div>
              </div>
            </Reveal>

            {/* Join card */}
            <Reveal delay={400}>
              <div className="group h-full bg-white/[0.06] backdrop-blur-2xl rounded-2xl border border-white/10 p-6 hover:border-[#7C3AED]/40 hover:bg-white/[0.08] hover:shadow-xl hover:shadow-[#7C3AED]/10 transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED]/40 to-[#4169E1]/40 border border-white/15 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span className="absolute -inset-1.5 -z-10 rounded-xl bg-[#7C3AED]/0 blur-md transition-all duration-300 group-hover:bg-[#7C3AED]/30" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Join a room</h2>
                    <p className="text-[11px] text-white/40">Enter the ID & password you were given</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => { setRoomId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)); clear() }}
                    placeholder="ID"
                    maxLength={6}
                    className="w-full sm:w-16 bg-white/[0.06] border border-white/10 rounded-lg px-2 py-2.5 text-sm font-mono text-white placeholder-white/35 tracking-widest focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/60 transition uppercase text-center"
                  />
                  <input
                    type="password"
                    value={roomPassword}
                    onChange={(e) => { setRoomPassword(e.target.value); clear() }}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                    placeholder="Password"
                    className="flex-1 min-w-0 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/60 transition"
                  />
                  <button
                    onClick={handleJoin}
                    disabled={!isJoinValid || busy}
                    className="bg-gradient-to-r from-[#4169E1] to-[#7C3AED] hover:from-[#5e83f5] hover:to-[#4169E1] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg text-sm transition-all duration-300 shadow-lg shadow-[#4169E1]/30 hover:-translate-y-0.5 whitespace-nowrap w-full sm:w-auto"
                  >
                    Join
                  </button>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Privacy note */}
          <Reveal delay={500}>
            <div className="mt-6 flex items-start gap-2.5 text-xs text-white/40 leading-relaxed">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#c4b5fd]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p>
                Nothing chat-related is ever stored. Conversations exist only in browser memory and are
                <span className="text-white font-medium"> permanently destroyed </span>
                the moment the last person leaves or every tab closes.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </Shell>
  )
}