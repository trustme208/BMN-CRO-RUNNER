// src/components/UIOverlay.tsx
import React, { useState } from "react";
import { GameState, GameStats } from "../types";

interface Props {
  gameState: GameState;
  stats: GameStats;
  address: string;
  username: string;
  leaderboard: any[];
  onConnectWallet: () => void;
  onSaveUsername: (name: string) => void;
  onStart: () => void;
  onRestart: () => void;
}

const UIOverlay: React.FC<Props> = ({
  gameState,
  stats,
  address,
  username,
  leaderboard,
  onConnectWallet,
  onSaveUsername,
  onStart,
  onRestart,
}) => {
  const [nameInput, setNameInput] = useState(username);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* TOP BAR */}
      <div className="absolute top-4 left-4 right- right-4 flex justify-between items-start pointer-events-auto">
        {/* Wallet */}
        <div className="bg-black/60 backdrop-blur border border-cronos-glow/30 rounded-lg px-4 py-2">
          {!address ? (
            <button
              onClick={onConnectWallet}
              className="text-white font-mono uppercase tracking-wider hover:text-cronos-glow transition"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="text-white font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
              {username && <span className="ml-3 text-cronos-glow">@{username}</span>}
            </div>
          )}
        </div>

        {/* Score */}
        <div className="bg-black/60 backdrop-blur border border-cronos-glow/30 rounded-lg px-5 py-3 text-right">
          <div className="text-cronos-accent text-xs uppercase">Score</div>
          <div className="text-white text-3xl font-bold font-mono">{stats.score}</div>
          <div className="text-bmn-gold text-sm">BMN {stats.tokensCollected}</div>
        </div>
      </div>

      {/* LEADERBOARD */}
      <div className="absolute right-4 top-24 bg-black/70 backdrop-blur-lg border border-cronos-glow/20 rounded-xl p-4 max-w-xs w-full pointer-events-auto">
        <h3 className="text-cronos-glow font-bold mb-3 text-center">LEADERBOARD</h3>
        <ol className="space-y-2 text-sm">
          {leaderboard.slice(0, 10).map((entry: any, i: number) => (
            <li key={i} className="flex justify-between">
              <span className={entry.wallet === address ? "text-cronos-glow font-bold" : "text-white"}>
                {i + 1}. {entry.username || `${entry.wallet.slice(0, 6)}...`}
              </span>
              <span className="text-bmn-gold font-mono">{entry.score}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* START SCREEN */}
      {gameState === "START" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
          <div className="bg-cronos-dark/95 border border-cronos-glow/50 rounded-2xl p-10 text-center max-w-md">
            <h1 className="text-4xl font-bold text-white mb-4">BLACK MOON RUNNER</h1>
            <p className="text-gray-300 mb-8">
              Tap / Space to fly • Collect BMN tokens • Survive forever
            </p>

            {!address ? (
              <button
                onClick={onConnectWallet}
                className="px-8 py-4 bg-cronos-glow/20 border-2 border-cronos-glow rounded-full text-white font-bold uppercase tracking-widest hover:bg-cronos-glow/40 transition"
              >
                Connect Cronos Wallet
              </button>
            ) : !username ? (
              <div className="flex flex-col gap-4 items-center">
                <input
                  type="text"
                  placeholder="Choose username"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="px-4 py-2 bg-black/60 border border-gray-600 rounded text-white"
                />
                <button
                  onClick={() => onSaveUsername(nameInput)}
                  className="px-6 py-2 bg-cronos-glow text-black font-bold rounded"
                >
                  Save & Play
                </button>
              </div>
            ) : null}

            {(address && username) && (
              <button
                onClick={onStart}
                className="mt-8 px-12 py-4 bg-gradient-to-r from-cronos-glow to-bmn-neon text-black font-bold text-xl rounded-full uppercase tracking-widest"
              >
                ► START GAME
              </button>
            )}
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === "GAME_OVER" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
          <div className="bg-red-900/80 border border-red-500 rounded-2xl p-10 text-center">
            <h2 className="text-5xl font-black text-white mb-4">GAME OVER</h2>
            <div className="text-3xl text-bmn-gold mb-8">Score: {stats.score}</div>
            <button
              onClick={onRestart}
              className="px-10 py-4 bg-white text-black font-bold text-xl rounded-full uppercase"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Bottom hint */}
      <div className="absolute bottom-6 left-0 right-0 text-center text-white/60 text-sm font-mono pointer-events-none">
        {gameState === "PLAYING" ? "TAP OR SPACE TO FLY" : "POWERED BY CRONOS CHAIN"}
      </div>
    </div>
  );
};

export default UIOverlay;