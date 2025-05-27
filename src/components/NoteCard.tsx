
"use client";
import React from "react";
import type { Note } from "@/types/note";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Pin, PinOff, Archive, Undo2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  searchTerm?: string;
  onEdit: (note: Note) => void;
  onTogglePin?: (noteId: string) => void;
  onTagClick: (tag: string) => void;
  layout?: 'grid' | 'list' | 'bubble' | 'orbit';
  onMoveToTrash?: (noteId: string) => void;
  onRestoreFromTrash?: (noteId: string) => void;
  onDeletePermanently?: (noteId: string) => void;
  orbitViewStyle?: 'central' | 'orbiting' | null;
  onClickOrbitingNote?: (noteId: string) => void; // For OrbitViewContainer to set central note
  className?: string; // Allow custom classes for layout from OrbitViewContainer
  style?: React.CSSProperties; // Allow custom styles for layout from OrbitViewContainer
}

const highlightText = (text: string | null | undefined, highlight: string | null | undefined) => {
  if (!text) return "";
  if (!highlight || !highlight.trim()) {
    return <>{text}</>;
  }
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedHighlight})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/40 text-primary-foreground rounded px-0.5">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
};


export function NoteCard({
  note,
  searchTerm = "",
  onEdit,
  onTogglePin,
  onTagClick,
  layout = 'grid',
  onMoveToTrash,
  onRestoreFromTrash,
  onDeletePermanently,
  orbitViewStyle = null,
  onClickOrbitingNote,
  className,
  style
}: NoteCardProps) {
  const formattedTimestamp = new Date(note.timestamp).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const isTrashed = note.status === 'trashed';
  const shouldHighlight = searchTerm && !isTrashed && layout !== 'orbit'; // No highlighting in orbit view for simplicity
  const isOrbiting = orbitViewStyle === 'orbiting';
  const isCentralOrbit = orbitViewStyle === 'central';

  const cardContent = (
    <motion.div
      layout // Enable smooth layout transitions for Framer Motion
      className={cn(
        "relative group rounded-lg flex flex-col border transition-all duration-300",
        orbitViewStyle ? 
          (isCentralOrbit ? "orbit-note-central p-3 md:p-4 w-48 h-48 md:w-56 md:h-56 overflow-hidden" : "orbit-note-orbiting p-2 w-32 h-32 md:w-36 md:h-36 overflow-hidden text-xs") :
          "bg-card/60 dark:bg-card/40 backdrop-blur-md border-border/30 shadow-lg hover:shadow-xl",
        orbitViewStyle ? "" : (layout === 'grid' ? "h-full" : "mb-4 w-full"),
        note.isPinned && !isTrashed && !orbitViewStyle && "ring-2 ring-primary/70",
        isTrashed && !orbitViewStyle && "opacity-60 border-dashed border-muted-foreground/50",
        className
      )}
      style={style}
      onClick={isOrbiting && onClickOrbitingNote ? () => onClickOrbitingNote(note.id) : (isCentralOrbit ? () => onEdit(note) : undefined)}
      whileHover={isOrbiting ? { scale: 1.1, zIndex: 10 } : {}}
      whileTap={isOrbiting ? { scale: 0.95 } : {}}
      role={isOrbiting || isCentralOrbit ? "button" : undefined}
      tabIndex={isOrbiting || isCentralOrbit ? 0 : undefined}
      onKeyDown={(e) => {
        if ((isOrbiting || isCentralOrbit) && e.key === 'Enter') {
           if (isOrbiting && onClickOrbitingNote) onClickOrbitingNote(note.id);
           else if (isCentralOrbit) onEdit(note);
        }
      }}
    >
      {!isOrbiting && !isCentralOrbit && ( // Action buttons only for non-orbit views
        <div className="absolute top-2.5 right-2.5 flex gap-1 z-10">
          {isTrashed ? (
            <>
              <Button variant="ghost" size="icon" onClick={() => onRestoreFromTrash?.(note.id)} aria-label="Restore note" title="Restore note" className="h-7 w-7 p-1 text-foreground/80 hover:text-green-600 hover:bg-green-500/20 rounded-full"> <Undo2 className="h-4 w-4" /> </Button>
              <Button variant="ghost" size="icon" onClick={() => onDeletePermanently?.(note.id)} aria-label="Delete permanently" title="Delete permanently" className="h-7 w-7 p-1 text-foreground/80 hover:text-destructive hover:bg-destructive/20 rounded-full"> <Trash2 className="h-4 w-4" /> </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" onClick={() => onTogglePin?.(note.id)} aria-label={note.isPinned ? "Unpin note" : "Pin note"} title={note.isPinned ? "Unpin note" : "Pin note"} className={cn("h-7 w-7 p-1 text-foreground/80 hover:text-foreground rounded-full", note.isPinned ? "text-primary hover:text-primary/80" : "hover:bg-accent/30")}> {note.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />} </Button>
              <Button variant="ghost" size="icon" onClick={() => onEdit(note)} aria-label="Edit note" title="Edit note" className="h-7 w-7 p-1 text-foreground/80 hover:text-foreground hover:bg-accent/30 rounded-full"> <Pencil className="h-4 w-4" /> </Button>
              <Button variant="ghost" size="icon" onClick={() => onMoveToTrash?.(note.id)} aria-label="Move to trash" title="Move to trash" className="h-7 w-7 p-1 text-foreground/80 hover:text-amber-600 hover:bg-amber-500/20 rounded-full"> <Archive className="h-4 w-4" /> </Button>
            </>
          )}
        </div>
      )}
      <CardContent className={cn(
        "flex flex-col flex-grow",
        orbitViewStyle ? "p-0 items-center justify-center text-center" : "p-4 pt-10"
      )}>
        <h3 className={cn(
          "font-medium break-words", 
          isCentralOrbit ? "text-lg md:text-xl mb-1" : isOrbiting ? "text-xs md:text-sm" : "text-md",
          isTrashed && !orbitViewStyle ? "text-foreground/60 line-through" : 
          orbitViewStyle ? "text-inherit" : "text-foreground" // Use inherit for orbit view to pick up specific orbit styles
        )}>
          {shouldHighlight ? highlightText(note.title, searchTerm) : (isOrbiting ? (note.title.substring(0,15) + (note.title.length > 15 ? "..." : "")) : note.title) }
        </h3>
        {note.isPinned && (isCentralOrbit || isOrbiting) && <Pin className={cn("h-3 w-3 flex-shrink-0 my-1", isCentralOrbit ? "text-amber-400" : "text-amber-500")} />}
        
        {!isOrbiting && !isCentralOrbit && (
            <p className={cn("text-xs mb-3", isTrashed ? "text-muted-foreground/50" : "text-muted-foreground")}>{formattedTimestamp}</p>
        )}

        {note.content && !isOrbiting && ( // Content not shown for orbiting notes for brevity
          <p className={cn(
            "whitespace-pre-wrap flex-grow break-words", 
            isCentralOrbit ? "text-xs md:text-sm mt-1 max-h-[60px] overflow-y-auto scrollbar-thin" : "text-sm",
            isTrashed && !orbitViewStyle ? "text-foreground/50 line-through" : 
            orbitViewStyle ? "text-inherit" : "text-foreground/90"
            )}>
            {shouldHighlight ? highlightText(note.content, searchTerm) : note.content}
          </p>
        )}
        {!note.content && !isOrbiting && <div className="flex-grow"></div>}
        
        {note.tags && note.tags.length > 0 && !isTrashed && !isOrbiting && !isCentralOrbit && ( // Tags not shown in orbit view for simplicity
          <div className="mt-3 pt-2 border-t border-border/20 flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs font-normal cursor-pointer hover:bg-accent/50 hover:text-accent-foreground bg-secondary/30 backdrop-blur-sm"
                onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
                title={`Filter by tag: ${tag}`}
              >
                {shouldHighlight ? highlightText(tag, searchTerm) : tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </motion.div>
  );

  if (isOrbiting) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent side="top" align="center" className="bg-popover/90 backdrop-blur-sm text-popover-foreground">
            <p className="font-medium text-sm">{note.title}</p>
            {note.content && <p className="text-xs max-w-xs truncate">{note.content.substring(0,50)}...</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}
