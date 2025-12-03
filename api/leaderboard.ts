import { kv } from "@vercel/kv";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method not allowed" });
  }

  try {
    let leaderboard = await kv.get("leaderboard");
    if (!Array.isArray(leaderboard)) leaderboard = [];

    leaderboard = leaderboard.filter(
      (entry: any) =>
        entry &&
        typeof entry.wallet === "string" &&
        typeof entry.score === "number"
    );

    leaderboard.sort((a: any, b: any) => b.score - a.score);

    return res.status(200).json(leaderboard.slice(0, 100));
  } catch (err) {
    console.error("Leaderboard error:", err);
    return res.status(500).json({ error: "internal server error" });
  }
}
