import { useState, useEffect } from 'react'
import Lobby from './components/Lobby'
import Chat from './components/Chat'
import Home from './pages/Home'
import Signup from './pages/Signup'
import Teams from './pages/Teams'
import Settings from './pages/Settings'
import { getUserName, initChatStore } from './store'

export default function App() {
  const [stage, setStage] = useState('home')
  const [tab, setTab] = useState('chat')
  const [session, setSession] = useState(null)
  const [preselect, setPreselect] = useState(null)

  // The relay socket is only opened once the user actually enters the app —
  // the marketing page never touches the server.
  useEffect(() => {
    if (stage === 'app' || stage === 'signup') initChatStore()
  }, [stage])

  const startApp = () => setStage(getUserName() ? 'app' : 'signup')
  const signupDone = () => { setStage('app'); setTab('chat') }

  const openChat = (roomId) => {
    setSession(null)
    setPreselect(roomId)
    setTab('chat')
  }

  const openSettings = () => setTab('settings')

  const handleCleared = () => {
    setSession(null)
    setPreselect(null)
    setTab('chat')
    setStage('home')
  }

  if (stage === 'home') return <Home onStart={startApp} />
  if (stage === 'signup') return <Signup onDone={signupDone} onBack={() => setStage('home')} />

  const navProps = { active: tab, onNavigate: setTab, onOpenSettings: openSettings, onOpenChat: openChat }

  let body
  if (tab === 'chat') {
    body = session ? (
      <Chat
        key={session.roomId + session.name}
        roomId={session.roomId}
        displayName={session.name}
        onLeave={() => setSession(null)}
        {...navProps}
      />
    ) : (
      <Lobby
        key={preselect || 'home'}
        preselectRoom={preselect}
        onEnterRoom={(roomId, name) => setSession({ roomId, name })}
        {...navProps}
      />
    )
  } else if (tab === 'teams') {
    body = <Teams {...navProps} onOpenChat={openChat} />
  } else if (tab === 'settings') {
    body = <Settings {...navProps} onCleared={handleCleared} />
  }

  return <>{body}</>
}