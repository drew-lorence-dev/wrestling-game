import { createClient } from '@supabase/supabase-js'
import ScoresClient from './ScoresClient'

export const dynamic = 'force-dynamic'

interface ShowRow {
  id: string
  name: string
  show_type: string
  air_date: string
  scoring_multiplier: number
}

interface ParticipantRow {
  wrestler_id: string
  outcome: string
  win_method: string | null
  is_title_change: boolean
  matches: {
    title_match: boolean
    show_id: string
  } | null
}

interface WrestlerRow {
  id: string
  name: string
  image_url: string | null
  gender: string
}

// Scoring week runs Wed–Tue (anchored to Dynamite). Find the most recent Wednesday.
function getCurrentWeek(): { start: string; end: string; label: string } {
  const now = new Date()
  const day = now.getUTCDay() // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

  const wednesday = new Date(now)
  wednesday.setUTCDate(now.getUTCDate() - ((day - 3 + 7) % 7))
  wednesday.setUTCHours(0, 0, 0, 0)

  const tuesday = new Date(wednesday)
  tuesday.setUTCDate(wednesday.getUTCDate() + 6)

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

  return {
    start: wednesday.toISOString().split('T')[0],
    end: tuesday.toISOString().split('T')[0],
    label: `${fmt(wednesday)} – ${fmt(tuesday)}, ${tuesday.getUTCFullYear()}`,
  }
}

function prevWeek(week: { start: string; end: string; label: string }) {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  const wed = new Date(week.start + 'T00:00:00Z')
  wed.setUTCDate(wed.getUTCDate() - 7)
  const tue = new Date(wed)
  tue.setUTCDate(wed.getUTCDate() + 6)
  return {
    start: wed.toISOString().split('T')[0],
    end: tue.toISOString().split('T')[0],
    label: `${fmt(wed)} – ${fmt(tue)}, ${tue.getUTCFullYear()}`,
  }
}

export default async function ScoresPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function fetchShows(start: string, end: string) {
    const { data } = await supabase
      .from('shows')
      .select('id, name, show_type, air_date, scoring_multiplier')
      .not('scraped_at', 'is', null)
      .gte('air_date', start)
      .lte('air_date', end)
      .order('air_date', { ascending: true })
    return (data ?? []) as ShowRow[]
  }

  // Try the current scoring window; if empty, fall back to the previous one
  let week = getCurrentWeek()
  let shows = await fetchShows(week.start, week.end)
  if (shows.length === 0) {
    week = prevWeek(week)
    shows = await fetchShows(week.start, week.end)
  }

  // Fetch participants via two steps: matches for the shows → participants for those matches.
  // Avoids the unreliable nested-resource filter (.in on an embedded column).
  let participants: ParticipantRow[] = []
  if (shows.length > 0) {
    const showIds = shows.map(s => s.id)

    const { data: matchRowsRaw } = await supabase
      .from('matches')
      .select('id, show_id, title_match')
      .in('show_id', showIds)
    const matchRows = (matchRowsRaw ?? []) as { id: string; show_id: string; title_match: boolean }[]
    const matchInfoMap = new Map(matchRows.map(m => [m.id, { show_id: m.show_id, title_match: m.title_match }]))

    if (matchRows.length > 0) {
      const matchIds = matchRows.map(m => m.id)
      const { data: mpRaw } = await supabase
        .from('match_participants')
        .select('wrestler_id, outcome, win_method, is_title_change, match_id')
        .in('match_id', matchIds)

      participants = ((mpRaw ?? []) as { wrestler_id: string; outcome: string; win_method: string | null; is_title_change: boolean; match_id: string }[])
        .map(p => ({
          wrestler_id: p.wrestler_id,
          outcome: p.outcome,
          win_method: p.win_method,
          is_title_change: p.is_title_change,
          matches: matchInfoMap.get(p.match_id) ?? null,
        }))
    }
  }

  // Fetch all wrestlers (for names and images)
  const { data: wrestlersRaw } = await supabase
    .from('wrestlers')
    .select('id, name, image_url, gender')
    .eq('is_active', true)
    .order('name')
  const wrestlers = (wrestlersRaw ?? []) as WrestlerRow[]

  return (
    <ScoresClient
      week={week}
      shows={shows}
      participants={participants}
      wrestlers={wrestlers}
    />
  )
}
