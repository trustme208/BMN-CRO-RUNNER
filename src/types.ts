export interface Vector { x: number; y: number; }

export interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }

export interface Obstacle {
  x: number;
  topHeight: number;
  bottomY: number;
  width: number;
  passed: boolean;
  type: 'BLOCK' | 'NFT_CARD';
}

export interface Collectible {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  type: 'TOKEN' | 'POWERUP';
  floatOffset: number;
  rotation?: number;
  rotationSpeed?: number;
}

export type GameState = 'START' | 'PLAYING' | 'GAME_OVER';

export interface GameStats { score: number; highScore: number; tokensCollected: number; }
