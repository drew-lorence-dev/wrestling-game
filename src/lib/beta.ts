export const ROSTER_SIZE = 15
export const ACTIVE_SIZE = 10
export const BENCH_SIZE = 5

export interface BetaState {
  draftedIds: string[]
  activeIds: string[]
}

const KEY = 'aew-fantasy-beta'

const empty: BetaState = { draftedIds: [], activeIds: [] }

export function getBetaState(): BetaState {
  if (typeof window === 'undefined') return empty
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...empty, ...JSON.parse(raw) } : empty
  } catch {
    return empty
  }
}

export function saveBetaState(state: BetaState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function isDraftComplete(state: BetaState): boolean {
  return state.draftedIds.length >= ROSTER_SIZE
}

// Returns next Wednesday at 5 PM ET (as UTC Date)
// May–Nov is EDT (UTC-4), so 5 PM EDT = 21:00 UTC
// Dec–Mar is EST (UTC-5), so 5 PM EST = 22:00 UTC
export function getNextLockTime(): Date {
  const now = new Date()
  const day = now.getUTCDay() // 0=Sun, 3=Wed
  const daysToWed = (3 - day + 7) % 7

  const candidate = new Date(now)
  candidate.setUTCDate(now.getUTCDate() + daysToWed)

  // Approximate ET offset: EDT Apr–Oct = UTC-4 → 21:00 UTC, EST Nov–Mar = UTC-5 → 22:00 UTC
  const month = candidate.getUTCMonth() // 0-indexed
  const utcHour = (month >= 3 && month <= 9) ? 21 : 22
  candidate.setUTCHours(utcHour, 0, 0, 0)

  // If that time has already passed, jump to next week
  if (candidate <= now) {
    candidate.setUTCDate(candidate.getUTCDate() + 7)
  }

  return candidate
}

export function isLineupLocked(): boolean {
  return new Date() >= getNextLockTime()
}

export function formatCountdown(target: Date): string {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return 'Locked'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${s}s`
  return `${m}m ${s}s`
}
