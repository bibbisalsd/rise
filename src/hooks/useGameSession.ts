"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGameStore } from "@/stores/gameStore";
import type { Nation } from "@/types/nation";
import type { Province } from "@/types/map";
import type { Unit } from "@/types/military";
import type { GameSession, SpendingSliders } from "@/types/game";
import type { TechResearch } from "@/types/tech";
import type { ResourceStockpile } from "@/types/economy";

/**
 * Map flat spending columns from DB to the nested SpendingSliders object.
 * DB stores: spending_military, spending_government, etc. (INT 0-10)
 * TypeScript expects: spending: { military: number, ... }
 */
function mapNationFromDB(row: Record<string, unknown>): Nation {
  const spending: SpendingSliders = {
    military: (row.spending_military as number) ?? 5,
    government: (row.spending_government as number) ?? 5,
    security: (row.spending_security as number) ?? 5,
    education: (row.spending_education as number) ?? 5,
    anti_corruption: (row.spending_anti_corruption as number) ?? 5,
    healthcare: (row.spending_healthcare as number) ?? 5,
    research: (row.spending_research as number) ?? 5,
    reconstruction: (row.spending_reconstruction as number) ?? 5,
  };

  return {
    id: row.id as string,
    session_id: row.session_id as string,
    user_id: (row.user_id as string) ?? null,
    name: row.name as string,
    tag: row.tag as string,
    color: row.color as string,
    flag_sprite: (row.flag_sprite as string) ?? null,
    is_ai: row.is_ai as boolean,
    population: row.population as number,
    manpower_pool: row.manpower_pool as number,
    stability: row.stability as number,
    corruption: row.corruption as number,
    war_exhaustion: row.war_exhaustion as number,
    political_power: row.political_power as number,
    research_power: row.research_power as number,
    treasury: row.treasury as number,
    taxation_setting: row.taxation_setting as Nation["taxation_setting"],
    conscription_law: row.conscription_law as Nation["conscription_law"],
    spending,
    ideology_id: row.ideology_id as Nation["ideology_id"],
    leader_name: (row.leader_name as string) ?? null,
    leader_traits: (row.leader_traits as string[]) ?? [],
    victory_points: row.victory_points as number,
  };
}

export function useGameSession(sessionId: string) {
  const supabase = createClient();
  const {
    setSession, setMyNation, setNations, setProvinces, setUnits,
    updateNation, updateProvince, updateUnit, removeUnit,
    setTechResearch, updateTechResearch,
    setResourceStockpiles, updateResourceStockpile,
    setGameDate, setCurrentTick, setIsLoading, setError,
  } = useGameStore();

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialState() {
      setIsLoading(true);
      setError(null);

      // Skip fetches when Supabase is not configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setIsLoading(false);
        return;
      }

      try {
        // 1. Load session
        const { data: session, error: sErr } = await supabase
          .from("game_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();
        if (sErr || !session) throw new Error(sErr?.message || "Session not found");
        if (!cancelled) {
          setSession(session as GameSession);
          setGameDate(formatGameDate(session.game_date));
          setCurrentTick(session.current_tick);
        }

        // 2. Load my user
        const { data: { user } } = await supabase.auth.getUser();

        // 3. Load all nations (map flat spending columns to nested object)
        const { data: nationsRaw, error: nErr } = await supabase
          .from("nations")
          .select("*")
          .eq("session_id", sessionId);
        if (nErr) throw new Error(nErr.message);
        if (!cancelled && nationsRaw) {
          const nations = nationsRaw.map((row) => mapNationFromDB(row as Record<string, unknown>));
          setNations(nations);
          if (user) {
            const mine = nations.find((n) => n.user_id === user.id);
            if (mine) setMyNation(mine);
          }
        }

        // 4. Load provinces
        const { data: provinces, error: pErr } = await supabase
          .from("provinces")
          .select("*")
          .eq("session_id", sessionId);
        if (pErr) throw new Error(pErr.message);
        if (!cancelled && provinces) setProvinces(provinces as Province[]);

        // 5. Load units
        const { data: units, error: uErr } = await supabase
          .from("units")
          .select("*")
          .eq("session_id", sessionId);
        if (uErr) throw new Error(uErr.message);
        if (!cancelled && units) setUnits(units as Unit[]);

        // 6. Load tech research (for my nation)
        if (user) {
          const myNationRow = nationsRaw?.find((n: Record<string, unknown>) => n.user_id === user.id);
          if (myNationRow) {
            const nationId = (myNationRow as Record<string, unknown>).id as string;

            const { data: techs, error: tErr } = await supabase
              .from("tech_research")
              .select("*")
              .eq("session_id", sessionId)
              .eq("nation_id", nationId);
            if (tErr) console.error("Tech research fetch error:", tErr);
            if (!cancelled && techs) setTechResearch(techs as TechResearch[]);

            // 7. Load resource stockpiles (for my nation)
            const { data: resources, error: rErr } = await supabase
              .from("resource_stockpiles")
              .select("*")
              .eq("session_id", sessionId)
              .eq("nation_id", nationId);
            if (rErr) console.error("Resource stockpiles fetch error:", rErr);
            if (!cancelled && resources) setResourceStockpiles(resources as ResourceStockpile[]);
          }
        }

      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load game");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadInitialState();

    // ── Realtime subscriptions ──────────────────────────────
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return () => { cancelled = true; };
    }

    const channel = supabase
      .channel(`game:${sessionId}`)

      // Nations changing (treasury, stability, spending, etc.)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "nations",
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        if (payload.eventType === "UPDATE") {
          updateNation(mapNationFromDB(payload.new as Record<string, unknown>));
        }
      })

      // Province ownership changing
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "provinces",
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        updateProvince(payload.new as Province);
      })

      // Units moving, fighting, dying
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "units",
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        updateUnit(payload.new as Unit);
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "units",
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        updateUnit(payload.new as Unit);
      })
      .on("postgres_changes", {
        event: "DELETE", schema: "public", table: "units",
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        removeUnit(payload.old.id);
      })

      // Tech research updates
      .on("postgres_changes", {
        event: "*", schema: "public", table: "tech_research",
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
          updateTechResearch(payload.new as TechResearch);
        }
      })

      // Resource stockpile updates
      .on("postgres_changes", {
        event: "*", schema: "public", table: "resource_stockpiles",
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
          updateResourceStockpile(payload.new as ResourceStockpile);
        }
      })

      // Session tick/date updates
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "game_sessions",
        filter: `id=eq.${sessionId}`,
      }, (payload) => {
        const s = payload.new as GameSession;
        setCurrentTick(s.current_tick);
        setGameDate(formatGameDate(s.game_date));
      })

      .subscribe();

    channelRef.current = channel;

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps
}

// ─── Helpers ────────────────────────────────────────────────
function formatGameDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
