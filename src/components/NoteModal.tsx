import { useState, useEffect } from 'react';
import { X, Save, Star, Tag as TagIcon } from 'lucide-react';
import { Note } from '../types/vault';

interface NoteModalProps {
  note?: Note;
  onSave: (note: Partial<Note>) => void;
  onClose: () => void;
}

export function NoteModal({ note, onSave, onClose }: NoteModalProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [favorite, setFavorite] = useState(note?.favorite || false);

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    onSave({
      id: note?.id,
      title: title.trim(),
      content: content.trim(),
      tags: tags.filter(t => t.trim()),
      favorite,
      updatedAt: Date.now()
    });
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-line">
          <h2 className="text-2xl font-bold text-ink">
            {note ? 'Edit Note' : 'New Note'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFavorite(!favorite)}
              className={`p-2 rounded-lg transition-colors ${
                favorite
                  ? 'text-accent hover:text-accent-2'
                  : 'text-muted hover:text-accent'
              }`}
              title={favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star size={20} fill={favorite ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface2 rounded-lg transition-colors text-muted"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                className="ai-input"
                autoFocus
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note here..."
                rows={12}
                className="ai-input resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag..."
                  className="ai-input flex-1"
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-accent hover:bg-accent-2 text-accent-ink rounded-lg transition-colors font-medium"
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-lg text-sm"
                    >
                      <TagIcon size={12} />
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-accent-2"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-line">
          <button
            onClick={onClose}
            className="btn-ghost flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex-1 gap-2"
          >
            <Save size={18} />
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}
