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
  onAddNote: () => void;
}

const MAX_ORBITS = 2; // Adjusted to typically show 2 orbits as in the image
const NOTES_PER_ORBIT_BASE = 4; 
const ORBIT_RADIUS_BASE = 180; 
const ORBIT_RADIUS_INCREMENT = 100; 
const ORBIT_ROTATION_SPEED_BASE = 80; 

// Approximate sizes for calculations - actual size set by CSS
const NOTE_CARD_SIZE_CENTRAL = 192; // approx 12rem (w-48)
const NOTE_CARD_SIZE_ORBITING = 128; // approx 8rem (w-32)


export function OrbitViewContainer({ allNotes, centralNoteId, onSetCentralNote, onEditNote, onAddNote }: OrbitViewContainerProps) {
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

    // Sort by pinned, then most recent
    const sortedNotes = otherActiveNotes.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.timestamp - a.timestamp;
    });

    const orbits: { level: number; radius: number; notes: Note[]; rotationDuration: number }[] = [];
    let notesToDistribute = [...sortedNotes];

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
            className="z-20"
        >
          <NoteCard
            note={centralNote}
            onEdit={onEditNote}
            orbitViewStyle="central"
            layout="orbit" 
            onTagClick={() => {}}
          />
        </motion.div>
      </AnimatePresence>

      {orbitsData.map((orbit, orbitIndex) => (
        <motion.div
          key={`orbit-group-${orbit.level}`}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
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
          {/* Orbit Path */}
          <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0 z-0">
            <circle 
                cx="50" 
                cy="50" 
                r="49.5"
                className="stroke-[2]" stroke="#4b6bfb" fill="none"
            />
            {/* Radial lines from center to each note */}
            {orbit.notes.map((_, noteIndex) => {
              const angle = (noteIndex / orbit.notes.length) * 2 * Math.PI;
              const x2 = 50 + 49.5 * Math.cos(angle);
              const y2 = 50 + 49.5 * Math.sin(angle);
              return (
                <line
                  key={noteIndex}
                  x1="50" y1="50" x2={x2} y2={y2}
                  stroke="#4b6bfb"
                  strokeWidth="1"
                  opacity="0.15"
                />
              );
            })}
          </svg>
          {/* Orbiting Notes */}
          {orbit.notes.map((note, noteIndex) => {
            const angle = (noteIndex / orbit.notes.length) * 2 * Math.PI;
            const x = Math.cos(angle) * orbit.radius; 
            const y = Math.sin(angle) * orbit.radius;
            return (
              <motion.div
                key={note.id}
                layoutId={`note-${note.id}`} 
                className="absolute z-10 pointer-events-auto"
                style={{
                  left: `calc(50% + ${x}px)`, 
                  top: `calc(50% + ${y}px)`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                    scale: 1,
                    opacity: 1,
                    rotate: -360
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
                  className="bg-[#232946] text-white rounded-full flex flex-col items-center justify-center text-center w-32 h-32 font-sans text-base font-medium border border-[#4b6bfb] hover:bg-[#334e8c] transition-colors duration-200"
                  onTagClick={() => {}}
                />
              </motion.div>
            );
          })}
        </motion.div>
      ))}
    </div>
  );
}

