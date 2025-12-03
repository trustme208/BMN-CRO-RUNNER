import { kv } from "@vercel/kv";
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface LeaderboardEntry {
  wallet: string;
  username: string | null;
  score: number;
  tokens: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method not allowed" });
  }

  try {
    const data = await kv.get<LeaderboardEntry[]>("leaderboard");
    let leaderboard = Array.isArray(data) ? data : [];

    leaderboard = leaderboard.filter(
      (entry): entry is LeaderboardEntry =>
        entry &&
        typeof entry.wallet === "string" &&
        typeof entry.score === "number"
    );

    leaderboard.sort((a, b) => b.score - a.score);

    return res.status(200).json(leaderboard.slice(0, 100));
  } catch (err) {
    console.error("Leaderboard error:", err);
    return res.status(500).json({ error: "internal server error" });
  }
}
