import { Wordmark } from './Wordmark';

export function LoadingScreen() {
  return (
    <div className="vx-sky min-h-screen min-h-[100dvh] flex items-center justify-center overflow-hidden" role="status">
      <div className="flex flex-col items-center animate-fadeIn">
        <Wordmark className="h-[20px] w-auto text-ink" />
        <div className="relative mt-6 w-[252px] h-px overflow-hidden" style={{ background: 'var(--hair)' }}>
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-focus to-transparent animate-[loadSweep_1.4s_cubic-bezier(0.7,0,0.2,1)_infinite]" />
        </div>
        <p className="mt-5 text-[13px] text-muted tracking-[-0.01em]">Preparing your vault…</p>
      </div>
    </div>
  );
}
