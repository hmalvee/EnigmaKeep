import type { AnchorHTMLAttributes } from 'react';

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export function Link({ href, children, onClick, ...rest }: LinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (href.startsWith('/') && !href.startsWith('/app')) {
      e.preventDefault();
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
      // A new page starts at the top (instant, not the global smooth scroll).
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
