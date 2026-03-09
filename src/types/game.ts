// ============================================================
// Core Game Types for Rise of Fronts
// ============================================================

export type SessionStatus = "lobby" | "active" | "paused" | "finished";

export interface GameSession {
  id: string;
  name: string;
  host_user_id: string;
  status: SessionStatus;
  max_players: number;
  current_tick: number;
  game_date: string;
  speed_multiplier: number;
  map_id: string;
  settings: Record<string, unknown>;
  started_at: string | null;
  created_at: string;
}

export type TerrainType =
  | "plains"
  | "forest"
  | "mountain"
  | "desert"
  | "jungle"
  | "arctic"
  | "hills"
  | "marsh"
  | "urban"
  | "coastal"
  | "ocean";

export type IdeologyId =
  | "liberal_democracy"
  | "social_democracy"
  | "monarchy"
  | "communism"
  | "fascism"
  | "theocracy"
  | "military_junta"
  | "technocracy";

export type TaxationSetting =
  | "minimum"
  | "low"
  | "normal"
  | "high"
  | "maximum";

export type ConscriptionLaw =
  | "volunteer_only"
  | "limited_conscript"
  | "extensive_conscript"
  | "mass_mobilization";

export type FactoryOutputSetting =
  | "minimum"
  | "low"
  | "reduced"
  | "normal"
  | "supercharged";

export interface SpendingSliders {
  military: number;
  government: number;
  security: number;
  education: number;
  anti_corruption: number;
  healthcare: number;
  research: number;
  reconstruction: number;
}
