"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getBetaState, isDraftComplete } from "@/lib/beta"
import { calculateWrestlerPoints, sumActions, ScoringAction } from "@/lib/scoring"

interface ShowResult {
  show: {
    id: string
    name: string
    show_type: string
    air_date: string
    scoring_multiplier: number
  }
  participants: Array<{
    wrestler_id: string
    outcome: string
    win_method: string | null
    is_title_change: boolean
    matches: {
      title_match: boolean
      match_order: number
      match_type: string
    } | null
  }>
}

interface WrestlerResult {
  wrestlerId: string
  actions: ScoringAction[]
  total: number
}

function getWrestlerShowScore(
  wrestlerId: string,
  participants: ShowResult['participants'],
  multiplier: number
): WrestlerResult {
  const myParticipations = participants.filter(
    p => p.wrestler_id === wrestlerId && p.matches !== null
  )

  if (myParticipations.length === 0) {
    return { wrestlerId, actions: [], total: 0 }
  }

  const actions = calculateWrestlerPoints(
    myParticipations.map(p => ({
      wrestler_id: p.wrestler_id,
      outcome: p.outcome,
      win_method: p.win_method,
      is_title_change: p.is_title_change,
      matches: {
        title_match: p.matches!.title_match,
        shows: { name: '', scoring_multiplier: multiplier },
      },
    })),
    multiplier
  )

  return { wrestlerId, actions, total: sumActions(actions) }
}

export default function ScoresClient({ showResults }: { showResults: ShowResult[] }) {
  const [activeIds, setActiveIds] = useState<string[]>([])
  const [draftComplete, setDraftComplete] = useState(false)
  const [wrestlerNames, setWrestlerNames] = useState<Record<string, string>>({})

  useEffect(() => {
    const state = getBetaState()
    setActiveIds(state.activeIds)
    setDraftComplete(isDraftComplete(state))

    // Fetch wrestler names for all active wrestlers
    if (state.activeIds.length > 0) {
      fetch(`/api/wrestlers?ids=${state.activeIds.join(',')}`)
        .then(r => r.json())
        .then((data: Array<{ id: string; name: string }>) => {
          const map: Record<string, string> = {}
          data.forEach(w => { map[w.id] = w.name })
          setWrestlerNames(map)
        })
        .catch(() => {})
    }
  }, [])

  if (!draftComplete) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-zinc-400 mb-4">Complete your draft and set a lineup to see scores.</p>
        <Link href="/beta/draft" className="px-6 py-2 rounded bg-[#c9a84c] text-black font-bold text-sm">
          Go to Draft
        </Link>
      </div>
    )
  }

  if (showResults.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-zinc-400 mb-2">No show results in the database yet.</p>
        <p className="text-zinc-600 text-sm">Run <code className="text-[#c9a84c]">npm run scrape:results</code> to fetch results.</p>
      </div>
    )
  }

  // Calculate total score across all shows
  const grandTotal = showResults.reduce((sum, { show, participants }) => {
    return sum + activeIds.reduce((s, id) => {
      return s + getWrestlerShowScore(id, participants, show.scoring_multiplier).total
    }, 0)
  }, 0)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Weekly Scores</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Points for your active lineup from recent shows</p>
        </div>
        <Link href="/beta" className="text-sm text-zinc-500 hover:text-white transition-colors">← Back</Link>
      </div>

      {/* Grand total */}
      <div className="bg-[#c9a84c]/10 border border-[#c9a84c]/30 rounded-lg p-5 mb-8 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#c9a84c] mb-1">Total Score</div>
          <div className="text-4xl font-extrabold text-white">{grandTotal} <span className="text-lg text-zinc-400 font-normal">pts</span></div>
        </div>
        <div className="text-right text-sm text-zinc-500">
          <div>{activeIds.length} active wrestlers</div>
          <div>{showResults.length} shows scored</div>
        </div>
      </div>

      {/* Per-show breakdowns */}
      <div className="space-y-8">
        {showResults.map(({ show, participants }) => {
          const showTotal = activeIds.reduce((s, id) =>
            s + getWrestlerShowScore(id, participants, show.scoring_multiplier).total, 0)

          const wrestlerResults = activeIds
            .map(id => ({ id, ...getWrestlerShowScore(id, participants, show.scoring_multiplier) }))
            .sort((a, b) => b.total - a.total)

          const appeared = wrestlerResults.filter(w => w.actions.length > 0)
          const didNotAppear = wrestlerResults.filter(w => w.actions.length === 0)

          return (
            <div key={show.id}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-bold text-white">{show.name}</h2>
                  <div className="text-xs text-zinc-500">
                    {new Date(show.air_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    {show.scoring_multiplier > 1 && (
                      <span className="ml-2 text-[#c9a84c]">{show.scoring_multiplier}× PPV</span>
                    )}
                  </div>
                </div>
                <div className="text-xl font-bold text-[#c9a84c]">{showTotal} pts</div>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
                {appeared.length === 0 ? (
                  <div className="p-4 text-zinc-600 text-sm text-center">None of your active wrestlers appeared on this show</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2a2a2a] text-xs text-zinc-500 uppercase tracking-wider">
                        <th className="text-left px-4 py-2">Wrestler</th>
                        <th className="text-left px-4 py-2 hidden sm:table-cell">Actions</th>
                        <th className="text-right px-4 py-2">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appeared.map(w => (
                        <tr key={w.id} className="border-b border-[#2a2a2a] last:border-0">
                          <td className="px-4 py-3 font-medium text-white">
                            {wrestlerNames[w.id] ?? '...'}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {w.actions.map((a, i) => (
                                <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${
                                  a.action === 'Win' || a.action === 'Title Win' || a.action === 'Title Defense'
                                    ? 'bg-emerald-900/40 text-emerald-400'
                                    : a.action === 'Loss'
                                    ? 'bg-red-900/40 text-red-400'
                                    : 'bg-[#2a2a2a] text-zinc-400'
                                }`}>
                                  {a.action} (+{a.points})
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-white">{w.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {didNotAppear.length > 0 && (
                  <div className="px-4 py-2 border-t border-[#2a2a2a]">
                    <span className="text-xs text-zinc-600">
                      Did not appear: {didNotAppear.map(w => wrestlerNames[w.id] ?? w.id).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
