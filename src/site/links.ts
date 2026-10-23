export const GITHUB_URL = 'https://github.com/hmalvee/EnigmaKeep';

export interface NavLink {
  href: string;
  label: string;
  /** Matched against `active` to highlight the link. */
  key: string;
}

/** Links used on every page other than the landing page. */
export const SITE_LINKS: NavLink[] = [
  { href: '/#security', label: 'Security', key: 'security' },
  { href: '/#features', label: 'Features', key: 'features' },
  { href: '/blog', label: 'Journal', key: 'journal' },
  { href: '/details', label: 'Guides', key: 'guides' },
];
