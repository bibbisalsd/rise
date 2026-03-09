"use server";

import { createClient } from "@/lib/supabase/server";
import { TECH_BY_ID } from "@/data/tech-trees";

async function getAuthenticatedNation(nationId: string) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("You must be logged in.");

  const { data: nation, error: nErr } = await supabase
    .from("nations")
    .select("id, user_id, session_id")
    .eq("id", nationId)
    .single();
  if (nErr || !nation) throw new Error("Nation not found.");
  if (nation.user_id !== user.id) throw new Error("You do not own this nation.");

  return { supabase, nation };
}

export async function startResearch(nationId: string, techId: string) {
  const { supabase, nation } = await getAuthenticatedNation(nationId);

  // Validate tech exists
  const techDef = TECH_BY_ID[techId];
  if (!techDef) throw new Error("Invalid tech ID.");

  // Load this tech's research record
  const { data: techRow, error: trErr } = await supabase
    .from("tech_research")
    .select("*")
    .eq("nation_id", nationId)
    .eq("tech_id", techId)
    .single();

  if (trErr || !techRow) throw new Error("Tech research record not found.");
  if (techRow.status !== "available") throw new Error(`Cannot research: tech is ${techRow.status}.`);

  // Check no other tech in same tree is being researched
  const { data: researching } = await supabase
    .from("tech_research")
    .select("tech_id")
    .eq("nation_id", nationId)
    .eq("tree_id", techDef.tree_id)
    .eq("status", "researching");

  if (researching && researching.length > 0) {
    throw new Error("Already researching a tech in this tree. Cancel it first.");
  }

  // Check prerequisites are completed
  for (const prereqId of techDef.prerequisites) {
    const { data: prereq } = await supabase
      .from("tech_research")
      .select("status")
      .eq("nation_id", nationId)
      .eq("tech_id", prereqId)
      .single();

    if (!prereq || prereq.status !== "completed") {
      throw new Error(`Prerequisite not completed: ${prereqId}`);
    }
  }

  // Get current tick
  const { data: session } = await supabase
    .from("game_sessions")
    .select("current_tick")
    .eq("id", nation.session_id)
    .single();

  const { error } = await supabase
    .from("tech_research")
    .update({
      status: "researching",
      progress: 0,
      started_tick: session?.current_tick ?? 0,
    })
    .eq("nation_id", nationId)
    .eq("tech_id", techId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function cancelResearch(nationId: string, techId: string) {
  const { supabase } = await getAuthenticatedNation(nationId);

  const { data: techRow } = await supabase
    .from("tech_research")
    .select("status")
    .eq("nation_id", nationId)
    .eq("tech_id", techId)
    .single();

  if (!techRow || techRow.status !== "researching") {
    throw new Error("This tech is not being researched.");
  }

  const { error } = await supabase
    .from("tech_research")
    .update({
      status: "available",
      progress: 0,
      started_tick: null,
    })
    .eq("nation_id", nationId)
    .eq("tech_id", techId);

  if (error) throw new Error(error.message);
  return { success: true };
}
