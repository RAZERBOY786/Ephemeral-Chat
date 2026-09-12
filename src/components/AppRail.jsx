const NAV_ICONS = [
  { id: 'chat', label: 'Chat', svg: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.85L3 20l1.3-3.6C3.44 14.97 3 13.55 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { id: 'teams', label: 'Teams', svg: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
]

export default function AppRail({ userName, active, onNavigate, onOpenSettings }) {
  const initial = userName.trim() ? userName.trim()[0].toUpperCase() : 'G'
  const label = userName.trim() || 'Guest'

  return (
    <>
      {/* Side rail — tablets & up */}
      <nav className="hidden md:flex w-[68px] bg-white/[0.05] backdrop-blur-2xl border-r border-white/10 flex-col items-center py-3 flex-shrink-0" aria-label="Primary">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4169E1]/70 to-[#7C3AED]/70 border border-white/20 flex items-center justify-center mb-6 shadow-lg shadow-[#4169E1]/40" title="Ephemeral Chat">
          <svg className="w-6 h-6 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.85L3 20l1.3-3.6C3.44 14.97 3 13.55 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>

        <div className="flex flex-col gap-1.5">
          {NAV_ICONS.map((item) => {
            const isActive = item.id === active
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={item.label}
                className={`w-12 h-12 rounded-lg flex items-center justify-center cursor-pointer transition ${
                  isActive
                    ? 'bg-gradient-to-br from-[#4169E1]/80 to-[#7C3AED]/80 border border-white/20 shadow-lg shadow-[#4169E1]/40'
                    : 'hover:bg-white/10 border border-transparent'
                }`}
              >
                <svg className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/70'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.svg} />
                </svg>
              </button>
            )
          })}
        </div>

        <div className="flex-1" />

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onOpenSettings}
            className={`w-12 h-12 rounded-lg flex items-center justify-center cursor-pointer transition ${
              active === 'settings'
                ? 'bg-gradient-to-br from-[#4169E1]/80 to-[#7C3AED]/80 border border-white/20 shadow-lg shadow-[#4169E1]/40'
                : 'hover:bg-white/10 border border-transparent'
            }`}
            title="Settings"
          >
            <svg className={`w-6 h-6 ${active === 'settings' ? 'text-white' : 'text-white/70'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <div className="flex flex-col items-center">
            <button
              onClick={onOpenSettings}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#4169E1]/80 to-[#7C3AED]/80 text-white font-bold text-sm border border-white/20 backdrop-blur-md transition hover:brightness-110"
              title={`${label} · profile & settings`}
            >
              {initial}
            </button>
            <span
              className="mt-1 max-w-[60px] text-[8px] leading-tight text-white/50 text-center truncate"
              title={label}
            >
              {label}
            </span>
          </div>
        </div>
      </nav>

      {/* Bottom nav — phones */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a16]/95 backdrop-blur-2xl border-t border-white/10 flex items-stretch justify-around px-1 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]"
        aria-label="Primary"
      >
        {NAV_ICONS.map((item) => {
          const isActive = item.id === active
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={item.label}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 min-w-[56px] transition ${
                isActive ? 'text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              <svg className={`w-[22px] h-[22px] ${isActive ? 'text-[#a78bfa]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.svg} />
              </svg>
              <span className={`text-[9px] leading-none ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
            </button>
          )
        })}

        <span className="w-px bg-white/10 mx-1 my-2" />

        <button
          onClick={onOpenSettings}
          title="Settings"
          className={`flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 min-w-[56px] transition ${
            active === 'settings' ? 'text-white' : 'text-white/50 hover:text-white'
          }`}
        >
          <svg className={`w-[22px] h-[22px] ${active === 'settings' ? 'text-[#a78bfa]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className={`text-[9px] leading-none ${active === 'settings' ? 'font-semibold' : 'font-medium'}`}>Settings</span>
        </button>

        <button
          onClick={onOpenSettings}
          title={`${label} · profile & settings`}
          className="flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 min-w-[56px]"
        >
          <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center bg-gradient-to-br from-[#4169E1]/80 to-[#7C3AED]/80 text-white font-bold text-[11px] border border-white/20">
            {initial}
          </span>
          <span className="text-[9px] leading-none text-white/60 max-w-[52px] truncate font-medium">{label.split(' ')[0]}</span>
        </button>
      </nav>
    </>
  )
}