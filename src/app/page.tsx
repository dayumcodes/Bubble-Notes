"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Note } from "@/types/note";
import { Header } from "@/components/Header";
import { NoteCard } from "@/components/NoteCard";
import { NoteFormDialog } from "@/components/NoteFormDialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, LayoutGrid, List, Droplets, XCircle, Filter, ListChecks, Trash2, Atom } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import React from "react";
import { motion } from "framer-motion";
import { HexColorPicker } from "react-colorful";

type LayoutMode = 'bubble' | 'grid' | 'list';

const THEME_DEFAULT_PALETTE_NAME = 'Theme Default';
const CUSTOM_PALETTE_NAME = 'Custom';

interface BubblePaletteConfig {
  name: string;
  bg: string;
  previewBg?: string;
  text: string;
  glow1: string;
  glow2: string;
}

const bubblePalettes: Omit<BubblePaletteConfig, 'previewBg'>[] = [
  { name: THEME_DEFAULT_PALETTE_NAME, bg: '', text: '', glow1: '', glow2: '' },
  { name: 'Ocean', bg: '200 80% 70%', text: '200 100% 10%', glow1: '190 70% 50%', glow2: '210 90% 80%' },
  { name: 'Sunset', bg: '30 100% 75%', text: '20 100% 15%', glow1: '20 80% 60%', glow2: '40 100% 85%' },
  { name: 'Forest', bg: '120 50% 60%', text: '100 100% 10%', glow1: '110 40% 40%', glow2: '130 60% 75%' },
  { name: 'Lavender', bg: '270 60% 80%', text: '270 100% 20%', glow1: '260 50% 65%', glow2: '280 70% 90%' },
  { name: 'Coral', bg: '10 90% 70%', text: '5 100% 15%', glow1: '5 80% 55%', glow2: '15 100% 80%' },
  { name: CUSTOM_PALETTE_NAME, bg: '', text: '', glow1: '', glow2: '' },
];

const NOTES_KEY = 'pixel-notes';
const LAYOUT_KEY = 'pixel-notes-layout';
const PALETTE_NAME_KEY = 'pixel-notes-palette-name';
const CUSTOM_PALETTE_CONFIG_KEY = 'pixel-notes-custom-palette-config';

const DEFAULT_CUSTOM_PALETTE: BubblePaletteConfig = {
  name: CUSTOM_PALETTE_NAME,
  bg: '200 50% 85%',
  text: '200 100% 10%',
  glow1: '190 40% 70%',
  glow2: '210 60% 90%',
};

export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [isPermanentDeleteConfirmOpen, setIsPermanentDeleteConfirmOpen] = useState(false);
  const [noteIdForPermanentDelete, setNoteIdForPermanentDelete] = useState<string | null>(null);

  const [layout, setLayout] = useState<LayoutMode>('bubble');
  const [selectedPaletteName, setSelectedPaletteName] = useState<string>(THEME_DEFAULT_PALETTE_NAME);
  const [customBubblePalette, setCustomBubblePalette] = useState<BubblePaletteConfig>(DEFAULT_CUSTOM_PALETTE);
  const [isMounted, setIsMounted] = useState(false);
  const [showTrashedNotes, setShowTrashedNotes] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isFiltersPopoverOpen, setIsFiltersPopoverOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const colorInputRecentlyClicked = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    const storedNotes = localStorage.getItem(NOTES_KEY);
    let parsedNotes: Note[] = [];
    if (storedNotes) {
      try {
        const tempParsedNotes: Note[] = JSON.parse(storedNotes).map((n: any) => ({
          ...n,
          tags: n.tags || [],
          isPinned: n.isPinned || false,
          status: n.status || 'active',
        }));
        if (Array.isArray(tempParsedNotes) && tempParsedNotes.every(n => typeof n.id === 'string' && typeof n.title === 'string')) {
          parsedNotes = tempParsedNotes;
        }
      } catch (error) {
        console.error("Failed to parse notes from localStorage:", error);
      }
    }
    setNotes(parsedNotes);

    const storedLayout = localStorage.getItem(LAYOUT_KEY) as LayoutMode | null;
    if (storedLayout && ['bubble', 'grid', 'list'].includes(storedLayout)) {
      setLayout(storedLayout);
    } else {
      setLayout('bubble');
    }

    const storedPaletteName = localStorage.getItem(PALETTE_NAME_KEY);
    if (storedPaletteName && bubblePalettes.some(p => p.name === storedPaletteName)) {
      setSelectedPaletteName(storedPaletteName);
    } else {
      setSelectedPaletteName(THEME_DEFAULT_PALETTE_NAME);
    }

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
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
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

  const openAddModal = useCallback(() => {
    setEditingNote(null);
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        openAddModal();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        if (isModalOpen) {
          event.preventDefault();
          setIsModalOpen(false);
        } else if (isPermanentDeleteConfirmOpen) {
          event.preventDefault();
          setIsPermanentDeleteConfirmOpen(false);
        } else if (isFiltersPopoverOpen) {
          event.preventDefault();
          setIsFiltersPopoverOpen(false);
        } else if (searchTerm) {
          event.preventDefault();
          setSearchTerm("");
        } else if (activeTagFilter) {
          event.preventDefault();
          setActiveTagFilter(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen, isPermanentDeleteConfirmOpen, isFiltersPopoverOpen, searchTerm, activeTagFilter, openAddModal]);

  const activeNotes = useMemo(() => notes.filter(note => note.status === 'active' || !note.status)
    .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.timestamp - a.timestamp;
      })
  , [notes]);

  const handleAddNote = (noteData: Omit<Note, "id" | "timestamp" | "status">) => {
    const newNote: Note = {
      ...noteData,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      isPinned: noteData.isPinned || false,
      tags: noteData.tags || [],
      status: 'active',
    };
    setNotes((prevNotes) => [newNote, ...prevNotes]);
  };

  const handleEditNote = (noteData: Omit<Note, "id" | "timestamp" | "status">, id: string) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, ...noteData, timestamp: Date.now(), isPinned: noteData.isPinned || false, tags: noteData.tags || [] } : note
      )
    );
    setEditingNote(null);
  };

  const handleMoveToTrash = (noteId: string) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, status: 'trashed', isPinned: false, timestamp: Date.now() } : note
      )
    );
  };

  const handleRestoreFromTrash = (noteId: string) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, status: 'active', timestamp: Date.now() } : note
      ).sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.timestamp - a.timestamp;
      })
    );
  };

  const handleDeletePermanently = (noteId: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
  };

  const requestPermanentDelete = (noteId: string) => {
    setNoteIdForPermanentDelete(noteId);
    setIsPermanentDeleteConfirmOpen(true);
  };

  const confirmPermanentDelete = () => {
    if (noteIdForPermanentDelete) {
      handleDeletePermanently(noteIdForPermanentDelete);
    }
    setIsPermanentDeleteConfirmOpen(false);
    setNoteIdForPermanentDelete(null);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
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
      const newTextHsl = hexToHsl(newTextHex);
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
      const matchesStatus = showTrashedNotes ? note.status === 'trashed' : (note.status === 'active' || !note.status);
      if (!matchesStatus) return false;

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
      if (showTrashedNotes) {
        return b.timestamp - a.timestamp;
      }
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.timestamp - a.timestamp;
    });

  const activeNotesForViews = activeNotes
    .filter((note) => {
        const matchesSearch =
          note.title.toLowerCase().includes(normalizedSearchTerm) ||
          (note.content && note.content.toLowerCase().includes(normalizedSearchTerm)) ||
          (note.tags && note.tags.some(tag => tag.toLowerCase().includes(normalizedSearchTerm)));
        const matchesTagFilter = activeTagFilter
          ? note.tags && note.tags.includes(activeTagFilter)
          : true;
        return matchesSearch && matchesTagFilter;
      });

  let activePaletteConfigResolved: BubblePaletteConfig | undefined;
  if (selectedPaletteName === CUSTOM_PALETTE_NAME) {
    activePaletteConfigResolved = customBubblePalette;
  } else if (selectedPaletteName === THEME_DEFAULT_PALETTE_NAME) {
     activePaletteConfigResolved = { name: THEME_DEFAULT_PALETTE_NAME, bg: '', text: '', glow1: '', glow2: ''};
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

  const allUniqueActiveTags = useMemo(() => {
    if (showTrashedNotes) return [];
    const tagSet = new Set<string>();
    notes
      .filter(note => note.status === 'active' || !note.status)
      .forEach(note => {
        if (note.tags) {
          note.tags.forEach(tag => tagSet.add(tag));
        }
      });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [notes, showTrashedNotes]);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header layout={layout} />
        <main className="flex-grow flex items-center justify-center">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  const FilterControls = () => (
    <div className="p-4 space-y-6 bg-background/20 dark:bg-background/80 backdrop-blur-md rounded-lg shadow-lg">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
        <div className="flex gap-2">
          <Button
            variant={!showTrashedNotes ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowTrashedNotes(false)}
            title="View Active Notes"
            className="flex-1 modern-filter-button data-[state=active]:modern-filter-button-active"
            data-state={!showTrashedNotes ? 'active' : 'inactive'}
          >
            <ListChecks className="h-4 w-4 mr-2" /> Active
          </Button>
          <Button
            variant={showTrashedNotes ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowTrashedNotes(true)}
            title="View Trashed Notes"
            className="flex-1 modern-filter-button data-[state=active]:modern-filter-button-active"
            data-state={showTrashedNotes ? 'active' : 'inactive'}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Trash
          </Button>
        </div>
      </div>

      {(layout === 'bubble') && !showTrashedNotes && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Bubble Palette</h3>
             <p className="text-xs text-muted-foreground mb-2">Applies to Bubble View only.</p>
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
                      "p-2 h-auto rounded-full w-10 h-10 modern-filter-button data-[state=active]:modern-filter-button-active data-[state=active]:ring-2 data-[state=active]:ring-offset-2 data-[state=active]:ring-primary",
                      palette.name === THEME_DEFAULT_PALETTE_NAME && isActive ? { backgroundColor: `hsl(${previewColor})`, color: 'hsl(var(--primary-foreground))' } : {}
                    )}
                    title={palette.name}
                    data-state={isActive ? 'active' : 'inactive'}
                  >
                    {palette.name === THEME_DEFAULT_PALETTE_NAME || palette.name === CUSTOM_PALETTE_NAME ? (
                        <span className="text-xs leading-tight text-center">
                        {palette.name === THEME_DEFAULT_PALETTE_NAME ? "Theme" : "Custom"}
                        </span>
                    ) : (
                      <div
                        className="w-5 h-5 rounded-full border border-border"
                        style={{ backgroundColor: `hsl(${previewColor})` }}
                      />
                    )}
                  </Button>
                );
              })}
            </div>
            {selectedPaletteName === CUSTOM_PALETTE_NAME && (
              <div className={cn(
                  "mt-3 flex flex-col items-center gap-2 p-3 border rounded-md bg-muted/20 backdrop-blur-sm")}>
                <label htmlFor="custom-bubble-bg" className="text-xs text-muted-foreground">
                  Custom Background:
                </label>
                <div className="w-full flex flex-col items-center">
                  <HexColorPicker
                    color={currentCustomBgHex}
                    onChange={color => handleCustomBgColorChange({ target: { value: color } } as any)}
                    style={{ width: "100%", maxWidth: 220, marginBottom: 8 }}
                  />
                  <Input
                    id="custom-bubble-bg"
                    type="text"
                    value={currentCustomBgHex}
                    onChange={handleCustomBgColorChange}
                    className="w-28 text-center mt-2"
                    title="Hex color value"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Text & glow derived automatically.</p>
                <Button
                  className="mt-2"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsFiltersPopoverOpen(false)}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {!showTrashedNotes && allUniqueActiveTags.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Filter by Tag</h3>
            <div className="flex flex-wrap justify-center gap-2 tag-container-animate">
              {allUniqueActiveTags.map((tag, index) => (
                <Badge
                  key={tag}
                  variant={activeTagFilter === tag ? 'default' : 'secondary'}
                  onClick={() => handleTagClick(tag)}
                  className="modern-filter-button data-[state=active]:modern-filter-button-active cursor-pointer text-xs py-1 px-3 transition-all duration-300"
                  data-state={activeTagFilter === tag ? 'active' : 'inactive'}
                  title={`Filter by tag: ${tag}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {highlightText(tag, searchTerm)}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header layout={layout} />
      <main className="flex-grow container mx-auto px-4 pt-20 pb-28 flex flex-col">
        <div className="my-6 flex flex-col sm:flex-row justify-center items-center gap-4 relative">
          <div
            className={cn(
              "search-bar-container group relative w-full transition-all duration-300 ease-out",
              isSearchFocused ? "max-w-2xl" : "max-w-xl"
            )}
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Search notes, content, or tags... (Ctrl+F)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="search-input w-full shadow-lg pl-11 pr-4 py-3 rounded-full border-transparent focus:border-transparent bg-background/70 backdrop-blur-sm focus:ring-2 focus:ring-primary/70 focus:ring-offset-0"
              aria-label="Search notes"
            />
          </div>
          <div className="flex gap-2 items-center">
            <Button
                variant={layout === 'bubble' ? 'secondary' : 'outline'}
                size="icon"
                onClick={() => setLayout('bubble')}
                aria-label="Bubble view"
                title="Bubble View"
                disabled={showTrashedNotes}
                className="modern-filter-button rounded-full shadow-lg bg-background/70 backdrop-blur-sm data-[state=active]:modern-filter-button-active"
                data-state={layout === 'bubble' ? 'active' : 'inactive'}
            >
                <Droplets className="h-5 w-5" />
            </Button>
            <Button
                variant={layout === 'grid' ? 'secondary' : 'outline'}
                size="icon"
                onClick={() => setLayout('grid')}
                aria-label="Grid view"
                title="Grid View"
                className="modern-filter-button rounded-full shadow-lg bg-background/70 backdrop-blur-sm data-[state=active]:modern-filter-button-active"
                data-state={layout === 'grid' ? 'active' : 'inactive'}
            >
                <LayoutGrid className="h-5 w-5" />
            </Button>
            <Button
                variant={layout === 'list' ? 'secondary' : 'outline'}
                size="icon"
                onClick={() => setLayout('list')}
                aria-label="List view"
                title="List View"
                className="modern-filter-button rounded-full shadow-lg bg-background/70 backdrop-blur-sm data-[state=active]:modern-filter-button-active"
                data-state={layout === 'list' ? 'active' : 'inactive'}
            >
                <List className="h-5 w-5" />
            </Button>
            <Popover open={isFiltersPopoverOpen} onOpenChange={(open) => {
              if (!colorInputRecentlyClicked.current) setIsFiltersPopoverOpen(open);
            }}>
                <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="modern-filter-button rounded-full shadow-lg bg-background/70 backdrop-blur-sm"
                    title="Open Filters"
                >
                    <Filter className="h-5 w-5" />
                </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-80 p-0 border-none shadow-2xl bg-transparent"
                    sideOffset={10}
                    onPointerDownOutside={(event) => {
                        const target = event.target as HTMLElement;
                        if (target.closest('#custom-bubble-bg') || (target.nodeName === 'INPUT' && target.getAttribute('type') === 'color')) {
                             event.preventDefault();
                             colorInputRecentlyClicked.current = true;
                        } else {
                            colorInputRecentlyClicked.current = false;
                        }
                    }}
                    onInteractOutside={(event) => {
                        const target = event.target as HTMLElement;
                        if (target.closest('#custom-bubble-bg')) {
                             event.preventDefault();
                             colorInputRecentlyClicked.current = true;
                        } else {
                            colorInputRecentlyClicked.current = false;
                        }
                    }}
                >
                    <FilterControls />
                </PopoverContent>
            </Popover>
          </div>
        </div>

        {activeTagFilter && (
          <div className="mb-4 flex items-center justify-center gap-2 animate-fadeIn">
            <span className="text-sm text-muted-foreground">Filtering by:</span>
            <Badge variant="secondary" className="font-medium modern-filter-button modern-filter-button-active">
              {highlightText(activeTagFilter, searchTerm)}
            </Badge>
            <Button variant="ghost" size="sm" onClick={clearTagFilter} className="p-1 h-auto text-muted-foreground hover:text-destructive modern-filter-button">
              <XCircle className="h-4 w-4 mr-1" /> Clear
            </Button>
          </div>
        )}

        {layout === 'bubble' && !showTrashedNotes ? (
          <BubbleViewContainer
            notes={activeNotesForViews}
            onEditNote={openEditModal}
            dynamicStyle={bubbleViewDynamicStyles}
          />
        ) : (
          filteredNotes.length > 0 ? (
            <div className={cn(
              "gap-6 animate-fadeIn",
              layout === 'grid' && !showTrashedNotes ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col"
            )}>
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  searchTerm={searchTerm}
                  onEdit={openEditModal}
                  onTogglePin={handleTogglePin}
                  onTagClick={handleTagClick}
                  layout={layout}
                  onMoveToTrash={handleMoveToTrash}
                  onRestoreFromTrash={handleRestoreFromTrash}
                  onDeletePermanently={requestPermanentDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 animate-fadeIn">
              <p className="text-xl text-muted-foreground">
                {searchTerm || activeTagFilter ? "No notes match your filters." :
                 showTrashedNotes ? "Your trash is empty." :
                 "You have no active notes. Click '+' to add one!"}
              </p>
            </div>
          )
        )}
      </main>

      {!showTrashedNotes && (
        <motion.button
          onClick={openAddModal}
          aria-label="Add new note (Ctrl+N)"
          title="Add new note (Ctrl+N)"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 rounded-full w-16 h-16 flex items-center justify-center bg-gradient-to-br from-yellow-300 via-orange-400 to-pink-400 shadow-2xl shadow-yellow-200/40 dark:shadow-yellow-500/30 border-4 border-white/40 dark:border-black/40 text-white text-4xl hover:scale-110 active:scale-95 transition-transform focus:outline-none focus:ring-4 focus:ring-yellow-300/60 animate-pulseDot"
          whileHover={{ scale: 1.12, boxShadow: "0 0 40px 10px #fbbf24aa" }}
          whileTap={{ scale: 0.95 }}
          type="button"
        >
          <Plus className="w-9 h-9" />
        </motion.button>
      )}

      <NoteFormDialog
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={(data, id) => (id ? handleEditNote(data, id) : handleAddNote(data))}
        initialData={editingNote}
      />
      <DeleteConfirmationDialog
        isOpen={isPermanentDeleteConfirmOpen}
        onOpenChange={setIsPermanentDeleteConfirmOpen}
        onConfirm={confirmPermanentDelete}
        title="Permanently delete note?"
        description="This action cannot be undone. The note will be gone forever."
      />
    </div>
  );
}

// Helper function for highlighting text - can be moved to utils if used elsewhere
const highlightText = (text: string | null | undefined, highlight: string | null | undefined): React.ReactNode => {
  if (!text) return "";
  if (!highlight || !highlight.trim()) {
    return <>{text}</>;
  }
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedHighlight})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/30 text-primary-foreground rounded-[0.2rem] px-0.5 mx-[1px]">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
};
    

    


