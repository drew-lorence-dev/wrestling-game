import Link from "next/link"
import Countdown from "@/components/Countdown"

export default function BetaPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <span className="text-xs font-bold tracking-[0.25em] uppercase text-[#c9a84c]">Beta Mode</span>
        <h1 className="text-3xl font-extrabold text-white mt-1">Solo Testing</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Draft your roster and set your lineup to test the scoring system.
        </p>
      </div>

      {/* Lineup lock info */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Lineup locks in</div>
            <div className="text-2xl font-bold">
              <Countdown />
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-500">Every Wednesday</div>
            <div className="text-sm text-zinc-400 font-medium">5:00 PM ET</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#2a2a2a] grid grid-cols-2 gap-3 text-sm text-zinc-400">
          <div>📺 <span className="text-white">Dynamite</span> — Wed 8 PM ET</div>
          <div>📺 <span className="text-white">Collision</span> — Sat 8 PM ET</div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/beta/draft"
          className="flex flex-col gap-1 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#c9a84c]/40 rounded-lg p-5 transition-colors"
        >
          <span className="text-lg font-bold text-white">Draft Roster</span>
          <span className="text-sm text-zinc-500">Pick your 15 wrestlers</span>
        </Link>
        <Link
          href="/beta/lineup"
          className="flex flex-col gap-1 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#c9a84c]/40 rounded-lg p-5 transition-colors"
        >
          <span className="text-lg font-bold text-white">Set Lineup</span>
          <span className="text-sm text-zinc-500">Choose 10 active, 5 bench</span>
        </Link>
        <Link
          href="/beta/scores"
          className="flex flex-col gap-1 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#c9a84c]/40 rounded-lg p-5 transition-colors"
        >
          <span className="text-lg font-bold text-white">Weekly Scores</span>
          <span className="text-sm text-zinc-500">See how your lineup scored on recent shows</span>
        </Link>
        <Link
          href="/beta/matches"
          className="flex flex-col gap-1 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#c9a84c]/40 rounded-lg p-5 transition-colors"
        >
          <span className="text-lg font-bold text-white">Match History</span>
          <span className="text-sm text-zinc-500">Browse scraped show results and cross-check data</span>
        </Link>
      </div>

      <p className="text-zinc-600 text-xs mt-6 text-center">
        Draft and lineup are saved locally in your browser for beta testing.
      </p>
    </div>
  )
}
