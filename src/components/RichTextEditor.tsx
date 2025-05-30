import React, { useCallback, useMemo } from "react";
import { createEditor, BaseEditor, BaseElement, BaseText, Node } from "slate";
import { Slate, Editable, withReact, ReactEditor } from "slate-react";
import { withHistory } from "slate-history";
import type { Descendant } from 'slate';

// Define a strict CustomElement type for Slate
type CustomText = { text: string; bold?: boolean; italic?: boolean; underline?: boolean };
type CustomElement = Descendant & { type: 'paragraph' | 'bulleted-list' | 'numbered-list' | 'list-item' | 'link'; children: CustomText[]; url?: string };

// Type guard for CustomElement[]
export function isCustomElementArray(val: any): val is CustomElement[] {
  return (
    Array.isArray(val) &&
    val.every(
      (el: any) =>
        el &&
        typeof el === 'object' &&
        typeof el.type === 'string' &&
        Array.isArray(el.children)
    )
  );
}

// Default value for Slate editor
export const initialValue: CustomElement[] = [
  { type: 'paragraph', children: [{ text: '' }] },
];

interface RichTextEditorProps {
  value: CustomElement[];
  onChange: (value: Descendant[]) => void;
  readOnly?: boolean;
  className?: string;
}

export function RichTextEditor({ value, onChange, readOnly = false, className }: RichTextEditorProps) {
  const editor = useMemo(() => withHistory(withReact(createEditor() as ReactEditor)), []);

  // Always pass a valid array of elements to Slate
  const safeValue: CustomElement[] = isCustomElementArray(value) ? value : initialValue;

  // Add types to avoid implicit any
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);
  const renderElement = useCallback((props: any) => <Element {...props} />, []);

  return (
    <div className={className}>
      <Slate editor={editor} value={safeValue} onChange={onChange}>
        {!readOnly && <Toolbar editor={editor} />}
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          readOnly={readOnly}
          className="min-h-[100px] p-2 rounded border bg-background focus:outline-none focus:ring-2 focus:ring-primary/60"
          spellCheck
          autoFocus={!readOnly}
        />
      </Slate>
    </div>
  );
}

// Toolbar and helpers
import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline, Link, List, ListOrdered } from "lucide-react";
import { Editor, Transforms, Text } from "slate";

function Toolbar({ editor }: { editor: ReactEditor }) {
  return (
    <div className="flex gap-1 mb-2">
      <MarkButton format="bold" icon={<Bold className="w-4 h-4" />} editor={editor} />
      <MarkButton format="italic" icon={<Italic className="w-4 h-4" />} editor={editor} />
      <MarkButton format="underline" icon={<Underline className="w-4 h-4" />} editor={editor} />
      <BlockButton format="numbered-list" icon={<ListOrdered className="w-4 h-4" />} editor={editor} />
      <BlockButton format="bulleted-list" icon={<List className="w-4 h-4" />} editor={editor} />
      <InsertLinkButton editor={editor} />
    </div>
  );
}

function MarkButton({ format, icon, editor }: { format: string; icon: React.ReactNode; editor: ReactEditor }) {
  return (
    <Button
      type="button"
      size="icon"
      variant={isMarkActive(editor, format) ? "secondary" : "ghost"}
      onMouseDown={event => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
      className="rounded"
    >
      {icon}
    </Button>
  );
}

function BlockButton({ format, icon, editor }: { format: string; icon: React.ReactNode; editor: ReactEditor }) {
  return (
    <Button
      type="button"
      size="icon"
      variant={isBlockActive(editor, format) ? "secondary" : "ghost"}
      onMouseDown={event => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
      className="rounded"
    >
      {icon}
    </Button>
  );
}

function InsertLinkButton({ editor }: { editor: ReactEditor }) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onMouseDown={event => {
        event.preventDefault();
        const url = window.prompt("Enter the URL of the link:");
        if (!url) return;
        insertLink(editor, url);
      }}
      className="rounded"
    >
      <Link className="w-4 h-4" />
    </Button>
  );
}

// Slate helpers for marks and blocks
const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor) as Record<string, any> | null;
  return marks ? marks[format] === true : false;
};

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const LIST_TYPES = ['numbered-list', 'bulleted-list'];

const isBlockActive = (editor: Editor, format: string) => {
  const [match] = Editor.nodes(editor, {
    match: n => !Editor.isEditor(n) && typeof (n as any).type === 'string' && (n as any).type === format,
  });
  return !!match;
};

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: n => typeof (n as any).type === 'string' && LIST_TYPES.includes((n as any).type),
    split: true,
  });

  let newType = isActive ? 'paragraph' : isList ? 'list-item' : format;
  Transforms.setNodes(editor, { type: newType } as any);

  if (!isActive && isList) {
    const block = { type: format, children: [] } as any;
    Transforms.wrapNodes(editor, block);
  }
};

function insertLink(editor: Editor, url: string) {
  if (!url) return;
  const { selection } = editor;
  const link = {
    type: 'link',
    url,
    children: selection ? Editor.fragment(editor, selection) : [{ text: url }],
  };
  Transforms.insertNodes(editor, link);
}

// Renderers
const Element = ({ attributes, children, element }: any) => {
  switch (element.type) {
    case 'bulleted-list':
      return <ul {...attributes} className="list-disc pl-6 my-1">{children}</ul>;
    case 'numbered-list':
      return <ol {...attributes} className="list-decimal pl-6 my-1">{children}</ol>;
    case 'list-item':
      return <li {...attributes}>{children}</li>;
    case 'link':
      return <a {...attributes} href={element.url} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{children}</a>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const Leaf = ({ attributes, children, leaf }: any) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.italic) {
    children = <em>{children}</em>;
  }
  if (leaf.underline) {
    children = <u>{children}</u>;
  }
  return <span {...attributes}>{children}</span>;
}; 