export default function SiteFooter({ onStart }) {
  const link = 'block w-full text-left text-sm text-white/45 hover:text-white transition py-1'

  const go = (hash) => {
    if (hash.startsWith('#')) {
      const el = document.getElementById(hash.slice(1))
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4169E1]/80 to-[#7C3AED]/80 border border-white/20 flex items-center justify-center shadow-lg shadow-[#4169E1]/30">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.85L3 20l1.3-3.6C3.44 14.97 3 13.55 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-white tracking-tight">Ephemeral Chat</span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed mb-4 max-w-[220px]">
              Private, temporary chat that runs entirely in your browser. Nothing is stored, nothing is shared.
            </p>
            <div className="flex gap-3 mt-5">
              <span className="text-[10px] text-white/35 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> All systems local
              </span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-4">Product</h4>
            <nav className="flex flex-col items-start">
              <button className={link} onClick={onStart}>Start chatting</button>
              <button className={link} onClick={() => go('#features')}>Features</button>
              <button className={link} onClick={() => go('#how')}>How it works</button>
              <button className={link} onClick={() => go('#privacy')}>Privacy &amp; security</button>
            </nav>
          </div>

          {/* App */}
          <div>
            <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-4">In the app</h4>
            <nav className="flex flex-col items-start">
              <button className={link} onClick={onStart}>Chat rooms</button>
              <button className={link} onClick={onStart}>Teams</button>
              <button className={link} onClick={onStart}>Account &amp; data</button>
            </nav>
          </div>

          {/* Guarantees */}
          <div>
            <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-4">Guarantees</h4>
            <ul className="flex flex-col gap-2.5">
              {[
                { t: 'Zero storage', d: 'Nothing written to disk' },
                { t: 'Hidden rooms', d: 'No public lists, ever' },
                { t: 'Password-protected', d: 'Wrong key = denied' },
                { t: 'Auto-destroy', d: 'Gone when you leave' },
              ].map((g) => (
                <li key={g.t} className="flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 mt-0.5 text-emerald-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs text-white/50"><span className="text-white/80 font-medium">{g.t}</span> · {g.d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider + bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-white/35">
            © {new Date().getFullYear()} Ephemeral Chat · Made for private, temporary conversations.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-white/35">
            <span>Free · no accounts · no servers</span>
            <span className="hidden sm:inline text-white/15">|</span>
            <span>Local-only · expires on close</span>
          </div>
        </div>
      </div>
    </footer>
  )
}