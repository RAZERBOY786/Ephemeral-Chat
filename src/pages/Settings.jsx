import { useState } from 'react'
import {
  getUserName,
  saveUserName,
  deleteAccount,
  getAccountCreated,
  sanitizeName,
  isGuestName,
  getPrefs,
  savePrefs,
} from '../store'
import Shell from '../components/Shell'

function fmtDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
}

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full relative transition flex-shrink-0 ${
        on ? 'bg-gradient-to-r from-[#4169E1] to-[#7C3AED]' : 'bg-white/10 border border-white/15'
      }`}
      role="switch"
      aria-checked={on}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
          on ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'appearance', label: 'Appearance', icon: 'M4 6h16M4 12h16M4 18h10' },
  { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { id: 'privacy', label: 'Privacy & security', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { id: 'about', label: 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
]

export default function Settings({ active, onNavigate, onOpenSettings, onCleared }) {
  const [section, setSection] = useState('profile')
  const [name, setName] = useState(() => getUserName() || '')
  const [prefs, setPrefs] = useState(() => getPrefs())
  const [savedMsg, setSavedMsg] = useState('')
  const [nameErr, setNameErr] = useState('')
  const [delArmed, setDelArmed] = useState(false)

  const togglePref = (key) => {
    const next = { ...prefs, [key]: !prefs[key] }
    savePrefs(next)
    setPrefs(next)
  }

  const saveName = () => {
    const clean = sanitizeName(name)
    if (!clean) {
      setNameErr('Your display name cannot be empty.')
      return
    }
    setNameErr('')
    setName(clean)
    saveUserName(clean)
    setSavedMsg('Saved ✓')
    setTimeout(() => setSavedMsg(''), 1800)
  }

  const handleDeleteAccount = () => {
    if (!delArmed) return setDelArmed(true)
    deleteAccount()
    setName('')
    onCleared()
  }

  const left = (
    <aside className="w-[300px] xl:w-[340px] bg-white/[0.04] backdrop-blur-2xl border-r border-white/10 flex flex-col flex-shrink-0">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4169E1]/70 to-[#7C3AED]/70 border border-white/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Settings</h1>
          <p className="text-xs text-white/45">{getUserName() || 'Guest'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${
              section === s.id
                ? 'bg-white/[0.1] border border-white/15 shadow-lg shadow-black/20'
                : 'hover:bg-white/[0.06] border border-transparent'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              section === s.id ? 'bg-gradient-to-br from-[#4169E1]/70 to-[#7C3AED]/70' : 'bg-white/[0.06] border border-white/10'
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
              </svg>
            </div>
            <span className={`text-sm ${section === s.id ? 'text-white font-semibold' : 'text-white/70'}`}>
              {s.label}
            </span>
          </button>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-[10px] text-white/30 leading-relaxed">
          Settings are stored in this browser only and sync across your open tabs.
        </p>
      </div>
    </aside>
  )

  return (
    <Shell userName={name || getUserName()} active={active} onNavigate={onNavigate} onOpenSettings={onOpenSettings} left={left}>
      <div className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="w-full max-w-3xl mx-auto animate-[fadeUp_.4s_ease]">
          {/* Profile */}
          {section === 'profile' && (
            <>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-6">Profile</h2>
              <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4169E1] to-[#7C3AED] border-2 border-white/20 flex items-center justify-center text-2xl font-bold text-white">
                    {(name.trim() ? name.trim()[0] : 'Y').toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white/80">{name.trim() || getUserName() || 'Guest'}</p>
                      {isGuestName(name || getUserName()) && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#c4b5fd] bg-[#7C3AED]/20 border border-[#7C3AED]/30 px-1.5 py-0.5 rounded-full">
                          Guest
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">Your public display name across rooms</p>
                    <p className="text-[10px] text-white/35 mt-0.5">Member since {fmtDate(getAccountCreated())}</p>
                  </div>
                </div>
                <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Display name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value.slice(0, 20)); setNameErr('') }}
                    maxLength={20}
                    placeholder="Enter your name..."
                    className="flex-1 min-w-0 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/60 transition"
                  />
                  <button
                    onClick={saveName}
                    className={`bg-gradient-to-r px-5 py-2 rounded-lg text-sm font-semibold text-white transition shadow-lg shadow-[#4169E1]/30 ${
                      savedMsg ? 'from-emerald-500 to-emerald-600' : 'from-[#4169E1] to-[#7C3AED] hover:from-[#5e83f5] hover:to-[#4169E1]'
                    }`}
                  >
                    {savedMsg || 'Save'}
                  </button>
                </div>
                {nameErr && (
                  <p className="text-[11px] text-red-300 mt-2 flex items-center gap-1.5 animate-[fadeIn_.2s]">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {nameErr}
                  </p>
                )}
                <p className="text-[10px] text-white/35 mt-2">Used as the default name in the lobby whenever you create or join a room. Saves are applied everywhere instantly.</p>
              </div>

              <div className="mt-4 bg-red-500/[0.04] border border-red-500/20 rounded-2xl p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                      </svg>
                      Delete guest account
                    </p>
                    <p className="text-xs text-white/45 mt-1 leading-relaxed">
                      Removes your saved identity and returns to the home page as a fresh
                      guest. Rooms, files and activity are kept.
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    className={`text-xs font-semibold px-4 py-2 rounded-lg transition flex-shrink-0 ${
                      delArmed
                        ? 'bg-red-600 text-white'
                        : 'bg-red-500/15 border border-red-400/25 text-red-300 hover:bg-red-500/25'
                    }`}
                  >
                    {delArmed ? 'Confirm?' : 'Delete guest'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Appearance */}
          {section === 'appearance' && (
            <>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-6">Appearance</h2>
              <div className="space-y-4">
                <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Animated dot grid</p>
                      <p className="text-xs text-white/45 mt-0.5">Interactive dots that flow around your cursor.</p>
                    </div>
                    <Toggle on={prefs.dotField} onChange={() => togglePref('dotField')} />
                  </div>
                </div>
                <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Ambient glow</p>
                      <p className="text-xs text-white/45 mt-0.5">Drifting royal-blue and violet glow behind everything.</p>
                    </div>
                    <Toggle on={prefs.aurora} onChange={() => togglePref('aurora')} />
                  </div>
                </div>
                <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Dot sparkles</p>
                      <p className="text-xs text-white/45 mt-0.5">A few dots randomly sparkle at a larger size.</p>
                    </div>
                    <Toggle on={prefs.sparkle} onChange={() => togglePref('sparkle')} />
                  </div>
                </div>
                <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-5">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Theme</p>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#4169E1] border border-white/20" />
                    <span className="w-6 h-6 rounded-full bg-[#7C3AED] border border-white/20" />
                    <span className="w-6 h-6 rounded-full bg-[#05050c] border border-white/20" />
                    <p className="text-sm text-white/70">Royal Blue · Violet · Black</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notifications */}
          {section === 'notifications' && (
            <>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-6">Notifications</h2>
              <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Message sound</p>
                    <p className="text-xs text-white/45 mt-0.5">Plays a soft tone when someone sends you a message.</p>
                  </div>
                  <Toggle on={prefs.sound} onChange={() => togglePref('sound')} />
                </div>
              </div>
              <div className="mt-4 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-xs text-white/45 leading-relaxed">
                Your own messages never trigger a sound. Sounds stop immediately if the sound toggle is off.
              </div>
            </>
          )}

          {/* Privacy */}
          {section === 'privacy' && (
            <>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-6">Privacy & security</h2>
              <div className="bg-gradient-to-r from-emerald-500/10 to-[#4169E1]/10 border border-emerald-400/20 rounded-2xl p-5 flex items-center gap-4 mb-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-300">Security shield active</p>
                  <p className="text-xs text-white/50 mt-1">Stored nowhere · hidden rooms · password-gated · auto-destroy</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { t: 'Peer to peer only', d: 'Nothing is ever sent to a server. Rooms live only in browser memory and sync between your own open tabs.' },
                  { t: 'Nothing is stored', d: 'No message, file or room is ever written to localStorage. Chat data exists purely in RAM and disappears the moment every tab closes.' },
                  { t: 'Hidden rooms', d: 'Rooms are never listed publicly. Only people with the exact room ID and its password can discover or enter them.' },
                  { t: 'Password protected', d: 'Every room needs its password to join. Wrong password = access denied, duplicate names are rejected.' },
                  { t: 'Auto-destroy', d: 'When the last person leaves — or anyone presses Destroy — the room and all of its messages and files are permanently erased.' },
                  { t: 'Passwords never stored', d: 'Room passwords exist in memory only for the session. They are never written to disk and vanish when the page closes.' },
                  { t: 'Capped activity', d: 'The activity feed is a lightweight event log (no messages) capped at the latest 60 events and cleared whenever you clear local data.' },
                ].map((row) => (
                  <div key={row.t} className="bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {row.t}
                    </p>
                    <p className="text-xs text-white/50 mt-1.5 leading-relaxed ml-6">{row.d}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* About */}
          {section === 'about' && (
            <>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-6">About</h2>
              <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#4169E1] to-[#7C3AED] border border-white/20 flex items-center justify-center shadow-xl shadow-[#4169E1]/30">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.85L3 20l1.3-3.6C3.44 14.97 3 13.55 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-white mt-4">Ephemeral Chat</h1>
                <p className="text-xs text-white/45 mt-1">Private, temporary rooms that vanish when you leave.</p>
                <p className="text-xs text-white/35 mt-2 font-mono">Version 1.0.0</p>
              </div>

              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-4">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Built with</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['React 19', 'Vite 8', 'Tailwind CSS 4', 'Canvas', 'BroadcastChannel', 'Zero persistence'].map((t) => (
                      <span key={t} className="text-[10px] bg-white/[0.07] border border-white/10 text-white/70 px-2 py-1 rounded-md">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-4">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Core idea</p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Every room is a bubble in your browser. Say your piece, share your files, and close it —
                    it never existed.<br />
                  </p>
                </div>
              </div>

              <div className="mt-4 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-xs text-white/45 leading-relaxed">
                No accounts. No servers. No history. Nothing chat-related is ever saved to your browser's
                storage — everything lives in memory and is permanently destroyed the moment the last person
                leaves or every tab closes.
              </div>
            </>
          )}
        </div>
      </div>
    </Shell>
  )
}