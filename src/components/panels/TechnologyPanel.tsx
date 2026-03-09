"use client";

import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { TECH_BY_TREE, type TechDef } from "@/data/tech-trees";

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

export function TechnologyPanel() {
  const { myNation } = useGameStore();
  const [selectedTree, setSelectedTree] = useState("infantry");
  const [expandedTechId, setExpandedTechId] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col h-full overflow-y-auto text-sm">
      {/* Research Header */}
      <div className="px-4 py-3 space-y-2 border-b border-white/10">
        <SectionHeader title="Research" />
        <StatRow label="Research Power" value={`${myNation.research_power.toFixed(1)} RP/tick`} />
        <div className="flex justify-between items-center">
          <span className="text-white/50">Researching</span>
          <span className="text-white/30 text-xs italic">None (Phase 2)</span>
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
              {tierTechs.map((tech) => (
                <TechCard
                  key={tech.id}
                  tech={tech}
                  isExpanded={expandedTechId === tech.id}
                  onToggle={() =>
                    setExpandedTechId(expandedTechId === tech.id ? null : tech.id)
                  }
                />
              ))}
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
  isExpanded,
  onToggle,
}: {
  tech: TechDef;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="border-b border-white/5 cursor-pointer hover:bg-white/5"
      onClick={onToggle}
    >
      {/* Collapsed row */}
      <div className="flex items-center gap-2 px-4 py-2">
        {/* Status dot */}
        <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" title="Available" />
        <span className="text-white/80 text-xs flex-1 truncate">{tech.name}</span>
        <span className="text-white/40 font-mono text-[10px] shrink-0">
          {tech.cost} RP
        </span>
      </div>

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
        </div>
      )}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
