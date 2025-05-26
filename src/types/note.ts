
export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  tags?: string[];
  isPinned?: boolean;
  status?: 'active' | 'archived' | 'trashed'; // Added status field
}
