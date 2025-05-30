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
import { RichTextEditor, initialValue as richTextInitialValue } from "@/components/RichTextEditor";
import { Descendant } from "slate";
import { isCustomElementArray } from "@/components/RichTextEditor";

type CustomElement = { type: 'paragraph' | 'bulleted-list' | 'numbered-list' | 'list-item' | 'link'; children: { text: string; bold?: boolean; italic?: boolean; underline?: boolean }[]; url?: string };

interface NoteFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (noteData: Omit<Note, "id" | "timestamp" | "status">, id?: string) => void;
  initialData?: Note | null;
}

export function NoteFormDialog({ isOpen, onOpenChange, onSubmit, initialData }: NoteFormDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [richContent, setRichContent] = useState<CustomElement[]>(richTextInitialValue);
  const [tags, setTags] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [reminders, setReminders] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        // Try to parse as Slate JSON, fallback to plain text
        try {
          const parsed = JSON.parse(initialData.content || "");
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && 'type' in parsed[0] && Array.isArray(parsed[0].children)) {
            setRichContent(parsed as CustomElement[]);
          } else {
            setRichContent(richTextInitialValue);
          }
        } catch {
          setRichContent([
            { type: 'paragraph', children: [{ text: initialData.content || "" }] },
          ]);
        }
        setTags(initialData.tags ? initialData.tags.join(", ") : "");
        setIsPinned(initialData.isPinned || false);
        setReminders(Array.isArray(initialData.reminders) ? initialData.reminders : []);
      } else {
        setTitle("");
        setRichContent(richTextInitialValue);
        setTags("");
        setIsPinned(false);
        setReminders([]);
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
    // Store content as Slate JSON string
    const contentJson = JSON.stringify(richContent);
    onSubmit({ title, content: contentJson, tags: tagsArray, isPinned, reminders }, initialData?.id);
    onOpenChange(false);
  };

  // Reminder handlers
  const addReminder = () => {
    setReminders([...reminders, Date.now() + 60 * 60 * 1000]); // Default: 1 hour from now
  };
  const updateReminder = (idx: number, value: string) => {
    const newReminders = [...reminders];
    newReminders[idx] = new Date(value).getTime();
    setReminders(newReminders);
  };
  const removeReminder = (idx: number) => {
    setReminders(reminders.filter((_, i) => i !== idx));
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
              <div className="col-span-3">
                <RichTextEditor
                  value={isCustomElementArray(richContent) ? richContent : richTextInitialValue}
                  onChange={setRichContent as any}
                  className="min-h-[120px]"
                />
              </div>
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
                    disabled={initialData?.status === 'trashed'} // Cannot pin a trashed note
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Reminders</Label>
              <div className="col-span-3 flex flex-col gap-2">
                {reminders.map((rem, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      className="border rounded px-2 py-1 text-sm"
                      value={new Date(rem).toISOString().slice(0, 16)}
                      onChange={e => updateReminder(idx, e.target.value)}
                    />
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeReminder(idx)} title="Remove reminder">✕</Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={addReminder} className="mt-1">+ Add Reminder</Button>
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
