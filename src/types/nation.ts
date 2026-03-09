import type { IdeologyId, SpendingSliders, TaxationSetting, ConscriptionLaw } from "./game";

export interface Nation {
  id: string;
  session_id: string;
  user_id: string | null;
  name: string;
  tag: string;
  color: string;
  flag_sprite: string | null;
  is_ai: boolean;

  // National stats
  population: number;
  manpower_pool: number;
  stability: number;
  corruption: number;
  war_exhaustion: number;
  political_power: number;
  research_power: number;

  // Economy
  treasury: number;
  taxation_setting: TaxationSetting;
  conscription_law: ConscriptionLaw;

  // Spending
  spending: SpendingSliders;

  // Politics
  ideology_id: IdeologyId;
  leader_name: string | null;
  leader_traits: string[];

  // Victory
  victory_points: number;
}

export interface LeaderTrait {
  id: string;
  name: string;
  category: "military" | "economic" | "political" | "research" | "negative";
  description: string;
  modifiers: Record<string, number>;
}

export interface IdeologyDefinition {
  id: IdeologyId;
  name: string;
  icon: string;
  cost_to_adopt: number;
  modifiers: Record<string, number>;
  description: string;
}
