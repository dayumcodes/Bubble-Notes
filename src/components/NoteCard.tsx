
"use client";
import type { Note } from "@/types/note";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Pin, PinOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onTogglePin: (noteId: string) => void;
  onTagClick: (tag: string) => void;
  layout?: 'grid' | 'list';
}

export function NoteCard({ note, onEdit, onDelete, onTogglePin, onTagClick, layout = 'grid' }: NoteCardProps) {
  const formattedTimestamp = new Date(note.timestamp).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <Card className={cn(
      "shadow-sm border relative group rounded-md flex flex-col",
      layout === 'grid' ? "h-full" : "mb-4 w-full",
      note.isPinned && "border-primary/50"
    )}>
      <div className="absolute top-2.5 right-2.5 flex gap-1 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onTogglePin(note.id)}
          aria-label={note.isPinned ? "Unpin note" : "Pin note"}
          title={note.isPinned ? "Unpin note" : "Pin note"}
          className={cn(
            "h-7 w-7 p-1 text-muted-foreground hover:text-foreground",
            note.isPinned ? "text-primary hover:text-primary/80" : "hover:bg-accent/50"
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
          className="h-7 w-7 p-1 text-muted-foreground hover:text-foreground hover:bg-accent/50"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onDelete(note.id)} 
          aria-label="Delete note"
          title="Delete note"
          className="h-7 w-7 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <CardContent className="p-4 pt-10 flex flex-col flex-grow">
        <div className="flex items-center mb-1">
          <h3 className="text-md font-medium text-foreground">{note.title}</h3>
          {note.isPinned && <Pin className="h-4 w-4 text-primary ml-2 flex-shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground mb-3">{formattedTimestamp}</p>
        {note.content && (
          <p className="whitespace-pre-wrap text-sm text-foreground/90 flex-grow">{note.content}</p>
        )}
        {!note.content && <div className="flex-grow"></div>}
        {note.tags && note.tags.length > 0 && (
          <div className="mt-3 pt-2 border-t border-border/50 flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="text-xs font-normal cursor-pointer hover:bg-accent hover:text-accent-foreground"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click event if any
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
