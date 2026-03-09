"use client";

import dynamic from "next/dynamic";
import { useGameSession } from "@/hooks/useGameSession";
import { useGameStore } from "@/stores/gameStore";
import { NationPanel } from "@/components/panels/NationPanel";
import { EconomyPanel } from "@/components/panels/EconomyPanel";
import { TechnologyPanel } from "@/components/panels/TechnologyPanel";
import { MilitaryPanel } from "@/components/panels/MilitaryPanel";
import { DiplomacyPanel } from "@/components/panels/DiplomacyPanel";

// PixiJS must be client-only — no SSR
const GameMap = dynamic(() => import("@/components/map/GameMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#0d1b2a]">
      <div className="text-white/40 text-sm animate-pulse">Loading map...</div>
    </div>
  ),
});

const PANEL_TABS = [
  { id: "country",   label: "Country"   },
  { id: "diplomacy", label: "Diplomacy" },
  { id: "economy",   label: "Economy"   },
  { id: "technology",label: "Technology"},
  { id: "military",  label: "Military"  },
] as const;

type PanelId = typeof PANEL_TABS[number]["id"];

export default function GamePageClient({ sessionId }: { sessionId: string }) {
  // Load all game data + subscribe to realtime
  useGameSession(sessionId);

  const {
    myNation, gameDate, currentTick,
    activePanel, setActivePanel,
    isLoading, error,
  } = useGameStore();

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-lg font-semibold">Failed to load game</p>
          <p className="text-white/40 text-sm">{error}</p>
          <a href="/lobby" className="text-blue-400 text-sm underline">← Back to lobby</a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0f1a] overflow-hidden select-none">

      {/* ── Top Bar ──────────────────────────────────────── */}
      <header className="h-11 flex-shrink-0 flex items-center px-3 gap-3
                         border-b border-white/10 bg-[#0d1420]/90 backdrop-blur-sm z-20">
        {/* Logo */}
        <a href="/lobby" className="text-sm font-bold tracking-tight shrink-0">
          <span className="text-yellow-400">Rise</span>
          <span className="text-white/80"> of Fronts</span>
        </a>

        <div className="w-px h-5 bg-white/10" />

        {/* Tab bar */}
        <nav className="flex items-center gap-0.5">
          {PANEL_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActivePanel(activePanel === tab.id ? null : tab.id as PanelId)
              }
              className={`
                px-3 py-1.5 rounded text-xs font-medium transition-all
                ${activePanel === tab.id
                  ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/30"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Game clock */}
        <div className="flex items-center gap-3 shrink-0">
          {isLoading && (
            <span className="text-xs text-white/30 animate-pulse">syncing...</span>
          )}
          <span className="text-xs text-white/40 font-mono">Tick {currentTick}</span>
          <span className="text-sm font-mono text-white/80 bg-white/5 px-2 py-1 rounded">
            📅 {gameDate}
          </span>
        </div>

        {/* My nation badge */}
        {myNation && (
          <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-white/10">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: myNation.color }}
            />
            <span className="text-xs text-white/70 font-medium max-w-[120px] truncate">
              {myNation.name}
            </span>
          </div>
        )}
      </header>

      {/* ── Main Area ────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ── Map ─────────────────────────────────────── */}
        <div className="flex-1 relative">
          <GameMap />

          {/* Map overlay: quick resource bar (bottom of map) */}
          {myNation && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2
                            flex items-center gap-4 bg-black/70 backdrop-blur-sm
                            border border-white/10 rounded-lg px-4 py-2 text-xs font-mono z-10">
              <QuickStat icon="💰" label="Treasury" value={`$${abbreviate(myNation.treasury)}`} />
              <QuickStat icon="👥" label="Manpower" value={abbreviate(myNation.manpower_pool)} />
              <QuickStat icon="⚡" label="PP" value={Math.floor(myNation.political_power).toString()} />
              <QuickStat icon="🔬" label="RP" value={myNation.research_power.toFixed(1)} />
              <QuickStat icon="📊" label="Stability" value={`${myNation.stability.toFixed(0)}%`} color={
                myNation.stability > 60 ? "#22c55e" : myNation.stability > 30 ? "#f97316" : "#ef4444"
              } />
            </div>
          )}

          {/* Zoom hint */}
          <div className="absolute top-3 right-3 text-xs text-white/20 pointer-events-none">
            Scroll to zoom · Drag to pan
          </div>
        </div>

        {/* ── Right Panel ──────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 flex flex-col
                          border-l border-white/10 bg-[#0d1420]/95 backdrop-blur-sm">

          {/* Panel content based on active tab */}
          {(activePanel === "country" || !activePanel) && <NationPanel />}
          {activePanel === "diplomacy" && <DiplomacyPanel />}
          {activePanel === "economy"   && <EconomyPanel />}
          {activePanel === "technology"&& <TechnologyPanel />}
          {activePanel === "military"  && <MilitaryPanel />}
        </aside>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────
function QuickStat({
  icon, label, value, color,
}: {
  icon: string; label: string; value: string; color?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span>{icon}</span>
      <span className="text-white/40">{label}</span>
      <span className="text-white font-semibold" style={color ? { color } : undefined}>
        {value}
      </span>
    </div>
  );
}


function abbreviate(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
