import { useState, useEffect } from 'react'
import { getRoomsDetailed, subscribe, destroyRoom, getUserName } from '../store'
import Shell from '../components/Shell'
import DestroyConfirm from '../components/DestroyConfirm'
import { maskId } from '../utils/mask'

function fmtDate(ts) {
  try {
    return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export default function Teams({ active, onNavigate, onOpenSettings, onOpenChat, onBackHome }) {
  const [rooms, setRooms] = useState(getRoomsDetailed())
  const [copiedId, setCopiedId] = useState('')
  const [endTarget, setEndTarget] = useState(null)

  useEffect(() => {
    return subscribe(() => setRooms(getRoomsDetailed()))
  }, [])

  useEffect(() => {
    if (!copiedId) return
    const t = setTimeout(() => setCopiedId(''), 1600)
    return () => clearTimeout(t)
  }, [copiedId])

  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id)
      setCopiedId(id)
    } catch {}
  }

  const left = (
    <aside className="hidden lg:flex w-[300px] xl:w-[340px] bg-white/[0.04] backdrop-blur-2xl border-r border-white/10 flex flex-col flex-shrink-0">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4169E1]/70 to-[#7C3AED]/70 border border-white/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Teams</h1>
          <p className="text-xs text-white/45">Shared rooms & people</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-3">
        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <p className="text-xs text-white/50 leading-relaxed">
            Every active room acts like a team channel. Rooms are open while at least
            one person is inside and disappear when the last member leaves.
          </p>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-[10px] text-white/30 leading-relaxed">
          Team = room. Private, temporary, no accounts required.
        </p>
      </div>
    </aside>
  )

  return (
    <Shell userName={getUserName()} active={active} onNavigate={onNavigate} onOpenSettings={onOpenSettings} onBackHome={onBackHome} left={left}>
      <div className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="w-full max-w-3xl mx-auto animate-[fadeUp_.4s_ease]">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-2">Your teams</h2>
          <p className="text-sm text-white/50 mb-8">
            {rooms.length} active {rooms.length === 1 ? 'room' : 'rooms'} across this browser.{' '}
            <span className="text-[#c4b5fd]">Signed in as {getUserName() || 'Guest'}</span>
          </p>

          {rooms.length === 0 ? (
            <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-2xl p-12 text-center">
              <svg className="w-12 h-12 mx-auto text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm text-white/50 font-medium mt-4">No teams yet</p>
              <p className="text-xs text-white/30 mt-1">Create a room in Chat and it becomes a team.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((r) => (
                <div key={r.id} className="bg-white/[0.05] backdrop-blur-2xl border border-white/10 rounded-2xl p-5 hover:border-white/20 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#4169E1]/80 to-[#7C3AED]/80 border border-white/20 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                      {r.id[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-semibold text-white tracking-widest">{maskId(r.id)}</span>
                        <span className="text-[10px] bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#c4b5fd] px-2 py-0.5 rounded-full">
                          {r.users.length} {r.users.length === 1 ? 'member' : 'members'}
                        </span>
                        <span className="text-[10px] bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Ephemeral
                        </span>
                      </div>
                      <p className="text-xs text-white/45 truncate mt-0.5">
                        Created by {r.createdBy} · {fmtDate(r.createdAt)}
                        {r.fileCount > 0 && <> · {r.fileCount} file{r.fileCount === 1 ? '' : 's'}</>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <div className="flex -space-x-2">
                      {r.users.map((u, i) => (
                        <div
                          key={u + i}
                          title={u}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#0d0d1a]"
                          style={{ background: i % 2 ? 'linear-gradient(135deg,#4169E1,#7C3AED)' : 'linear-gradient(135deg,#2563EB,#4169E1)' }}
                        >
                          {u.trim()[0].toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-white/40 truncate">
                      {r.users.join(', ')}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4 flex-wrap">
                    <button
                      onClick={() => onOpenChat(r.id)}
                      className="bg-gradient-to-r from-[#4169E1] to-[#7C3AED] hover:from-[#5e83f5] hover:to-[#4169E1] text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-lg shadow-[#4169E1]/30"
                    >
                      Open in Chat
                    </button>
                    <button
                      onClick={() => copyId(r.id)}
                      className={`border text-xs font-semibold px-4 py-2 rounded-lg transition ${
                        copiedId === r.id
                          ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                          : 'border-white/10 bg-white/[0.06] text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {copiedId === r.id ? 'Copied!' : 'Copy ID'}
                    </button>
                    <button
                      onClick={() => setEndTarget(r.id)}
                      className="border border-red-500/25 bg-red-500/15 text-red-300 hover:bg-red-500/25 text-xs font-semibold px-4 py-2 rounded-lg transition"
                    >
                      End room
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {endTarget && (
        <DestroyConfirm
          roomId={endTarget}
          onCancel={() => setEndTarget(null)}
          onConfirm={() => {
            destroyRoom(endTarget, getUserName())
            setEndTarget(null)
          }}
        />
      )}
    </Shell>
  )
}