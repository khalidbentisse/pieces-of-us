
import { LevelData, PuzzleType } from './types';

// TODO: Replace this URL with the link to the photo you want to use!
export const PUZZLE_IMAGE_URL = "/UntitleWEWEd-1.png";

export const LEVELS: LevelData[] = [
  {
    id: 1,
    type: PuzzleType.PATH,
    title: "Connect the Path",
    instruction: "Rotate tiles to guide the way from K to H",
    rewardMessage: "7ta fash kanqwdha, I always find my way back to you.",
  },
  {
    id: 2,
    type: PuzzleType.SLIDE,
    title: "Fragmented Memory",
    instruction: "Slide the pieces to make the picture whole",
    rewardMessage: "Some memories feel scattered… until you put them together.",
  },
  {
    id: 3,
    type: PuzzleType.MEMORY,
    title: "Symbol Sequence",
    instruction: "Repeat the pattern of our moments",
    rewardMessage: "Every moment dyalna stays in my mind longer than you think.",
  },
  {
    id: 4,
    type: PuzzleType.LOCK,
    title: "The Lockbox",
    instruction: "Align the rings to unlock my feelings",
    rewardMessage: "Some things are locked away… but my feelings for you never are.you fking little bitch.",
  },
  {
    id: 5,
    type: PuzzleType.FINAL,
    title: "Assemble the Message",
    instruction: "Order the fragments to hear the truth",
    rewardMessage: "Hiba jabibi zwiwna… Every piece of this world, every puzzle inside it, brings me closer to you.",
  }
];

export const FINAL_CINEMATIC_LINE = "When distance breaks us into pieces… love puts us back together.";

export const ICONS = {
  moon: "🌙",
  star: "✨",
  leaf: "🍃",
  sun: "☀️",
  heart: "❤️",
  lock: "🔒",
  key: "🔑",
};
