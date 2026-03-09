"use server";

import { createClient } from "@/lib/supabase/server";
import type { SpendingSliders, TaxationSetting, ConscriptionLaw } from "@/types/game";

async function getAuthenticatedNation(nationId: string) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("You must be logged in.");

  const { data: nation, error: nErr } = await supabase
    .from("nations")
    .select("id, user_id")
    .eq("id", nationId)
    .single();
  if (nErr || !nation) throw new Error("Nation not found.");
  if (nation.user_id !== user.id) throw new Error("You do not own this nation.");

  return { supabase, nation };
}

export async function updateSpending(nationId: string, sliders: SpendingSliders) {
  const { supabase } = await getAuthenticatedNation(nationId);

  // Validate each slider is 0-10
  for (const [key, value] of Object.entries(sliders)) {
    if (typeof value !== "number" || value < 0 || value > 10) {
      throw new Error(`Invalid spending value for ${key}: ${value}`);
    }
  }

  const { error } = await supabase
    .from("nations")
    .update({
      spending_military: sliders.military,
      spending_government: sliders.government,
      spending_security: sliders.security,
      spending_education: sliders.education,
      spending_anti_corruption: sliders.anti_corruption,
      spending_healthcare: sliders.healthcare,
      spending_research: sliders.research,
      spending_reconstruction: sliders.reconstruction,
    })
    .eq("id", nationId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function updateTaxation(nationId: string, setting: TaxationSetting) {
  const { supabase } = await getAuthenticatedNation(nationId);

  const valid: TaxationSetting[] = ["minimum", "low", "normal", "high", "maximum"];
  if (!valid.includes(setting)) throw new Error("Invalid taxation setting.");

  const { error } = await supabase
    .from("nations")
    .update({ taxation_setting: setting })
    .eq("id", nationId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function updateConscription(nationId: string, law: ConscriptionLaw) {
  const { supabase } = await getAuthenticatedNation(nationId);

  const valid: ConscriptionLaw[] = [
    "volunteer_only", "limited_conscript", "extensive_conscript", "mass_mobilization",
  ];
  if (!valid.includes(law)) throw new Error("Invalid conscription law.");

  const { error } = await supabase
    .from("nations")
    .update({ conscription_law: law })
    .eq("id", nationId);

  if (error) throw new Error(error.message);
  return { success: true };
}
