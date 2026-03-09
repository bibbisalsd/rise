"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGameStore } from "@/stores/gameStore";
import type { Nation } from "@/types/nation";
import type { Province } from "@/types/map";
import type { Unit } from "@/types/military";
import type { GameSession } from "@/types/game";

export function useGameSession(sessionId: string) {
  const supabase = createClient();
  const {
    setSession, setMyNation, setNations, setProvinces, setUnits,
    updateNation, updateProvince, updateUnit, removeUnit,
    setGameDate, setCurrentTick, setIsLoading, setError,
  } = useGameStore();

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialState() {
      setIsLoading(true);
      setError(null);

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

        // 3. Load all nations
        const { data: nations, error: nErr } = await supabase
          .from("nations")
          .select("*")
          .eq("session_id", sessionId);
        if (nErr) throw new Error(nErr.message);
        if (!cancelled && nations) {
          setNations(nations as Nation[]);
          if (user) {
            const mine = nations.find((n) => n.user_id === user.id);
            if (mine) setMyNation(mine as Nation);
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
    const channel = supabase
      .channel(`game:${sessionId}`)

      // Nations changing (treasury, stability, etc.)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "nations",
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        if (payload.eventType === "UPDATE") updateNation(payload.new as Nation);
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
