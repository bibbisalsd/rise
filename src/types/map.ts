import type { TerrainType } from "./game";

export interface ProvinceGeometry {
  provinceKey: string;
  name: string;
  polygon: [number, number][];
  centroid: [number, number];
  neighbors: string[];
  terrain: TerrainType;
  isCoastal: boolean;
}

export interface Province {
  id: string;
  session_id: string;
  province_key: string;
  name: string;
  owner_nation_id: string | null;
  controller_nation_id: string | null;
  terrain_type: TerrainType;
  is_coastal: boolean;
  is_capital: boolean;
  population: number;
  infrastructure: number;
  supply_value: number;
  resource_deposits: Record<string, number>;
  center_x: number;
  center_y: number;
}

export interface ProvinceAdjacency {
  province_a_id: string;
  province_b_id: string;
  border_type: "land" | "river" | "sea" | "strait";
  movement_cost: number;
}

export interface MapData {
  width: number;
  height: number;
  provinces: ProvinceGeometry[];
  seaZones: ProvinceGeometry[];
}
