
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Note } from "@/types/note";
import { Header } from "@/components/Header";
import { NoteCard } from "@/components/NoteCard";
import { NoteFormDialog } from "@/components/NoteFormDialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, LayoutGrid, List, Droplets, XCircle, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { BubbleViewContainer } from "@/components/BubbleViewContainer";
import { Separator } from "@/components/ui/separator";
import type { HSLColor } from "@/lib/color-utils";
import {
  hexToHsl,
  hslToHex,
  getContrastingTextColor,
  formatHslString,
  parseHslString,
  deriveGlowColors,
} from "@/lib/color-utils";

const initialNotesData: Note[] = [
  { id: '1', title: 'Grocery List', content: 'Milk, Eggs, Bread, Pixelated Apples', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2, tags: ['shopping', 'food'], isPinned: true },
  { id: '2', title: 'Meeting Ideas', content: 'Discuss project Omega, Review timeline, Assign pixel tasks', timestamp: Date.now() - 1000 * 60 * 60 * 5, tags: ['work', 'project omega'], isPinned: false },
  { id: '3', title: 'Game Dev Log', content: 'Fixed player jump bug. Added new level with retro theme.', timestamp: Date.now() - 1000 * 60 * 30, tags: ['devlog', 'gamedev'], isPinned: false },
  { id: '4', title: 'To-Do Today', content: '1. Finish styling app\n2. Test note CRUD\n3. Drink coffee', timestamp: Date.now(), tags: ['todo'], isPinned: true },
  { id: '5', title: 'Recipe for Pixel Pie', content: 'Ingredients: Digital flour, virtual sugar, 1 byte of spice.', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5, tags: ['food', 'recipe'], isPinned: false },
];

type LayoutMode = 'bubble' | 'grid' | 'list';

const THEME_DEFAULT_PALETTE_NAME = 'Theme Default';
const CUSTOM_PALETTE_NAME = 'Custom';

interface BubblePaletteConfig {
  name: string;
  bg: string; // Main background for the bubble (HSL string "H S% L%")
  previewBg?: string; // Optional: if the button preview needs a different shade (HSL string "H S% L%")
  text: string; // Text color (HSL string "H S% L%")
  glow1: string; // Glow1 color (HSL string "H S% L%")
  glow2: string; // Glow2 color (HSL string "H S% L%")
}

const bubblePalettes: Omit<BubblePaletteConfig, 'previewBg'>[] = [ // previewBg will be bg for predefined
  { name: THEME_DEFAULT_PALETTE_NAME, bg: '', text: '', glow1: '', glow2: '' }, // Actual values derived from CSS vars for theme default
  { name: 'Ocean', bg: '200 80% 70%', text: '200 100% 10%', glow1: '190 70% 50%', glow2: '210 90% 80%' },
  { name: 'Sunset', bg: '30 100% 75%', text: '20 100% 15%', glow1: '20 80% 60%', glow2: '40 100% 85%' },
  { name: 'Forest', bg: '120 50% 60%', text: '100 100% 10%', glow1: '110 40% 40%', glow2: '130 60% 75%' },
  { name: 'Lavender', bg: '270 60% 80%', text: '270 100% 20%', glow1: '260 50% 65%', glow2: '280 70% 90%' },
  { name: 'Coral', bg: '10 90% 70%', text: '5 100% 15%', glow1: '5 80% 55%', glow2: '15 100% 80%' },
  { name: CUSTOM_PALETTE_NAME, bg: '', text: '', glow1: '', glow2: '' }, // Placeholder for custom
];

// LocalStorage keys
const NOTES_KEY = 'pixel-notes';
const LAYOUT_KEY = 'pixel-notes-layout';
const PALETTE_NAME_KEY = 'pixel-notes-palette-name';
const CUSTOM_PALETTE_CONFIG_KEY = 'pixel-notes-custom-palette-config';

const DEFAULT_CUSTOM_PALETTE: BubblePaletteConfig = {
  name: CUSTOM_PALETTE_NAME,
  bg: '200 50% 85%', // Default custom bg: light blue
  text: '200 100% 10%', // Default custom text
  glow1: '190 40% 70%', // Default custom glow1
  glow2: '210 60% 90%', // Default custom glow2
};


export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);
  
  const [layout, setLayout] = useState<LayoutMode>('bubble');
  const [selectedPaletteName, setSelectedPaletteName] = useState<string>(THEME_DEFAULT_PALETTE_NAME);
  const [customBubblePalette, setCustomBubblePalette] = useState<BubblePaletteConfig>(DEFAULT_CUSTOM_PALETTE);
  const [isMounted, setIsMounted] = useState(false);


  useEffect(() => {
    setIsMounted(true);
    // Load notes
    const storedNotes = localStorage.getItem(NOTES_KEY);
    let parsedNotes: Note[] = initialNotesData.map(n => ({...n, isPinned: n.isPinned || false, tags: n.tags || []}));
    if (storedNotes) {
      try {
        const tempParsedNotes: Note[] = JSON.parse(storedNotes).map((n: any) => ({
          ...n,
          tags: n.tags || [],
          isPinned: n.isPinned || false,
        }));
        if (Array.isArray(tempParsedNotes) && tempParsedNotes.every(n => typeof n.id === 'string' && typeof n.title === 'string')) {
          parsedNotes = tempParsedNotes;
        }
      } catch (error) {
        console.error("Failed to parse notes from localStorage:", error);
      }
    }
    setNotes(parsedNotes);

    // Load layout
    const storedLayout = localStorage.getItem(LAYOUT_KEY) as LayoutMode | null;
    if (storedLayout && ['bubble', 'grid', 'list'].includes(storedLayout)) {
      setLayout(storedLayout);
    } else {
      setLayout('bubble'); // Default to bubble view
    }

    // Load selected palette name
    const storedPaletteName = localStorage.getItem(PALETTE_NAME_KEY);
    if (storedPaletteName && bubblePalettes.some(p => p.name === storedPaletteName)) {
      setSelectedPaletteName(storedPaletteName);
    } else {
      setSelectedPaletteName(THEME_DEFAULT_PALETTE_NAME);
    }

    // Load custom palette configuration
    const storedCustomPalette = localStorage.getItem(CUSTOM_PALETTE_CONFIG_KEY);
    if (storedCustomPalette) {
      try {
        const parsedCustomPalette = JSON.parse(storedCustomPalette);
        if (parsedCustomPalette.name === CUSTOM_PALETTE_NAME) {
          setCustomBubblePalette(parsedCustomPalette);
        }
      } catch (error) {
        console.error("Failed to parse custom bubble palette from localStorage:", error);
        setCustomBubblePalette(DEFAULT_CUSTOM_PALETTE);
      }
    } else {
       setCustomBubblePalette(DEFAULT_CUSTOM_PALETTE);
    }

  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (notes.length > 0 || localStorage.getItem(NOTES_KEY)) {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    }
  }, [notes, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(LAYOUT_KEY, layout);
  }, [layout, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(PALETTE_NAME_KEY, selectedPaletteName);
  }, [selectedPaletteName, isMounted]);
  
  useEffect(() => {
    if (!isMounted || selectedPaletteName !== CUSTOM_PALETTE_NAME) return;
    localStorage.setItem(CUSTOM_PALETTE_CONFIG_KEY, JSON.stringify(customBubblePalette));
  }, [customBubblePalette, selectedPaletteName, isMounted]);


  const handleAddNote = (noteData: Omit<Note, "id" | "timestamp">) => {
    const newNote: Note = {
      ...noteData,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      isPinned: noteData.isPinned || false,
      tags: noteData.tags || [],
    };
    setNotes((prevNotes) => [newNote, ...prevNotes]);
  };

  const handleEditNote = (noteData: Omit<Note, "id" | "timestamp">, id: string) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, ...noteData, timestamp: Date.now(), isPinned: noteData.isPinned || false, tags: noteData.tags || [] } : note
      )
    );
    setEditingNote(null);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
  };

  const requestDeleteNote = (noteId: string) => {
    setNoteIdToDelete(noteId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteNote = () => {
    if (noteIdToDelete) {
      handleDeleteNote(noteIdToDelete);
    }
    setIsDeleteDialogOpen(false);
    setNoteIdToDelete(null);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleTogglePin = (noteId: string) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === noteId ? { ...note, isPinned: !note.isPinned } : note
      ).sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.timestamp - a.timestamp;
      })
    );
  };
  
  const handleTagClick = (tag: string) => {
    setActiveTagFilter(current => (current === tag ? null : tag));
  };

  const clearTagFilter = () => {
    setActiveTagFilter(null);
  };

  const handleCustomBgColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newBgHex = event.target.value;
    const newBgHsl = hexToHsl(newBgHex);

    if (newBgHsl) {
      const newTextHex = getContrastingTextColor(newBgHex);
      const newTextHsl = hexToHsl(newTextHex); // Text color also needs to be HSL for consistency
      const glows = deriveGlowColors(newBgHsl);

      if (newTextHsl) {
        setCustomBubblePalette({
          name: CUSTOM_PALETTE_NAME,
          bg: formatHslString(newBgHsl),
          text: formatHslString(newTextHsl),
          glow1: glows.glow1,
          glow2: glows.glow2,
        });
      }
    }
  };
  
  const normalizedSearchTerm = searchTerm.toLowerCase();
  const filteredNotes = notes
    .filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(normalizedSearchTerm) ||
        (note.content && note.content.toLowerCase().includes(normalizedSearchTerm)) ||
        (note.tags && note.tags.some(tag => tag.toLowerCase().includes(normalizedSearchTerm)));
      
      const matchesTagFilter = activeTagFilter
        ? note.tags && note.tags.includes(activeTagFilter)
        : true;
        
      return matchesSearch && matchesTagFilter;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.timestamp - a.timestamp;
    });

  let activePaletteConfigResolved: BubblePaletteConfig | undefined;
  if (selectedPaletteName === CUSTOM_PALETTE_NAME) {
    activePaletteConfigResolved = customBubblePalette;
  } else if (selectedPaletteName === THEME_DEFAULT_PALETTE_NAME) {
     activePaletteConfigResolved = { name: THEME_DEFAULT_PALETTE_NAME, bg: '', text: '', glow1: '', glow2: ''}; // Use CSS vars
  } else {
    activePaletteConfigResolved = bubblePalettes.find(p => p.name === selectedPaletteName) as BubblePaletteConfig;
  }
  
  const bubbleViewDynamicStyles =
    activePaletteConfigResolved && selectedPaletteName !== THEME_DEFAULT_PALETTE_NAME
      ? {
          '--user-bubble-bg': activePaletteConfigResolved.bg,
          '--user-bubble-text': activePaletteConfigResolved.text,
          '--user-bubble-glow1': activePaletteConfigResolved.glow1,
          '--user-bubble-glow2': activePaletteConfigResolved.glow2,
        }
      : {};

  const currentCustomBgHex = isMounted && customBubblePalette?.bg ? hslToHex(parseHslString(customBubblePalette.bg)!) : '#cccccc';

  if (!isMounted) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p>Loading notes...</p></div>; // Or a proper skeleton loader
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header layout={layout} />
      <main className="flex-grow container mx-auto px-4 pt-20 pb-28 flex flex-col">
        <div className="my-8 flex flex-col sm:flex-row justify-center items-center gap-4">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search notes, content, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full shadow-sm pl-11 pr-4 py-2.5 rounded-md border"
              aria-label="Search notes"
            />
          </div>
        </div>
        
        <div className="mb-6 flex flex-col items-center gap-4">
          <div className="flex gap-2">
             <span className="text-sm text-muted-foreground self-center mr-2">View:</span>
            <Button
              variant={layout === 'bubble' ? 'secondary' : 'outline'}
              size="icon"
              onClick={() => setLayout('bubble')}
              aria-label="Bubble view"
              title="Bubble View"
            >
              <Droplets className="h-5 w-5" />
            </Button>
            <Button
              variant={layout === 'grid' ? 'secondary' : 'outline'}
              size="icon"
              onClick={() => setLayout('grid')}
              aria-label="Grid view"
              title="Grid View"
            >
              <LayoutGrid className="h-5 w-5" />
            </Button>
            <Button
              variant={layout === 'list' ? 'secondary' : 'outline'}
              size="icon"
              onClick={() => setLayout('list')}
              aria-label="List view"
              title="List View"
            >
              <List className="h-5 w-5" />
            </Button>
          </div>

          {layout === 'bubble' && (
            <>
              <Separator className="my-2 w-1/2 max-w-md" />
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Palette size={16} /> Bubble Palette:
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {bubblePalettes.map((palette) => {
                    const isActive = selectedPaletteName === palette.name;
                    let previewColor = palette.bg;
                    if (palette.name === CUSTOM_PALETTE_NAME && customBubblePalette) {
                      previewColor = customBubblePalette.bg;
                    } else if (palette.name === THEME_DEFAULT_PALETTE_NAME) {
                        previewColor = 'var(--primary)'; 
                    }

                    return (
                      <Button
                        key={palette.name}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedPaletteName(palette.name)}
                        className={cn(
                          "p-2 h-auto rounded-md",
                          isActive && "ring-2 ring-ring ring-offset-2"
                        )}
                        title={palette.name}
                        style={palette.name === THEME_DEFAULT_PALETTE_NAME && isActive ? { backgroundColor: `hsl(${previewColor})`, color: 'hsl(var(--primary-foreground))' } : {}}
                      >
                        {palette.name === THEME_DEFAULT_PALETTE_NAME || palette.name === CUSTOM_PALETTE_NAME ? (
                           <span className="text-xs">{palette.name === THEME_DEFAULT_PALETTE_NAME ? "Theme" : "Custom"}</span>
                        ) : (
                          <div 
                            className="w-5 h-5 rounded-full border border-border"
                            style={{ backgroundColor: `hsl(${previewColor})` }}
                          />
                        )}
                         {/* Conditionally render the name for non-Theme/Custom palettes on larger screens */}
                         {palette.name !== THEME_DEFAULT_PALETTE_NAME && palette.name !== CUSTOM_PALETTE_NAME && (
                            <span className="ml-1.5 text-xs hidden sm:inline">
                                {palette.name}
                            </span>
                         )}
                      </Button>
                    );
                  })}
                </div>
                {selectedPaletteName === CUSTOM_PALETTE_NAME && (
                  <div className="mt-3 flex flex-col items-center gap-2 p-3 border rounded-md bg-muted/50">
                    <label htmlFor="custom-bubble-bg" className="text-xs text-muted-foreground">
                      Custom Background Color:
                    </label>
                    <input
                      type="color"
                      id="custom-bubble-bg"
                      value={currentCustomBgHex}
                      onChange={handleCustomBgColorChange}
                      className="w-20 h-8 p-0 border-none rounded cursor-pointer"
                      title="Pick custom background color"
                    />
                     <p className="text-xs text-muted-foreground mt-1">Text & glow colors derived automatically.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>


        {activeTagFilter && (
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Filtering by:</span>
            <Badge variant="secondary" className="font-medium">
              {activeTagFilter}
            </Badge>
            <Button variant="ghost" size="sm" onClick={clearTagFilter} className="p-1 h-auto text-muted-foreground hover:text-destructive">
              <XCircle className="h-4 w-4 mr-1" /> Clear
            </Button>
          </div>
        )}

        {layout === 'bubble' ? (
          <BubbleViewContainer 
            notes={filteredNotes} 
            onEditNote={openEditModal} 
            dynamicStyle={bubbleViewDynamicStyles}
          />
        ) : (
          filteredNotes.length > 0 ? (
            <div className={cn(
              "gap-6",
              layout === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col"
            )}>
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={openEditModal}
                  onDelete={requestDeleteNote}
                  onTogglePin={handleTogglePin}
                  onTagClick={handleTagClick}
                  layout={layout}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-xl text-muted-foreground">
                {searchTerm || activeTagFilter ? "No notes match your filters." : "You have no notes. Click '+' to add one!"}
              </p>
            </div>
          )
        )}
      </main>

      <Button
        onClick={openAddModal}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 rounded-full w-14 h-14 p-0 shadow-lg bg-primary hover:bg-primary/90"
        aria-label="Add new note"
      >
        <Plus className="h-7 w-7 text-primary-foreground" />
      </Button>

      <NoteFormDialog
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={(data, id) => (id ? handleEditNote(data, id) : handleAddNote(data))}
        initialData={editingNote}
      />
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDeleteNote}
      />
    </div>
  );
}

