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

  // 5. Seed provinces from GeoJSON
  try {
    const geoPath = join(process.cwd(), "public", "maps", "world.geojson");
    const geoRaw = readFileSync(geoPath, "utf-8");
    const geo = JSON.parse(geoRaw);

    const provinceRows = geo.features.map((feature: any) => {
      const props = feature.properties ?? {};
      const tag = props.ADM0_A3 ?? props.ISO_A3 ?? "UNK";
      const name = props.NAME ?? props.ADMIN ?? tag;
      const centroid = getCentroid(feature.geometry);
      const isOwned = tag === nationDef.tag;

      return {
        session_id: sessionId,
        province_key: tag,
        name,
        owner_nation_id: isOwned ? nation.id : null,
        controller_nation_id: isOwned ? nation.id : null,
        terrain_type: "plains",
        is_coastal: false,
        is_capital: false,
        population: 0,
        infrastructure: 1,
        supply_value: 1,
        victory_points: isOwned ? 10 : 0,
        resource_deposits: {},
        geometry: {},
        center_x: centroid[0],
        center_y: centroid[1],
      };
    });

    const { error: provError } = await admin.from("provinces").insert(provinceRows);
    if (provError) console.error("Province seeding error:", provError);
  } catch (err) {
    console.error("Failed to seed provinces:", err);
  }

  // 6. Initialize resource stockpiles
  const resourceTypes = [
    "iron", "titanium", "copper", "gold", "phosphate", "tungsten",
    "uranium", "oil", "aluminum", "chromium", "diamond",
    "steel", "motor_parts", "electronics", "fertilizer",
    "enriched_uranium", "consumer_goods", "aircraft_parts",
  ];

  const tierMult = nationDef.tier;
  const stockpileRows = resourceTypes.map((rt) => ({
    session_id: sessionId,
    nation_id: nation.id,
    resource_type: rt,
    stockpile: tierMult * 100,
    production_rate: tierMult * 5,
    consumption_rate: 0,
    trade_balance: 0,
    max_stockpile: 10000,
  }));

  await admin.from("resource_stockpiles").insert(stockpileRows).then(({ error }) => {
    if (error) console.error("Resource stockpile error:", error);
  });

  // 7. Initialize tech tree
  const techRows = ALL_TECH.map((tech) => ({
    session_id: sessionId,
    nation_id: nation.id,
    tech_id: tech.id,
    tree_id: tech.tree_id,
    tier: tech.tier,
    status: tech.tier === 1 && tech.prerequisites.length === 0 ? "available" : "locked",
    progress: 0,
    research_cost: tech.cost,
  }));

  await admin.from("tech_research").insert(techRows).then(({ error }) => {
    if (error) console.error("Tech research error:", error);
  });

  // 8. Create tick lock
  await admin.from("tick_locks").insert({
    session_id: sessionId,
    is_locked: false,
  }).then(({ error }) => {
    if (error) console.error("Tick lock error:", error);
  });

  redirect(`/game/${sessionId}`);
}

// ── Helpers ──────────────────────────────────────────────

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
