import type { ReactNode } from 'react';
import { Link } from './Link';
import { Wordmark } from './Wordmark';

interface VaultShellProps {
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Night-sky frame for the locked vault screens (welcome, create, unlock):
 * centered wordmark and hairline on top, content in the middle, a soft
 * horizon glow at the bottom. Purely CSS — nothing is fetched.
 */
export function VaultShell({ children, footer }: VaultShellProps) {
  return (
    <div className="vx-sky relative min-h-screen min-h-[100dvh] flex flex-col items-center px-4 overflow-hidden">
      <header className="relative z-10 flex flex-col items-center pt-[calc(env(safe-area-inset-top,0px)+36px)] animate-fadeIn">
        <Link href="/" className="block text-ink rounded-sm">
          <span className="sr-only">EnigmaKeep home</span>
          <Wordmark className="h-[18px] w-auto" />
        </Link>
        <div className="hairline w-[252px] mt-5 origin-center animate-rule-in" />
      </header>

      <main className="relative z-10 flex-1 w-full flex flex-col items-center justify-center py-10">
        {children}
      </main>

      {footer && <footer className="relative z-10 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">{footer}</footer>}
    </div>
  );
}
