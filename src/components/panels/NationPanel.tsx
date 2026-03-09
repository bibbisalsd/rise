"use client";

import { useGameStore } from "@/stores/gameStore";

const STAT_BAR_COLORS: Record<string, string> = {
  stability: "#22c55e",
  corruption: "#ef4444",
  war_exhaustion: "#f97316",
};

function StatBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function NationPanel() {
  const { myNation, nations, selectedProvinceId, provinces, units } = useGameStore();

  const selectedProvince = selectedProvinceId ? provinces[selectedProvinceId] : null;
  const ownerNation = selectedProvince?.owner_nation_id
    ? nations[selectedProvince.owner_nation_id]
    : null;

  const provinceUnits = selectedProvinceId
    ? Object.values(units).filter((u) => u.province_id === selectedProvinceId)
    : [];

  if (!myNation) {
    return (
      <div className="p-4 text-sm text-white/40 text-center mt-8">
        Loading nation data...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto text-sm">
      {/* ── My Nation Header ─────────────────────────── */}
      <div
        className="px-4 py-3 border-b border-white/10 flex items-center gap-2"
        style={{ borderLeftColor: myNation.color, borderLeftWidth: 3 }}
      >
        <div
          className="w-3 h-3 rounded-sm flex-shrink-0"
          style={{ backgroundColor: myNation.color }}
        />
        <span className="font-bold text-white truncate">{myNation.name}</span>
        <span className="ml-auto text-white/40 text-xs font-mono">{myNation.tag}</span>
      </div>

      {/* ── Key Stats ─────────────────────────────────── */}
      <div className="px-4 py-3 space-y-2.5 border-b border-white/10">
        <StatRow label="Treasury" value={`$${myNation.treasury.toLocaleString()}`} />
        <StatRow label="Population" value={myNation.population.toLocaleString()} />
        <StatRow label="Manpower" value={myNation.manpower_pool.toLocaleString()} />
        <StatRow label="Pol. Power" value={`${Math.floor(myNation.political_power)} PP`} />
        <StatRow label="Research" value={`${myNation.research_power.toFixed(1)} RP/tick`} />
      </div>

      {/* ── Stability / Corruption / WE bars ─────────── */}
      <div className="px-4 py-3 space-y-2 border-b border-white/10">
        <BarRow label="Stability" value={myNation.stability} color={STAT_BAR_COLORS.stability} />
        <BarRow label="Corruption" value={myNation.corruption} color={STAT_BAR_COLORS.corruption} />
        <BarRow label="War Exhaustion" value={myNation.war_exhaustion} color={STAT_BAR_COLORS.war_exhaustion} />
      </div>

      {/* ── Selected Province ─────────────────────────── */}
      {selectedProvince ? (
        <div className="px-4 py-3 space-y-2 border-b border-white/10">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Selected Province</p>
          <p className="font-semibold text-white">{selectedProvince.name}</p>
          <StatRow label="Owner" value={ownerNation?.name ?? "Unclaimed"} />
          <StatRow label="Terrain" value={capitalize(selectedProvince.terrain_type)} />
          <StatRow label="Population" value={selectedProvince.population.toLocaleString()} />
          <StatRow label="Infrastructure" value={`${selectedProvince.infrastructure}/10`} />

          {provinceUnits.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Units Present</p>
              {provinceUnits.slice(0, 6).map((u) => (
                <div key={u.id} className="flex justify-between items-center py-0.5">
                  <span className="text-white/70 capitalize">{u.unit_type.replace(/_/g, " ")}</span>
                  <span className="text-white/50 font-mono text-xs">
                    {u.strength}/{u.max_strength}
                  </span>
                </div>
              ))}
              {provinceUnits.length > 6 && (
                <p className="text-white/30 text-xs mt-1">+{provinceUnits.length - 6} more</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 py-3 text-xs text-white/30 italic">
          Click a province to inspect it.
        </div>
      )}

      {/* ── Other Nations (mini list) ─────────────────── */}
      <div className="px-4 py-3">
        <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Nations in Session</p>
        <div className="space-y-1">
          {Object.values(nations).map((n) => (
            <div key={n.id} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: n.color }} />
              <span className={`truncate ${n.id === myNation.id ? "text-white font-semibold" : "text-white/60"}`}>
                {n.name}
              </span>
              {n.is_ai && <span className="text-white/30 text-xs ml-auto">AI</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/50">{label}</span>
      <span className="text-white font-mono">{value}</span>
    </div>
  );
}

function BarRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between">
        <span className="text-white/50">{label}</span>
        <span className="text-white/70 font-mono">{value.toFixed(1)}%</span>
      </div>
      <StatBar value={value} color={color} />
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
