import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showToast && isOnline) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slideIn">
      <div
        className={`px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 ${
          isOnline
            ? 'bg-success/10 border-success/30 text-success'
            : 'bg-surface border-line text-ink'
        }`}
      >
        {isOnline ? (
          <>
            <Wifi size={20} className="text-success" />
            <div>
              <p className="font-medium">Back Online</p>
              <p className="text-xs text-success">Connection restored</p>
            </div>
          </>
        ) : (
          <>
            <WifiOff size={20} className="text-muted" />
            <div>
              <p className="font-medium">Offline Mode</p>
              <p className="text-xs text-muted">Working without internet</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
