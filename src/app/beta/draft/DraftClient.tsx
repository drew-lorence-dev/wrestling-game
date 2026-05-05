"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Wrestler } from "@/types/database"
import { getBetaState, saveBetaState, ROSTER_SIZE } from "@/lib/beta"

const FALLBACK = "https://static.wixstatic.com/media/815952_22a11f977bc54920b8bb6031745ea039~mv2.jpg"

type Filter = "all" | "male" | "female"
type MobileView = "browse" | "roster"

export default function DraftClient({ wrestlers }: { wrestlers: Wrestler[] }) {
  const [draftedIds, setDraftedIds] = useState<string[]>([])
  const [filter, setFilter] = useState<Filter>("all")
  const [search, setSearch] = useState("")
  const [mobileView, setMobileView] = useState<MobileView>("browse")

  useEffect(() => {
    setDraftedIds(getBetaState().draftedIds)
  }, [])

  const drafted = wrestlers.filter(w => draftedIds.includes(w.id))
  const available = useMemo(() =>
    wrestlers.filter(w => {
      if (draftedIds.includes(w.id)) return false
      if (filter !== "all" && w.gender !== filter) return false
      if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    }), [wrestlers, draftedIds, filter, search])

  const rosterFull = draftedIds.length >= ROSTER_SIZE

  function add(id: string) {
    if (rosterFull) return
    const next = [...draftedIds, id]
    setDraftedIds(next)
    saveBetaState({ ...getBetaState(), draftedIds: next })
  }

  function remove(id: string) {
    const next = draftedIds.filter(d => d !== id)
    setDraftedIds(next)
    const state = getBetaState()
    saveBetaState({ ...state, draftedIds: next, activeIds: state.activeIds.filter(a => a !== id) })
  }

  const tabs: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Men", value: "male" },
    { label: "Women", value: "female" },
  ]

  const rosterPanel = (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-white">Your Roster</h2>
        <span className={`text-sm font-bold ${rosterFull ? "text-[#c9a84c]" : "text-zinc-400"}`}>
          {draftedIds.length}/{ROSTER_SIZE}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#2a2a2a] rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-[#c9a84c] rounded-full transition-all"
          style={{ width: `${(draftedIds.length / ROSTER_SIZE) * 100}%` }}
        />
      </div>

      <div className="flex flex-col gap-2">
        {drafted.map((w, i) => (
          <div key={w.id} className="flex items-center gap-2 group">
            <span className="text-xs text-zinc-600 w-4 shrink-0 tabular-nums">{i + 1}</span>
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#2a2a2a] shrink-0">
              <Image src={w.image_url ?? FALLBACK} alt={w.name} fill sizes="32px" className="object-cover" unoptimized />
            </div>
            <span className="text-xs text-zinc-300 flex-1 truncate">{w.name}</span>
            <button
              onClick={() => remove(w.id)}
              className="text-zinc-600 hover:text-red-400 text-xs shrink-0 p-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100"
              aria-label={`Remove ${w.name}`}
            >
              ✕
            </button>
          </div>
        ))}

        {Array.from({ length: ROSTER_SIZE - drafted.length }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-zinc-700 w-4 tabular-nums">{drafted.length + i + 1}</span>
            <div className="w-8 h-8 rounded-full border border-dashed border-[#2a2a2a]" />
            <span className="text-xs text-zinc-700">Empty</span>
          </div>
        ))}
      </div>

      {rosterFull && (
        <Link
          href="/beta/lineup"
          className="mt-4 w-full block text-center py-2.5 rounded bg-[#c9a84c] text-black font-bold text-sm hover:bg-[#e8c96a] transition-colors"
        >
          Set Lineup →
        </Link>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">Draft Your Roster</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Pick {ROSTER_SIZE} wrestlers to build your team</p>
        </div>
        <Link href="/beta" className="text-sm text-zinc-500 hover:text-white transition-colors shrink-0">
          ← Back
        </Link>
      </div>

      {/* Mobile view toggle */}
      <div className="flex lg:hidden rounded border border-[#2a2a2a] overflow-hidden mb-4">
        <button
          onClick={() => setMobileView("browse")}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${mobileView === "browse" ? "bg-[#c9a84c] text-black" : "text-zinc-400 hover:text-white"}`}
        >
          Browse
        </button>
        <button
          onClick={() => setMobileView("roster")}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors relative ${mobileView === "roster" ? "bg-[#c9a84c] text-black" : "text-zinc-400 hover:text-white"}`}
        >
          My Roster
          <span className={`ml-1.5 text-xs font-bold ${mobileView === "roster" ? "text-black/60" : rosterFull ? "text-[#c9a84c]" : "text-zinc-600"}`}>
            {draftedIds.length}/{ROSTER_SIZE}
          </span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Available wrestlers — shown on desktop always, mobile only on Browse tab */}
        <div className={`flex-1 min-w-0 ${mobileView === "roster" ? "hidden lg:block" : "block"}`}>
          <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
            <div className="flex rounded border border-[#2a2a2a] overflow-hidden shrink-0">
              {tabs.map(t => (
                <button
                  key={t.value}
                  onClick={() => setFilter(t.value)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${filter === t.value ? "bg-[#c9a84c] text-black" : "text-zinc-400 hover:text-white hover:bg-[#2a2a2a]"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search wrestlers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 rounded border border-[#2a2a2a] bg-[#1a1a1a] text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-[#c9a84c]/50"
            />
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2.5">
            {available.map(w => (
              <button
                key={w.id}
                onClick={() => add(w.id)}
                disabled={rosterFull}
                className={`flex flex-col items-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-2.5 text-center transition-colors ${rosterFull ? "opacity-40 cursor-not-allowed" : "hover:border-[#c9a84c]/50 hover:bg-[#222] active:bg-[#2a2a2a] cursor-pointer"}`}
              >
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-[#2a2a2a]">
                  <Image src={w.image_url ?? FALLBACK} alt={w.name} fill sizes="56px" className="object-cover" unoptimized />
                </div>
                <span className="text-[10px] sm:text-xs font-semibold text-center text-white leading-tight line-clamp-2">{w.name}</span>
              </button>
            ))}
            {available.length === 0 && (
              <div className="col-span-full text-center py-12 text-zinc-600 text-sm">No wrestlers found</div>
            )}
          </div>
        </div>

        {/* Roster panel — sidebar on desktop, full view on mobile roster tab */}
        <div className={`lg:w-64 shrink-0 ${mobileView === "browse" ? "hidden lg:block" : "block"}`}>
          <div className="lg:sticky lg:top-20">
            {rosterPanel}
          </div>
        </div>
      </div>
    </div>
  )
}
