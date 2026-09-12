export function startSweeper(roomManager, intervalMs = 60_000) {
  const timer = setInterval(() => roomManager.sweepExpired(), intervalMs)
  // Never keep the process alive purely for the sweeper.
  timer.unref?.()
  return timer
}