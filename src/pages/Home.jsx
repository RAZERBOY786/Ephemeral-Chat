import Aurora from '../components/Aurora'
import DotField from '../components/DotField'
import SiteFooter from '../components/SiteFooter'
import { getPrefs } from '../store'

export default function Home({ onStart }) {
  const prefs = getPrefs()
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

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-16 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4169E1]/80 to-[#7C3AED]/80 border border-white/20 flex items-center justify-center shadow-lg shadow-[#4169E1]/40">
            <svg className="w-5 h-5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.85L3 20l1.3-3.6C3.44 14.97 3 13.55 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">Ephemeral Chat</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 lg:px-16 pt-12 pb-20 max-w-7xl mx-auto text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#4169E1]/70 to-[#7C3AED]/70 border border-white/20 backdrop-blur-xl flex items-center justify-center shadow-xl shadow-[#4169E1]/40 mb-8">
          <svg className="w-11 h-11 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.85L3 20l1.3-3.6C3.44 14.97 3 13.55 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight max-w-3xl mx-auto">
          Private chat that{' '}
          <span className="bg-gradient-to-r from-[#4169E1] to-[#7C3AED] bg-clip-text text-transparent">
            leaves nothing behind
          </span>
        </h1>
        <p className="text-lg text-white/55 mt-6 max-w-xl mx-auto leading-relaxed">
          Create a temporary room, share the ID with your people, say your piece,
          and leave — the conversation is gone the moment the last tab closes.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button
            onClick={onStart}
            className="bg-gradient-to-r from-[#4169E1] to-[#7C3AED] hover:from-[#5e83f5] hover:to-[#4169E1] text-white font-semibold px-8 py-3 rounded-xl text-base transition shadow-xl shadow-[#4169E1]/40 flex items-center gap-2"
          >
            Start now
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-10">
          {[
            { n: 'Zero storage', d: 'Nothing saved to disk' },
            { n: 'Hidden rooms', d: 'Private by default' },
            { n: 'No sign-ups', d: 'Guest accounts only' },
            { n: 'Auto-destroy', d: 'Gone when everyone leaves' },
          ].map((b) => (
            <div key={b.n} className="flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-white/70">{b.n}</span>
              <span className="text-[10px] text-white/40">{b.d}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 lg:px-16 py-20 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">What's inside</h2>
        <p className="text-sm text-white/50 text-center max-w-lg mx-auto mb-12">
          Everything runs in your browser. No servers, no accounts, no persistence.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { t: 'Pure in-memory chat', d: 'Messages and files live only in RAM. Close all tabs and the conversation is gone for good — nothing is ever written to storage.', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { t: 'Hidden rooms', d: "Rooms never appear in any public list. Share the 6-character ID and password only with your people.", icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
            { t: 'Guest accounts', d: 'Pick up a random identity in one click and start chatting — no email, no sign-up, no tracking.', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            { t: 'Share files', d: 'Drop images, documents or any file (up to 800 KB) directly into the chat — encrypted only by virtue of never being stored.', icon: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13' },
            { t: 'Teams & rooms', d: 'Manage every open room from the Teams page — open in chat, copy the ID to share, or destroy a room for everyone.', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
          ].map((f) => (
            <div key={f.t} className="bg-white/[0.05] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/[0.08] transition">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#4169E1]/60 to-[#7C3AED]/60 border border-white/15 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white">{f.t}</h3>
              <p className="text-xs text-white/45 mt-1.5 leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 px-6 lg:px-16 py-20 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-6 text-center">
          {[
            { n: '1', t: 'Start', d: 'Click "Start now" and pick up a guest identity — one click, no email required.' },
            { n: '2', t: 'Create or join', d: 'Set a password to create a new room, or enter a room ID and password someone shared with you.' },
            { n: '3', t: 'Chat & leave', d: 'Send messages, share files, and leave when done — the room destroys itself when the last person goes.' },
          ].map((s) => (
            <div key={s.n} className="bg-white/[0.05] backdrop-blur-2xl border border-white/10 rounded-2xl p-6">
              <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-[#4169E1]/80 to-[#7C3AED]/80 border border-white/20 flex items-center justify-center text-white font-bold mb-4 shadow-lg shadow-[#4169E1]/30">
                {s.n}
              </div>
              <h3 className="text-sm font-semibold text-white">{s.t}</h3>
              <p className="text-xs text-white/45 mt-1.5 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy & security */}
      <section id="privacy" className="relative z-10 px-6 lg:px-16 py-20 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">Privacy &amp; security</h2>
        <p className="text-sm text-white/50 text-center max-w-lg mx-auto mb-10">
          Built from the ground up to leave no trace.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { t: 'Zero persistence', d: 'No message, file or room is ever written to localStorage — nothing to extract, steal or recover.' },
            { t: 'Password-only access', d: 'Every room is gated by its password. Wrong answer = access denied, every time.' },
            { t: 'Hidden from discovery', d: 'Rooms are never listed publicly. Only the exact ID + password can find or join one.' },
            { t: 'Auto-destroy', d: 'When the last person leaves — or someone hits Destroy — the room and all content is gone.' },
            { t: 'In-memory only', d: 'Chat data exists purely in RAM and syncs between your own tabs via BroadcastChannel, not disk.' },
            { t: 'No accounts, no tracking', d: 'Guest identities are random and local. There are no emails, no passwords to store, no databases.' },
          ].map((c) => (
            <div key={c.t} className="bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {c.t}
              </p>
              <p className="text-xs text-white/50 mt-1.5 leading-relaxed ml-6">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <SiteFooter onStart={onStart} />
    </div>
  )
}