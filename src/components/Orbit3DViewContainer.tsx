import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Note, BubblePaletteConfig } from '@/types/note';

interface Orbit3DViewContainerProps {
  notes: Note[];
  palette: BubblePaletteConfig;
  onEditNote: (note: Note) => void;
  dynamicStyle?: React.CSSProperties;
  onDuplicate?: (note: Note) => void;
}

function OrbitingNotes({ notes, palette, onEditNote, onDuplicate }: { notes: Note[]; palette: BubblePaletteConfig; onEditNote: (note: Note) => void; onDuplicate?: (note: Note) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    // Rotate the whole group for animation
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.2;
    }
  });

  const radius = 6;
  const ySpread = 2;
  return (
    <group ref={groupRef}>
      {notes.map((note, i) => {
        // Distribute notes in a circle, with some vertical offset for 3D effect
        const angle = (i / notes.length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(angle * 2) * ySpread;
        return (
          <group key={note.id} position={[x, y, z]}>
            {/* Bubble as styled HTML overlay, matching BubbleNoteCard */}
            <Html center distanceFactor={8} style={{ pointerEvents: 'auto' }}>
              <div
                style={{
                  backgroundColor: `hsl(${note.isPinned ? '28 100% 60%' : 'var(--user-bubble-bg)'})`,
                  color: `hsl(${note.isPinned ? '0 0% 100%' : 'var(--user-bubble-text)'})`,
                  boxShadow: `0 0 18px 3px hsla(${note.isPinned ? '45 90% 60%' : 'var(--user-bubble-glow1)'} / 0.7), 0 0 10px 2px hsla(${note.isPinned ? '40 80% 50%' : 'var(--user-bubble-glow2)'} / 0.5)` ,
                  borderRadius: '50%',
                  width: 100,
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer',
                  transition: 'box-shadow 0.3s',
                  border: note.isPinned ? '2px solid gold' : 'none',
                  position: 'relative',
                }}
                title={note.title}
                onClick={() => onEditNote(note)}
              >
                {note.isPinned && (
                  <span style={{ position: 'absolute', top: 8, right: 12, color: 'gold', fontSize: 18 }}>📌</span>
                )}
                <span style={{ textAlign: 'center', width: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {note.title.length > 24 ? note.title.slice(0, 24) + '…' : note.title}
                </span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export function Orbit3DViewContainer({ notes, palette, onEditNote, dynamicStyle, onDuplicate }: Orbit3DViewContainerProps) {
  return (
    <div
      className="relative z-0 flex-grow w-full h-full min-h-[calc(100vh-15rem)] p-4 overflow-hidden bg-gradient-to-br from-[hsl(var(--bubble-bg-start-light))] to-[hsl(var(--bubble-bg-end-light))] dark:from-[hsl(var(--bubble-bg-start-dark))] dark:to-[hsl(var(--bubble-bg-end-dark))] transition-colors duration-300 rounded-2xl"
      style={dynamicStyle}
    >
      <Canvas camera={{ position: [0, 8, 16], fov: 50 }} shadows style={{ width: '100%', height: '60vh', background: 'transparent' }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={0.7} />
        <OrbitingNotes notes={notes} palette={palette} onEditNote={onEditNote} onDuplicate={onDuplicate} />
        <OrbitControls enablePan={false} enableZoom={true} />
      </Canvas>
    </div>
  );
} 