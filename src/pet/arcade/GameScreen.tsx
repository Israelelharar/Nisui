import { Suspense } from 'react';
import { gameById } from './registry';
import { ArcadeIcon } from './icons';
import type { GameLook, GameResult } from './kit';

/** Loads a game (each one is its own small file) and shows its box while it comes. */
export function GameScreen({ id, look, level, onEnd, onClose }: { id: string; look: GameLook; level: number; onEnd: (r: GameResult) => void; onClose: () => void }) {
  const info = gameById(id);
  if (!info) return null;
  const { Component } = info;
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3" style={{ background: info.color }}>
          <span className="arcade-float">
            <ArcadeIcon name={info.icon} size={84} />
          </span>
          <span className="font-hand text-[18px] text-ink/70">{info.name}…</span>
        </div>
      }
    >
      <Component key={`${id}:${level}`} look={look} level={level} onEnd={onEnd} onClose={onClose} />
    </Suspense>
  );
}
