"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Wrestler } from "@/types/database"
import {
  getBetaState, saveBetaState, isDraftComplete,
  ACTIVE_SIZE, ROSTER_SIZE, isLineupLocked,
} from "@/lib/beta"
import Countdown from "@/components/Countdown"

const FALLBACK = "https://static.wixstatic.com/media/815952_22a11f977bc54920b8bb6031745ea039~mv2.jpg"

interface WrestlerStats {
  weekPts: number
  seasonPts: number
}

function WrestlerRow({
  wrestler,
  slot,
  isActive,
  canActivate,
  locked,
  stats,
  onToggle,
}: {
  wrestler: Wrestler
  slot?: number
  isActive: boolean
  canActivate: boolean
  locked: boolean
  stats: WrestlerStats
  onToggle: (id: string) => void
}) {
  return (
    <tr className="border-b border-[#2a2a2a] last:border-0 hover:bg-white/[0.02] transition-colors">
      {/* Slot number */}
      <td className="pl-4 pr-2 py-3 w-8 text-zinc-600 text-sm font-medium">
        {slot ?? "—"}
      </td>

      {/* Wrestler info */}
      <td className="px-2 py-3">
        <div className="flex items-center gap-3">
          <div className={`relative w-10 h-10 rounded-full overflow-hidden bg-[#2a2a2a] shrink-0 ${!isActive ? "opacity-50" : ""}`}>
            <Image
              src={wrestler.image_url ?? FALLBACK}
              alt={wrestler.name}
              fill
              sizes="40px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div>
            <div className={`font-semibold text-sm leading-tight ${isActive ? "text-white" : "text-zinc-400"}`}>
              {wrestler.name}
            </div>
            <div className="text-[11px] text-zinc-600 mt-0.5 capitalize">{wrestler.gender}</div>
          </div>
        </div>
      </td>

      {/* Status badge */}
      <td className="px-3 py-3 hidden sm:table-cell">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
          isActive
            ? "bg-emerald-900/40 text-emerald-400"
            : "bg-[#2a2a2a] text-zinc-500"
        }`}>
          {isActive ? "Active" : "Bench"}
        </span>
      </td>

      {/* This week pts */}
      <td className="px-3 py-3 text-center">
        <span className={`text-sm font-bold ${stats.weekPts > 0 ? "text-[#c9a84c]" : "text-zinc-600"}`}>
          {stats.weekPts}
        </span>
      </td>

      {/* Season pts */}
      <td className="px-3 py-3 text-center hidden md:table-cell">
        <span className={`text-sm font-bold ${stats.seasonPts > 0 ? "text-white" : "text-zinc-600"}`}>
          {stats.seasonPts}
        </span>
      </td>

      {/* Action */}
      <td className="px-4 py-3 text-right">
        {locked ? (
          <span className="text-xs text-zinc-600">Locked</span>
        ) : isActive ? (
          <button
            onClick={() => onToggle(wrestler.id)}
            className="text-xs px-3 py-1.5 rounded border border-zinc-700 text-zinc-400 hover:border-red-600 hover:text-red-400 transition-colors"
          >
            Bench
          </button>
        ) : (
          <button
            onClick={() => onToggle(wrestler.id)}
            disabled={!canActivate}
            className="text-xs px-3 py-1.5 rounded bg-[#c9a84c]/20 border border-[#c9a84c]/40 text-[#c9a84c] hover:bg-[#c9a84c]/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Start
          </button>
        )}
      </td>
    </tr>
  )
}

export default function LineupClient({ wrestlers }: { wrestlers: Wrestler[] }) {
  const [draftedIds, setDraftedIds] = useState<string[]>([])
  const [activeIds, setActiveIds] = useState<string[]>([])
  const [locked, setLocked] = useState(false)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")
  const [stats] = useState<Record<string, WrestlerStats>>({})

  useEffect(() => {
    const state = getBetaState()
    setDraftedIds(state.draftedIds)
    setActiveIds(state.activeIds)
    setLocked(isLineupLocked())
  }, [])

  const drafted = draftedIds
    .map(id => wrestlers.find(w => w.id === id))
    .filter(Boolean) as Wrestler[]

  const active = drafted.filter(w => activeIds.includes(w.id))
  const bench = drafted.filter(w => !activeIds.includes(w.id))
  const draftComplete = draftedIds.length >= ROSTER_SIZE
  const canAddMore = active.length < ACTIVE_SIZE

  function toggle(id: string) {
    if (locked) return
    let next: string[]
    if (activeIds.includes(id)) {
      next = activeIds.filter(a => a !== id)
    } else {
      if (!canAddMore) return
      next = [...activeIds, id]
    }
    setActiveIds(next)
    setSaveState("idle")
  }

  async function save() {
    setSaveState("saving")
    saveBetaState({ ...getBetaState(), activeIds })
    await new Promise(r => setTimeout(r, 400))
    setSaveState("saved")
    setTimeout(() => setSaveState("idle"), 2000)
  }

  function getStats(id: string): WrestlerStats {
    return stats[id] ?? { weekPts: 0, seasonPts: 0 }
  }

  if (!draftComplete) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-zinc-400 mb-4">Complete your draft first.</p>
        <Link href="/beta/draft" className="px-6 py-2 rounded bg-[#c9a84c] text-black font-bold text-sm">
          Go to Draft
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">My Lineup</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{active.length}/{ACTIVE_SIZE} starters set</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-sm px-3 py-1.5 rounded border ${locked ? "border-red-800/50 bg-red-900/20 text-red-400" : "border-[#2a2a2a] bg-[#1a1a1a] text-zinc-400"}`}>
            {locked ? "🔒 Locked" : <>Locks: <span className="text-white font-medium"><Countdown /></span></>}
          </div>
          <Link href="/beta" className="text-sm text-zinc-500 hover:text-white transition-colors">← Back</Link>
        </div>
      </div>

      {/* Active roster table */}
      <div className="rounded-lg border border-[#2a2a2a] overflow-hidden mb-4">
        {/* Section header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#111] border-b border-[#2a2a2a]">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Starters
          </span>
          <span className={`text-xs font-bold ${active.length === ACTIVE_SIZE ? "text-emerald-400" : "text-[#c9a84c]"}`}>
            {active.length}/{ACTIVE_SIZE}
          </span>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a2a] text-[11px] text-zinc-600 uppercase tracking-wider">
              <th className="pl-4 pr-2 py-2 text-left w-8">#</th>
              <th className="px-2 py-2 text-left">Wrestler</th>
              <th className="px-3 py-2 text-left hidden sm:table-cell">Status</th>
              <th className="px-3 py-2 text-center">Wk Pts</th>
              <th className="px-3 py-2 text-center hidden md:table-cell">Season</th>
              <th className="px-4 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {active.map((w, i) => (
              <WrestlerRow
                key={w.id}
                wrestler={w}
                slot={i + 1}
                isActive={true}
                canActivate={false}
                locked={locked}
                stats={getStats(w.id)}
                onToggle={toggle}
              />
            ))}
            {/* Empty starter slots */}
            {Array.from({ length: ACTIVE_SIZE - active.length }).map((_, i) => (
              <tr key={`empty-${i}`} className="border-b border-[#2a2a2a] last:border-0">
                <td className="pl-4 pr-2 py-3 text-zinc-700 text-sm">{active.length + i + 1}</td>
                <td className="px-2 py-3" colSpan={5}>
                  <span className="text-zinc-700 text-sm italic">Empty slot — move a wrestler from bench</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bench table */}
      <div className="rounded-lg border border-[#2a2a2a] overflow-hidden mb-6">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#111] border-b border-[#2a2a2a]">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Bench</span>
          <span className="text-xs font-bold text-zinc-500">{bench.length}/{ROSTER_SIZE - ACTIVE_SIZE}</span>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a2a] text-[11px] text-zinc-600 uppercase tracking-wider">
              <th className="pl-4 pr-2 py-2 text-left w-8">#</th>
              <th className="px-2 py-2 text-left">Wrestler</th>
              <th className="px-3 py-2 text-left hidden sm:table-cell">Status</th>
              <th className="px-3 py-2 text-center">Wk Pts</th>
              <th className="px-3 py-2 text-center hidden md:table-cell">Season</th>
              <th className="px-4 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {bench.map((w, i) => (
              <WrestlerRow
                key={w.id}
                wrestler={w}
                slot={ACTIVE_SIZE + i + 1}
                isActive={false}
                canActivate={canAddMore}
                locked={locked}
                stats={getStats(w.id)}
                onToggle={toggle}
              />
            ))}
            {bench.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-700 text-sm italic">
                  No wrestlers on bench
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Save button */}
      {!locked && (
        <button
          onClick={save}
          disabled={active.length !== ACTIVE_SIZE || saveState === "saving"}
          className="w-full py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#c9a84c] text-black hover:bg-[#e8c96a]"
        >
          {saveState === "saving" ? "Saving..." : saveState === "saved" ? "✓ Lineup Saved" : active.length !== ACTIVE_SIZE ? `Select ${ACTIVE_SIZE - active.length} more starter${ACTIVE_SIZE - active.length !== 1 ? "s" : ""}` : "Save Lineup"}
        </button>
      )}
    </div>
  )
}
