import { kv } from "@vercel/kv";
import { Client } from "@upstash/qstash";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const qstash = new Client({ token: process.env.QSTASH_TOKEN });

function kvEnvMissing() {
  return !process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN;
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
      const data = await kv.get(`user:${wallet}`);
      return res.status(200).json(
        data || { wallet, username: null, score: 0, tokens: 0 }
      );
    }

    if (req.method === "POST") {
      // Defensive: ensure req.body is an object
      const body = typeof req.body === "object" && req.body ? req.body : {};

      const existing = (await kv.get(`user:${wallet}`)) || {
        wallet,
        username: null,
        score: 0,
        tokens: 0,
      };

      // Save username
      if (body.username) {
        existing.username = body.username;
      }

      // Update score & tokens (take highest score)
      if (typeof body.score === "number") {
        existing.score = Math.max(existing.score, body.score);
        existing.tokens = (existing.tokens || 0) + (body.tokens || 0);
      }

      // Save user data
      await kv.set(`user:${wallet}`, existing);

      // Use QStash to update leaderboard asynchronously
      await qstash.publishJSON({
        url: `${process.env.VERCEL_URL || "http://localhost:3000"}/api/update-leaderboard`,
        body: {
          wallet: existing.wallet,
          username: existing.username,
          score: existing.score,
          tokens: existing.tokens,
        },
      });

      return res.status(200).json(existing);
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    console.error("User API error:", err);
    return res.status(500).json({ error: "internal server error" });
  }
}