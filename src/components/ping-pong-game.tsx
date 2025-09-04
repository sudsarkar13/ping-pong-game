"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Pause, Play } from 'lucide-react';

// Game constants
const GAME_WIDTH = 1000;
const GAME_HEIGHT = 700;
const PLAYER_PADDLE_WIDTH = 10;
const PLAYER_PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;
const WINNING_SCORE = 5;

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_SETTINGS: Record<Difficulty, { aiSpeed: number; aiPaddleHeight: number }> = {
  easy: { aiSpeed: 3, aiPaddleHeight: 100 },
  medium: { aiSpeed: 4, aiPaddleHeight: 80 },
  hard: { aiSpeed: 6, aiPaddleHeight: 60 },
};

const PingPongGame = () => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const [paddleY, setPaddleY] = useState(GAME_HEIGHT / 2 - PLAYER_PADDLE_HEIGHT / 2);
  const [aiPaddleY, setAiPaddleY] = useState(GAME_HEIGHT / 2 - DIFFICULTY_SETTINGS[difficulty].aiPaddleHeight / 2);
  
  const [ball, setBall] = useState({
    x: GAME_WIDTH / 2 - BALL_SIZE / 2,
    y: GAME_HEIGHT / 2 - BALL_SIZE / 2,
    dx: 4,
    dy: 4,
  });

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | undefined>(undefined);

  const resetGame = () => {
    setScore({ player: 0, ai: 0 });
    setPaddleY(GAME_HEIGHT / 2 - PLAYER_PADDLE_HEIGHT / 2);
    setAiPaddleY(GAME_HEIGHT / 2 - DIFFICULTY_SETTINGS[difficulty].aiPaddleHeight / 2);
    resetBall();
    setIsPaused(false);
    setGameState('playing');
  };

  const resetBall = (winner?: 'player' | 'ai') => {
    setBall({
      x: GAME_WIDTH / 2 - BALL_SIZE / 2,
      y: GAME_HEIGHT / 2 - BALL_SIZE / 2,
      dx: winner === 'player' ? 4 : -4, // Serve to the winner
      dy: Math.random() > 0.5 ? 4 : -4,
    });
  };

  useEffect(() => {
    if (gameState !== 'playing' || isPaused) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      return;
    }

    const gameLoop = () => {
      const { aiSpeed, aiPaddleHeight } = DIFFICULTY_SETTINGS[difficulty];

      setBall(prevBall => {
        let newBall = { ...prevBall };
        newBall.x += newBall.dx;
        newBall.y += newBall.dy;

        // Wall collision (top/bottom)
        if (newBall.y <= 0 || newBall.y >= GAME_HEIGHT - BALL_SIZE) {
          newBall.dy *= -1;
        }

        // Player paddle collision
        if (
          newBall.dx < 0 &&
          newBall.x <= PLAYER_PADDLE_WIDTH &&
          newBall.x > 0 &&
          newBall.y + BALL_SIZE >= paddleY &&
          newBall.y <= paddleY + PLAYER_PADDLE_HEIGHT
        ) {
          newBall.dx *= -1.05; // Increase speed slightly
          const deltaY = newBall.y - (paddleY + PLAYER_PADDLE_HEIGHT / 2);
          newBall.dy = deltaY * 0.2; // Add spin
        }

        // AI paddle collision
        if (
          newBall.dx > 0 &&
          newBall.x >= GAME_WIDTH - PLAYER_PADDLE_WIDTH - BALL_SIZE &&
          newBall.x < GAME_WIDTH - BALL_SIZE &&
          newBall.y + BALL_SIZE >= aiPaddleY &&
          newBall.y <= aiPaddleY + aiPaddleHeight
        ) {
          newBall.dx *= -1.05; // Increase speed slightly
        }
        
        return newBall;
      });

      // AI movement
      setAiPaddleY(prevAiY => {
        const aiCenter = prevAiY + aiPaddleHeight / 2;
        const ballCenter = ball.y + BALL_SIZE / 2;
        if (aiCenter < ballCenter - 10) {
          return Math.min(prevAiY + aiSpeed, GAME_HEIGHT - aiPaddleHeight);
        } else if (aiCenter > ballCenter + 10) {
          return Math.max(prevAiY - aiSpeed, 0);
        }
        return prevAiY;
      });

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameState, isPaused, ball.y, paddleY, aiPaddleY, difficulty]);

  useEffect(() => {
    if (gameState !== 'playing' || isPaused) return;

    // Score points
    if (ball.x < 0) { // AI scores
      setScore(s => ({ ...s, ai: s.ai + 1 }));
      if (score.ai + 1 >= WINNING_SCORE) {
        setGameState('gameover');
      } else {
        resetBall('ai');
      }
    } else if (ball.x > GAME_WIDTH) { // Player scores
      setScore(s => ({ ...s, player: s.player + 1 }));
      if (score.player + 1 >= WINNING_SCORE) {
        setGameState('gameover');
      } else {
        resetBall('player');
      }
    }
  }, [ball.x, gameState, isPaused, score.ai, score.player]);

  const handlePointerMove = (clientY: number) => {
    if (gameAreaRef.current) {
      const rect = gameAreaRef.current.getBoundingClientRect();
      const newY = clientY - rect.top - PLAYER_PADDLE_HEIGHT / 2;
      setPaddleY(Math.max(0, Math.min(newY, GAME_HEIGHT - PLAYER_PADDLE_HEIGHT)));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    handlePointerMove(e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    handlePointerMove(e.touches[0].clientY);
  };

  const DifficultySelector = () => (
    <div className="flex flex-col items-center gap-4">
        <h3 className="text-xl font-semibold text-white">Select Difficulty</h3>
        <ToggleGroup 
            type="single" 
            defaultValue={difficulty}
            onValueChange={(value: Difficulty) => {
                if (value) setDifficulty(value);
            }}
        >
            <ToggleGroupItem value="easy">Easy</ToggleGroupItem>
            <ToggleGroupItem value="medium">Medium</ToggleGroupItem>
            <ToggleGroupItem value="hard">Hard</ToggleGroupItem>
        </ToggleGroup>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-card rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-4">Ping Pong</h1>
      <div className="flex justify-between w-full max-w-[1000px] text-2xl font-mono mb-2">
        <span>Player: {score.player}</span>
        <span>AI: {score.ai}</span>
      </div>
      <div
        ref={gameAreaRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative bg-black border-4 border-gray-300 cursor-none overflow-hidden"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {gameState !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-black bg-opacity-70 z-10">
            {gameState === 'start' && (
                <>
                    <DifficultySelector />
                    <Button onClick={() => setGameState('playing')}>Start Game</Button>
                </>
            )}
            {gameState === 'gameover' && (
                <>
                    <h2 className="text-4xl font-bold text-white">
                        {score.player >= WINNING_SCORE ? 'You Win!' : 'Game Over'}
                    </h2>
                    <DifficultySelector />
                    <Button onClick={resetGame}>Play Again</Button>
                </>
            )}
          </div>
        )}
        {isPaused && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-black bg-opacity-70 z-10">
                <h2 className="text-4xl font-bold text-white">Paused</h2>
                <Button onClick={() => setIsPaused(false)}>Resume</Button>
            </div>
        )}
        {/* Dashed center line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-[10px] w-full bg-gray-500 mb-[10px]"></div>
          ))}
        </div>

        {/* Player Paddle */}
        <div
          className="absolute bg-white"
          style={{
            width: PLAYER_PADDLE_WIDTH,
            height: PLAYER_PADDLE_HEIGHT,
            left: 0,
            top: paddleY,
          }}
        />
        {/* AI Paddle */}
        <div
          className="absolute bg-white"
          style={{
            width: PLAYER_PADDLE_WIDTH,
            height: DIFFICULTY_SETTINGS[difficulty].aiPaddleHeight,
            right: 0,
            top: aiPaddleY,
          }}
        />
        {/* Ball */}
        <div
          className="absolute bg-white rounded-full"
          style={{
            width: BALL_SIZE,
            height: BALL_SIZE,
            left: ball.x,
            top: ball.y,
          }}
        />
      </div>
      <div className="w-full max-w-[1000px] flex justify-end mt-2">
        {gameState === 'playing' && (
            <Button variant="outline" onClick={() => setIsPaused(!isPaused)} className="w-28">
                {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                {isPaused ? 'Resume' : 'Pause'}
            </Button>
        )}
      </div>
    </div>
  );
};

export default PingPongGame;