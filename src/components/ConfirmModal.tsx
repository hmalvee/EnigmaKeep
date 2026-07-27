import { AlertTriangle, X } from 'lucide-react';

interface Props {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel
}: Props) {
  const variantStyles = {
    danger: {
      icon: 'text-danger',
      button: 'bg-danger hover:bg-danger/90 text-white focus:ring-danger'
    },
    warning: {
      icon: 'text-accent',
      button: 'bg-accent hover:bg-accent-2 text-accent-ink focus:ring-accent'
    },
    info: {
      icon: 'text-accent',
      button: 'bg-accent hover:bg-accent-2 text-accent-ink focus:ring-accent'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-surface rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn border border-line">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-surface2 flex items-center justify-center ${styles.icon}`}>
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-ink mb-2">
                {title}
              </h3>
              <p className="text-sm text-muted">
                {message}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="flex-shrink-0 p-1 text-muted hover:text-ink transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-line text-muted rounded-lg hover:bg-surface2 transition-all duration-200 font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium focus:ring-2 focus:ring-offset-2 ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
