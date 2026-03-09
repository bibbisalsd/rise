import GamePageClient from "./GamePageClient";

export default async function GamePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <GamePageClient sessionId={sessionId} />;
}
