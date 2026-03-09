// ============================================================
// Rise of Fronts — Nation Definitions
// All 239 playable nations
// Tier 1–6 | Color | 3-letter tag | Starting modifiers
// ============================================================

export interface NationDef {
  name: string;
  tag: string;           // 3-letter ISO-style code
  color: string;         // hex color for map
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  ideology_id: string;   // default starting ideology
  capital: string;
  region: string;
  population: number;    // starting population
  treasury: number;      // starting gold
  manpower_pool: number;
  stability: number;
  research_power: number;
  releasable_from?: string;    // tag of parent nation that can release this
  releasable_nations?: string[]; // tags this nation can release
  formable?: boolean;          // can be formed (not starting nation)
  form_conditions?: string;    // description of how to form
}

export const NATION_DEFINITIONS: NationDef[] = [
  // ============================================================
  // TIER 6 — SUPERPOWERS
  // ============================================================
  { name: "United States",     tag: "USA", color: "#3C6E9E", tier: 6, ideology_id: "liberal_democracy",  capital: "Washington D.C.", region: "North America",   population: 335_000_000, treasury: 50000, manpower_pool: 8000000,  stability: 75, research_power: 25 },
  { name: "China",             tag: "CHN", color: "#DE2910", tier: 6, ideology_id: "communism",           capital: "Beijing",          region: "East Asia",       population: 1_400_000_000, treasury: 45000, manpower_pool: 15000000, stability: 65, research_power: 20 },
  { name: "India",             tag: "IND", color: "#FF9933", tier: 6, ideology_id: "liberal_democracy",  capital: "New Delhi",        region: "South Asia",      population: 1_430_000_000, treasury: 30000, manpower_pool: 12000000, stability: 60, research_power: 18 },

  // ============================================================
  // TIER 5 — MAJOR POWERS
  // ============================================================
  { name: "Russia",            tag: "RUS", color: "#1C3F6E", tier: 5, ideology_id: "military_junta",     capital: "Moscow",           region: "Eastern Europe",  population: 144_000_000, treasury: 30000, manpower_pool: 5000000,  stability: 55, research_power: 18 },
  { name: "Brazil",            tag: "BRA", color: "#009C3B", tier: 5, ideology_id: "liberal_democracy",  capital: "Brasília",         region: "South America",   population: 215_000_000, treasury: 22000, manpower_pool: 4500000,  stability: 58, research_power: 14 },
  { name: "Indonesia",         tag: "IDN", color: "#CE1126", tier: 5, ideology_id: "liberal_democracy",  capital: "Jakarta",          region: "Southeast Asia",  population: 277_000_000, treasury: 20000, manpower_pool: 5000000,  stability: 60, research_power: 12 },
  { name: "Pakistan",          tag: "PAK", color: "#01411C", tier: 5, ideology_id: "military_junta",     capital: "Islamabad",        region: "South Asia",      population: 231_000_000, treasury: 12000, manpower_pool: 4000000,  stability: 45, research_power: 10 },
  { name: "Nigeria",           tag: "NGA", color: "#008751", tier: 5, ideology_id: "liberal_democracy",  capital: "Abuja",            region: "West Africa",     population: 223_000_000, treasury: 10000, manpower_pool: 4000000,  stability: 45, research_power: 8  },

  // ============================================================
  // TIER 4 — REGIONAL POWERS
  // ============================================================
  { name: "Germany",           tag: "DEU", color: "#FFCE00", tier: 4, ideology_id: "liberal_democracy",  capital: "Berlin",           region: "Western Europe",  population: 83_000_000,  treasury: 35000, manpower_pool: 2000000,  stability: 78, research_power: 20 },
  { name: "United Kingdom",    tag: "GBR", color: "#C8102E", tier: 4, ideology_id: "liberal_democracy",  capital: "London",           region: "Western Europe",  population: 67_000_000,  treasury: 32000, manpower_pool: 1800000,  stability: 75, research_power: 22 },
  { name: "France",            tag: "FRA", color: "#002395", tier: 4, ideology_id: "liberal_democracy",  capital: "Paris",            region: "Western Europe",  population: 68_000_000,  treasury: 30000, manpower_pool: 1800000,  stability: 72, research_power: 20 },
  { name: "Japan",             tag: "JPN", color: "#BC002D", tier: 4, ideology_id: "liberal_democracy",  capital: "Tokyo",            region: "East Asia",       population: 125_000_000, treasury: 35000, manpower_pool: 2500000,  stability: 75, research_power: 22 },
  { name: "South Korea",       tag: "KOR", color: "#003478", tier: 4, ideology_id: "liberal_democracy",  capital: "Seoul",            region: "East Asia",       population: 52_000_000,  treasury: 25000, manpower_pool: 2000000,  stability: 72, research_power: 20 },
  { name: "Turkey",            tag: "TUR", color: "#E30A17", tier: 4, ideology_id: "liberal_democracy",  capital: "Ankara",           region: "Middle East",     population: 85_000_000,  treasury: 18000, manpower_pool: 2500000,  stability: 58, research_power: 14 },
  { name: "Mexico",            tag: "MEX", color: "#006847", tier: 4, ideology_id: "liberal_democracy",  capital: "Mexico City",      region: "North America",   population: 130_000_000, treasury: 18000, manpower_pool: 2500000,  stability: 55, research_power: 12 },
  { name: "Iran",              tag: "IRN", color: "#239F40", tier: 4, ideology_id: "theocracy",           capital: "Tehran",           region: "Middle East",     population: 87_000_000,  treasury: 14000, manpower_pool: 2500000,  stability: 55, research_power: 12 },
  { name: "Saudi Arabia",      tag: "SAU", color: "#006C35", tier: 4, ideology_id: "monarchy",            capital: "Riyadh",           region: "Middle East",     population: 35_000_000,  treasury: 40000, manpower_pool: 1200000,  stability: 60, research_power: 12 },
  { name: "Egypt",             tag: "EGY", color: "#CE1126", tier: 4, ideology_id: "military_junta",     capital: "Cairo",            region: "North Africa",    population: 105_000_000, treasury: 12000, manpower_pool: 2500000,  stability: 50, research_power: 10 },
  { name: "South Africa",      tag: "ZAF", color: "#007A4D", tier: 4, ideology_id: "liberal_democracy",  capital: "Pretoria",         region: "Southern Africa", population: 61_000_000,  treasury: 14000, manpower_pool: 1500000,  stability: 55, research_power: 12 },
  { name: "Argentina",         tag: "ARG", color: "#74ACDF", tier: 4, ideology_id: "liberal_democracy",  capital: "Buenos Aires",     region: "South America",   population: 46_000_000,  treasury: 10000, manpower_pool: 1200000,  stability: 52, research_power: 12 },
  { name: "Australia",         tag: "AUS", color: "#00008B", tier: 4, ideology_id: "liberal_democracy",  capital: "Canberra",         region: "Oceania",         population: 26_000_000,  treasury: 22000, manpower_pool: 800000,   stability: 78, research_power: 18 },
  { name: "Canada",            tag: "CAN", color: "#FF0000", tier: 4, ideology_id: "liberal_democracy",  capital: "Ottawa",           region: "North America",   population: 38_000_000,  treasury: 25000, manpower_pool: 1000000,  stability: 80, research_power: 20 },
  { name: "Italy",             tag: "ITA", color: "#009246", tier: 4, ideology_id: "liberal_democracy",  capital: "Rome",             region: "Western Europe",  population: 60_000_000,  treasury: 22000, manpower_pool: 1500000,  stability: 65, research_power: 16 },
  { name: "Spain",             tag: "ESP", color: "#AA151B", tier: 4, ideology_id: "liberal_democracy",  capital: "Madrid",           region: "Western Europe",  population: 47_000_000,  treasury: 18000, manpower_pool: 1200000,  stability: 68, research_power: 15 },

  // ============================================================
  // TIER 3 — MIDDLE POWERS
  // ============================================================
  { name: "Poland",            tag: "POL", color: "#DC143C", tier: 3, ideology_id: "liberal_democracy",  capital: "Warsaw",           region: "Eastern Europe",  population: 38_000_000, treasury: 12000, manpower_pool: 1000000, stability: 68, research_power: 14 },
  { name: "Netherlands",       tag: "NLD", color: "#AE1C28", tier: 3, ideology_id: "liberal_democracy",  capital: "Amsterdam",        region: "Western Europe",  population: 17_000_000, treasury: 15000, manpower_pool: 500000,  stability: 80, research_power: 18 },
  { name: "Belgium",           tag: "BEL", color: "#FAE042", tier: 3, ideology_id: "liberal_democracy",  capital: "Brussels",         region: "Western Europe",  population: 11_000_000, treasury: 12000, manpower_pool: 350000,  stability: 75, research_power: 16 },
  { name: "Sweden",            tag: "SWE", color: "#006AA7", tier: 3, ideology_id: "social_democracy",   capital: "Stockholm",        region: "Northern Europe", population: 10_500_000, treasury: 16000, manpower_pool: 350000,  stability: 82, research_power: 18 },
  { name: "Norway",            tag: "NOR", color: "#EF2B2D", tier: 3, ideology_id: "social_democracy",   capital: "Oslo",             region: "Northern Europe", population: 5_400_000,  treasury: 18000, manpower_pool: 200000,  stability: 85, research_power: 18 },
  { name: "Denmark",           tag: "DNK", color: "#C60C30", tier: 3, ideology_id: "social_democracy",   capital: "Copenhagen",       region: "Northern Europe", population: 5_900_000,  treasury: 14000, manpower_pool: 200000,  stability: 85, research_power: 18 },
  { name: "Finland",           tag: "FIN", color: "#003580", tier: 3, ideology_id: "social_democracy",   capital: "Helsinki",         region: "Northern Europe", population: 5_500_000,  treasury: 12000, manpower_pool: 200000,  stability: 82, research_power: 18 },
  { name: "Switzerland",       tag: "CHE", color: "#FF0000", tier: 3, ideology_id: "liberal_democracy",  capital: "Bern",             region: "Western Europe",  population: 8_700_000,  treasury: 20000, manpower_pool: 250000,  stability: 90, research_power: 20 },
  { name: "Austria",           tag: "AUT", color: "#ED2939", tier: 3, ideology_id: "liberal_democracy",  capital: "Vienna",           region: "Western Europe",  population: 9_000_000,  treasury: 12000, manpower_pool: 280000,  stability: 75, research_power: 16 },
  { name: "Portugal",          tag: "PRT", color: "#006600", tier: 3, ideology_id: "liberal_democracy",  capital: "Lisbon",           region: "Western Europe",  population: 10_300_000, treasury: 9000,  manpower_pool: 300000,  stability: 72, research_power: 13 },
  { name: "Greece",            tag: "GRC", color: "#0D5EAF", tier: 3, ideology_id: "liberal_democracy",  capital: "Athens",           region: "Southern Europe", population: 10_700_000, treasury: 8000,  manpower_pool: 350000,  stability: 60, research_power: 12 },
  { name: "Ukraine",           tag: "UKR", color: "#005BBB", tier: 3, ideology_id: "liberal_democracy",  capital: "Kyiv",             region: "Eastern Europe",  population: 44_000_000, treasury: 8000,  manpower_pool: 1500000, stability: 40, research_power: 12 },
  { name: "Romania",           tag: "ROU", color: "#002B7F", tier: 3, ideology_id: "liberal_democracy",  capital: "Bucharest",        region: "Eastern Europe",  population: 19_000_000, treasury: 8000,  manpower_pool: 600000,  stability: 60, research_power: 11 },
  { name: "Czech Republic",    tag: "CZE", color: "#D7141A", tier: 3, ideology_id: "liberal_democracy",  capital: "Prague",           region: "Eastern Europe",  population: 10_800_000, treasury: 10000, manpower_pool: 350000,  stability: 72, research_power: 15 },
  { name: "Hungary",           tag: "HUN", color: "#477050", tier: 3, ideology_id: "liberal_democracy",  capital: "Budapest",         region: "Eastern Europe",  population: 10_000_000, treasury: 8000,  manpower_pool: 320000,  stability: 58, research_power: 12 },
  { name: "Thailand",          tag: "THA", color: "#A51931", tier: 3, ideology_id: "monarchy",            capital: "Bangkok",          region: "Southeast Asia",  population: 72_000_000, treasury: 12000, manpower_pool: 1500000, stability: 58, research_power: 11 },
  { name: "Vietnam",           tag: "VNM", color: "#DA251D", tier: 3, ideology_id: "communism",           capital: "Hanoi",            region: "Southeast Asia",  population: 98_000_000, treasury: 8000,  manpower_pool: 2000000, stability: 65, research_power: 10 },
  { name: "Malaysia",          tag: "MYS", color: "#CC0001", tier: 3, ideology_id: "liberal_democracy",  capital: "Kuala Lumpur",     region: "Southeast Asia",  population: 33_000_000, treasury: 10000, manpower_pool: 700000,  stability: 65, research_power: 12 },
  { name: "Philippines",       tag: "PHL", color: "#0038A8", tier: 3, ideology_id: "liberal_democracy",  capital: "Manila",           region: "Southeast Asia",  population: 115_000_000,treasury: 8000,  manpower_pool: 2000000, stability: 55, research_power: 10 },
  { name: "Colombia",          tag: "COL", color: "#FCD116", tier: 3, ideology_id: "liberal_democracy",  capital: "Bogotá",           region: "South America",   population: 52_000_000, treasury: 8000,  manpower_pool: 1000000, stability: 52, research_power: 10 },
  { name: "Chile",             tag: "CHL", color: "#D52B1E", tier: 3, ideology_id: "liberal_democracy",  capital: "Santiago",         region: "South America",   population: 19_000_000, treasury: 9000,  manpower_pool: 450000,  stability: 68, research_power: 12 },
  { name: "Peru",              tag: "PER", color: "#D91023", tier: 3, ideology_id: "liberal_democracy",  capital: "Lima",             region: "South America",   population: 33_000_000, treasury: 7000,  manpower_pool: 700000,  stability: 52, research_power: 10 },
  { name: "Algeria",           tag: "DZA", color: "#006233", tier: 3, ideology_id: "military_junta",     capital: "Algiers",          region: "North Africa",    population: 45_000_000, treasury: 10000, manpower_pool: 1000000, stability: 52, research_power: 8  },
  { name: "Morocco",           tag: "MAR", color: "#C1272D", tier: 3, ideology_id: "monarchy",            capital: "Rabat",            region: "North Africa",    population: 37_000_000, treasury: 7000,  manpower_pool: 800000,  stability: 58, research_power: 8  },
  { name: "Ethiopia",          tag: "ETH", color: "#078930", tier: 3, ideology_id: "liberal_democracy",  capital: "Addis Ababa",      region: "East Africa",     population: 126_000_000,treasury: 4000,  manpower_pool: 2500000, stability: 48, research_power: 6  },
  { name: "Kenya",             tag: "KEN", color: "#006600", tier: 3, ideology_id: "liberal_democracy",  capital: "Nairobi",          region: "East Africa",     population: 55_000_000, treasury: 5000,  manpower_pool: 1000000, stability: 55, research_power: 8  },
  { name: "Tanzania",          tag: "TZA", color: "#1EB53A", tier: 3, ideology_id: "liberal_democracy",  capital: "Dodoma",           region: "East Africa",     population: 63_000_000, treasury: 3500,  manpower_pool: 1200000, stability: 55, research_power: 6  },
  { name: "Ghana",             tag: "GHA", color: "#006B3F", tier: 3, ideology_id: "liberal_democracy",  capital: "Accra",            region: "West Africa",     population: 33_000_000, treasury: 4000,  manpower_pool: 600000,  stability: 60, research_power: 7  },
  { name: "Israel",            tag: "ISR", color: "#0038B8", tier: 3, ideology_id: "liberal_democracy",  capital: "Jerusalem",        region: "Middle East",     population: 9_500_000,  treasury: 20000, manpower_pool: 600000,  stability: 65, research_power: 20 },
  { name: "United Arab Emirates", tag: "UAE", color: "#00732F", tier: 3, ideology_id: "monarchy",        capital: "Abu Dhabi",        region: "Middle East",     population: 10_000_000, treasury: 35000, manpower_pool: 300000,  stability: 72, research_power: 15 },
  { name: "Iraq",              tag: "IRQ", color: "#007A3D", tier: 3, ideology_id: "liberal_democracy",  capital: "Baghdad",          region: "Middle East",     population: 42_000_000, treasury: 10000, manpower_pool: 1000000, stability: 40, research_power: 7  },
  { name: "Kazakhstan",        tag: "KAZ", color: "#00AFCA", tier: 3, ideology_id: "liberal_democracy",  capital: "Astana",           region: "Central Asia",    population: 19_000_000, treasury: 12000, manpower_pool: 500000,  stability: 58, research_power: 10 },
  { name: "Uzbekistan",        tag: "UZB", color: "#1EB53A", tier: 3, ideology_id: "liberal_democracy",  capital: "Tashkent",         region: "Central Asia",    population: 36_000_000, treasury: 5000,  manpower_pool: 700000,  stability: 52, research_power: 7  },
  { name: "North Korea",       tag: "PRK", color: "#024FA2", tier: 3, ideology_id: "communism",           capital: "Pyongyang",        region: "East Asia",       population: 26_000_000, treasury: 4000,  manpower_pool: 1800000, stability: 70, research_power: 8  },
  { name: "Taiwan",            tag: "TWN", color: "#FE0000", tier: 3, ideology_id: "liberal_democracy",  capital: "Taipei",           region: "East Asia",       population: 23_500_000, treasury: 18000, manpower_pool: 800000,  stability: 72, research_power: 18 },
  { name: "Venezuela",         tag: "VEN", color: "#CF142B", tier: 3, ideology_id: "communism",           capital: "Caracas",          region: "South America",   population: 29_000_000, treasury: 5000,  manpower_pool: 600000,  stability: 35, research_power: 7  },
  { name: "Cuba",              tag: "CUB", color: "#002A8F", tier: 3, ideology_id: "communism",           capital: "Havana",           region: "Caribbean",       population: 11_000_000, treasury: 3000,  manpower_pool: 500000,  stability: 60, research_power: 8  },
  { name: "Angola",            tag: "AGO", color: "#CC0000", tier: 3, ideology_id: "liberal_democracy",  capital: "Luanda",           region: "Central Africa",  population: 35_000_000, treasury: 7000,  manpower_pool: 700000,  stability: 48, research_power: 6  },
  { name: "Mozambique",        tag: "MOZ", color: "#009A44", tier: 3, ideology_id: "liberal_democracy",  capital: "Maputo",           region: "Southern Africa", population: 33_000_000, treasury: 2500,  manpower_pool: 600000,  stability: 48, research_power: 5  },
  { name: "Democratic Republic of Congo", tag: "COD", color: "#007FFF", tier: 3, ideology_id: "liberal_democracy", capital: "Kinshasa", region: "Central Africa", population: 100_000_000, treasury: 3000, manpower_pool: 2000000, stability: 35, research_power: 5 },
  { name: "Myanmar",           tag: "MMR", color: "#FECB00", tier: 3, ideology_id: "military_junta",     capital: "Naypyidaw",        region: "Southeast Asia",  population: 54_000_000, treasury: 4000,  manpower_pool: 1000000, stability: 38, research_power: 6  },
  { name: "Bangladesh",        tag: "BGD", color: "#006A4E", tier: 3, ideology_id: "liberal_democracy",  capital: "Dhaka",            region: "South Asia",      population: 170_000_000,treasury: 5000,  manpower_pool: 3000000, stability: 50, research_power: 8  },
  { name: "Sri Lanka",         tag: "LKA", color: "#8D153A", tier: 3, ideology_id: "liberal_democracy",  capital: "Colombo",          region: "South Asia",      population: 22_000_000, treasury: 4000,  manpower_pool: 400000,  stability: 52, research_power: 8  },
  { name: "Nepal",             tag: "NPL", color: "#003893", tier: 3, ideology_id: "liberal_democracy",  capital: "Kathmandu",        region: "South Asia",      population: 30_000_000, treasury: 2000,  manpower_pool: 500000,  stability: 50, research_power: 5  },
  { name: "New Zealand",       tag: "NZL", color: "#00247D", tier: 3, ideology_id: "liberal_democracy",  capital: "Wellington",       region: "Oceania",         population: 5_100_000,  treasury: 10000, manpower_pool: 150000,  stability: 85, research_power: 16 },

  // ============================================================
  // TIER 2 — SMALL-MEDIUM NATIONS
  // ============================================================
  { name: "Slovakia",          tag: "SVK", color: "#EE1C25", tier: 2, ideology_id: "liberal_democracy",  capital: "Bratislava",       region: "Eastern Europe",  population: 5_500_000,  treasury: 7000,  manpower_pool: 180000, stability: 68, research_power: 12 },
  { name: "Serbia",            tag: "SRB", color: "#C6363C", tier: 2, ideology_id: "liberal_democracy",  capital: "Belgrade",         region: "Balkans",         population: 7_000_000,  treasury: 5000,  manpower_pool: 250000, stability: 58, research_power: 10 },
  { name: "Croatia",           tag: "HRV", color: "#FF0000", tier: 2, ideology_id: "liberal_democracy",  capital: "Zagreb",           region: "Balkans",         population: 4_000_000,  treasury: 5500,  manpower_pool: 150000, stability: 65, research_power: 12 },
  { name: "Bulgaria",          tag: "BGR", color: "#D62612", tier: 2, ideology_id: "liberal_democracy",  capital: "Sofia",            region: "Balkans",         population: 6_500_000,  treasury: 5000,  manpower_pool: 200000, stability: 58, research_power: 10 },
  { name: "Slovenia",          tag: "SVN", color: "#003DA5", tier: 2, ideology_id: "liberal_democracy",  capital: "Ljubljana",        region: "Balkans",         population: 2_100_000,  treasury: 6000,  manpower_pool: 80000,  stability: 75, research_power: 14 },
  { name: "Lithuania",         tag: "LTU", color: "#FDB913", tier: 2, ideology_id: "liberal_democracy",  capital: "Vilnius",          region: "Baltic",          population: 2_800_000,  treasury: 5500,  manpower_pool: 100000, stability: 68, research_power: 12 },
  { name: "Latvia",            tag: "LVA", color: "#9E3039", tier: 2, ideology_id: "liberal_democracy",  capital: "Riga",             region: "Baltic",          population: 1_900_000,  treasury: 5000,  manpower_pool: 70000,  stability: 68, research_power: 12 },
  { name: "Estonia",           tag: "EST", color: "#0072CE", tier: 2, ideology_id: "liberal_democracy",  capital: "Tallinn",          region: "Baltic",          population: 1_300_000,  treasury: 5500,  manpower_pool: 60000,  stability: 72, research_power: 14 },
  { name: "Belarus",           tag: "BLR", color: "#CF101A", tier: 2, ideology_id: "communism",           capital: "Minsk",            region: "Eastern Europe",  population: 9_400_000,  treasury: 4000,  manpower_pool: 350000, stability: 48, research_power: 10 },
  { name: "Moldova",           tag: "MDA", color: "#003DA5", tier: 2, ideology_id: "liberal_democracy",  capital: "Chișinău",         region: "Eastern Europe",  population: 2_600_000,  treasury: 2000,  manpower_pool: 80000,  stability: 48, research_power: 8  },
  { name: "Georgia",           tag: "GEO", color: "#FF0000", tier: 2, ideology_id: "liberal_democracy",  capital: "Tbilisi",          region: "Caucasus",        population: 3_700_000,  treasury: 3500,  manpower_pool: 120000, stability: 55, research_power: 9  },
  { name: "Armenia",           tag: "ARM", color: "#D90012", tier: 2, ideology_id: "liberal_democracy",  capital: "Yerevan",          region: "Caucasus",        population: 3_000_000,  treasury: 3000,  manpower_pool: 100000, stability: 55, research_power: 9  },
  { name: "Azerbaijan",        tag: "AZE", color: "#0092BC", tier: 2, ideology_id: "liberal_democracy",  capital: "Baku",             region: "Caucasus",        population: 10_000_000, treasury: 8000,  manpower_pool: 320000, stability: 55, research_power: 9  },
  { name: "Bosnia",            tag: "BIH", color: "#002395", tier: 2, ideology_id: "liberal_democracy",  capital: "Sarajevo",         region: "Balkans",         population: 3_300_000,  treasury: 3000,  manpower_pool: 100000, stability: 48, research_power: 8  },
  { name: "North Macedonia",   tag: "MKD", color: "#CE2028", tier: 2, ideology_id: "liberal_democracy",  capital: "Skopje",           region: "Balkans",         population: 2_100_000,  treasury: 2500,  manpower_pool: 70000,  stability: 55, research_power: 8  },
  { name: "Albania",           tag: "ALB", color: "#E41E20", tier: 2, ideology_id: "liberal_democracy",  capital: "Tirana",           region: "Balkans",         population: 2_800_000,  treasury: 2500,  manpower_pool: 80000,  stability: 55, research_power: 8  },
  { name: "Kosovo",            tag: "XKX", color: "#244AA5", tier: 2, ideology_id: "liberal_democracy",  capital: "Pristina",         region: "Balkans",         population: 1_800_000,  treasury: 2000,  manpower_pool: 60000,  stability: 50, research_power: 7  },
  { name: "Montenegro",        tag: "MNE", color: "#D4AF37", tier: 2, ideology_id: "liberal_democracy",  capital: "Podgorica",        region: "Balkans",         population: 620_000,    treasury: 2000,  manpower_pool: 25000,  stability: 60, research_power: 8  },
  { name: "Ireland",           tag: "IRL", color: "#169B62", tier: 2, ideology_id: "liberal_democracy",  capital: "Dublin",           region: "Western Europe",  population: 5_100_000,  treasury: 10000, manpower_pool: 140000, stability: 78, research_power: 16 },
  { name: "Iceland",           tag: "ISL", color: "#003897", tier: 2, ideology_id: "liberal_democracy",  capital: "Reykjavik",        region: "Northern Europe", population: 370_000,    treasury: 6000,  manpower_pool: 15000,  stability: 88, research_power: 16 },
  { name: "Luxembourg",        tag: "LUX", color: "#EF3340", tier: 2, ideology_id: "liberal_democracy",  capital: "Luxembourg City",  region: "Western Europe",  population: 660_000,    treasury: 8000,  manpower_pool: 22000,  stability: 85, research_power: 18 },
  { name: "Malta",             tag: "MLT", color: "#CF142B", tier: 2, ideology_id: "liberal_democracy",  capital: "Valletta",         region: "Mediterranean",   population: 520_000,    treasury: 5000,  manpower_pool: 18000,  stability: 80, research_power: 14 },
  { name: "Cyprus",            tag: "CYP", color: "#4E5B31", tier: 2, ideology_id: "liberal_democracy",  capital: "Nicosia",          region: "Mediterranean",   population: 1_200_000,  treasury: 5000,  manpower_pool: 40000,  stability: 65, research_power: 12 },
  { name: "Jordan",            tag: "JOR", color: "#007A3D", tier: 2, ideology_id: "monarchy",            capital: "Amman",            region: "Middle East",     population: 10_200_000, treasury: 4000,  manpower_pool: 300000, stability: 60, research_power: 9  },
  { name: "Lebanon",           tag: "LBN", color: "#00A650", tier: 2, ideology_id: "liberal_democracy",  capital: "Beirut",           region: "Middle East",     population: 6_800_000,  treasury: 2000,  manpower_pool: 200000, stability: 28, research_power: 8  },
  { name: "Syria",             tag: "SYR", color: "#007A3D", tier: 2, ideology_id: "military_junta",     capital: "Damascus",         region: "Middle East",     population: 21_000_000, treasury: 2000,  manpower_pool: 600000, stability: 25, research_power: 6  },
  { name: "Yemen",             tag: "YEM", color: "#CE1126", tier: 2, ideology_id: "liberal_democracy",  capital: "Sana'a",           region: "Middle East",     population: 34_000_000, treasury: 1000,  manpower_pool: 700000, stability: 18, research_power: 4  },
  { name: "Oman",              tag: "OMN", color: "#DB161B", tier: 2, ideology_id: "monarchy",            capital: "Muscat",           region: "Middle East",     population: 4_500_000,  treasury: 12000, manpower_pool: 150000, stability: 68, research_power: 10 },
  { name: "Kuwait",            tag: "KWT", color: "#007A3D", tier: 2, ideology_id: "monarchy",            capital: "Kuwait City",      region: "Middle East",     population: 4_200_000,  treasury: 20000, manpower_pool: 100000, stability: 70, research_power: 11 },
  { name: "Qatar",             tag: "QAT", color: "#8D1B3D", tier: 2, ideology_id: "monarchy",            capital: "Doha",             region: "Middle East",     population: 2_900_000,  treasury: 25000, manpower_pool: 80000,  stability: 72, research_power: 13 },
  { name: "Bahrain",           tag: "BHR", color: "#CE1126", tier: 2, ideology_id: "monarchy",            capital: "Manama",           region: "Middle East",     population: 1_500_000,  treasury: 8000,  manpower_pool: 40000,  stability: 60, research_power: 10 },
  { name: "Afghanistan",       tag: "AFG", color: "#000000", tier: 2, ideology_id: "theocracy",           capital: "Kabul",            region: "Central Asia",    population: 40_000_000, treasury: 1000,  manpower_pool: 1000000, stability: 20, research_power: 3  },
  { name: "Turkmenistan",      tag: "TKM", color: "#1FAD56", tier: 2, ideology_id: "communism",           capital: "Ashgabat",         region: "Central Asia",    population: 6_100_000,  treasury: 5000,  manpower_pool: 180000, stability: 55, research_power: 6  },
  { name: "Kyrgyzstan",        tag: "KGZ", color: "#E8112D", tier: 2, ideology_id: "liberal_democracy",  capital: "Bishkek",          region: "Central Asia",    population: 6_800_000,  treasury: 2000,  manpower_pool: 180000, stability: 50, research_power: 6  },
  { name: "Tajikistan",        tag: "TJK", color: "#CC0000", tier: 2, ideology_id: "liberal_democracy",  capital: "Dushanbe",         region: "Central Asia",    population: 10_000_000, treasury: 1500,  manpower_pool: 250000, stability: 48, research_power: 5  },
  { name: "Mongolia",          tag: "MNG", color: "#C4272F", tier: 2, ideology_id: "liberal_democracy",  capital: "Ulaanbaatar",      region: "East Asia",       population: 3_400_000,  treasury: 3000,  manpower_pool: 100000, stability: 58, research_power: 8  },
  { name: "Cambodia",          tag: "KHM", color: "#032EA1", tier: 2, ideology_id: "liberal_democracy",  capital: "Phnom Penh",       region: "Southeast Asia",  population: 17_000_000, treasury: 2500,  manpower_pool: 350000, stability: 55, research_power: 6  },
  { name: "Laos",              tag: "LAO", color: "#CE1126", tier: 2, ideology_id: "communism",           capital: "Vientiane",        region: "Southeast Asia",  population: 7_500_000,  treasury: 1800,  manpower_pool: 180000, stability: 60, research_power: 5  },
  { name: "Timor-Leste",       tag: "TLS", color: "#DC241F", tier: 2, ideology_id: "liberal_democracy",  capital: "Dili",             region: "Southeast Asia",  population: 1_300_000,  treasury: 2000,  manpower_pool: 35000,  stability: 52, research_power: 4  },
  { name: "Papua New Guinea",  tag: "PNG", color: "#000000", tier: 2, ideology_id: "liberal_democracy",  capital: "Port Moresby",     region: "Oceania",         population: 10_000_000, treasury: 2500,  manpower_pool: 200000, stability: 45, research_power: 4  },
  { name: "Ecuador",           tag: "ECU", color: "#FFD100", tier: 2, ideology_id: "liberal_democracy",  capital: "Quito",            region: "South America",   population: 18_000_000, treasury: 5000,  manpower_pool: 400000, stability: 50, research_power: 8  },
  { name: "Bolivia",           tag: "BOL", color: "#D52B1E", tier: 2, ideology_id: "liberal_democracy",  capital: "Sucre",            region: "South America",   population: 12_000_000, treasury: 3500,  manpower_pool: 280000, stability: 48, research_power: 6  },
  { name: "Paraguay",          tag: "PRY", color: "#D52B1E", tier: 2, ideology_id: "liberal_democracy",  capital: "Asunción",         region: "South America",   population: 7_400_000,  treasury: 2500,  manpower_pool: 180000, stability: 52, research_power: 6  },
  { name: "Uruguay",           tag: "URY", color: "#FFFFFF", tier: 2, ideology_id: "liberal_democracy",  capital: "Montevideo",       region: "South America",   population: 3_500_000,  treasury: 5000,  manpower_pool: 80000,  stability: 72, research_power: 10 },
  { name: "Panama",            tag: "PAN", color: "#FFFFFF", tier: 2, ideology_id: "liberal_democracy",  capital: "Panama City",      region: "Central America", population: 4_400_000,  treasury: 4000,  manpower_pool: 100000, stability: 62, research_power: 8  },
  { name: "Costa Rica",        tag: "CRI", color: "#002B7F", tier: 2, ideology_id: "liberal_democracy",  capital: "San José",         region: "Central America", population: 5_200_000,  treasury: 4500,  manpower_pool: 110000, stability: 72, research_power: 9  },
  { name: "Guatemala",         tag: "GTM", color: "#4997D0", tier: 2, ideology_id: "liberal_democracy",  capital: "Guatemala City",   region: "Central America", population: 18_000_000, treasury: 3000,  manpower_pool: 400000, stability: 48, research_power: 6  },
  { name: "Honduras",          tag: "HND", color: "#0073CF", tier: 2, ideology_id: "liberal_democracy",  capital: "Tegucigalpa",      region: "Central America", population: 10_000_000, treasury: 2000,  manpower_pool: 220000, stability: 42, research_power: 5  },
  { name: "El Salvador",       tag: "SLV", color: "#0F47AF", tier: 2, ideology_id: "liberal_democracy",  capital: "San Salvador",     region: "Central America", population: 6_500_000,  treasury: 2500,  manpower_pool: 140000, stability: 45, research_power: 5  },
  { name: "Nicaragua",         tag: "NIC", color: "#FFFFFF", tier: 2, ideology_id: "communism",           capital: "Managua",          region: "Central America", population: 6_700_000,  treasury: 1500,  manpower_pool: 150000, stability: 45, research_power: 5  },
  { name: "Dominican Republic",tag: "DOM", color: "#002D62", tier: 2, ideology_id: "liberal_democracy",  capital: "Santo Domingo",    region: "Caribbean",       population: 11_000_000, treasury: 4000,  manpower_pool: 250000, stability: 55, research_power: 7  },
  { name: "Haiti",             tag: "HTI", color: "#00209F", tier: 2, ideology_id: "liberal_democracy",  capital: "Port-au-Prince",   region: "Caribbean",       population: 11_500_000, treasury: 500,   manpower_pool: 250000, stability: 20, research_power: 3  },
  { name: "Jamaica",           tag: "JAM", color: "#000000", tier: 2, ideology_id: "liberal_democracy",  capital: "Kingston",         region: "Caribbean",       population: 3_000_000,  treasury: 2500,  manpower_pool: 60000,  stability: 58, research_power: 7  },
  { name: "Trinidad and Tobago", tag: "TTO", color: "#CE1126", tier: 2, ideology_id: "liberal_democracy", capital: "Port of Spain",   region: "Caribbean",       population: 1_400_000,  treasury: 4000,  manpower_pool: 30000,  stability: 65, research_power: 8  },
  { name: "Guyana",            tag: "GUY", color: "#009E60", tier: 2, ideology_id: "liberal_democracy",  capital: "Georgetown",       region: "South America",   population: 800_000,    treasury: 3000,  manpower_pool: 20000,  stability: 60, research_power: 6  },
  { name: "Suriname",          tag: "SUR", color: "#377E3F", tier: 2, ideology_id: "liberal_democracy",  capital: "Paramaribo",       region: "South America",   population: 620_000,    treasury: 2000,  manpower_pool: 15000,  stability: 58, research_power: 6  },
  { name: "Tunisia",           tag: "TUN", color: "#E70013", tier: 2, ideology_id: "liberal_democracy",  capital: "Tunis",            region: "North Africa",    population: 12_000_000, treasury: 4500,  manpower_pool: 280000, stability: 55, research_power: 8  },
  { name: "Libya",             tag: "LBY", color: "#000000", tier: 2, ideology_id: "military_junta",     capital: "Tripoli",          region: "North Africa",    population: 7_000_000,  treasury: 5000,  manpower_pool: 200000, stability: 28, research_power: 5  },
  { name: "Sudan",             tag: "SDN", color: "#D21034", tier: 2, ideology_id: "military_junta",     capital: "Khartoum",         region: "East Africa",     population: 46_000_000, treasury: 2000,  manpower_pool: 1000000, stability: 30, research_power: 4  },
  { name: "Somalia",           tag: "SOM", color: "#4189DD", tier: 2, ideology_id: "liberal_democracy",  capital: "Mogadishu",        region: "East Africa",     population: 17_000_000, treasury: 500,   manpower_pool: 400000, stability: 15, research_power: 2  },
  { name: "Uganda",            tag: "UGA", color: "#FCDC04", tier: 2, ideology_id: "liberal_democracy",  capital: "Kampala",          region: "East Africa",     population: 48_000_000, treasury: 2000,  manpower_pool: 900000, stability: 45, research_power: 5  },
  { name: "Rwanda",            tag: "RWA", color: "#20603D", tier: 2, ideology_id: "liberal_democracy",  capital: "Kigali",           region: "East Africa",     population: 14_000_000, treasury: 2500,  manpower_pool: 280000, stability: 60, research_power: 6  },
  { name: "Zimbabwe",          tag: "ZWE", color: "#FFD200", tier: 2, ideology_id: "liberal_democracy",  capital: "Harare",           region: "Southern Africa", population: 16_000_000, treasury: 1000,  manpower_pool: 320000, stability: 38, research_power: 5  },
  { name: "Zambia",            tag: "ZMB", color: "#198A00", tier: 2, ideology_id: "liberal_democracy",  capital: "Lusaka",           region: "Southern Africa", population: 20_000_000, treasury: 2500,  manpower_pool: 400000, stability: 50, research_power: 5  },
  { name: "Botswana",          tag: "BWA", color: "#75AADB", tier: 2, ideology_id: "liberal_democracy",  capital: "Gaborone",         region: "Southern Africa", population: 2_600_000,  treasury: 4000,  manpower_pool: 60000,  stability: 70, research_power: 8  },
  { name: "Namibia",           tag: "NAM", color: "#009A44", tier: 2, ideology_id: "liberal_democracy",  capital: "Windhoek",         region: "Southern Africa", population: 2_600_000,  treasury: 3500,  manpower_pool: 60000,  stability: 65, research_power: 7  },
  { name: "Senegal",           tag: "SEN", color: "#00853F", tier: 2, ideology_id: "liberal_democracy",  capital: "Dakar",            region: "West Africa",     population: 17_000_000, treasury: 2500,  manpower_pool: 350000, stability: 60, research_power: 6  },
  { name: "Ivory Coast",       tag: "CIV", color: "#F77F00", tier: 2, ideology_id: "liberal_democracy",  capital: "Yamoussoukro",     region: "West Africa",     population: 27_000_000, treasury: 3500,  manpower_pool: 550000, stability: 55, research_power: 6  },
  { name: "Mali",              tag: "MLI", color: "#14B53A", tier: 2, ideology_id: "military_junta",     capital: "Bamako",           region: "West Africa",     population: 22_000_000, treasury: 1500,  manpower_pool: 450000, stability: 30, research_power: 3  },
  { name: "Burkina Faso",      tag: "BFA", color: "#EF2B2D", tier: 2, ideology_id: "military_junta",     capital: "Ouagadougou",      region: "West Africa",     population: 22_000_000, treasury: 1000,  manpower_pool: 450000, stability: 30, research_power: 3  },
  { name: "Guinea",            tag: "GIN", color: "#CE1126", tier: 2, ideology_id: "military_junta",     capital: "Conakry",          region: "West Africa",     population: 13_000_000, treasury: 1500,  manpower_pool: 280000, stability: 32, research_power: 3  },
  { name: "Cameroon",          tag: "CMR", color: "#007A5E", tier: 2, ideology_id: "liberal_democracy",  capital: "Yaoundé",          region: "Central Africa",  population: 27_000_000, treasury: 3000,  manpower_pool: 550000, stability: 50, research_power: 5  },
  { name: "Gabon",             tag: "GAB", color: "#009E60", tier: 2, ideology_id: "liberal_democracy",  capital: "Libreville",       region: "Central Africa",  population: 2_300_000,  treasury: 4000,  manpower_pool: 55000,  stability: 55, research_power: 7  },
  { name: "Chad",              tag: "TCD", color: "#002664", tier: 2, ideology_id: "military_junta",     capital: "N'Djamena",        region: "Central Africa",  population: 18_000_000, treasury: 1000,  manpower_pool: 400000, stability: 28, research_power: 3  },
  { name: "Niger",             tag: "NER", color: "#E05206", tier: 2, ideology_id: "liberal_democracy",  capital: "Niamey",           region: "West Africa",     population: 25_000_000, treasury: 800,   manpower_pool: 500000, stability: 30, research_power: 3  },
  { name: "Togo",              tag: "TGO", color: "#006A4E", tier: 2, ideology_id: "liberal_democracy",  capital: "Lomé",             region: "West Africa",     population: 8_500_000,  treasury: 1200,  manpower_pool: 180000, stability: 48, research_power: 4  },
  { name: "Benin",             tag: "BEN", color: "#008751", tier: 2, ideology_id: "liberal_democracy",  capital: "Porto-Novo",       region: "West Africa",     population: 13_000_000, treasury: 1500,  manpower_pool: 280000, stability: 52, research_power: 4  },
  { name: "Mauritania",        tag: "MRT", color: "#006233", tier: 2, ideology_id: "military_junta",     capital: "Nouakchott",       region: "West Africa",     population: 4_600_000,  treasury: 1500,  manpower_pool: 100000, stability: 45, research_power: 4  },
  { name: "Sierra Leone",      tag: "SLE", color: "#1EB53A", tier: 2, ideology_id: "liberal_democracy",  capital: "Freetown",         region: "West Africa",     population: 8_200_000,  treasury: 1000,  manpower_pool: 170000, stability: 45, research_power: 4  },
  { name: "Liberia",           tag: "LBR", color: "#BF0A30", tier: 2, ideology_id: "liberal_democracy",  capital: "Monrovia",         region: "West Africa",     population: 5_300_000,  treasury: 800,   manpower_pool: 110000, stability: 42, research_power: 3  },
  { name: "Guinea-Bissau",     tag: "GNB", color: "#CE1126", tier: 2, ideology_id: "military_junta",     capital: "Bissau",           region: "West Africa",     population: 2_100_000,  treasury: 600,   manpower_pool: 45000,  stability: 35, research_power: 3  },
  { name: "Gambia",            tag: "GMB", color: "#3A7728", tier: 2, ideology_id: "liberal_democracy",  capital: "Banjul",           region: "West Africa",     population: 2_700_000,  treasury: 800,   manpower_pool: 55000,  stability: 48, research_power: 3  },
  { name: "Cabo Verde",        tag: "CPV", color: "#003893", tier: 2, ideology_id: "liberal_democracy",  capital: "Praia",            region: "West Africa",     population: 560_000,    treasury: 1500,  manpower_pool: 12000,  stability: 72, research_power: 7  },
  { name: "Central African Republic", tag: "CAF", color: "#003082", tier: 2, ideology_id: "military_junta", capital: "Bangui",       region: "Central Africa",  population: 5_400_000,  treasury: 500,   manpower_pool: 110000, stability: 18, research_power: 2  },
  { name: "South Sudan",       tag: "SSD", color: "#078930", tier: 2, ideology_id: "military_junta",     capital: "Juba",             region: "East Africa",     population: 11_000_000, treasury: 800,   manpower_pool: 250000, stability: 20, research_power: 2  },
  { name: "Eritrea",           tag: "ERI", color: "#4189DD", tier: 2, ideology_id: "military_junta",     capital: "Asmara",           region: "East Africa",     population: 3_500_000,  treasury: 800,   manpower_pool: 200000, stability: 40, research_power: 3  },
  { name: "Djibouti",          tag: "DJI", color: "#6AB2E7", tier: 2, ideology_id: "liberal_democracy",  capital: "Djibouti City",    region: "East Africa",     population: 1_000_000,  treasury: 1500,  manpower_pool: 22000,  stability: 50, research_power: 4  },
  { name: "Comoros",           tag: "COM", color: "#3A75C4", tier: 2, ideology_id: "liberal_democracy",  capital: "Moroni",           region: "East Africa",     population: 870_000,    treasury: 500,   manpower_pool: 18000,  stability: 40, research_power: 3  },
  { name: "Madagascar",        tag: "MDG", color: "#FC3D32", tier: 2, ideology_id: "liberal_democracy",  capital: "Antananarivo",     region: "Southern Africa", population: 28_000_000, treasury: 1000,  manpower_pool: 560000, stability: 42, research_power: 4  },
  { name: "Malawi",            tag: "MWI", color: "#000000", tier: 2, ideology_id: "liberal_democracy",  capital: "Lilongwe",         region: "Southern Africa", population: 20_000_000, treasury: 800,   manpower_pool: 400000, stability: 48, research_power: 4  },
  { name: "Lesotho",           tag: "LSO", color: "#009A44", tier: 2, ideology_id: "monarchy",            capital: "Maseru",           region: "Southern Africa", population: 2_200_000,  treasury: 800,   manpower_pool: 45000,  stability: 48, research_power: 4  },
  { name: "Swaziland",         tag: "SWZ", color: "#3E5EB9", tier: 2, ideology_id: "monarchy",            capital: "Mbabane",          region: "Southern Africa", population: 1_200_000,  treasury: 1000,  manpower_pool: 25000,  stability: 52, research_power: 4  },
  { name: "Mauritius",         tag: "MUS", color: "#EA2839", tier: 2, ideology_id: "liberal_democracy",  capital: "Port Louis",       region: "Southern Africa", population: 1_300_000,  treasury: 3500,  manpower_pool: 30000,  stability: 75, research_power: 10 },
  { name: "Seychelles",        tag: "SYC", color: "#003F87", tier: 2, ideology_id: "liberal_democracy",  capital: "Victoria",         region: "East Africa",     population: 100_000,    treasury: 2000,  manpower_pool: 5000,   stability: 75, research_power: 10 },
  { name: "Equatorial Guinea", tag: "GNQ", color: "#3E9A00", tier: 2, ideology_id: "liberal_democracy",  capital: "Malabo",           region: "Central Africa",  population: 1_500_000,  treasury: 3000,  manpower_pool: 32000,  stability: 45, research_power: 5  },
  { name: "Sao Tome and Principe", tag: "STP", color: "#12AD2B", tier: 2, ideology_id: "liberal_democracy", capital: "São Tomé",     region: "Central Africa",  population: 230_000,    treasury: 500,   manpower_pool: 5000,   stability: 60, research_power: 4  },
  { name: "Burundi",           tag: "BDI", color: "#CE1126", tier: 2, ideology_id: "liberal_democracy",  capital: "Gitega",           region: "East Africa",     population: 13_000_000, treasury: 500,   manpower_pool: 260000, stability: 30, research_power: 3  },

  // ============================================================
  // TIER 1 — MINOR STATES
  // ============================================================
  { name: "Singapore",         tag: "SGP", color: "#EF3340", tier: 1, ideology_id: "liberal_democracy",  capital: "Singapore",        region: "Southeast Asia",  population: 5_900_000,  treasury: 20000, manpower_pool: 300000, stability: 82, research_power: 22 },
  { name: "Brunei",            tag: "BRN", color: "#F7E017", tier: 1, ideology_id: "monarchy",            capital: "Bandar Seri Begawan", region: "Southeast Asia", population: 450_000, treasury: 6000,  manpower_pool: 12000,  stability: 72, research_power: 10 },
  { name: "Maldives",          tag: "MDV", color: "#D21034", tier: 1, ideology_id: "liberal_democracy",  capital: "Malé",             region: "South Asia",      population: 540_000,    treasury: 1500,  manpower_pool: 12000,  stability: 65, research_power: 7  },
  { name: "Bhutan",            tag: "BTN", color: "#FF8000", tier: 1, ideology_id: "monarchy",            capital: "Thimphu",          region: "South Asia",      population: 780_000,    treasury: 1500,  manpower_pool: 18000,  stability: 75, research_power: 7  },
  { name: "San Marino",        tag: "SMR", color: "#5EB6E4", tier: 1, ideology_id: "liberal_democracy",  capital: "San Marino",       region: "Western Europe",  population: 34_000,     treasury: 2000,  manpower_pool: 2000,   stability: 90, research_power: 12 },
  { name: "Liechtenstein",     tag: "LIE", color: "#002B7F", tier: 1, ideology_id: "monarchy",            capital: "Vaduz",            region: "Western Europe",  population: 39_000,     treasury: 3000,  manpower_pool: 2000,   stability: 92, research_power: 14 },
  { name: "Monaco",            tag: "MCO", color: "#CE1126", tier: 1, ideology_id: "monarchy",            capital: "Monaco",           region: "Western Europe",  population: 40_000,     treasury: 5000,  manpower_pool: 2000,   stability: 92, research_power: 14 },
  { name: "Andorra",           tag: "AND", color: "#003DA5", tier: 1, ideology_id: "liberal_democracy",  capital: "Andorra la Vella", region: "Western Europe",  population: 78_000,     treasury: 2000,  manpower_pool: 3000,   stability: 88, research_power: 12 },
  { name: "Tonga",             tag: "TON", color: "#C10000", tier: 1, ideology_id: "monarchy",            capital: "Nukuʻalofa",       region: "Oceania",         population: 105_000,    treasury: 500,   manpower_pool: 5000,   stability: 65, research_power: 5  },
  { name: "Samoa",             tag: "WSM", color: "#CE1126", tier: 1, ideology_id: "liberal_democracy",  capital: "Apia",             region: "Oceania",         population: 220_000,    treasury: 700,   manpower_pool: 8000,   stability: 68, research_power: 5  },
  { name: "Fiji",              tag: "FJI", color: "#003F87", tier: 1, ideology_id: "liberal_democracy",  capital: "Suva",             region: "Oceania",         population: 930_000,    treasury: 1500,  manpower_pool: 22000,  stability: 60, research_power: 6  },
  { name: "Vanuatu",           tag: "VUT", color: "#009543", tier: 1, ideology_id: "liberal_democracy",  capital: "Port Vila",        region: "Oceania",         population: 320_000,    treasury: 500,   manpower_pool: 8000,   stability: 62, research_power: 4  },
  { name: "Solomon Islands",   tag: "SLB", color: "#0120B1", tier: 1, ideology_id: "liberal_democracy",  capital: "Honiara",          region: "Oceania",         population: 720_000,    treasury: 600,   manpower_pool: 15000,  stability: 55, research_power: 4  },
  { name: "Kiribati",          tag: "KIR", color: "#CE1126", tier: 1, ideology_id: "liberal_democracy",  capital: "South Tarawa",     region: "Oceania",         population: 120_000,    treasury: 400,   manpower_pool: 4000,   stability: 62, research_power: 3  },
  { name: "Nauru",             tag: "NRU", color: "#002B7F", tier: 1, ideology_id: "liberal_democracy",  capital: "Yaren",            region: "Oceania",         population: 10_800,     treasury: 500,   manpower_pool: 1000,   stability: 65, research_power: 4  },
  { name: "Tuvalu",            tag: "TUV", color: "#009FCA", tier: 1, ideology_id: "liberal_democracy",  capital: "Funafuti",         region: "Oceania",         population: 11_000,     treasury: 300,   manpower_pool: 1000,   stability: 65, research_power: 3  },
  { name: "Palau",             tag: "PLW", color: "#4AADD6", tier: 1, ideology_id: "liberal_democracy",  capital: "Ngerulmud",        region: "Oceania",         population: 18_000,     treasury: 600,   manpower_pool: 2000,   stability: 70, research_power: 5  },
  { name: "Micronesia",        tag: "FSM", color: "#75B2DD", tier: 1, ideology_id: "liberal_democracy",  capital: "Palikir",          region: "Oceania",         population: 115_000,    treasury: 500,   manpower_pool: 4000,   stability: 65, research_power: 4  },
  { name: "Marshall Islands",  tag: "MHL", color: "#003087", tier: 1, ideology_id: "liberal_democracy",  capital: "Majuro",           region: "Oceania",         population: 42_000,     treasury: 500,   manpower_pool: 2000,   stability: 65, research_power: 4  },
  { name: "Belize",            tag: "BLZ", color: "#003F87", tier: 1, ideology_id: "liberal_democracy",  capital: "Belmopan",         region: "Central America", population: 410_000,    treasury: 800,   manpower_pool: 10000,  stability: 60, research_power: 6  },
  { name: "Bahamas",           tag: "BHS", color: "#00778B", tier: 1, ideology_id: "liberal_democracy",  capital: "Nassau",           region: "Caribbean",       population: 400_000,    treasury: 2000,  manpower_pool: 9000,   stability: 70, research_power: 7  },
  { name: "Barbados",          tag: "BRB", color: "#00267F", tier: 1, ideology_id: "liberal_democracy",  capital: "Bridgetown",       region: "Caribbean",       population: 290_000,    treasury: 2000,  manpower_pool: 8000,   stability: 75, research_power: 8  },
  { name: "Grenada",           tag: "GRD", color: "#CE1126", tier: 1, ideology_id: "liberal_democracy",  capital: "St. George's",     region: "Caribbean",       population: 125_000,    treasury: 500,   manpower_pool: 4000,   stability: 70, research_power: 6  },
  { name: "Saint Lucia",       tag: "LCA", color: "#65CFFF", tier: 1, ideology_id: "liberal_democracy",  capital: "Castries",         region: "Caribbean",       population: 185_000,    treasury: 600,   manpower_pool: 5000,   stability: 70, research_power: 6  },
  { name: "Saint Vincent",     tag: "VCT", color: "#009E60", tier: 1, ideology_id: "liberal_democracy",  capital: "Kingstown",        region: "Caribbean",       population: 110_000,    treasury: 400,   manpower_pool: 3500,   stability: 68, research_power: 6  },
  { name: "Antigua and Barbuda", tag: "ATG", color: "#CE1126", tier: 1, ideology_id: "liberal_democracy", capital: "St. John's",     region: "Caribbean",       population: 100_000,    treasury: 500,   manpower_pool: 3000,   stability: 72, research_power: 6  },
  { name: "Saint Kitts and Nevis", tag: "KNA", color: "#009E60", tier: 1, ideology_id: "liberal_democracy", capital: "Basseterre",   region: "Caribbean",       population: 53_000,     treasury: 500,   manpower_pool: 2000,   stability: 72, research_power: 6  },
  { name: "Dominica",          tag: "DMA", color: "#006B3F", tier: 1, ideology_id: "liberal_democracy",  capital: "Roseau",           region: "Caribbean",       population: 72_000,     treasury: 400,   manpower_pool: 2500,   stability: 70, research_power: 5  },
  { name: "São Tomé",          tag: "STP", color: "#12AD2B", tier: 1, ideology_id: "liberal_democracy",  capital: "São Tomé",         region: "Central Africa",  population: 230_000,    treasury: 500,   manpower_pool: 5000,   stability: 60, research_power: 4  },

  // ============================================================
  // FORMABLE NATIONS (not available at start; unlocked by conquest)
  // ============================================================
  {
    name: "Roman Empire",      tag: "ROM", color: "#8B0000", tier: 6,
    ideology_id: "monarchy",   capital: "Rome",             region: "Mediterranean",
    population: 0, treasury: 0, manpower_pool: 0, stability: 70, research_power: 15,
    formable: true,
    form_conditions: "Control: Italy, France, Spain, North Africa, Greece, Turkey, Egypt",
  },
  {
    name: "Soviet Union",      tag: "SOV", color: "#CC0000", tier: 6,
    ideology_id: "communism",  capital: "Moscow",           region: "Eastern Europe",
    population: 0, treasury: 0, manpower_pool: 0, stability: 60, research_power: 18,
    formable: true,
    form_conditions: "Control: Russia, Ukraine, Belarus, Kazakhstan, Uzbekistan, Kyrgyzstan, Tajikistan, Turkmenistan, Armenia, Azerbaijan, Georgia",
  },
  {
    name: "United States of Europe", tag: "USE", color: "#003399", tier: 6,
    ideology_id: "liberal_democracy", capital: "Brussels",  region: "Western Europe",
    population: 0, treasury: 0, manpower_pool: 0, stability: 80, research_power: 25,
    formable: true,
    form_conditions: "Control: Germany, France, Italy, Spain, Poland, Netherlands, Belgium plus 5 other European nations as allies",
  },
  {
    name: "Pan-African Union",  tag: "PAU", color: "#078930", tier: 6,
    ideology_id: "liberal_democracy", capital: "Addis Ababa", region: "Africa",
    population: 0, treasury: 0, manpower_pool: 0, stability: 55, research_power: 12,
    formable: true,
    form_conditions: "Control or ally with: Nigeria, Ethiopia, South Africa, Egypt, DRC, Kenya, Tanzania, Algeria",
  },
  {
    name: "Greater Arabia",     tag: "ARB", color: "#007A3D", tier: 5,
    ideology_id: "theocracy",   capital: "Mecca",            region: "Middle East",
    population: 0, treasury: 0, manpower_pool: 0, stability: 62, research_power: 12,
    formable: true,
    form_conditions: "Control: Saudi Arabia, Iraq, Syria, Jordan, Yemen, Oman, UAE, Kuwait, Qatar, Bahrain",
  },
  {
    name: "Restored Ottoman Empire", tag: "OTT", color: "#E30A17", tier: 5,
    ideology_id: "monarchy",    capital: "Istanbul",         region: "Middle East",
    population: 0, treasury: 0, manpower_pool: 0, stability: 58, research_power: 13,
    formable: true,
    form_conditions: "Control as Turkey: Iraq, Syria, Egypt, Libya, Greece, Bulgaria, Romania",
  },
  {
    name: "Greater China",      tag: "GCH", color: "#DE2910", tier: 6,
    ideology_id: "communism",   capital: "Beijing",          region: "East Asia",
    population: 0, treasury: 0, manpower_pool: 0, stability: 60, research_power: 20,
    formable: true,
    form_conditions: "Control: China, Taiwan, Mongolia, North Korea, plus puppet Vietnam and Laos",
  },
  {
    name: "South American Confederation", tag: "SAC", color: "#FCD116", tier: 5,
    ideology_id: "liberal_democracy", capital: "Brasília",   region: "South America",
    population: 0, treasury: 0, manpower_pool: 0, stability: 60, research_power: 14,
    formable: true,
    form_conditions: "Control: Brazil, Argentina, Chile, Colombia, Peru, Venezuela",
  },
];

// ============================================================
// HELPERS
// ============================================================
export const NATION_BY_TAG: Record<string, NationDef> = Object.fromEntries(
  NATION_DEFINITIONS.map((n) => [n.tag, n])
);

export const PLAYABLE_NATIONS = NATION_DEFINITIONS.filter((n) => !n.formable);
export const FORMABLE_NATIONS = NATION_DEFINITIONS.filter((n) => n.formable);

export const NATIONS_BY_TIER: Record<number, NationDef[]> = {
  1: PLAYABLE_NATIONS.filter((n) => n.tier === 1),
  2: PLAYABLE_NATIONS.filter((n) => n.tier === 2),
  3: PLAYABLE_NATIONS.filter((n) => n.tier === 3),
  4: PLAYABLE_NATIONS.filter((n) => n.tier === 4),
  5: PLAYABLE_NATIONS.filter((n) => n.tier === 5),
  6: PLAYABLE_NATIONS.filter((n) => n.tier === 6),
};

export const NATIONS_BY_REGION: Record<string, NationDef[]> = PLAYABLE_NATIONS.reduce(
  (acc, n) => {
    if (!acc[n.region]) acc[n.region] = [];
    acc[n.region].push(n);
    return acc;
  },
  {} as Record<string, NationDef[]>
);
