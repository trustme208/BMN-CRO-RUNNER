// src/App.tsx
import React, { useEffect, useState } from "react";
import Game from "./components/Game";
import UIOverlay from "./components/UIOverlay";
import { walletService } from "./services/wallet";
import { GameState, GameStats } from "./types";
import * as api from "./services/api";

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>("START");
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    tokensCollected: 0,
  });

  const [address, setAddress] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Load leaderboard on start
  useEffect(() => {
    api.getLeaderboard().then(setLeaderboard).catch(console.error);
  }, []);

  // Load saved high-score from localStorage (unchanged)
  useEffect(() => {
    const saved = localStorage.getItem("bmn_runner_highscore");
    if (saved) {
      setStats((p) => ({ ...p, highScore: parseInt(saved, 10) }));
    }
  }, []);

  // Save new high-score
  useEffect(() => {
    if (stats.score > stats.highScore) {
      localStorage.setItem("bmn_runner_highscore", stats.score.toString());
    }
  }, [stats.score, stats.highScore]);

  // ───── WALLET ─────
  const connectWallet = async () => {
    try {
      await walletService.switchToCronos();
      const addr = await walletService.connect();
      setAddress(addr);

      // try to load username from server
      const user = await api.getUser(addr);
      if (user?.username) setUsername(user.username);
    } catch (e) {
      console.error(e);
      alert("Wallet connection failed – do you have MetaMask / Crypto.com DeFi Wallet?");
    }
  };

  // ───── USERNAME ─────
  const saveUsername = async (name: string) => {
    if (!address) return;
    await api.createOrUpdateUser(address, name);
    setUsername(name);
    api.getLeaderboard().then(setLeaderboard);
  };

  // ───── SCORE → SERVER ─────
  const handleScoreUpdate = async (newStats: GameStats) => {
    setStats(newStats);

    // send to server so leaderboard stays live
    if (address) {
      await api.updateUserScore(address, newStats.score, newStats.tokensCollected);
      // refresh leaderboard every 5 points so it feels alive
      if (newStats.score % 5 === 0) {
        api.getLeaderboard().then(setLeaderboard);
      }
    }
  };

  // ───── RESTART / START ─────
  const startGame = () => setGameState("PLAYING");
  const restartGame = () => setGameState("PLAYING");

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-cronos-dark">
      <Game
        gameState={gameState}
        setGameState={setGameState}
        onScoreUpdate={handleScoreUpdate}
      />

      <UIOverlay
        gameState={gameState}
        stats={stats}
        address={address}
        username={username}
        leaderboard={leaderboard}
        onConnectWallet={connectWallet}
        onSaveUsername={saveUsername}
        onStart={startGame}
        onRestart={restartGame}
      />
    </div>
  );
};

export default App;