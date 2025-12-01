// src/services/api.ts

const API = ""; // Vercel gives /api automatically

export const getLeaderboard = async () => {
  const r = await fetch(`${API}/api/leaderboard`);
  return (await r.json()) as any[];
};

export const getUser = async (wallet: string) => {
  const r = await fetch(`${API}/api/user?wallet=${wallet}`);
  if (!r.ok) return null;
  return await r.json();
};

export const createOrUpdateUser = async (wallet: string, username: string) => {
  await fetch(`${API}/api/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet, username }),
  });
};

export const updateUserScore = async (wallet: string, score: number, tokens: number) => {
  await fetch(`${API}/api/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet, score, tokens }),
  });
};