import { Plus, FileText, Star, Trash2, Edit2 } from 'lucide-react';
import { Note } from '../types/vault';
import { EmptyState, OverflowMenu } from './ui';

interface NotesListProps {
  notes: Note[];
  onAddNote: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleFavorite: (noteId: string) => void;
}

const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export function NotesList({ notes, onAddNote, onEditNote, onDeleteNote, onToggleFavorite }: NotesListProps) {
  if (notes.length === 0) {
    return (
      <EmptyState
        icon={<FileText size={22} strokeWidth={1.7} />}
        title="No notes yet"
        description="Keep Wi-Fi passwords, recovery codes, ID numbers and anything else private here. Notes are encrypted with the rest of your vault."
        action={
          <button onClick={onAddNote} className="btn-primary gap-2">
            <Plus size={18} />
            New note
          </button>
        }
      />
    );
  }

  const sorted = [...notes].sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || b.updatedAt - a.updatedAt);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {sorted.map((note) => (
        <article
          key={note.id}
          onClick={() => onEditNote(note)}
          className="group flex cursor-pointer flex-col rounded-xl border border-line bg-surface p-4 transition-colors hover:border-focus/40 focus-within:border-focus/40"
        >
          <div className="flex items-start gap-2">
            <h3 className="min-w-0 flex-1 truncate pt-1 text-sm font-semibold text-ink">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditNote(note);
                }}
                className="max-w-full truncate text-left focus:outline-none focus-visible:underline"
              >
                {note.title || 'Untitled note'}
              </button>
            </h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(note.id);
              }}
              className={`icon-btn ${note.favorite ? '!text-accent' : 'sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100'}`}
              aria-label={note.favorite ? 'Remove favorite' : 'Add to favorites'}
            >
              <Star size={15} fill={note.favorite ? 'currentColor' : 'none'} />
            </button>
            <OverflowMenu
              items={[
                { label: 'Edit', icon: <Edit2 size={15} />, onSelect: () => onEditNote(note) },
                { label: 'Delete', icon: <Trash2 size={15} />, onSelect: () => onDeleteNote(note.id), danger: true }
              ]}
            />
          </div>

          <p className="mt-1 line-clamp-4 whitespace-pre-line text-[13px] leading-relaxed text-muted">
            {note.content || 'Empty note'}
          </p>

          <div className="mt-auto flex items-center gap-2 pt-4 text-xs text-muted/80">
            <span>Edited {formatDate(note.updatedAt)}</span>
            {note.tags && note.tags.length > 0 && (
              <>
                <span aria-hidden>·</span>
                <span className="truncate">{note.tags.join(', ')}</span>
              </>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
