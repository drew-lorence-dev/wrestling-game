import { createClient } from '@supabase/supabase-js'
import { parseYearPage, ParsedMatch } from '../src/lib/results-parser'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SHOWS = [
  {
    name: 'AEW Dynamite',
    showType: 'tv' as const,
    multiplier: 1.0,
    urls: [
      'https://www.thesmackdownhotel.com/events-results/aew/aew-dynamite-2026',
      'https://www.thesmackdownhotel.com/events-results/aew/aew-dynamite-2025',
    ],
  },
  {
    name: 'AEW Collision',
    showType: 'tv' as const,
    multiplier: 1.0,
    urls: [
      'https://www.thesmackdownhotel.com/events-results/aew/aew-collision-2026',
      'https://www.thesmackdownhotel.com/events-results/aew/aew-collision-2025',
    ],
  },
]

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AEWFantasyBot/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

async function getWrestlerLookup(): Promise<Map<string, string>> {
  const { data } = await supabase.from('wrestlers').select('id, name, slug')
  const lookup = new Map<string, string>()
  if (!data) return lookup

  for (const w of data) {
    // Index by lowercase name and slug for fuzzy matching
    lookup.set(w.name.toLowerCase(), w.id)
    lookup.set(w.slug, w.id)
    // Also index common alternate names
    lookup.set(w.name.toLowerCase().replace(/[^a-z0-9 ]/g, ''), w.id)
  }
  return lookup
}

function findWrestlerId(name: string, lookup: Map<string, string>): string | null {
  const lower = name.toLowerCase().trim()
  if (lookup.has(lower)) return lookup.get(lower)!

  // Try slug-style match
  const slug = lower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (lookup.has(slug)) return lookup.get(slug)!

  // Try stripping special chars
  const stripped = lower.replace(/[^a-z0-9 ]/g, '')
  if (lookup.has(stripped)) return lookup.get(stripped)!

  // Try partial match (first + last word)
  const words = lower.split(' ')
  if (words.length > 1) {
    const partial = `${words[0]} ${words[words.length - 1]}`
    if (lookup.has(partial)) return lookup.get(partial)!
  }

  return null
}

async function processShow(
  showName: string,
  date: string,
  episodeNumber: number | null,
  showType: 'tv' | 'ppv',
  multiplier: number,
  matches: ParsedMatch[],
  lookup: Map<string, string>
) {
  // Check if show already exists
  const { data: existing } = await supabase
    .from('shows')
    .select('id')
    .eq('air_date', date)
    .ilike('name', `%${showName.split(' ').slice(-1)[0]}%`)
    .single()

  if (existing) {
    console.log(`  Skipping ${showName} ${date} — already in DB`)
    return
  }

  const displayName = episodeNumber ? `${showName} #${episodeNumber}` : `${showName} (${date})`

  // Insert show
  const { data: show, error: showErr } = await supabase
    .from('shows')
    .insert({
      name: displayName,
      show_type: showType,
      air_date: date,
      scoring_multiplier: multiplier,
      scraped_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (showErr || !show) {
    console.error(`  Failed to insert show ${displayName}:`, showErr?.message)
    return
  }

  const showId = show.id
  let matchesInserted = 0
  let participantsInserted = 0
  const unmatchedNames: string[] = []

  for (const match of matches) {
    // Insert match
    const { data: matchRow, error: matchErr } = await supabase
      .from('matches')
      .insert({
        show_id: showId,
        match_order: match.matchOrder,
        match_type: match.matchType,
        title_match: match.isTitleMatch,
        title_name: match.titleName,
      })
      .select('id')
      .single()

    if (matchErr || !matchRow) continue
    matchesInserted++

    const allParticipants = [
      ...match.winners.map(name => ({ name, outcome: 'win', isWinner: true })),
      ...match.losers.map(name => ({ name, outcome: 'loss', isWinner: false })),
    ]

    for (const { name, outcome, isWinner } of allParticipants) {
      const wrestlerId = findWrestlerId(name, lookup)
      if (!wrestlerId) {
        unmatchedNames.push(name)
        continue
      }

      await supabase.from('match_participants').insert({
        match_id: matchRow.id,
        wrestler_id: wrestlerId,
        team: isWinner ? 1 : 2,
        outcome,
        win_method: isWinner ? match.winMethod : null,
        is_title_change: isWinner && match.isTitleChange,
      })
      participantsInserted++
    }
  }

  console.log(`  ✓ ${displayName}: ${matchesInserted} matches, ${participantsInserted} participants`)
  if (unmatchedNames.length > 0) {
    console.log(`    Unmatched names: ${[...new Set(unmatchedNames)].join(', ')}`)
  }
}

async function run() {
  // Only store shows from today forward — no historical data
  const cutoffDate = new Date().toISOString().split('T')[0]
  console.log(`Building wrestler lookup... (only storing shows on or after ${cutoffDate})\n`)
  const lookup = await getWrestlerLookup()
  console.log(`Loaded ${lookup.size} wrestler name entries\n`)

  for (const show of SHOWS) {
    for (const url of show.urls) {
      console.log(`Fetching ${url}...`)
      try {
        const html = await fetchPage(url)
        const episodes = parseYearPage(html)
        console.log(`  Found ${episodes.length} episodes\n`)

        for (const ep of episodes) {
          // Skip any show before today's date
          if (ep.date < cutoffDate) continue

          await processShow(
            show.name,
            ep.date,
            ep.episodeNumber,
            show.showType,
            show.multiplier,
            ep.matches,
            lookup
          )
        }
      } catch (err) {
        console.error(`  Error fetching ${url}:`, err instanceof Error ? err.message : err)
      }
    }
    console.log()
  }

  console.log('Done.')
}

run()
