
"use client";

import type { Note } from "@/types/note";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";

interface NoteFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (noteData: Omit<Note, "id" | "timestamp">, id?: string) => void;
  initialData?: Note | null;
}

export function NoteFormDialog({ isOpen, onOpenChange, onSubmit, initialData }: NoteFormDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setContent(initialData.content || "");
        setTags(initialData.tags ? initialData.tags.join(", ") : "");
        setIsPinned(initialData.isPinned || false);
      } else {
        setTitle("");
        setContent("");
        setTags("");
        setIsPinned(false);
      }
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
        alert("Title cannot be empty.");
        return;
    }
    const tagsArray = tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);
    onSubmit({ title, content, tags: tagsArray, isPinned }, initialData?.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-pixel text-2xl">
              {initialData ? "Edit Note" : "Add New Note"}
            </DialogTitle>
            <DialogDescription>
              {initialData ? "Make changes to your note." : "Fill in the details for your new note."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3 font-pixel"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="content" className="text-right">
                Content
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="col-span-3 min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tags" className="text-right">
                Tags
              </Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="col-span-3"
                placeholder="e.g., work, personal, ideas"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isPinned" className="text-right">
                Pin Note
              </Label>
              <div className="col-span-3 flex items-center">
                <Checkbox
                    id="isPinned"
                    checked={isPinned}
                    onCheckedChange={(checked) => setIsPinned(!!checked)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {initialData ? "Save Changes" : "Add Note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
