"use client";

import { useState, useMemo } from "react";
import WrestlerCard from "@/components/WrestlerCard";
import { Wrestler } from "@/types/database";

type Filter = "all" | "male" | "female";

export default function RosterClient({ wrestlers }: { wrestlers: Wrestler[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return wrestlers.filter(w => {
      const matchesGender = filter === "all" || w.gender === filter;
      const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase());
      return matchesGender && matchesSearch;
    });
  }, [wrestlers, filter, search]);

  const tabs: { label: string; value: Filter; count: number }[] = [
    { label: "All", value: "all", count: wrestlers.length },
    { label: "Men", value: "male", count: wrestlers.filter(w => w.gender === "male").length },
    { label: "Women", value: "female", count: wrestlers.filter(w => w.gender === "female").length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">AEW Roster</h1>
        <p className="text-zinc-500 text-sm mt-1">Current active roster — synced weekly from AEW</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Filter tabs */}
        <div className="flex rounded border border-[#2a2a2a] overflow-hidden shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === tab.value
                  ? "bg-[#c9a84c] text-black"
                  : "text-zinc-400 hover:text-white hover:bg-[#2a2a2a]"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${filter === tab.value ? "text-black/60" : "text-zinc-600"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search wrestlers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded border border-[#2a2a2a] bg-[#1a1a1a] text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-[#c9a84c]/50"
        />
      </div>

      {/* Results count */}
      {search && (
        <p className="text-zinc-500 text-sm mb-4">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-zinc-600">No wrestlers found</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {filtered.map(wrestler => (
            <WrestlerCard key={wrestler.id} wrestler={wrestler} />
          ))}
        </div>
      )}
    </div>
  );
}
