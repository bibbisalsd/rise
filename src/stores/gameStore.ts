import { create } from "zustand";
import type { Nation } from "@/types/nation";
import type { Province } from "@/types/map";
import type { Unit } from "@/types/military";
import type { GameSession } from "@/types/game";

// ─── UI State ───────────────────────────────────────────────
export type ActivePanel = "country" | "diplomacy" | "economy" | "technology" | "military" | null;

export interface SelectedProvince {
  id: string;
  name: string;
  owner_nation_id: string | null;
  terrain_type: string;
  population: number;
  infrastructure: number;
  units: Unit[];
}

// ─── Store Shape ─────────────────────────────────────────────
interface GameStore {
  // Session
  session: GameSession | null;
  setSession: (s: GameSession) => void;

  // My nation
  myNation: Nation | null;
  setMyNation: (n: Nation | null) => void;

  // All nations in session
  nations: Record<string, Nation>;
  setNations: (nations: Nation[]) => void;
  updateNation: (nation: Nation) => void;

  // Provinces
  provinces: Record<string, Province>;
  setProvinces: (provinces: Province[]) => void;
  updateProvince: (province: Province) => void;

  // Units
  units: Record<string, Unit>;
  setUnits: (units: Unit[]) => void;
  updateUnit: (unit: Unit) => void;
  removeUnit: (id: string) => void;

  // Selection
  selectedProvinceId: string | null;
  setSelectedProvinceId: (id: string | null) => void;
  selectedUnitIds: string[];
  setSelectedUnitIds: (ids: string[]) => void;
  toggleUnitSelection: (id: string) => void;

  // UI
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;

  // Game clock
  gameDate: string;
  setGameDate: (date: string) => void;
  currentTick: number;
  setCurrentTick: (tick: number) => void;

  // Map viewport
  mapScale: number;
  setMapScale: (scale: number) => void;
  mapOffsetX: number;
  mapOffsetY: number;
  setMapOffset: (x: number, y: number) => void;

  // Loading
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  error: string | null;
  setError: (e: string | null) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // Session
  session: null,
  setSession: (session) => set({ session }),

  // My nation
  myNation: null,
  setMyNation: (myNation) => set({ myNation }),

  // All nations
  nations: {},
  setNations: (nations) =>
    set({ nations: Object.fromEntries(nations.map((n) => [n.id, n])) }),
  updateNation: (nation) =>
    set((s) => ({ nations: { ...s.nations, [nation.id]: nation } })),

  // Provinces
  provinces: {},
  setProvinces: (provinces) =>
    set({ provinces: Object.fromEntries(provinces.map((p) => [p.id, p])) }),
  updateProvince: (province) =>
    set((s) => ({ provinces: { ...s.provinces, [province.id]: province } })),

  // Units
  units: {},
  setUnits: (units) =>
    set({ units: Object.fromEntries(units.map((u) => [u.id, u])) }),
  updateUnit: (unit) =>
    set((s) => ({ units: { ...s.units, [unit.id]: unit } })),
  removeUnit: (id) =>
    set((s) => {
      const units = { ...s.units };
      delete units[id];
      return { units };
    }),

  // Selection
  selectedProvinceId: null,
  setSelectedProvinceId: (selectedProvinceId) => set({ selectedProvinceId }),
  selectedUnitIds: [],
  setSelectedUnitIds: (selectedUnitIds) => set({ selectedUnitIds }),
  toggleUnitSelection: (id) =>
    set((s) => ({
      selectedUnitIds: s.selectedUnitIds.includes(id)
        ? s.selectedUnitIds.filter((x) => x !== id)
        : [...s.selectedUnitIds, id],
    })),

  // UI
  activePanel: null,
  setActivePanel: (activePanel) => set({ activePanel }),

  // Game clock
  gameDate: "Jan 1, 2025",
  setGameDate: (gameDate) => set({ gameDate }),
  currentTick: 0,
  setCurrentTick: (currentTick) => set({ currentTick }),

  // Map viewport
  mapScale: 1,
  setMapScale: (mapScale) => set({ mapScale }),
  mapOffsetX: 0,
  mapOffsetY: 0,
  setMapOffset: (mapOffsetX, mapOffsetY) => set({ mapOffsetX, mapOffsetY }),

  // Loading
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
  error: null,
  setError: (error) => set({ error }),
}));
