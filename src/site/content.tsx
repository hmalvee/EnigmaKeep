import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { ArrowRight, Github } from 'lucide-react';
import { Link } from '../components/Link';
import { GITHUB_URL } from './links';
import { Heading, Lead, type Line } from './primitives';
import { spotlight } from './motion';
import './pages.css';

// Stable per-seed numbers, so a post always gets the same cover.
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Generative cover art: a lit sphere horizon of light dashes, varied per seed. */
export function Cover({
  seed,
  label,
  index,
  className = '',
}: {
  seed: string;
  label?: string;
  index?: number;
  className?: string;
}) {
  const h = hash(seed);
  const style = {
    '--y': `${50 + (h % 24)}%`,
    '--hue': String(196 + ((h >>> 5) % 26)),
    '--gap': `${13 + ((h >>> 9) % 6)}px`,
  } as CSSProperties;
  return (
    <div className={`cover ${className}`} style={style} aria-hidden="true">
      <div className="cover-dashes" />
      <div className="cover-rim" />
      <div className="cover-fade" />
      {label && <span className="cover-label">{label}</span>}
      {index !== undefined && <span className="cover-index">No. {String(index).padStart(2, '0')}</span>}
    </div>
  );
}

/** Big editorial page header with the lit-rim crown. */
export function PageHero({
  top,
  lines,
  article = false,
  lead,
  meta,
  children,
}: {
  top: ReactNode;
  lines: Line[];
  article?: boolean;
  lead?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="pg-hero">
      <div className="lp-wrap">
        {top}
        <Heading as="h1" lines={lines} className={article ? 'pg-title is-article' : 'pg-title'} />
        {lead && <Lead delay={260}>{lead}</Lead>}
        {meta && (
          <div data-rv className="pg-meta rv" style={{ '--d': '360ms' } as CSSProperties}>
            {meta}
          </div>
        )}
        {children}
      </div>
    </header>
  );
}

export interface TocItem {
  id: string;
  label: string;
}

/** Sticky, numbered table of contents that follows the reader. */
export function Toc({
  title = 'On this page',
  items,
  active,
  footer,
}: {
  title?: string;
  items: TocItem[];
  active: string | null;
  footer?: ReactNode;
}) {
  return (
    <nav className="toc" aria-label={title}>
      <p>{title}</p>
      <ol>
        {items.map((item, i) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={active === item.id ? 'is-active' : undefined}
              aria-current={active === item.id ? 'location' : undefined}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
      {footer && <div className="toc-foot">{footer}</div>}
    </nav>
  );
}

/** Thin progress line across the top of the viewport while reading `targetRef`. */
export function ReadingProgress({ targetRef }: { targetRef: RefObject<HTMLElement> }) {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const target = targetRef.current;
      const bar = barRef.current;
      if (!target || !bar) return;
      const rect = target.getBoundingClientRect();
      const travel = rect.height - window.innerHeight * 0.5;
      const p = travel > 0 ? (window.innerHeight * 0.3 - rect.top) / travel : 0;
      bar.style.setProperty('--p', Math.min(1, Math.max(0, p)).toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [targetRef]);
  return <div ref={barRef} className="read-progress" aria-hidden="true" />;
}

export interface PostCardData {
  href: string;
  seed: string;
  category: string;
  title: string;
  description: string;
  date?: string;
  readTime: string;
  index?: number;
}

export function PostCard({ post, order = 0 }: { post: PostCardData; order?: number }) {
  return (
    <Link
      href={post.href}
      className="lp-card post-card card-in"
      style={{ '--i': order } as CSSProperties}
      onPointerMove={spotlight}
    >
      <Cover seed={post.seed} label={post.category} index={post.index} />
      <div className="post-body">
        <div className="post-meta">
          {post.date && <span>{post.date}</span>}
          <span>{post.readTime}</span>
        </div>
        <h3>{post.title}</h3>
        <p>{post.description}</p>
        <span className="read-on">
          Read article <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}

/** Closing invitation used at the foot of every content page. */
export function CtaBand() {
  return (
    <section data-rv className="pg-cta rv" aria-label="Get started">
      <h2>Keep your secrets where they belong.</h2>
      <p>Create a vault in under a minute. No email, no payment, no catch.</p>
      <div className="pg-cta-actions">
        <a href="/app" className="lp-cta">
          Open your vault
        </a>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="lp-link">
          <Github size={15} /> Read the source <ArrowRight size={15} />
        </a>
      </div>
    </section>
  );
}

export function NotFound({ title, body, href, label }: { title: string; body: string; href: string; label: string }) {
  return (
    <div className="pg-missing">
      <PageHero top={<p data-rv className="lp-eyebrow rv">404</p>} lines={[title]} lead={body}>
        <Link href={href} className="lp-cta">
          {label}
        </Link>
      </PageHero>
    </div>
  );
}
