
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-pixel text-primary">My Notes</h1>
        <ThemeToggle />
      </div>
    </header>
  );
}
