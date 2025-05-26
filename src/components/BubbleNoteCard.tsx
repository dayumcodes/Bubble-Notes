
"use client";

import type { Note } from "@/types/note";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

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
  const [animationParams, setAnimationParams] = useState<React.CSSProperties>({});
  const [size, setSize] = useState(BUBBLE_MIN_SIZE);

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false); // To use in global event listeners

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    const newSize = BUBBLE_MIN_SIZE + Math.random() * (BUBBLE_MAX_SIZE - BUBBLE_MIN_SIZE);
    setSize(newSize);

    // Ensure bubbles are somewhat within view initially
    // Adjusted to use newSize directly for calculation
    const maxTop = containerHeight > 0 ? Math.max(0, containerHeight - newSize - 20) : 200;
    const maxLeft = containerWidth > 0 ? Math.max(0, containerWidth - newSize - 20) : 200;

    const initialTopPx = Math.random() * maxTop;
    const initialLeftPx = Math.random() * maxLeft;
    
    setPosition({ top: initialTopPx, left: initialLeftPx });

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
  }, [containerWidth, containerHeight]); // Removed size dependency as it's set once

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !bubbleRef.current) return; // Only main mouse button
    event.preventDefault();

    bubbleRef.current.dataset.wasDragged = "false"; // Reset drag flag

    setIsDragging(true);
    const rect = bubbleRef.current.getBoundingClientRect();
    dragStartOffset.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current || !bubbleRef.current) return;

      // Mark that dragging has occurred
      bubbleRef.current.dataset.wasDragged = "true";

      let newLeft = event.clientX - dragStartOffset.current.x;
      let newTop = event.clientY - dragStartOffset.current.y;

      const bubbleCurrentSize = size; // Use state 'size' as it's stable after init
      const rightBoundary = containerWidth - bubbleCurrentSize;
      const bottomBoundary = containerHeight - bubbleCurrentSize;

      newLeft = Math.max(0, Math.min(newLeft, rightBoundary < 0 ? 0 : rightBoundary));
      newTop = Math.max(0, Math.min(newTop, bottomBoundary < 0 ? 0 : bottomBoundary));
      
      setPosition({ top: newTop, left: newLeft });
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.body.classList.add("dragging-bubble");
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      document.body.classList.remove("dragging-bubble");
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove("dragging-bubble");
    };
  }, [isDragging, containerWidth, containerHeight, size]);


  const handleClick = () => {
    if (bubbleRef.current?.dataset.wasDragged === "true") {
      // If it was dragged, reset flag and do nothing else for this click.
      bubbleRef.current.dataset.wasDragged = "false";
      return;
    }

    setIsBouncing(true);
    setTimeout(() => {
      onEdit(note);
      setIsBouncing(false);
    }, 500);
  };

  const truncateTitle = (title: string, maxLength: number = 15) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + "...";
  };

  const textColorClass = "dark:text-[hsl(var(--bubble-text-dark))] text-[hsl(var(--bubble-text-light))]";
  const bubbleBgClass = "dark:bg-primary/30 bg-primary/70";

  return (
    <div
      ref={bubbleRef}
      className={cn(
        "bubble-card", // Base class for cursor styles
        "absolute rounded-full flex items-center justify-center p-3 transition-all duration-300 ease-out shadow-xl",
        "hover:shadow-2xl",
        bubbleBgClass,
        isBouncing ? "animate-[bounceBubbleActive_0.5s_ease-out]" : "animate-[floatBubble_var(--animation-duration,20s)_ease-in-out_infinite_alternate_var(--animation-delay,0s)]",
        isDragging && "is-dragging" // Class to pause animation and set grabbing cursor
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        top: `${position.top}px`,
        left: `${position.left}px`,
        boxShadow: `0 0 15px 2px hsla(var(--bubble-glow-light)/0.6), 0 0 8px 1px hsla(var(--bubble-glow-dark)/0.4)`,
        ...animationParams,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !isDragging) handleClick();
      }}
      title={note.title}
    >
      <span 
        className={cn("text-center font-medium break-words text-sm select-none", textColorClass)}
        style={{ pointerEvents: isDragging ? 'none' : 'auto' }} // Prevent span from interfering with drag
      >
        {truncateTitle(note.title, Math.floor(size / 10))}
      </span>
    </div>
  );
}
