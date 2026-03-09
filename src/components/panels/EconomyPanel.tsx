"use client";

import { useGameStore } from "@/stores/gameStore";
import { IDEOLOGY_DEFINITIONS } from "@/data/ideologies";

const SPENDING_KEYS = [
  "military", "government", "security", "education",
  "anti_corruption", "healthcare", "research", "reconstruction",
] as const;

const SPENDING_COLORS: Record<string, string> = {
  military: "#8b0000",
  government: "#1e3a5f",
  security: "#6b21a8",
  education: "#2563eb",
  anti_corruption: "#ca8a04",
  healthcare: "#16a34a",
  research: "#0891b2",
  reconstruction: "#d97706",
};

const SPENDING_LABELS: Record<string, string> = {
  military: "Military",
  government: "Government",
  security: "Security",
  education: "Education",
  anti_corruption: "Anti-Corruption",
  healthcare: "Healthcare",
  research: "Research",
  reconstruction: "Reconstruction",
};

const TAX_COLORS: Record<string, string> = {
  minimum: "#3b82f6",
  low: "#22c55e",
  normal: "#22c55e",
  high: "#f97316",
  maximum: "#ef4444",
};

const RAW_RESOURCES = [
  "iron", "titanium", "copper", "gold", "phosphate", "tungsten",
  "uranium", "oil", "aluminum", "chromium", "diamond",
];

const PROCESSED_RESOURCES = [
  "steel", "motor_parts", "electronics", "fertilizer",
  "enriched_uranium", "consumer_goods", "aircraft_parts",
];

export function EconomyPanel() {
  const { myNation } = useGameStore();

  if (!myNation) {
    return (
      <div className="p-4 text-sm text-white/40 text-center mt-8">
        Loading economy data...
      </div>
    );
  }

  const ideology = IDEOLOGY_DEFINITIONS[myNation.ideology_id];
  const mods = ideology?.modifiers ?? {};
  const totalSpending = SPENDING_KEYS.reduce(
    (sum, k) => sum + ((myNation.spending as Record<string, number>)[k] ?? 0), 0
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto text-sm">
      {/* Treasury */}
      <div className="px-4 py-3 space-y-2 border-b border-white/10">
        <SectionHeader title="Treasury" />
        <StatRow label="Balance" value={`$${myNation.treasury.toLocaleString()}`} />
        <StatRow
          label="Taxation"
          value={capitalize(myNation.taxation_setting)}
          color={TAX_COLORS[myNation.taxation_setting]}
        />
      </div>

      {/* Ideology Economic Modifiers */}
      {ideology && (
        <div className="px-4 py-3 space-y-2 border-b border-white/10">
          <SectionHeader title="Economic Modifiers" />
          <ModRow label="Tax Income" value={mods.tax_income_mult} />
          <ModRow label="Factory Output" value={mods.factory_output_mult} />
          <ModRow label="Trade Income" value={mods.trade_income_mult} />
          <ModRow label="Tech Cost" value={mods.tech_cost_mult} invert />
        </div>
      )}

      {/* Budget Allocation */}
      <div className="px-4 py-3 space-y-1.5 border-b border-white/10">
        <SectionHeader title="Budget Allocation" />
        {SPENDING_KEYS.map((key) => {
          const val = (myNation.spending as Record<string, number>)[key] ?? 0;
          return (
            <div key={key} className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/50">{SPENDING_LABELS[key]}</span>
                <span className="text-white/70 font-mono">{val}%</span>
              </div>
              <StatBar value={val} color={SPENDING_COLORS[key]} />
            </div>
          );
        })}
        <div className="flex justify-between text-xs pt-1 border-t border-white/5">
          <span className="text-white/40">Total</span>
          <span className="text-white/60 font-mono">{totalSpending}%</span>
        </div>
      </div>

      {/* Resources */}
      <div className="px-4 py-3 space-y-2 border-b border-white/10">
        <SectionHeader title="Resources" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {RAW_RESOURCES.map((r) => (
            <div key={r} className="flex justify-between text-xs">
              <span className="text-white/50">{capitalize(r)}</span>
              <span className="text-white/20 font-mono">--</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-white/20 uppercase tracking-wider mt-2">Processed</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {PROCESSED_RESOURCES.map((r) => (
            <div key={r} className="flex justify-between text-xs">
              <span className="text-white/50">{capitalize(r.replace(/_/g, " "))}</span>
              <span className="text-white/20 font-mono">--</span>
            </div>
          ))}
        </div>
        <p className="text-white/20 text-[10px] italic mt-1">Stockpile data available in Phase 2</p>
      </div>

      {/* Economic Context */}
      <div className="px-4 py-3 space-y-2">
        <SectionHeader title="Context" />
        <StatRow label="Population" value={myNation.population.toLocaleString()} />
        <StatRow
          label="Corruption"
          value={`${myNation.corruption.toFixed(1)}%`}
          color={myNation.corruption > 30 ? "#ef4444" : undefined}
        />
        <StatRow
          label="Stability"
          value={`${myNation.stability.toFixed(1)}%`}
          color={myNation.stability > 60 ? "#22c55e" : myNation.stability > 30 ? "#f97316" : "#ef4444"}
        />
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

function StatBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
      />
    </div>
  );
}

function ModRow({ label, value, invert }: { label: string; value?: number; invert?: boolean }) {
  if (value === undefined) return null;
  const pct = ((value - 1) * 100);
  const isPositive = invert ? pct < 0 : pct > 0;
  const isNeutral = Math.abs(pct) < 0.1;
  const color = isNeutral ? undefined : isPositive ? "#22c55e" : "#ef4444";
  const sign = pct > 0 ? "+" : "";
  return (
    <StatRow label={label} value={`${sign}${pct.toFixed(0)}%`} color={color} />
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
