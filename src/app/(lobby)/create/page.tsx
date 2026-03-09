"use client";

import { useState, useMemo } from "react";
import { createSession } from "@/lib/actions/createSession";
import { NATION_DEFINITIONS, type NationDef } from "@/data/nations";

const TIER_LABELS: Record<number, string> = {
  6: "Superpowers",
  5: "Major Powers",
  4: "Regional Powers",
  3: "Middle Powers",
  2: "Minor Nations",
  1: "Micro Nations",
};

const TIER_COLORS: Record<number, string> = {
  6: "#f59e0b",
  5: "#a855f7",
  4: "#3b82f6",
  3: "#22c55e",
  2: "#6b7280",
  1: "#4b5563",
};

export default function CreateGamePage() {
  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [nationTag, setNationTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & group nations by tier (6→1)
  const filteredNations = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = q
      ? NATION_DEFINITIONS.filter(
          (n) =>
            n.name.toLowerCase().includes(q) ||
            n.tag.toLowerCase().includes(q) ||
            n.region.toLowerCase().includes(q)
        )
      : NATION_DEFINITIONS;

    const groups: { tier: number; label: string; nations: NationDef[] }[] = [];
    for (const tier of [6, 5, 4, 3, 2, 1]) {
      const nations = filtered.filter((n) => n.tier === tier);
      if (nations.length > 0) {
        groups.push({ tier, label: TIER_LABELS[tier], nations });
      }
    }
    return groups;
  }, [search]);

  const selectedNation = nationTag
    ? NATION_DEFINITIONS.find((n) => n.tag === nationTag)
    : null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter a session name.");
      return;
    }
    if (!nationTag) {
      setError("Please select a nation.");
      return;
    }

    setLoading(true);

    try {
      await createSession({ name: name.trim(), maxPlayers, nationTag });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      if (message.includes("NEXT_REDIRECT")) return;
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create Game</h1>

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Error message */}
        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Session Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Session Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
            className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50"
            placeholder="World War III"
          />
        </div>

        {/* Max Players */}
        <div>
          <label htmlFor="maxPlayers" className="block text-sm font-medium mb-1">
            Max Players
          </label>
          <select
            id="maxPlayers"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            disabled={loading}
            className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50"
          >
            {[2, 4, 6, 8, 16, 32, 60].map((n) => (
              <option key={n} value={n}>
                {n} Players
              </option>
            ))}
          </select>
        </div>

        {/* Nation Picker */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Select Your Nation
          </label>

          {/* Selected Nation Preview */}
          {selectedNation && (
            <div className="mb-3 px-4 py-3 rounded-lg border-2 border-yellow-400/40 bg-yellow-400/5">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-md border border-white/20"
                  style={{ backgroundColor: selectedNation.color }}
                />
                <div className="flex-1">
                  <p className="font-semibold text-white">
                    {selectedNation.name}
                    <span className="ml-2 text-xs text-white/40 font-mono">
                      [{selectedNation.tag}]
                    </span>
                  </p>
                  <p className="text-xs text-white/50">
                    {selectedNation.region} &middot; Tier {selectedNation.tier} &middot;{" "}
                    Pop: {abbreviate(selectedNation.population)} &middot;{" "}
                    Treasury: ${selectedNation.treasury.toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNationTag(null)}
                  className="text-white/40 hover:text-white text-xs"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nations by name, tag, or region..."
            disabled={loading}
            className="w-full px-3 py-2 mb-2 bg-[var(--input)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50 text-sm"
          />

          {/* Nation List */}
          <div className="max-h-72 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--input)]">
            {filteredNations.map((group) => (
              <div key={group.tier}>
                {/* Tier Header */}
                <div
                  className="sticky top-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 bg-[#1a1f2e] border-b border-white/5 z-10"
                  style={{ color: TIER_COLORS[group.tier] }}
                >
                  <span>Tier {group.tier}</span>
                  <span className="text-white/30 font-normal">{group.label}</span>
                  <span className="text-white/20 font-normal ml-auto">{group.nations.length}</span>
                </div>

                {/* Nations */}
                {group.nations.map((n) => {
                  const isSelected = nationTag === n.tag;
                  return (
                    <button
                      key={n.tag}
                      type="button"
                      disabled={loading}
                      onClick={() => setNationTag(n.tag)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-all text-xs ${
                        isSelected
                          ? "bg-yellow-400/10 border-l-2 border-yellow-400"
                          : "hover:bg-white/5 border-l-2 border-transparent"
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-sm shrink-0 border border-white/10"
                        style={{ backgroundColor: n.color }}
                      />
                      <span className={`flex-1 truncate ${isSelected ? "text-yellow-300 font-medium" : "text-white/80"}`}>
                        {n.name}
                      </span>
                      <span className="text-white/30 font-mono text-[10px] shrink-0">
                        {n.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
            {filteredNations.length === 0 && (
              <p className="text-center text-white/30 text-xs py-6">
                No nations match your search.
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !nationTag}
          className="w-full py-3 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Creating Game...
            </span>
          ) : (
            `Create Game${selectedNation ? ` as ${selectedNation.name}` : ""}`
          )}
        </button>
      </form>
    </div>
  );
}

function abbreviate(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
