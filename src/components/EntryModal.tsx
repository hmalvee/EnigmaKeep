import { useState, useEffect } from 'react';
import { X, RefreshCw, Star } from 'lucide-react';
import type { PasswordEntry, EntryType } from '../types/vault';
import { generatePassword } from '../utils/passwordGenerator';
import { calculatePasswordStrength } from '../utils/passwordStrength';
import { DEFAULT_CATEGORIES, CATEGORY_COLORS } from './CategoryFilter';

interface Props {
  entry?: PasswordEntry;
  onSave: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

export function EntryModal({ entry, onSave, onClose }: Props) {
  const [entryType, setEntryType] = useState<EntryType>(entry?.type || 'password');
  const [title, setTitle] = useState(entry?.title || '');
  const [username, setUsername] = useState(entry?.username || '');
  const [password, setPassword] = useState(entry?.password || '');
  const [url, setUrl] = useState(entry?.url || '');
  const [notes, setNotes] = useState(entry?.notes || '');
  const [category, setCategory] = useState(entry?.category || '');
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [favorite, setFavorite] = useState(entry?.favorite || false);
  const [tagInput, setTagInput] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);
  const [genLength, setGenLength] = useState(16);
  const [genOptions, setGenOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });

  const passwordStrength = calculatePasswordStrength(password);

  const handleGenerate = () => {
    const newPassword = generatePassword({ length: genLength, ...genOptions });
    setPassword(newPassword);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    if (entryType === 'password' && !password) return;

    onSave({
      type: entryType,
      title,
      username,
      password,
      url: url || undefined,
      notes: notes || undefined,
      category: category || undefined,
      tags: tags.length > 0 ? tags : undefined,
      favorite
    });
    onClose();
  };

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
        <div className="sticky top-0 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-b border-cyan-500/30 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-semibold text-white">
            {entry ? 'Edit Entry' : 'New Entry'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-400 hover:bg-gray-700 rounded-lg transition-all duration-200 hover:rotate-90"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Title *
              </label>
            </div>
            <button
              type="button"
              onClick={() => setFavorite(!favorite)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                favorite
                  ? 'text-yellow-400 bg-yellow-400/20'
                  : 'text-gray-500 hover:text-yellow-400 hover:bg-gray-700'
              }`}
              title={favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star size={18} fill={favorite ? 'currentColor' : 'none'} />
            </button>
          </div>
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-gray-900 text-white placeholder-gray-500"
              placeholder="My Account"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Username / Email
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-500"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-gray-900 text-white"
            >
              <option value="">No category</option>
              {DEFAULT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {entryType === 'password' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password *
              </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 font-mono"
                placeholder="••••••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowGenerator(!showGenerator)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 hover:from-cyan-600 hover:to-blue-600 text-cyan-400 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <RefreshCw size={18} />
              </button>
            </div>
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Strength:</span>
                    <span className={passwordStrength.color}>{passwordStrength.label}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Entropy: {passwordStrength.entropy.toFixed(1)} bits</span>
                    <span>Crack time: {passwordStrength.crackTime}</span>
                  </div>
                  {passwordStrength.isCommon && (
                    <div className="text-xs text-red-400 mt-1">
                      ⚠️ This is a commonly used password
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {showGenerator && (
            <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-xl p-4 space-y-3 border border-cyan-500/30 animate-slideIn">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Length: {genLength}
                </label>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={genLength}
                  onChange={(e) => setGenLength(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={genOptions.uppercase}
                    onChange={(e) => setGenOptions({ ...genOptions, uppercase: e.target.checked })}
                    className="rounded"
                  />
                  Uppercase (A-Z)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={genOptions.lowercase}
                    onChange={(e) => setGenOptions({ ...genOptions, lowercase: e.target.checked })}
                    className="rounded"
                  />
                  Lowercase (a-z)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={genOptions.numbers}
                    onChange={(e) => setGenOptions({ ...genOptions, numbers: e.target.checked })}
                    className="rounded"
                  />
                  Numbers (0-9)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={genOptions.symbols}
                    onChange={(e) => setGenOptions({ ...genOptions, symbols: e.target.checked })}
                    className="rounded"
                  />
                  Symbols (!@#$...)
                </label>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg hover:scale-[1.02]"
              >
                Generate Password
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-500"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-gray-900 text-white placeholder-gray-500"
                placeholder="Add tag and press Enter"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm flex items-center gap-2 border border-cyan-500/30"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-cyan-200"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {entryType === 'note' ? 'Content' : 'Notes'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={entryType === 'note' ? 8 : 4}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none bg-gray-900 text-white placeholder-gray-500"
              placeholder={entryType === 'note' ? 'Secure note content...' : 'Additional notes...'}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg hover:scale-[1.02]"
            >
              {entry ? 'Update' : 'Add'} Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
