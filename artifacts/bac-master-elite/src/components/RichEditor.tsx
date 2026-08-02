/**
 * RichEditor — markdown toolbar over a textarea.
 * Outputs plain text with markdown syntax compatible with:
 *   • formatContent() in Lecon.tsx (## / ** / - / etc.)
 *   • ReactMarkdown in Exercice.tsx (remark-gfm)
 */
import { useRef, useId } from "react";
import {
  Bold, Italic, List, ListOrdered,
} from "lucide-react";

interface RichEditorProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  rows?: number;
}

/** Strip markdown syntax to count real words */
export function countWords(text: string): number {
  const plain = text
    .replace(/#{1,6}\s/g, " ")
    .replace(/[*_`~>\[\]()#\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.split(/\s+/).filter((w) => w.length > 0).length;
}

function wrap(
  el: HTMLTextAreaElement,
  prefix: string,
  suffix = prefix,
  lineBased = false,
): string {
  const { value, selectionStart: s, selectionEnd: e } = el;
  const selected = value.substring(s, e);

  if (lineBased) {
    // Prefix each selected line
    const lines = (selected || "Texte ici").split("\n");
    const replaced = lines.map((l) => (l.startsWith(prefix) ? l.slice(prefix.length) : prefix + l));
    return value.substring(0, s) + replaced.join("\n") + value.substring(e);
  }

  const insert = selected || "Texte ici";
  return value.substring(0, s) + prefix + insert + suffix + value.substring(e);
}

const ACTIONS = [
  {
    title: "Gras",
    icon: Bold,
    apply: (el: HTMLTextAreaElement) => wrap(el, "**"),
  },
  {
    title: "Italique",
    icon: Italic,
    apply: (el: HTMLTextAreaElement) => wrap(el, "*"),
  },
  {
    title: "H2",
    text: "H2",
    apply: (el: HTMLTextAreaElement) => wrap(el, "## ", "", true),
  },
  {
    title: "H3",
    text: "H3",
    apply: (el: HTMLTextAreaElement) => wrap(el, "### ", "", true),
  },
  {
    title: "Liste",
    icon: List,
    apply: (el: HTMLTextAreaElement) => wrap(el, "- ", "", true),
  },
  {
    title: "Liste numérotée",
    icon: ListOrdered,
    apply: (el: HTMLTextAreaElement) => wrap(el, "1. ", "", true),
  },
] as const;

export default function RichEditor({
  value,
  onChange,
  placeholder,
  rows = 12,
}: RichEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const labelId = useId();
  const wc = countWords(value);

  const handleAction = (apply: (el: HTMLTextAreaElement) => string) => {
    const el = textareaRef.current;
    if (!el) return;
    const next = apply(el);
    onChange(next);
    // Restore focus after React re-render
    requestAnimationFrame(() => el.focus());
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-2 py-1.5">
        {ACTIONS.map((action) => (
          <button
            key={action.title}
            type="button"
            title={action.title}
            onMouseDown={(e) => {
              e.preventDefault(); // keep focus in textarea
              handleAction(action.apply);
            }}
            className="rounded px-1.5 py-1 text-xs font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {"icon" in action ? (
              <action.icon className="h-3.5 w-3.5" />
            ) : (
              <span className="font-bold">{action.text}</span>
            )}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>{wc} mot{wc !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        id={labelId}
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y bg-background px-3 py-2.5 text-sm outline-none font-mono leading-relaxed"
        data-testid="rich-editor-textarea"
      />
    </div>
  );
}
