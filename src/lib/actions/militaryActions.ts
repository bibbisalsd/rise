"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { UNIT_DEFINITIONS } from "@/data/units";

async function getAuthenticatedNation(nationId: string) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("You must be logged in.");

  const { data: nation, error: nErr } = await supabase
    .from("nations")
    .select("id, user_id, session_id, treasury, manpower_pool")
    .eq("id", nationId)
    .single();
  if (nErr || !nation) throw new Error("Nation not found.");
  if (nation.user_id !== user.id) throw new Error("You do not own this nation.");

  return { supabase, nation };
}

export async function trainUnit(nationId: string, provinceId: string, unitType: string) {
  const { supabase, nation } = await getAuthenticatedNation(nationId);
  const admin = createAdminClient();

  // Validate unit type
  const unitDef = UNIT_DEFINITIONS[unitType];
  if (!unitDef) throw new Error("Invalid unit type.");

  // Validate province ownership
  const { data: province } = await supabase
    .from("provinces")
    .select("id, owner_nation_id")
    .eq("id", provinceId)
    .single();

  if (!province || province.owner_nation_id !== nationId) {
    throw new Error("You do not own this province.");
  }

  // Check resources
  if (nation.treasury < unitDef.gold_cost) {
    throw new Error(`Insufficient gold. Need $${unitDef.gold_cost}, have $${nation.treasury}.`);
  }
  if (nation.manpower_pool < unitDef.manpower_cost) {
    throw new Error(`Insufficient manpower. Need ${unitDef.manpower_cost}, have ${nation.manpower_pool}.`);
  }

  // Deduct costs
  const { error: costErr } = await supabase
    .from("nations")
    .update({
      treasury: nation.treasury - unitDef.gold_cost,
      manpower_pool: nation.manpower_pool - unitDef.manpower_cost,
    })
    .eq("id", nationId);

  if (costErr) throw new Error("Failed to deduct costs.");

  // Create unit (use admin to bypass RLS)
  const { error: unitErr } = await admin
    .from("units")
    .insert({
      session_id: nation.session_id,
      nation_id: nationId,
      province_id: provinceId,
      unit_type: unitType,
      name: unitDef.name,
      strength: 0, // training
      max_strength: unitDef.base_strength,
      experience: 0,
      morale: 50,
      organization: 50,
      supply_status: 100,
      movement_target_id: null,
      movement_path: null,
      movement_progress: 0,
      army_id: null,
      in_combat: false,
      combat_id: null,
      is_entrenched: false,
    });

  if (unitErr) throw new Error(unitErr.message);
  return { success: true };
}

export async function moveUnit(unitId: string, targetProvinceId: string) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("You must be logged in.");

  // Get unit
  const { data: unit, error: uErr } = await supabase
    .from("units")
    .select("id, nation_id, in_combat")
    .eq("id", unitId)
    .single();

  if (uErr || !unit) throw new Error("Unit not found.");

  // Verify ownership
  const { data: nation } = await supabase
    .from("nations")
    .select("user_id")
    .eq("id", unit.nation_id)
    .single();

  if (!nation || nation.user_id !== user.id) throw new Error("You do not own this unit.");
  if (unit.in_combat) throw new Error("Cannot move a unit in combat.");

  // Set movement target
  const { error } = await supabase
    .from("units")
    .update({
      movement_target_id: targetProvinceId,
      movement_progress: 0,
    })
    .eq("id", unitId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function cancelMovement(unitId: string) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("You must be logged in.");

  const { data: unit } = await supabase
    .from("units")
    .select("id, nation_id")
    .eq("id", unitId)
    .single();

  if (!unit) throw new Error("Unit not found.");

  const { data: nation } = await supabase
    .from("nations")
    .select("user_id")
    .eq("id", unit.nation_id)
    .single();

  if (!nation || nation.user_id !== user.id) throw new Error("You do not own this unit.");

  const { error } = await supabase
    .from("units")
    .update({
      movement_target_id: null,
      movement_path: null,
      movement_progress: 0,
    })
    .eq("id", unitId);

  if (error) throw new Error(error.message);
  return { success: true };
}
