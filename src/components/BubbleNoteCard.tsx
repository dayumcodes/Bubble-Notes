
"use client";

import type { Note } from "@/types/note";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef, useCallback } from "react";

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
  const [position, setPosition] = useState({ top: Math.random() * 200, left: Math.random() * 200 }); // Initial placeholder
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false); 

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    const newSize = BUBBLE_MIN_SIZE + Math.random() * (BUBBLE_MAX_SIZE - BUBBLE_MIN_SIZE);
    setSize(newSize);

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
  }, [containerWidth, containerHeight]);


  const internalHandleDragStart = useCallback((clientX: number, clientY: number) => {
    if (!bubbleRef.current) return;
    bubbleRef.current.dataset.wasDragged = "false"; 

    setIsDragging(true);
    const rect = bubbleRef.current.getBoundingClientRect();
    dragStartOffset.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const internalHandleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current || !bubbleRef.current) return;

    bubbleRef.current.dataset.wasDragged = "true";

    const parentEl = bubbleRef.current.parentElement;
    if (!parentEl) return;
    const parentRect = parentEl.getBoundingClientRect();

    // Calculate target position relative to the viewport
    let targetViewportX = clientX - dragStartOffset.current.x;
    let targetViewportY = clientY - dragStartOffset.current.y;

    // Convert to position relative to the parent container
    let newLeft = targetViewportX - parentRect.left;
    let newTop = targetViewportY - parentRect.top;

    const bubbleCurrentSize = size;
    const rightBoundary = containerWidth - bubbleCurrentSize;
    const bottomBoundary = containerHeight - bubbleCurrentSize;

    newLeft = Math.max(0, Math.min(newLeft, rightBoundary < 0 ? 0 : rightBoundary));
    newTop = Math.max(0, Math.min(newTop, bottomBoundary < 0 ? 0 : bottomBoundary));
      
    setPosition({ top: newTop, left: newLeft });
  }, [size, containerWidth, containerHeight]);

  const internalHandleDragEnd = useCallback(() => {
    if (isDraggingRef.current) {
      setIsDragging(false);
    }
  }, []);
  
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return; 
    // event.preventDefault(); // Usually not needed for mousedown, can interfere with focus/click
    internalHandleDragStart(event.clientX, event.clientY);
  }, [internalHandleDragStart]);

  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 1) { // Handle single touch
      // event.preventDefault(); // Avoid if it prevents click, handle in touchmove
      internalHandleDragStart(event.touches[0].clientX, event.touches[0].clientY);
    }
  }, [internalHandleDragStart]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current) return;
      internalHandleDragMove(event.clientX, event.clientY);
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!isDraggingRef.current || event.touches.length !== 1) return;
      event.preventDefault(); // Prevent page scroll during drag
      internalHandleDragMove(event.touches[0].clientX, event.touches[0].clientY);
    };

    const onMouseUpOrTouchEnd = () => {
      internalHandleDragEnd();
    };

    if (isDragging) {
      document.body.classList.add("dragging-bubble");
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUpOrTouchEnd);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onMouseUpOrTouchEnd);
      window.addEventListener('touchcancel', onMouseUpOrTouchEnd);
    } else {
      document.body.classList.remove("dragging-bubble");
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUpOrTouchEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUpOrTouchEnd);
      window.removeEventListener('touchcancel', onMouseUpOrTouchEnd);
      document.body.classList.remove("dragging-bubble");
    };
  }, [isDragging, internalHandleDragMove, internalHandleDragEnd]);


  const handleClick = () => {
    if (bubbleRef.current?.dataset.wasDragged === "true") {
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
        "bubble-card",
        "absolute rounded-full flex items-center justify-center p-3 transition-all duration-300 ease-out shadow-xl",
        "hover:shadow-2xl",
        bubbleBgClass,
        isBouncing ? "animate-[bounceBubbleActive_0.5s_ease-out]" : "animate-[floatBubble_var(--animation-duration,20s)_ease-in-out_infinite_alternate_var(--animation-delay,0s)]",
        isDragging && "is-dragging"
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        top: `${position.top}px`,
        left: `${position.left}px`,
        boxShadow: `0 0 15px 2px hsla(var(--bubble-glow-light)/0.6), 0 0 8px 1px hsla(var(--bubble-glow-dark)/0.4)`,
        touchAction: 'none', // Recommended for draggable elements on touch devices
        ...animationParams,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick} // onClick works for both mouse and tap after touch
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !isDraggingRef.current) handleClick();
      }}
      title={note.title}
    >
      <span 
        className={cn("text-center font-medium break-words text-sm select-none", textColorClass)}
        style={{ pointerEvents: isDraggingRef.current ? 'none' : 'auto' }}
      >
        {truncateTitle(note.title, Math.floor(size / 10))}
      </span>
    </div>
  );
}

