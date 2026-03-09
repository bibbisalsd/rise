import { createAdminClient } from "@/lib/supabase/admin";
import { IDEOLOGY_DEFINITIONS } from "@/data/ideologies";
import { UNIT_DEFINITIONS } from "@/data/units";
import { TECH_BY_ID, ALL_TECH } from "@/data/tech-trees";

/**
 * Process a single game tick for a session.
 * Called by the tick driver (API route or cron).
 */
export async function processTick(sessionId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();

  try {
    // 1. Acquire lock
    const { data: lockResult } = await admin.rpc("acquire_tick_lock", {
      p_session_id: sessionId,
    });

    if (!lockResult) {
      return { ok: false, error: "Could not acquire tick lock (session is locked or missing)" };
    }

    // 2. Load session
    const { data: session } = await admin
      .from("game_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (!session || session.status !== "active") {
      await releaseLock(admin, sessionId);
      return { ok: false, error: "Session not active" };
    }

    // 3. Load all nations in session
    const { data: nations } = await admin
      .from("nations")
      .select("*")
      .eq("session_id", sessionId);

    if (!nations || nations.length === 0) {
      await releaseLock(admin, sessionId);
      return { ok: false, error: "No nations in session" };
    }

    const currentTick = session.current_tick;

    // ── Economy Tick ──────────────────────────────────────
    for (const nation of nations) {
      const ideology = IDEOLOGY_DEFINITIONS[nation.ideology_id];
      const mods = ideology?.modifiers ?? {};

      // Tax income
      const taxMultipliers: Record<string, number> = {
        minimum: 0.5, low: 0.75, normal: 1.0, high: 1.25, maximum: 1.5,
      };
      const baseTax = nation.population * 0.00001; // base income per capita
      const taxMult = taxMultipliers[nation.taxation_setting] ?? 1.0;
      const ideologyTaxMult = mods.tax_income_mult ?? 1.0;
      const corruptionLoss = 1 - (nation.corruption / 100);
      const taxIncome = baseTax * taxMult * ideologyTaxMult * corruptionLoss;

      // Military upkeep
      const { data: units } = await admin
        .from("units")
        .select("unit_type")
        .eq("nation_id", nation.id);

      let totalUpkeep = 0;
      for (const u of (units ?? [])) {
        const def = UNIT_DEFINITIONS[u.unit_type];
        if (def) totalUpkeep += def.upkeep_per_tick;
      }

      const militaryUpkeepMult = mods.military_upkeep_mult ?? 1.0;
      totalUpkeep *= militaryUpkeepMult;

      // Net income
      const netIncome = taxIncome - totalUpkeep;

      // Spending effects
      const spendMil = nation.spending_military ?? 5;
      const spendGov = nation.spending_government ?? 5;
      const spendAntiCorr = nation.spending_anti_corruption ?? 5;
      const spendResearch = nation.spending_research ?? 5;

      // Stability change
      let stabilityDelta = (mods.stability_per_tick ?? 0);
      stabilityDelta += (spendGov - 5) * 0.1; // above 5 = positive
      if (nation.war_exhaustion > 50) stabilityDelta -= 0.1;

      // Corruption change
      let corruptionDelta = (mods.corruption_per_tick ?? 0);
      corruptionDelta -= (spendAntiCorr - 5) * 0.15; // above 5 reduces corruption

      // PP gain
      const ppGain = (ideology?.pp_gain_per_tick ?? 1) * (mods.political_power_gain_mult ?? 1.0);

      // Research power boost from spending
      const researchBoost = (spendResearch - 5) * 0.5;

      // Update nation
      const newStability = Math.max(0, Math.min(100, nation.stability + stabilityDelta));
      const newCorruption = Math.max(0, Math.min(100, nation.corruption + corruptionDelta));
      const newTreasury = Math.max(0, nation.treasury + netIncome);
      const newPP = nation.political_power + ppGain;
      const newRP = Math.max(0, nation.research_power + researchBoost * 0.1);

      await admin
        .from("nations")
        .update({
          treasury: Math.round(newTreasury * 100) / 100,
          stability: Math.round(newStability * 100) / 100,
          corruption: Math.round(newCorruption * 100) / 100,
          political_power: Math.round(newPP * 100) / 100,
          research_power: Math.round(newRP * 100) / 100,
        })
        .eq("id", nation.id);

      // ── Research Tick ─────────────────────────────────────
      const { data: researching } = await admin
        .from("tech_research")
        .select("*")
        .eq("nation_id", nation.id)
        .eq("status", "researching");

      for (const tr of (researching ?? [])) {
        const researchCost = tr.research_cost || 100;
        const progressIncrement = (nation.research_power / researchCost) * 100;
        const newProgress = Math.min(100, tr.progress + progressIncrement);

        if (newProgress >= 100) {
          // Complete the research
          await admin
            .from("tech_research")
            .update({
              status: "completed",
              progress: 100,
              completed_tick: currentTick,
            })
            .eq("id", tr.id);

          // Unlock dependent techs
          const dependents = ALL_TECH.filter((t) =>
            t.prerequisites.includes(tr.tech_id)
          );
          for (const dep of dependents) {
            // Check if ALL prerequisites are completed
            const { data: allPrereqs } = await admin
              .from("tech_research")
              .select("status")
              .eq("nation_id", nation.id)
              .in("tech_id", dep.prerequisites);

            const allCompleted = allPrereqs?.every((p) => p.status === "completed") ?? false;
            if (allCompleted) {
              await admin
                .from("tech_research")
                .update({ status: "available" })
                .eq("nation_id", nation.id)
                .eq("tech_id", dep.id)
                .eq("status", "locked");
            }
          }
        } else {
          await admin
            .from("tech_research")
            .update({ progress: Math.round(newProgress * 100) / 100 })
            .eq("id", tr.id);
        }
      }

      // ── Unit Training Tick ────────────────────────────────
      const { data: trainingUnits } = await admin
        .from("units")
        .select("*")
        .eq("nation_id", nation.id)
        .eq("in_combat", false)
        .lt("strength", 1); // basically strength=0 → training

      // Actually, get all units below max strength and not in combat
      const { data: allUnits } = await admin
        .from("units")
        .select("*")
        .eq("nation_id", nation.id)
        .eq("in_combat", false);

      for (const u of (allUnits ?? [])) {
        const def = UNIT_DEFINITIONS[u.unit_type];
        if (!def) continue;
        const maxStr = def.base_strength;

        if (u.strength < maxStr) {
          // Training: gain strength based on military spending
          const trainRate = maxStr / (def.training_days || 10);
          const militaryMult = (spendMil / 5); // 5 = normal
          const newStrength = Math.min(maxStr, u.strength + trainRate * militaryMult);

          await admin
            .from("units")
            .update({ strength: Math.round(newStrength) })
            .eq("id", u.id);
        }
      }

      // ── Movement Tick ─────────────────────────────────────
      const { data: movingUnits } = await admin
        .from("units")
        .select("*")
        .eq("nation_id", nation.id)
        .not("movement_target_id", "is", null);

      for (const u of (movingUnits ?? [])) {
        const def = UNIT_DEFINITIONS[u.unit_type];
        if (!def) continue;

        const movementSpeed = def.movement || 1;
        const newProgress = (u.movement_progress ?? 0) + movementSpeed * 10;

        if (newProgress >= 100) {
          // Arrived
          await admin
            .from("units")
            .update({
              province_id: u.movement_target_id,
              movement_target_id: null,
              movement_path: null,
              movement_progress: 0,
            })
            .eq("id", u.id);
        } else {
          await admin
            .from("units")
            .update({ movement_progress: newProgress })
            .eq("id", u.id);
        }
      }

      // ── Resource Production Tick ──────────────────────────
      const { data: stockpiles } = await admin
        .from("resource_stockpiles")
        .select("*")
        .eq("nation_id", nation.id);

      for (const stock of (stockpiles ?? [])) {
        const netProduction = stock.production_rate - stock.consumption_rate + stock.trade_balance;
        const newStockpile = Math.max(0, Math.min(stock.max_stockpile, stock.stockpile + netProduction));

        await admin
          .from("resource_stockpiles")
          .update({ stockpile: Math.round(newStockpile * 100) / 100 })
          .eq("id", stock.id);
      }
    }

    // ── Advance Clock ────────────────────────────────────
    const nextTick = currentTick + 1;
    const gameDate = new Date(session.game_date);
    gameDate.setDate(gameDate.getDate() + 1); // each tick = 1 in-game day

    await admin
      .from("game_sessions")
      .update({
        current_tick: nextTick,
        game_date: gameDate.toISOString().split("T")[0],
      })
      .eq("id", sessionId);

    // ── Release Lock ─────────────────────────────────────
    await releaseLock(admin, sessionId);

    return { ok: true };
  } catch (err) {
    await releaseLock(admin, sessionId).catch(() => {});
    return { ok: false, error: err instanceof Error ? err.message : "Unknown tick error" };
  }
}

async function releaseLock(admin: ReturnType<typeof createAdminClient>, sessionId: string) {
  await admin.rpc("release_tick_lock", { p_session_id: sessionId });
}
