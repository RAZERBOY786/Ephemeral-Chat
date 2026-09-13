import { useState, useRef, useEffect } from 'react'
import { getRoom, postMessage, deleteMessage, deleteFile, leaveRoom, destroyRoom, subscribe, addFile, getPrefs, setTyping, markRead, getLastLeave } from '../store'
import Shell from './Shell'
import { playSendSound, playReplySound } from '../utils/sound'

const EMOJIS = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '🤩', '😎',
  '🥳', '😇', '🙃', '😌', '😴', '🤔', '🙄', '😏',
  '😢', '😭', '😡', '🥺', '😅', '🤗', '🤝', '👍',
  '👎', '👏', '🙏', '💪', '🎉', '❤️', '🔥', '✨',
  '🚀', '⭐', '💯', '✅', '❌', '❓', '⚠️', '🍕',
  '☕', '🌙', '🎁', '🖤',
]

function fmtBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function dayLabel(ts) {
  const d = new Date(ts)
  const now = new Date()
  const same = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (same(d, now)) return 'Today'
  const y = new Date(now)
  y.setDate(now.getDate() - 1)
  if (same(d, y)) return 'Yesterday'
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' })
}

const GROUP_GAP = 3 * 60 * 1000

// Combines messages into a chat-app-style layout: day dividers, consecutive
// bubbles from the same sender merged into a single group, system notes kept
// as separate centered pills.
function buildGroups(messages, roomCreatedAt) {
  const groups = []
  let lastDay = ''

  for (const m of messages) {
    const ms = Number(m.ts) || Number(roomCreatedAt) || Date.now()
    const d = new Date(ms)
    const dk = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (dk !== lastDay) {
      groups.push({ kind: 'divider', key: `day-${dk}`, ts: ms, label: dayLabel(ms) })
      lastDay = dk
    }

    if (m.type === 'system') {
      groups.push({ kind: 'system', key: m.id, msg: m })
      continue
    }

    const last = groups[groups.length - 1]
    if (last && last.kind === 'msg' && last.sender === m.sender && ms - last.lastTs <= GROUP_GAP) {
      last.msgs.push(m)
      last.lastTs = ms
    } else {
      groups.push({ kind: 'msg', key: `${m.id}-g`, sender: m.sender, msgs: [m], lastTs: ms })
    }
  }
  return groups
}

export default function Chat({ roomId, displayName, onLeave, active, onNavigate, onOpenSettings, onBackHome }) {
  const [room, setRoom] = useState(() => getRoom(roomId))
  const [input, setInput] = useState('')
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [confirmDestroy, setConfirmDestroy] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [fileNote, setFileNote] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [pendingDel, setPendingDel] = useState(null)
  const [nowTick, setNowTick] = useState(() => Date.now())
  const [leaveAlert, setLeaveAlert] = useState(null)

  const [incomingPulse, setIncomingPulse] = useState(null)

  const logRef = useRef(null)
  const inputRef = useRef(null)
  const fileRef = useRef(null)
  const lastRoomRef = useRef(roomId)
  const lastLenRef = useRef(0)
  const lastIncomingRef = useRef({ id: null, at: 0 })
  const typingSentRef = useRef(false)
  const lastLeaveAtRef = useRef(0)
  const origTitleRef = useRef(document.title)

  // Live sync
  useEffect(() => {
    return subscribe(() => {
      const r = getRoom(lastRoomRef.current)
      setRoom(r ? { ...r, users: [...r.users], messages: [...r.messages] } : null)
      if (!r) setShowDeleted(true)
      // Surface leave alerts: instant on tab close, plus "left before reading".
      const lv = getLastLeave(lastRoomRef.current)
      if (lv && lv.at > lastLeaveAtRef.current) {
        lastLeaveAtRef.current = lv.at
        if (lv.reason !== 'left' || lv.unread > 0) setLeaveAlert({ ...lv })
      }
    })
  }, [])

  // Auto-scroll + sound alert + pulse/vibrate on new messages
  useEffect(() => {
    const msgs = room?.messages
    if (!msgs) return
    const len = msgs.length
    if (len > lastLenRef.current) {
      const last = msgs[len - 1]
      if (last && last.type === 'message' && last.sender !== displayName) {
        if (getPrefs().sound) playReplySound()
        lastIncomingRef.current = { id: last.id, at: !Number.isNaN(performance.now()) ? performance.now() : 0 }
        try { navigator.vibrate?.(28) } catch {}
        if (document.hidden) {
          document.title = '💬 New message · Ephemeral Chat'
          setTimeout(() => { document.title = origTitleRef.current }, 3000)
        }
      }
    }
    lastLenRef.current = len
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
    markRead(lastRoomRef.current)
  }, [room?.messages?.length, room?.messages, displayName])

  // Leave alert auto-hides after a few seconds.
  useEffect(() => {
    if (!leaveAlert) return
    const t = setTimeout(() => setLeaveAlert(null), 8000)
    return () => clearTimeout(t)
  }, [leaveAlert])

  // Ticker: keeps typing indicator + dividers fresh AND drives the incoming
  // message glow pulse (state lives in a ref; setState happens async here).
  useEffect(() => {
    const t = setInterval(() => {
      setNowTick(Date.now())
      const { id, at } = lastIncomingRef.current
      if (id && performance.now() - at < 1600) setIncomingPulse(id)
      else setIncomingPulse(null)
    }, 500)
    return () => clearInterval(t)
  }, [])

  // Clear my typing flag when leaving the room / unmounting
  useEffect(() => {
    return () => setTyping(roomId, displayName, false)
  }, [roomId, displayName])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(t)
    }
  }, [copied])

  useEffect(() => {
    if (!fileNote) return
    const t = setTimeout(() => setFileNote(''), 3000)
    return () => clearTimeout(t)
  }, [fileNote])

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId)
      setCopied(true)
    } catch {}
  }

  const handleTyping = (typing) => {
    if (typing && typingSentRef.current) return
    if (typing) {
      typingSentRef.current = true
      setTimeout(() => { typingSentRef.current = false }, 700)
    }
    setTyping(roomId, displayName, typing)
  }

  const handleInputChange = (e) => {
    const v = e.target.value
    setInput(v)
    if (v.trim()) handleTyping(true)
    else handleTyping(false)
  }

  const handleSend = async () => {
    if (!input.trim()) return
    const res = await postMessage(roomId, displayName, input.trim())
    if (res && res.ok === false) return
    setInput('')
    handleTyping(false)
    if (getPrefs().sound) playSendSound()
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const pickEmoji = (emoji) => {
    setInput((v) => v + emoji)
    setShowEmoji(false)
    inputRef.current?.focus()
    handleTyping(true)
  }

  const confirmDelete = (msg) => {
    if (msg.fileRef) deleteFile(roomId, msg.fileRef, displayName)
    else deleteMessage(roomId, msg.id, displayName)
    setPendingDel(null)
  }

  const handleLeave = async () => {
    await leaveRoom(roomId, displayName)
    onLeave()
  }

  const handleDestroy = () => {
    destroyRoom(roomId, displayName)
    onLeave()
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const result = await addFile(roomId, displayName, {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: String(reader.result),
      })
      setFileNote(result.ok ? `Shared "${file.name}"` : result.error)
    }
    reader.onerror = () => setFileNote('Could not read that file.')
    reader.readAsDataURL(file)
  }

  if (showDeleted) {
    return (
      <Shell userName={displayName} active={active} onNavigate={onNavigate} onOpenSettings={onOpenSettings} onBackHome={onBackHome} left={null}>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 text-center animate-[fadeUp_.4s_ease]">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-500/15 border border-red-400/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white">Room Closed</h2>
            <p className="text-sm text-white/50 mt-2 leading-relaxed">
              Everyone left <span className="font-mono text-[#c4b5fd]">{roomId}</span>.
              The room and all of its messages were permanently destroyed.
            </p>
            <button
              onClick={onLeave}
              autoFocus
              className="mt-6 bg-gradient-to-r from-[#4169E1] to-[#7C3AED] hover:from-[#5e83f5] hover:to-[#4169E1] text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition shadow-lg shadow-[#4169E1]/30"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </Shell>
    )
  }

  // Live typing badge for this room
  const activeTypers = room
    ? Object.entries(room.typing || {})
        .filter(([n, ts]) => n !== displayName && nowTick - ts < 3200)
        .map(([n]) => n)
    : []
  const typingLabel = activeTypers.length
    ? activeTypers.length === 1
      ? `${activeTypers[0]} is typing`
      : `${activeTypers.join(', ')} are typing`
    : null

  const groups = room ? buildGroups(room.messages, room.createdAt) : []

  // Left pane: conversation list
  const left = (
    <aside className="hidden lg:flex w-[280px] xl:w-[320px] bg-white/[0.04] backdrop-blur-2xl border-r border-white/10 flex flex-col flex-shrink-0">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h1 className="text-xl font-semibold text-white">Chat</h1>
        <button
          onClick={copyRoomId}
          title="Copy room ID"
          className={`p-2 rounded-lg transition ${copied ? 'text-emerald-300 bg-emerald-500/15' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
        >
          {copied ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-3">
        {/* Current room — selected */}
        {room && (
          <div className="px-2">
            <div className="rounded-xl bg-white/[0.1] border border-white/15 shadow-lg shadow-black/20">
              <div className="flex items-center gap-3 px-3 py-3">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4169E1]/80 to-[#7C3AED]/80 border border-white/20 flex items-center justify-center text-white font-semibold text-sm">
                    {roomId[0]}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0d0d1a]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-white tracking-wider truncate">
                      {roomId}
                    </span>
                    <span className="text-[10px] text-white/45 flex-shrink-0">
                      {room.users.length} online
                    </span>
                  </div>
                  <p className="text-xs text-[#c4b5fd] truncate">You're in this room</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-5 py-4 space-y-3">
          <div className="bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-300 mb-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Zero persistence
            </p>
            <p className="text-[11px] text-white/45 leading-relaxed">
              Nothing in this room is ever written to storage. Close every tab
              and the conversation is gone for good.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-[10px] text-white/30 leading-relaxed">
          Join other rooms from the Home screen using their ID & password.
        </p>
      </div>
    </aside>
  )

  return (
    <Shell userName={displayName} active={active} onNavigate={onNavigate} onOpenSettings={onOpenSettings} onBackHome={onBackHome} left={left}>
      {/* Chat tab header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 bg-white/[0.04] backdrop-blur-2xl border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[#4169E1]/80 to-[#7C3AED]/80 border border-white/20 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-[#4169E1]/30">
              {roomId[0]}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#08080f]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-mono font-bold text-white text-base tracking-widest truncate min-w-0">
                {roomId}
              </h2>
              <span className="text-[10px] bg-white/[0.08] border border-white/10 text-white/50 px-2 py-0.5 rounded-full flex-shrink-0">
                {room?.users?.length || 1} members
              </span>
              <span
                className="hidden sm:inline-flex text-[10px] bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 px-2 py-0.5 rounded-full flex-shrink-0 items-center gap-1"
                title="Nothing in this room is ever stored"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Ephemeral
              </span>
            </div>
            <p className="text-xs truncate">
              {typingLabel ? (
                <span className="flex items-center gap-2 text-emerald-300 font-medium">
                  <span className="flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-[typingDot_1.2s_infinite]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-[typingDot_1.2s_infinite_.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-[typingDot_1.2s_infinite_.4s]" />
                  </span>
                  {typingLabel}…
                </span>
              ) : (
                room?.users?.length === 1
                  ? 'You are the only one here'
                  : `In the room with ${(room?.users || []).filter((u) => u !== displayName).join(', ')}`
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={copyRoomId}
            className="hidden sm:flex items-center gap-2 bg-white/[0.06] border border-white/10 hover:bg-white/10 text-white/60 hover:text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
          >
            {copied ? (
              <span className="flex items-center gap-1.5 text-emerald-300">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy ID
              </span>
            )}
          </button>
          <button
            onClick={copyRoomId}
            title={copied ? 'Copied!' : 'Copy room ID'}
            className={`sm:hidden p-2 rounded-lg transition ${copied ? 'text-emerald-300 bg-emerald-500/15' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
          >
            {copied ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setConfirmLeave(true)}
            className="flex items-center justify-center gap-1.5 bg-red-500/15 border border-red-400/20 text-red-300 hover:bg-red-500/25 text-xs font-semibold px-2.5 sm:px-3 py-2 rounded-lg transition backdrop-blur"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Leave</span>
          </button>
          <button
            onClick={() => setConfirmDestroy(true)}
            className="flex items-center justify-center gap-1.5 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-xs font-semibold px-2.5 sm:px-3 py-2 rounded-lg transition backdrop-blur"
            title="Destroy this room for everyone"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="hidden sm:inline">Destroy</span>
          </button>
        </div>
      </div>

      {/* Leave alert — shown when a member closes their tab or drops */}
      {leaveAlert && (
        <div className="flex items-center gap-2.5 px-4 sm:px-8 py-2.5 bg-amber-500/10 border-b border-amber-400/25 text-amber-200 animate-[fadeIn_.3s_ease] flex-shrink-0">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-xs font-medium flex-1 min-w-0 truncate">
            <span className="font-semibold">{leaveAlert.name}</span> left the chat
            {leaveAlert.unread > 0 && (
              <span className="text-amber-300">
                {' '}— left {leaveAlert.unread} message{leaveAlert.unread === 1 ? '' : 's'} unread
              </span>
            )}
          </span>
          <button
            onClick={() => setLeaveAlert(null)}
            className="p-1 rounded-md text-amber-200/60 hover:text-amber-200 hover:bg-amber-400/10 transition flex-shrink-0"
            title="Dismiss"
            aria-label="Dismiss alert"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Message thread */}
      <div
        ref={logRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6"
      >
        {groups.map((group) => {
          if (group.kind === 'divider') {
            return (
              <div key={group.key} className="flex items-center gap-3 justify-center py-3 animate-[fadeUp_.45s_ease]">
                <div className="h-px bg-white/10 flex-1 max-w-[120px]" />
                <span className="text-[10px] text-white/40 uppercase tracking-widest">{group.label}</span>
                <div className="h-px bg-white/10 flex-1 max-w-[120px]" />
              </div>
            )
          }

          if (group.kind === 'system') {
            const msg = group.msg
            const fileCard = msg.fileRef ? (room.files || []).find((f) => f.id === msg.fileRef) : null
            const isImg = fileCard && String(fileCard.type).startsWith('image/')
            return (
              <div
                key={msg.id}
                className={`group flex flex-col items-center py-2 animate-[fadeIn_.3s] ${
                  pendingDel === msg.id ? 'ring-1 ring-red-400/30 rounded-2xl' : ''
                }`}
              >
                <span className="text-[11px] italic text-white/50 bg-white/[0.05] border border-white/10 px-3 py-1 rounded-full backdrop-blur">
                  ★ {msg.text} · <span className="not-italic">{msg.time}</span>
                </span>
                {fileCard && (
                  <div className="mt-2 w-full max-w-[280px] bg-white/[0.06] border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl shadow-lg shadow-black/20">
                    {isImg ? (
                      <div className="relative">
                        <img
                          src={fileCard.dataUrl}
                          alt={fileCard.name}
                          className="w-full max-h-56 object-cover cursor-zoom-in"
                          onClick={() => window.open(fileCard.dataUrl, '_blank', 'noopener')}
                        />
                        <span className="absolute top-2 right-2 text-[10px] font-semibold bg-black/60 backdrop-blur px-2 py-0.5 rounded-full text-white/90">
                          {fileCard.name} · {fmtBytes(fileCard.size)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3">
                        <div className="w-9 h-9 rounded-lg bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-[#c4b5fd]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white truncate">{fileCard.name}</p>
                          <p className="text-[10px] text-white/40">{fmtBytes(fileCard.size)}</p>
                        </div>
                      </div>
                    )}
                    <div className="px-3 py-1.5 border-t border-white/10 text-center">
                      <a
                        href={fileCard.dataUrl}
                        download={fileCard.name}
                        className="text-[10px] font-semibold text-[#c4b5fd] hover:text-white transition"
                      >
                        Download file
                      </a>
                    </div>
                  </div>
                )}
                {fileCard && fileCard.sender === displayName && (
                  <div className="mt-1.5 flex flex-col items-center gap-1.5">
                    <button
                      onClick={() => setPendingDel(pendingDel === msg.id ? null : msg.id)}
                      title="Delete shared file"
                      className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                        pendingDel === msg.id
                          ? 'opacity-100 bg-red-500/20 border-red-400/30 text-red-300'
                          : 'opacity-0 group-hover:opacity-100 bg-white/[0.06] border-white/10 text-white/40 hover:text-red-300 hover:bg-red-500/15'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete photo
                    </button>
                    {pendingDel === msg.id && (
                      <div className="flex items-center gap-2 bg-red-500/10 border border-red-400/25 rounded-lg px-2.5 py-1.5 animate-[fadeIn_.15s]">
                        <span className="text-[10px] font-semibold text-red-200 whitespace-nowrap">Delete for everyone?</span>
                        <button
                          onClick={() => confirmDelete(msg)}
                          autoFocus
                          className="text-[10px] font-bold bg-red-500 hover:bg-red-400 text-white px-2 py-1 rounded transition"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setPendingDel(null)}
                          className="text-[10px] text-white/50 hover:text-white transition"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          }

          // Chat-app group: consecutive bubbles from the same sender
          const isSelf = group.sender === displayName
          const lastIdx = group.msgs.length - 1
          return (
            <div
              key={group.key}
              className={`group flex items-start gap-2.5 px-1 animate-[bubbleIn_.35s_ease-out_both] ${
                isSelf ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar — others only, aligned to the last bubble */}
              {!isSelf && (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4169E1]/70 to-[#7C3AED]/70 border border-white/20 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 self-end mb-1">
                  {group.sender[0].toUpperCase()}
                </div>
              )}

              <div className={`flex flex-col gap-[3px] max-w-[70%] ${isSelf ? 'items-end' : 'items-start'}`}>
                {!isSelf && (
                  <span className="ml-1.5 pt-1 text-[11px] font-medium text-[#c4b5fd]">
                    {group.sender}
                  </span>
                )}

                {group.msgs.map((msg, i) => {
                  const mSelf = isSelf
                  const rounded = mSelf
                    ? i === 0 ? 'rounded-tr-sm' : i === lastIdx ? 'rounded-br-sm' : ''
                    : i === 0 ? 'rounded-tl-sm' : i === lastIdx ? 'rounded-bl-sm' : ''
                  return (
                    <div key={msg.id} className={`flex flex-col ${mSelf ? 'items-end' : 'items-start'} animate-[bubbleIn_.4s_ease-out]`}>
                      <div className={`flex items-end gap-2 ${mSelf ? 'flex-row-reverse' : ''}`}>
                        <div
                          className={`px-3.5 py-2 text-sm leading-relaxed backdrop-blur-xl whitespace-pre-wrap break-words transition ${
                            pendingDel === msg.id
                              ? 'border border-red-400/40 bg-red-500/10 text-white/80 rounded-2xl'
                              : mSelf
                                ? `bg-gradient-to-br from-[#4169E1]/70 to-[#7C3AED]/70 border border-white/20 text-white rounded-2xl ${rounded} shadow-lg shadow-[#4169E1]/25`
                                : `bg-white/[0.07] border border-white/10 text-white/90 rounded-2xl ${rounded}`
                          } ${incomingPulse === msg.id ? 'animate-[msgPulse_1.6s_ease-out_2]' : ''}`}
                        >
                          {msg.text}
                          <span
                            className={`ml-2 inline-block align-bottom text-[10px] font-normal ${
                              mSelf ? 'text-white/70' : 'text-white/35'
                            }`}
                          >
                            {i === lastIdx ? msg.time : ''}
                          </span>
                        </div>
                        {mSelf && (
                          <button
                            onClick={() => setPendingDel(pendingDel === msg.id ? null : msg.id)}
                            title="Delete message"
                            className={`flex-shrink-0 mb-1 p-1.5 rounded-lg border transition ${
                              pendingDel === msg.id
                                ? 'opacity-100 bg-red-500/20 border-red-400/30 text-red-300'
                                : 'opacity-0 group-hover:opacity-100 bg-white/[0.06] border-white/10 text-white/40 hover:text-red-300 hover:bg-red-500/15'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {pendingDel === msg.id && (
                        <div className="mt-1 flex items-center gap-2 bg-red-500/10 border border-red-400/25 rounded-lg px-2.5 py-1.5 animate-[fadeIn_.15s]">
                          <span className="text-[10px] font-semibold text-red-200 whitespace-nowrap">Delete for everyone?</span>
                          <button
                            onClick={() => confirmDelete(msg)}
                            autoFocus
                            className="text-[10px] font-bold bg-red-500 hover:bg-red-400 text-white px-2 py-1 rounded transition"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setPendingDel(null)}
                            className="text-[10px] text-white/50 hover:text-white transition"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {!room?.messages?.length && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white/40">
              <div className="relative w-fit mx-auto mb-3">
                <span className="absolute inset-0 rounded-full bg-[#7C3AED]/30 blur-2xl animate-[heroGlow_3s_ease-in-out_infinite]" />
                <svg className="relative w-12 h-12 animate-[floaty_4s_ease-in-out_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.85L3 20l1.3-3.6C3.44 14.97 3 13.55 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs mt-1 text-white/30">Say hello to start the conversation.</p>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="relative px-4 sm:px-8 pb-5 pt-2 flex-shrink-0">
        <div className="flex items-center gap-2 bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-xl focus-within:ring-2 focus-within:ring-[#a78bfa]/50 transition px-3 py-1.5 shadow-lg shadow-black/10">
          <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
          <button
            onClick={() => fileRef.current?.click()}
            title="Share a file or image (max 800 KB)"
            className="flex-shrink-0"
          >
            <svg className="w-4 h-4 text-white/40 flex-shrink-0 cursor-pointer hover:text-white transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowEmoji((v) => !v)}
              title="Add emoji"
              className="text-[15px] leading-none cursor-pointer hover:scale-110 transition"
            >
              🙂
            </button>
            {showEmoji && (
              <>
                <div className="fixed inset-0 z-[45]" onClick={() => setShowEmoji(false)} />
                <div className="absolute bottom-full left-0 mb-2 z-50 w-72 max-w-[calc(100vw-3rem)] bg-[#0d0d1a]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-3 animate-[fadeUp_.15s_ease]">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => pickEmoji(e)}
                        className="text-lg leading-none p-1 rounded-lg hover:bg-white/10 hover:scale-125 active:scale-90 transition-all flex items-center justify-center"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                    <p className="text-[10px] text-white/35">Tap to insert</p>
                    <button
                      onClick={() => setShowEmoji(false)}
                      className="text-[10px] font-semibold text-white/50 hover:text-white transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a new message..."
            maxLength={500}
            className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-white/40 py-2 focus:outline-none resize-none overflow-y-auto max-h-[132px] leading-snug [field-sizing:content]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            title="Send"
            className="p-1.5 rounded-md bg-gradient-to-r from-[#4169E1] to-[#7C3AED] hover:from-[#5e83f5] hover:to-[#4169E1] disabled:opacity-40 disabled:cursor-not-allowed text-white transition flex-shrink-0 shadow-lg shadow-[#4169E1]/30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-[9px] text-white/25 mt-1.5 text-center">
          {fileNote ? <span className="text-[#c4b5fd]">{fileNote}</span> : 'Messages, photos and files disappear forever when the last person leaves.'}
        </p>
      </div>

      {/* Leave modal */}
      {confirmLeave && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setConfirmLeave(false)}>
          <div
            className="bg-[#0d0d1a]/85 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-[fadeUp_.2s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white">Leave room?</h3>
            <p className="text-sm text-white/60 mt-2 leading-relaxed">
              You will exit <span className="font-mono text-[#c4b5fd]">{roomId}</span>.
            </p>
            {room?.users?.length === 1 && (
              <p className="text-sm text-red-300 mt-2 flex items-center gap-1.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                You are the last person here. Leaving will permanently destroy the room and all messages.
              </p>
            )}
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setConfirmLeave(false)}
                className="flex-1 bg-white/[0.06] border border-white/10 hover:bg-white/10 text-white/80 font-semibold py-2.5 rounded-xl text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLeave}
                autoFocus
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-lg shadow-red-500/25"
              >
                {room?.users?.length === 1 ? 'Destroy & Leave' : 'Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Destroy modal */}
      {confirmDestroy && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setConfirmDestroy(false)}>
          <div
            className="bg-[#0d0d1a]/85 backdrop-blur-2xl border border-red-500/25 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-[fadeUp_.2s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-400/25 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Destroy room?</h3>
                <p className="text-xs text-white/50">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Room <span className="font-mono text-[#c4b5fd]">{roomId}</span> will be permanently deleted. Everyone inside will be kicked out immediately and all messages will be erased.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setConfirmDestroy(false)}
                className="flex-1 bg-white/[0.06] border border-white/10 hover:bg-white/10 text-white/80 font-semibold py-2.5 rounded-xl text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDestroy}
                autoFocus
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-lg shadow-red-500/25"
              >
                Destroy room
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  )
}