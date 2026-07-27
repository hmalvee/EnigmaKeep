import { useEffect, useMemo, useState } from 'react';
import { X, Download, Save, FileText, Image as ImageIcon, File as FileIcon } from 'lucide-react';
import type { StoredFile } from '../types/vault';
import {
  isTextFile,
  isImageFile,
  storedFileToText,
  storedFileObjectUrl,
  formatBytes
} from '../utils/fileStorage';

interface Props {
  file: StoredFile;
  onClose: () => void;
  onSaveText: (fileId: string, text: string) => void;
  onDownload: (file: StoredFile) => void;
}

export function FilePreviewModal({ file, onClose, onSaveText, onDownload }: Props) {
  const text = useMemo(() => (isTextFile(file) ? storedFileToText(file) : ''), [file]);
  const [draft, setDraft] = useState(text);
  const [dirty, setDirty] = useState(false);
  const editable = isTextFile(file);
  const image = isImageFile(file);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!image) return;
    const url = storedFileObjectUrl(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, image]);

  useEffect(() => {
    setDraft(text);
    setDirty(false);
  }, [text]);

  const handleSave = () => {
    onSaveText(file.id, draft);
    setDirty(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-surface border border-line rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
              {editable ? <FileText size={18} className="text-accent" /> : image ? <ImageIcon size={18} className="text-accent" /> : <FileIcon size={18} className="text-accent" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-ink truncate" title={file.name}>{file.name}</h3>
              <p className="text-xs text-muted">{formatBytes(file.size)} · {file.mimeType || 'file'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {editable && dirty && (
              <button onClick={handleSave} className="btn-primary !py-2 !px-3 text-sm flex items-center gap-1.5">
                <Save size={15} /> Save
              </button>
            )}
            <button
              onClick={() => onDownload(file)}
              className="p-2 rounded-lg text-muted hover:text-ink hover:bg-surface2 transition-colors"
              aria-label="Download"
            >
              <Download size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted hover:text-ink hover:bg-surface2 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          {editable ? (
            <textarea
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setDirty(true); }}
              spellCheck={false}
              className="w-full h-[55vh] resize-none rounded-xl bg-surface2 border border-line p-4 font-mono text-sm text-ink focus:outline-none focus:border-accent/60"
            />
          ) : image && imageUrl ? (
            <div className="flex items-center justify-center">
              <img src={imageUrl} alt={file.name} className="max-w-full max-h-[60vh] rounded-lg border border-line" />
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface2 border border-line mb-4">
                <FileIcon className="text-muted" size={28} />
              </div>
              <p className="text-ink font-medium mb-1">No in-app preview for this file type</p>
              <p className="text-muted text-sm mb-5">Download it to open with the right application.</p>
              <button onClick={() => onDownload(file)} className="btn-primary inline-flex items-center gap-2">
                <Download size={16} /> Download
              </button>
            </div>
          )}
        </div>

        {editable && (
          <div className="px-5 py-3 border-t border-line text-xs text-muted">
            {dirty ? 'Unsaved changes — Save writes the edited text back into your encrypted vault.' : 'Editing writes changes back into your encrypted vault.'}
          </div>
        )}
      </div>
    </div>
  );
}
