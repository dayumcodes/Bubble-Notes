import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

interface HeaderProps {
  layout?: 'grid' | 'list' | 'bubble' | 'orbit';
}

export function Header({ layout }: HeaderProps) {
  const isOrbitView = layout === 'orbit';
  const title = isOrbitView ? "Orbit View" : layout === 'bubble' ? "Bubble Notes" : "My Notes";
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <h1 className={cn(
            "text-3xl md:text-4xl font-pixel text-[#3D85A9]"
          )}
        >
          {title}
        </h1>
        <ThemeToggle />
      </div>
    </header>
  );
}

