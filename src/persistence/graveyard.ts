import { SAVE_ID } from '../config.ts';

export interface Grave {
  scroll: number;
  name: string;
  epitaph: string;
  day: number;
}

export interface GraveyardService {
  record(grave: Grave): Promise<void>;
  near(scroll: number, limit: number): Promise<Grave[]>;
}

const EPITAPH_MAX = 120;

export class LocalGraveyard implements GraveyardService {
  private key = `${SAVE_ID}:graves`;

  private read(): Grave[] {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as Grave[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private write(graves: Grave[]): void {
    localStorage.setItem(this.key, JSON.stringify(graves.slice(-200)));
  }

  async record(grave: Grave): Promise<void> {
    const epitaph = grave.epitaph.slice(0, EPITAPH_MAX);
    const graves = this.read();
    graves.push({ ...grave, epitaph });
    this.write(graves);
  }

  async near(scroll: number, limit: number): Promise<Grave[]> {
    const graves = this.read();
    return graves
      .filter((g) => Math.abs(g.scroll - scroll) < 40)
      .slice(0, limit);
  }
}

export function sanitizeEpitaph(text: string): string {
  return text.trim().slice(0, EPITAPH_MAX);
}
