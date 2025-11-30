import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, GameStats, Obstacle, Collectible, Particle } from '../types';
import { 
  GRAVITY, MOVEMENT_SPEED, OBSTACLE_SPACING, OBSTACLE_WIDTH, OBSTACLE_GAP, COLORS, PARTICLE_COUNT, SPAWN_TOKEN_CHANCE 
} from '../constants';
import { audioService } from '../services/audioService';
import coinLogo from '../assets/coin_logo.png'; // Make sure this exists in src/assets/

interface GameProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onScoreUpdate: (stats: GameStats) => void;
}

const Game: React.FC<GameProps> = ({ gameState, setGameState, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Refs for game state
  const statsRef = useRef<GameStats>({ score: 0, highScore: 0, tokensCollected: 0 });
  const playerRef = useRef({ x: 50, y: 300, vy: 0, radius: 18, rotation: 0 });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const bgStarsRef = useRef<{x: number, y: number, size: number, speed: number}[]>([]);

  const coinImageRef = useRef<HTMLImageElement>(new Image());
  coinImageRef.current.src = coinLogo;

  // Initialize stars
  const initStars = (width: number, height: number) => {
    const stars = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.1
      });
    }
    bgStarsRef.current = stars;
  };

  const spawnObstacle = (canvasWidth: number, canvasHeight: number) => {
    const minHeight = 50;
    const maxHeight = canvasHeight - OBSTACLE_GAP - minHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    const lastX = obstaclesRef.current.length > 0 
      ? obstaclesRef.current[obstaclesRef.current.length - 1].x 
      : canvasWidth;

    const newX = Math.max(lastX + OBSTACLE_SPACING, canvasWidth);

    obstaclesRef.current.push({
      x: newX,
      topHeight,
      bottomY: topHeight + OBSTACLE_GAP,
      width: OBSTACLE_WIDTH,
      passed: false,
      type: Math.random() > 0.8 ? 'NFT_CARD' : 'BLOCK'
    });

    // Chance to spawn collectible
    if (Math.random() < SPAWN_TOKEN_CHANCE) {
      collectiblesRef.current.push({
        x: newX + OBSTACLE_WIDTH / 2,
        y: topHeight + OBSTACLE_GAP / 2,
        radius: 16,
        collected: false,
        type: 'TOKEN',
        floatOffset: Math.random() * Math.PI * 2
      });
    }
  };

  const spawnParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
        size: Math.random() * 3 + 1
      });
    }
  };

  const resetGame = (canvas: HTMLCanvasElement) => {
    playerRef.current = { x: canvas.width * 0.2, y: canvas.height / 2, vy: 0, radius: 18, rotation: 0 };
    obstaclesRef.current = [];
    collectiblesRef.current = [];
    particlesRef.current = [];
    statsRef.current = { score: 0, highScore: statsRef.current.highScore, tokensCollected: 0 };
    frameCountRef.current = 0;
    spawnObstacle(canvas.width, canvas.height);
    spawnObstacle(canvas.width, canvas.height);
    spawnObstacle(canvas.width, canvas.height);
    onScoreUpdate(statsRef.current);
  };

  const jump = useCallback(() => {
    if (gameState === 'PLAYING') {
      playerRef.current.vy = -5; // Reduced jump for easier mobile control
      audioService.playJump();
    } else if (gameState === 'START' || gameState === 'GAME_OVER') {
      const canvas = canvasRef.current;
      if (canvas) {
        resetGame(canvas);
        setGameState('PLAYING');
        audioService.init();
      }
    }
  }, [gameState, setGameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    const handleTouchStart = () => jump();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('mousedown', jump);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('mousedown', jump);
    };
  }, [jump]);

  const update = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let deltaTime = lastTimeRef.current ? (time - lastTimeRef.current) / 16.666 : 1;
    lastTimeRef.current = time;

    frameCountRef.current++;

    if (gameState === 'PLAYING') {
      // Player physics
      const player = playerRef.current;
      player.vy += GRAVITY * deltaTime * 0.6; // gentler gravity
      player.y += player.vy * deltaTime;
      player.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, player.vy * 0.1));

      if (player.y + player.radius > canvas.height) {
        player.y = canvas.height - player.radius;
        setGameState('GAME_OVER');
        audioService.playCrash();
        spawnParticles(player.x, player.y, COLORS.player);
      }
      if (player.y < -100) { player.y = -100; player.vy = 0; }

      // Obstacles
      if (obstaclesRef.current.length === 0 || obstaclesRef.current[obstaclesRef.current.length - 1].x < canvas.width - OBSTACLE_SPACING) {
        spawnObstacle(canvas.width, canvas.height);
      }

      obstaclesRef.current.forEach(obs => {
        obs.x -= MOVEMENT_SPEED * deltaTime;

        if (player.x + player.radius > obs.x && player.x - player.radius < obs.x + obs.width) {
          if (player.y - player.radius < obs.topHeight || player.y + player.radius > obs.bottomY) {
            setGameState('GAME_OVER');
            audioService.playCrash();
            spawnParticles(player.x, player.y, COLORS.player);
          }
        }

        if (!obs.passed && player.x > obs.x + obs.width) {
          obs.passed = true;
          statsRef.current.score += 1;
          statsRef.current.highScore = Math.max(statsRef.current.score, statsRef.current.highScore);
          onScoreUpdate({ ...statsRef.current });
        }
      });

      obstaclesRef.current = obstaclesRef.current.filter(obs => obs.x + obs.width > -100);

      // Collectibles
      collectiblesRef.current.forEach(col => {
        col.x -= MOVEMENT_SPEED * deltaTime;
        const floatY = Math.sin(frameCountRef.current * 0.1 + col.floatOffset) * 5;
        const dx = player.x - col.x;
        const dy = player.y - (col.y + floatY);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (!col.collected && dist < player.radius + col.radius) {
          col.collected = true;
          statsRef.current.tokensCollected += 1;
          statsRef.current.score += 5;
          audioService.playCollect();
          spawnParticles(col.x, col.y, COLORS.tokenOuter);
          onScoreUpdate({ ...statsRef.current });
        }
      });
      collectiblesRef.current = collectiblesRef.current.filter(col => col.x > -50 && !col.collected);

      // Particles
      particlesRef.current.forEach(p => {
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.life -= 0.02 * deltaTime;
        p.vy += 0.1 * deltaTime;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    }

    // --- Render ---
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = '#FFF';
    bgStarsRef.current.forEach(star => {
      if (gameState === 'PLAYING') {
        star.x -= star.speed * deltaTime;
        if (star.x < 0) star.x = canvas.width;
      }
      ctx.globalAlpha = Math.random() * 0.5 + 0.3;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Obstacles
    obstaclesRef.current.forEach(obs => {
      ctx.shadowBlur = 10;
      ctx.shadowColor = COLORS.obstacleBorder;
      ctx.fillStyle = COLORS.obstacleFill;
      ctx.strokeStyle = COLORS.obstacleBorder;
      ctx.lineWidth = 2;
      ctx.fillRect(obs.x, 0, obs.width, obs.topHeight);
      ctx.strokeRect(obs.x, 0, obs.width, obs.topHeight);
      ctx.fillRect(obs.x, obs.bottomY, obs.width, canvas.height - obs.bottomY);
      ctx.strokeRect(obs.x, obs.bottomY, obs.width, canvas.height - obs.bottomY);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#4ade80';
      for (let i = 10; i < obs.topHeight - 10; i += 20) ctx.fillRect(obs.x + 10, i, obs.width - 20, 2);
      for (let i = obs.bottomY + 10; i < canvas.height - 10; i += 20) ctx.fillRect(obs.x + 10, i, obs.width - 20, 2);
      ctx.globalAlpha = 1.0;
    });

    // Collectibles (Coin Logo)
    collectiblesRef.current.forEach(col => {
      const floatY = Math.sin(frameCountRef.current * 0.1 + col.floatOffset) * 5;
      ctx.drawImage(coinImageRef.current, col.x - col.radius, col.y + floatY - col.radius, col.radius*2, col.radius*2);
    });

    // Player
    const p = playerRef.current;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.playerShadow;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0.5 * Math.PI, 1.5 * Math.PI);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00A3FF';
    ctx.beginPath();
    ctx.moveTo(-p.radius, 5);
    ctx.lineTo(-p.radius - 15 - Math.random() * 10, 0);
    ctx.lineTo(-p.radius, -5);
    ctx.fill();
    ctx.restore();

    // Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    requestRef.current = requestAnimationFrame(update);
  }, [gameState, onScoreUpdate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (!bgStarsRef.current.length) initStars(canvas.width, canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();
    requestRef.current = requestAnimationFrame(update);
    return () => {
      window.removeEventListener('resize', resize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  return <canvas ref={canvasRef} className="block w-full h-full" />;
};

export default Game;
