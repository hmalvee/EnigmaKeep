import type { CSSProperties, ElementType, ReactNode } from 'react';

export type Line = string | { text: string; dim?: boolean };

/** Headline whose lines rise out of their own baseline mask, like the hero. */
export function Heading({
  lines,
  id,
  as: Tag = 'h2',
  className = 'lp-h2',
}: {
  lines: Line[];
  id?: string;
  as?: ElementType;
  className?: string;
}) {
  return (
    <Tag data-rv id={id} className={`${className} rv-h`}>
      {lines.map((line, i) => {
        const { text, dim } = typeof line === 'string' ? { text: line, dim: false } : line;
        return (
          <span key={text} className="l">
            <span className={dim ? 'li dim' : 'li'} style={{ '--i': i } as CSSProperties}>
              {text}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p data-rv className="lp-eyebrow rv">
      {children}
    </p>
  );
}

export function Lead({ children, delay = 220 }: { children: ReactNode; delay?: number }) {
  return (
    <p data-rv className="lp-lead rv" style={{ '--d': `${delay}ms` } as CSSProperties}>
      {children}
    </p>
  );
}
