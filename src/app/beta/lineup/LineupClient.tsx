"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Wrestler } from "@/types/database"
import {
  getBetaState, saveBetaState, isDraftComplete,
  ACTIVE_SIZE, ROSTER_SIZE, getNextLockTime, formatCountdown, isLineupLocked
} from "@/lib/beta"
import Countdown from "@/components/Countdown"

const FALLBACK = "https://static.wixstatic.com/media/815952_22a11f977bc54920b8bb6031745ea039~mv2.jpg"

export default function LineupClient({ wrestlers }: { wrestlers: Wrestler[] }) {
  const [draftedIds, setDraftedIds] = useState<string[]>([])
  const [activeIds, setActiveIds] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const state = getBetaState()
    setDraftedIds(state.draftedIds)
    setActiveIds(state.activeIds)
    setLocked(isLineupLocked())
  }, [])

  const drafted = wrestlers.filter(w => draftedIds.includes(w.id))
  const active = drafted.filter(w => activeIds.includes(w.id))
  const bench = drafted.filter(w => !activeIds.includes(w.id))
  const draftComplete = draftedIds.length >= ROSTER_SIZE

  function toggle(id: string) {
    if (locked) return
    let next: string[]
    if (activeIds.includes(id)) {
      next = activeIds.filter(a => a !== id)
    } else {
      if (activeIds.length >= ACTIVE_SIZE) return
      next = [...activeIds, id]
    }
    setActiveIds(next)
    setSaved(false)
  }

  function save() {
    saveBetaState({ ...getBetaState(), activeIds })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!draftComplete) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-zinc-400 mb-4">You need to complete your draft before setting a lineup.</p>
        <Link href="/beta/draft" className="px-6 py-2 rounded bg-[#c9a84c] text-black font-bold text-sm hover:bg-[#e8c96a] transition-colors">
          Go to Draft
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Set Your Lineup</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Choose {ACTIVE_SIZE} active wrestlers. Click to toggle active/bench.</p>
        </div>
        <Link href="/beta" className="text-sm text-zinc-500 hover:text-white transition-colors">
          ← Back
        </Link>
      </div>

      {/* Lock status */}
      <div className={`rounded-lg p-4 mb-6 flex items-center justify-between ${locked ? "bg-red-900/20 border border-red-800/40" : "bg-[#1a1a1a] border border-[#2a2a2a]"}`}>
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-0.5">
            {locked ? "Lineup locked" : "Locks in"}
          </div>
          <div className="text-lg font-bold">
            {locked ? <span className="text-red-400">Locked for this week</span> : <Countdown />}
          </div>
        </div>
        <div className="text-right text-sm text-zinc-500">
          <div>Wed 5 PM ET</div>
          <div className="text-xs">{active.length}/{ACTIVE_SIZE} active</div>
        </div>
      </div>

      {/* Active */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-white text-sm uppercase tracking-wider">
            Active <span className="text-[#c9a84c]">{active.length}/{ACTIVE_SIZE}</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {active.map(w => (
            <button
              key={w.id}
              onClick={() => toggle(w.id)}
              disabled={locked}
              className="flex flex-col items-center gap-2 bg-[#c9a84c]/10 border border-[#c9a84c]/40 rounded-lg p-3 hover:border-[#c9a84c] transition-colors disabled:cursor-default"
            >
              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-[#2a2a2a] ring-2 ring-[#c9a84c]/60">
                <Image src={w.image_url ?? FALLBACK} alt={w.name} fill sizes="56px" className="object-cover" unoptimized />
              </div>
              <span className="text-xs font-semibold text-center text-white leading-tight">{w.name}</span>
              {!locked && <span className="text-[10px] text-zinc-500">Click to bench</span>}
            </button>
          ))}
          {Array.from({ length: ACTIVE_SIZE - active.length }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 border border-dashed border-[#2a2a2a] rounded-lg p-3">
              <div className="w-14 h-14 rounded-full border border-dashed border-[#2a2a2a]" />
              <span className="text-xs text-zinc-700">Empty slot</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bench */}
      <div className="mb-6">
        <h2 className="font-bold text-white text-sm uppercase tracking-wider mb-3">
          Bench <span className="text-zinc-500">{bench.length}/{ROSTER_SIZE - ACTIVE_SIZE}</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {bench.map(w => (
            <button
              key={w.id}
              onClick={() => toggle(w.id)}
              disabled={locked || active.length >= ACTIVE_SIZE}
              className="flex flex-col items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 hover:border-zinc-500 transition-colors disabled:cursor-default disabled:opacity-50"
            >
              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-[#2a2a2a] opacity-60">
                <Image src={w.image_url ?? FALLBACK} alt={w.name} fill sizes="56px" className="object-cover" unoptimized />
              </div>
              <span className="text-xs font-semibold text-center text-zinc-400 leading-tight">{w.name}</span>
              {!locked && active.length < ACTIVE_SIZE && <span className="text-[10px] text-zinc-600">Click to activate</span>}
            </button>
          ))}
        </div>
      </div>

      {!locked && (
        <button
          onClick={save}
          disabled={active.length !== ACTIVE_SIZE}
          className="w-full py-3 rounded bg-[#c9a84c] text-black font-bold hover:bg-[#e8c96a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saved ? "Saved ✓" : active.length !== ACTIVE_SIZE ? `Select ${ACTIVE_SIZE - active.length} more` : "Save Lineup"}
        </button>
      )}
    </div>
  )
}
