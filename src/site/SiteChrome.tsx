import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from '../components/Link';
import { Wordmark } from '../components/Wordmark';
import { useNightThemeColor, useReveal } from './motion';
import { GITHUB_URL, SITE_LINKS, type NavLink } from './links';
import './site.css';

// Route links go through the SPA router; in-page anchors are plain links.
function NavAnchor({ link, className }: { link: NavLink; className?: string }) {
  if (link.href.startsWith('/') && !link.href.includes('#')) {
    return (
      <Link href={link.href} className={className}>
        {link.label}
      </Link>
    );
  }
  return (
    <a href={link.href} className={className}>
      {link.label}
    </a>
  );
}

/**
 * Floating glass navigation bar. On the landing page it waits until the
 * hero masthead has scrolled away (`revealOnScroll`); elsewhere it is always on.
 */
export function SiteNav({
  links = SITE_LINKS,
  active,
  revealOnScroll = false,
}: {
  links?: NavLink[];
  active?: string | null;
  revealOnScroll?: boolean;
}) {
  const [visible, setVisible] = useState(!revealOnScroll);

  useEffect(() => {
    if (!revealOnScroll) return;
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.72);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [revealOnScroll]);

  return (
    <nav className={visible ? 'lp-nav is-on' : 'lp-nav'} aria-label="Site" aria-hidden={!visible}>
      {revealOnScroll ? (
        <a href="#top" className="lp-nav-brand" aria-label="EnigmaKeep home">
          <Wordmark />
        </a>
      ) : (
        <Link href="/" className="lp-nav-brand">
          <span className="sr-only">EnigmaKeep home</span>
          <Wordmark />
        </Link>
      )}
      <div className="lp-nav-links">
        {links.map((link) => (
          <NavAnchor key={link.key} link={link} className={active === link.key ? 'is-active' : undefined} />
        ))}
      </div>
      <a href="/app" className="lp-cta lp-cta-sm">
        Open vault
      </a>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="lp-foot">
      <div className="lp-wrap">
        <div className="lp-foot-grid">
          <div className="lp-foot-brand">
            <Link href="/" className="inline-block text-white">
              <span className="sr-only">EnigmaKeep home</span>
              <Wordmark className="h-4 w-auto" />
            </Link>
            <p>Offline, zero-knowledge password manager. Open source, free forever.</p>
          </div>
          <div>
            <h3>Product</h3>
            <ul>
              <li><a href="/#features">Features</a></li>
              <li><a href="/#download">Install</a></li>
              <li><a href="/app">Open Vault</a></li>
              <li><a href="/#faq">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h3>Guides</h3>
            <ul>
              <li><Link href="/details">All Guides</Link></li>
              <li><Link href="/details/password-security-guide">Password Security</Link></li>
              <li><Link href="/details/zero-knowledge-encryption">Zero-Knowledge</Link></li>
              <li><Link href="/details/offline-password-manager">Offline Manager</Link></li>
            </ul>
          </div>
          <div>
            <h3>Resources</h3>
            <ul>
              <li><Link href="/blog">Journal</Link></li>
              <li><a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a></li>
              <li><a href={`${GITHUB_URL}/issues`} target="_blank" rel="noopener noreferrer">Support</a></li>
            </ul>
          </div>
          <div>
            <h3>Legal</h3>
            <ul>
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/terms">Terms</Link></li>
              <li><a href={`${GITHUB_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">License</a></li>
            </ul>
          </div>
        </div>

        <div className="lp-foot-base">
          <span>© 2026 EnigmaKeep. Open source: AGPL-3.0 app, MIT cryptography.</span>
          <span>
            Developed by{' '}
            <a href="https://www.hmalveehasan.com" target="_blank" rel="noopener noreferrer">
              HM Alvee Hasan
            </a>
          </span>
        </div>

        <div className="lp-mega" aria-hidden="true">
          <Wordmark />
        </div>
      </div>
    </footer>
  );
}

/** Frame for content pages: floating nav, reveal-on-scroll, shared footer. */
export function PageShell({ active, children }: { active?: string; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  useReveal(rootRef);
  useNightThemeColor();
  return (
    <div ref={rootRef} className="dark lp min-h-screen">
      <SiteNav active={active} />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
