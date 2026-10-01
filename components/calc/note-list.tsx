import { Callout } from "@/components/calc/callout";

/** A note a tool may raise about the result; `warn` for things that cost the user money. */
export interface Note {
  tone: React.ComponentProps<typeof Callout>["tone"];
  text: string;
}

/** The first `max` notes, most important first, as callouts; nothing when there are none. */
export function NoteList({ notes, max = 2 }: { notes: Note[]; max?: number }) {
  if (notes.length === 0) return null;
  return (
    <div className="space-y-2">
      {notes.slice(0, max).map((n) => (
        <Callout key={n.text} tone={n.tone}>
          {n.text}
        </Callout>
      ))}
    </div>
  );
}
