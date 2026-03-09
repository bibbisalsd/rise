"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedNation(nationId: string) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("You must be logged in.");

  const { data: nation, error: nErr } = await supabase
    .from("nations")
    .select("id, user_id, session_id, political_power")
    .eq("id", nationId)
    .single();
  if (nErr || !nation) throw new Error("Nation not found.");
  if (nation.user_id !== user.id) throw new Error("You do not own this nation.");

  return { supabase, nation };
}

export async function justifyWar(nationId: string, targetNationId: string) {
  const { supabase, nation } = await getAuthenticatedNation(nationId);
  const admin = createAdminClient();

  const ppCost = 50;
  if (nation.political_power < ppCost) {
    throw new Error(`Insufficient political power. Need ${ppCost} PP, have ${Math.floor(nation.political_power)} PP.`);
  }

  // Verify target exists in same session
  const { data: target } = await supabase
    .from("nations")
    .select("id, session_id")
    .eq("id", targetNationId)
    .eq("session_id", nation.session_id)
    .single();

  if (!target) throw new Error("Target nation not found in this session.");

  // Get current tick
  const { data: session } = await supabase
    .from("game_sessions")
    .select("current_tick")
    .eq("id", nation.session_id)
    .single();

  // Deduct PP
  await supabase
    .from("nations")
    .update({ political_power: nation.political_power - ppCost })
    .eq("id", nationId);

  // Create justification (10 tick duration)
  const { error } = await admin
    .from("war_justifications")
    .insert({
      session_id: nation.session_id,
      nation_id: nationId,
      target_nation_id: targetNationId,
      justification_type: "territorial",
      progress: 0,
      started_tick: session?.current_tick ?? 0,
      completed: false,
    });

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function declareWar(nationId: string, targetNationId: string) {
  const { supabase, nation } = await getAuthenticatedNation(nationId);
  const admin = createAdminClient();

  // Check for completed justification
  const { data: justification } = await supabase
    .from("war_justifications")
    .select("id, completed")
    .eq("nation_id", nationId)
    .eq("target_nation_id", targetNationId)
    .eq("completed", true)
    .maybeSingle();

  if (!justification) {
    throw new Error("No completed war justification against this nation.");
  }

  // Create war
  const { error } = await admin
    .from("wars")
    .insert({
      session_id: nation.session_id,
      attacker_id: nationId,
      defender_id: targetNationId,
      status: "active",
      started_tick: 0,
      war_score: 0,
    });

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function proposeTrade(
  proposerId: string,
  accepterId: string,
  offerResources: Record<string, number>,
  offerMoney: number,
  demandResources: Record<string, number>,
  demandMoney: number,
) {
  const { supabase, nation } = await getAuthenticatedNation(proposerId);
  const admin = createAdminClient();

  // Verify target in same session
  const { data: target } = await supabase
    .from("nations")
    .select("id")
    .eq("id", accepterId)
    .eq("session_id", nation.session_id)
    .single();

  if (!target) throw new Error("Target nation not found in this session.");

  const { error } = await admin
    .from("trade_deals")
    .insert({
      session_id: nation.session_id,
      proposer_id: proposerId,
      accepter_id: accepterId,
      status: "proposed",
      offer_resources: offerResources,
      offer_money: offerMoney,
      demand_resources: demandResources,
      demand_money: demandMoney,
      duration_ticks: 30,
      started_tick: null,
    });

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function respondTrade(dealId: string, accept: boolean) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("You must be logged in.");

  const { data: deal } = await supabase
    .from("trade_deals")
    .select("id, accepter_id, status")
    .eq("id", dealId)
    .single();

  if (!deal) throw new Error("Trade deal not found.");
  if (deal.status !== "proposed") throw new Error("Deal is no longer pending.");

  // Verify the user owns the accepter nation
  const { data: nation } = await supabase
    .from("nations")
    .select("user_id")
    .eq("id", deal.accepter_id)
    .single();

  if (!nation || nation.user_id !== user.id) throw new Error("You are not the recipient of this deal.");

  const { error } = await supabase
    .from("trade_deals")
    .update({ status: accept ? "active" : "rejected" })
    .eq("id", dealId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function proposeAlliance(leaderId: string, targetId: string, type: string) {
  const { supabase, nation } = await getAuthenticatedNation(leaderId);
  const admin = createAdminClient();

  const validTypes = ["defensive", "military", "economic", "non_aggression"];
  if (!validTypes.includes(type)) throw new Error("Invalid alliance type.");

  const { data: target } = await supabase
    .from("nations")
    .select("id")
    .eq("id", targetId)
    .eq("session_id", nation.session_id)
    .single();

  if (!target) throw new Error("Target nation not found in this session.");

  const { error } = await admin
    .from("alliances")
    .insert({
      session_id: nation.session_id,
      leader_id: leaderId,
      alliance_type: type,
      status: "proposed",
    });

  if (error) throw new Error(error.message);
  return { success: true };
}
