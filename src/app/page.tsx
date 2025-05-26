
"use client";

import { useState, useEffect } from "react";
import type { Note } from "@/types/note";
import { Header } from "@/components/Header";
import { NoteCard } from "@/components/NoteCard";
import { NoteFormDialog } from "@/components/NoteFormDialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, LayoutGrid, List, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import { BubbleViewContainer } from "@/components/BubbleViewContainer";


const initialNotesData: Note[] = [
  { id: '1', title: 'Grocery List', content: 'Milk, Eggs, Bread, Pixelated Apples', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2, tags: ['shopping', 'food'] },
  { id: '2', title: 'Meeting Ideas', content: 'Discuss project Omega, Review timeline, Assign pixel tasks', timestamp: Date.now() - 1000 * 60 * 60 * 5, tags: ['work', 'project omega'] },
  { id: '3', title: 'Game Dev Log', content: 'Fixed player jump bug. Added new level with retro theme.', timestamp: Date.now() - 1000 * 60 * 30, tags: ['devlog', 'gamedev'] },
  { id: '4', title: 'To-Do Today', content: '1. Finish styling app\n2. Test note CRUD\n3. Drink coffee', timestamp: Date.now(), tags: ['todo'] },
];

type LayoutMode = 'grid' | 'list' | 'bubble';

export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);
  const [layout, setLayout] = useState<LayoutMode>('bubble'); // Default to bubble view
  
  useEffect(() => {
    // Load notes from localStorage or use initial data
    const storedNotes = localStorage.getItem('pixel-notes');
    if (storedNotes) {
      try {
        const parsedNotes = JSON.parse(storedNotes);
        // Basic validation
        if (Array.isArray(parsedNotes) && parsedNotes.every(n => typeof n.id === 'string' && typeof n.title === 'string')) {
          setNotes(parsedNotes);
        } else {
          setNotes(initialNotesData);
        }
      } catch (error) {
        console.error("Failed to parse notes from localStorage:", error);
        setNotes(initialNotesData);
      }
    } else {
      setNotes(initialNotesData);
    }
  }, []);

  useEffect(() => {
    // Save notes to localStorage whenever they change
    if (notes.length > 0 || localStorage.getItem('pixel-notes')) { // Avoid saving empty initial array if nothing was there
        localStorage.setItem('pixel-notes', JSON.stringify(notes));
    }
  }, [notes]);


  const handleAddNote = (noteData: Omit<Note, "id" | "timestamp">) => {
    const newNote: Note = {
      ...noteData,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setNotes((prevNotes) => [newNote, ...prevNotes]);
  };

  const handleEditNote = (noteData: Omit<Note, "id" | "timestamp">, id: string) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, ...noteData, timestamp: Date.now() } : note
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

  const normalizedSearchTerm = searchTerm.toLowerCase();
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(normalizedSearchTerm) ||
      (note.content && note.content.toLowerCase().includes(normalizedSearchTerm)) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(normalizedSearchTerm)))
  ).sort((a, b) => b.timestamp - a.timestamp);


  return (
    <div className="min-h-screen flex flex-col">
      <Header layout={layout} />
      <main className="flex-grow container mx-auto px-4 pt-20 pb-24 flex flex-col">
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
          <div className="flex gap-2">
             <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setLayout('bubble')} 
              disabled={layout === 'bubble'}
              aria-label="Bubble view"
              title="Bubble View"
            >
              <Droplets className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setLayout('grid')} 
              disabled={layout === 'grid'}
              aria-label="Grid view"
              title="Grid View"
            >
              <LayoutGrid className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setLayout('list')} 
              disabled={layout === 'list'}
              aria-label="List view"
              title="List View"
            >
              <List className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {layout === 'bubble' ? (
          <BubbleViewContainer notes={filteredNotes} onEditNote={openEditModal} />
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
                  layout={layout}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-xl text-muted-foreground">
                {searchTerm ? "No notes match your search." : "You have no notes. Click '+' to add one!"}
              </p>
            </div>
          )
        )}
      </main>

      <Button
        onClick={openAddModal}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full w-14 h-14 p-0 shadow-lg bg-primary hover:bg-primary/90"
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
