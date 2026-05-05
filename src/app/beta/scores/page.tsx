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

// Current scoring week: Monday–Sunday around the next lineup lock (Wed)
function getCurrentWeek(): { start: string; end: string; label: string } {
  const now = new Date()
  const day = now.getUTCDay() // 0=Sun, 1=Mon ... 6=Sat
  // Find this week's Monday (go back to Monday)
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - ((day + 6) % 7))
  monday.setUTCHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
    label: `${fmt(monday)} – ${fmt(sunday)}, ${sunday.getUTCFullYear()}`,
  }
}

export default async function ScoresPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const week = getCurrentWeek()

  // Fetch all shows in the current week that have been scraped
  const { data: showsRaw } = await supabase
    .from('shows')
    .select('id, name, show_type, air_date, scoring_multiplier')
    .not('scraped_at', 'is', null)
    .gte('air_date', week.start)
    .lte('air_date', week.end)
    .order('air_date', { ascending: true })

  const shows = (showsRaw ?? []) as ShowRow[]

  // Fetch all match participants for those shows
  let participants: ParticipantRow[] = []
  if (shows.length > 0) {
    const showIds = shows.map(s => s.id)
    const { data: pRaw } = await supabase
      .from('match_participants')
      .select(`
        wrestler_id,
        outcome,
        win_method,
        is_title_change,
        matches!inner (
          title_match,
          show_id
        )
      `)
      .in('matches.show_id', showIds)
    participants = (pRaw ?? []) as unknown as ParticipantRow[]
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
