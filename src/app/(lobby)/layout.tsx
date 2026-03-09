import Link from "next/link";
import { SignOutButton } from "@/components/game/SignOutButton";
import { LobbyUsername } from "@/components/game/LobbyUsername";

export default function LobbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] px-6 py-3 flex items-center justify-between">
        <Link href="/lobby" className="text-xl font-bold">
          <span className="text-[var(--primary)]">Rise</span> of Fronts
        </Link>
        <div className="flex items-center gap-4">
          <LobbyUsername />
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
