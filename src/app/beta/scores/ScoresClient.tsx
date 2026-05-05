"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { getBetaState, isDraftComplete, ACTIVE_SIZE, ROSTER_SIZE } from "@/lib/beta"
import { calculateWrestlerPoints, sumActions, ScoringAction } from "@/lib/scoring"

const FALLBACK = "https://static.wixstatic.com/media/815952_22a11f977bc54920b8bb6031745ea039~mv2.jpg"

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
  matches: { title_match: boolean; show_id: string } | null
}

interface WrestlerRow {
  id: string
  name: string
  image_url: string | null
  gender: string
}

interface ShowScore {
  showId: string
  actions: ScoringAction[]
  total: number
  appeared: boolean
}

function getWrestlerShowScore(
  wrestlerId: string,
  showId: string,
  participants: ParticipantRow[],
  multiplier: number
): ShowScore {
  const mine = participants.filter(
    p => p.wrestler_id === wrestlerId && p.matches?.show_id === showId
  )
  if (mine.length === 0) return { showId, actions: [], total: 0, appeared: false }

  const actions = calculateWrestlerPoints(
    mine.map(p => ({
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

  return { showId, actions, total: sumActions(actions), appeared: true }
}

function ScoreBadge({ action }: { action: ScoringAction }) {
  const isPositive = action.points > 0
  const label = action.action.replace('Title ', 'Title ')
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
      action.action === 'Win'
        ? 'bg-emerald-900/50 text-emerald-400'
        : action.action === 'Loss'
        ? 'bg-red-900/40 text-red-400'
        : action.action.includes('Title')
        ? 'bg-amber-900/50 text-amber-400'
        : 'bg-[#2a2a2a] text-zinc-400'
    }`}>
      {label} <span className="opacity-70">+{action.points}</span>
    </span>
  )
}

function ShowCell({ score, showName }: { score: ShowScore | null; showName: string }) {
  if (!score) {
    return (
      <td className="px-3 py-0 text-center align-middle">
        <span className="text-xs text-zinc-700">—</span>
      </td>
    )
  }
  if (!score.appeared) {
    return (
      <td className="px-3 py-0 text-center align-middle">
        <span className="text-xs text-zinc-600 italic">DNP</span>
      </td>
    )
  }
  return (
    <td className="px-3 py-0 text-center align-middle">
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-bold text-white">{score.total}</span>
        <div className="flex flex-wrap gap-0.5 justify-center max-w-[120px]">
          {score.actions.map((a, i) => <ScoreBadge key={i} action={a} />)}
        </div>
      </div>
    </td>
  )
}

interface WrestlerScoreRow {
  wrestler: WrestlerRow
  showScores: ShowScore[]
  weekTotal: number
  isActive: boolean
  slotNumber: number
}

export default function ScoresClient({
  week,
  shows,
  participants,
  wrestlers,
}: {
  week: { start: string; end: string; label: string }
  shows: ShowRow[]
  participants: ParticipantRow[]
  wrestlers: WrestlerRow[]
}) {
  const [activeIds, setActiveIds] = useState<string[]>([])
  const [draftedIds, setDraftedIds] = useState<string[]>([])
  const [draftComplete, setDraftComplete] = useState(false)

  useEffect(() => {
    const state = getBetaState()
    setActiveIds(state.activeIds)
    setDraftedIds(state.draftedIds)
    setDraftComplete(isDraftComplete(state))
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

  const wrestlerMap = new Map(wrestlers.map(w => [w.id, w]))

  // Build score rows for drafted wrestlers
  function buildRows(ids: string[], isActive: boolean, startSlot: number): WrestlerScoreRow[] {
    return ids
      .map((id, i) => {
        const wrestler = wrestlerMap.get(id)
        if (!wrestler) return null
        const showScores = shows.map(s =>
          getWrestlerShowScore(id, s.id, participants, s.scoring_multiplier)
        )
        const weekTotal = isActive ? showScores.reduce((sum, s) => sum + s.total, 0) : 0
        return { wrestler, showScores, weekTotal, isActive, slotNumber: startSlot + i }
      })
      .filter(Boolean) as WrestlerScoreRow[]
  }

  const activeRows = buildRows(activeIds, true, 1)
  const benchIds = draftedIds.filter(id => !activeIds.includes(id))
  const benchRows = buildRows(benchIds, false, ACTIVE_SIZE + 1)

  const totalScore = activeRows.reduce((sum, r) => sum + r.weekTotal, 0)

  // Upcoming shows (not yet aired / not scraped)
  const today = new Date().toISOString().split('T')[0]
  const scrapedShowDates = new Set(shows.map(s => s.air_date))
  const upcomingShows = [
    { name: 'AEW Dynamite', day: 'Wednesday', time: '8 PM ET' },
    { name: 'AEW Collision', day: 'Saturday', time: '8 PM ET' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Weekly Scores</div>
          <h1 className="text-xl font-extrabold text-white">{week.label}</h1>
        </div>
        <Link href="/beta" className="text-sm text-zinc-500 hover:text-white transition-colors self-start sm:self-auto">
          ← Back
        </Link>
      </div>

      {/* Score banner */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-6 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Total Score</div>
          <div className="text-5xl font-black text-white">
            {totalScore}
            <span className="text-xl font-normal text-zinc-500 ml-2">pts</span>
          </div>
          <div className="text-xs text-zinc-600 mt-1">
            {shows.length === 0
              ? 'No results yet this week'
              : `${shows.length} show${shows.length !== 1 ? 's' : ''} scored`}
          </div>
        </div>
        <div className="text-right hidden sm:block">
          {upcomingShows.map(s => (
            <div key={s.name} className="text-xs text-zinc-600 mb-1">
              <span className="text-zinc-400">{s.name}</span> · {s.day} {s.time}
            </div>
          ))}
        </div>
      </div>

      {/* Roster table */}
      {[
        { rows: activeRows, label: 'Starters', count: `${activeIds.length}/${ACTIVE_SIZE}`, isActive: true },
        { rows: benchRows, label: 'Bench', count: `${benchIds.length}/${ROSTER_SIZE - ACTIVE_SIZE}`, isActive: false },
      ].map(({ rows, label, count, isActive }) => (
        <div key={label} className={`rounded-xl border overflow-hidden mb-4 ${isActive ? 'border-[#2a2a2a]' : 'border-[#1e1e1e] opacity-60'}`}>
          {/* Section header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#111] border-b border-[#2a2a2a]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</span>
              <span className="text-xs text-zinc-600">{count}</span>
              {!isActive && <span className="text-[10px] text-zinc-700 italic">does not count toward score</span>}
            </div>
            {isActive && (
              <span className="text-sm font-bold text-[#c9a84c]">{totalScore} pts</span>
            )}
          </div>

          {/* Column headers */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-[10px] text-zinc-600 uppercase tracking-wider bg-[#0f0f0f]">
                  <th className="pl-4 pr-2 py-2 text-left w-8">#</th>
                  <th className="px-3 py-2 text-left">Wrestler</th>
                  {shows.length > 0
                    ? shows.map(s => (
                        <th key={s.id} className="px-3 py-2 text-center w-32">
                          <div>{s.name.replace('AEW ', '')}</div>
                          <div className="text-zinc-700 normal-case font-normal">
                            {new Date(s.air_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </th>
                      ))
                    : (
                        <th className="px-3 py-2 text-center w-40">
                          <div className="text-zinc-700">Dynamite</div>
                          <div className="text-zinc-700 normal-case font-normal text-[9px]">pending</div>
                        </th>
                      )}
                  <th className="px-4 py-2 text-right w-20">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={3 + Math.max(shows.length, 1)} className="px-4 py-8 text-center text-zinc-700 text-sm italic">
                      {isActive ? 'No starters set — go to lineup to set your starters' : 'No bench wrestlers'}
                    </td>
                  </tr>
                ) : (
                  rows.map(row => (
                    <tr
                      key={row.wrestler.id}
                      className="border-b border-[#1e1e1e] last:border-0 hover:bg-white/[0.015] transition-colors"
                    >
                      {/* Slot */}
                      <td className="pl-4 pr-2 py-4 text-zinc-600 text-sm">{row.slotNumber}</td>

                      {/* Wrestler */}
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#2a2a2a] shrink-0">
                            <Image
                              src={row.wrestler.image_url ?? FALLBACK}
                              alt={row.wrestler.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white leading-tight">{row.wrestler.name}</div>
                            <div className="text-[11px] text-zinc-600 capitalize mt-0.5">{row.wrestler.gender}</div>
                          </div>
                        </div>
                      </td>

                      {/* Per-show scores */}
                      {shows.length > 0
                        ? row.showScores.map((score, i) => (
                            <ShowCell key={i} score={score} showName={shows[i]?.name ?? ''} />
                          ))
                        : (
                            <td className="px-3 py-4 text-center">
                              <span className="text-xs text-zinc-700">—</span>
                            </td>
                          )}

                      {/* Week total */}
                      <td className="px-4 py-4 text-right">
                        <span className={`text-base font-black ${
                          row.weekTotal > 0
                            ? 'text-[#c9a84c]'
                            : 'text-zinc-700'
                        }`}>
                          {row.weekTotal}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {shows.length === 0 && (
        <div className="text-center py-4">
          <p className="text-zinc-600 text-xs">
            Scores update automatically after each show airs. Results are scraped Thursday (after Dynamite) and Sunday (after Collision).
          </p>
        </div>
      )}
    </div>
  )
}
