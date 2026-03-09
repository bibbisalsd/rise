import Link from "next/link";

export default function LobbyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Game Lobby</h1>
        <Link
          href="/create"
          className="px-6 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          Create Game
        </Link>
      </div>

      <div className="border border-[var(--border)] rounded-xl p-8 text-center">
        <p className="text-[var(--muted-foreground)] text-lg mb-4">
          No active games yet
        </p>
        <p className="text-sm text-[var(--muted-foreground)]">
          Create a new game session or wait for others to host one.
        </p>
      </div>
    </div>
  );
}
