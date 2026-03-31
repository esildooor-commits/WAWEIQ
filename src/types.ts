export interface Station {
  id: string;
  name: string;
  url: string;
  favicon?: string;
  tags?: string[];
  country?: string;
  language?: string;
  votes?: number;
  clickcount?: number;
  lastcheckok?: boolean;
}

export interface PlayerState {
  isPlaying: boolean;
  volume: number;
  currentStation: Station | null;
  isMuted: boolean;
  quality: 'high' | 'low';
}

export interface HistoryItem {
  station: Station;
  timestamp: number;
  duration: number; // seconds
}

export interface UserProfile {
  uuid: string;
  tagPreferences: Record<string, number>; // tag -> weight
  history: HistoryItem[];
}
