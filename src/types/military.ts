export type UnitType =
  | "infantry"
  | "motorized_infantry"
  | "mechanized_infantry"
  | "tank"
  | "heavy_tank"
  | "artillery"
  | "anti_air"
  | "fighter"
  | "bomber"
  | "transport_ship"
  | "destroyer"
  | "cruiser"
  | "submarine"
  | "battleship"
  | "nuclear_missile";

export type UnitDomain = "land" | "sea" | "air" | "special";

export interface UnitDefinition {
  type: UnitType;
  domain: UnitDomain;
  name: string;
  base_strength: number;
  movement: number;
  attack: number;
  defense: number;
  upkeep_per_tick: number;
  manpower_cost: number;
  resource_cost: Record<string, number>;
  training_time: number;
  requires_tech: string | null;
  requires_building: string | null;
}

export interface Unit {
  id: string;
  session_id: string;
  nation_id: string;
  province_id: string;
  unit_type: UnitType;
  name: string | null;

  strength: number;
  experience: number;
  morale: number;
  organization: number;
  supply_status: number;

  movement_target_id: string | null;
  movement_path: string[];
  movement_progress: number;

  army_id: string | null;
  in_combat: boolean;
  combat_id: string | null;
  is_entrenched: boolean;
}

export interface Combat {
  id: string;
  session_id: string;
  province_id: string;
  attacker_nation_id: string;
  defender_nation_id: string;
  status: "active" | "attacker_won" | "defender_won" | "draw" | "retreated";
  started_tick: number;
  ended_tick: number | null;
  terrain_modifier: number;
}
