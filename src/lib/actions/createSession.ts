"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createSession(formData: {
  name: string;
  maxPlayers: number;
}) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be logged in to create a game.");
  }

  // Insert the game session
  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .insert({
      name: formData.name,
      host_user_id: user.id,
      status: "lobby",
      max_players: formData.maxPlayers,
      current_tick: 0,
      game_date: "2025-01-01",
      speed_multiplier: 1.0,
      map_id: "world_default",
      settings: {},
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    console.error("Session creation error:", sessionError);
    throw new Error(sessionError?.message || "Failed to create game session.");
  }

  // Redirect to the game session page
  redirect(`/game/${session.id}`);
}
