
export type VideoSourceType = 'local';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  format?: string;
  size?: number;
}

export interface VideoItem {
  id: string;
  title: string;
  source: string; // Object URL
  type: VideoSourceType;
  thumbnail?: string;
  subtitleUrl?: string; // For captions
  metadata?: VideoMetadata;
  addedAt: number;
  lastPlayedAt?: number;
  progress?: number; // In seconds
  favorite?: boolean;
}

export interface PlayerSettings {
  volume: number;
  playbackRate: number;
  isMuted: boolean;
  isTheaterMode: boolean;
  quality: 'auto' | '1080p' | '720p' | '480p';
}
