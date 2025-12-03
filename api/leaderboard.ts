import { kv } from "@vercel/kv";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import type { VercelRequest, VercelResponse } from "@vercel/node";

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  try {
    const { wallet, username, score, tokens } = req.body;

    let leaderboard = (await kv.get("leaderboard")) || [];
    if (!Array.isArray(leaderboard)) leaderboard = [];

    // Remove old entry
    leaderboard = leaderboard.filter((entry: any) => entry.wallet !== wallet);

    // Add updated entry
    leaderboard.push({ wallet, username, score, tokens });

    // Sort and keep top 100
    leaderboard.sort((a: any, b: any) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 100);

    await kv.set("leaderboard", leaderboard);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Leaderboard update error:", err);
    return res.status(500).json({ error: "internal server error" });
  }
}

export default verifySignatureAppRouter(handler);
