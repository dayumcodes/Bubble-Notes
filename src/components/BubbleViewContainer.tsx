
"use client";

import type { Note } from "@/types/note";
import { BubbleNoteCard } from "./BubbleNoteCard";
import { useEffect, useRef, useState } from "react";

interface BubbleViewContainerProps {
  notes: Note[];
  onEditNote: (note: Note) => void;
  dynamicStyle?: React.CSSProperties;
}

export function BubbleViewContainer({ notes, onEditNote, dynamicStyle }: BubbleViewContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    
    updateDimensions(); 
    window.addEventListener('resize', updateDimensions);
    
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
        observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [notes]); // Only re-run if notes array instance changes, not just content (usually fine)


  return (
    <div 
      ref={containerRef}
      className="relative flex-grow w-full h-full min-h-[calc(100vh-15rem)] p-4 overflow-hidden 
                 bg-gradient-to-br from-[hsl(var(--bubble-bg-start-light))] to-[hsl(var(--bubble-bg-end-light))]
                 dark:from-[hsl(var(--bubble-bg-start-dark))] dark:to-[hsl(var(--bubble-bg-end-dark))]
                 transition-colors duration-300"
      style={dynamicStyle}
    >
      {dimensions.width > 0 && dimensions.height > 0 && notes.map((note) => (
        <BubbleNoteCard 
            key={note.id} 
            note={note} 
            onEdit={onEditNote} 
            containerWidth={dimensions.width}
            containerHeight={dimensions.height}
        />
      ))}
      {notes.length === 0 && (
         <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xl text-muted-foreground">No notes yet. Add some bubbles!</p>
        </div>
      )}
    </div>
  );
}
