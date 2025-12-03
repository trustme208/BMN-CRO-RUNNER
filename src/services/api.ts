// src/services/api.ts

const API_BASE = typeof window !== 'undefined' && window.location ? window.location.origin : '';

export const getLeaderboard = async () => {
  const r = await fetch(`${API_BASE}/api/leaderboard`);
  return (await r.json()) as any[];
};

export const fetchLeaderboard = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/leaderboard`);
    if (!response.ok) {
      console.error(`Leaderboard fetch failed: ${response.status}`);
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return [];
  }
};

export const fetchUser = async (wallet: string) => {
  try {
    const response = await fetch(`${API_BASE}/api/user?wallet=${wallet}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }
};

export const saveUsername = async (wallet: string, username: string) => {
  try {
    const response = await fetch(`${API_BASE}/api/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, username }),
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to save username:", error);
    return false;
  }
};

export const updateScore = async (wallet: string, score: number, tokens: number) => {
  try {
    const response = await fetch(`${API_BASE}/api/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, score, tokens }),
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to update score:", error);
    return false;
  }
};