import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

async function getStats() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { count: men } = await supabase
    .from("wrestlers")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .eq("gender", "male");
  const { count: women } = await supabase
    .from("wrestlers")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .eq("gender", "female");
  return { men: men ?? 0, women: women ?? 0 };
}

export default async function HomePage() {
  const { men, women } = await getStats();

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 gap-8">
        <div className="flex flex-col items-center gap-4">
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-[#c9a84c]">
            All Elite Wrestling
          </span>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white">
            AEW Fantasy
          </h1>
          <p className="text-zinc-400 text-lg max-w-md">
            Draft your roster, set your lineup, and compete with friends based on real AEW results every week.
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-[#c9a84c]">{men}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Men</div>
          </div>
          <div className="w-px h-10 bg-[#2a2a2a]" />
          <div>
            <div className="text-3xl font-bold text-[#c9a84c]">{women}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Women</div>
          </div>
          <div className="w-px h-10 bg-[#2a2a2a]" />
          <div>
            <div className="text-3xl font-bold text-[#c9a84c]">{men + women}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Total</div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
          <Link
            href="/roster"
            className="px-8 py-3 rounded bg-[#c9a84c] text-black font-bold tracking-wide hover:bg-[#e8c96a] transition-colors text-center"
          >
            View Roster
          </Link>
          <button
            disabled
            className="px-8 py-3 rounded border border-[#2a2a2a] text-zinc-500 font-semibold tracking-wide cursor-not-allowed"
          >
            Create League
          </button>
        </div>

        <p className="text-zinc-600 text-xs">League creation coming soon — auth required</p>
      </section>
    </div>
  );
}
