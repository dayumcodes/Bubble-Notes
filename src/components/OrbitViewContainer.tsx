
"use client";

import type { Note } from "@/types/note";
import { NoteCard } from "./NoteCard";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface OrbitViewContainerProps {
  allNotes: Note[];
  centralNoteId: string | null;
  onSetCentralNote: (noteId: string) => void;
  onEditNote: (note: Note) => void;
}

const MAX_ORBITS = 2; // Adjusted to typically show 2 orbits as in the image
const NOTES_PER_ORBIT_BASE = 4; 
const ORBIT_RADIUS_BASE = 180; 
const ORBIT_RADIUS_INCREMENT = 100; 
const ORBIT_ROTATION_SPEED_BASE = 80; 

// Approximate sizes for calculations - actual size set by CSS
const NOTE_CARD_SIZE_CENTRAL = 192; // approx 12rem (w-48)
const NOTE_CARD_SIZE_ORBITING = 128; // approx 8rem (w-32)


export function OrbitViewContainer({ allNotes, centralNoteId, onSetCentralNote, onEditNote }: OrbitViewContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      window.removeEventListener("resize", updateSize); // Keep this if you still use window resize
    }
  }, []);

  const centralNote = useMemo(() => {
    return allNotes.find(note => note.id === centralNoteId && note.status === 'active');
  }, [allNotes, centralNoteId]);

  const orbitsData = useMemo(() => {
    if (!centralNote || !containerSize.width || !containerSize.height) return [];

    const otherActiveNotes = allNotes.filter(
      note => note.id !== centralNote.id && note.status === 'active'
    );

    const notesWithSharedTags: (Note & { sharedTagsCount: number })[] = otherActiveNotes
      .map(note => {
        const centralTags = centralNote.tags || [];
        const noteTags = note.tags || [];
        const sharedTags = noteTags.filter(tag => centralTags.includes(tag));
        return { ...note, sharedTagsCount: sharedTags.length };
      })
      .filter(note => note.sharedTagsCount > 0) // Only orbit notes with shared tags
      .sort((a, b) => b.sharedTagsCount - a.sharedTagsCount || b.timestamp - a.timestamp);

    const orbits: { level: number; radius: number; notes: Note[]; rotationDuration: number }[] = [];
    let notesToDistribute = [...notesWithSharedTags];
    
    for (let i = 0; i < MAX_ORBITS && notesToDistribute.length > 0; i++) {
        const radius = Math.min(
            (ORBIT_RADIUS_BASE + i * ORBIT_RADIUS_INCREMENT),
            (Math.min(containerSize.width, containerSize.height) / 2) - (NOTE_CARD_SIZE_ORBITING / 2) - 20 // Ensure orbits fit
        );
        
        // More notes on outer orbits, but ensure it's not too crowded
        const notesForThisOrbitCount = Math.min(notesToDistribute.length, NOTES_PER_ORBIT_BASE + i * 2);
        const notesForThisOrbit = notesToDistribute.splice(0, notesForThisOrbitCount);

        if (notesForThisOrbit.length > 0) {
             orbits.push({
                level: i + 1,
                radius: radius,
                notes: notesForThisOrbit,
                rotationDuration: ORBIT_ROTATION_SPEED_BASE + i * 20 
            });
        }
    }
    return orbits;

  }, [centralNote, allNotes, containerSize]);

  if (!centralNote) {
    // This message is shown if centralNoteId is invalid or no active notes exist
    return (
      <div ref={containerRef} className="relative flex-grow w-full h-full min-h-[calc(100vh-15rem)] p-4 bg-[hsl(var(--orbit-background-light))] dark:bg-[hsl(var(--orbit-background-dark))] flex items-center justify-center text-foreground/70">
        Select a note to be the center of the orbit or add notes with shared tags.
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className="relative flex-grow w-full h-full min-h-[calc(100vh-15rem)] p-4 bg-[hsl(var(--orbit-background-light))] dark:bg-[hsl(var(--orbit-background-dark))] overflow-hidden flex items-center justify-center"
    >
      <AnimatePresence>
        <motion.div
            key={`central-${centralNote.id}`}
            layoutId={`note-${centralNote.id}`} 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="z-20" // Ensure central note is above orbits
        >
          <NoteCard
            note={centralNote}
            onEdit={onEditNote}
            orbitViewStyle="central"
            layout="orbit" 
          />
        </motion.div>
      </AnimatePresence>

      {orbitsData.map((orbit, orbitIndex) => (
        <motion.div
          key={`orbit-group-${orbit.level}`}
          className="absolute inset-0 flex items-center justify-center pointer-events-none" // Group for rotation, pointer-events-none for SVG
          style={{ 
            width: orbit.radius * 2, 
            height: orbit.radius * 2,
            top: `calc(50% - ${orbit.radius}px)`, 
            left: `calc(50% - ${orbit.radius}px)`,
          }}
          animate={{ rotate: 360 }}
          transition={{ 
            repeat: Infinity, 
            ease: "linear", 
            duration: orbit.rotationDuration * (orbitIndex % 2 === 0 ? 1 : -1) 
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0 opacity-70">
            <circle 
                cx="50" 
                cy="50" 
                r="49.5" // Adjusted for stroke width
                className="orbit-path" 
            />
          </svg>
          
          {orbit.notes.map((note, noteIndex) => {
            const angle = (noteIndex / orbit.notes.length) * 2 * Math.PI;
            const x = Math.cos(angle) * orbit.radius; 
            const y = Math.sin(angle) * orbit.radius;

            return (
              <motion.div
                key={note.id}
                layoutId={`note-${note.id}`} 
                className="absolute z-10 pointer-events-auto" // Notes should be interactive
                style={{
                  left: `calc(50% + ${x}px)`, 
                  top: `calc(50% + ${y}px)`,
                  // transform so center of note is at x,y. Size from CSS.
                  // Example: if orbiting note is 128px, offset by -64px
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                    scale: 1, // CSS classes will handle final size
                    opacity: 1,
                    rotate: -360 // Counter-rotate
                }} 
                exit={{ scale: 0, opacity: 0 }}
                transition={{ 
                    type: "spring", 
                    stiffness: 100, 
                    damping: 15,
                    rotate: { 
                        repeat: Infinity, 
                        ease: "linear", 
                        duration: orbit.rotationDuration * (orbitIndex % 2 === 0 ? 1 : -1) 
                    }
                }}
              >
                <NoteCard
                  note={note}
                  onEdit={onEditNote} 
                  onClickOrbitingNote={onSetCentralNote}
                  orbitViewStyle="orbiting"
                  layout="orbit"
                  // CSS classes will set width and height, so transform origin works.
                  // e.g. for a 128px note, translateX(-64px) translateY(-64px)
                  className={cn(
                    orbit.notes.length === 1 ? "translate-x-[-50%] translate-y-[-50%]" : // Special case for single note for better centering
                    `translate-x-[-${NOTE_CARD_SIZE_ORBITING/2}px] translate-y-[-${NOTE_CARD_SIZE_ORBITING/2}px]`
                  )}
                />
              </motion.div>
            );
          })}
        </motion.div>
      ))}
    </div>
  );
}

