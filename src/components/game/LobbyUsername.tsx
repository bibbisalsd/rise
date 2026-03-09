"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LobbyUsername() {
  const [username, setUsername] = useState("Commander");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUsername(
          data.user.user_metadata?.username ||
          data.user.email?.split("@")[0] ||
          "Commander"
        );
      }
    });
  }, []);

  return (
    <span className="text-sm text-[var(--muted-foreground)]">
      {username}
    </span>
  );
}
