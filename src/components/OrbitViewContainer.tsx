
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

const MAX_ORBITS = 3;
const NOTES_PER_ORBIT_BASE = 6; // Max notes for the closest orbit
const ORBIT_RADIUS_BASE = 150; // Radius for the closest orbit in pixels
const ORBIT_RADIUS_INCREMENT = 80; // Increase in radius for subsequent orbits
const ORBIT_ROTATION_SPEED_BASE = 60; // Duration in seconds for a full rotation of the closest orbit

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
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
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
        const sharedTags = note.tags?.filter(tag => centralNote.tags?.includes(tag)) || [];
        return { ...note, sharedTagsCount: sharedTags.length };
      })
      .filter(note => note.sharedTagsCount > 0)
      .sort((a, b) => b.sharedTagsCount - a.sharedTagsCount || b.timestamp - a.timestamp); // Prioritize by shared tags, then by recency

    const orbits: { level: number; radius: number; notes: Note[]; rotationDuration: number }[] = [];
    let remainingNotes = [...notesWithSharedTags];
    
    // Group by shared tag count (descending)
    const relevanceGroups: Note[][] = [];
    const maxShared = Math.max(...remainingNotes.map(n => n.sharedTagsCount), 0);

    for (let i = maxShared; i > 0 && orbits.length < MAX_ORBITS; i--) {
        const group = remainingNotes.filter(n => n.sharedTagsCount === i);
        if (group.length > 0) {
            relevanceGroups.push(group);
        }
    }
    
    // If not enough groups by shared tags, fill with remaining notes by recency (if any left)
    // This part is simplified for now. A more complex relevance might be needed.
    // For now, we only orbit notes with shared tags.

    relevanceGroups.slice(0, MAX_ORBITS).forEach((group, index) => {
        const radius = Math.min(
            (ORBIT_RADIUS_BASE + index * ORBIT_RADIUS_INCREMENT),
            (Math.min(containerSize.width, containerSize.height) / 2) - (isCentralOrbit ? 100 : 60) // Ensure orbits fit
        );
        const notesForThisOrbit = group.slice(0, NOTES_PER_ORBIT_BASE + index * 2); // More notes on outer orbits
        
        orbits.push({
            level: index + 1,
            radius: radius,
            notes: notesForThisOrbit,
            rotationDuration: ORBIT_ROTATION_SPEED_BASE + index * 15 // Outer orbits rotate slower
        });
    });

    return orbits;

  }, [centralNote, allNotes, containerSize]);

  if (!centralNote) {
    return (
      <div ref={containerRef} className="relative flex-grow w-full h-full min-h-[calc(100vh-15rem)] p-4 bg-slate-900 dark:bg-gray-950 flex items-center justify-center text-slate-400">
        Loading central note or no active notes available...
      </div>
    );
  }
  
  const isCentralOrbit = true; // Just a flag for potential future use within NoteCard if needed

  return (
    <div 
      ref={containerRef}
      className="relative flex-grow w-full h-full min-h-[calc(100vh-15rem)] p-4 bg-slate-900 dark:bg-gray-950 overflow-hidden flex items-center justify-center"
    >
      <AnimatePresence>
        {/* Central Note */}
        <motion.div
            key={centralNote.id} // Key change triggers animation
            layoutId={`note-${centralNote.id}`} // For smooth transition if it was an orbiting note
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
            layout="orbit" // Pass layout to NoteCard
          />
        </motion.div>
      </AnimatePresence>

      {/* Orbit Paths and Orbiting Notes */}
      {orbitsData.map((orbit, orbitIndex) => (
        <motion.div
          key={`orbit-path-${orbit.level}`}
          className="absolute inset-0 flex items-center justify-center"
          style={{ 
            width: orbit.radius * 2, 
            height: orbit.radius * 2,
            top: `calc(50% - ${orbit.radius}px)`, // Center the orbit container
            left: `calc(50% - ${orbit.radius}px)`,
          }}
          animate={{ rotate: 360 }}
          transition={{ 
            loop: Infinity, 
            ease: "linear", 
            duration: orbit.rotationDuration * (orbitIndex % 2 === 0 ? 1 : -1) // Alternate rotation direction
          }}
        >
          {/* SVG Orbit Path */}
          <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none">
            <circle 
                cx="50" 
                cy="50" 
                r="49"  // radius within the 100x100 viewBox, slightly less than 50 to keep stroke inside
                className="orbit-path" 
            />
          </svg>
          
          {/* Notes on this orbit */}
          {orbit.notes.map((note, noteIndex) => {
            const angle = (noteIndex / orbit.notes.length) * 2 * Math.PI;
            // Position notes on the circumference of the *parent* rotating div
            const x = Math.cos(angle) * orbit.radius; 
            const y = Math.sin(angle) * orbit.radius;

            return (
              <motion.div
                key={note.id}
                layoutId={`note-${note.id}`} // For smooth transition when it becomes central
                className="absolute z-10" // Ensure notes are above paths
                style={{
                  // Position relative to the center of the rotating orbit div
                  // The note card itself is 32x32 or 36x36, its origin is top-left.
                  // width/height of orbiting note is approx 128px (w-32) or 144px (w-36)
                  // The note card's transform-origin should be center for rotation
                  left: `calc(50% + ${x}px - ${128/2}px)`, // Assuming w-32 (128px) for orbiting notes
                  top: `calc(50% + ${y}px - ${128/2}px)`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                    scale: 0.8 - orbit.level * 0.1, // Smaller for further orbits
                    opacity: 0.9 - orbit.level * 0.1, // Dimmer for further orbits
                    rotate: -360 // Counter-rotate to keep note upright
                }} 
                exit={{ scale: 0, opacity: 0 }}
                transition={{ 
                    type: "spring", 
                    stiffness: 100, 
                    damping: 15,
                    // For counter-rotation to match parent's rotation
                    rotate: { 
                        loop: Infinity, 
                        ease: "linear", 
                        duration: orbit.rotationDuration * (orbitIndex % 2 === 0 ? 1 : -1) 
                    }
                }}
              >
                <NoteCard
                  note={note}
                  onEdit={onEditNote} // Not directly used, click sets as central
                  onClickOrbitingNote={onSetCentralNote}
                  orbitViewStyle="orbiting"
                  layout="orbit" // Pass layout to NoteCard
                />
              </motion.div>
            );
          })}
        </motion.div>
      ))}
    </div>
  );
}
