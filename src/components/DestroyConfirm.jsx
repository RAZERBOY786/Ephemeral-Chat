export default function DestroyConfirm({ roomId, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCancel}>
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
            <h3 className="text-base font-bold text-white">End room?</h3>
            <p className="text-xs text-white/50">This cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-white/60 leading-relaxed">
          Room <span className="font-mono text-[#c4b5fd]">{roomId}</span> will be permanently deleted even if
          people are still inside. Everyone will be kicked out and all messages erased.
        </p>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 bg-white/[0.06] border border-white/10 hover:bg-white/10 text-white/80 font-semibold py-2.5 rounded-xl text-sm transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-lg shadow-red-500/25"
          >
            End room
          </button>
        </div>
      </div>
    </div>
  )
}