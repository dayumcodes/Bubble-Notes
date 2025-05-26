
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // useEffect only runs on the client, so now we can show the UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder or null to avoid hydration issues
    // A disabled button showing a generic icon is a good placeholder
    // and maintains layout consistency.
    return (
      <Button variant="outline" size="icon" disabled aria-label="Loading theme toggle...">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  const isDarkMode = resolvedTheme === 'dark';

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">
        {isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      </span>
    </Button>
  );
}
