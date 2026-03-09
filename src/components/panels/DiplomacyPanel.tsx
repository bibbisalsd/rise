"use client";

import { useGameStore } from "@/stores/gameStore";
import { IDEOLOGY_DEFINITIONS } from "@/data/ideologies";

export function DiplomacyPanel() {
  const { myNation, nations } = useGameStore();

  if (!myNation) {
    return (
      <div className="p-4 text-sm text-white/40 text-center mt-8">
        Loading diplomacy data...
      </div>
    );
  }

  const ideology = IDEOLOGY_DEFINITIONS[myNation.ideology_id];
  const otherNations = Object.values(nations).filter((n) => n.id !== myNation.id);

  return (
    <div className="flex flex-col h-full overflow-y-auto text-sm">
      {/* My Ideology */}
      <div className="px-4 py-3 space-y-2 border-b border-white/10">
        <SectionHeader title="Government" />
        {ideology && (
          <>
            <p className="text-white font-semibold">
              {ideology.icon} {ideology.name}
            </p>
            <p className="text-white/40 text-xs line-clamp-2">{ideology.description}</p>
          </>
        )}
        <StatRow label="Political Power" value={`${Math.floor(myNation.political_power)} PP`} />
        {ideology && (
          <StatRow label="PP Gain" value={`${ideology.pp_gain_per_tick} PP/tick`} />
        )}
        <StatRow label="Leader" value={myNation.leader_name ?? "Unknown"} />
        {myNation.leader_traits.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {myNation.leader_traits.map((trait) => (
              <span
                key={trait}
                className="bg-white/5 rounded px-1.5 py-0.5 text-[10px] text-white/60"
              >
                {trait}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Ideology Modifiers */}
      {ideology && (
        <div className="px-4 py-3 space-y-2 border-b border-white/10">
          <SectionHeader title="Ideology Modifiers" />
          <ModRow label="Military Power" value={ideology.modifiers.military_power_mult} />
          <ModRow label="Manpower Cap" value={ideology.modifiers.manpower_cap_mult} />
          <ModRow label="War Exhaustion" value={ideology.modifiers.war_exhaustion_gain_mult} invert />
          <ModRow label="Stability/tick" rawValue={ideology.modifiers.stability_per_tick} />
          <ModRow label="Corruption/tick" rawValue={ideology.modifiers.corruption_per_tick} invert />
          <ModRow label="Research" value={ideology.modifiers.research_power_mult} />
          <ModRow label="Justify War Time" value={ideology.modifiers.justify_war_time_mult} invert />
        </div>
      )}

      {/* Nations & Relations */}
      <div className="px-4 py-3 space-y-2 border-b border-white/10">
        <SectionHeader title={`Nations (${otherNations.length})`} />
        <div className="max-h-60 overflow-y-auto space-y-1 -mx-1 px-1">
          {otherNations.map((nation) => {
            const theirIdeology = IDEOLOGY_DEFINITIONS[nation.ideology_id];
            const compat = getCompatibility(myNation.ideology_id, nation.ideology_id);
            return (
              <div
                key={nation.id}
                className="flex items-center gap-2 py-1 px-1 rounded hover:bg-white/5"
              >
                <div
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: nation.color }}
                />
                <span className="text-white/80 text-xs truncate flex-1">{nation.name}</span>
                {nation.is_ai && (
                  <span className="text-[9px] text-white/30 bg-white/5 rounded px-1">AI</span>
                )}
                {theirIdeology && (
                  <span className="text-[10px]" title={theirIdeology.name}>
                    {theirIdeology.icon}
                  </span>
                )}
                <span
                  className="text-[9px] font-mono shrink-0"
                  style={{ color: compat.color }}
                >
                  {compat.label}
                </span>
              </div>
            );
          })}
          {otherNations.length === 0 && (
            <p className="text-white/30 text-xs italic">No other nations in session.</p>
          )}
        </div>
      </div>

      {/* Wars & Alliances */}
      <div className="px-4 py-3 space-y-3 border-b border-white/10">
        <div>
          <SectionHeader title="Wars" />
          <p className="text-white/20 text-xs italic">Available in Phase 2</p>
        </div>
        <div>
          <SectionHeader title="Alliances" />
          <p className="text-white/20 text-xs italic">Available in Phase 2</p>
        </div>
        <div>
          <SectionHeader title="Trade Deals" />
          <p className="text-white/20 text-xs italic">Available in Phase 2</p>
        </div>
      </div>

      {/* Diplomatic Actions */}
      <div className="px-4 py-3 space-y-2">
        <SectionHeader title="Actions" />
        <div className="flex flex-wrap gap-1.5">
          {["Justify War", "Propose Alliance", "Propose Trade", "Send Ultimatum"].map((action) => (
            <button
              key={action}
              disabled
              className="text-white/20 bg-white/5 rounded px-2 py-1 text-xs cursor-not-allowed"
              title="Available in Phase 2"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <p className="text-xs text-white/40 uppercase tracking-widest mb-1">{title}</p>;
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/50">{label}</span>
      <span className="text-white font-mono text-xs" style={color ? { color } : undefined}>
        {value}
      </span>
    </div>
  );
}

function ModRow({
  label, value, rawValue, invert,
}: {
  label: string; value?: number; rawValue?: number; invert?: boolean;
}) {
  if (value !== undefined) {
    const pct = (value - 1) * 100;
    const isPositive = invert ? pct < 0 : pct > 0;
    const isNeutral = Math.abs(pct) < 0.1;
    const color = isNeutral ? undefined : isPositive ? "#22c55e" : "#ef4444";
    const sign = pct > 0 ? "+" : "";
    return <StatRow label={label} value={`${sign}${pct.toFixed(0)}%`} color={color} />;
  }
  if (rawValue !== undefined) {
    const isPositive = invert ? rawValue < 0 : rawValue > 0;
    const isNeutral = Math.abs(rawValue) < 0.001;
    const color = isNeutral ? undefined : isPositive ? "#22c55e" : "#ef4444";
    const sign = rawValue > 0 ? "+" : "";
    return <StatRow label={label} value={`${sign}${rawValue.toFixed(2)}/tick`} color={color} />;
  }
  return null;
}

function getCompatibility(
  myIdeologyId: string,
  theirIdeologyId: string,
): { label: string; color: string } {
  const mine = IDEOLOGY_DEFINITIONS[myIdeologyId];
  if (!mine) return { label: "Neutral", color: "#6b7280" };
  if (mine.compatible_ideologies?.includes(theirIdeologyId)) {
    return { label: "Friendly", color: "#22c55e" };
  }
  if (mine.hostile_ideologies?.includes(theirIdeologyId)) {
    return { label: "Hostile", color: "#ef4444" };
  }
  return { label: "Neutral", color: "#6b7280" };
}
