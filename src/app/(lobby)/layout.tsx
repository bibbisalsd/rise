import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/game/SignOutButton";

export default async function LobbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let username = "Commander";
  let user = null;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {
      // Auth check failed — treat as not logged in
    }

    if (!user) {
      redirect("/login");
    }

    username = user.user_metadata?.username || user.email?.split("@")[0] || "Commander";
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] px-6 py-3 flex items-center justify-between">
        <Link href="/lobby" className="text-xl font-bold">
          <span className="text-[var(--primary)]">Rise</span> of Fronts
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--muted-foreground)]">
            {username}
          </span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
