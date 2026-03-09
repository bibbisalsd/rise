"use client";

import { useState } from "react";
import { createSession } from "@/lib/actions/createSession";

export default function CreateGamePage() {
  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter a session name.");
      return;
    }

    setLoading(true);

    try {
      await createSession({ name: name.trim(), maxPlayers });
      // createSession redirects on success — if we reach here, something went wrong
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      // Next.js redirect throws a special error — don't treat it as a real error
      if (message.includes("NEXT_REDIRECT")) return;
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create Game</h1>

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Error message */}
        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Session Name */}
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
            disabled={loading}
            className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50"
            placeholder="World War III"
          />
        </div>

        {/* Max Players */}
        <div>
          <label htmlFor="maxPlayers" className="block text-sm font-medium mb-1">
            Max Players
          </label>
          <select
            id="maxPlayers"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            disabled={loading}
            className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50"
          >
            {[2, 4, 6, 8, 16, 32, 60].map((n) => (
              <option key={n} value={n}>
                {n} Players
              </option>
            ))}
          </select>
        </div>

        {/* Map (static for now) */}
        <div className="border border-[var(--border)] rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2">Map</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            World Map (239 nations) — Default
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Creating...
            </span>
          ) : (
            "Create Game"
          )}
        </button>
      </form>
    </div>
  );
}
