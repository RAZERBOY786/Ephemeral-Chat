let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Short "pop" on send — quick rising chirp
export function playSendSound() {
  try {
    const c = getCtx()
    const t = c.currentTime

    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, t)
    osc.frequency.exponentialRampToValueAtTime(1320, t + 0.06)
    osc.frequency.exponentialRampToValueAtTime(990, t + 0.12)

    gain.gain.setValueAtTime(0.05, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)

    osc.start(t)
    osc.stop(t + 0.18)
  } catch {}
}

// Softer two-tone "ding" on receive — notification chime
export function playReplySound() {
  try {
    const c = getCtx()
    const t = c.currentTime

    // Primary tone
    const osc1 = c.createOscillator()
    const gain1 = c.createGain()
    osc1.connect(gain1)
    gain1.connect(c.destination)
    osc1.type = 'sine'
    osc1.frequency.value = 830
    gain1.gain.setValueAtTime(0.042, t)
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.28)
    osc1.start(t)
    osc1.stop(t + 0.3)

    // Secondary harmonic — slightly delayed for warmth
    const osc2 = c.createOscillator()
    const gain2 = c.createGain()
    osc2.connect(gain2)
    gain2.connect(c.destination)
    osc2.type = 'sine'
    osc2.frequency.value = 1120
    gain2.gain.setValueAtTime(0, t)
    gain2.gain.linearRampToValueAtTime(0.02, t + 0.02)
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.25)
    osc2.start(t + 0.015)
    osc2.stop(t + 0.27)
  } catch {}
}