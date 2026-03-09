"use client";

import { useState, useTransition } from "react";
import { useGameStore } from "@/stores/gameStore";
import { IDEOLOGY_DEFINITIONS } from "@/data/ideologies";
import { updateSpending, updateTaxation, updateConscription } from "@/lib/actions/economyActions";
import type { SpendingSliders, TaxationSetting, ConscriptionLaw } from "@/types/game";

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

const TAX_LABELS: TaxationSetting[] = ["minimum", "low", "normal", "high", "maximum"];

const TAX_COLORS: Record<string, string> = {
  minimum: "#3b82f6",
  low: "#22c55e",
  normal: "#22c55e",
  high: "#f97316",
  maximum: "#ef4444",
};

const CONSCRIPTION_LABELS: ConscriptionLaw[] = [
  "volunteer_only", "limited_conscript", "extensive_conscript", "mass_mobilization",
];

const RAW_RESOURCES = [
  "iron", "titanium", "copper", "gold", "phosphate", "tungsten",
  "uranium", "oil", "aluminum", "chromium", "diamond",
];

const PROCESSED_RESOURCES = [
  "steel", "motor_parts", "electronics", "fertilizer",
  "enriched_uranium", "consumer_goods", "aircraft_parts",
];

export function EconomyPanel() {
  const { myNation, resourceStockpiles } = useGameStore();
  const [localSpending, setLocalSpending] = useState<SpendingSliders | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!myNation) {
    return (
      <div className="p-4 text-sm text-white/40 text-center mt-8">
        Loading economy data...
      </div>
    );
  }

  const ideology = IDEOLOGY_DEFINITIONS[myNation.ideology_id];
  const mods = ideology?.modifiers ?? {};

  // Use local spending if user is editing, otherwise use store
  const spending = localSpending ?? myNation.spending;
  const totalSpending = SPENDING_KEYS.reduce(
    (sum, k) => sum + (spending[k] ?? 0), 0
  );
  const hasChanges = localSpending !== null;

  function handleSliderChange(key: keyof SpendingSliders, value: number) {
    const prev = localSpending ?? { ...myNation!.spending };
    setLocalSpending({ ...prev, [key]: value });
    setMessage(null);
  }

  function handleSaveSpending() {
    if (!localSpending || !myNation) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await updateSpending(myNation.id, localSpending);
        setLocalSpending(null);
        setMessage("Spending saved!");
        setTimeout(() => setMessage(null), 2000);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  }

  function handleTaxChange(setting: TaxationSetting) {
    if (!myNation) return;
    startTransition(async () => {
      try {
        await updateTaxation(myNation.id, setting);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to update taxation.");
      }
    });
  }

  function handleConscriptionChange(law: ConscriptionLaw) {
    if (!myNation) return;
    startTransition(async () => {
      try {
        await updateConscription(myNation.id, law);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to update conscription.");
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

      {/* Treasury */}
      <div className="px-4 py-3 space-y-2 border-b border-white/10">
        <SectionHeader title="Treasury" />
        <StatRow label="Balance" value={`$${myNation.treasury.toLocaleString()}`} />

        {/* Tax dropdown */}
        <div className="flex justify-between items-center">
          <span className="text-white/50">Taxation</span>
          <select
            value={myNation.taxation_setting}
            onChange={(e) => handleTaxChange(e.target.value as TaxationSetting)}
            disabled={isPending}
            className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-xs text-white cursor-pointer focus:outline-none"
            style={{ color: TAX_COLORS[myNation.taxation_setting] }}
          >
            {TAX_LABELS.map((t) => (
              <option key={t} value={t}>{capitalize(t)}</option>
            ))}
          </select>
        </div>

        {/* Conscription dropdown */}
        <div className="flex justify-between items-center">
          <span className="text-white/50">Conscription</span>
          <select
            value={myNation.conscription_law}
            onChange={(e) => handleConscriptionChange(e.target.value as ConscriptionLaw)}
            disabled={isPending}
            className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-xs text-white cursor-pointer focus:outline-none"
          >
            {CONSCRIPTION_LABELS.map((c) => (
              <option key={c} value={c}>{capitalize(c.replace(/_/g, " "))}</option>
            ))}
          </select>
        </div>
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

      {/* Budget Allocation (Interactive Sliders) */}
      <div className="px-4 py-3 space-y-1.5 border-b border-white/10">
        <SectionHeader title="Budget Allocation" />
        {SPENDING_KEYS.map((key) => {
          const val = spending[key] ?? 0;
          return (
            <div key={key} className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/50">{SPENDING_LABELS[key]}</span>
                <span className="text-white/70 font-mono">{val}/10</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={val}
                onChange={(e) => handleSliderChange(key, Number(e.target.value))}
                disabled={isPending}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${SPENDING_COLORS[key]} ${val * 10}%, rgba(255,255,255,0.1) ${val * 10}%)`,
                }}
              />
            </div>
          );
        })}
        <div className="flex justify-between text-xs pt-1 border-t border-white/5">
          <span className="text-white/40">Total</span>
          <span className={`font-mono ${totalSpending > 60 ? "text-red-400" : "text-white/60"}`}>
            {totalSpending}/80
          </span>
        </div>

        {/* Save button */}
        {hasChanges && (
          <button
            onClick={handleSaveSpending}
            disabled={isPending}
            className="w-full mt-2 py-1.5 bg-yellow-400/20 text-yellow-300 text-xs font-medium rounded hover:bg-yellow-400/30 transition-colors disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Spending"}
          </button>
        )}
      </div>

      {/* Resources (now shows actual data) */}
      <div className="px-4 py-3 space-y-2 border-b border-white/10">
        <SectionHeader title="Resources" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {RAW_RESOURCES.map((r) => {
            const stock = resourceStockpiles[r];
            return (
              <div key={r} className="flex justify-between text-xs">
                <span className="text-white/50">{capitalize(r)}</span>
                <span className="text-white/70 font-mono">
                  {stock ? Math.floor(stock.stockpile).toLocaleString() : "--"}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-white/20 uppercase tracking-wider mt-2">Processed</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {PROCESSED_RESOURCES.map((r) => {
            const stock = resourceStockpiles[r];
            return (
              <div key={r} className="flex justify-between text-xs">
                <span className="text-white/50">{capitalize(r.replace(/_/g, " "))}</span>
                <span className="text-white/70 font-mono">
                  {stock ? Math.floor(stock.stockpile).toLocaleString() : "--"}
                </span>
              </div>
            );
          })}
        </div>
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
