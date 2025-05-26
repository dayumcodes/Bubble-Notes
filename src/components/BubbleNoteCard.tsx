
"use client";

import type { Note } from "@/types/note";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface BubbleNoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  containerWidth: number;
  containerHeight: number;
}

const BUBBLE_MIN_SIZE = 80; // px
const BUBBLE_MAX_SIZE = 150; // px

export function BubbleNoteCard({ note, onEdit, containerWidth, containerHeight }: BubbleNoteCardProps) {
  const [isBouncing, setIsBouncing] = useState(false);
  const [initialPosition, setInitialPosition] = useState({ top: "50%", left: "50%" });
  const [animationParams, setAnimationParams] = useState<React.CSSProperties>({});
  const [size, setSize] = useState(BUBBLE_MIN_SIZE);

  useEffect(() => {
    // Randomize initial position, size, and animation parameters
    const newSize = BUBBLE_MIN_SIZE + Math.random() * (BUBBLE_MAX_SIZE - BUBBLE_MIN_SIZE);
    setSize(newSize);

    // Ensure bubbles are somewhat within view initially
    const maxTop = containerHeight > 0 ? containerHeight - newSize - 20 : 200; // 20px buffer
    const maxLeft = containerWidth > 0 ? containerWidth - newSize - 20 : 200;

    setInitialPosition({
      top: `${Math.random() * Math.max(0, maxTop)}px`,
      left: `${Math.random() * Math.max(0, maxLeft)}px`,
    });

    setAnimationParams({
      "--dx1": `${(Math.random() - 0.5) * 20}px`,
      "--dy1": `${(Math.random() - 0.5) * 20}px`,
      "--dr1": `${(Math.random() - 0.5) * 10}deg`,
      "--dx2": `${(Math.random() - 0.5) * 20}px`,
      "--dy2": `${(Math.random() - 0.5) * 20}px`,
      "--dr2": `${(Math.random() - 0.5) * 10}deg`,
      "--dx3": `${(Math.random() - 0.5) * 20}px`,
      "--dy3": `${(Math.random() - 0.5) * 20}px`,
      "--dr3": `${(Math.random() - 0.5) * 10}deg`,
      animationDuration: `${15 + Math.random() * 10}s`,
      animationDelay: `${Math.random() * 5}s`,
    } as React.CSSProperties);
  }, [containerWidth, containerHeight]);

  const handleClick = () => {
    setIsBouncing(true);
    setTimeout(() => {
      onEdit(note);
      setIsBouncing(false); // Reset after some time if dialog doesn't take over focus
    }, 500); // Duration of bounce animation
  };

  const truncateTitle = (title: string, maxLength: number = 15) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + "...";
  };

  // Determine text color based on theme (using CSS variables)
  const textColorClass = "dark:text-[hsl(var(--bubble-text-dark))] text-[hsl(var(--bubble-text-light))]";
  const bubbleBgClass = "dark:bg-primary/30 bg-primary/70"; // Softer primary for bubble background

  return (
    <div
      className={cn(
        "absolute rounded-full flex items-center justify-center p-3 cursor-pointer transition-all duration-300 ease-out shadow-xl",
        "hover:shadow-2xl",
        bubbleBgClass,
        isBouncing ? "animate-[bounceBubbleActive_0.5s_ease-out]" : "animate-[floatBubble_var(--animation-duration,20s)_ease-in-out_infinite_alternate_var(--animation-delay,0s)]"
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        top: initialPosition.top,
        left: initialPosition.left,
        boxShadow: `0 0 15px 2px hsla(var(--bubble-glow-light)/0.6), 0 0 8px 1px hsla(var(--bubble-glow-dark)/0.4)`, // Adjusted for better visibility
        ...animationParams,
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      title={note.title}
    >
      <span className={cn("text-center font-medium break-words text-sm", textColorClass)}>
        {truncateTitle(note.title, Math.floor(size / 10))}
      </span>
    </div>
  );
}
