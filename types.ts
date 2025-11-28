
export enum PuzzleType {
  PATH = 'PATH',
  SLIDE = 'SLIDE',
  MEMORY = 'MEMORY',
  LOCK = 'LOCK',
  FINAL = 'FINAL',
}

export interface LevelData {
  id: number;
  type: PuzzleType;
  title: string;
  instruction: string;
  rewardMessage: string;
  config?: any; // Specific config for the puzzle type
}

// Path Puzzle Types
export type PipeType = 'straight' | 'corner' | 'tee' | 'cross' | 'start' | 'end';
export interface PipeTile {
  id: string;
  type: PipeType;
  rotation: number; // 0, 90, 180, 270
  fixed: boolean;
  x: number;
  y: number;
  connected?: boolean; // For visual feedback
}

// Slide Puzzle Types
export interface SlideTile {
  id: number;
  currentPos: number; // Index 0-8
  isEmpty: boolean;
}

// Memory Puzzle Types
export type MemorySymbol = 'moon' | 'star' | 'leaf' | 'sun';

// Final Puzzle Types
export interface WordFragment {
  id: string;
  text: string;
  order: number;
}

export enum GameState {
  INTRO,
  PLAYING,
  LEVEL_COMPLETE,
  GAME_COMPLETE,
}
