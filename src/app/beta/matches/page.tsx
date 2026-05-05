import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface ShowRow {
  id: string
  name: string
  air_date: string
  show_type: string
}

interface MatchRow {
  id: string
  show_id: string
  match_order: number
  match_type: string
  title_match: boolean
  title_name: string | null
}

interface ParticipantRow {
  match_id: string
  wrestler_id: string
  outcome: string
  win_method: string | null
  is_title_change: boolean
}

interface WrestlerRow {
  id: string
  name: string
}

interface BuiltParticipant {
  name: string
  win_method: string | null
  is_title_change: boolean
}

interface BuiltMatch {
  id: string
  match_order: number
  match_type: string
  title_match: boolean
  title_name: string | null
  winners: BuiltParticipant[]
  losers: BuiltParticipant[]
}

interface BuiltShow {
  id: string
  name: string
  air_date: string
  show_type: string
  matches: BuiltMatch[]
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
}

function fmtMethod(method: string | null) {
  if (!method) return null
  return method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default async function MatchesPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: showsRaw } = await supabase
    .from('shows')
    .select('id, name, air_date, show_type')
    .not('scraped_at', 'is', null)
    .order('air_date', { ascending: false })

  const shows = (showsRaw ?? []) as ShowRow[]

  let builtShows: BuiltShow[] = []

  if (shows.length > 0) {
    const showIds = shows.map(s => s.id)

    const { data: matchesRaw } = await supabase
      .from('matches')
      .select('id, show_id, match_order, match_type, title_match, title_name')
      .in('show_id', showIds)
      .order('match_order', { ascending: true })
    const matches = (matchesRaw ?? []) as MatchRow[]

    let participants: ParticipantRow[] = []
    if (matches.length > 0) {
      const matchIds = matches.map(m => m.id)
      const { data: pRaw } = await supabase
        .from('match_participants')
        .select('match_id, wrestler_id, outcome, win_method, is_title_change')
        .in('match_id', matchIds)
      participants = (pRaw ?? []) as ParticipantRow[]
    }

    const { data: wrestlersRaw } = await supabase
      .from('wrestlers')
      .select('id, name')
    const wrestlerMap = new Map((wrestlersRaw ?? []).map((w: WrestlerRow) => [w.id, w.name]))

    const participantsByMatch = new Map<string, ParticipantRow[]>()
    for (const p of participants) {
      const arr = participantsByMatch.get(p.match_id) ?? []
      arr.push(p)
      participantsByMatch.set(p.match_id, arr)
    }

    const matchesByShow = new Map<string, BuiltMatch[]>()
    for (const m of matches) {
      const ps = participantsByMatch.get(m.id) ?? []
      const winners = ps
        .filter(p => p.outcome === 'win')
        .map(p => ({ name: wrestlerMap.get(p.wrestler_id) ?? 'Unknown', win_method: p.win_method, is_title_change: p.is_title_change }))
      const losers = ps
        .filter(p => p.outcome !== 'win')
        .map(p => ({ name: wrestlerMap.get(p.wrestler_id) ?? 'Unknown', win_method: null, is_title_change: false }))

      const arr = matchesByShow.get(m.show_id) ?? []
      arr.push({ id: m.id, match_order: m.match_order, match_type: m.match_type, title_match: m.title_match, title_name: m.title_name, winners, losers })
      matchesByShow.set(m.show_id, arr)
    }

    builtShows = shows.map(s => ({
      ...s,
      matches: matchesByShow.get(s.id) ?? [],
    }))
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Beta</div>
          <h1 className="text-xl font-extrabold text-white">Match History</h1>
        </div>
        <Link href="/beta" className="text-sm text-zinc-500 hover:text-white transition-colors">
          ← Back
        </Link>
      </div>

      {builtShows.length === 0 ? (
        <div className="text-center py-16 text-zinc-600 text-sm">No scraped shows yet.</div>
      ) : (
        <div className="space-y-3">
          {builtShows.map(show => (
            <details key={show.id} className="group bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${show.show_type === 'ppv' ? 'bg-[#c9a84c]' : 'bg-emerald-500'}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">{show.name}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{fmtDate(show.air_date)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-xs text-zinc-600">{show.matches.length} matches</span>
                  <span className="text-zinc-600 text-xs group-open:rotate-180 transition-transform inline-block">▾</span>
                </div>
              </summary>

              <div className="border-t border-[#2a2a2a]">
                {show.matches.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-zinc-600 italic">No match data.</div>
                ) : (
                  show.matches.map((match, i) => {
                    const winnerNames = match.winners.map(w => w.name).join(' & ')
                    const loserNames = match.losers.map(w => w.name).join(' & ')
                    const method = fmtMethod(match.winners[0]?.win_method ?? null)
                    const isTitleChange = match.winners.some(w => w.is_title_change)

                    return (
                      <div
                        key={match.id}
                        className={`px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 ${i < show.matches.length - 1 ? 'border-b border-[#222]' : ''}`}
                      >
                        {/* Match number */}
                        <span className="text-[10px] text-zinc-700 w-5 shrink-0 font-mono">#{match.match_order}</span>

                        {/* Result */}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-white font-medium">{winnerNames || '—'}</span>
                          <span className="text-xs text-zinc-500 mx-2">def.</span>
                          <span className="text-sm text-zinc-400">{loserNames || '—'}</span>
                          {method && (
                            <span className="text-xs text-zinc-600 ml-2">via {method}</span>
                          )}
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {match.title_match && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-400 whitespace-nowrap">
                              {match.title_name
                                ? match.title_name.replace('AEW ', '').replace('ROH ', '')
                                : 'Title Match'}
                            </span>
                          )}
                          {isTitleChange && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#c9a84c]/20 text-[#c9a84c]">
                              Title Change
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-700 capitalize">{match.match_type}</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
