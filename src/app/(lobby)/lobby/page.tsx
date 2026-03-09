"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { joinSession } from "@/lib/actions/joinSession";
import { NATION_DEFINITIONS, type NationDef } from "@/data/nations";

interface GameSessionRow {
  id: string;
  name: string;
  status: string;
  max_players: number;
  current_tick: number;
  game_date: string;
  created_at: string;
  host_user_id: string;
}

interface NationRow {
  id: string;
  session_id: string;
  tag: string;
  name: string;
  user_id: string;
}

const TIER_LABELS: Record<number, string> = {
  6: "Superpowers", 5: "Major Powers", 4: "Regional Powers",
  3: "Middle Powers", 2: "Minor Nations", 1: "Micro Nations",
};

const TIER_COLORS: Record<number, string> = {
  6: "#f59e0b", 5: "#a855f7", 4: "#3b82f6",
  3: "#22c55e", 2: "#6b7280", 1: "#4b5563",
};

export default function LobbyPage() {
  const [sessions, setSessions] = useState<GameSessionRow[]>([]);
  const [sessionNations, setSessionNations] = useState<Record<string, NationRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Join dialog state
  const [joinSessionId, setJoinSessionId] = useState<string | null>(null);
  const [nationTag, setNationTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSessions() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const { data: allSessions } = await supabase
        .from("game_sessions")
        .select("*")
        .in("status", ["active", "lobby"])
        .order("created_at", { ascending: false });

      if (allSessions) {
        setSessions(allSessions as GameSessionRow[]);

        // Load nations for each session
        const nationMap: Record<string, NationRow[]> = {};
        for (const s of allSessions) {
          const { data: nations } = await supabase
            .from("nations")
            .select("id, session_id, tag, name, user_id")
            .eq("session_id", s.id);
          nationMap[s.id] = (nations as NationRow[]) ?? [];
        }
        setSessionNations(nationMap);
      }

      setLoading(false);
    }
    loadSessions();
  }, []);

  // Get taken tags for selected session
  const takenTags = joinSessionId
    ? (sessionNations[joinSessionId] ?? []).map((n) => n.tag)
    : [];

  const filteredNations = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = NATION_DEFINITIONS.filter((n) => {
      if (n.formable) return false; // Exclude formable nations (not starting nations)
      if (takenTags.includes(n.tag)) return false;
      if (!q) return true;
      return n.name.toLowerCase().includes(q) ||
        n.tag.toLowerCase().includes(q) ||
        n.region.toLowerCase().includes(q);
    });

    const groups: { tier: number; label: string; nations: NationDef[] }[] = [];
    for (const tier of [6, 5, 4, 3, 2, 1]) {
      const nations = filtered.filter((n) => n.tier === tier);
      if (nations.length > 0) {
        groups.push({ tier, label: TIER_LABELS[tier], nations });
      }
    }
    return groups;
  }, [search, takenTags]);

  async function handleJoin() {
    if (!joinSessionId || !nationTag) return;
    setJoinLoading(true);
    setError(null);
    try {
      await joinSession({ sessionId: joinSessionId, nationTag });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to join.";
      if (msg.includes("NEXT_REDIRECT")) return;
      setError(msg);
      setJoinLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Game Lobby</h1>
        <Link
          href="/create"
          className="px-6 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          Create Game
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-white/40 py-12 animate-pulse">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="border border-[var(--border)] rounded-xl p-8 text-center">
          <p className="text-[var(--muted-foreground)] text-lg mb-4">No active games yet</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            Create a new game session or wait for others to host one.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const nations = sessionNations[s.id] ?? [];
            const isIn = userId && nations.some((n) => n.user_id === userId);
            const isFull = nations.length >= s.max_players;

            return (
              <div
                key={s.id}
                className="border border-[var(--border)] rounded-xl p-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{s.name}</h3>
                    <p className="text-sm text-white/50">
                      {nations.length}/{s.max_players} players &middot; Tick {s.current_tick} &middot; {s.game_date}
                    </p>
                    {nations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {nations.map((n) => (
                          <span key={n.id} className="text-[10px] bg-white/5 rounded px-1.5 py-0.5 text-white/60">
                            {n.name} ({n.tag})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {isIn ? (
                      <Link
                        href={`/game/${s.id}`}
                        className="px-4 py-2 bg-green-500/20 text-green-300 font-medium rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                      >
                        Resume
                      </Link>
                    ) : isFull ? (
                      <span className="px-4 py-2 text-white/30 text-sm">Full</span>
                    ) : (
                      <button
                        onClick={() => {
                          setJoinSessionId(s.id);
                          setNationTag(null);
                          setSearch("");
                          setError(null);
                        }}
                        className="px-4 py-2 bg-blue-500/20 text-blue-300 font-medium rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Join Dialog */}
      {joinSessionId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1f2e] border border-white/10 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Select Your Nation</h2>
              <button
                onClick={() => setJoinSessionId(null)}
                className="text-white/40 hover:text-white text-lg"
              >
                &times;
              </button>
            </div>

            {error && (
              <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                {error}
              </div>
            )}

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search nations..."
              className="w-full px-3 py-2 mb-3 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
            />

            <div className="max-h-60 overflow-y-auto rounded-lg border border-white/10 mb-4">
              {filteredNations.map((group) => (
                <div key={group.tier}>
                  <div
                    className="sticky top-0 px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-[#1a1f2e] border-b border-white/5 z-10"
                    style={{ color: TIER_COLORS[group.tier] }}
                  >
                    Tier {group.tier} &middot; {group.label}
                  </div>
                  {group.nations.map((n) => (
                    <button
                      key={n.tag}
                      type="button"
                      onClick={() => setNationTag(n.tag)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-all ${
                        nationTag === n.tag
                          ? "bg-yellow-400/10 border-l-2 border-yellow-400"
                          : "hover:bg-white/5 border-l-2 border-transparent"
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-sm shrink-0 border border-white/10"
                        style={{ backgroundColor: n.color }}
                      />
                      <span className={nationTag === n.tag ? "text-yellow-300 font-medium" : "text-white/80"}>
                        {n.name}
                      </span>
                      <span className="text-white/30 font-mono text-[10px] ml-auto">{n.tag}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <button
              onClick={handleJoin}
              disabled={!nationTag || joinLoading}
              className="w-full py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joinLoading ? "Joining..." : nationTag
                ? `Join as ${NATION_DEFINITIONS.find((n) => n.tag === nationTag)?.name}`
                : "Select a nation"
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
