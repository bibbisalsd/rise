"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NATION_DEFINITIONS } from "@/data/nations";
import { ALL_TECH } from "@/data/tech-trees";
import { redirect } from "next/navigation";

interface JoinSessionInput {
  sessionId: string;
  nationTag: string;
}

export async function joinSession(input: JoinSessionInput) {
  const supabase = await createClient();
  const admin = createAdminClient();

  // 1. Authenticate
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("You must be logged in.");

  // 2. Validate session
  const { data: session, error: sErr } = await supabase
    .from("game_sessions")
    .select("id, status, max_players")
    .eq("id", input.sessionId)
    .single();

  if (sErr || !session) throw new Error("Session not found.");
  if (session.status !== "active" && session.status !== "lobby") {
    throw new Error("Session is not accepting players.");
  }

  // 3. Check player count
  const { count } = await supabase
    .from("nations")
    .select("id", { count: "exact", head: true })
    .eq("session_id", input.sessionId);

  if ((count ?? 0) >= session.max_players) {
    throw new Error("Session is full.");
  }

  // 4. Check if user already in session
  const { data: existing } = await supabase
    .from("nations")
    .select("id")
    .eq("session_id", input.sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Already in session, just redirect
    redirect(`/game/${input.sessionId}`);
  }

  // 5. Validate nation selection
  const nationDef = NATION_DEFINITIONS.find((n) => n.tag === input.nationTag);
  if (!nationDef) throw new Error("Invalid nation selection.");

  // 6. Check if nation tag is already taken in this session
  const { data: takenNation } = await supabase
    .from("nations")
    .select("id")
    .eq("session_id", input.sessionId)
    .eq("tag", input.nationTag)
    .maybeSingle();

  if (takenNation) throw new Error(`${nationDef.name} is already taken.`);

  // 7. Create player's nation
  const { data: nation, error: nationError } = await admin
    .from("nations")
    .insert({
      session_id: input.sessionId,
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
    throw new Error(nationError?.message || "Failed to create nation.");
  }

  // 8. Update province ownership for matching tags
  await admin
    .from("provinces")
    .update({
      owner_nation_id: nation.id,
      controller_nation_id: nation.id,
    })
    .eq("session_id", input.sessionId)
    .eq("province_key", nationDef.tag);

  // 9. Initialize resource stockpiles
  const resourceTypes = [
    "iron", "titanium", "copper", "gold", "phosphate", "tungsten",
    "uranium", "oil", "aluminum", "chromium", "diamond",
    "steel", "motor_parts", "electronics", "fertilizer",
    "enriched_uranium", "consumer_goods", "aircraft_parts",
  ];

  const tierMult = nationDef.tier;
  const stockpileRows = resourceTypes.map((rt) => ({
    session_id: input.sessionId,
    nation_id: nation.id,
    resource_type: rt,
    stockpile: tierMult * 100,
    production_rate: tierMult * 5,
    consumption_rate: 0,
    trade_balance: 0,
    max_stockpile: 10000,
  }));

  await admin.from("resource_stockpiles").insert(stockpileRows);

  // 10. Initialize tech tree
  const techRows = ALL_TECH.map((tech) => ({
    session_id: input.sessionId,
    nation_id: nation.id,
    tech_id: tech.id,
    tree_id: tech.tree_id,
    tier: tech.tier,
    status: tech.tier === 1 && tech.prerequisites.length === 0 ? "available" : "locked",
    progress: 0,
    research_cost: tech.cost,
  }));

  await admin.from("tech_research").insert(techRows);

  redirect(`/game/${input.sessionId}`);
}
