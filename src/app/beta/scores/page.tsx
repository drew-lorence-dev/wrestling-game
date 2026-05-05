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
