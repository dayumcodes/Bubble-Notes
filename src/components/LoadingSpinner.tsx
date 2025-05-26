
"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex h-full w-full items-center justify-center", className)}>
      <div className="flex space-x-2">
        <div className="h-3 w-3 rounded-full bg-primary animate-pulseDot" style={{ animationDelay: '0s' }} />
        <div className="h-3 w-3 rounded-full bg-primary animate-pulseDot" style={{ animationDelay: '0.2s' }} />
        <div className="h-3 w-3 rounded-full bg-primary animate-pulseDot" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );
}
