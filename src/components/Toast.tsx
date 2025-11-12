import { useEffect, useState } from 'react';
import { CheckCircle, Clock } from 'lucide-react';

interface ToastProps {
  message: string;
  countdown?: number;
  onClose: () => void;
}

export function Toast({ message, countdown, onClose }: ToastProps) {
  const [timeLeft, setTimeLeft] = useState(countdown || 0);

  useEffect(() => {
    if (countdown && countdown > 0) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const timeout = setTimeout(() => {
        onClose();
      }, countdown * 1000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else {
      const timeout = setTimeout(onClose, 3000);
      return () => clearTimeout(timeout);
    }
  }, [countdown, onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slideIn">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 min-w-[300px]">
        <div className="flex items-start gap-3">
          <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-white font-medium">{message}</p>
            {countdown && countdown > 0 && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                <Clock size={14} />
                <span>Clearing in {timeLeft}s</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
