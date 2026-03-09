export type RawResource =
  | "iron"
  | "titanium"
  | "copper"
  | "gold"
  | "phosphate"
  | "tungsten"
  | "uranium"
  | "oil"
  | "aluminum"
  | "chromium"
  | "diamond";

export type ProcessedResource =
  | "steel"
  | "motor_parts"
  | "electronics"
  | "fertilizer"
  | "enriched_uranium"
  | "consumer_goods"
  | "aircraft_parts";

export type ResourceType = RawResource | ProcessedResource;

export interface ResourceStockpile {
  resource_type: ResourceType;
  stockpile: number;
  production_rate: number;
  consumption_rate: number;
  trade_balance: number;
}

export interface ProductionChain {
  output: ProcessedResource;
  inputs: { resource: RawResource | ProcessedResource; amount: number }[];
  output_amount: number;
  requires_tech: string | null;
}

export interface TradeDeal {
  id: string;
  session_id: string;
  proposer_id: string;
  accepter_id: string;
  status: "proposed" | "active" | "rejected" | "cancelled" | "expired";
  offer_resources: Record<string, number>;
  offer_money: number;
  demand_resources: Record<string, number>;
  demand_money: number;
  duration_ticks: number | null;
  started_tick: number | null;
}

export interface BuildingType {
  id: string;
  name: string;
  max_level: number;
  base_cost: number;
  cost_per_level: number;
  build_time: number;
  effects: Record<string, number>;
  requires_tech: string | null;
}

export interface City {
  id: string;
  province_id: string;
  name: string;
  city_type: "town" | "city" | "metropolis" | "port" | "fortress";
  population: number;
  development: number;
}

export interface Building {
  id: string;
  city_id: string;
  building_type: string;
  level: number;
  is_damaged: boolean;
}
