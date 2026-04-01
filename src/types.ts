export interface Station {
  id: string;
  name: string;
  url: string;
  url_resolved?: string;
  favicon?: string;
  tags?: string[];
  country?: string;
  language?: string;
  votes?: number;
  clickcount?: number;
  lastcheckok?: boolean;
  nowPlaying?: string;
  bitrate?: number;
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
