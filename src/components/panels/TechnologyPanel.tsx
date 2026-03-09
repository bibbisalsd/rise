"use client";

import { useState, useTransition } from "react";
import { useGameStore } from "@/stores/gameStore";
import { TECH_BY_TREE, type TechDef } from "@/data/tech-trees";
import { startResearch, cancelResearch } from "@/lib/actions/techActions";
import type { TechStatus } from "@/types/tech";

const TREE_META: Record<string, { icon: string; short: string; label: string }> = {
  infantry:  { icon: "\u{1F52B}", short: "INF", label: "Infantry" },
  tank:      { icon: "\u{1F6E1}\u{FE0F}", short: "TNK", label: "Armor" },
  support:   { icon: "\u{1FA79}", short: "SUP", label: "Support" },
  naval:     { icon: "\u2693",    short: "NAV", label: "Naval" },
  aircraft:  { icon: "\u2708\u{FE0F}", short: "AIR", label: "Aircraft" },
  economy:   { icon: "\u{1F4B0}", short: "ECO", label: "Economy" },
  research:  { icon: "\u{1F52C}", short: "RES", label: "Research" },
  political: { icon: "\u{1F3DB}\u{FE0F}", short: "POL", label: "Political" },
};

const TREE_IDS = Object.keys(TREE_META);

const STATUS_COLORS: Record<TechStatus, string> = {
  locked: "#6b7280",
  available: "#3b82f6",
  researching: "#f59e0b",
  completed: "#22c55e",
};

export function TechnologyPanel() {
  const { myNation, techResearch } = useGameStore();
  const [selectedTree, setSelectedTree] = useState("infantry");
  const [expandedTechId, setExpandedTechId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!myNation) {
    return (
      <div className="p-4 text-sm text-white/40 text-center mt-8">
        Loading technology data...
      </div>
    );
  }

  const techs = TECH_BY_TREE[selectedTree] ?? [];
  const tiers = [1, 2, 3, 4, 5].map((t) => ({
    tier: t,
    techs: techs.filter((tech) => tech.tier === t),
  }));

  // Find currently researching tech
  const researchingTech = Object.values(techResearch).find((t) => t.status === "researching");

  function handleStartResearch(techId: string) {
    if (!myNation) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await startResearch(myNation.id, techId);
        setMessage("Research started!");
        setTimeout(() => setMessage(null), 2000);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to start research.");
      }
    });
  }

  function handleCancelResearch(techId: string) {
    if (!myNation) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await cancelResearch(myNation.id, techId);
        setMessage("Research cancelled.");
        setTimeout(() => setMessage(null), 2000);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to cancel research.");
      }
    });
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto text-sm">
      {/* Message */}
      {message && (
        <div className="px-4 py-2 text-xs text-center text-yellow-300 bg-yellow-400/10">
          {message}
        </div>
      )}

      {/* Research Header */}
      <div className="px-4 py-3 space-y-2 border-b border-white/10">
        <SectionHeader title="Research" />
        <StatRow label="Research Power" value={`${myNation.research_power.toFixed(1)} RP/tick`} />
        <div className="flex justify-between items-center">
          <span className="text-white/50">Researching</span>
          {researchingTech ? (
            <span className="text-yellow-400 text-xs font-medium">
              {researchingTech.tech_id.replace(/_/g, " ")} ({researchingTech.progress.toFixed(0)}%)
            </span>
          ) : (
            <span className="text-white/30 text-xs italic">None</span>
          )}
        </div>
      </div>

      {/* Tree Selector */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="grid grid-cols-4 gap-1">
          {TREE_IDS.map((id) => {
            const meta = TREE_META[id];
            const isActive = selectedTree === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setSelectedTree(id);
                  setExpandedTechId(null);
                }}
                className={`flex flex-col items-center gap-0.5 py-1.5 rounded text-[10px] font-medium transition-all ${
                  isActive
                    ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/30"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <span className="text-sm">{meta.icon}</span>
                <span>{meta.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tech List */}
      <div className="flex-1">
        {tiers.map(({ tier, techs: tierTechs }) => {
          if (tierTechs.length === 0) return null;
          return (
            <div key={tier}>
              <div className="flex items-center gap-2 px-4 py-1.5 bg-white/[0.02]">
                <span className="text-[10px] text-white/30 uppercase tracking-widest">
                  Tier {tier}
                </span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              {tierTechs.map((tech) => {
                const research = techResearch[tech.id];
                const status: TechStatus = research?.status ?? "locked";
                const progress = research?.progress ?? 0;
                return (
                  <TechCard
                    key={tech.id}
                    tech={tech}
                    status={status}
                    progress={progress}
                    isExpanded={expandedTechId === tech.id}
                    isPending={isPending}
                    onToggle={() =>
                      setExpandedTechId(expandedTechId === tech.id ? null : tech.id)
                    }
                    onStartResearch={() => handleStartResearch(tech.id)}
                    onCancelResearch={() => handleCancelResearch(tech.id)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <p className="text-xs text-white/40 uppercase tracking-widest mb-1">{title}</p>;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/50">{label}</span>
      <span className="text-white font-mono text-xs">{value}</span>
    </div>
  );
}

function TechCard({
  tech,
  status,
  progress,
  isExpanded,
  isPending,
  onToggle,
  onStartResearch,
  onCancelResearch,
}: {
  tech: TechDef;
  status: TechStatus;
  progress: number;
  isExpanded: boolean;
  isPending: boolean;
  onToggle: () => void;
  onStartResearch: () => void;
  onCancelResearch: () => void;
}) {
  return (
    <div
      className="border-b border-white/5 cursor-pointer hover:bg-white/5"
      onClick={onToggle}
    >
      {/* Collapsed row */}
      <div className="flex items-center gap-2 px-4 py-2">
        {/* Status dot */}
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: STATUS_COLORS[status] }}
          title={capitalize(status)}
        />
        <span className={`text-xs flex-1 truncate ${
          status === "completed" ? "text-green-400/80" :
          status === "researching" ? "text-yellow-300" :
          status === "available" ? "text-white/80" :
          "text-white/40"
        }`}>
          {tech.name}
        </span>
        {status === "researching" && (
          <span className="text-yellow-400 font-mono text-[10px] shrink-0">
            {progress.toFixed(0)}%
          </span>
        )}
        {status === "completed" && (
          <span className="text-green-400/70 text-[10px] shrink-0">DONE</span>
        )}
        {(status === "locked" || status === "available") && (
          <span className="text-white/40 font-mono text-[10px] shrink-0">
            {tech.cost} RP
          </span>
        )}
      </div>

      {/* Research progress bar */}
      {status === "researching" && (
        <div className="mx-4 mb-1 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-yellow-400 transition-all duration-300"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-3 space-y-1.5">
          <p className="text-white/40 text-[10px] leading-relaxed">{tech.description}</p>

          {/* Effects */}
          {tech.effects.length > 0 && (
            <div className="space-y-0.5">
              {tech.effects.map((eff, i) => (
                <p key={i} className="text-[10px] text-green-400/80">
                  + {eff.description}
                </p>
              ))}
            </div>
          )}

          {/* Unlocks */}
          {tech.unlocks_unit && (
            <p className="text-[10px] text-yellow-400/80">
              Unlocks unit: {capitalize(tech.unlocks_unit.replace(/_/g, " "))}
            </p>
          )}
          {tech.unlocks_building && (
            <p className="text-[10px] text-yellow-400/80">
              Unlocks building: {capitalize(tech.unlocks_building.replace(/_/g, " "))}
            </p>
          )}

          {/* Requirements */}
          {tech.requires_ideology && (
            <p className="text-[10px] text-purple-400/80">
              Requires: {capitalize(tech.requires_ideology.replace(/_/g, " "))}
            </p>
          )}
          {tech.mutually_exclusive && tech.mutually_exclusive.length > 0 && (
            <p className="text-[10px] text-red-400/80">
              Exclusive with: {tech.mutually_exclusive.join(", ")}
            </p>
          )}

          {/* Prerequisites */}
          <p className="text-[10px] text-white/30">
            Prereqs: {tech.prerequisites.length > 0 ? tech.prerequisites.join(", ") : "None"}
          </p>

          {/* Action buttons */}
          <div className="pt-1">
            {status === "available" && (
              <button
                onClick={(e) => { e.stopPropagation(); onStartResearch(); }}
                disabled={isPending}
                className="px-3 py-1 bg-blue-500/20 text-blue-300 text-[10px] font-medium rounded hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                {isPending ? "..." : "Research"}
              </button>
            )}
            {status === "researching" && (
              <button
                onClick={(e) => { e.stopPropagation(); onCancelResearch(); }}
                disabled={isPending}
                className="px-3 py-1 bg-red-500/20 text-red-300 text-[10px] font-medium rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {isPending ? "..." : "Cancel Research"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
