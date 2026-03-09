export default async function GamePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      {/* Top Bar */}
      <header className="h-12 border-b border-[var(--border)] flex items-center px-4 justify-between bg-[var(--card)]">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-[var(--primary)]">
            Rise of Fronts
          </span>
          <span className="text-sm text-[var(--muted-foreground)]">
            Session: {sessionId.slice(0, 8)}...
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-[var(--foreground)]">
            Jan 1, 2025
          </span>
        </div>
      </header>

      {/* Main Game Area */}
      <div className="flex-1 flex">
        {/* Map Area (placeholder) */}
        <div className="flex-1 relative bg-[#0d1117] flex items-center justify-center">
          <p className="text-[var(--muted-foreground)]">
            Map Canvas (Phase 1)
          </p>
        </div>

        {/* Right Panel */}
        <aside className="w-80 border-l border-[var(--border)] bg-[var(--card)] p-4 overflow-y-auto">
          <h2 className="text-lg font-bold mb-4">Nation Overview</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Treasury</span>
              <span>$1,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Population</span>
              <span>10,000,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Manpower</span>
              <span>500,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Stability</span>
              <span>50%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Research</span>
              <span>5 RP/tick</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
