"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NATION_DEFINITIONS } from "@/data/nations";
import { ALL_TECH } from "@/data/tech-trees";
import { redirect } from "next/navigation";
import { readFileSync } from "fs";
import { join } from "path";

interface CreateSessionInput {
  name: string;
  maxPlayers: number;
  nationTag: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCentroid(geometry: any): [number, number] {
  const coords = extractCoords(geometry);
  if (coords.length === 0) return [0, 0];
  let sumX = 0, sumY = 0;
  for (const [x, y] of coords) { sumX += x; sumY += y; }
  return [sumX / coords.length, sumY / coords.length];
}

function extractCoords(geometry: any): [number, number][] {
  if (geometry.type === "Polygon") return geometry.coordinates[0];
  if (geometry.type === "MultiPolygon") {
    let largest = geometry.coordinates[0][0];
    for (const poly of geometry.coordinates) {
      if (poly[0].length > largest.length) largest = poly[0];
    }
    return largest;
  }
  return [];
}

function deriveBiome(lat: number, lon: number, adm1Code: string, admin: string): string {
  const n = (adm1Code + admin).toLowerCase();

  // Polar
  if (Math.abs(lat) > 66) return "arctic";
  if (adm1Code.startsWith("ATA")) return "ice_sheet";

  // Deserts
  const desertCountries = ["SAU","YEM","OMN","ARE","KWT","QAT","BHR","DZA","LBY","EGY","MLI","NER","TCD","SDN","SOM","NAM","BWA"];
  if (desertCountries.some(c => adm1Code.startsWith(c))) return "hot_desert";
  if (adm1Code.startsWith("AUS") && lat < -20 && lon > 115) return "hot_desert";
  if (adm1Code.startsWith("MNG") || adm1Code.startsWith("KAZ") || adm1Code.startsWith("UZB") || adm1Code.startsWith("TKM")) return "cold_desert";

  // Mountains
  if (adm1Code.startsWith("CHE") || adm1Code.startsWith("AUT") || adm1Code.startsWith("NPL") || adm1Code.startsWith("BTN")) return "mountain";
  if (["mountain","alpine","himalay","andes","cordillera","tibet","xinjiang","qinghai","caucasus"].some(m => n.includes(m))) return "mountain";

  // Rainforest
  const rainforestCountries = ["COD","COG","GAB","CMR","IDN","MYS","PNG","MMR"];
  if (rainforestCountries.some(c => adm1Code.startsWith(c)) && Math.abs(lat) < 15) return "rainforest";
  if (adm1Code.startsWith("BRA") && lat > -15 && lat < 5) return "rainforest";

  // Taiga
  if ((adm1Code.startsWith("RUS") || adm1Code.startsWith("CAN")) && lat > 55) return "taiga";
  if (adm1Code.startsWith("SWE") || adm1Code.startsWith("NOR") || adm1Code.startsWith("FIN")) return "taiga";

  // Tundra
  if (adm1Code.startsWith("GRL") || Math.abs(lat) > 62) return "tundra";

  // Wetland
  if (adm1Code.startsWith("BGD") || ["delta","swamp","marsh","bayou","everglades","pantanal"].some(w => n.includes(w))) return "wetland";

  // Coastal islands
  if (["GBR","IRL","JPN","NZL","CUB","HTI","DOM","JAM","MDG","LKA","SGP","PHL"].some(c => adm1Code.startsWith(c))) return "coastal";

  // Savanna
  const savannaCountries = ["ETH","KEN","TZA","UGA","ZMB","ZWE","MOZ","NGA","BEN","TGO","BFA","SEN","CAF","SSD"];
  if (savannaCountries.some(c => adm1Code.startsWith(c))) return "savanna";

  // Temperate forest
  const forestCountries = ["DEU","FRA","POL","CZE","SVK","HUN","ROU","BGR","UKR","BLR","LTU","LVA","EST"];
  if (forestCountries.some(c => adm1Code.startsWith(c))) return "forest";

  // Default by latitude
  if (Math.abs(lat) > 50) return "forest";
  if (Math.abs(lat) > 35) return "plains";
  if (Math.abs(lat) > 20) return "grassland";
  return "savanna";
}

// ── Main action ───────────────────────────────────────────────────────────────

export async function createSession(input: CreateSessionInput) {
  const supabase = await createClient();
  const admin = createAdminClient();

  // 1. Authenticate
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("You must be logged in.");

  // 2. Validate nation selection
  const nationDef = NATION_DEFINITIONS.find((n) => n.tag === input.nationTag);
  if (!nationDef) throw new Error("Invalid nation selection.");

  // 3. Create game session
  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .insert({
      name: input.name,
      host_user_id: user.id,
      status: "active",
      max_players: input.maxPlayers,
      current_tick: 0,
      game_date: "2025-01-01",
      speed_multiplier: 1.0,
      map_id: "world_default",
      settings: {},
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    throw new Error(sessionError?.message || "Failed to create session.");
  }

  const sessionId = session.id;

  // 4. Create player's nation
  const { data: nation, error: nationError } = await admin
    .from("nations")
    .insert({
      session_id: sessionId,
      user_id: user.id,
      name: nationDef.name,
      tag: nationDef.tag,
      color: nationDef.color,
      is_ai: false,
      population: nationDef.population,
      manpower_pool: nationDef.manpower_pool,
      stability: nationDef.stability,
      corruption: 10,
      war_exhaustion: 0,
      political_power: 50,
      research_power: nationDef.research_power,
      treasury: nationDef.treasury,
      taxation_setting: "normal",
      conscription_law: "limited_conscript",
      factory_output_setting: "normal",
      ideology_id: nationDef.ideology_id,
      leader_name: null,
      leader_traits: [],
      victory_points: 0,
    })
    .select("id")
    .single();

  if (nationError || !nation) {
    await admin.from("game_sessions").delete().eq("id", sessionId);
    throw new Error(nationError?.message || "Failed to create nation.");
  }

  // 5. Seed ADM1 provinces from world-adm1.geojson
  try {
    const geoPath  = join(process.cwd(), "public", "maps", "world-adm1.geojson");
    const geoRaw   = readFileSync(geoPath, "utf-8");
    const geo      = JSON.parse(geoRaw);

    // Load resource deposits
    let resourceDeposits: Record<string, [string, number][]> = {};
    try {
      const resPath = join(process.cwd(), "public", "data", "resource_deposits.json");
      resourceDeposits = JSON.parse(readFileSync(resPath, "utf-8"));
    } catch { /* optional */ }

    const provinceRows = geo.features.map((feature: any) => {
      const props     = feature.properties ?? {};
      const adm1Code  = (props.adm1_code ?? props.ADM1_CODE ?? "UNK").trim();
      const adm0Tag   = (props.adm0_a3 ?? props.ADM0_A3 ?? "").trim();
      const name      = props.name ?? props.NAME ?? adm1Code;
      const centroid  = getCentroid(feature.geometry);
      const lat       = parseFloat(props.latitude ?? centroid[1]) || 0;
      const lon       = parseFloat(props.longitude ?? centroid[0]) || 0;
      const biome     = deriveBiome(lat, lon, adm1Code, props.admin ?? "");
      const isOwned   = adm0Tag === nationDef.tag || adm0Tag === (nationDef as any).adm0Tag || adm1Code.startsWith(nationDef.tag);
      const deposits  = resourceDeposits[adm1Code] ?? [];

      return {
        session_id:             sessionId,
        province_key:           adm1Code,
        name,
        owner_nation_id:        isOwned ? nation.id : null,
        controller_nation_id:   isOwned ? nation.id : null,
        terrain_type:           biome,
        is_coastal:             biome === "coastal" || biome === "island",
        is_capital:             false,
        population:             0,
        infrastructure:         1,
        supply_value:           1,
        victory_points:         isOwned ? 5 : 0,
        resource_deposits:      Object.fromEntries(deposits),
        geometry:               {},
        center_x:               centroid[0],
        center_y:               centroid[1],
      };
    });

    // Insert in batches of 500 to avoid payload limits
    for (let i = 0; i < provinceRows.length; i += 500) {
      const batch = provinceRows.slice(i, i + 500);
      const { error: provError } = await admin.from("provinces").insert(batch);
      if (provError) console.error(`Province batch ${i} error:`, provError);
    }
  } catch (err) {
    console.error("Failed to seed provinces:", err);
  }

  // 6. Seed cities from cities.json (if present)
  try {
    const citiesPath = join(process.cwd(), "public", "data", "cities.json");
    const citiesRaw  = readFileSync(citiesPath, "utf-8");
    const citiesData: any[] = JSON.parse(citiesRaw);

    // Get the seeded province IDs for matching
    const { data: seededProvinces } = await admin
      .from("provinces")
      .select("id, province_key")
      .eq("session_id", sessionId);

    const provByKey: Record<string, string> = {};
    for (const p of seededProvinces ?? []) provByKey[p.province_key] = p.id;

    const cityRows = citiesData
      .filter((c: any) => c.province_key && provByKey[c.province_key])
      .map((c: any) => ({
        province_id:   provByKey[c.province_key],
        session_id:    sessionId,
        name:          c.name,
        city_type:     c.city_size ?? "town",
        population:    c.population ?? 0,
        development:   Math.min(10, Math.max(1, Math.floor((c.population ?? 0) / 500000) + 1)),
        manpower_gain: Math.floor((c.population ?? 0) * 0.002),
        tax_income:    Math.max(10, (c.population ?? 0) / 100000 * 15),
        lat:           c.lat,
        lng:           c.lng,
        is_capital:    c.is_capital ?? false,
        city_size:     c.city_size ?? "town",
        icon_type:     c.is_capital ? "diamond" : c.city_size === "megacity" ? "star" : c.city_size === "major_city" ? "square" : "dot",
        real_world_id: c.geonames_id ?? null,
      }));

    for (let i = 0; i < cityRows.length; i += 200) {
      const batch = cityRows.slice(i, i + 200);
      const { error } = await admin.from("cities").insert(batch);
      if (error) console.error(`City batch ${i} error:`, error);
    }
  } catch { /* cities.json not yet present — skip */ }

  // 7. Initialize resource stockpiles
  const resourceTypes = [
    "iron", "titanium", "copper", "gold", "phosphate", "tungsten",
    "uranium", "oil", "aluminum", "chromium", "diamond",
    "steel", "motor_parts", "electronics", "fertilizer",
    "enriched_uranium", "consumer_goods", "aircraft_parts",
  ];

  const tierMult = nationDef.tier;
  const stockpileRows = resourceTypes.map((rt) => ({
    session_id:       sessionId,
    nation_id:        nation.id,
    resource_type:    rt,
    stockpile:        tierMult * 100,
    production_rate:  tierMult * 5,
    consumption_rate: 0,
    trade_balance:    0,
    max_stockpile:    10000,
  }));

  await admin.from("resource_stockpiles").insert(stockpileRows).then(({ error }) => {
    if (error) console.error("Resource stockpile error:", error);
  });

  // 8. Initialize tech tree
  const techRows = ALL_TECH.map((tech) => ({
    session_id:    sessionId,
    nation_id:     nation.id,
    tech_id:       tech.id,
    tree_id:       tech.tree_id,
    tier:          tech.tier,
    status:        tech.tier === 1 && tech.prerequisites.length === 0 ? "available" : "locked",
    progress:      0,
    research_cost: tech.cost,
  }));

  await admin.from("tech_research").insert(techRows).then(({ error }) => {
    if (error) console.error("Tech research error:", error);
  });

  // 9. Create tick lock
  await admin.from("tick_locks").insert({ session_id: sessionId, is_locked: false }).then(({ error }) => {
    if (error) console.error("Tick lock error:", error);
  });

  redirect(`/game/${sessionId}`);
}
