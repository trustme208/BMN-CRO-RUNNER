import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, GameStats, Obstacle, Collectible, Particle } from '../types';
import {
  GRAVITY,
  MOVEMENT_SPEED,
  OBSTACLE_SPACING,
  OBSTACLE_WIDTH,
  OBSTACLE_GAP,
  COLORS,
  PARTICLE_COUNT,
  SPAWN_TOKEN_CHANCE
} from '../constants';
import { audioService } from '../services/audioService';

// IMPORTANT: put these files in src/assets/
// character.png = the player sprite (centered on the character)
// coin_logo.png = collectible icon
import characterSrc from '../assets/character.png';
import coinLogo from '../assets/coin_logo.png';

interface GameProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onScoreUpdate: (stats: GameStats) => void;
}

const Game: React.FC<GameProps> = ({ gameState, setGameState, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);

  // Mutable refs for performance
  const statsRef = useRef<GameStats>({ score: 0, highScore: 0, tokensCollected: 0 });
  const playerRef = useRef({ x: 50, y: 300, vy: 0, radius: 28, rotation: 0 });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const bgStarsRef = useRef<{ x: number; y: number; size: number; speed: number }[]>([]);

  // Images
  const characterImageRef = useRef<HTMLImageElement>(new Image());
  const coinImageRef = useRef<HTMLImageElement>(new Image());
  const characterLoadedRef = useRef(false);
  const coinLoadedRef = useRef(false);

  // Set sources once
  useEffect(() => {
    const cimg = characterImageRef.current;
    cimg.src = characterSrc as string;
    cimg.onload = () => {
      characterLoadedRef.current = true;
      // Optionally adjust Player radius based on image natural size
      // We'll keep radius as set but can be adjusted later dynamically
    };

    const kimg = coinImageRef.current;
    kimg.src = coinLogo as string;
    kimg.onload = () => {
      coinLoadedRef.current = true;
    };
  }, []);

  // Initialize stars for background parallax
  const initStars = (width: number, height: number) => {
    const stars: { x: number; y: number; size: number; speed: number }[] = [];
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

    const lastX =
      obstaclesRef.current.length > 0 ? obstaclesRef.current[obstaclesRef.current.length - 1].x : canvasWidth;

    const newX = Math.max(lastX + OBSTACLE_SPACING, canvasWidth);

    obstaclesRef.current.push({
      x: newX,
      topHeight,
      bottomY: topHeight + OBSTACLE_GAP,
      width: OBSTACLE_WIDTH,
      passed: false,
      type: Math.random() > 0.8 ? 'NFT_CARD' : 'BLOCK'
    });

    if (Math.random() < SPAWN_TOKEN_CHANCE) {
      collectiblesRef.current.push({
        x: newX + OBSTACLE_WIDTH / 2,
        y: topHeight + OBSTACLE_GAP / 2,
        radius: 18,
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
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
        size: Math.random() * 3 + 1
      });
    }
  };

  const resetGame = (canvas: HTMLCanvasElement) => {
    // set player start relative to canvas
    playerRef.current = { x: canvas.width * 0.2, y: canvas.height / 2, vy: 0, radius: Math.max(22, Math.min(40, canvas.width * 0.06)), rotation: 0 };
    obstaclesRef.current = [];
    collectiblesRef.current = [];
    particlesRef.current = [];
    statsRef.current = { score: 0, highScore: statsRef.current.highScore, tokensCollected: 0 };
    frameCountRef.current = 0;

    // Pre-seed obstacles so first screen isn't empty
    spawnObstacle(canvas.width, canvas.height);
    spawnObstacle(canvas.width, canvas.height);
    spawnObstacle(canvas.width, canvas.height);

    onScoreUpdate(statsRef.current);
  };

  // Jump handler (reduced jump for mobile friendliness)
  const jump = useCallback(() => {
    if (gameState === 'PLAYING') {
      // Make jump scaled to device via radius
      const baseJump = -6.0;
      playerRef.current.vy = baseJump;
      audioService.playJump();
    } else if (gameState === 'START' || gameState === 'GAME_OVER') {
      const canvas = canvasRef.current;
      if (canvas) {
        resetGame(canvas);
        setGameState('PLAYING');
        audioService.init();
      }
    }
  }, [gameState, setGameState, onScoreUpdate]);

  // Input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    const handleTouchStart = (e: TouchEvent) => {
      // keep it simple — a touch == jump
      jump();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('mousedown', jump);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('mousedown', jump);
    };
  }, [jump]);

  // Main update loop (uses delta-time so mobile/desktop speeds match)
  const update = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // compute deltaTime factor relative to 60fps (16.666ms)
      const deltaTime = lastTimeRef.current ? (time - lastTimeRef.current) / 16.666 : 1;
      lastTimeRef.current = time;

      frameCountRef.current++;

      // Game logic when playing
      if (gameState === 'PLAYING') {
        // Player physics
        const player = playerRef.current;
        player.vy += GRAVITY * deltaTime * 0.6; // gentler gravity for mobile
        player.y += player.vy * deltaTime;
        player.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, player.vy * 0.08));

        // Floor collision
        if (player.y + player.radius > canvas.height) {
          player.y = canvas.height - player.radius;
          setGameState('GAME_OVER');
          audioService.playCrash();
          spawnParticles(player.x, player.y, COLORS.player);
        }
        // Ceiling clamp
        if (player.y < -100) {
          player.y = -100;
          player.vy = 0;
        }

        // Spawn obstacles if needed
        if (obstaclesRef.current.length === 0 || obstaclesRef.current[obstaclesRef.current.length - 1].x < canvas.width - OBSTACLE_SPACING) {
          spawnObstacle(canvas.width, canvas.height);
        }

        // Move obstacles, collision detection and scoring
        obstaclesRef.current.forEach((obs) => {
          obs.x -= MOVEMENT_SPEED * deltaTime;

          // AABB vs circle approximation
          if (player.x + player.radius > obs.x && player.x - player.radius < obs.x + obs.width) {
            if (player.y - player.radius < obs.topHeight || player.y + player.radius > obs.bottomY) {
              setGameState('GAME_OVER');
              audioService.playCrash();
              spawnParticles(player.x, player.y, COLORS.player);
            }
          }

          // Score
          if (!obs.passed && player.x > obs.x + obs.width) {
            obs.passed = true;
            statsRef.current.score += 1;
            statsRef.current.highScore = Math.max(statsRef.current.score, statsRef.current.highScore);
            onScoreUpdate({ ...statsRef.current });
          }
        });

        // Clean up obstacles
        obstaclesRef.current = obstaclesRef.current.filter((o) => o.x + o.width > -200);

        // Collectibles movement and pickup
        collectiblesRef.current.forEach((col) => {
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
        collectiblesRef.current = collectiblesRef.current.filter((c) => c.x > -100 && !c.collected);

        // Particles update
        particlesRef.current.forEach((p) => {
          p.x += p.vx * deltaTime;
          p.y += p.vy * deltaTime;
          p.life -= 0.02 * deltaTime;
          p.vy += 0.1 * deltaTime;
        });
        particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
      }

      // --- RENDER ---
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars background
      ctx.fillStyle = '#FFF';
      bgStarsRef.current.forEach((star) => {
        if (gameState === 'PLAYING') {
          star.x -= star.speed * deltaTime;
          if (star.x < 0) star.x = canvas.width;
        }
        ctx.globalAlpha = Math.random() * 0.5 + 0.25;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Grid floor
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const timeOffset = (frameCountRef.current * MOVEMENT_SPEED) % 50;
      for (let i = 0; i < canvas.width + 50; i += 50) {
        const x = i - timeOffset;
        if (x >= 0 && x <= canvas.width) {
          ctx.moveTo(x, canvas.height - 100);
          ctx.lineTo(x, canvas.height);
        }
      }
      ctx.moveTo(0, canvas.height - 50);
      ctx.lineTo(canvas.width, canvas.height - 50);
      ctx.stroke();

      // Draw obstacles
      obstaclesRef.current.forEach((obs) => {
        ctx.shadowBlur = 10;
        ctx.shadowColor = COLORS.obstacleBorder;
        ctx.fillStyle = COLORS.obstacleFill;
        ctx.strokeStyle = COLORS.obstacleBorder;
        ctx.lineWidth = 2;
        ctx.fillRect(obs.x, 0, obs.width, obs.topHeight);
        ctx.strokeRect(obs.x, 0, obs.width, obs.topHeight);
        ctx.fillRect(obs.x, obs.bottomY, obs.width, canvas.height - obs.bottomY);
        ctx.strokeRect(obs.x, obs.bottomY, obs.width, canvas.height - obs.bottomY);

        // decoration lines
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#4ade80';
        for (let i = 10; i < obs.topHeight - 10; i += 20) ctx.fillRect(obs.x + 10, i, obs.width - 20, 2);
        for (let i = obs.bottomY + 10; i < canvas.height - 10; i += 20) ctx.fillRect(obs.x + 10, i, obs.width - 20, 2);
        ctx.globalAlpha = 1.0;
      });

      // Draw collectibles - coin image
      collectiblesRef.current.forEach((col) => {
        const floatY = Math.sin(frameCountRef.current * 0.1 + col.floatOffset) * 5;
        const size = col.radius * 2;
        if (coinLoadedRef.current) {
          ctx.save();
          ctx.translate(col.x - col.radius, col.y + floatY - col.radius);
          // Optional: give small rotation / bob
          ctx.drawImage(coinImageRef.current, 0, 0, size, size);
          ctx.restore();
        } else {
          // fallback circle
          ctx.shadowBlur = 12;
          ctx.shadowColor = COLORS.tokenOuter;
          ctx.fillStyle = COLORS.tokenOuter;
          ctx.beginPath();
          ctx.arc(col.x, col.y + floatY, col.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw player sprite (replace circle)
      {
        const p = playerRef.current;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // compute drawing size: ensure image fits inside player.radius * 2
        const drawSize = p.radius * 2;
        if (characterLoadedRef.current) {
          // Draw character centered on player position with the same drawSize
          ctx.drawImage(characterImageRef.current, -drawSize / 2, -drawSize / 2, drawSize, drawSize);

          // subtle shadow/glow
          ctx.shadowBlur = 20;
          ctx.shadowColor = COLORS.playerShadow;
        } else {
          // fallback circle if image not loaded
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
        }
        ctx.restore();
      }

      // Particles
      particlesRef.current.forEach((pt) => {
        ctx.globalAlpha = pt.life;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Schedule next frame
      requestRef.current = requestAnimationFrame(update);
    },
    [gameState, onScoreUpdate]
  );

  // Setup / resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // set reasonable player radius based on new size
      playerRef.current.radius = Math.max(22, Math.min(40, canvas.width * 0.06));
      if (bgStarsRef.current.length === 0) initStars(canvas.width, canvas.height);
    };

    window.addEventListener('resize', resize);
    resize();

    // Start loop
    requestRef.current = requestAnimationFrame(update);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  return <canvas ref={canvasRef} className="block w-full h-full" />;
};

export default Game;
