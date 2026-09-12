import Aurora from './Aurora'
import AppRail from './AppRail'
import DotField from './DotField'
import useUserName from '../hooks/useUserName'
import { getPrefs } from '../store'

export default function Shell({ userName, active, onNavigate, onOpenSettings, left, children }) {
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
      <div className="relative z-10 flex w-full h-full min-w-0 flex-col md:flex-row">
        <AppRail
          userName={shownName}
          active={active}
          onNavigate={onNavigate}
          onOpenSettings={onOpenSettings}
        />
        {left}
        <main className="flex-1 min-w-0 flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          {children}
        </main>
      </div>
    </div>
  )
}