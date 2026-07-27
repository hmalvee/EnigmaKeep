import { Plus, FileText, Star, Trash2, Edit, Tag, Clock } from 'lucide-react';
import { Note } from '../types/vault';

interface NotesListProps {
  notes: Note[];
  onAddNote: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleFavorite: (noteId: string) => void;
}

export function NotesList({ notes, onAddNote, onEditNote, onDeleteNote, onToggleFavorite }: NotesListProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-bg border-b border-line px-6 py-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink">Notes</h2>
            <p className="text-sm text-muted mt-1">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </p>
          </div>
          <button
            onClick={onAddNote}
            className="btn-primary gap-2 hover:scale-105"
          >
            <Plus size={20} />
            New Note
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="p-6">
        {notes.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 rounded-2xl mb-4 shadow-lg border border-accent/20">
              <FileText className="text-accent" size={36} />
            </div>
            <h3 className="text-2xl font-bold text-ink mb-2">
              No notes yet
            </h3>
            <p className="text-muted mb-6">
              Start organizing your thoughts and ideas
            </p>
            <button
              onClick={onAddNote}
              className="btn-primary gap-2 hover:scale-105"
            >
              <Plus size={20} />
              Create First Note
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-surface border-2 border-line rounded-xl p-5 hover:shadow-lg transition-all duration-200 group hover:border-accent"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-ink text-lg truncate group-hover:text-accent transition-colors">
                      {note.title || 'Untitled Note'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                      <Clock size={12} />
                      <span>{formatDate(note.updatedAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onToggleFavorite(note.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      note.favorite
                        ? 'text-accent hover:text-accent-2'
                        : 'text-muted hover:text-accent'
                    }`}
                  >
                    <Star size={18} fill={note.favorite ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Content Preview */}
                <p className="text-muted text-sm mb-4 line-clamp-3">
                  {truncateContent(note.content || 'No content')}
                </p>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {note.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent border border-accent/20 rounded-md text-xs"
                      >
                        <Tag size={10} />
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-xs text-muted">
                        +{note.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-line">
                  <button
                    onClick={() => onEditNote(note)}
                    className="flex-1 px-3 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="px-3 py-2 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition-colors flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
