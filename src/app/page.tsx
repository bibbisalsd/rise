import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="text-center max-w-3xl">
        <h1 className="text-6xl font-bold mb-4 tracking-tight">
          <span className="text-[var(--primary)]">Rise</span> of{" "}
          <span className="text-[var(--accent)]">Fronts</span>
        </h1>
        <p className="text-xl text-[var(--muted-foreground)] mb-8">
          Command nations. Wage war. Shape history.
        </p>
        <p className="text-[var(--muted-foreground)] mb-12 max-w-xl mx-auto">
          A real-time grand strategy game where every second is a day.
          Build economies, research technology, forge alliances, and
          lead your armies to victory.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 border border-[var(--border)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
      <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl text-center">
        <div>
          <div className="text-3xl font-bold text-[var(--primary)]">8</div>
          <div className="text-sm text-[var(--muted-foreground)]">Ideologies</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-[var(--primary)]">100+</div>
          <div className="text-sm text-[var(--muted-foreground)]">Technologies</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-[var(--primary)]">15+</div>
          <div className="text-sm text-[var(--muted-foreground)]">Unit Types</div>
        </div>
      </div>
    </div>
  );
}
