import React from 'react';
import { GameState, GameStats } from '../types';

interface UIOverlayProps {
  gameState: GameState;
  stats: GameStats;
  onStart: () => void;
  onRestart: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ gameState, stats, onStart, onRestart }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      <div className="flex justify-between items-start w-full">
        <div className="flex flex-col gap-1">
          <h1 className="text-white font-bold text-xl tracking-wider drop-shadow-lg font-mono">
            BLACK MOON
            <span className="text-xs ml-2 text-cronos-glow font-normal opacity-80">RUNNER</span>
          </h1>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
             <span className="text-xs text-gray-400 font-mono">CRONOS MAINNET</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="bg-cronos-blue/80 border border-cronos-glow/30 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-3 pointer-events-auto">
             <span className="text-cronos-accent text-xs font-mono uppercase">Score</span>
             <span className="text-white font-bold text-2xl font-mono">{stats.score}</span>
          </div>
          <div className="flex items-center gap-2 text-bmn-gold text-sm font-mono font-bold bg-black/40 px-2 py-1 rounded pointer-events-auto">
             <span>● BMN</span>
             <span>{stats.tokensCollected}</span>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        {gameState === 'START' && (
          <div className="bg-cronos-dark/90 border border-cronos-glow/50 p-8 rounded-2xl backdrop-blur-md shadow-2xl text-center max-w-sm mx-4 transform transition-all animate-fadeIn">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-black border-2 border-white shadow-[0_0_30px_rgba(0,163,255,0.5)] flex items-center justify-center overflow-hidden relative">
                  <div className="absolute w-16 h-16 rounded-full bg-slate-900 -right-4 top-2"></div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Ready for Liftoff?</h2>
            <p className="text-gray-400 text-sm mb-6">
              Tap or Space to fly. Collect BMN tokens and dodge the blockchain blocks.
            </p>
            <button onClick={onStart} className="group relative px-8 py-3 bg-transparent overflow-hidden rounded-full border border-cronos-glow/50 transition-all hover:border-cronos-glow hover:shadow-[0_0_20px_rgba(0,163,255,0.4)]">
              <div className="absolute inset-0 w-0 bg-cronos-glow transition-all duration-[250ms] ease-out group-hover:w-full opacity-10"></div>
              <span className="relative text-white font-bold tracking-widest uppercase">Start Engine</span>
            </button>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="bg-red-900/10 border border-red-500/50 p-8 rounded-2xl backdrop-blur-md shadow-2xl text-center max-w-sm mx-4 animate-in fade-in zoom-in duration-300">
            <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">CRITICAL FAILURE</h2>
            <p className="text-red-300 text-sm mb-6 font-mono">SMART CONTRACT REVERTED</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex flex-col bg-black/40 p-3 rounded">
                <span className="text-xs text-gray-400 uppercase">Score</span>
                <span className="text-2xl text-white font-bold">{stats.score}</span>
              </div>
              <div className="flex flex-col bg-black/40 p-3 rounded border border-bmn-gold/30">
                <span className="text-xs text-bmn-gold uppercase">High Score</span>
                <span className="text-2xl text-bmn-gold font-bold">{stats.highScore}</span>
              </div>
            </div>

            <button onClick={onRestart} className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest rounded hover:bg-gray-200 transition-colors">
              Re-Deploy
            </button>
          </div>
        )}
      </div>

      <div className="text-center pb-4 opacity-50 text-xs text-white font-mono pointer-events-none">
        {gameState === 'PLAYING' ? 'TAP SCREEN OR PRESS SPACE TO FLY' : 'POWERED BY CRONOS'}
      </div>
    </div>
  );
};

export default UIOverlay;
