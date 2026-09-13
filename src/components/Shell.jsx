import { useState, useEffect } from 'react'
import Aurora from './Aurora'
import AppRail from './AppRail'
import DotField from './DotField'
import useUserName from '../hooks/useUserName'
import { getPrefs } from '../store'
import { onConnectionChange } from '../services/socket'

const STATUS_UI = {
  connected: { dot: 'bg-emerald-400', text: 'Relay live', title: 'Relay connected — rooms are in-memory only' },
  reconnecting: { dot: 'bg-amber-400 animate-pulse', text: 'Reconnecting', title: 'Connection lost — reconnecting…' },
  offline: { dot: 'bg-red-400', text: 'Relay offline', title: 'Relay unreachable' },
  connecting: { dot: 'bg-white/40', text: 'Connecting', title: 'Connecting to relay…' },
}

function ConnectionStatus() {
  const [status, setStatus] = useState('connecting')
  useEffect(() => onConnectionChange(setStatus), [])
  const s = STATUS_UI[status] || STATUS_UI.connecting
  return (
    <div
      className="absolute right-3 bottom-3 z-30 flex items-center gap-1.5 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full px-2.5 py-1 pointer-events-none select-none"
      title={s.title}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      <span className="text-[10px] font-medium text-white/60 whitespace-nowrap">{s.text}</span>
    </div>
  )
}

export default function Shell({ userName, active, onNavigate, onOpenSettings, onBackHome, left, children }) {
  const prefs = getPrefs()
  const liveName = useUserName()
  const shownName = liveName || userName || ''
  return (
    <div className="relative h-screen supports-[height:100dvh]:h-dvh w-full overflow-hidden bg-[#05050c] text-white">
      {prefs.aurora && <Aurora />}
      {prefs.dotField && (
        <div className="pointer-events-none absolute inset-0 z-[1]">
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
      <div className="relative z-10 flex w-full h-full min-w-0 flex-col">
        <AppRail
          userName={shownName}
          active={active}
          onNavigate={onNavigate}
          onOpenSettings={onOpenSettings}
          onBackHome={onBackHome}
        />
        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
          {left}
          <main className="flex-1 min-w-0 flex flex-col">
            {children}
          </main>
        </div>
      </div>
      <ConnectionStatus />
    </div>
  )
}