// api/user.ts
import { kv } from "@vercel/kv";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const wallet = (req.query.wallet as string || req.body?.wallet)?.toLowerCase();

  if (req.method === "GET" && wallet) {
    const data = await kv.get(`user:${wallet}`);
    return res.status(200).json(data || { wallet, username: null, score: 0, tokens: 0 });
  }

  if (req.method === "POST" && wallet) {
    const existing = (await kv.get(`user:${wallet}`)) || { wallet, username: null, score: 0, tokens: 0 };

    // Save username
    if (req.body.username) existing.username = req.body.username;

    // Update score & tokens (we take the highest score seen)
    if (typeof req.body.score === "number") {
      existing.score = Math.max(existing.score, req.body.score);
      existing.tokens = (existing.tokens || 0) + (req.body.tokens || 0);
    }

    await kv.set(`user:${wallet}`, existing);
    return res.status(200).json(existing);
  }

  res.status(400).json({ error: "bad request" });
}