import { kv } from "@vercel/kv";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function kvEnvMissing() {
  return !process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN;
}

interface UserData {
  wallet: string;
  username: string | null;
  score: number;
  tokens: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (kvEnvMissing()) {
    console.error(
      "User API error: Missing KV_REST_API_URL or KV_REST_API_TOKEN environment variables."
    );
    return res
      .status(500)
      .json({ error: "User API unavailable: server misconfigured" });
  }

  const wallet = (req.query.wallet as string || req.body?.wallet)?.toLowerCase();

  if (!wallet) {
    return res.status(400).json({ error: "missing wallet address" });
  }

  try {
    if (req.method === "GET") {
      const data = await kv.get<UserData>(`user:${wallet}`);
      return res.status(200).json(
        data || { wallet, username: null, score: 0, tokens: 0 }
      );
    }

    if (req.method === "POST") {
      const body = (typeof req.body === "object" && req.body ? req.body : {}) as Record<string, unknown>;

      const existing = ((await kv.get<UserData>(`user:${wallet}`)) || {
        wallet,
        username: null,
        score: 0,
        tokens: 0,
      }) as UserData;

      if (body.username) {
        existing.username = body.username as string;
      }

      if (typeof body.score === "number") {
        existing.score = Math.max(existing.score, body.score);
        existing.tokens = (existing.tokens || 0) + (typeof body.tokens === "number" ? body.tokens : 0);
      }

      await kv.set(`user:${wallet}`, existing);

      const data = await kv.get<LeaderboardEntry[]>("leaderboard");
      let leaderboard = Array.isArray(data) ? data : [];

      leaderboard = leaderboard.filter((entry) => entry.wallet !== wallet);

      leaderboard.push({
        wallet: existing.wallet,
        username: existing.username,
        score: existing.score,
        tokens: existing.tokens,
      });

      leaderboard.sort((a, b) => b.score - a.score);
      leaderboard = leaderboard.slice(0, 100);

      await kv.set("leaderboard", leaderboard);

      return res.status(200).json(existing);
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    console.error("User API error:", err);
    return res.status(500).json({ error: "internal server error" });
  }
}

interface LeaderboardEntry {
  wallet: string;
  username: string | null;
  score: number;
  tokens: number;
}