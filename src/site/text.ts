import type { ReactNode } from 'react';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Plain text of rendered React children (for heading ids). */
export function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (typeof node === 'object' && 'props' in node) return textOf((node.props as { children?: ReactNode }).children);
  return '';
}

export const formatDate = (iso: string, month: 'long' | 'short' = 'long') =>
  new Date(iso).toLocaleDateString('en-US', { month, day: 'numeric', year: 'numeric' });
