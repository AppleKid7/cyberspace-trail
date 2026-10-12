import { SAVE_ID } from '../config.ts';

export interface HighScoreEntry {
  score: number;
  classLabel: string;
  day: number;
  date: string;
}

const KEY = `${SAVE_ID}:highscores`;

export function loadHighScores(): HighScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as HighScoreEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addHighScore(entry: HighScoreEntry): HighScoreEntry[] {
  const scores = loadHighScores();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  const top = scores.slice(0, 10);
  localStorage.setItem(KEY, JSON.stringify(top));
  return top;
}
