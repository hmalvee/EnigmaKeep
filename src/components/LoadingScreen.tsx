import { Shield } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-vault-dark flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-neon-cyan/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-neon-blue/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="text-center animate-scaleIn relative z-10">
        {/* Rotating ring */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-neon-cyan border-r-neon-blue animate-rotate" />
          <div className="absolute inset-2 rounded-full border border-transparent border-b-neon-purple border-l-neon-cyan animate-rotate" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shadow-neon-cyan animate-glow-pulse">
              <Shield className="text-accent-ink" size={24} />
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-ink mb-2 tracking-tight">EnigmaKeep</h2>
        <p className="text-sm text-muted font-mono tracking-wider animate-pulse">INITIALIZING VAULT...</p>
      </div>
    </div>
  );
}
