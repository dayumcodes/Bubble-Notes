
"use client";
import type { Note } from "@/types/note";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Pin, PinOff, Archive, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onTogglePin?: (noteId: string) => void; // Optional if note is trashed
  onTagClick: (tag: string) => void;
  layout?: 'grid' | 'list';
  onMoveToTrash?: (noteId: string) => void;
  onRestoreFromTrash?: (noteId: string) => void;
  onDeletePermanently?: (noteId: string) => void;
}

export function NoteCard({ 
  note, 
  onEdit, 
  onTogglePin, 
  onTagClick, 
  layout = 'grid',
  onMoveToTrash,
  onRestoreFromTrash,
  onDeletePermanently
}: NoteCardProps) {
  const formattedTimestamp = new Date(note.timestamp).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const isTrashed = note.status === 'trashed';

  return (
    <Card className={cn(
      "relative group rounded-lg flex flex-col bg-card/60 dark:bg-card/40 backdrop-blur-md border border-border/30 shadow-lg hover:shadow-xl transition-all duration-300",
      layout === 'grid' ? "h-full" : "mb-4 w-full",
      note.isPinned && !isTrashed && "ring-2 ring-primary/70",
      isTrashed && "opacity-60 border-dashed border-muted-foreground/50"
    )}>
      <div className="absolute top-2.5 right-2.5 flex gap-1 z-10">
        {isTrashed ? (
          <>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onRestoreFromTrash?.(note.id)} 
              aria-label="Restore note"
              title="Restore note"
              className="h-7 w-7 p-1 text-foreground/80 hover:text-green-600 hover:bg-green-500/20 rounded-full"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onDeletePermanently?.(note.id)} 
              aria-label="Delete permanently"
              title="Delete permanently"
              className="h-7 w-7 p-1 text-foreground/80 hover:text-destructive hover:bg-destructive/20 rounded-full"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onTogglePin?.(note.id)}
              aria-label={note.isPinned ? "Unpin note" : "Pin note"}
              title={note.isPinned ? "Unpin note" : "Pin note"}
              className={cn(
                "h-7 w-7 p-1 text-foreground/80 hover:text-foreground rounded-full",
                note.isPinned ? "text-primary hover:text-primary/80" : "hover:bg-accent/30"
              )}
            >
              {note.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onEdit(note)} 
              aria-label="Edit note"
              title="Edit note"
              className="h-7 w-7 p-1 text-foreground/80 hover:text-foreground hover:bg-accent/30 rounded-full"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onMoveToTrash?.(note.id)} 
              aria-label="Move to trash"
              title="Move to trash"
              className="h-7 w-7 p-1 text-foreground/80 hover:text-amber-600 hover:bg-amber-500/20 rounded-full"
            >
              <Archive className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      <CardContent className="p-4 pt-10 flex flex-col flex-grow">
        <div className="flex items-center mb-1">
          <h3 className={cn("text-md font-medium", isTrashed ? "text-foreground/60 line-through" : "text-foreground")}>{note.title}</h3>
          {note.isPinned && !isTrashed && <Pin className="h-4 w-4 text-primary ml-2 flex-shrink-0" />}
        </div>
        <p className={cn("text-xs mb-3", isTrashed ? "text-muted-foreground/50" : "text-muted-foreground")}>{formattedTimestamp}</p>
        {note.content && (
          <p className={cn("whitespace-pre-wrap text-sm flex-grow", isTrashed ? "text-foreground/50 line-through" : "text-foreground/90")}>{note.content}</p>
        )}
        {!note.content && <div className="flex-grow"></div>}
        {note.tags && note.tags.length > 0 && !isTrashed && (
          <div className="mt-3 pt-2 border-t border-border/20 flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="text-xs font-normal cursor-pointer hover:bg-accent/50 hover:text-accent-foreground bg-secondary/30 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation(); 
                  onTagClick(tag);
                }}
                title={`Filter by tag: ${tag}`}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
