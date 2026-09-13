import { useState, useEffect } from 'react'
import Aurora from '../components/Aurora'
import DotField from '../components/DotField'
import Reveal from '../components/Reveal'
import SiteFooter from '../components/SiteFooter'
import SpotlightCard from '../components/SpotlightCard'
import { getPrefs } from '../store'

export default function Home({ onStart }) {
  const prefs = getPrefs()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const sectionIds = ['features', 'how', 'privacy']
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' }
    )
    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

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
      <nav
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 animate-[navIn_.6s_ease-out_both] ${
          scrolled
            ? 'bg-[#05050C]/80 backdrop-blur-2xl border-b border-white/10 shadow-lg shadow-black/20'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="flex items-center justify-between gap-4 h-16">
            {/* Brand */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setMenuOpen(false)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="flex items-center gap-3 group"
              title="Back to top"
            >
              <div className="relative">
                <span className="absolute inset-0 rounded-lg bg-[#7C3AED]/40 blur-md opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[#4169E1] to-[#7C3AED] border border-white/15 flex items-center justify-center shadow-lg shadow-[#4169E1]/30 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  <svg className="w-4.5 h-4.5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.85L3 20l1.3-3.6C3.44 14.97 3 13.55 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-white tracking-tight transition-colors duration-300 group-hover:text-[#c4b5fd]">
                  Ephemeral
                </span>
                <span className="text-base font-bold bg-gradient-to-r from-[#4169E1] to-[#7C3AED] bg-clip-text text-transparent">
                  Chat
                </span>
              </div>
            </a>

            {/* Desktop section links */}
            <nav className="hidden md:flex items-center gap-7" aria-label="Sections">
              {[
                { label: 'Features', href: '#features' },
                { label: 'How it works', href: '#how' },
                { label: 'Privacy', href: '#privacy' },
              ].map((link) => {
                const isActive = active === link.href.slice(1)
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault()
                      setMenuOpen(false)
                      document.getElementById(link.href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    className="group relative pb-1"
                  >
                    <span
                      className={`text-[13px] font-medium tracking-wide transition-colors duration-300 ${
                        isActive ? 'text-white' : 'text-white/50 group-hover:text-white'
                      }`}
                    >
                      {link.label}
                    </span>
                    <span
                      className={`absolute left-0 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-[#4169E1] to-[#7C3AED] transition-all duration-300 ${
                        isActive ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'
                      }`}
                    />
                  </a>
                )
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={onStart}
                className="hidden sm:inline-flex items-center gap-2 border border-white/15 bg-white/[0.04] backdrop-blur hover:bg-gradient-to-r hover:from-[#4169E1] hover:to-[#7C3AED] hover:border-transparent hover:shadow-lg hover:shadow-[#7C3AED]/30 hover:text-white hover:-translate-y-0.5 text-white/80 text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-300"
              >
                <span className="hidden xl:inline">Start now</span>
                <span className="xl:hidden" title="Start now">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <svg className="hidden xl:block w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/10 transition"
              >
                {menuOpen ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="md:hidden pb-4 animate-[fadeUp_.2s_ease]">
              <div className="flex flex-col gap-1">
                {[
                  { label: 'Features', href: '#features' },
                  { label: 'How it works', href: '#how' },
                  { label: 'Privacy', href: '#privacy' },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault()
                      setMenuOpen(false)
                      document.getElementById(link.href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      active === link.href.slice(1)
                        ? 'bg-gradient-to-r from-[#4169E1]/25 to-[#7C3AED]/25 text-white border border-white/10'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  onStart()
                }}
                className="mt-3 w-full bg-gradient-to-r from-[#4169E1] to-[#7C3AED] hover:from-[#5e83f5] hover:to-[#4169E1] text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-all duration-300 shadow-lg shadow-[#7C3AED]/30 flex items-center justify-center gap-2"
              >
                Start now
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 lg:px-16 pt-24 sm:pt-28 pb-24 max-w-7xl mx-auto text-center">
        <Reveal from="scale">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <span className="absolute inset-0 rounded-3xl bg-[#7C3AED]/40 blur-2xl animate-[heroGlow_3.2s_ease-in-out_infinite]" />
            <span className="absolute -inset-1 rounded-[1.4rem] border border-[#7C3AED]/40 animate-[pulseRing_2.8s_ease-out_infinite]" />
            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#4169E1]/70 to-[#7C3AED]/70 border border-white/20 backdrop-blur-xl flex items-center justify-center shadow-xl shadow-[#4169E1]/40">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.85L3 20l1.3-3.6C3.44 14.97 3 13.55 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight max-w-3xl mx-auto">
            Private chat that{' '}
            <span className="bg-gradient-to-r from-[#4169E1] via-[#7C3AED] to-[#4169E1] bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradientShift_6s_linear_infinite]">
              leaves nothing behind
            </span>
          </h1>
        </Reveal>

        <Reveal delay={240}>
          <p className="text-lg text-white/55 mt-6 max-w-xl mx-auto leading-relaxed">
            Create a temporary room, share the ID with your people, say your piece,
            and leave — the conversation is gone the moment the last tab closes.
          </p>
        </Reveal>

        <Reveal delay={360}>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <button
              onClick={onStart}
              className="bg-gradient-to-r from-[#4169E1] to-[#7C3AED] hover:from-[#5e83f5] hover:to-[#4169E1] text-white font-semibold px-8 py-3 rounded-xl text-base transition-all duration-300 shadow-xl shadow-[#4169E1]/40 hover:shadow-[#7C3AED]/60 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 flex items-center gap-2 overflow-hidden relative"
            >
              <span className="pointer-events-none absolute inset-y-0 w-20 bg-white/20 blur-md animate-[shimmer_2.5s_ease-in-out_infinite]" />
              Start now
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </Reveal>

        <Reveal delay={480}>
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            {[
              { n: 'Zero storage', d: 'Nothing saved to disk' },
              { n: 'Hidden rooms', d: 'Private by default' },
              { n: 'No sign-ups', d: 'Guest accounts only' },
              { n: 'Auto-destroy', d: 'Gone when everyone leaves' },
            ].map((b, i) => (
              <div
                key={b.n}
                style={{ animationDelay: `${i * 1.1}s` }}
                className="flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-full px-4 py-1.5 animate-[floatyPill_5s_ease-in-out_infinite] transition-all duration-300 hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:shadow-lg hover:shadow-[#7C3AED]/20 cursor-default"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-medium text-white/70">{b.n}</span>
                <span className="text-[10px] text-white/40">{b.d}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 lg:px-16 py-24 max-w-7xl mx-auto">
        <div className="pointer-events-none absolute -top-24 right-0 w-96 h-96 rounded-full bg-[#7C3AED]/10 blur-[120px] animate-[orbFloat_9s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute bottom-0 -left-24 w-80 h-80 rounded-full bg-[#4169E1]/10 blur-[110px] animate-[orbFloat_11s_ease-in-out_infinite]" />

        <Reveal from="up">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a78bda] mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4169E1] to-[#7C3AED] animate-pulse" />
              What's inside
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Everything runs{' '}
              <span className="bg-gradient-to-r from-[#4169E1] to-[#7C3AED] bg-clip-text text-transparent">
                in your browser
              </span>
            </h2>
            <p className="text-sm text-white/50 max-w-lg mx-auto mt-4">
              No servers, no accounts, no persistence. Just tools that are gone the moment you are.
            </p>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { t: 'Pure in-memory chat', d: 'Messages and files live only in RAM. Close all tabs and the conversation is gone for good — nothing is ever written to storage.', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', tag: 'RAM only' },
            { t: 'Hidden rooms', d: "Rooms never appear in any public list. Share the 6-character ID and password only with your people.", icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', tag: 'Private by default' },
            { t: 'Guest accounts', d: 'Pick up a random identity in one click and start chatting — no email, no sign-up, no tracking.', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', tag: 'Zero sign-up' },
            { t: 'Share files', d: 'Drop images, documents or any file (up to 800 KB) directly into the chat — encrypted only by virtue of never being stored.', icon: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13', tag: 'Up to 800 KB' },
            { t: 'Teams & rooms', d: 'Manage every open room from the Teams page — open in chat, copy the ID to share, or destroy a room for everyone.', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', tag: 'Full control' },
          ].map((f, i) => (
            <Reveal key={f.t} delay={i * 90} className="h-full">
              <SpotlightCard className="h-full">
                <div className="relative flex h-full flex-col p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4169E1]/60 to-[#7C3AED]/60 border border-white/15 flex items-center justify-center shadow-lg shadow-[#4169E1]/30 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                        </svg>
                      </div>
                      <span className="absolute -inset-2 -z-10 rounded-2xl bg-gradient-to-br from-[#4169E1]/0 to-[#7C3AED]/0 blur-lg transition-all duration-500 group-hover:from-[#4169E1]/40 group-hover:to-[#7C3AED]/40" />
                    </div>
                    <span className="font-mono text-[11px] font-bold tracking-widest text-white/25 transition-colors duration-300 group-hover:text-[#a78bda]">
                      0{i + 1}
                    </span>
                  </div>
                  <span className="mb-2 inline-flex w-fit rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-white/45">
                    {f.tag}
                  </span>
                  <h3 className="text-sm font-semibold text-white">{f.t}</h3>
                  <p className="text-xs text-white/45 mt-2 leading-relaxed flex-1">{f.d}</p>
                  <div className="mt-5 h-px w-8 bg-gradient-to-r from-[#4169E1]/70 to-[#7C3AED]/70 transition-all duration-500 group-hover:w-24" />
                </div>
              </SpotlightCard>
            </Reveal>
          ))}

          {/* CTA card */}
          <Reveal from="scale" delay={450} className="h-full">
            <div className="group relative h-full overflow-hidden rounded-2xl border border-[#7C3AED]/40 bg-gradient-to-br from-[#4169E1]/20 via-[#7C3AED]/15 to-[#4169E1]/5 p-6 flex flex-col">
              <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#7C3AED]/30 blur-3xl transition-opacity duration-500 opacity-60 group-hover:opacity-100" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#7C3AED,transparent)] bg-[length:200%_100%] animate-[flowLine_4s_linear_infinite]" />
              <div className="flex-1">
                <p className="font-mono text-[11px] text-[#a78bda]/80 tracking-widest mb-3">▸ ready when you are</p>
                <h3 className="text-lg font-bold text-white leading-tight">
                  Ready to <span className="bg-gradient-to-r from-[#4169E1] to-[#7C3AED] bg-clip-text text-transparent">disappear?</span>
                </h3>
                <p className="text-xs text-white/50 mt-2 leading-relaxed">
                  Jump into a private room in about five seconds. No account, no trace, no pressure.
                </p>
              </div>
              <button
                onClick={onStart}
                className="mt-6 w-full bg-gradient-to-r from-[#4169E1] to-[#7C3AED] hover:from-[#5e83f5] hover:to-[#4169E1] text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all duration-300 shadow-xl shadow-[#7C3AED]/40 hover:shadow-[#7C3AED]/60 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Start chatting
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 px-6 lg:px-16 py-24 max-w-6xl mx-auto">
        <Reveal from="up">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a78bda] mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4169E1] to-[#7C3AED] animate-pulse" />
              How it works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Three steps to{' '}
              <span className="bg-gradient-to-r from-[#4169E1] to-[#7C3AED] bg-clip-text text-transparent">
                absolute privacy
              </span>
            </h2>
            <p className="text-sm text-white/50 max-w-lg mx-auto mt-4">
              From zero to vanished in under a minute.
            </p>
          </div>
        </Reveal>

        <div className="relative">
          {/* Animated connecting line */}
          <div className="hidden sm:block absolute left-[16.6%] right-[16.6%] top-9 h-[2px] rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-white/[0.06]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,#4169E1,#7C3AED,transparent)] bg-[length:200%_100%] animate-[flowLine_3.5s_linear_infinite]" />
          </div>

          <div className="grid sm:grid-cols-3 gap-12 sm:gap-8">
            {[
              { n: '1', pill: 'one click · no email', t: 'Start', d: 'Click "Start now" and pick up a guest identity — one click, no email required.' },
              { n: '2', pill: '6-char ID · password', t: 'Create or join', d: 'Set a password to create a new room, or enter a room ID and password someone shared with you.' },
              { n: '3', pill: 'auto-destroy', t: 'Chat & leave', d: 'Send messages, share files, and leave when done — the room destroys itself when the last person goes.' },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 140}>
                <div className="group relative text-center">
                  <div className="relative mx-auto mb-6" style={{ width: '4.75rem', height: '4.75rem' }}>
                    <span
                      className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#4169E1]/50 to-[#7C3AED]/50 blur-md opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    />
                    <span
                      className="absolute inset-0 rounded-full border border-[#7C3AED]/50"
                      style={{ animation: `pulseRing 3s ease-out ${i * 1}s infinite` }}
                    />
                    <span className="absolute inset-0 rounded-full bg-white/[0.05] border border-white/15 backdrop-blur-xl transition-all duration-500 group-hover:border-white/30" />
                    <span className="relative flex h-full w-full items-center justify-center text-2xl font-black text-transparent bg-gradient-to-br from-[#4169E1] to-[#7C3AED] bg-clip-text">
                      {s.n}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-medium text-white/50 transition-colors duration-300 group-hover:border-[#7C3AED]/40 group-hover:text-[#a78bda]">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    {s.pill}
                  </span>
                  <h3 className="text-base font-bold text-white mt-4 tracking-tight">{s.t}</h3>
                  <p className="text-xs text-white/45 mt-2 leading-relaxed max-w-[240px] mx-auto">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy & security */}
      <section id="privacy" className="relative z-10 px-6 lg:px-16 py-24 max-w-6xl mx-auto">
        <div className="pointer-events-none absolute top-10 -right-20 w-80 h-80 rounded-full bg-[#4169E1]/10 blur-[110px] animate-[orbFloat_10s_ease-in-out_infinite]" />

        <Reveal from="up">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a78bda] mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Guarantees
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Privacy &amp; security,{' '}
              <span className="bg-gradient-to-r from-[#4169E1] to-[#7C3AED] bg-clip-text text-transparent">
                by design
              </span>
            </h2>
            <p className="text-sm text-white/50 max-w-lg mx-auto mt-4">
              Built from the ground up to leave no trace.
            </p>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { t: 'Zero persistence', d: 'No message, file or room is ever written to localStorage — nothing to extract, steal or recover.' },
            { t: 'Password-only access', d: 'Every room is gated by its password. Wrong answer = access denied, every time.' },
            { t: 'Hidden from discovery', d: 'Rooms are never listed publicly. Only the exact ID + password can find or join one.' },
            { t: 'Auto-destroy', d: 'When the last person leaves — or someone hits Destroy — the room and all content is gone.' },
            { t: 'In-memory only', d: 'Chat data exists purely in RAM and syncs between your own tabs via BroadcastChannel, not disk.' },
            { t: 'No accounts, no tracking', d: 'Guest identities are random and local. There are no emails, no passwords to store, no databases.' },
          ].map((c, i) => (
            <Reveal key={c.t} from="scale" delay={i * 70} className="h-full">
              <SpotlightCard className="h-full">
                <div className="relative flex h-full flex-col p-5">
                  <div className="relative mb-4 w-10 h-10">
                    <span className="absolute inset-0 rounded-xl border border-emerald-300/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ animation: 'pulseRing 2.2s ease-out infinite' }} />
                    <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-300/25 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                      <svg className="w-5 h-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white">{c.t}</p>
                  <p className="text-xs text-white/50 mt-2 leading-relaxed flex-1">{c.d}</p>
                  <div className="mt-4 h-px w-8 bg-emerald-300/30 transition-all duration-500 group-hover:w-16 group-hover:bg-emerald-300/60" />
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Footer */}
      <SiteFooter onStart={onStart} />
    </div>
  )
}