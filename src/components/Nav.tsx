import Link from "next/link";

export default function Nav() {
  return (
    <header className="border-b border-[#2a2a2a] bg-[#0d0d0d]/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-[#c9a84c] font-bold text-lg tracking-widest uppercase">AEW</span>
          <span className="text-white font-semibold text-lg tracking-wide">Fantasy</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/roster" className="text-zinc-400 hover:text-white transition-colors">
            Roster
          </Link>
          <Link href="/beta" className="text-zinc-400 hover:text-white transition-colors">
            Beta
          </Link>
          <button
            disabled
            className="px-4 py-1.5 rounded bg-[#c9a84c]/20 text-[#c9a84c] text-sm font-medium border border-[#c9a84c]/30 cursor-not-allowed opacity-60"
          >
            Create League
          </button>
        </nav>
      </div>
    </header>
  );
}
