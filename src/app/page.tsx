"use client";

import { useState, useEffect } from "react";
import type { Note } from "@/types/note";
import { Header } from "@/components/Header";
import { NoteCard } from "@/components/NoteCard";
import { NoteFormDialog } from "@/components/NoteFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

const initialNotesData: Note[] = [
  { id: '1', title: 'Grocery List', content: 'Milk, Eggs, Bread, Pixelated Apples', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2 },
  { id: '2', title: 'Meeting Ideas', content: 'Discuss project Omega, Review timeline, Assign pixel tasks', timestamp: Date.now() - 1000 * 60 * 60 * 5 },
  { id: '3', title: 'Game Dev Log', content: 'Fixed player jump bug. Added new level with retro theme.', timestamp: Date.now() - 1000 * 60 * 30 },
  { id: '4', title: 'To-Do Today', content: '1. Finish styling app\n2. Test note CRUD\n3. Drink coffee', timestamp: Date.now() },
];


export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  // Effect to load initial notes only on client-side after mount
  useEffect(() => {
    setNotes(initialNotesData);
  }, []);


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

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first


  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 pt-20 pb-8">
        <div className="my-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Input
            type="search"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 shadow-sm"
            aria-label="Search notes"
          />
          <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90 shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Add New Note
          </Button>
        </div>

        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={openEditModal}
                onDelete={handleDeleteNote}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-xl text-muted-foreground">
              {searchTerm ? "No notes match your search." : "No notes yet. Add one!"}
            </p>
          </div>
        )}
      </main>

      <NoteFormDialog
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={(data, id) => (id ? handleEditNote(data, id) : handleAddNote(data))}
        initialData={editingNote}
      />
    </div>
  );
}
