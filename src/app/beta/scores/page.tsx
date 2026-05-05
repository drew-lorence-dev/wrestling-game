import { createClient } from '@supabase/supabase-js'
import ScoresClient from './ScoresClient'

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
    match_order: number
    match_type: string
  } | null
}

async function getRecentShows() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get the 4 most recently aired shows that have been scraped
  const { data: showsRaw } = await supabase
    .from('shows')
    .select('id, name, show_type, air_date, scoring_multiplier')
    .not('scraped_at', 'is', null)
    .order('air_date', { ascending: false })
    .limit(4)

  const shows = (showsRaw ?? []) as ShowRow[]
  if (!shows.length) return []

  // For each show, get all match participants with match info
  const results = await Promise.all(
    shows.map(async show => {
      const { data: participantsRaw } = await supabase
        .from('match_participants')
        .select(`
          wrestler_id,
          outcome,
          win_method,
          is_title_change,
          matches!inner (
            title_match,
            match_order,
            match_type,
            show_id
          )
        `)
        .eq('matches.show_id', show.id)

      const participants = (participantsRaw ?? []) as unknown as ParticipantRow[]
      return { show, participants }
    })
  )

  return results.filter(r => r.participants.length > 0)
}

export default async function ScoresPage() {
  const showResults = await getRecentShows()
  return <ScoresClient showResults={showResults} />
}
