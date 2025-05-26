
"use client";
import type { Note } from "@/types/note";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const formattedTimestamp = new Date(note.timestamp).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <Card className="shadow-sm border relative group rounded-md flex flex-col h-full">
      <div className="absolute top-2.5 right-2.5 flex gap-1 z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onEdit(note)} 
          aria-label="Edit note" 
          className="h-7 w-7 p-1 text-muted-foreground hover:text-foreground hover:bg-accent/50"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onDelete(note.id)} 
          aria-label="Delete note" 
          className="h-7 w-7 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <CardContent className="p-4 pt-10 flex flex-col flex-grow"> {/* Added pt-10 to give space for absolute positioned buttons */}
        <h3 className="text-md font-medium text-foreground mb-1">{note.title}</h3>
        <p className="text-xs text-muted-foreground mb-3">{formattedTimestamp}</p>
        {note.content && (
          <p className="whitespace-pre-wrap text-sm text-foreground/90 flex-grow">{note.content}</p>
        )}
        {!note.content && <div className="flex-grow"></div>} {/* Ensures card takes full height even without content */}
      </CardContent>
    </Card>
  );
}
