// ============================================================
// Rise of Fronts — Technology Tree Definitions
// 8 trees × 5 tiers = full research system
// ============================================================

export interface TechDef {
  id: string;
  tree_id: string;
  tier: number;
  name: string;
  description: string;
  cost: number;              // research points
  prerequisites: string[];
  effects: TechEffect[];
  unlocks_unit?: string;
  unlocks_building?: string;
  requires_ideology?: string;
  mutually_exclusive?: string[];
}

export interface TechEffect {
  type: "modifier" | "unlock" | "ability";
  target: string;
  value: number | string;
  description: string;
}

// ============================================================
// INFANTRY TREE
// ============================================================
const INFANTRY_TECH: TechDef[] = [
  // TIER 1
  {
    id: "basic_infantry_tactics",
    tree_id: "infantry", tier: 1,
    name: "Basic Infantry Tactics",
    description: "Improved squad tactics increase infantry combat effectiveness.",
    cost: 50, prerequisites: [],
    effects: [{ type: "modifier", target: "infantry_attack", value: 0.05, description: "+5% Infantry Attack" }],
  },
  {
    id: "rifle_improvements",
    tree_id: "infantry", tier: 1,
    name: "Rifle Improvements",
    description: "Better rifles improve infantry firepower.",
    cost: 75, prerequisites: ["basic_infantry_tactics"],
    effects: [{ type: "modifier", target: "infantry_attack", value: 0.08, description: "+8% Infantry Attack" }],
  },
  {
    id: "basic_training_doctrine",
    tree_id: "infantry", tier: 1,
    name: "Basic Training Doctrine",
    description: "Standardized training increases recruitment speed.",
    cost: 60, prerequisites: [],
    effects: [{ type: "modifier", target: "manpower_gain", value: 0.1, description: "+10% Manpower Gain" }],
  },

  // TIER 2
  {
    id: "fire_and_maneuver",
    tree_id: "infantry", tier: 2,
    name: "Fire & Maneuver",
    description: "Combined movement-fire doctrine reduces supply consumption and improves attack.",
    cost: 120, prerequisites: ["basic_infantry_tactics"],
    effects: [
      { type: "modifier", target: "infantry_attack", value: 0.12, description: "+12% Infantry Attack" },
      { type: "modifier", target: "supply_consumption", value: -0.1, description: "-10% Supply Consumption" },
    ],
  },
  {
    id: "trench_warfare_doctrine",
    tree_id: "infantry", tier: 2,
    name: "Trench Warfare Doctrine",
    description: "Defensive fortification techniques dramatically increase urban and trench defense.",
    cost: 100, prerequisites: ["basic_training_doctrine"],
    effects: [{ type: "modifier", target: "infantry_urban_defense", value: 0.2, description: "+20% Urban/Trench Defense" }],
  },
  {
    id: "motorized_infantry",
    tree_id: "infantry", tier: 2,
    name: "Motorized Infantry",
    description: "Mounts infantry in vehicles for rapid deployment.",
    cost: 150, prerequisites: ["basic_infantry_tactics"],
    effects: [{ type: "unlock", target: "unit", value: "motorized_infantry", description: "Unlocks Motorized Infantry Unit" }],
    unlocks_unit: "motorized_infantry",
  },
  {
    id: "improved_logistics",
    tree_id: "infantry", tier: 2,
    name: "Improved Logistics",
    description: "Better supply organization extends how far units can operate from supply depots.",
    cost: 130, prerequisites: ["basic_training_doctrine"],
    effects: [{ type: "modifier", target: "supply_range", value: 1, description: "+1 Province Supply Range" }],
  },

  // TIER 3
  {
    id: "combined_arms_doctrine",
    tree_id: "infantry", tier: 3,
    name: "Combined Arms Doctrine",
    description: "Infantry fight significantly better when adjacent to tanks.",
    cost: 200, prerequisites: ["fire_and_maneuver", "motorized_infantry"],
    effects: [{ type: "modifier", target: "infantry_tank_adjacency_bonus", value: 0.15, description: "+15% Attack When Adjacent to Tanks" }],
  },
  {
    id: "paratroopers",
    tree_id: "infantry", tier: 3,
    name: "Paratroopers",
    description: "Elite troops that can be air-dropped into any province in range.",
    cost: 250, prerequisites: ["motorized_infantry"],
    effects: [{ type: "unlock", target: "unit", value: "paratroopers", description: "Unlocks Paratroopers" }],
    unlocks_unit: "paratroopers",
  },
  {
    id: "special_forces",
    tree_id: "infantry", tier: 3,
    name: "Special Forces",
    description: "Top tier soldiers with exceptional capabilities. Max 3 units per nation.",
    cost: 280, prerequisites: ["fire_and_maneuver"],
    effects: [{ type: "unlock", target: "unit", value: "special_forces", description: "Unlocks Special Forces (max 3)" }],
    unlocks_unit: "special_forces",
  },
  {
    id: "urban_warfare_doctrine",
    tree_id: "infantry", tier: 3,
    name: "Urban Warfare Doctrine",
    description: "Specialized training for fighting in cities and dense terrain.",
    cost: 220, prerequisites: ["trench_warfare_doctrine"],
    effects: [{ type: "modifier", target: "infantry_urban_bonus", value: 0.3, description: "+30% Urban Attack & Defense" }],
  },

  // TIER 4
  {
    id: "modern_infantry_doctrine",
    tree_id: "infantry", tier: 4,
    name: "Modern Infantry Doctrine",
    description: "Comprehensive modernization of all infantry tactics.",
    cost: 350, prerequisites: ["combined_arms_doctrine"],
    effects: [{ type: "modifier", target: "all_infantry_stats", value: 0.2, description: "+20% All Infantry Stats" }],
  },
  {
    id: "mechanized_infantry",
    tree_id: "infantry", tier: 4,
    name: "Mechanized Infantry",
    description: "Infantry in armored carriers combining tank protection with soldier flexibility.",
    cost: 400, prerequisites: ["combined_arms_doctrine"],
    effects: [{ type: "unlock", target: "unit", value: "mechanized_infantry", description: "Unlocks Mechanized Infantry" }],
    unlocks_unit: "mechanized_infantry",
  },
  {
    id: "anti_tank_infantry",
    tree_id: "infantry", tier: 4,
    name: "Anti-Tank Infantry",
    description: "Portable anti-tank weapons make infantry devastating vs armor.",
    cost: 300, prerequisites: ["modern_infantry_doctrine"],
    effects: [{ type: "modifier", target: "infantry_vs_tank", value: 0.4, description: "+40% Infantry Attack vs Tanks" }],
  },
  {
    id: "night_warfare_doctrine",
    tree_id: "infantry", tier: 4,
    name: "Night Warfare Doctrine",
    description: "Night vision and tactics for fighting at night (odd in-game hours).",
    cost: 320, prerequisites: ["urban_warfare_doctrine"],
    effects: [{ type: "modifier", target: "night_attack_bonus", value: 0.25, description: "+25% Attack During Night Hours" }],
  },

  // TIER 5
  {
    id: "elite_infantry_doctrine",
    tree_id: "infantry", tier: 5,
    name: "Elite Infantry Doctrine",
    description: "The pinnacle of infantry warfare. All infantry stats maximized.",
    cost: 500, prerequisites: ["modern_infantry_doctrine", "anti_tank_infantry"],
    effects: [
      { type: "modifier", target: "all_infantry_stats", value: 0.3, description: "+30% All Infantry Stats" },
      { type: "modifier", target: "morale_cap", value: 20, description: "Morale Cap +20 (to 120)" },
    ],
  },
  {
    id: "integrated_assault_doctrine",
    tree_id: "infantry", tier: 5,
    name: "Integrated Assault Doctrine",
    description: "Perfect coordination between infantry and all other arms.",
    cost: 600, prerequisites: ["elite_infantry_doctrine"],
    effects: [{ type: "modifier", target: "combined_arms_bonus", value: 0.3, description: "Combined Arms Bonus raised to +30%" }],
  },
];

// ============================================================
// TANK TREE
// ============================================================
const TANK_TECH: TechDef[] = [
  { id: "basic_armor_plating", tree_id: "tank", tier: 1, name: "Basic Armor Plating", description: "Improved armor gives tanks more survivability.", cost: 80, prerequisites: [], effects: [{ type: "modifier", target: "tank_defense", value: 0.1, description: "+10% Tank Defense" }] },
  { id: "engine_improvements", tree_id: "tank", tier: 1, name: "Engine Improvements", description: "Better engines increase tank movement speed.", cost: 90, prerequisites: [], effects: [{ type: "modifier", target: "tank_movement", value: 1, description: "+1 Tank Movement" }] },
  { id: "light_tank_doctrine", tree_id: "tank", tier: 2, name: "Light Tank Doctrine", description: "Fast, lightly armored tanks for reconnaissance and exploitation.", cost: 140, prerequisites: ["engine_improvements"], effects: [{ type: "unlock", target: "unit", value: "light_tank", description: "Unlocks Light Tank" }], unlocks_unit: "light_tank" },
  { id: "anti_infantry_tanks", tree_id: "tank", tier: 2, name: "Anti-Infantry Tanks", description: "Specialized ammunition and tactics vs infantry.", cost: 130, prerequisites: ["basic_armor_plating"], effects: [{ type: "modifier", target: "tank_vs_infantry", value: 0.25, description: "+25% Tank Attack vs Infantry" }] },
  { id: "improved_cannon", tree_id: "tank", tier: 2, name: "Improved Cannon", description: "Larger caliber guns increase overall tank firepower.", cost: 150, prerequisites: ["basic_armor_plating"], effects: [{ type: "modifier", target: "tank_attack", value: 0.15, description: "+15% Tank Attack" }] },
  { id: "medium_tank", tree_id: "tank", tier: 3, name: "Medium Tank", description: "Balanced main battle tank replacing the light tank.", cost: 220, prerequisites: ["light_tank_doctrine", "improved_cannon"], effects: [{ type: "unlock", target: "unit", value: "tank", description: "Unlocks Medium Tank" }], unlocks_unit: "tank" },
  { id: "blitzkrieg_doctrine", tree_id: "tank", tier: 3, name: "Blitzkrieg Doctrine", description: "Exploit breakthroughs by allowing continued movement after destroying a defender.", cost: 250, prerequisites: ["light_tank_doctrine"], effects: [{ type: "ability", target: "tank_breakthrough", value: 1, description: "Tanks can continue moving after winning combat" }] },
  { id: "spaced_armor", tree_id: "tank", tier: 3, name: "Spaced Armor", description: "Advanced armor layout reduces artillery effectiveness.", cost: 200, prerequisites: ["basic_armor_plating"], effects: [{ type: "modifier", target: "tank_vs_artillery", value: -0.25, description: "Tanks take -25% damage from Artillery" }] },
  { id: "heavy_tank", tree_id: "tank", tier: 4, name: "Heavy Tank", description: "Massively armored assault tank.", cost: 350, prerequisites: ["medium_tank", "spaced_armor"], effects: [{ type: "unlock", target: "unit", value: "heavy_tank", description: "Unlocks Heavy Tank" }], unlocks_unit: "heavy_tank" },
  { id: "tank_destroyer", tree_id: "tank", tier: 4, name: "Tank Destroyer", description: "Specialized anti-tank vehicle.", cost: 300, prerequisites: ["medium_tank"], effects: [{ type: "unlock", target: "unit", value: "tank_destroyer", description: "Unlocks Tank Destroyer" }], unlocks_unit: "tank_destroyer" },
  { id: "improved_optics", tree_id: "tank", tier: 4, name: "Improved Optics", description: "Better targeting systems improve tank accuracy in open terrain.", cost: 280, prerequisites: ["improved_cannon"], effects: [{ type: "modifier", target: "tank_plains_attack", value: 0.2, description: "+20% Tank Attack on Plains/Desert" }] },
  { id: "mechanized_logistics", tree_id: "tank", tier: 4, name: "Mechanized Logistics", description: "Supply trucks extend tank operational range.", cost: 320, prerequisites: ["blitzkrieg_doctrine"], effects: [{ type: "modifier", target: "tank_supply_range", value: 2, description: "+2 Tank Supply Range" }] },
  { id: "main_battle_tank", tree_id: "tank", tier: 5, name: "Main Battle Tank", description: "The ultimate tank — replaces all variants with a single superior unit.", cost: 500, prerequisites: ["heavy_tank", "tank_destroyer"], effects: [{ type: "modifier", target: "all_tank_stats", value: 0.25, description: "+25% All Tank Stats" }] },
  { id: "reactive_armor", tree_id: "tank", tier: 5, name: "Reactive Armor", description: "Explosive reactive armor negates the first 30% of any attack.", cost: 450, prerequisites: ["heavy_tank"], effects: [{ type: "modifier", target: "tank_first_hit_reduction", value: 0.3, description: "Tanks negate 30% of first attack" }] },
  { id: "tank_army_doctrine", tree_id: "tank", tier: 5, name: "Tank Army Doctrine", description: "Massive armored formations get exponentially stronger.", cost: 600, prerequisites: ["main_battle_tank"], effects: [{ type: "modifier", target: "tank_stack_bonus", value: 0.25, description: "Stacks of 5+ tanks get +25% combined attack" }] },
];

// ============================================================
// SUPPORT TREE
// ============================================================
const SUPPORT_TECH: TechDef[] = [
  { id: "field_artillery", tree_id: "support", tier: 1, name: "Field Artillery", description: "Unlocks artillery units — ranged attackers with siege capabilities.", cost: 80, prerequisites: [], effects: [{ type: "unlock", target: "unit", value: "artillery", description: "Unlocks Artillery" }], unlocks_unit: "artillery" },
  { id: "combat_engineers", tree_id: "support", tier: 1, name: "Combat Engineers", description: "Specialized troops for bridge building/destruction and fortification.", cost: 70, prerequisites: [], effects: [{ type: "modifier", target: "bridge_crossing_speed", value: 1.0, description: "Bridge crossing 2x faster; can destroy bridges" }] },
  { id: "logistics_corps", tree_id: "support", tier: 1, name: "Logistics Corps", description: "Dedicated supply troops reduce consumption across all units.", cost: 75, prerequisites: [], effects: [{ type: "modifier", target: "all_supply_consumption", value: -0.1, description: "-10% All Unit Supply Consumption" }] },
  { id: "heavy_artillery", tree_id: "support", tier: 2, name: "Heavy Artillery", description: "Larger caliber guns that can fire into adjacent provinces.", cost: 150, prerequisites: ["field_artillery"], effects: [{ type: "modifier", target: "artillery_range", value: 1, description: "+1 Artillery Range (1 province)" }] },
  { id: "anti_air_guns", tree_id: "support", tier: 2, name: "Anti-Air Guns", description: "Ground-based anti-aircraft providing a defensive air bubble.", cost: 140, prerequisites: ["field_artillery"], effects: [{ type: "unlock", target: "unit", value: "anti_air", description: "Unlocks Anti-Air Unit" }], unlocks_unit: "anti_air" },
  { id: "field_hospitals", tree_id: "support", tier: 2, name: "Field Hospitals", description: "Medical units recover wounded soldiers faster.", cost: 120, prerequisites: ["logistics_corps"], effects: [{ type: "modifier", target: "strength_recovery_rate", value: 1.0, description: "Wounded units recover strength 2x faster" }] },
  { id: "signals_corps", tree_id: "support", tier: 2, name: "Signals Corps", description: "Intelligence units reveal enemy unit positions in adjacent provinces.", cost: 130, prerequisites: ["logistics_corps"], effects: [{ type: "ability", target: "enemy_intel", value: 1, description: "Reveal enemy units in adjacent provinces" }] },
  { id: "self_propelled_artillery", tree_id: "support", tier: 3, name: "Self-Propelled Artillery", description: "Artillery mounted on tracked vehicles can move more freely.", cost: 220, prerequisites: ["heavy_artillery"], effects: [{ type: "modifier", target: "artillery_movement", value: 1, description: "+1 Artillery Movement" }] },
  { id: "sam_batteries", tree_id: "support", tier: 3, name: "SAM Batteries", description: "Advanced surface-to-air missiles with 60% intercept rate.", cost: 250, prerequisites: ["anti_air_guns"], effects: [{ type: "unlock", target: "unit", value: "sam_battery", description: "Unlocks SAM Battery (60% intercept)" }], unlocks_unit: "sam_battery" },
  { id: "military_police", tree_id: "support", tier: 3, name: "Military Police", description: "Rear-area security reduces war exhaustion gain.", cost: 200, prerequisites: ["signals_corps"], effects: [{ type: "modifier", target: "war_exhaustion_gain", value: -0.15, description: "-15% War Exhaustion Gain" }] },
  { id: "pioneer_corps", tree_id: "support", tier: 3, name: "Pioneer Corps", description: "Field engineers can construct temporary fortifications.", cost: 210, prerequisites: ["combat_engineers"], effects: [{ type: "ability", target: "field_fortification", value: 1, description: "Can construct temporary forts in field" }] },
  { id: "rocket_artillery", tree_id: "support", tier: 4, name: "Rocket Artillery", description: "MLRS systems with area damage hitting target and adjacent province.", cost: 320, prerequisites: ["self_propelled_artillery"], effects: [{ type: "unlock", target: "unit", value: "rocket_artillery", description: "Unlocks Rocket Artillery (area damage)" }], unlocks_unit: "rocket_artillery" },
  { id: "integrated_support_doctrine", tree_id: "support", tier: 4, name: "Integrated Support Doctrine", description: "All support units provide bonuses to adjacent combat units.", cost: 350, prerequisites: ["military_police", "self_propelled_artillery"], effects: [{ type: "modifier", target: "support_adjacency_bonus", value: 0.15, description: "+15% Bonus to Adjacent Combat Units" }] },
  { id: "electronic_warfare", tree_id: "support", tier: 4, name: "Electronic Warfare", description: "Jams enemy communications, reducing their combat intelligence.", cost: 300, prerequisites: ["signals_corps"], effects: [{ type: "ability", target: "enemy_signals_jam", value: 1, description: "Disables enemy Signals Corps in same province" }] },
  { id: "mlrs_systems", tree_id: "support", tier: 5, name: "MLRS Systems", description: "Modern multiple launch rocket systems — upgraded Rocket Artillery.", cost: 480, prerequisites: ["rocket_artillery", "integrated_support_doctrine"], effects: [{ type: "modifier", target: "rocket_artillery_attack", value: 0.3, description: "+30% Rocket Artillery Attack" }] },
  { id: "advanced_sam_network", tree_id: "support", tier: 5, name: "Advanced SAM Network", description: "Linked SAM batteries covering 3 provinces each with 85% intercept.", cost: 500, prerequisites: ["sam_batteries", "electronic_warfare"], effects: [{ type: "modifier", target: "sam_intercept_rate", value: 0.85, description: "SAM intercept raised to 85%, covers 3 provinces" }] },
  { id: "combat_logistics_ai", tree_id: "support", tier: 5, name: "Combat Logistics AI", description: "Automated supply optimization removes need for manual depot placement.", cost: 600, prerequisites: ["mlrs_systems"], effects: [{ type: "ability", target: "auto_supply", value: 1, description: "Supply auto-optimizes — no manual depots needed" }] },
];

// ============================================================
// NAVAL TREE
// ============================================================
const NAVAL_TECH: TechDef[] = [
  { id: "basic_shipbuilding", tree_id: "naval", tier: 1, name: "Basic Shipbuilding", description: "Enables construction of naval vessels.", cost: 80, prerequisites: [], effects: [{ type: "unlock", target: "building", value: "port", description: "Unlocks Port Building" }, { type: "unlock", target: "unit", value: "destroyer", description: "Unlocks Destroyer" }], unlocks_building: "port", unlocks_unit: "destroyer" },
  { id: "naval_doctrine", tree_id: "naval", tier: 1, name: "Naval Doctrine", description: "Basic fleet tactics improve ship combat.", cost: 75, prerequisites: [], effects: [{ type: "modifier", target: "ship_combat", value: 0.1, description: "+10% All Ship Combat Stats" }] },
  { id: "transport_fleet", tree_id: "naval", tier: 1, name: "Transport Fleet", description: "Enables troop transport across sea zones.", cost: 70, prerequisites: ["basic_shipbuilding"], effects: [{ type: "unlock", target: "unit", value: "transport_ship", description: "Unlocks Transport Ship" }], unlocks_unit: "transport_ship" },
  { id: "cruiser_program", tree_id: "naval", tier: 2, name: "Cruiser Program", description: "Multi-role warships for fleet control.", cost: 160, prerequisites: ["basic_shipbuilding"], effects: [{ type: "unlock", target: "unit", value: "cruiser", description: "Unlocks Cruiser" }], unlocks_unit: "cruiser" },
  { id: "submarine_warfare", tree_id: "naval", tier: 2, name: "Submarine Warfare", description: "Stealth hunter-killer submarines.", cost: 170, prerequisites: ["naval_doctrine"], effects: [{ type: "unlock", target: "unit", value: "submarine", description: "Unlocks Submarine" }], unlocks_unit: "submarine" },
  { id: "naval_mines", tree_id: "naval", tier: 2, name: "Naval Mines", description: "Deployable sea mines that auto-damage passing enemy ships.", cost: 140, prerequisites: ["transport_fleet"], effects: [{ type: "ability", target: "naval_mines", value: 1, description: "Can place mines in straits and sea zones" }] },
  { id: "convoy_system", tree_id: "naval", tier: 2, name: "Convoy System", description: "Organized merchant convoys increase trade income.", cost: 130, prerequisites: ["transport_fleet"], effects: [{ type: "modifier", target: "trade_income", value: 0.15, description: "+15% Trade Income (protected sea lanes)" }] },
  { id: "battleship_program", tree_id: "naval", tier: 3, name: "Battleship Program", description: "The most powerful surface warships.", cost: 260, prerequisites: ["cruiser_program"], effects: [{ type: "unlock", target: "unit", value: "battleship", description: "Unlocks Battleship" }], unlocks_unit: "battleship" },
  { id: "anti_submarine_warfare", tree_id: "naval", tier: 3, name: "Anti-Submarine Warfare", description: "Destroyers equipped to detect and destroy submarines.", cost: 240, prerequisites: ["submarine_warfare"], effects: [{ type: "ability", target: "destroyer_anti_sub", value: 1, description: "Destroyers can detect and kill submarines" }] },
  { id: "carrier_aviation", tree_id: "naval", tier: 3, name: "Carrier Aviation", description: "Aircraft carriers bringing air power to sea.", cost: 280, prerequisites: ["battleship_program"], effects: [{ type: "unlock", target: "unit", value: "aircraft_carrier", description: "Unlocks Aircraft Carrier" }], unlocks_unit: "aircraft_carrier" },
  { id: "naval_bombardment", tree_id: "naval", tier: 3, name: "Naval Bombardment", description: "Ships can bombard coastal provinces from sea.", cost: 220, prerequisites: ["cruiser_program"], effects: [{ type: "modifier", target: "coastal_attacker_bonus", value: 0.3, description: "+30% Attacker Bonus vs Coastal Provinces With Naval Support" }] },
  { id: "fleet_coordination", tree_id: "naval", tier: 4, name: "Fleet Coordination", description: "Combined fleet tactics make large fleets extremely effective.", cost: 350, prerequisites: ["battleship_program", "carrier_aviation"], effects: [{ type: "modifier", target: "fleet_size_bonus", value: 0.2, description: "5+ Ship Fleet +20% All Combat Stats" }] },
  { id: "nuclear_submarines", tree_id: "naval", tier: 4, name: "Nuclear Submarines", description: "Nuclear-powered submarines with extended range and enhanced stealth.", cost: 400, prerequisites: ["submarine_warfare", "anti_submarine_warfare"], effects: [{ type: "modifier", target: "submarine_range", value: 1.0, description: "Submarine range doubled, stealth +50%" }] },
  { id: "amphibious_doctrine", tree_id: "naval", tier: 4, name: "Amphibious Doctrine", description: "Coordinated beach landings reduce the massive penalty of amphibious assaults.", cost: 360, prerequisites: ["naval_bombardment"], effects: [{ type: "modifier", target: "amphibious_penalty", value: -0.5, description: "Amphibious assault penalty -50%" }] },
  { id: "supercarrier_program", tree_id: "naval", tier: 5, name: "Supercarrier Program", description: "Massive carriers holding 8 aircraft and capable of coastal bombardment.", cost: 550, prerequisites: ["carrier_aviation", "fleet_coordination"], effects: [{ type: "unlock", target: "unit", value: "supercarrier", description: "Unlocks Supercarrier (8 aircraft, coastal bombard)" }] },
  { id: "naval_strike_doctrine", tree_id: "naval", tier: 5, name: "Naval Strike Doctrine", description: "Combined fleet strike operations maximize all naval combat.", cost: 500, prerequisites: ["fleet_coordination"], effects: [{ type: "modifier", target: "all_ship_combat", value: 0.3, description: "+30% All Ship Combat Stats" }] },
  { id: "sea_control_doctrine", tree_id: "naval", tier: 5, name: "Sea Control Doctrine", description: "Controlling sea routes adjacent to enemy coast bleeds their war effort.", cost: 600, prerequisites: ["naval_strike_doctrine"], effects: [{ type: "modifier", target: "sea_control_exhaustion", value: 1.0, description: "Controlling enemy's coastal sea: +1 enemy War Exhaustion/day" }] },
];

// ============================================================
// AIRCRAFT TREE
// ============================================================
const AIRCRAFT_TECH: TechDef[] = [
  { id: "basic_aviation", tree_id: "aircraft", tier: 1, name: "Basic Aviation", description: "Foundational aerospace knowledge enabling airfields.", cost: 90, prerequisites: [], effects: [{ type: "unlock", target: "building", value: "airfield", description: "Unlocks Airfield Building" }], unlocks_building: "airfield" },
  { id: "fighter_program", tree_id: "aircraft", tier: 1, name: "Fighter Program", description: "Air superiority fighters protecting your skies.", cost: 100, prerequisites: ["basic_aviation"], effects: [{ type: "unlock", target: "unit", value: "fighter", description: "Unlocks Fighter" }], unlocks_unit: "fighter" },
  { id: "recon_aircraft", tree_id: "aircraft", tier: 1, name: "Reconnaissance Aircraft", description: "Spy planes reveal enemy province unit counts within 2 provinces.", cost: 80, prerequisites: ["basic_aviation"], effects: [{ type: "ability", target: "recon_range", value: 2, description: "Reveals enemy province counts within 2 provinces" }] },
  { id: "strategic_bombing", tree_id: "aircraft", tier: 2, name: "Strategic Bombing", description: "Long-range bombers capable of hitting enemy cities.", cost: 170, prerequisites: ["fighter_program"], effects: [{ type: "unlock", target: "unit", value: "bomber", description: "Unlocks Bomber" }], unlocks_unit: "bomber" },
  { id: "close_air_support", tree_id: "aircraft", tier: 2, name: "Close Air Support", description: "Fighters directed to assist ground troops in their attack.", cost: 160, prerequisites: ["fighter_program"], effects: [{ type: "modifier", target: "ground_attack_air_bonus", value: 0.2, description: "+20% Ground Attack with Air Support" }] },
  { id: "air_superiority_doctrine", tree_id: "aircraft", tier: 2, name: "Air Superiority Doctrine", description: "Dedicated air-to-air combat training.", cost: 150, prerequisites: ["fighter_program"], effects: [{ type: "modifier", target: "fighter_vs_fighter", value: 0.25, description: "+25% Fighters vs Other Fighters" }] },
  { id: "improved_engines", tree_id: "aircraft", tier: 2, name: "Improved Engines", description: "Better powerplants extend aircraft operational range.", cost: 140, prerequisites: ["basic_aviation"], effects: [{ type: "modifier", target: "aircraft_range", value: 2, description: "+2 Province Range All Aircraft" }] },
  { id: "heavy_bomber_program", tree_id: "aircraft", tier: 3, name: "Heavy Bomber Program", description: "Massive payload aircraft that devastate industrial targets.", cost: 260, prerequisites: ["strategic_bombing"], effects: [{ type: "unlock", target: "unit", value: "heavy_bomber", description: "Unlocks Heavy Bomber" }], unlocks_unit: "heavy_bomber" },
  { id: "jet_engine_research", tree_id: "aircraft", tier: 3, name: "Jet Engine Research", description: "Revolutionary jet propulsion enables supersonic aircraft.", cost: 280, prerequisites: ["improved_engines", "fighter_program"], effects: [{ type: "unlock", target: "unit", value: "jet_fighter", description: "Unlocks Jet Fighter" }], unlocks_unit: "jet_fighter" },
  { id: "aerial_refueling", tree_id: "aircraft", tier: 3, name: "Aerial Refueling", description: "Mid-air refueling doubles all aircraft range.", cost: 240, prerequisites: ["improved_engines"], effects: [{ type: "modifier", target: "aircraft_range_mult", value: 2.0, description: "All Aircraft Range Doubled" }] },
  { id: "paratrooper_aircraft", tree_id: "aircraft", tier: 3, name: "Paratrooper Aircraft", description: "Heavy transport aircraft enabling paradrop operations.", cost: 220, prerequisites: ["heavy_bomber_program"], effects: [{ type: "ability", target: "paradrop_enabled", value: 1, description: "Enables Paratrooper drop operations" }] },
  { id: "stealth_aircraft", tree_id: "aircraft", tier: 4, name: "Stealth Aircraft", description: "Radar-absorbing materials make bombers invisible until directly overhead.", cost: 380, prerequisites: ["jet_engine_research"], effects: [{ type: "unlock", target: "unit", value: "stealth_bomber", description: "Unlocks Stealth Bomber" }], unlocks_unit: "stealth_bomber" },
  { id: "strategic_bombing_doctrine", tree_id: "aircraft", tier: 4, name: "Strategic Bombing Doctrine", description: "Precision targeting of industrial centers reduces enemy production.", cost: 360, prerequisites: ["heavy_bomber_program"], effects: [{ type: "modifier", target: "city_bombing_production_debuff", value: 0.25, description: "City Bombing Reduces Enemy Factory Output 25%" }] },
  { id: "air_interdiction", tree_id: "aircraft", tier: 4, name: "Air Interdiction", description: "Bombers target supply lines, cutting provinces off from supply.", cost: 340, prerequisites: ["strategic_bombing_doctrine"], effects: [{ type: "ability", target: "supply_cut", value: 1, description: "Bombers can cut supply to a province for 3 days" }] },
  { id: "fifth_gen_fighter", tree_id: "aircraft", tier: 5, name: "5th Generation Fighter", description: "Ultimate air superiority fighter — defeats all earlier aircraft types.", cost: 520, prerequisites: ["stealth_aircraft", "jet_engine_research"], effects: [{ type: "modifier", target: "fifth_gen_air_superiority", value: 0.5, description: "+50% vs All Earlier Aircraft Types" }] },
  { id: "hypersonic_missiles", tree_id: "aircraft", tier: 5, name: "Hypersonic Missiles", description: "Air-launched hypersonic missiles bypass all SAM systems.", cost: 580, prerequisites: ["fifth_gen_fighter"], effects: [{ type: "ability", target: "bypass_sam", value: 1, description: "Air-launched missiles bypass SAM batteries" }] },
  { id: "full_air_dominance_doctrine", tree_id: "aircraft", tier: 5, name: "Full Air Dominance Doctrine", description: "Total control of the skies provides massive ground support.", cost: 650, prerequisites: ["fifth_gen_fighter", "air_interdiction"], effects: [{ type: "modifier", target: "air_dominance_ground_bonus", value: 0.35, description: "+35% Ground Attack Under Air Dominance" }] },
];

// ============================================================
// ECONOMY TREE
// ============================================================
const ECONOMY_TECH: TechDef[] = [
  { id: "basic_industry", tree_id: "economy", tier: 1, name: "Basic Industry", description: "Foundational industrial techniques.", cost: 60, prerequisites: [], effects: [{ type: "modifier", target: "factory_output", value: 0.1, description: "+10% Factory Output" }] },
  { id: "agricultural_improvement", tree_id: "economy", tier: 1, name: "Agricultural Improvement", description: "Better farming increases fertilizer output.", cost: 55, prerequisites: [], effects: [{ type: "modifier", target: "fertilizer_production", value: 0.2, description: "+20% Fertilizer Production" }] },
  { id: "trade_infrastructure", tree_id: "economy", tier: 1, name: "Trade Infrastructure", description: "Roads and ports improve trade revenue.", cost: 65, prerequisites: [], effects: [{ type: "modifier", target: "trade_income", value: 0.1, description: "+10% Trade Income" }] },
  { id: "steel_industry", tree_id: "economy", tier: 2, name: "Steel Industry", description: "Integrated steel mills dramatically boost production.", cost: 130, prerequisites: ["basic_industry"], effects: [{ type: "modifier", target: "steel_production", value: 0.25, description: "+25% Steel Production" }] },
  { id: "oil_refining", tree_id: "economy", tier: 2, name: "Oil Refining", description: "Refining capacity increases oil output and unlocks Consumer Goods chain.", cost: 140, prerequisites: ["basic_industry"], effects: [{ type: "modifier", target: "oil_production", value: 0.2, description: "+20% Oil Production, unlocks Consumer Goods chain" }] },
  { id: "banking_system", tree_id: "economy", tier: 2, name: "Banking System", description: "Modern banking increases gold income and reduces corruption.", cost: 120, prerequisites: ["trade_infrastructure"], effects: [{ type: "modifier", target: "gold_income", value: 0.15, description: "+15% Gold Income, -5 Corruption" }] },
  { id: "electronics_industry", tree_id: "economy", tier: 2, name: "Electronics Industry", description: "Circuit board manufacturing increases Electronics output.", cost: 150, prerequisites: ["basic_industry"], effects: [{ type: "modifier", target: "electronics_production", value: 0.25, description: "+25% Electronics Production" }] },
  { id: "industrial_automation", tree_id: "economy", tier: 3, name: "Industrial Automation", description: "Machines replace workers — higher output, lower demand.", cost: 220, prerequisites: ["steel_industry", "electronics_industry"], effects: [{ type: "modifier", target: "factory_output", value: 0.2, description: "+20% Factory Output, -10% Worker Demand" }] },
  { id: "national_railway", tree_id: "economy", tier: 3, name: "National Railway", description: "A national rail network speeds supply and boosts trade.", cost: 200, prerequisites: ["trade_infrastructure"], effects: [{ type: "modifier", target: "supply_range_all", value: 2, description: "+2 Supply Range All Units, +15% Trade Income" }] },
  { id: "petrochemical_industry", tree_id: "economy", tier: 3, name: "Petrochemical Industry", description: "Advanced oil chemistry boosts Motor Parts output.", cost: 230, prerequisites: ["oil_refining"], effects: [{ type: "modifier", target: "motor_parts_production", value: 0.3, description: "+30% Motor Parts Production" }] },
  { id: "mass_production", tree_id: "economy", tier: 3, name: "Mass Production", description: "Assembly line techniques reduce unit construction costs.", cost: 210, prerequisites: ["industrial_automation"], effects: [{ type: "modifier", target: "unit_training_cost", value: -0.2, description: "-20% Unit Training Cost" }] },
  {
    id: "planned_economy",
    tree_id: "economy", tier: 4,
    name: "Planned Economy",
    description: "State-directed production maximizes industrial output at the cost of consumer goods.",
    cost: 320, prerequisites: ["industrial_automation"],
    effects: [{ type: "modifier", target: "factory_output", value: 0.35, description: "+35% Factory Output, -20% Consumer Goods Efficiency" }],
    requires_ideology: "communism",
    mutually_exclusive: ["free_market_expansion"],
  },
  {
    id: "free_market_expansion",
    tree_id: "economy", tier: 4,
    name: "Free Market Expansion",
    description: "Deregulation and market competition drives income growth.",
    cost: 300, prerequisites: ["banking_system", "national_railway"],
    effects: [{ type: "modifier", target: "trade_income", value: 0.3, description: "+30% Trade Income, +20% Tax Income" }],
    requires_ideology: "liberal_democracy",
    mutually_exclusive: ["planned_economy"],
  },
  { id: "nuclear_power", tree_id: "economy", tier: 4, name: "Nuclear Power", description: "Nuclear reactors drastically reduce factory operating costs.", cost: 350, prerequisites: ["electronics_industry"], effects: [{ type: "modifier", target: "factory_upkeep", value: -0.4, description: "-40% Factory Upkeep Costs" }] },
  { id: "advanced_logistics_network", tree_id: "economy", tier: 4, name: "Advanced Logistics Network", description: "Automated supply network removes need for manual depot management.", cost: 330, prerequisites: ["national_railway", "mass_production"], effects: [{ type: "ability", target: "national_supply_grid", value: 1, description: "National supply grid — no manual depots needed" }] },
  { id: "economic_superpower", tree_id: "economy", tier: 5, name: "Economic Superpower", description: "GDP growth flywheel — the richest nation gets richer.", cost: 500, prerequisites: ["nuclear_power", "advanced_logistics_network"], effects: [{ type: "modifier", target: "gdp_multiplier", value: 1.5, description: "×1.5 GDP Multiplier, +40% Tax Income" }] },
  { id: "war_economy", tree_id: "economy", tier: 5, name: "War Economy", description: "Full militarization of the economy reduces unit costs during wartime.", cost: 480, prerequisites: ["mass_production", "industrial_automation"], effects: [{ type: "modifier", target: "wartime_unit_cost", value: -0.3, description: "-30% Unit Production Cost During War" }] },
  { id: "global_trade_hub", tree_id: "economy", tier: 5, name: "Global Trade Hub", description: "Become the center of the world economy. Requires 5 active trade deals.", cost: 550, prerequisites: ["free_market_expansion"], effects: [{ type: "modifier", target: "trade_income_mult", value: 2.0, description: "×2 Trade Income (requires 5 active trade agreements)" }] },
];

// ============================================================
// RESEARCH TREE
// ============================================================
const RESEARCH_TECH: TechDef[] = [
  { id: "basic_research_methods", tree_id: "research", tier: 1, name: "Basic Research Methods", description: "Scientific methodology improves all research.", cost: 50, prerequisites: [], effects: [{ type: "modifier", target: "research_power_gain", value: 0.1, description: "+10% All Research Power Gain" }] },
  { id: "laboratory_construction", tree_id: "research", tier: 1, name: "Laboratory Construction", description: "Dedicated research labs in universities.", cost: 75, prerequisites: [], effects: [{ type: "modifier", target: "university_rp", value: 5, description: "Universities produce +5 RP/tick" }] },
  { id: "advanced_materials", tree_id: "research", tier: 2, name: "Advanced Materials Science", description: "Unlocks processing of rare metals.", cost: 120, prerequisites: ["basic_research_methods"], effects: [{ type: "ability", target: "titanium_chromium_processing", value: 1, description: "Unlocks Titanium and Chromium processing chains" }] },
  { id: "applied_physics", tree_id: "research", tier: 2, name: "Applied Physics", description: "Foundation for nuclear and advanced aviation research.", cost: 130, prerequisites: ["laboratory_construction"], effects: [{ type: "modifier", target: "research_power_gain", value: 0.1, description: "+10% RP Gain, prerequisite for Nuclear branch" }] },
  { id: "scientific_method", tree_id: "research", tier: 2, name: "Scientific Method", description: "Rigorous research processes accelerate all tech.", cost: 110, prerequisites: ["basic_research_methods"], effects: [{ type: "modifier", target: "research_speed", value: 0.15, description: "+15% Research Speed" }] },
  { id: "industrial_research_complex", tree_id: "research", tier: 3, name: "Industrial Research Complex", description: "Advanced cities generate passive research power.", cost: 200, prerequisites: ["scientific_method"], effects: [{ type: "modifier", target: "city_tier3_rp", value: 10, description: "Cities Tier 3+ generate +10 RP passively" }] },
  { id: "theoretical_physics", tree_id: "research", tier: 3, name: "Theoretical Physics", description: "Prerequisite for nuclear weapons and advanced aviation.", cost: 180, prerequisites: ["applied_physics"], effects: [{ type: "ability", target: "nuclear_prerequisite", value: 1, description: "Unlocks Nuclear Theory research path" }] },
  { id: "cybernetics", tree_id: "research", tier: 3, name: "Cybernetics", description: "Man-machine integration amplifies all research.", cost: 220, prerequisites: ["advanced_materials", "scientific_method"], effects: [{ type: "modifier", target: "all_tech_bonuses", value: 0.1, description: "+10% All Tech Bonuses (meta multiplier)" }] },
  { id: "nuclear_theory", tree_id: "research", tier: 4, name: "Nuclear Theory", description: "Theoretical nuclear physics enabling a weapons program.", cost: 300, prerequisites: ["theoretical_physics"], effects: [{ type: "unlock", target: "building", value: "nuclear_reactor", description: "Unlocks Nuclear Reactor Building" }], unlocks_building: "nuclear_reactor" },
  { id: "advanced_metallurgy", tree_id: "research", tier: 4, name: "Advanced Metallurgy", description: "Cutting-edge materials boost all resource production.", cost: 280, prerequisites: ["advanced_materials", "industrial_research_complex"], effects: [{ type: "modifier", target: "all_resource_production", value: 0.15, description: "+15% All Resource Production" }] },
  { id: "ai_research", tree_id: "research", tier: 4, name: "AI Research", description: "Artificial intelligence accelerates research and military coordination.", cost: 400, prerequisites: ["cybernetics"], effects: [{ type: "modifier", target: "research_power_gain", value: 0.25, description: "+25% RP Gain, +10% Military Power" }] },
  { id: "nuclear_weapons_program", tree_id: "research", tier: 5, name: "Nuclear Weapons Program", description: "Complete nuclear weapons development. Requires Enriched Uranium stockpile.", cost: 500, prerequisites: ["nuclear_theory"], effects: [{ type: "unlock", target: "unit", value: "nuclear_missile", description: "Unlocks Nuclear Missile" }], unlocks_unit: "nuclear_missile" },
  { id: "thermonuclear_weapons", tree_id: "research", tier: 5, name: "Thermonuclear Weapons", description: "Hydrogen bomb development — area nuclear destruction.", cost: 700, prerequisites: ["nuclear_weapons_program"], effects: [{ type: "unlock", target: "unit", value: "h_bomb", description: "Unlocks H-Bomb" }], unlocks_unit: "h_bomb" },
  { id: "mirv_program", tree_id: "research", tier: 5, name: "MIRV Program", description: "Multiple Independently targetable Reentry Vehicles — 3 simultaneous strikes.", cost: 900, prerequisites: ["thermonuclear_weapons"], effects: [{ type: "unlock", target: "unit", value: "mirv", description: "Unlocks MIRV" }], unlocks_unit: "mirv" },
  { id: "missile_defense_system", tree_id: "research", tier: 5, name: "Missile Defense System", description: "Anti-ballistic missile defense with 40% interception rate.", cost: 600, prerequisites: ["nuclear_theory", "sam_batteries"], effects: [{ type: "modifier", target: "nuke_intercept_chance", value: 0.4, description: "40% Chance to Intercept Incoming Nuclear Missiles" }] },
];

// ============================================================
// POLITICAL TREE
// ============================================================
const POLITICAL_TECH: TechDef[] = [
  { id: "state_administration", tree_id: "political", tier: 1, name: "State Administration", description: "Bureaucratic efficiency improves government spending results.", cost: 50, prerequisites: [], effects: [{ type: "modifier", target: "government_spending_efficiency", value: 0.1, description: "+10% Government Spending Efficiency" }] },
  { id: "press_control", tree_id: "political", tier: 1, name: "Press Control", description: "State media reduces war exhaustion and boosts stability.", cost: 60, prerequisites: [], effects: [{ type: "modifier", target: "stability_per_tick", value: 2, description: "+2 Stability/Tick, -0.1 War Exhaustion/Tick" }] },
  { id: "basic_intelligence", tree_id: "political", tier: 1, name: "Basic Intelligence Service", description: "Intelligence agencies reveal enemy leaders and ideologies.", cost: 55, prerequisites: [], effects: [{ type: "ability", target: "reveal_enemy_political", value: 1, description: "Reveals other nations' leaders and ideology" }] },
  { id: "propaganda_ministry", tree_id: "political", tier: 2, name: "Propaganda Ministry", description: "State propaganda maximizes national cohesion.", cost: 120, prerequisites: ["press_control"], effects: [{ type: "modifier", target: "stability_per_tick", value: 5, description: "+5 Stability/Tick, -0.2 War Exhaustion/Tick" }] },
  { id: "diplomatic_corps", tree_id: "political", tier: 2, name: "Diplomatic Corps", description: "Professional diplomats speed up war justification.", cost: 110, prerequisites: ["basic_intelligence"], effects: [{ type: "modifier", target: "justify_war_time", value: -0.25, description: "-25% Casus Belli Fabrication Time" }] },
  { id: "civil_service_reform", tree_id: "political", tier: 2, name: "Civil Service Reform", description: "Merit-based bureaucracy cuts corruption and boosts PP.", cost: 130, prerequisites: ["state_administration"], effects: [{ type: "modifier", target: "corruption", value: -5, description: "-5 Corruption, +1 PP/Tick" }] },
  { id: "constitutional_reform", tree_id: "political", tier: 2, name: "Constitutional Reform", description: "Legal framework expansion grants an additional policy slot.", cost: 100, prerequisites: ["state_administration"], effects: [{ type: "ability", target: "policy_slots", value: 1, description: "+1 Policy Slot" }] },
  {
    id: "secret_police",
    tree_id: "political", tier: 3,
    name: "Secret Police",
    description: "Internal security agency eliminates dissent and boosts stability. Authoritarian only.",
    cost: 200, prerequisites: ["propaganda_ministry"],
    effects: [{ type: "modifier", target: "stability_per_tick", value: 5, description: "+5 Stability, +40% Security Efficiency" }],
    requires_ideology: "military_junta",
  },
  {
    id: "free_press",
    tree_id: "political", tier: 3,
    name: "Free Press",
    description: "Independent journalism dramatically reduces corruption. Democratic only.",
    cost: 200, prerequisites: ["propaganda_ministry"],
    effects: [{ type: "modifier", target: "corruption", value: -15, description: "-15 Corruption, +10% Research Power" }],
    requires_ideology: "liberal_democracy",
  },
  { id: "nationalist_mobilization", tree_id: "political", tier: 3, name: "Nationalist Mobilization", description: "Patriotic fervor reduces war exhaustion and increases manpower.", cost: 210, prerequisites: ["propaganda_ministry"], effects: [{ type: "modifier", target: "war_exhaustion_gain", value: -0.3, description: "-30% War Exhaustion Gain, +20% Wartime Manpower" }] },
  { id: "international_alliances", tree_id: "political", tier: 3, name: "International Alliances", description: "Diplomatic frameworks enable formal alliances.", cost: 220, prerequisites: ["diplomatic_corps"], effects: [{ type: "ability", target: "form_alliances", value: 1, description: "Can form defensive pacts; alliance bonuses +20%" }] },
  { id: "political_indoctrination", tree_id: "political", tier: 4, name: "Political Indoctrination", description: "Deep ideological training prevents enemy destabilization.", cost: 310, prerequisites: ["nationalist_mobilization"], effects: [{ type: "modifier", target: "ideology_spread_resistance", value: 0.5, description: "+50% Resistance to Enemy Ideology Spreading" }] },
  { id: "soft_power_projection", tree_id: "political", tier: 4, name: "Soft Power Projection", description: "Spend PP to destabilize enemy nations from within.", cost: 300, prerequisites: ["international_alliances"], effects: [{ type: "ability", target: "destabilize_enemy", value: 1, description: "Can spend PP to reduce enemy stability" }] },
  { id: "legal_system_reform", tree_id: "political", tier: 4, name: "Legal System Reform", description: "Comprehensive legal modernization permanently reduces corruption.", cost: 290, prerequisites: ["civil_service_reform", "constitutional_reform"], effects: [{ type: "modifier", target: "corruption", value: -20, description: "-20 Corruption, +5 Stability/Tick Permanently" }] },
  { id: "sphere_of_influence", tree_id: "political", tier: 4, name: "Sphere of Influence", description: "Formalized hegemony over puppets increases their economic contribution.", cost: 320, prerequisites: ["international_alliances"], effects: [{ type: "modifier", target: "puppet_tribute", value: 0.2, description: "+20% Puppet Nation Tribute" }] },
  {
    id: "totalitarian_control",
    tree_id: "political", tier: 5,
    name: "Totalitarian Control",
    description: "Absolute power. Stability immune to war exhaustion. Manpower cap removed.",
    cost: 500, prerequisites: ["political_indoctrination", "legal_system_reform"],
    effects: [{ type: "ability", target: "totalitarian_rule", value: 1, description: "Stability immune to war exhaustion; manpower cap removed" }],
    requires_ideology: "fascism",
  },
  {
    id: "liberal_democracy_apex",
    tree_id: "political", tier: 5,
    name: "Liberal Democracy Apex",
    description: "Full democratic maturity. Maximum PP generation and trade bonuses.",
    cost: 500, prerequisites: ["free_press", "legal_system_reform"],
    effects: [{ type: "modifier", target: "pp_per_tick", value: 2, description: "+2 PP/Tick, +30 Global Opinion, ×1.3 Trade Income" }],
    requires_ideology: "liberal_democracy",
  },
  {
    id: "one_party_state",
    tree_id: "political", tier: 5,
    name: "One Party State",
    description: "Single-party rule reduces the cost of all political decisions.",
    cost: 480, prerequisites: ["political_indoctrination"],
    effects: [{ type: "modifier", target: "decision_pp_cost", value: -0.4, description: "-40% Political Power Cost of All Decisions" }],
    requires_ideology: "communism",
  },
  {
    id: "federal_republic",
    tree_id: "political", tier: 5,
    name: "Federal Republic",
    description: "Devolved democratic governance turns city prosperity into political power.",
    cost: 460, prerequisites: ["constitutional_reform", "legal_system_reform"],
    effects: [{ type: "modifier", target: "large_city_pp_bonus", value: 1, description: "Cities with 500k+ population generate +1 PP/Tick each" }],
    requires_ideology: "liberal_democracy",
  },
];

// ============================================================
// MASTER EXPORT — all trees combined
// ============================================================
export const ALL_TECH: TechDef[] = [
  ...INFANTRY_TECH,
  ...TANK_TECH,
  ...SUPPORT_TECH,
  ...NAVAL_TECH,
  ...AIRCRAFT_TECH,
  ...ECONOMY_TECH,
  ...RESEARCH_TECH,
  ...POLITICAL_TECH,
];

export const TECH_BY_ID: Record<string, TechDef> = Object.fromEntries(
  ALL_TECH.map((t) => [t.id, t])
);

export const TECH_BY_TREE: Record<string, TechDef[]> = {
  infantry: INFANTRY_TECH,
  tank: TANK_TECH,
  support: SUPPORT_TECH,
  naval: NAVAL_TECH,
  aircraft: AIRCRAFT_TECH,
  economy: ECONOMY_TECH,
  research: RESEARCH_TECH,
  political: POLITICAL_TECH,
};

// Starting tech available to all nations (no prerequisites)
export const STARTER_TECH_IDS: string[] = ALL_TECH
  .filter((t) => t.prerequisites.length === 0)
  .map((t) => t.id);
