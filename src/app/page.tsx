
"use client";

import { useState, useEffect } from "react";
import type { Note } from "@/types/note";
import { Header } from "@/components/Header";
import { NoteCard } from "@/components/NoteCard";
import { NoteFormDialog } from "@/components/NoteFormDialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react"; // Added Search icon

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
  
  useEffect(() => {
    // Load initial notes only on client-side after mount to allow crypto.randomUUID
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

  // openAddModal is no longer called from UI, but kept for potential programmatic use
  // const openAddModal = () => { 
  //   setEditingNote(null);
  //   setIsModalOpen(true);
  // };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => b.timestamp - a.timestamp);


  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 pt-20 pb-8">
        <div className="my-8 flex justify-center">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full shadow-sm pl-11 pr-4 py-2.5 rounded-md border" 
              aria-label="Search notes"
            />
          </div>
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
              {searchTerm ? "No notes match your search." : "You have no notes."}
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
