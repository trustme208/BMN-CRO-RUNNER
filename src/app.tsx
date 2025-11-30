import React, { useState, useEffect } from 'react';
import Game from './components/Game';
import UIOverlay from './components/UIOverlay';
import { GameState, GameStats } from './types';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('START');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    tokensCollected: 0
  });

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('bmn_runner_highscore');
    if (saved) {
      setStats(prev => ({ ...prev, highScore: parseInt(saved, 10) }));
    }
  }, []);

  useEffect(() => {
    if (stats.score > stats.highScore) {
      localStorage.setItem('bmn_runner_highscore', stats.score.toString());
    }
  }, [stats.score, stats.highScore]);

  const handleStart = () => {
    audioService.init();
    setGameState('PLAYING');

    // Trigger resetGame in Game component
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (canvas) {
      const event = new Event('game-reset');
      canvas.dispatchEvent(event);
    }
  };

  const handleRestart = () => {
    setGameState('PLAYING');

    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (canvas) {
      const event = new Event('game-reset');
      canvas.dispatchEvent(event);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-cronos-dark">
      <Game 
        gameState={gameState} 
        setGameState={setGameState} 
        onScoreUpdate={setStats} 
      />
      <UIOverlay 
        gameState={gameState} 
        stats={stats} 
        onStart={handleStart} 
        onRestart={handleRestart} 
      />
    </div>
  );
};

export default App;
