import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Link } from '../components/Link';
import { PageShell } from './SiteChrome';
import { useScrollSpy } from './motion';
import { Eyebrow } from './primitives';
import { CtaBand, PageHero, Toc } from './content';

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

export interface GlanceItem {
  icon: LucideIcon;
  title: string;
  text: string;
}

/**
 * Shared layout for legal documents: hero, "at a glance" summary,
 * sticky numbered contents, and the full text in numbered sections.
 */
export function LegalDoc({
  title,
  intro,
  glance,
  sections,
  sectionIds,
  appendix,
  closing,
  pair,
}: {
  title: [string, string];
  intro: string;
  glance: GlanceItem[];
  sections: LegalSection[];
  /** Stable list of section ids (module constant) for the scroll-spy. */
  sectionIds: readonly string[];
  appendix?: ReactNode;
  closing?: string;
  pair: { href: string; label: string };
}) {
  const active = useScrollSpy(sectionIds);
  // Kept as before: the date shown is the day the page is viewed.
  const updated = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <PageShell active="legal">
      <PageHero
        top={<Eyebrow>Legal</Eyebrow>}
        lines={[title[0], { text: title[1], dim: true }]}
        lead={intro}
        meta={
          <>
            <span>Last updated {updated}</span>
            <span>{sections.length} sections</span>
          </>
        }
      />

      <div className="lp-wrap">
        <div data-rv className="glance rv-stagger">
          {glance.map(({ icon: Icon, title: itemTitle, text }, i) => (
            <div key={itemTitle} className="glance-item" style={{ '--i': i } as CSSProperties}>
              <Icon size={20} strokeWidth={1.6} />
              <b>{itemTitle}</b>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <div className="doc">
          <Toc
            title="Contents"
            items={sections.map((s) => ({ id: s.id, label: s.title }))}
            active={active}
            footer={
              <Link href={pair.href} className="lp-link">
                {pair.label} <ArrowRight size={14} />
              </Link>
            }
          />

          <div>
            {sections.map((section, i) => (
              <section key={section.id} id={section.id} className="legal-sec" aria-labelledby={`${section.id}-title`}>
                <span className="legal-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="legal-body">
                  <h2 id={`${section.id}-title`}>{section.title}</h2>
                  {section.body}
                </div>
              </section>
            ))}

            {appendix}
            {closing && <p className="legal-close">{closing}</p>}

            <Link href={pair.href} className="lp-card pair">
              <span>
                <small>Read next</small>
                <b>{pair.label}</b>
              </span>
              <ArrowRight size={22} strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        <CtaBand />
      </div>
    </PageShell>
  );
}
