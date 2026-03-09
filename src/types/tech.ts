export type TechTreeId =
  | "infantry"
  | "tank"
  | "support"
  | "naval"
  | "aircraft"
  | "economy"
  | "research"
  | "political";

export type TechStatus = "locked" | "available" | "researching" | "completed";

export interface TechDefinition {
  id: string;
  tree_id: TechTreeId;
  tier: number;
  name: string;
  description: string;
  cost: number;
  prerequisites: string[];
  effects: TechEffect[];
  unlocks_unit?: string;
  unlocks_building?: string;
  requires_ideology?: string;
}

export interface TechEffect {
  type: "modifier" | "unlock" | "ability";
  target: string;
  value: number | string;
  description: string;
}

export interface TechResearch {
  id: string;
  nation_id: string;
  tech_id: string;
  tree_id: TechTreeId;
  tier: number;
  status: TechStatus;
  progress: number;
  research_cost: number;
  started_tick: number | null;
  completed_tick: number | null;
}
