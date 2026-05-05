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

// Shared card/row used on both mobile and desktop
function WrestlerCard({
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
    <>
      {/* ── Mobile card ── */}
      <div className="flex items-center gap-3 px-4 py-3 sm:hidden border-b border-[#2a2a2a] last:border-0">
        <span className="text-xs text-zinc-700 w-4 text-right tabular-nums shrink-0">{slot ?? "—"}</span>
        <div className={`relative w-9 h-9 rounded-full overflow-hidden bg-[#2a2a2a] shrink-0 ${!isActive ? "opacity-50" : ""}`}>
          <Image src={wrestler.image_url ?? FALLBACK} alt={wrestler.name} fill sizes="36px" className="object-cover" unoptimized />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold leading-tight truncate ${isActive ? "text-white" : "text-zinc-400"}`}>
            {wrestler.name}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-emerald-400" : "text-zinc-600"}`}>
              {isActive ? "Active" : "Bench"}
            </span>
            {stats.weekPts > 0 && (
              <span className="text-[10px] text-[#c9a84c] font-semibold">{stats.weekPts} pts</span>
            )}
          </div>
        </div>
        <div className="shrink-0">
          {locked ? (
            <span className="text-xs text-zinc-600">Locked</span>
          ) : isActive ? (
            <button
              onClick={() => onToggle(wrestler.id)}
              className="text-xs px-3 py-2 rounded border border-zinc-700 text-zinc-400 hover:border-red-600 hover:text-red-400 active:bg-red-900/20 transition-colors"
            >
              Bench
            </button>
          ) : (
            <button
              onClick={() => onToggle(wrestler.id)}
              disabled={!canActivate}
              className="text-xs px-3 py-2 rounded bg-[#c9a84c]/20 border border-[#c9a84c]/40 text-[#c9a84c] hover:bg-[#c9a84c]/30 active:bg-[#c9a84c]/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Start
            </button>
          )}
        </div>
      </div>

      {/* ── Desktop table row ── */}
      <tr className="hidden sm:table-row border-b border-[#2a2a2a] last:border-0 hover:bg-white/[0.02] transition-colors">
        <td className="pl-4 pr-2 py-3 w-8 text-zinc-600 text-sm font-medium">{slot ?? "—"}</td>
        <td className="px-2 py-3">
          <div className="flex items-center gap-3">
            <div className={`relative w-10 h-10 rounded-full overflow-hidden bg-[#2a2a2a] shrink-0 ${!isActive ? "opacity-50" : ""}`}>
              <Image src={wrestler.image_url ?? FALLBACK} alt={wrestler.name} fill sizes="40px" className="object-cover" unoptimized />
            </div>
            <div>
              <div className={`font-semibold text-sm leading-tight ${isActive ? "text-white" : "text-zinc-400"}`}>{wrestler.name}</div>
              <div className="text-[11px] text-zinc-600 mt-0.5 capitalize">{wrestler.gender}</div>
            </div>
          </div>
        </td>
        <td className="px-3 py-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${isActive ? "bg-emerald-900/40 text-emerald-400" : "bg-[#2a2a2a] text-zinc-500"}`}>
            {isActive ? "Active" : "Bench"}
          </span>
        </td>
        <td className="px-3 py-3 text-center">
          <span className={`text-sm font-bold ${stats.weekPts > 0 ? "text-[#c9a84c]" : "text-zinc-600"}`}>{stats.weekPts}</span>
        </td>
        <td className="px-3 py-3 text-center hidden md:table-cell">
          <span className={`text-sm font-bold ${stats.seasonPts > 0 ? "text-white" : "text-zinc-600"}`}>{stats.seasonPts}</span>
        </td>
        <td className="px-4 py-3 text-right">
          {locked ? (
            <span className="text-xs text-zinc-600">Locked</span>
          ) : isActive ? (
            <button onClick={() => onToggle(wrestler.id)} className="text-xs px-3 py-1.5 rounded border border-zinc-700 text-zinc-400 hover:border-red-600 hover:text-red-400 transition-colors">
              Bench
            </button>
          ) : (
            <button onClick={() => onToggle(wrestler.id)} disabled={!canActivate} className="text-xs px-3 py-1.5 rounded bg-[#c9a84c]/20 border border-[#c9a84c]/40 text-[#c9a84c] hover:bg-[#c9a84c]/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              Start
            </button>
          )}
        </td>
      </tr>
    </>
  )
}

function SectionShell({ label, count, accent, children }: { label: string; count: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#2a2a2a] overflow-hidden mb-4">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#111] border-b border-[#2a2a2a]">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</span>
        <span className={`text-xs font-bold ${accent ? "text-emerald-400" : "text-zinc-500"}`}>{count}</span>
      </div>
      {/* Mobile: div list */}
      <div className="sm:hidden">
        {children}
      </div>
      {/* Desktop: table */}
      <table className="hidden sm:table w-full">
        <thead>
          <tr className="border-b border-[#2a2a2a] text-[11px] text-zinc-600 uppercase tracking-wider">
            <th className="pl-4 pr-2 py-2 text-left w-8">#</th>
            <th className="px-2 py-2 text-left">Wrestler</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-center">Wk Pts</th>
            <th className="px-3 py-2 text-center hidden md:table-cell">Season</th>
            <th className="px-4 py-2 text-right"></th>
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
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

  const drafted = draftedIds.map(id => wrestlers.find(w => w.id === id)).filter(Boolean) as Wrestler[]
  const active = drafted.filter(w => activeIds.includes(w.id))
  const bench = drafted.filter(w => !activeIds.includes(w.id))
  const draftComplete = draftedIds.length >= ROSTER_SIZE
  const canAddMore = active.length < ACTIVE_SIZE

  function toggle(id: string) {
    if (locked) return
    const next = activeIds.includes(id)
      ? activeIds.filter(a => a !== id)
      : canAddMore ? [...activeIds, id] : activeIds
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

  const needsMore = ACTIVE_SIZE - active.length
  const saveLabel = saveState === "saving" ? "Saving…"
    : saveState === "saved" ? "✓ Lineup Saved"
    : needsMore > 0 ? `Select ${needsMore} more starter${needsMore !== 1 ? "s" : ""}`
    : "Save Lineup"

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">My Lineup</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{active.length}/{ACTIVE_SIZE} starters set</p>
        </div>
        <div className={`text-sm px-3 py-1.5 rounded border shrink-0 ${locked ? "border-red-800/50 bg-red-900/20 text-red-400" : "border-[#2a2a2a] bg-[#1a1a1a] text-zinc-400"}`}>
          {locked ? "🔒 Locked" : <><span className="hidden sm:inline">Locks: </span><span className="text-white font-medium"><Countdown /></span></>}
        </div>
      </div>

      {/* Starters */}
      <SectionShell label="Starters" count={`${active.length}/${ACTIVE_SIZE}`} accent={active.length === ACTIVE_SIZE}>
        {active.map((w, i) => (
          <WrestlerCard key={w.id} wrestler={w} slot={i + 1} isActive locked={locked} canActivate={false} stats={getStats(w.id)} onToggle={toggle} />
        ))}
        {Array.from({ length: ACTIVE_SIZE - active.length }).map((_, i) => (
          // Mobile empty slot
          <div key={`me-${i}`} className="sm:hidden flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a] last:border-0">
            <span className="text-xs text-zinc-700 w-4 tabular-nums">{active.length + i + 1}</span>
            <div className="w-9 h-9 rounded-full border border-dashed border-[#2a2a2a] shrink-0" />
            <span className="text-sm text-zinc-700 italic">Empty — start a bench wrestler</span>
          </div>
        ))}
        {/* Desktop empty slots rendered as tr */}
        {Array.from({ length: ACTIVE_SIZE - active.length }).map((_, i) => (
          <tr key={`de-${i}`} className="hidden sm:table-row border-b border-[#2a2a2a] last:border-0">
            <td className="pl-4 pr-2 py-3 text-zinc-700 text-sm">{active.length + i + 1}</td>
            <td className="px-2 py-3" colSpan={5}><span className="text-zinc-700 text-sm italic">Empty slot</span></td>
          </tr>
        ))}
      </SectionShell>

      {/* Bench */}
      <SectionShell label="Bench" count={`${bench.length}/${ROSTER_SIZE - ACTIVE_SIZE}`}>
        {bench.length === 0 ? (
          <>
            <div className="sm:hidden px-4 py-6 text-center text-zinc-700 text-sm italic">No wrestlers on bench</div>
            <tr className="hidden sm:table-row"><td colSpan={6} className="px-4 py-6 text-center text-zinc-700 text-sm italic">No wrestlers on bench</td></tr>
          </>
        ) : (
          bench.map((w, i) => (
            <WrestlerCard key={w.id} wrestler={w} slot={ACTIVE_SIZE + i + 1} isActive={false} canActivate={canAddMore} locked={locked} stats={getStats(w.id)} onToggle={toggle} />
          ))
        )}
      </SectionShell>

      {/* Save */}
      {!locked && (
        <button
          onClick={save}
          disabled={active.length !== ACTIVE_SIZE || saveState === "saving"}
          className="w-full py-3.5 rounded-lg font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#c9a84c] text-black hover:bg-[#e8c96a] active:bg-[#d4b44a]"
        >
          {saveLabel}
        </button>
      )}
    </div>
  )
}
