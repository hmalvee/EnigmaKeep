import { Loader } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
      <div className="text-center animate-fadeIn">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full animate-pulse"></div>
          <Loader className="w-12 h-12 text-cyan-400 animate-rotate mx-auto mb-4 relative" strokeWidth={2} />
        </div>
        <p className="text-gray-400 text-sm animate-pulse">Loading EnigmaKeep...</p>
      </div>
    </div>
  );
}
