const NAV_ICONS = [
  { id: 'chat', label: 'Chat', svg: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.85L3 20l1.3-3.6C3.44 14.97 3 13.55 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { id: 'teams', label: 'Teams', svg: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
]

function NavButton({ item, active, onNavigate, hideLabel }) {
  const isActive = item.id === active
  return (
    <button
      onClick={() => onNavigate(item.id)}
      title={item.label}
      aria-label={item.label}
      className={`flex items-center gap-1.5 sm:gap-2 h-9 px-2.5 sm:px-3.5 rounded-lg cursor-pointer transition ${
        isActive
          ? 'bg-gradient-to-br from-[#4169E1]/80 to-[#7C3AED]/80 border border-white/20 shadow-lg shadow-[#4169E1]/40'
          : 'hover:bg-white/10 border border-transparent'
      }`}
    >
      <svg className={`w-5 h-5 sm:w-[22px] sm:h-[22px] ${isActive ? 'text-white' : 'text-white/70'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d={item.svg} />
      </svg>
      <span className={`${isActive ? 'font-semibold' : 'font-medium'} text-xs sm:text-sm ${hideLabel ? 'hidden' : ''}`}>
        {item.label}
      </span>
    </button>
  )
}

export default function AppRail({ userName, active, onNavigate, onOpenSettings, onBackHome }) {
  const initial = userName.trim() ? userName.trim()[0].toUpperCase() : 'G'
  const label = userName.trim() || 'Guest'

  return (
    <header
      className="relative z-20 flex items-center gap-1 sm:gap-2 px-2 sm:px-4 h-14 flex-shrink-0 bg-white/[0.05] backdrop-blur-2xl border-b border-white/10 animate-[navIn_.45s_ease-out_both]"
      aria-label="Primary"
    >
      {/* Back to home */}
      <button
        onClick={() => onBackHome?.()}
        title="Back to home"
        aria-label="Back to home"
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition cursor-pointer mr-1 sm:mr-2"
      >
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" />
        </svg>
      </button>

      {/* Brand */}
      <button
        onClick={() => onNavigate('chat')}
        title="Ephemeral Chat — Home"
        className="flex items-center gap-2 mr-1 sm:mr-2 pl-1 pr-2 py-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
      >
        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4169E1]/70 to-[#7C3AED]/70 border border-white/20 flex items-center justify-center shadow-lg shadow-[#4169E1]/40">
          <svg className="w-4.5 h-4.5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.85L3 20l1.3-3.6C3.44 14.97 3 13.55 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </span>
        <span className="hidden md:block text-sm font-semibold tracking-wide text-white">
          Ephemeral
        </span>
      </button>

      {/* Primary navigation */}
      <nav className="flex items-center gap-1" aria-label="Sections">
        <NavButton item={NAV_ICONS[0]} active={active} onNavigate={onNavigate} />
        <NavButton item={NAV_ICONS[1]} active={active} onNavigate={onNavigate} hideLabel />
      </nav>

      <div className="flex-1" />

      {/* Settings + profile */}
      <button
        onClick={onOpenSettings}
        title="Settings"
        className={`flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg transition cursor-pointer ${
          active === 'settings'
            ? 'bg-gradient-to-br from-[#4169E1]/80 to-[#7C3AED]/80 border border-white/20 shadow-lg shadow-[#4169E1]/40'
            : 'hover:bg-white/10 border border-transparent'
        }`}
      >
        <svg className={`w-5 h-5 ${active === 'settings' ? 'text-white' : 'text-white/70'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="hidden sm:inline text-xs font-medium text-white/80">Settings</span>
      </button>

      <button
        onClick={onOpenSettings}
        title={`${label} · profile & settings`}
        className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-[#4169E1]/80 to-[#7C3AED]/80 text-white font-bold text-sm border border-white/20 backdrop-blur-md transition hover:brightness-110 cursor-pointer"
      >
        {initial}
      </button>
    </header>
  )
}