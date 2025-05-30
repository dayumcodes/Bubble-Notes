export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  tags?: string[];
  isPinned?: boolean;
  status?: 'active' | 'archived' | 'trashed'; // Added status field
  reminders?: number[]; // Array of timestamps (ms since epoch)
}

export interface BubblePaletteConfig {
  name: string;
  bg: string;
  previewBg?: string;
  text: string;
  glow1: string;
  glow2: string;
}
