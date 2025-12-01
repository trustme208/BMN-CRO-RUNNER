// api/leaderboard.ts
import { kv } from "@vercel/kv";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(_: VercelRequest, res: VercelResponse) {
  try {
    const keys = await kv.keys("user:*");
    const users = [];

    for (const key of keys) {
      const u = await kv.get(key);
      if (u) users.push(u);
    }

    users.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
    res.status(200).json(users.slice(0, 50));
  } catch (e) {
    res.status(500).json({ error: "db error" });
  }
}