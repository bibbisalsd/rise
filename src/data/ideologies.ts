// ============================================================
// Rise of Fronts — Ideology Definitions
// All 8 ideologies with full modifier sets
// ============================================================

export interface IdeologyDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost_to_adopt: number;        // political power
  stability_on_change: number;  // stability penalty when switching to this
  pp_gain_per_tick: number;
  modifiers: {
    // Economy
    tax_income_mult?: number;
    factory_output_mult?: number;
    trade_income_mult?: number;
    consumer_goods_efficiency?: number;
    // Military
    manpower_cap_mult?: number;
    conscription_speed_mult?: number;
    military_upkeep_mult?: number;
    war_exhaustion_gain_mult?: number;
    military_power_mult?: number;
    // Stability & Politics
    stability_per_tick?: number;
    corruption_per_tick?: number;
    political_power_gain_mult?: number;
    // Research
    research_power_mult?: number;
    tech_cost_mult?: number;
    // Special
    justify_war_time_mult?: number;
    annexation_speed_mult?: number;
    puppet_tribute_mult?: number;
    alliance_bonus_mult?: number;
  };
  special_abilities: string[];
  locked_policies?: string[];
  unlocked_policies?: string[];
  ideology_wartime_pp_bonus?: number;
  compatible_ideologies: string[]; // ideologies this can ally with comfortably
  hostile_ideologies: string[];    // opinion penalty with these
}

export const IDEOLOGY_DEFINITIONS: Record<string, IdeologyDef> = {

  liberal_democracy: {
    id: "liberal_democracy",
    name: "Liberal Democracy",
    description: "A government chosen by and accountable to the people. Strong trade, stable society, but wars are costly.",
    icon: "🗳️",
    cost_to_adopt: 100,
    stability_on_change: -15,
    pp_gain_per_tick: 2,
    modifiers: {
      tax_income_mult: 1.0,
      factory_output_mult: 1.0,
      trade_income_mult: 1.2,
      consumer_goods_efficiency: 1.1,
      manpower_cap_mult: 0.85,
      conscription_speed_mult: 0.8,
      military_upkeep_mult: 1.0,
      war_exhaustion_gain_mult: 1.15,
      stability_per_tick: 3.0,
      corruption_per_tick: -10.0,
      political_power_gain_mult: 1.2,
      research_power_mult: 1.1,
      justify_war_time_mult: 1.0,
    },
    special_abilities: [
      "free_alliances",           // form defensive pacts for 0 PP
      "trade_bonus",              // trade agreements +30% income
      "press_freedom",            // corruption -2/tick extra
    ],
    unlocked_policies: ["free_market", "civil_rights", "free_press"],
    compatible_ideologies: ["social_democracy", "monarchy"],
    hostile_ideologies: ["fascism", "communism", "military_junta"],
  },

  social_democracy: {
    id: "social_democracy",
    name: "Social Democracy",
    description: "A democratic system with strong public investment. Exceptional population growth and research.",
    icon: "⚙️",
    cost_to_adopt: 80,
    stability_on_change: -12,
    pp_gain_per_tick: 1,
    modifiers: {
      tax_income_mult: 0.95,
      factory_output_mult: 0.95,
      trade_income_mult: 1.1,
      consumer_goods_efficiency: 1.2,
      manpower_cap_mult: 0.9,
      conscription_speed_mult: 0.75,
      military_upkeep_mult: 1.0,
      war_exhaustion_gain_mult: 1.1,
      stability_per_tick: 2.0,
      corruption_per_tick: -15.0,
      research_power_mult: 1.2,
      tech_cost_mult: 0.95,
    },
    special_abilities: [
      "population_growth_bonus",  // population grows 1.3x faster
      "healthcare_efficiency",    // healthcare spending 1.5x effective
      "education_efficiency",     // education spending 1.5x effective
    ],
    unlocked_policies: ["welfare_state", "public_education", "universal_healthcare"],
    compatible_ideologies: ["liberal_democracy", "technocracy"],
    hostile_ideologies: ["fascism", "military_junta"],
  },

  monarchy: {
    id: "monarchy",
    name: "Monarchy",
    description: "A hereditary ruler governs for life. Stable, efficient, with a loyal military tradition.",
    icon: "👑",
    cost_to_adopt: 60,
    stability_on_change: -10,
    pp_gain_per_tick: 2,
    modifiers: {
      tax_income_mult: 1.05,
      factory_output_mult: 1.0,
      trade_income_mult: 1.0,
      consumer_goods_efficiency: 1.0,
      manpower_cap_mult: 1.0,
      military_upkeep_mult: 0.9,
      war_exhaustion_gain_mult: 0.9,
      military_power_mult: 1.05,
      stability_per_tick: 1.0,
      corruption_per_tick: -5.0,
      political_power_gain_mult: 1.1,
      justify_war_time_mult: 0.9,
      puppet_tribute_mult: 1.5,
    },
    special_abilities: [
      "lifetime_leader",          // leader never needs election
      "royal_puppet_discount",    // puppeting costs 50% less PP
      "noble_loyalty",            // military units +5 morale base
    ],
    unlocked_policies: ["royal_prerogative", "noble_class", "standing_army"],
    compatible_ideologies: ["liberal_democracy", "theocracy"],
    hostile_ideologies: ["communism"],
  },

  communism: {
    id: "communism",
    name: "Communism",
    description: "The state owns all means of production. Massive industrial output and manpower, but trade suffers.",
    icon: "☭",
    cost_to_adopt: 90,
    stability_on_change: -15,
    pp_gain_per_tick: 1,
    modifiers: {
      tax_income_mult: 1.0,
      factory_output_mult: 1.2,
      trade_income_mult: 0.7,
      consumer_goods_efficiency: 0.85,
      manpower_cap_mult: 1.5,
      conscription_speed_mult: 2.0,
      military_upkeep_mult: 0.85,
      war_exhaustion_gain_mult: 0.8,
      stability_per_tick: -1.0,
      corruption_per_tick: 10.0,
      research_power_mult: 1.0,
      justify_war_time_mult: 0.8,
    },
    special_abilities: [
      "nationalize_resources",    // seize foreign-owned resource operations without CB
      "communist_solidarity",     // other communist nations +20% military power when allied
      "five_year_plan",           // can boost factory output for 2x production, 3x cost
    ],
    unlocked_policies: ["central_planning", "collectivization", "party_control"],
    compatible_ideologies: [],
    hostile_ideologies: ["fascism", "liberal_democracy", "monarchy"],
    ideology_wartime_pp_bonus: 1,
  },

  fascism: {
    id: "fascism",
    name: "Fascism",
    description: "An authoritarian nationalist state built for war. Terrifying in conflict, unstable in peace.",
    icon: "⚡",
    cost_to_adopt: 90,
    stability_on_change: -10,
    pp_gain_per_tick: 1,
    modifiers: {
      tax_income_mult: 1.0,
      factory_output_mult: 1.1,
      trade_income_mult: 0.8,
      consumer_goods_efficiency: 0.9,
      manpower_cap_mult: 1.3,
      conscription_speed_mult: 1.5,
      military_upkeep_mult: 0.9,
      military_power_mult: 1.2,
      war_exhaustion_gain_mult: 0.7,
      stability_per_tick: -3.0, // during peace
      corruption_per_tick: 5.0,
      justify_war_time_mult: 0.5,
      annexation_speed_mult: 1.5,
    },
    special_abilities: [
      "wartime_stability_bonus",  // stability +5/tick during war (not -3)
      "wartime_pp_bonus",         // pp_gain +3/tick during war
      "total_war",                // declaration removes manpower cap
      "fast_annexation",          // conquered provinces integrate 50% faster
    ],
    unlocked_policies: ["total_mobilization", "war_economy", "nationalist_propaganda"],
    compatible_ideologies: ["military_junta"],
    hostile_ideologies: ["liberal_democracy", "social_democracy", "communism"],
    ideology_wartime_pp_bonus: 3,
  },

  theocracy: {
    id: "theocracy",
    name: "Theocracy",
    description: "God's law is state law. An unwavering populace with high morale and stability.",
    icon: "🕌",
    cost_to_adopt: 70,
    stability_on_change: -10,
    pp_gain_per_tick: 2,
    modifiers: {
      tax_income_mult: 1.0,
      factory_output_mult: 0.95,
      trade_income_mult: 0.95,
      consumer_goods_efficiency: 1.0,
      manpower_cap_mult: 1.1,
      military_upkeep_mult: 0.95,
      war_exhaustion_gain_mult: 0.8,
      stability_per_tick: 4.0,
      corruption_per_tick: -5.0,
      research_power_mult: 0.85,
      justify_war_time_mult: 0.8,
    },
    special_abilities: [
      "faith_morale",             // unit morale cap raised to 110
      "holy_war_discount",        // certain CBs cost 0 stability
      "religious_stability",      // stability immune to war exhaustion up to WE 40
    ],
    unlocked_policies: ["religious_law", "clergy_power", "holy_warriors"],
    compatible_ideologies: ["monarchy"],
    hostile_ideologies: ["communism", "social_democracy"],
  },

  military_junta: {
    id: "military_junta",
    name: "Military Junta",
    description: "Generals rule. The entire state is organized around military efficiency.",
    icon: "🪖",
    cost_to_adopt: 50,
    stability_on_change: -8,
    pp_gain_per_tick: 1,
    modifiers: {
      tax_income_mult: 0.95,
      factory_output_mult: 1.0,
      trade_income_mult: 0.9,
      consumer_goods_efficiency: 0.85,
      manpower_cap_mult: 1.2,
      conscription_speed_mult: 1.5,
      military_upkeep_mult: 0.7,
      military_power_mult: 1.3,
      war_exhaustion_gain_mult: 0.6,
      stability_per_tick: -2.0,
      corruption_per_tick: 3.0,
      justify_war_time_mult: 0.0, // no CB needed
    },
    special_abilities: [
      "declare_war_free",         // can declare war without CB (−20 stability penalty)
      "military_efficiency",      // military spending 1.4x effective
      "general_traits",           // military leaders gain extra trait
      "fast_mobilization",        // unit training time -25%
    ],
    locked_policies: ["free_market", "civil_rights"],
    unlocked_policies: ["military_state", "war_economy", "security_state"],
    compatible_ideologies: ["fascism", "monarchy"],
    hostile_ideologies: ["liberal_democracy", "social_democracy"],
  },

  technocracy: {
    id: "technocracy",
    name: "Technocracy",
    description: "Scientists and experts govern. The most research-efficient government, but militarily limited.",
    icon: "🌐",
    cost_to_adopt: 120,
    stability_on_change: -15,
    pp_gain_per_tick: 1,
    modifiers: {
      tax_income_mult: 1.05,
      factory_output_mult: 1.15,
      trade_income_mult: 1.05,
      consumer_goods_efficiency: 1.05,
      manpower_cap_mult: 0.9,
      military_upkeep_mult: 1.0,
      war_exhaustion_gain_mult: 1.1,
      stability_per_tick: 1.0,
      corruption_per_tick: -20.0,
      research_power_mult: 1.3,
      tech_cost_mult: 0.8,
      political_power_gain_mult: 1.0,
    },
    special_abilities: [
      "pp_to_rp_conversion",      // 50% of PP generated also adds to RP
      "exclusive_techs",          // 3 exclusive techs per tree unlocked
      "low_corruption",           // corruption floor at 5 max
    ],
    unlocked_policies: ["meritocracy", "scientific_investment", "automated_governance"],
    compatible_ideologies: ["social_democracy", "liberal_democracy"],
    hostile_ideologies: ["theocracy", "military_junta"],
  },
};

// ============================================================
// IDEOLOGY TRANSITION RULES
// Some paths require revolution events; others are direct
// ============================================================
export const IDEOLOGY_TRANSITION_RULES: Record<string, {
  allowed_direct: string[];
  requires_revolution: string[];
}> = {
  liberal_democracy:  { allowed_direct: ["social_democracy","monarchy","technocracy"],       requires_revolution: ["communism","fascism","military_junta"] },
  social_democracy:   { allowed_direct: ["liberal_democracy","technocracy"],                 requires_revolution: ["fascism","military_junta","communism"] },
  monarchy:           { allowed_direct: ["liberal_democracy","theocracy","military_junta"],  requires_revolution: ["communism","fascism"] },
  communism:          { allowed_direct: ["military_junta"],                                  requires_revolution: ["liberal_democracy","social_democracy","monarchy","fascism","theocracy","technocracy"] },
  fascism:            { allowed_direct: ["military_junta","monarchy"],                       requires_revolution: ["liberal_democracy","social_democracy","communism","technocracy"] },
  theocracy:          { allowed_direct: ["monarchy"],                                        requires_revolution: ["communism","fascism","social_democracy","technocracy"] },
  military_junta:     { allowed_direct: ["fascism","monarchy"],                              requires_revolution: ["liberal_democracy","social_democracy","communism","technocracy"] },
  technocracy:        { allowed_direct: ["social_democracy","liberal_democracy"],            requires_revolution: ["fascism","military_junta","theocracy","communism"] },
};
