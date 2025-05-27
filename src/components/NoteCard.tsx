"use client";
import React from "react";
import type { Note } from "@/types/note";
import { Card, CardContent } from "@/components/ui/card"; // Card and CardContent might not be used for orbit view
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, PinOff, Archive, Undo2 } from "lucide-react"; // Pin icon removed for orbit view
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
  onClickOrbitingNote?: (noteId: string) => void;
  className?: string; 
  style?: React.CSSProperties; 
  customBgColor?: string; // HEX or CSS color for grid/list
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
  style,
  customBgColor
}: NoteCardProps) {
  const formattedTimestamp = new Date(note.timestamp).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const isTrashed = note.status === 'trashed';
  const shouldHighlight = searchTerm && !isTrashed && layout !== 'orbit';
  const isOrbiting = orbitViewStyle === 'orbiting';
  const isCentralOrbit = orbitViewStyle === 'central';


  if (orbitViewStyle) {
    const noteTitle = isCentralOrbit ? note.title : (note.title.substring(0, 20) + (note.title.length > 20 ? "..." : ""));
    
    const contentLines = note.content?.split('\n').slice(0, 3) || [];
    const displayContent = contentLines.map((line, index) => (
        <p key={index} className="truncate leading-tight">
            {line.startsWith('- ') || line.startsWith('• ') ? line.substring(0,25) : `• ${line.substring(0,23)}`}
            {line.length > (line.startsWith('- ') || line.startsWith('• ') ? 25 : 23) ? "..." : ""}
        </p>
    ));


    const cardElement = (
       <motion.div
        layoutId={`note-${note.id}`}
        className={cn(
          "relative flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300",
          isCentralOrbit ? "orbit-note-central" : "orbit-note-orbiting",
          className
        )}
        style={style} // For positioning from OrbitViewContainer
        onClick={isOrbiting && onClickOrbitingNote ? () => onClickOrbitingNote(note.id) : (isCentralOrbit ? () => onEdit(note) : undefined)}
        whileHover={isOrbiting || isCentralOrbit ? { scale: 1.05, zIndex: 10 } : {}}
        whileTap={isOrbiting || isCentralOrbit ? { scale: 0.95 } : {}}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
            if (e.key === 'Enter') {
                if (isOrbiting && onClickOrbitingNote) onClickOrbitingNote(note.id);
                else if (isCentralOrbit) onEdit(note);
            }
        }}
        >
        <h3 className={cn(
            "font-pixel break-words",
            isCentralOrbit ? "text-2xl px-2" : "text-lg px-1" 
        )}>
            {noteTitle}
        </h3>
        {isOrbiting && note.content && (
            <div className="font-sans text-xs mt-1.5 space-y-0.5 px-2 w-full">
             {displayContent}
            </div>
        )}
        </motion.div>
    );
    
    if (isOrbiting) {
        return (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                {cardElement}
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="bg-popover/90 backdrop-blur-sm text-popover-foreground">
                <p className="font-pixel text-sm">{note.title}</p>
                {note.content && <p className="text-xs max-w-[200px] whitespace-pre-line">{note.content.substring(0,100)}...</p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      return cardElement;

  }

  // Default rectangular card rendering for grid/list/bubble views
  return (
    <motion.div
      layout
      className={cn(
        "relative group rounded-md flex flex-col border transition-all duration-300",
        customBgColor && (layout === 'grid' || layout === 'list')
          ? "backdrop-blur-md border-border/30 shadow-lg hover:shadow-xl"
          : "bg-card/60 dark:bg-card/40 backdrop-blur-md border-border/30 shadow-lg hover:shadow-xl",
        layout === 'grid' ? "h-full" : "mb-4 w-full",
        note.isPinned && !isTrashed && "ring-2 ring-primary/70",
        isTrashed && "opacity-60 border-dashed border-muted-foreground/50",
        className
      )}
      style={{
        ...(style || {}),
        ...(customBgColor && (layout === 'grid' || layout === 'list') ? { backgroundColor: customBgColor } : {}),
      }}
    >
      <div className="absolute top-2.5 right-2.5 flex gap-1 z-10">
        {isTrashed ? (
          <>
            <Button variant="ghost" size="icon" onClick={() => onRestoreFromTrash?.(note.id)} aria-label="Restore note" title="Restore note" className="h-7 w-7 p-1 text-foreground/80 hover:text-green-600 hover:bg-green-500/20 rounded-full"> <Undo2 className="h-4 w-4" /> </Button>
            <Button variant="ghost" size="icon" onClick={() => onDeletePermanently?.(note.id)} aria-label="Delete permanently" title="Delete permanently" className="h-7 w-7 p-1 text-foreground/80 hover:text-destructive hover:bg-destructive/20 rounded-full"> <Trash2 className="h-4 w-4" /> </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="icon" onClick={() => onTogglePin?.(note.id)} aria-label={note.isPinned ? "Unpin note" : "Pin note"} title={note.isPinned ? "Unpin note" : "Pin note"} className={cn("h-7 w-7 p-1 text-foreground/80 hover:text-foreground rounded-full", note.isPinned ? "text-primary hover:text-primary/80" : "hover:bg-accent/30")}> {note.isPinned ? <PinOff className="h-4 w-4" /> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17s-4-3-4-6 4-6 4-6 4 3 4 6-4 6-4 6z"/><path d="M9 17v-2.218a3 3 0 0 1 .307-1.37L12 9l2.693 4.412a3 3 0 0 1 .307 1.37V17"/><path d="M12 22v-5"/></svg>} </Button>
            <Button variant="ghost" size="icon" onClick={() => onEdit(note)} aria-label="Edit note" title="Edit note" className="h-7 w-7 p-1 text-foreground/80 hover:text-foreground hover:bg-accent/30 rounded-full"> <Pencil className="h-4 w-4" /> </Button>
            <Button variant="ghost" size="icon" onClick={() => onMoveToTrash?.(note.id)} aria-label="Move to trash" title="Move to trash" className="h-7 w-7 p-1 text-foreground/80 hover:text-amber-600 hover:bg-amber-500/20 rounded-full"> <Archive className="h-4 w-4" /> </Button>
          </>
        )}
      </div>
      <CardContent className="flex flex-col flex-grow p-4 pt-10">
        <div className="flex items-center mb-1">
          {note.isPinned && !isTrashed && (
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 text-primary flex-shrink-0"><path d="M12 17s-4-3-4-6 4-6 4-6 4 3 4 6-4 6-4 6z"/><path d="M9 17v-2.218a3 3 0 0 1 .307-1.37L12 9l2.693 4.412a3 3 0 0 1 .307 1.37V17"/><path d="M12 22v-5"/></svg>
          )}
          <h3 className={cn("font-pixel text-md font-medium break-words", isTrashed ? "text-foreground/60 line-through" : "text-foreground")}>
            {shouldHighlight ? highlightText(note.title, searchTerm) : note.title}
          </h3>
        </div>
        
        <p className={cn("text-xs mb-3", isTrashed ? "text-muted-foreground/50" : "text-muted-foreground")}>{formattedTimestamp}</p>

        {note.content && (
          <p className={cn("whitespace-pre-wrap text-sm flex-grow break-words", isTrashed ? "text-foreground/50 line-through" : "text-foreground/90")}>
            {shouldHighlight ? highlightText(note.content, searchTerm) : note.content}
          </p>
        )}
        {!note.content && <div className="flex-grow"></div>} {/* Spacer */}
        
        {note.tags && note.tags.length > 0 && !isTrashed && (
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
}

