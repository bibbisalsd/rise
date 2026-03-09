"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateGamePage() {
  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // TODO: Create game session via server action
    // For now, redirect back to lobby
    router.push("/lobby");
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create Game</h1>
      <form onSubmit={handleCreate} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Session Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            placeholder="World War III"
          />
        </div>
        <div>
          <label htmlFor="maxPlayers" className="block text-sm font-medium mb-1">
            Max Players
          </label>
          <select
            id="maxPlayers"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            {[2, 4, 6, 8].map((n) => (
              <option key={n} value={n}>
                {n} Players
              </option>
            ))}
          </select>
        </div>
        <div className="border border-[var(--border)] rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2">Map</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            World Map (50 provinces) - Default
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Game"}
        </button>
      </form>
    </div>
  );
}
