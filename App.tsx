
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, LevelData, PuzzleType, PipeTile, SlideTile, MemorySymbol, WordFragment } from './types';
import { LEVELS, FINAL_CINEMATIC_LINE, ICONS, PUZZLE_IMAGE_URL } from './constants';
import { playSound } from './utils/audio';

// -----------------------------------------------------------------------------
// PUZZLE COMPONENTS
// -----------------------------------------------------------------------------

// --- 1. Path Puzzle ---
const PathPuzzle = ({ onComplete }: { onComplete: () => void }) => {
  // 4x4 Grid
  const SIZE = 4;
  const START_POS = { x: 0, y: 0 };
  const END_POS = { x: 3, y: 3 };

  // Helper to create grid
  const createGrid = () => {
    const tiles: PipeTile[] = [];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        let type: any = 'straight';
        let fixed = false;
        let rotation = Math.floor(Math.random() * 4) * 90;

        if (x === START_POS.x && y === START_POS.y) { type = 'start'; fixed = true; rotation = 0; }
        else if (x === END_POS.x && y === END_POS.y) { type = 'end'; fixed = true; rotation = 0; }
        else {
           // Simple predefined path for solvability
           // A zig-zag or simple curve. Let's make it random but mostly curve/straight
           type = Math.random() > 0.4 ? 'corner' : 'straight';
        }

        tiles.push({
          id: `${x}-${y}`,
          type,
          rotation,
          fixed,
          x, y,
          connected: false
        });
      }
    }
    return tiles;
  };

  const [tiles, setTiles] = useState<PipeTile[]>(createGrid());
  const [completed, setCompleted] = useState(false);

  const checkConnectivity = useCallback(() => {
    // Reset connections
    const newTiles = [...tiles].map(t => ({ ...t, connected: false }));
    const grid = Array(SIZE).fill(null).map(() => Array(SIZE).fill(null));
    newTiles.forEach(t => grid[t.y][t.x] = t);

    // BFS
    const queue = [{ x: START_POS.x, y: START_POS.y }];
    const visited = new Set(['0-0']);
    newTiles.find(t => t.x === 0 && t.y === 0)!.connected = true;

    let reachedEnd = false;

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const currTile = grid[curr.y][curr.x];

      // Directions: 0=Right, 1=Down, 2=Left, 3=Up
      const dirs = [
        { dx: 1, dy: 0, enter: 2, exit: 0 },
        { dx: 0, dy: 1, enter: 3, exit: 1 },
        { dx: -1, dy: 0, enter: 0, exit: 2 },
        { dx: 0, dy: -1, enter: 1, exit: 3 }
      ];

      for (let d = 0; d < 4; d++) {
        const dir = dirs[d];
        const nx = curr.x + dir.dx;
        const ny = curr.y + dir.dy;

        if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE) {
          const nextTile = grid[ny][nx];
          if (!visited.has(`${nx}-${ny}`)) {
            // Check connections
            if (canConnect(currTile, dir.exit) && canConnect(nextTile, dir.enter)) {
               visited.add(`${nx}-${ny}`);
               nextTile.connected = true;
               queue.push({ x: nx, y: ny });
               if (nextTile.type === 'end') reachedEnd = true;
            }
          }
        }
      }
    }

    setTiles(newTiles);
    if (reachedEnd && !completed) {
      setCompleted(true);
      setTimeout(onComplete, 1000);
    }
  }, [tiles, completed, onComplete]);

  // Initial Check
  useEffect(() => {
     // Quick hack to force a solvable initial state or just let user rotate
     // For this mini-game, random rotation is usually enough challenge
  }, []);

  // Check on every rotate
  useEffect(() => {
    const timer = setTimeout(checkConnectivity, 100);
    return () => clearTimeout(timer);
  }, [tiles, checkConnectivity]);

  const canConnect = (tile: any, side: number) => {
     // side: 0=Right, 1=Down, 2=Left, 3=Up
     // Adjust for rotation
     // Logic: Tile definitions in local space (0 rot), then rotate
     // Straight (0deg): Connects Left(2) and Right(0)
     // Corner (0deg): Connects Bottom(1) and Right(0)
     // Tee (0deg): Left(2), Right(0), Bottom(1)
     
     // Normalize side by rotation
     // effectiveSide = (side - (rot/90) + 4) % 4
     const rotIndex = tile.rotation / 90;
     const localSide = (side - rotIndex + 4) % 4;

     if (tile.type === 'start') return localSide === 0; // Starts pointing Right
     if (tile.type === 'end') return true; // Accepts from anywhere
     if (tile.type === 'straight') return localSide === 0 || localSide === 2;
     if (tile.type === 'corner') return localSide === 0 || localSide === 1; // └ shape
     return false;
  };

  const rotateTile = (index: number) => {
    if (tiles[index].fixed || completed) return;
    playSound('click');
    const newTiles = [...tiles];
    newTiles[index].rotation = (newTiles[index].rotation + 90) % 360;
    setTiles(newTiles);
  };

  return (
    <div className="grid grid-cols-4 gap-2 p-4 bg-stone-200 rounded-xl shadow-inner-soft">
      {tiles.map((tile, i) => (
        <div 
          key={tile.id}
          onClick={() => rotateTile(i)}
          className={`w-16 h-16 rounded-lg bg-white flex items-center justify-center transition-all duration-300 relative ${
            tile.connected ? 'shadow-[0_0_15px_rgba(251,191,36,0.6)] border-2 border-amber-300' : 'shadow-sm'
          } ${tile.fixed ? 'bg-stone-100' : 'cursor-pointer active:scale-95'}`}
        >
          {/* Tile Visuals */}
          <div 
            className="w-full h-full flex items-center justify-center transition-transform duration-300"
            style={{ transform: `rotate(${tile.rotation}deg)` }}
          >
             {/* Draw Pipe Lines using Divs */}
             {tile.type === 'straight' && <div className={`w-full h-4 ${tile.connected ? 'bg-amber-400' : 'bg-stone-300'} rounded-full`} />}
             {tile.type === 'corner' && (
                <div className="relative w-full h-full">
                  <div className={`absolute top-1/2 left-1/2 w-1/2 h-4 -translate-y-1/2 ${tile.connected ? 'bg-amber-400' : 'bg-stone-300'} rounded-r-full`} />
                  <div className={`absolute top-1/2 left-1/2 w-4 h-1/2 -translate-x-1/2 ${tile.connected ? 'bg-amber-400' : 'bg-stone-300'} rounded-b-full`} />
                  <div className={`absolute top-1/2 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 ${tile.connected ? 'bg-amber-400' : 'bg-stone-300'} rounded-full`} />
                </div>
             )}
             {tile.type === 'start' && <span className="font-bold text-2xl text-rose-500 -rotate-0">K</span>}
             {tile.type === 'end' && <span className="font-bold text-2xl text-rose-500 -rotate-0">H</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

// --- 2. Sliding Puzzle ---
const SlidingPuzzle = ({ onComplete }: { onComplete: () => void }) => {
  // 3x3 Grid. Solved state: [0,1,2,3,4,5,6,7,8]. 8 is empty.
  
  const [grid, setGrid] = useState<number[]>([0,1,2,3,4,5,6,7,8]);
  const [isSolved, setIsSolved] = useState(false);

  useEffect(() => {
    // Shuffle on mount
    let tempGrid = [0,1,2,3,4,5,6,7,8];
    let emptyIdx = 8;
    let moves = 0;
    while (moves < 20) {
      const neighbors = [];
      if (emptyIdx % 3 > 0) neighbors.push(emptyIdx - 1);
      if (emptyIdx % 3 < 2) neighbors.push(emptyIdx + 1);
      if (emptyIdx >= 3) neighbors.push(emptyIdx - 3);
      if (emptyIdx < 6) neighbors.push(emptyIdx + 3);
      
      const rand = neighbors[Math.floor(Math.random() * neighbors.length)];
      [tempGrid[emptyIdx], tempGrid[rand]] = [tempGrid[rand], tempGrid[emptyIdx]];
      emptyIdx = rand;
      moves++;
    }
    setGrid(tempGrid);
  }, []);

  const handleTileClick = (index: number) => {
    if (isSolved) return;
    const emptyIdx = grid.indexOf(8);
    // Check adjacency
    const isAdjacent = 
      (Math.abs(index - emptyIdx) === 1 && Math.floor(index/3) === Math.floor(emptyIdx/3)) ||
      (Math.abs(index - emptyIdx) === 3);

    if (isAdjacent) {
      playSound('slide');
      const newGrid = [...grid];
      [newGrid[index], newGrid[emptyIdx]] = [newGrid[emptyIdx], newGrid[index]];
      setGrid(newGrid);

      // Check win
      const won = newGrid.every((val, i) => val === i);
      if (won) {
        setIsSolved(true);
        setTimeout(onComplete, 1200);
      }
    }
  };

  return (
    <div className="w-72 h-72 bg-stone-300 p-2 rounded-lg grid grid-cols-3 gap-1 shadow-inner-soft">
      {grid.map((val, i) => {
        if (val === 8) return <div key={`empty-${i}`} className="bg-transparent" />;
        
        // Calculate original position for background
        const row = Math.floor(val / 3);
        const col = val % 3;
        
        return (
          <div
            key={val}
            onClick={() => handleTileClick(i)}
            className={`
              relative w-full h-full rounded-md cursor-pointer transition-all duration-200 shadow-sm overflow-hidden
              ${isSolved ? 'border-none' : 'hover:scale-[1.02]'}
            `}
          >
             {/* Image Layer */}
             <div 
               className="absolute inset-0 w-full h-full"
               style={{
                 backgroundImage: `url(${PUZZLE_IMAGE_URL})`,
                 backgroundSize: '300% 300%',
                 backgroundPosition: `${(col / 2) * 100}% ${(row / 2) * 100}%`
               }}
             />
             
             {/* Overlay for solved state or hints */}
             <div className="absolute inset-0 flex items-center justify-center text-white/50 font-bold text-lg z-10">
               {isSolved ? '❤️' : ''}
             </div>
          </div>
        );
      })}
    </div>
  );
};

// --- 3. Memory Puzzle ---
const MemoryPuzzle = ({ onComplete }: { onComplete: () => void }) => {
  const symbols: MemorySymbol[] = ['moon', 'star', 'leaf', 'sun'];
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBtn, setActiveBtn] = useState<number | null>(null);
  const [round, setRound] = useState(1);
  const MAX_ROUNDS = 4;

  const addToSequence = useCallback(() => {
    const next = Math.floor(Math.random() * 4);
    setSequence(prev => [...prev, next]);
    setPlayerSeq([]);
    setIsPlaying(true);
  }, []);

  // Playback
  useEffect(() => {
    if (isPlaying && sequence.length > 0) {
      let i = 0;
      const interval = setInterval(() => {
        if (i >= sequence.length) {
          clearInterval(interval);
          setIsPlaying(false);
          setActiveBtn(null);
          return;
        }
        playSound('click');
        setActiveBtn(sequence[i]);
        setTimeout(() => setActiveBtn(null), 400);
        i++;
      }, 800);
      return () => clearInterval(interval);
    }
  }, [sequence, isPlaying]);

  // Start first round
  useEffect(() => {
    if (round === 1 && sequence.length === 0) {
       setTimeout(addToSequence, 1000);
    }
  }, [round, sequence, addToSequence]);

  const handlePress = (idx: number) => {
    if (isPlaying) return;
    playSound('correct'); // Using chime for user press
    setActiveBtn(idx);
    setTimeout(() => setActiveBtn(null), 200);

    const newPlayerSeq = [...playerSeq, idx];
    setPlayerSeq(newPlayerSeq);

    // Check correctness
    if (newPlayerSeq[newPlayerSeq.length - 1] !== sequence[newPlayerSeq.length - 1]) {
      // Wrong
      playSound('lock'); // Error sound
      setPlayerSeq([]);
      alert("Try again, love."); // Simple feedback
      setIsPlaying(true); // Replay
      return;
    }

    if (newPlayerSeq.length === sequence.length) {
      if (round === MAX_ROUNDS) {
        setTimeout(onComplete, 1000);
      } else {
        setRound(r => r + 1);
        setTimeout(addToSequence, 1000);
      }
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 p-6">
      {symbols.map((sym, i) => (
        <button
          key={sym}
          onClick={() => handlePress(i)}
          className={`
            w-24 h-24 rounded-2xl text-4xl shadow-soft transition-all duration-200
            flex items-center justify-center border-b-4
            ${activeBtn === i 
               ? 'bg-amber-100 border-amber-300 translate-y-1 shadow-none' 
               : 'bg-white border-stone-200 hover:-translate-y-1'
            }
          `}
        >
          {ICONS[sym]}
        </button>
      ))}
      <div className="col-span-2 text-center mt-4 text-stone-400 font-medium">
        Pattern {round} / {MAX_ROUNDS}
      </div>
    </div>
  );
};

// --- 4. Lock Puzzle ---
const LockPuzzle = ({ onComplete }: { onComplete: () => void }) => {
  // 3 Rings. Solution randomly generated or fixed.
  const [combo, setCombo] = useState([0, 0, 0]);
  const SOLUTION = [2, 4, 1]; // Moon, Heart, Star (example indices)
  const OPTIONS = ['☀️', '✨', '🌙', '🍃', '❤️', '☁️']; // 6 options

  const rotate = (ringIndex: number, dir: 1 | -1) => {
    playSound('lock');
    const newCombo = [...combo];
    newCombo[ringIndex] = (newCombo[ringIndex] + dir + OPTIONS.length) % OPTIONS.length;
    setCombo(newCombo);
    
    // Check solution
    const check = [...newCombo]; // state updates are async, use local var
    if (check.every((val, i) => val === SOLUTION[i])) {
      playSound('win');
      setTimeout(onComplete, 1000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-4 p-4 bg-stone-800 rounded-xl shadow-2xl border border-stone-600">
        {combo.map((val, i) => (
          <div key={i} className="flex flex-col items-center">
            <button onClick={() => rotate(i, 1)} className="text-stone-500 hover:text-white mb-2">▲</button>
            <div className="w-16 h-20 bg-stone-100 rounded md:rounded-lg flex items-center justify-center text-4xl shadow-inner border-y-4 border-stone-300">
              {OPTIONS[val]}
            </div>
            <button onClick={() => rotate(i, -1)} className="text-stone-500 hover:text-white mt-2">▼</button>
          </div>
        ))}
      </div>
      
      {/* Subtle Hint */}
      <div className="mt-8 flex gap-4 opacity-30">
        <span className="text-2xl">{OPTIONS[SOLUTION[0]]}</span>
        <span className="text-2xl">{OPTIONS[SOLUTION[1]]}</span>
        <span className="text-2xl">{OPTIONS[SOLUTION[2]]}</span>
      </div>
      <p className="text-xs text-stone-400 uppercase tracking-widest">Match the key</p>
    </div>
  );
};

// --- 5. Final Puzzle ---
const FinalPuzzle = ({ onComplete }: { onComplete: () => void }) => {
  const FULL_PHRASE = "Every puzzle brings me closer to you";
  const WORDS = FULL_PHRASE.split(' ');
  
  const [fragments, setFragments] = useState(
    WORDS.map((text, i) => ({ id: `w-${i}`, text, order: i }))
         .sort(() => Math.random() - 0.5) // Shuffle
  );
  
  const [slots, setSlots] = useState<(WordFragment | null)[]>(Array(WORDS.length).fill(null));

  const handleFragmentClick = (frag: WordFragment) => {
    // Find first empty slot
    const emptyIdx = slots.findIndex(s => s === null);
    if (emptyIdx !== -1) {
       playSound('click');
       const newSlots = [...slots];
       newSlots[emptyIdx] = frag;
       setSlots(newSlots);
       setFragments(fragments.filter(f => f.id !== frag.id));
       
       // Check Win
       if (emptyIdx === WORDS.length - 1) {
          // Check correctness
          const currentPhrase = newSlots.map(s => s?.text).join(' ');
          // Wait for render
          setTimeout(() => {
             if (newSlots.every((s, i) => s?.order === i)) {
                onComplete();
             } else {
                playSound('lock');
                // Reset
                setFragments(WORDS.map((text, i) => ({ id: `w-${i}`, text, order: i })).sort(() => Math.random() - 0.5));
                setSlots(Array(WORDS.length).fill(null));
             }
          }, 500);
       }
    }
  };

  const returnFragment = (index: number) => {
    const item = slots[index];
    if (!item) return;
    playSound('slide');
    setSlots(slots.map((s, i) => i === index ? null : s));
    setFragments([...fragments, item]);
  };

  return (
    <div className="w-full max-w-md px-4">
      {/* Empty Slots Area */}
      <div className="min-h-[100px] flex flex-wrap gap-2 justify-center items-center mb-12 p-4 bg-white rounded-xl shadow-inner-soft border border-stone-200">
        {slots.map((slot, i) => (
          <div 
            key={i} 
            onClick={() => returnFragment(i)}
            className={`
              h-10 px-3 rounded-md border border-dashed flex items-center justify-center cursor-pointer transition-all
              ${slot ? 'bg-amber-100 border-amber-300 text-stone-800 shadow-sm' : 'border-stone-300 bg-stone-50'}
            `}
          >
            {slot?.text}
          </div>
        ))}
      </div>

      {/* Floating Fragments */}
      <div className="flex flex-wrap justify-center gap-3">
        {fragments.map((frag) => (
          <button
            key={frag.id}
            onClick={() => handleFragmentClick(frag)}
            className="px-4 py-2 bg-white rounded-full shadow-soft hover:scale-110 active:scale-95 transition-transform text-stone-600 font-medium animate-float"
            style={{ animationDelay: `${Math.random() * 2}s` }}
          >
            {frag.text}
          </button>
        ))}
      </div>
    </div>
  );
};


// -----------------------------------------------------------------------------
// MAIN APP COMPONENT
// -----------------------------------------------------------------------------

const App = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.INTRO);
  const [levelIndex, setLevelIndex] = useState(0);
  const [showReward, setShowReward] = useState(false);

  const currentLevel = LEVELS[levelIndex];

  const handleStart = () => {
    playSound('click');
    setGameState(GameState.PLAYING);
  };

  const handleLevelComplete = () => {
    playSound('correct');
    setShowReward(true);
    setGameState(GameState.LEVEL_COMPLETE);
  };

  const handleNextLevel = () => {
    playSound('click');
    setShowReward(false);
    if (levelIndex < LEVELS.length - 1) {
      setLevelIndex(prev => prev + 1);
      setGameState(GameState.PLAYING);
    } else {
      playSound('win');
      setGameState(GameState.GAME_COMPLETE);
    }
  };

  return (
    <div className="texture-paper min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Intro Screen */}
      {gameState === GameState.INTRO && (
        <div className="text-center z-10 animate-slide-in p-8">
          <h1 className="text-5xl font-light text-stone-700 mb-2 tracking-wide">Pieces of Us</h1>
          <div className="w-16 h-1 bg-rose-300 mx-auto mb-6 rounded-full"></div>
          <p className="text-stone-500 mb-12 max-w-xs mx-auto leading-relaxed">
            A little journey to collect the pieces of my heart.
          </p>
          <button 
            onClick={handleStart}
            className="px-10 py-4 bg-stone-800 text-stone-50 rounded-full text-lg font-medium shadow-xl hover:scale-105 transition-transform"
          >
            Begin
          </button>
        </div>
      )}

      {/* Playing State */}
      {gameState === GameState.PLAYING && (
        <div className="w-full max-w-lg flex flex-col items-center z-10 animate-slide-in">
          {/* Level Header */}
          <div className="mb-8 text-center">
            <span className="text-xs font-bold tracking-[0.2em] text-stone-400 uppercase">
              Puzzle {levelIndex + 1} / {LEVELS.length}
            </span>
            <h2 className="text-2xl text-stone-700 font-semibold mt-1">{currentLevel.title}</h2>
            <p className="text-stone-500 text-sm mt-2 italic">{currentLevel.instruction}</p>
          </div>

          {/* Puzzle Container */}
          <div className="mb-8">
            {currentLevel.type === PuzzleType.PATH && <PathPuzzle onComplete={handleLevelComplete} />}
            {currentLevel.type === PuzzleType.SLIDE && <SlidingPuzzle onComplete={handleLevelComplete} />}
            {currentLevel.type === PuzzleType.MEMORY && <MemoryPuzzle onComplete={handleLevelComplete} />}
            {currentLevel.type === PuzzleType.LOCK && <LockPuzzle onComplete={handleLevelComplete} />}
            {currentLevel.type === PuzzleType.FINAL && <FinalPuzzle onComplete={handleLevelComplete} />}
          </div>
        </div>
      )}

      {/* Level Complete / Reward Modal */}
      {gameState === GameState.LEVEL_COMPLETE && showReward && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center animate-slide-in">
          <div className="w-20 h-20 mb-6 bg-rose-50 rounded-full flex items-center justify-center shadow-inner text-4xl animate-bounce">
            🧩
          </div>
          <p className="text-xl md:text-2xl font-medium text-stone-700 mb-8 leading-relaxed max-w-md">
            "{currentLevel.rewardMessage}"
          </p>
          <button 
            onClick={handleNextLevel}
            className="px-8 py-3 bg-rose-400 text-white rounded-full font-bold shadow-lg hover:bg-rose-500 transition-colors"
          >
            {levelIndex === LEVELS.length - 1 ? "Finish" : "Collect Piece"}
          </button>
        </div>
      )}

      {/* Game Complete */}
      {gameState === GameState.GAME_COMPLETE && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center bg-stone-900 text-white animate-glow">
          <div className="mb-8 text-6xl">❤️</div>
          <h2 className="text-3xl font-light mb-8">Completed</h2>
          <p className="text-xl md:text-3xl font-light leading-relaxed max-w-2xl opacity-90">
             "{FINAL_CINEMATIC_LINE}"
          </p>
          <div className="mt-12 w-32 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent"></div>
        </div>
      )}

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30 z-0">
        <div className="absolute top-10 left-10 text-4xl animate-float" style={{ animationDelay: '0s' }}>🍃</div>
        <div className="absolute bottom-20 right-10 text-4xl animate-float" style={{ animationDelay: '2s' }}>🍂</div>
        <div className="absolute top-1/2 right-4 text-2xl animate-float" style={{ animationDelay: '1s' }}>✨</div>
      </div>

    </div>
  );
};

export default App;
