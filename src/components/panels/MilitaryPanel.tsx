"use client";

import { useState, useTransition } from "react";
import { useGameStore } from "@/stores/gameStore";
import { UNIT_DEFINITIONS } from "@/data/units";
import { trainUnit } from "@/lib/actions/militaryActions";
import type { Unit } from "@/types/military";

const DOMAIN_META: Record<string, { icon: string; label: string }> = {
  land: { icon: "\u{1F6E1}\u{FE0F}", label: "Land" },
  sea: { icon: "\u2693", label: "Naval" },
  air: { icon: "\u2708\u{FE0F}", label: "Air" },
  special: { icon: "\u2622\u{FE0F}", label: "Special" },
};

type Tab = "overview" | "units" | "codex";

export function MilitaryPanel() {
  const { myNation, units, provinces } = useGameStore();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [expandedCodexId, setExpandedCodexId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!myNation) {
    return (
      <div className="p-4 text-sm text-white/40 text-center mt-8">
        Loading military data...
      </div>
    );
  }

  const myUnits = Object.values(units).filter((u) => u.nation_id === myNation.id);
  const myProvinces = Object.values(provinces).filter((p) => p.owner_nation_id === myNation.id);

  const domainCounts: Record<string, number> = {};
  for (const u of myUnits) {
    const def = UNIT_DEFINITIONS[u.unit_type];
    const domain = def?.domain ?? "land";
    domainCounts[domain] = (domainCounts[domain] ?? 0) + 1;
  }

  const combatUnits = myUnits.filter((u) => u.in_combat);

  function handleTrain(unitType: string) {
    if (!myNation) return;
    // Pick a province to train in (first owned province, or capital)
    const trainProvince = myProvinces[0];
    if (!trainProvince) {
      setMessage("No owned provinces to train in.");
      return;
    }
    setMessage(null);
    startTransition(async () => {
      try {
        await trainUnit(myNation.id, trainProvince.id, unitType);
        setMessage(`Training ${UNIT_DEFINITIONS[unitType]?.name ?? unitType}!`);
        setTimeout(() => setMessage(null), 2000);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to train unit.");
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

      {/* Tab Selector */}
      <div className="px-4 py-2 flex gap-1 border-b border-white/10">
        {(["overview", "units", "codex"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              activeTab === tab
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60 hover:bg-white/5"
            }`}
          >
            {tab === "overview" ? "Overview" : tab === "units" ? "My Units" : "Codex"}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          {/* Military Stats */}
          <div className="px-4 py-3 space-y-2 border-b border-white/10">
            <SectionHeader title="Military Stats" />
            <StatRow label="Manpower Pool" value={myNation.manpower_pool.toLocaleString()} />
            <StatRow
              label="Conscription"
              value={capitalize(myNation.conscription_law.replace(/_/g, " "))}
            />
            <StatRow label="Military Spending" value={`${myNation.spending.military}/10`} />
            <StatRow label="Total Units" value={String(myUnits.length)} />
          </div>

          {/* Forces by Domain */}
          <div className="px-4 py-3 space-y-2 border-b border-white/10">
            <SectionHeader title="Forces by Domain" />
            {Object.entries(DOMAIN_META).map(([domain, meta]) => {
              const count = domainCounts[domain] ?? 0;
              if (count === 0) return null;
              return (
                <div key={domain} className="flex items-center gap-2">
                  <span className="text-sm">{meta.icon}</span>
                  <span className="text-white/50 text-xs flex-1">{meta.label}</span>
                  <span className="text-white font-mono text-xs">{count}</span>
                </div>
              );
            })}
            {myUnits.length === 0 && (
              <p className="text-white/30 text-xs italic">No units deployed.</p>
            )}
          </div>

          {/* Active Combats */}
          <div className="px-4 py-3 space-y-2">
            <SectionHeader title="Active Combats" />
            {combatUnits.length === 0 ? (
              <p className="text-white/30 text-xs italic">No active combats.</p>
            ) : (
              combatUnits.slice(0, 10).map((u) => (
                <div key={u.id} className="flex items-center gap-2 text-xs">
                  <span className="text-red-400 font-semibold">COMBAT</span>
                  <span className="text-white/70 truncate">
                    {UNIT_DEFINITIONS[u.unit_type]?.name ?? u.unit_type}
                  </span>
                  <span className="text-white/30 font-mono ml-auto">
                    {u.strength}/{UNIT_DEFINITIONS[u.unit_type]?.base_strength ?? "?"}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === "units" && (
        <div className="px-4 py-3 space-y-1">
          {myUnits.length === 0 ? (
            <p className="text-white/30 text-xs italic mt-4 text-center">
              No units deployed. Train units from the Codex tab.
            </p>
          ) : (
            myUnits
              .sort((a, b) => {
                const da = UNIT_DEFINITIONS[a.unit_type]?.domain ?? "";
                const db = UNIT_DEFINITIONS[b.unit_type]?.domain ?? "";
                return da.localeCompare(db) || a.unit_type.localeCompare(b.unit_type);
              })
              .map((u) => <UnitRow key={u.id} unit={u} />)
          )}
        </div>
      )}

      {activeTab === "codex" && (
        <div className="px-4 py-3 space-y-1">
          {(["land", "sea", "air", "special"] as const).map((domain) => {
            const defs = Object.values(UNIT_DEFINITIONS).filter((d) => d.domain === domain);
            if (defs.length === 0) return null;
            return (
              <div key={domain}>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mt-2 mb-1">
                  {DOMAIN_META[domain]?.icon} {DOMAIN_META[domain]?.label}
                </p>
                {defs.map((def) => (
                  <CodexEntry
                    key={def.type}
                    def={def}
                    isExpanded={expandedCodexId === def.type}
                    isPending={isPending}
                    onToggle={() =>
                      setExpandedCodexId(expandedCodexId === def.type ? null : def.type)
                    }
                    onTrain={() => handleTrain(def.type)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
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

function UnitRow({ unit }: { unit: Unit }) {
  const def = UNIT_DEFINITIONS[unit.unit_type];
  const name = unit.name ?? def?.name ?? unit.unit_type;
  const maxStr = def?.base_strength ?? 1000;
  const strPct = (unit.strength / maxStr) * 100;
  const strColor = strPct > 60 ? "#22c55e" : strPct > 30 ? "#f97316" : "#ef4444";
  const isTraining = unit.strength === 0;

  return (
    <div className="py-1.5 border-b border-white/5 space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-white/80 text-xs truncate flex-1">{name}</span>
        {isTraining && (
          <span className="text-[9px] bg-yellow-500/20 text-yellow-400 rounded px-1">TRAINING</span>
        )}
        {unit.in_combat && (
          <span className="text-[9px] bg-red-500/20 text-red-400 rounded px-1">COMBAT</span>
        )}
        {unit.is_entrenched && (
          <span className="text-[9px] bg-blue-500/20 text-blue-400 rounded px-1">DUG IN</span>
        )}
        {unit.movement_target_id && (
          <span className="text-[9px] bg-yellow-500/20 text-yellow-400 rounded px-1">MOVING</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <StatBar value={strPct} color={strColor} />
        </div>
        <span className="text-[10px] text-white/40 font-mono w-8 text-right">
          M{unit.morale.toFixed(0)}
        </span>
        <span className="text-[10px] text-white/40 font-mono w-8 text-right">
          O{unit.organization.toFixed(0)}
        </span>
      </div>
    </div>
  );
}

function CodexEntry({
  def,
  isExpanded,
  isPending,
  onToggle,
  onTrain,
}: {
  def: (typeof UNIT_DEFINITIONS)[string];
  isExpanded: boolean;
  isPending: boolean;
  onToggle: () => void;
  onTrain: () => void;
}) {
  return (
    <div
      className="border-b border-white/5 cursor-pointer hover:bg-white/5 rounded"
      onClick={onToggle}
    >
      <div className="flex items-center gap-2 py-1.5 px-1">
        <span className="text-white/80 text-xs flex-1">{def.name}</span>
        <span className="text-[10px] text-white/40 font-mono">
          {def.attack}A / {def.defense}D
        </span>
      </div>
      {isExpanded && (
        <div className="px-2 pb-2 space-y-1 text-[10px]">
          <p className="text-white/40">{def.description}</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-white/50">
            <span>Strength: <b className="text-white/70">{def.base_strength}</b></span>
            <span>Movement: <b className="text-white/70">{def.movement}</b></span>
            <span>Upkeep: <b className="text-white/70">${def.upkeep_per_tick}/tick</b></span>
            <span>Manpower: <b className="text-white/70">{def.manpower_cost.toLocaleString()}</b></span>
            <span>Gold: <b className="text-white/70">${def.gold_cost.toLocaleString()}</b></span>
            <span>Training: <b className="text-white/70">{def.training_days}d</b></span>
          </div>
          {def.requires_tech && (
            <p className="text-yellow-400/70">Requires: {def.requires_tech}</p>
          )}
          {def.requires_building && (
            <p className="text-blue-400/70">Building: {capitalize(def.requires_building)}</p>
          )}
          {def.counters.length > 0 && (
            <p className="text-green-400/70">
              Strong vs: {def.counters.map((c) => capitalize(c.replace(/_/g, " "))).join(", ")}
            </p>
          )}
          {def.weak_to.length > 0 && (
            <p className="text-red-400/70">
              Weak to: {def.weak_to.map((w) => capitalize(w.replace(/_/g, " "))).join(", ")}
            </p>
          )}
          {def.special_abilities.length > 0 && (
            <p className="text-cyan-400/70">
              Abilities: {def.special_abilities.map((a) => capitalize(a.replace(/_/g, " "))).join(", ")}
            </p>
          )}

          {/* Train button */}
          <button
            onClick={(e) => { e.stopPropagation(); onTrain(); }}
            disabled={isPending}
            className="mt-1 px-3 py-1 bg-green-500/20 text-green-300 text-[10px] font-medium rounded hover:bg-green-500/30 transition-colors disabled:opacity-50"
          >
            {isPending ? "..." : `Train ($${def.gold_cost.toLocaleString()} / ${def.manpower_cost.toLocaleString()} MP)`}
          </button>
        </div>
      )}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
